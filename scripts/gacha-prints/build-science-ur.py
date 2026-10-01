#!/usr/bin/env python3
"""
UR 学習プリント（化学 無機・数学 総まとめ・高校入試 理科 3冊）を作り直す（2026-10-01）。

  入力 : .tmpwork/science-raw.json（npx tsx scripts/gacha-prints/dump-science.mts）
  出力 : public/prints/{print_c_inorganic, print_math_basic_all, print_rika_1, print_rika_2, print_rika_3}.pdf と thumbs

■ 以前の版の問題点
  ・解説が全問「正解は『〜』。」の1行だけ
  ・正解の位置が偏っていた（無機は50問中46問が①）
  ・理科は「❷ 細い線と小さな点で［？］書く」のように、前の文が無いと意味が通らない問題が混ざっていた
■ この版
  ・問題・選択肢・解説の文章はアプリのデータのまま（機械で作文しない）。並べ替えるのは選択肢の順番だけ
  ・無機：アプリの解説のうち、その小問の段落と解き方の手順をそのまま載せる
  ・数学：アプリの解説＋単元の要点（授業の文）と注意
  ・理科：原典の文（答えを入れた完成文）・同じ節の前後の文・ほかの選択肢がどの語の答えか・実際に出た年度
"""
import json, re, sys, collections
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import ur_common as U

ROOT = Path(__file__).resolve().parents[2]
RAW = json.loads((ROOT / '.tmpwork/science-raw.json').read_text())
P = ROOT / 'public/prints'

def out(name):
    return P / f'{name}.pdf', P / 'thumbs' / f'{name}.webp'

def spread(groups, total):
    """単元ごとのリストから、単元が偏らないよう順番に1つずつ取って total 個にする"""
    picked, keys = [], list(groups)
    idx = {k: 0 for k in keys}
    while len(picked) < total:
        moved = False
        for k in keys:
            if len(picked) >= total:
                break
            if idx[k] < len(groups[k]):
                picked.append(groups[k][idx[k]]); idx[k] += 1; moved = True
        if not moved:
            break
    order = {k: i for i, k in enumerate(keys)}
    return sorted(picked, key=lambda it: (order[it['unit']], it.get('_o', 0)))

