"""大阪大 予想問題の難易度・形式チェック：語数・平均文長・難語率を 2022〜2026年度の範囲と比べる。
英作文・英語説明の解答例の語数、日本語記述の字数も確かめる。 python3 verify.py N → logs/verify_rN.json"""
import sys, re, json, importlib, os
from pathlib import Path
from wordfreq import zipf_frequency as z
HERE = Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
REF_DIR = Path(os.environ.get('OSAKA_REF_DIR', str(HERE.parents[2] / '.tmpwork/osaka_ref')))
REF = json.load(open(REF_DIR / 'analysis/stats.json'))
R = sys.argv[1] if len(sys.argv) > 1 else '1'
D = importlib.import_module(f'o{R}').DATA
def strip(t): return re.sub(r'\{u[A-Za-z0-9]*\|([^}]*)\}', r'\1', t).replace('*', '').replace('’', "'")
def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", x))
def stats(t):
    S = [x for x in re.split(r'(?<=[.?!])["”’]?\s+(?=[A-Z“"])', t) if wc(x) > 2]
    toks = [w.lower() for w in re.findall(r'[A-Za-z]+', t) if len(w) > 1]
    caps = set(w.lower() for w in re.findall(r"(?<![.?!]\s)\b[A-Z][a-z]+", t))
    cont = [w for w in toks if w not in caps and z(w, 'en') > 0]
    return dict(words=wc(t), avg=round(wc(t) / len(S), 1),
                zipf_lt4=round(sum(z(w, 'en') < 4 for w in cont) / len(cont) * 100, 1),
                zipf_lt3=round(sum(z(w, 'en') < 3 for w in cont) / len(cont) * 100, 1))
def rng(key, m):
    v = [REF[f'{y}-{key}'][m] for y in range(2022, 2027)]; return min(v), max(v)
log = {}
for it in D['I']['items']:
    d = stats(' '.join(strip(p) for p in it['passage']))
    # I は (A)(B) の区別なく、両方の範囲を合わせて比べる（年により A/B の性格が入れ替わるため）
    d['range'] = {m: (lambda lo, hi: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG'))(min(rng('I-A', m)[0], rng('I-B', m)[0]), max(rng('I-A', m)[1], rng('I-B', m)[1])) for m in ['words', 'avg', 'zipf_lt4']}
    log[f'I-{it["label"]}'] = d
d = stats(' '.join(strip(p) for p in D['II']['passage']))
d['range'] = {m: (lambda lo, hi: f'{lo}–{hi}:' + ('OK' if lo <= d[m] <= hi else 'NG'))(*rng('II', m)) for m in ['words', 'avg', 'zipf_lt4', 'zipf_lt3']}
log['II'] = d
chk = []
for q in D['II']['questions']:
    if q['kind'] == 'ja_limit':
        for a in [q['answer']] + q.get('alts', []):
            n = len(a); chk.append(('II', q['no'], 'ja', n, q['limit'], 'OK' if q['limit'] * 0.75 <= n <= q['limit'] else 'NG'))
    if q['kind'] == 'en_explain':
        for lab, m in q['models']:
            n = wc(m); chk.append(('II', q['no'], 'en', n, '40-50', 'OK' if 38 <= n <= 53 else 'NG'))
for lab, m in D['III']['models']:
    n = wc(m); chk.append(('III', '', 'en', n, 80, 'OK' if 70 <= n <= 90 else 'NG'))
log['lengths'] = chk
ng = [k for k, v in log.items() if isinstance(v, dict) and any('NG' in x for x in v['range'].values())] + [c for c in chk if c[-1] == 'NG']
log['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(log, open(HERE / f'logs/verify_r{R}.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(log, ensure_ascii=False, indent=1)); sys.exit(1 if ng else 0)
