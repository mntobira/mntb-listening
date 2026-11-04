# -*- coding: utf-8 -*-
"""山形大 予想問題の難易度・形式チェック。 python3 verify.py N → logs/verify_rN.json（NG があれば終了コード1）
基準：2024〜2026年度の公式PDF（R6〜R8）。英文の本文は著作権のため非公開（出典のみ）で，公開されているのは設問・語注・解答例・出題の意図。
  英文：毎年2本（2024・2025 は大問Ⅰ・Ⅱに1本ずつ，2026 は1つの大問に新聞記事2本）。紙面は各2ページ分 → 1本 550〜900語と推定
        （予備校の分析でも1本800語前後）。平均文長 14〜25語・難語率 3〜14%（新聞・エッセイの文体）。
  設問：大問ごとに4〜10問。日本語の説明は 50〜60字・55〜65字・60〜70字・80〜90字の字数指定 → 解答例は指定の範囲内。
  英作文：40〜50語（2024）→ 55〜65語（2025）→ at least 100 words（2026）。解答例は指定の範囲内（at least 100 は 100〜150語）。
"""
import sys, re, json, importlib
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'y{R}').DATA

def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    t = t.replace('’', "'")
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / max(1, len(S)), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / max(1, len(cont)) * 100, 1))
RANGE = dict(words=(550, 900), avg=(14, 25), zipf_lt4=(3, 14))

def fill(P, paras):
    bl = {k: v for q in P['questions'] if q['kind'] == 'blank' for k, v in q['answers'].items()}
    od = {tuple(sorted(w.strip() for w in q['words'])): q['answer'] for q in P['questions'] if q['kind'] == 'order'}
    out = []
    for p in paras:
        p = re.sub(r'\[\[([a-e])\]\]', lambda m: bl.get(m.group(1), ' '), p)
        p = re.sub(r'\{o\|([^}]*)\}', lambda m: od.get(tuple(sorted(w.strip() for w in m.group(1).split('/'))), ' '), p)
        out.append(render.plain(p))
    return ' '.join(out)

log, ng = {}, []
for n in D['points']:
    P = D[n]
    for ps in P['passages']:
        d = stats(fill(P, ps['paras'])); d['paras'] = len(ps['paras'])
        d['range'] = {m: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG') for m, (lo, hi) in RANGE.items()}
        log[f'{n}-{ps["headline"][:24]}'] = d
        if any('NG' in v for v in d['range'].values()): ng.append((n, ps['headline'][:24]))
    k = len(P['questions'])
    log[f'{n}-questions'] = k
    if not 4 <= k <= 10: ng.append((n, 'question_count', k))
    for q in P['questions']:
        if q['kind'] == 'explain':
            for a in [q['answer']] + q.get('alts', []):
                ok = q['lo'] <= len(a) <= q['hi']
                log[f'{n}-Q{q["no"]}-{len(a)}字'] = f'{q["lo"]}〜{q["hi"]}字:' + ('OK' if ok else 'NG')
                if not ok: ng.append((n, q['no'], len(a)))
        elif q['kind'] == 'trans':
            for a in [q['answer']] + q.get('alts', []):
                if not 15 <= len(a) <= 250: ng.append((n, q['no'], 'trans_len', len(a)))
        elif q['kind'] == 'write':
            m = [int(x) for x in re.findall(r'\d+', q['limit'])]
            lo, hi = (m[0], m[-1]) if len(m) >= 2 else (m[0], round(m[0] * 1.5))
            ws = [wc(re.sub(r'\(\d+ words\)', '', md)) for _, md in q['models']]
            log[f'{n}-Q{q["no"]}-write'] = dict(models=ws, range=f'{lo}〜{hi}語')
            for w in ws:
                if not lo <= w <= hi: ng.append((n, q['no'], 'write_words', w))
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