# ====================================================================== 無機
def build_inorganic():
    def segs(ex):
        parts = re.split(r'\n(?=（\d+）)', ex)
        res = {}
        for p in parts[1:]:
            m = re.match(r'((?:（[^）]+）)+)', p)
            res.setdefault(m.group(1), p.strip())
        return parts[0].strip(), res
    groups = collections.OrderedDict()
    o = 0
    for p in RAW['inorganic']:
        unit = p['category'].split(' (')[0].strip()
        if unit == '無機化学':
            unit = '無機化学 総合'
        intro, S = segs(p['explanation'])
        lines = p['text'].split('\n')
        for s in p['subQuestions']:
            if s['type'] != 'multiple_choice' or len(s.get('options', [])) != 4:
                continue
            key = re.match(r'((?:（[^）]+）)+)', s['label']).group(1)
            num = re.match(r'（\d+）', key).group(0)
            sub = key[len(num):]
            seg = S.get(key) or next((v for k, v in S.items() if k.startswith(num)), '')
            qline = next((l.strip() for l in lines if l.strip().startswith(num)), '')
            same_num = sum(1 for x in p['subQuestions'] if x['label'].startswith(num))
            if same_num > 1 and not sub:  # 1つの設問に小問が複数ある（例：AgCl・AgBr・AgI の色）→ 小問のラベルで聞く
                stem = re.sub(r'^（\d+）\s*', '', s['label']) + 'として最も適切なものはどれか。'
            elif sub:  # （1）（ア）の空欄 → 本文の、その空欄を含む文を問題文にする
                mark = sub.strip('（）')
                sent = next((x + '。' for x in re.split(r'。', p['text']) if re.search(rf'（\s*{mark}\s*）', x)), '')
                sent = re.sub(r'^.*?\n\n', '', sent.strip()) if '\n\n' in sent else sent.strip()
                stem = f'{sent}\n空欄（{mark}）に当てはまるものはどれか。'
            elif qline:
                stem = re.sub(r'^（\d+）\s*', '', qline)
            else:
                stem = re.sub(r'^（\d+）\s*', '', s['label'])
            if '記述' in stem and '正誤' not in stem:
                pass
            if re.search(r'という記述$', s['label']):
                stem = re.sub(r'^（\d+）\s*', '', s['label']) + 'は正しいか。正誤と理由として最も適切なものを選べ。'
            elif re.search(r'すべて答え|それぞれ答え', stem):
                stem = re.sub(r'^（\d+）\s*', '', s['label']) + 'として最も適切なものはどれか。'
            elif stem.endswith('答えよ。') or stem.endswith('求めよ。') or stem.endswith('並べよ。'):
                stem = stem[:-1] + '（最も適切なものを選べ）。'
            lead = re.split(r'\n\s*（1）', p['text'])[0]
            lead = re.sub(r'^演習\d+[\s　]*', '', lead).strip()
            paras = [x.strip() for x in lead.split('\n\n') if x.strip()]
            if paras and re.match(r'^次の文章を読んで', paras[0]):
                paras = paras[1:]
            elif paras:
                paras[0] = re.sub(r'、?次の問いに答えよ。$', '。', paras[0]).replace('について。', 'について')
            lead = '\n'.join(paras)
            # 「（3）で」「（1）の反応」のような前の小問の参照は、その小問の文に置きかえる
            def ref(m):
                q = next((l.strip() for l in lines if l.strip().startswith(m.group(1))), '')
                q = re.sub(r'^（\d+）\s*', '', q).rstrip('。')
                q = re.sub(r'(を書け|を答えよ|を求めよ|を説明せよ)$', '', q)
                return f'「{q}」' + m.group(2) if q else m.group(0)
            stem = re.sub(r'(（\d+）)(で|の)', ref, stem)
            needs = bool(lead)  # 大問の本文がある問題は、最初の1問に本文を付ける
            if sub:
                stem = f'空欄（{sub.strip("（）")}）に当てはまるものはどれか。'
            seg_lines = [l for l in seg.split('\n') if l.strip()]
            body = '\n'.join(seg_lines[1:]) if len(seg_lines) > 1 else ''
            explain = []
            if seg_lines:
                head = re.sub(r'^(?:（[^）]+）)+\s*', '', seg_lines[0])
                if head.strip() != s['correctAnswer'].strip():
                    explain.append(('答え', head))
            if body:
                explain.append(('解説', body))
            de = s.get('detailedExplanation')
            if isinstance(de, dict) and de.get('steps'):
                explain.append(('解き方', '　'.join(de['steps'])))
            elif isinstance(de, str) and de.strip():
                explain.append(('くわしく', de.strip()))
            tags = [f'想定正答率{s["correctAnswerRate"]}%'] if s.get('correctAnswerRate') else []
            o += 1
            groups.setdefault(unit, []).append({'unit': unit, 'stem': stem, 'choices': list(s['options']),
                                                'answer': s['options'].index(s['correctAnswer']), 'tags': tags, 'explain': explain, '_o': o,
                                                '_intro': intro, '_pid': p['id'], '_lead': lead if needs else ''})
    items = spread(groups, 50)
    # 文脈が要る問題には、元の大問の本文を付ける（同じ大問が続くときは2問目から「前の問と同じ文章」）
    prev = None
    for it in items:
        if it['_lead']:
            if prev == it['_pid']:
                it['stem'] = '（前の問と同じ文章について）\n' + it['stem']
            else:
                it['stem'] = '〔文章〕' + it['_lead'] + '\n' + it['stem']
        prev = it['_pid']
    notes = {}
    for it in items:
        if it['_intro'] and it['unit'] not in notes:
            notes[it['unit']] = [('', it['_intro'])]
    pdf, th = out('print_c_inorganic')
    items, pages = U.build_print(out=pdf, thumb=th, title='化学 無機化学\n分野別 演習50題', eyebrow='INORGANIC 50 ／ UR PRINT',
        subtitle=f'周期表・非金属・金属・遷移元素・イオン分析まで{len(groups)}単元。\nアプリの無機化学と同じ問題を、1問ずつ理由まで解説。',
        footer='マナトビ 学習プリント ／ 化学 無機化学（アプリの無機化学の演習と同じ問題・同じ解説）', items=items, seed=20261002,
        howto=['① 単元ごとに解く。1問1分が目安。答えは解答用紙へ。',
               '② 「解説」は、まちがえた選択肢がなぜ違うかまで読む。色・沈殿・製法はセットで覚え直す。',
               '③ 単元別の自己採点表で7割未満の単元に★。★の単元は、アプリの無機化学で同じ演習をもう一度。',
               '④ 3日後に×の問題だけ解き直す。2回続けて○なら卒業。'],
        stats=[('50問', '4択・全問解説'), (f'{len(groups)}単元', '非金属〜遷移元素'), ('約50分', '1問1分'), ('正解は①〜④に均等', '勘では取れない')],
        unit_notes=notes)
    return 'print_c_inorganic', items, pages

