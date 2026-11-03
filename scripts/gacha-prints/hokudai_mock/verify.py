# -*- coding: utf-8 -*-
"""北大 予想問題の難易度・形式チェック：大問ごとの語数・平均文長・難語率（zipf<4）を 2022〜2026年度の範囲と比べる。
意見英作文（70〜100語）・日本語の字数制限も確かめる。 python3 verify.py N → logs/verify_rN.json（NG があれば終了コード1）"""
import sys, re, json, importlib, os
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
REF_DIR = Path(os.environ.get('HOKUDAI_REF_DIR', str(HERE.parents[2] / '.tmpwork/hokudai_ref')))
REF = json.load(open(REF_DIR / 'analysis/stats.json'))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'h{R}').DATA
def strip(t): return re.sub(r'\*\d?', '', re.sub(r'\{u\d\|([^}]*)\}', r'\1', t)).replace('’', "'")
def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / len(S), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / len(cont) * 100, 1),
                zipf_lt3=round(sum(z(w, 'en') < 3 for w in cont) / len(cont) * 100, 1))
SLACK = {'words': (0.97, 1.03), 'avg': (0.95, 1.05), 'zipf_lt4': (0.9, 1.1)}
def judge(key, d):
    out = {}
    for m, (a, b) in SLACK.items():
        v = [REF[f'{y}-{key}'][m] for y in range(2022, 2027)]
        lo, hi = round(min(v) * a, 1), round(max(v) * b, 1)
        out[m] = f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG')
    return out
P4 = D['P4']; opt = dict(P4['options'])
summ = ' '.join(P4['summary'])
summ = re.sub(r'\[\[(\d+)\]\]', lambda m: opt[P4['answers'][int(m.group(1))]], summ)
texts = {'1': ' '.join(map(strip, D['P1']['passage'])), '2': ' '.join(map(strip, D['P2']['passage'])),
         '3': ' '.join(map(strip, D['P3']['passage'])), '4conv': ' '.join(strip(t) for _, t in P4['lines']), '4sum': strip(summ)}
log = {}
for k, t in texts.items():
    d = stats(t); d['range'] = judge(k, d); log[k] = d
chk = []
for n in ('1', '2'):
    for q in D['P' + n]['questions']:
        if q['kind'] == 'ja_limit':
            for a in [q['answer']] + q.get('alts', []):
                chk.append((n, q['no'], 'ja', len(a), q['limit'], 'OK' if q['limit'] * 0.7 <= len(a) <= q['limit'] else 'NG'))
for lab, m in D['P3']['qC']['models']:
    chk.append(('3', 'C', 'en', wc(m), '70-100', 'OK' if 72 <= wc(m) <= 100 else 'NG'))
log['lengths'] = chk
ng = [k for k, v in log.items() if isinstance(v, dict) and any('NG' in x for x in v['range'].values())] + [c for c in chk if c[-1] == 'NG']
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
