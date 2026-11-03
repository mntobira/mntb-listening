# -*- coding: utf-8 -*-
"""東北大 予想問題の難易度・形式チェック。 python3 verify.py N → logs/verify_rN.json（NG があれば終了コード1）
基準：Ⅰ・Ⅱの語数は 2024〜2026年度の公表語数（予備校分析：約910〜1320語）。公式PDFでは長文本文が非公開のため，
平均文長・難語率（zipf<4）は北大 2022〜2026年度の長文（OCR）を国立大の目安として使う。
Ⅲ（会話文）は 2025・2026年度の公式PDF（会話文は公開）から実測した値と 2024年度の公表語数。意見論述は 60〜80語。"""
import sys, re, json, importlib, os
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
import render
REF = json.load(open(ROOT / '.tmpwork/tohoku_ref/analysis/stats.json'))
HREF = json.load(open(ROOT / '.tmpwork/hokudai_ref/analysis/stats.json'))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f't{R}').DATA

def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    t = t.replace('’', "'")
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / len(S), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / len(cont) * 100, 1),
                zipf_lt3=round(sum(z(w, 'en') < 3 for w in cont) / len(cont) * 100, 1))

rw = REF['reported_words']
RC_WORDS = [rw[y][k] for y in ('2024', '2025', '2026') for k in ('I', 'II')]
H_RC = [HREF[f'{y}-{k}'] for y in range(2022, 2027) for k in ('1', '2')]
RANGE = {
 'RC': {'words': (round(min(RC_WORDS) * .97), round(max(RC_WORDS) * 1.03)),
        'avg': (round(min(h['avg'] for h in H_RC) * .95, 1), round(max(h['avg'] for h in H_RC) * 1.05, 1)),
        'zipf_lt4': (round(min(h['zipf_lt4'] for h in H_RC) * .9, 1), round(max(h['zipf_lt4'] for h in H_RC) * 1.1, 1))},
 'III': {'words': (round(rw['2024']['III'] * .97), round(max(REF['2025-III']['words'], REF['2026-III']['words']) * 1.03)),
         'avg': (round(min(REF[f'{y}-III']['avg'] for y in ('2025', '2026')) * .9, 1), round(max(REF[f'{y}-III']['avg'] for y in ('2025', '2026')) * 1.1, 1)),
         'zipf_lt4': (round(min(REF[f'{y}-III']['zipf_lt4'] for y in ('2025', '2026')) * .85, 1), round(max(REF[f'{y}-III']['zipf_lt4'] for y in ('2025', '2026')) * 1.15, 1))},
}
def judge(kind, d):
    return {m: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG') for m, (lo, hi) in RANGE[kind].items()}

log = {}
for n in ('I', 'II'):
    d = stats(' '.join(render.filled(D[n]))); d['range'] = judge('RC', d); log[n] = d
conv = ' '.join(re.sub(r'\{w\d\|([^}]*)\}', r'\1', t) for _, t in D['III']['lines'])
d = stats(conv); d['range'] = judge('III', d); log['III'] = d
tot = log['I']['words'] + log['II']['words']
log['I+II'] = dict(words=tot, range=f'1960–2510:' + ('OK' if 1960 <= tot <= 2510 else 'NG'))  # 2023〜2026年度 約2040〜2450語

chk = []
for lab, m in D['III']['q2']['models']:
    chk.append(('III', '2)', 'en', wc(m), '60-80', 'OK' if 62 <= wc(m) <= 80 else 'NG'))
for n in ('I', 'II'):
    for q in D[n]['questions']:
        if q['kind'] in ('ja_free', 'trans'):
            for a in [q['answer']] + q.get('alts', []):
                chk.append((n, q['no'], 'ja', len(a), '40-160', 'OK' if 40 <= len(a) <= 160 else 'NG'))
ja = sum(len(re.sub(r'\{u\d\|([^}]*)\}', r'\1', p)) for p in D['IV']['passage'])
chk.append(('IV', 'passage', 'ja', ja, '250-520', 'OK' if 250 <= ja <= 520 else 'NG'))
# 設問構成（2024〜2026年度：Ⅰ5〜8問・Ⅱ5〜6問，Ⅳは和文英訳1＋整序2）
for n, (lo, hi) in (('I', (5, 8)), ('II', (5, 6))):
    k = len(D[n]['questions']); chk.append((n, 'n_questions', 'q', k, f'{lo}-{hi}', 'OK' if lo <= k <= hi else 'NG'))
kinds = [q['kind'] for q in D['IV']['questions']]
chk.append(('IV', 'kinds', 'q', '/'.join(kinds), 'trans_en+order_en×2', 'OK' if sorted(kinds) == ['order_en', 'order_en', 'trans_en'] else 'NG'))
log['lengths'] = chk
ng = [k for k, v in log.items() if isinstance(v, dict) and isinstance(v.get('range'), dict) and any('NG' in x for x in v['range'].values())]
ng += ['I+II'] if 'NG' in log['I+II']['range'] else []
ng += [c for c in chk if c[-1] == 'NG']
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
