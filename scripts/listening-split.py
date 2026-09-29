#!/usr/bin/env python3
"""
===================================================================
まとめ録りのリスニング音声を「1問＝1ファイル」に切り出す道具
===================================================================

■ いつ使う？
  利用者が ElevenLabs などで何問ぶんかを 1 本の音声にまとめて録って送ってきたとき。
  （1問ずつの音声なら不要。そのまま listening-audio.mts import に渡す）

■ 流れ（旧音源と混ぜないための決まった順番）
  1) 原本を受領保存   npx tsx scripts/listening-audio.mts receive <原本…> --batch <名前> --apply
  2) 文字起こし       音声認識（単語ごとの時刻つき JSON: {"words":[{"start","end","text"}]}）を用意
  3) 切り出し（これ） python3 scripts/listening-split.py --batch <名前> \
                          --plan 原本.mp3=words.json=el1A_set3_q1,el1A_set3_q2,… [--plan …] \
                          --out .tmpwork/<名前>/stage
     → stage/<stem>.mp3（原本のまま無劣化で切り出し）と
       audio_sources/commercial/<名前>/receipt/split_manifest.json（どこで切ったか・一致度）
  3'') 設問文（Question. …）まで読み上げている録音は、読んだとおりの台本を --scripts x.json で渡す
        （渡さないと設問文の前後どちらで切るかがぶれる）
  3') 取り直しが届いたら、その原本だけ --merge で切り出す（同じ --out に上書き・記録は追記）
  4) 下見と取り込み   npx tsx scripts/listening-audio.mts import <stage> → 問題なければ --apply --batch <名前> …

■ 切り方
  - 台本（問題データ）の文と音声認識の単語を突き合わせ、どの時刻がどの問題かを決める。
    数字は英語表記に直して比べる（$200 → two hundred dollars など）。
  - 切る位置は、文と文のあいだの無音（ffmpeg silencedetect）の中央。無音が見つからなければ
    細かい設定で探し直し、それでもなければ「要確認」として止める（勝手に真ん中で切らない）。
  - 速度・音程は変えない。mp3 はストリームコピー（再エンコードしない）。
  - 台本との一致度が 0.9 未満の問題があると止める（--force で続行）。
"""
import argparse, difflib, hashlib, json, os, re, subprocess, sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety'}
ORD = {'1': 'first', '2': 'second', '3': 'third', '5': 'fifth', '8': 'eighth', '9': 'ninth', '12': 'twelfth', '15': 'fifteenth', '20': 'twentieth'}


