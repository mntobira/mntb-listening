# -*- coding: utf-8 -*-
"""立命館 予想問題の難易度・分量チェック。 python3 verify.py 1 → logs/verify_r1.json（NG なら終了コード1）
基準は .tmpwork/ritsu_ref/analysis/stats.json（2022〜2026年度の OCR から算出）。語数は過去の最小×0.95〜最大×1.05。"""
import re, sys, json, importlib, os
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
REF = Path(os.environ.get('RITSU_REF_DIR', str(ROOT / '.tmpwork/ritsu_ref')))
ST = json.load(open(REF / 'analysis/stats.json'))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'rm{R}').DATA
STOP = set('the a an and or but of to in on at for with by from as is are was were be been being it its this that these those he she they we you i his her their our your not no do does did have has had will would can could may might shall should must than then so if when which who whom whose what there here'.split())
def strip(t): return re.sub(r'\^\d+', '', re.sub(r'\[\[[^\]]+\]\]', '', re.sub(r'\{u[^|}]*\|([^}]*)\}', r'\1', t)))
def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"‘\'])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in STOP and w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / len(S), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / len(cont) * 100, 1),
                zipf_lt3=round(sum(z(w, 'en') < 3 for w in cont) / len(cont) * 100, 1))
def rng(part, key):
    v = [ST[f'{y}-{part}'][key] for y in range(2022, 2027)]
    return min(v), max(v)
out, ng = {}, []
for part in ('I', 'II'):
    d = stats(' '.join(strip(p) for p in D[part]['passage']))
    lo, hi = rng(part, 'words')
    r = {'words': (round(lo * .95), round(hi * 1.05)), 'avg': rng(part, 'avg'),
         'zipf_lt4': rng(part, 'clean_zipf_lt4'), 'zipf_lt3': rng(part, 'clean_zipf_lt3')}
    d['range'] = {k: f'{a}–{b}:' + ('OK' if a <= d[k] <= b else 'NG') for k, (a, b) in r.items()}
    out[part] = d
    if any(v.endswith('NG') for v in d['range'].values()): ng.append(part)
for n, dl in enumerate(D['III']['dialogues'], 1):
    w = sum(wc(strip(x)) for _, x in dl['lines']); out[f'III-{n}'] = w
    if not 110 <= w <= 210: ng.append((f'III-{n}', w, '110-210'))
vz = [z(c.lower(), 'en') for it in D['V']['q1']['items'] for c in it['choices']]
out['V1_choice_zipf'] = round(sum(vz) / len(vz), 2)
if not 3.6 <= out['V1_choice_zipf'] <= 4.4: ng.append(('V1_choice_zipf', out['V1_choice_zipf'], '3.6-4.4'))
vz2 = [z(re.search(r'\{u\|([^}]*)\}', it['text']).group(1).lower(), 'en') for it in D['V']['q2']['items']]
out['V2_target_zipf'] = round(sum(vz2) / len(vz2), 2)
if not 2.8 <= out['V2_target_zipf'] <= 4.2: ng.append(('V2_target_zipf', out['V2_target_zipf'], '2.8-4.2'))
out['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(out, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=False, indent=1))
sys.exit(1 if ng else 0)