# ====================================================================== 数学
def build_math():
    groups = collections.OrderedDict()
    notes = {}
    o = 0
    for u in RAW['math']:
        unit = f'{u["course"]}　{u["title"]}'
        notes[unit] = [('要点', l) for l in u['lesson']] + ([('注意', u['caution'])] if u.get('caution') else [])
        for e in u['exercises']:
            if not e.get('wrong'):
                continue
            choices = [e['answer'], *e['wrong']]
            o += 1
            groups.setdefault(unit, []).append({'unit': unit, 'stem': e['prompt'], 'choices': choices, 'answer': 0,
                                                'tags': [u['course']], 'explain': [('解説', e['explanation'])], '_o': o})
    total = sum(len(v) for v in groups.values())
    items = spread(groups, total)
    pdf, th = out('print_math_basic_all')
    items, pages = U.build_print(out=pdf, thumb=th, title=f'数学Ⅰ・A・Ⅱ・B・Ⅲ・C\n基礎〜標準 総まとめ{total}題', eyebrow='MATH ALL ／ UR PRINT',
        subtitle=f'学習指導要領の6科目・{len(groups)}単元を、1単元3問で総点検。\n全問に解説と、単元ごとの要点・注意つき。',
        footer='マナトビ 学習プリント ／ 数学（アプリの数学の単元演習と同じ問題・同じ解説）', items=items, seed=20261003,
        howto=['① 1単元3問。途中式は余白に書く。1問2分が目安。',
               '② 解答・解説を読み、×の問題は単元の「要点」と「注意」も読む。',
               '③ 自己採点表で2問以上×の単元に★。★の単元から、アプリの数学で同じ単元を復習。',
               '④ 1週間後に×の問題だけもう一度。'],
        stats=[(f'{total}問', '4択・全問解説'), (f'{len(groups)}単元', '数Ⅰ〜数C'), (f'約{total * 2 // 60}時間', '1問2分'), ('正解は①〜④に均等', '勘では取れない')],
        unit_notes=notes, minutes_per_q=2)
    return 'print_math_basic_all', items, pages

# ====================================================================== 理科
BLANK = re.compile(r'［\s*？\s*］')
LEAD = re.compile(r'^[❶-❿➀-➉①-⑳→・\s　]+')

def rika_pool():
    items = RAW['rika']['items']
    by_ch = collections.defaultdict(list)
    for it in items:
        by_ch[it['chapterId']].append(it)
    # 原典の文（ブロック）: 章ごとに順番どおり
    blocks = {}
    for ch in RAW['rika']['summary']:
        seq = []
        for s in ch['sections']:
            for b in s['blocks']:
                if b['t'] == 'p' and b['text'].strip():
                    seq.append(b['text'].strip())
                elif b['t'] == 'table':
                    seq += ['：'.join(r) for r in b['rows']]
        blocks[ch['id']] = seq
    return items, by_ch, blocks

def rika_items(fields, total, seed_unit_order=None):
    items, by_ch, blocks = rika_pool()
    groups = collections.OrderedDict()
    seen_ans, seen_sent = set(), set()
    o = 0
    cand = [it for it in items if it['field'] in fields and BLANK.search(it['prompt'])]
    # 実際に出た語 → 長めで文脈のある文 の順に優先
    cand.sort(key=lambda it: (it['chapterId'], 0 if it['examYears'] else 1, -min(len(it['prompt']), 60)))
    for it in cand:
        prompt = it['prompt']
        if len(BLANK.sub('', prompt)) < 10:
            continue
        if any(len(op) < 1 or op.endswith('、') or op in ('なく、',) for op in it['options']):
            continue
        if re.match(r'^\s*例[）)]', LEAD.sub('', prompt)) or len(re.sub(r'[\W\d０-９＋－]', '', BLANK.sub('', prompt))) < 8:
            continue
        if len(BLANK.findall(prompt)) != 1 or any('例題' in op or len(op) > 18 for op in it['options']):
            continue
        if it['answer'] in seen_ans:
            continue
        full = BLANK.sub(it['answer'], prompt)
        sent_key = re.sub(r'\W', '', LEAD.sub('', full))[:16]
        if sent_key in seen_sent:
            continue
        seen_ans.add(it['answer']); seen_sent.add(sent_key)
        stem_txt = LEAD.sub('', prompt)
        sec = re.sub(r'[（(].*?[）)]', '', it['section']).split('※')[0].split('←')[0]
        sec = re.sub(r'\s+[ａ-ｚa-z]$', '', sec.strip()).strip(' ～〜')
        stem = f'【{sec}】 {stem_txt}' if sec else stem_txt
        stem = BLANK.sub('（？）', stem)
        # 原典の前後の文
        seq = blocks.get(it['chapterId'], [])
        key = LEAD.sub('', full)[:18]
        pos = next((k for k, t in enumerate(seq) if key and key in t), None)
        around = []
        if pos is not None:
            for k in range(max(0, pos - 1), min(len(seq), pos + 3)):
                t = seq[k]
                if k != pos and (len(t) < 6 or t.startswith(('①', '➀', '➁', '➂', '➃'))):
                    continue
                around.append(('▶ ' if k == pos else '　') + t)
        # ほかの選択肢は、同じ章でどの文の答えか
        others = []
        for op in it['options']:
            if op == it['answer']:
                continue
            m = next((x for x in by_ch[it['chapterId']] if x['answer'] == op and BLANK.search(x['prompt'])), None)
            if m:
                others.append(f'「{op}」… {LEAD.sub("", BLANK.sub(op, m["prompt"]))[:70]}')
            else:
                others.append(f'「{op}」… この節では答えにならない語')
        explain = [('完成文', LEAD.sub('', full))]
        if len(around) > 1:
            explain.append(('原典の前後', '\n'.join(around)))
        if others:
            explain.append(('ほかの選択肢', '\n'.join(others)))
        tags = []
        if it['examYears']:
            tags.append('三重県 ' + '・'.join(y.replace('年度', '') for y in it['examYears']) + '年度に出題')
        o += 1
        unit = it['chapter']
        groups.setdefault(unit, []).append({'unit': unit, 'stem': stem, 'choices': list(it['options']),
                                            'answer': it['options'].index(it['answer']), 'tags': tags, 'explain': explain, '_o': o})
    return spread(groups, total), groups

