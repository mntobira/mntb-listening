# -*- coding: utf-8 -*-
"""弘前大 予想問題の難易度・形式チェック。 python3 verify.py N → logs/verify_rN.json（NG があれば終了コード1）
基準：2024〜2026年度の公式PDF（R6〜R8，一部黒塗り）から実測した値（.tmpwork/hirosaki_ref/analysis/stats.json）。
黒塗りで本文の一部しか見えない長文・会話文は，見えている部分の平均文長・難語率（zipf<4）と，紙面の分量からの推定語数を使う。
  reading 600〜800語／平均文長 18〜27語／難語率 3〜15%（2026-2 実測 22.6語・14.3%）
  dialogue 450〜650語／9〜16語／1〜8%（2026-1 実測 11.7語・1.8%）
  summary 550〜750語（2025-2 は 400字程度の要約）／jaen 220〜360語・空所5（2024-2 実測 266語）
  大問3 会話 A+B 200〜450語／8〜17語（2025・2026-3 実測 226・406語，11.9語）
  大問4 約100語（模範解答 90〜115語）"""
import sys, re, json, importlib
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'h{R}').DATA

def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    t = t.replace('’', "'")
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / max(1, len(S)), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / len(cont) * 100, 1))
RANGE = {'reading': dict(words=(600, 800), avg=(18, 27), zipf_lt4=(3, 15)),
         'dialogue': dict(words=(450, 650), avg=(9, 16), zipf_lt4=(1, 8)),
         'summary': dict(words=(550, 750), avg=(17, 27), zipf_lt4=(3, 15)),
         'jaen': dict(words=(220, 360), avg=(7, 18), zipf_lt4=(1, 9)),
         'conv3': dict(words=(200, 450), avg=(8, 17), zipf_lt4=(1, 9))}
def judge(kind, d): return {m: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG') for m, (lo, hi) in RANGE[kind].items()}
def body(P):
    if P['type'] in ('dialogue', 'jaen'): return ' '.join(render.plain(t) for _, t in P['lines'])
    return ' '.join(render.plain(p) for p in P['passage'])

log, chk = {}, []
for n in ('1', '2'):
    P = D[n]; d = stats(body(P)); d['type'] = P['type']; d['range'] = judge(P['type'], d); log[n] = d
    if P['type'] in ('reading', 'dialogue'):
        k = len(P['questions']); chk.append((n, 'n_questions', k, '4-6', 'OK' if 4 <= k <= 6 else 'NG'))
        for q in P['questions']:
            if q['kind'] in ('free', 'yesno'):
                for a in [q['answer']] + q.get('alts', []):
                    chk.append((n, q['no'], len(a), '30-230字', 'OK' if 30 <= len(a) <= 230 else 'NG'))
    elif P['type'] == 'summary':
        for a in [P['answer']] + P.get('alts', []):
            chk.append((n, 'summary', len(a), '360-440字', 'OK' if 360 <= len(a) <= 440 else 'NG'))
    elif P['type'] == 'jaen':
        k = len(re.findall(r'\(\(\d\)\)', ' '.join(t for _, t in P['lines'])))
        chk.append((n, 'blanks', k, '5', 'OK' if k == 5 and len(P['options']) == 5 else 'NG'))
P3 = D['3']
d = stats(' '.join(render.plain(t) for c in P3['convs'] for _, t in c['lines'])); d['range'] = judge('conv3', d); log['3'] = d
for w in P3['words']:
    for m in w['models']:
        s = len([x for x in re.split(r'(?<=[.!?])\s+', m.strip()) if x])
        chk.append(('3', w['label'], s, '2-3文', 'OK' if 2 <= s <= 3 else 'NG'))
for c in P3['convs']:
    for m in c['models']:
        chk.append(('3', c['label'], wc(m), '20-60語', 'OK' if 20 <= wc(m) <= 60 else 'NG'))
for lab, m in D['4']['models']:
    chk.append(('4', lab, wc(m), '90-115語', 'OK' if 90 <= wc(m) <= 115 else 'NG'))
log['lengths'] = chk
ng = [k for k, v in log.items() if isinstance(v, dict) and any('NG' in x for x in v['range'].values())]
ng += [c for c in chk if c[-1] == 'NG']
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
