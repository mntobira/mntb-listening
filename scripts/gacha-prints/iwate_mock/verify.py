# -*- coding: utf-8 -*-
"""岩手大 予想問題の難易度・形式チェック。 python3 verify.py N → logs/verify_rN.json（NG があれば終了コード1）
基準：2024〜2026年度の公式PDF（R6〜R8）。本文の多くは著作権のため非公開（出典のみ）で，公開されているのは 2024年度 大問3 の長文
（594語・平均文長 18.0語・難語率 7.2%）。非公開の長文は紙面の分量（2〜4ページ）と解答例から語数を推定した。
  長文（大問1・説明／和訳中心）550〜950語・平均文長 15〜25語・難語率 3〜14%
  短い英文（大問2 A〜C 各1ページ）120〜380語・平均文長 11〜25語
  英語で書く問題：2024 80語程度・2025 解答例199語・2026 解答例149語 → 模範解答は 指示語数の下限〜上限＋10%
  日本語の解答の字数指定（2024・2026）：解答例は指定字数の 70〜100%"""
import sys, re, json, importlib
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'i{R}').DATA

def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    t = t.replace('’', "'")
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / max(1, len(S)), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / max(1, len(cont)) * 100, 1))
RANGE = {'long': dict(words=(550, 950), avg=(15, 25), zipf_lt4=(3, 14)),
         'short': dict(words=(120, 380), avg=(11, 25), zipf_lt4=(1, 14))}
def judge(kind, d): return {m: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG') for m, (lo, hi) in RANGE[kind].items()}

log, chk = {}, []
for n in ('1', '2', '3'):
    P = D[n]
    for i, ps in enumerate(P['passages']):
        if not ps.get('paras'): continue
        d = stats(render.filled(P, i))
        d['kind'] = 'long' if len(P['passages']) == 1 else 'short'
        d['range'] = judge(d['kind'], d); log[f'{n}-{ps.get("label") or i}'] = d
    for q in P['questions']:
        if q['kind'] == 'free':
            for a in [q['answer']] + q.get('alts', []):
                if q.get('limit'):
                    lo = int(q['limit'] * .7)
                    chk.append((n, q['no'], len(a), f'{lo}-{q["limit"]}字', 'OK' if lo <= len(a) <= q['limit'] else 'NG'))
                else:
                    chk.append((n, q['no'], len(a), '25-200字', 'OK' if 25 <= len(a) <= 200 else 'NG'))
        elif q['kind'] == 'write':
            m = re.findall(r'\d+', q['limit']); lo, hi = int(m[0]), int(m[-1])
            if lo == hi: lo, hi = round(lo * .9), hi   # 「80語程度」→ 72〜88語（上限は下で +10%）
            for lab, mdl in q['models']:
                w = wc(re.sub(r'\(\d+ words\)', '', mdl))
                chk.append((n, f'write-{lab}', w, f'{lo}-{round(hi * 1.1)}語', 'OK' if lo <= w <= round(hi * 1.1) else 'NG'))
        elif q['kind'] == 'mcset':
            k = len(q['items']); chk.append((n, q['no'], k, '5問（内容不一致は1問）', 'OK' if k in (1, 5) else 'NG'))
log['lengths'] = chk
ng = [k for k, v in log.items() if isinstance(v, dict) and any('NG' in x for x in v['range'].values())]
ng += [c for c in chk if c[-1] == 'NG']
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