def rika_notes(units):
    notes = {}
    for ch in RAW['rika']['summary']:
        if ch['name'] not in units:
            continue
        kws, memo = [], []
        for s in ch['sections']:
            for k in s['keywords']:
                if k not in kws and len(k) <= 14:
                    kws.append(k)
            if s['memo'] and s['head']:
                memo.append(f'{s["head"]}：{s["memo"]}' + (f'（出題可能性{"★" * s["stars"]}）' if s['stars'] else ''))
        notes[ch['name']] = ([('覚える語', '・'.join(kws[:40]))] if kws else []) + [('', m) for m in memo[:4]]
    return notes

def build_rika(name, label, fields, eyebrow, seed):
    items, groups = rika_items(fields, 60)
    units = {it['unit'] for it in items}
    pdf, th = out(name)
    items, pages = U.build_print(out=pdf, thumb=th, title=f'高校入試 理科 {label}\n最終チェック60題', eyebrow=eyebrow,
        subtitle='三重県 後期選抜の最終プリント（原典）の文から60題。\n答えを入れた完成文と、原典の前後の文・ほかの選択肢の意味まで解説。',
        footer='マナトビ 学習プリント ／ 高校入試 理科（アプリの理科と同じ問題・原典 三重県後期選抜入試対策理科最終プリント）', items=items, seed=seed,
        howto=['① 1問30秒が目安。【 】は原典の節の名前（どの単元の話か）。',
               '② 解説の「完成文」を声に出して読む。×の問題は「原典の前後」の文まで読む。',
               '③ 「ほかの選択肢」は、その語が答えになる文。4つまとめて覚えると取りこぼしが減る。',
               '④ ［令和◯年度に出題］の問題は、実際に入試で答えになった語。最優先で覚える。'],
        stats=[('60問', '4択・全問解説'), (f'{len(units)}単元', label), ('約30分', '1問30秒'), ('正解は①〜④に均等', '勘では取れない')],
        unit_notes=rika_notes(units), minutes_per_q=0.5)
    return name, items, pages

if __name__ == '__main__':
    only = sys.argv[1:]
    jobs = {
        'inorganic': build_inorganic,
        'math': build_math,
        'rika1': lambda: build_rika('print_rika_1', '生物編', {'生物'}, 'BIOLOGY 60 ／ UR PRINT', 20261004),
        'rika2': lambda: build_rika('print_rika_2', '物理編', {'物理'}, 'PHYSICS 60 ／ UR PRINT', 20261005),
        'rika3': lambda: build_rika('print_rika_3', '化学・地学編', {'化学', '地学'}, 'CHEM & EARTH 60 ／ UR PRINT', 20261006),
    }
    for k, fn in jobs.items():
        if only and k not in only:
            continue
        name, items, pages = fn()
        dist = collections.Counter(U.MARKS[it['answer']] for it in items)
        kb = (P / f'{name}.pdf').stat().st_size / 1024
        print(f'{name}: {len(items)}問 {pages}ページ {kb:.0f}KB 正解位置 {dict(sorted(dist.items()))}')