def num2w(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000: return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + num2w(n % 100))
    if n < 10000 and n % 1000 == 0: return ONES[n // 1000] + ' thousand'
    return str(n)


def norm(s):
    s = s.lower().replace('-', ' ').replace('%', ' percent').replace("o'clock", '')
    s = re.sub(r'(\d+):00', lambda m: m.group(1), s)
    s = re.sub(r'\$(\d+)', lambda m: num2w(m.group(1)) + ' dollars', s)
    s = re.sub(r'(\d+)(st|nd|rd|th)\b', lambda m: ORD.get(m.group(1), num2w(m.group(1)) + 'th'), s)
    s = re.sub(r'\d+', lambda m: num2w(m.group(0)), s)
    s = s.replace('one hundred fifty', 'one fifty').replace('café', 'cafe')
    return re.sub(r'[^a-z ]', '', re.sub(r'\s+', ' ', s)).strip()


def silences(path, noise, dur):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', f'silencedetect=noise={noise}dB:d={dur}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
    return list(zip(st, en))


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def load_scripts():
    """問題データ（src/data）から stem → 台本 を取り出す（tsx で TS を読む）"""
    code = ("import {getAllListeningChapters} from './src/data/englishListeningData';"
            "const o:Record<string,string>={};for(const c of getAllListeningChapters())for(const p of c.practiceProblems as any[])"
            "for(const t of p.audioTracks??[])if(t.audioUrl)o[t.audioUrl.split('/').pop().replace('.mp3','')]=t.turns?.length?t.turns.map((x:any)=>x.text).join(' '):t.script;"
            "console.log(JSON.stringify(o));")
    out = subprocess.check_output(['npx', 'tsx', '-e', code], cwd=ROOT, text=True)
    data = json.loads(out.strip().splitlines()[-1])
    # 第4問B などの台本は「話者1: …」の見出しつき。見出しは読まないので照合から外す
    return {k: re.sub(r'話者\d+\s*[:：]', ' ', v or '') for k, v in data.items()}


def plan_cuts(path, words, stems, scripts):
    toks = [(t, w['start'], w['end']) for w in words for t in norm(w['text']).split()]
    exp, bounds = [], []
    for s in stems:
        e = norm(scripts[s]).split()
        bounds.append((len(exp), len(exp) + len(e)))
        exp += e
    sm = difflib.SequenceMatcher(None, [t[0] for t in toks], exp, autojunk=False)
    mp = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): mp[b + k] = a + k
    segs = []
    for s, (b0, b1) in zip(stems, bounds):
        hit = [mp[k] for k in range(b0, b1) if k in mp]
        segs.append(dict(stem=s, cover=round(len(hit) / max(1, b1 - b0), 3),
                         firstWordStart=toks[min(hit)][1] if hit else None, lastWordEnd=toks[max(hit)][2] if hit else None))
    total = duration(path)
    cuts, warn = [0.0], []
    for i in range(len(segs) - 1):
        a, b = segs[i]['lastWordEnd'], segs[i + 1]['firstWordStart']
        if a is None or b is None:
            warn.append(f"{segs[i]['stem']}: 台本と一致する単語が見つからない"); cuts.append(None); continue
        best = None
        # 音声認識の単語時刻は 0.5〜2 秒ほどずれることがあるので、段階的に探す
        # （最後は「0.6秒以上の長い無音」を ±2.5 秒で探す。まとめ録りの回と回の境目はふつう長い間がある）
        for noise, d, margin in ((-40, 0.25, 0.35), (-40, 0.12, 0.8), (-35, 0.10, 1.0), (-40, 0.6, 2.5)):
            for s0, s1 in silences(path, noise, d):
                c = (s0 + s1) / 2
                if min(a, b) - margin <= c <= max(a, b) + margin and (not best or s1 - s0 > best[0]):
                    best = (s1 - s0, c, s0, s1)
            if best: break
        if not best:
            warn.append(f"{segs[i]['stem']} と {segs[i + 1]['stem']} のあいだに無音が見つからない（手で確認）")
            cuts.append(round((a + b) / 2, 3))
        else:
            cuts.append(round(best[1], 3))
        segs[i]['silence'] = [round(best[2], 3), round(best[3], 3)] if best else None
    cuts.append(total)
    for i, g in enumerate(segs):
        g['start'], g['end'] = cuts[i], cuts[i + 1]
        if g['cover'] < 0.9: warn.append(f"{g['stem']}: 台本との一致度 {g['cover']}")
    return total, segs, warn


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--batch', required=True)
    ap.add_argument('--plan', action='append', required=True, help='原本=words.json=stem1,stem2,…（話している順）')
    ap.add_argument('--out', required=True)
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--scripts', help='台本の上書き JSON {stem: 読み上げた全文}。第2問のように設問文まで読み上げた録音や、まだアプリに音源欄が無い問を切るとき')
    ap.add_argument('--merge', action='store_true', help='既存の split_manifest.json に追記する（取り直し分で一部の問だけ差し替えるとき）')
    a = ap.parse_args()
    scripts = load_scripts()
    if a.scripts:
        scripts.update(json.load(open(a.scripts)))
    os.makedirs(a.out, exist_ok=True)
    manifest = dict(batch=a.batch, createdAtUtc=datetime.now(timezone.utc).isoformat(),
                    method='台本と音声認識の単語を突き合わせ、文間の無音の中央で切断。速度・音程は無変更。mp3 はストリームコピー。',
                    sources=[])
    all_warn = []
    for p in a.plan:
        src, wjson, stems = p.split('=')
        stems = stems.split(',')
        unknown = [s for s in stems if s not in scripts]
        if unknown: sys.exit(f'問題データにない stem: {unknown}')
        words = json.load(open(wjson))['words']
        total, segs, warn = plan_cuts(src, words, stems, scripts)
        all_warn += warn
        manifest['sources'].append(dict(file=os.path.basename(src), sha256=sha(src), durationSec=round(total, 3), tracks=segs))
    if all_warn and not a.force:
        print('要確認:'); [print('  - ' + w) for w in all_warn]
        sys.exit('止めました（確認後 --force で続行）')
    for p, s in zip(a.plan, manifest['sources']):
        src = p.split('=')[0]
        ext = os.path.splitext(src)[1].lower()
        codec = ['-c:a', 'copy'] if ext == '.mp3' else ['-c:a', 'flac']
        for g in s['tracks']:
            out = os.path.join(a.out, g['stem'] + ('.mp3' if ext == '.mp3' else '.flac'))
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-ss', f"{g['start']:.3f}", '-to', f"{g['end']:.3f}", *codec, out], check=True)
            g['output'] = os.path.basename(out)
    rdir = os.path.join(ROOT, 'audio_sources/commercial', a.batch, 'receipt')
    os.makedirs(rdir, exist_ok=True)
    mpath = os.path.join(rdir, 'split_manifest.json')
    if a.merge and os.path.exists(mpath):
        # 取り直し：新しい原本から切った問は、古い原本の同じ問より優先する（古い側に supersededBy を残す）
        prev = json.load(open(mpath))
        new_stems = {g['stem']: s['file'] for s in manifest['sources'] for g in s['tracks']}
        keep = [s for s in prev.get('sources', []) if s['sha256'] not in {x['sha256'] for x in manifest['sources']}]
        for s in keep:
            for g in s['tracks']:
                if g['stem'] in new_stems:
                    g['supersededBy'] = new_stems[g['stem']]
        manifest['sources'] = keep + manifest['sources']
        manifest['history'] = prev.get('history', []) + [prev.get('createdAtUtc')]
    json.dump(manifest, open(mpath, 'w'), ensure_ascii=False, indent=1)
    n = sum(len(s['tracks']) for s in manifest['sources'])
    print(f'{n} 本を {a.out} に切り出しました。記録: audio_sources/commercial/{a.batch}/receipt/split_manifest.json')
    print(f'次に: npx tsx scripts/listening-audio.mts import {a.out}')


if __name__ == '__main__':
    main()
