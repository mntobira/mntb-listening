"""オリジナル性の監査（商用利用向けの強化版）。
対象：予想問題 3回分のすべての文字列（本文・設問・選択肢・解答・解説・全訳・語句・英作文の解答例）。
照合先：2022〜2026年度の問題（OCR）と東進の解答・解説（OCR）すべて。
  1) 英語：4語の連続一致（4-gram）。一般的な言い回しかどうかは、別の大規模コーパス頻度（wordfreq）で判定材料を出す
  2) 英語：最長の連続一致（語数）
  3) 日本語：13字以上の連続一致（空白・句読点を除いて比較）
  4) 題材の近さ：本文ごとの TF-IDF コサイン類似度（過去の全長文との最大値）
  5) 下線・空所の語句が過去問と同じでないか
出力：logs/originality.json
"""
import os as _os
from pathlib import Path as _P
# 過去問の OCR などの照合用データ（著作物のため git に入れない）。既定は .tmpwork/kobe_ref/{ocr,analysis}
REF_DIR = _P(_os.environ.get('KOBE_REF_DIR', str(_P(__file__).resolve().parents[3] / '.tmpwork/kobe_ref')))
import re, json, glob, importlib, sys
from pathlib import Path
from wordfreq import zipf_frequency as zf
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
OCR = sorted(glob.glob(str(REF_DIR / 'ocr/*.txt')))
SRC = {Path(f).stem: open(f).read() for f in OCR}

def norm(t):
    return t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')

def words(t):
    return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]

def jchars(t):
    return re.sub(r'[\s、。，．・「」『』（）()\[\]【】〔〕…―ー—\-:：;；!?！？"\'“”‘’0-9A-Za-z]', '', t)

# ---- 照合先のインデックス
EN = {}
for k, t in SRC.items():
    w = words(t)
    for i in range(len(w) - 3):
        EN.setdefault(tuple(w[i:i + 4]), set()).add(k)
JA_TXT = {k: jchars(t) for k, t in SRC.items()}
JA13 = {}
for k, t in JA_TXT.items():
    for i in range(len(t) - 12):
        JA13.setdefault(t[i:i + 13], set()).add(k)

def collect(obj, out):
    if isinstance(obj, str): out.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values(): collect(v, out)
    elif isinstance(obj, (list, tuple)):
        for v in obj: collect(v, out)

def strip_mark(t):
    return re.sub(r'\{[a-z0-9]+\|([^}]*)\}', r'\1', t).replace('*', '')

report = {}
for R in '123':
    rr = {}
    for part in ['I', 'II', 'III', 'IV']:
        P = importlib.import_module(f'r{R}_{part}').PART
        texts = []
        collect(P, texts)
        texts = [strip_mark(x) for x in texts]
        # 1) 英語 4-gram
        hits = {}
        for x in texts:
            w = words(x)
            for i in range(len(w) - 3):
                g = tuple(w[i:i + 4])
                if g in EN: hits[' '.join(g)] = sorted(EN[g])
        # 2) 最長一致（語）
        longest = (0, '')
        for x in texts:
            w = words(x)
            n = len(w); i = 0
            while i < n - 3:
                if tuple(w[i:i + 4]) in EN:
                    j = i + 4
                    while j < n and tuple(w[j - 3:j + 1]) in EN: j += 1
                    if j - i > longest[0]: longest = (j - i, ' '.join(w[i:j]))
                    i = j
                else: i += 1
        # 3) 日本語 13字
        jhits = {}
        for x in texts:
            t = jchars(x)
            for i in range(len(t) - 12):
                s = t[i:i + 13]
                if s in JA13: jhits[s] = sorted(JA13[s])
        rr[part] = dict(en4_hits=hits, en_longest_run=longest, ja13_hits=jhits)
    report[f'r{R}'] = rr

# 4) 題材の近さ（TF-IDF）
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
past = json.load(open(REF_DIR / 'analysis/passages.json'))
past_keys = [k for k in past if not k.endswith('IV')]
past_txt = [past[k] if isinstance(past[k], str) else ' '.join(past[k]) for k in past_keys]
mine_keys, mine_txt = [], []
for R in '123':
    for part in ['I', 'II', 'III']:
        P = importlib.import_module(f'r{R}_{part}').PART
        mine_keys.append(f'r{R}-{part}'); mine_txt.append(' '.join(strip_mark(p) for p in P['passage']))
vec = TfidfVectorizer(stop_words='english', sublinear_tf=True).fit(past_txt + mine_txt)
S = cosine_similarity(vec.transform(mine_txt), vec.transform(past_txt))
SP = cosine_similarity(vec.transform(past_txt))
past_pair = sorted(SP[i][j] for i in range(len(past_keys)) for j in range(len(past_keys)) if i < j)
topic = {}
for i, k in enumerate(mine_keys):
    j = S[i].argmax(); topic[k] = dict(max_sim=round(float(S[i][j]), 3), nearest=past_keys[j])
report['topic_similarity'] = dict(mine_vs_past=topic,
    past_vs_past_reference=dict(median=round(float(past_pair[len(past_pair) // 2]), 3), max=round(float(past_pair[-1]), 3)))

# 5) 下線・空所の語句
pw = set()
for k in past:
    t = past[k] if isinstance(past[k], str) else ' '.join(past[k])
for f in OCR:
    pass
used = []
for R in '123':
    for part in ['I', 'II', 'III']:
        P = importlib.import_module(f'r{R}_{part}').PART
        for p in P['passage']:
            used += [m.lower() for m in re.findall(r'\{u[a-z0-9]*\|([^}]*)\}|\{w[a-z0-9]*\|([^}]*)\}', p) for m in m if m]
allsrc = ' '.join(norm(t).lower() for t in SRC.values())
report['marked_phrases_found_in_past'] = sorted({u for u in used if len(u.split()) >= 2 and re.search(r'\b' + re.escape(u) + r'\b', allsrc)})

# 4-gram の一般性：wordfreq で全4語とも高頻度（zipf>=4.5 の機能語中心）かどうか
def generic(g):
    return all(zf(w, 'en') >= 4.5 for w in g.split())
summary = {}
for R in '123':
    for part, d in report[f'r{R}'].items():
        summary[f'r{R}-{part}'] = dict(en4=len(d['en4_hits']), en4_nongeneric=[g for g in d['en4_hits'] if not generic(g)],
                                       longest=d['en_longest_run'][0], ja13=len(d['ja13_hits']))
report['summary'] = summary
json.dump(report, open(HERE / 'logs/originality.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(dict(summary=summary, topic=report['topic_similarity'], marked=report['marked_phrases_found_in_past']), ensure_ascii=False, indent=1))
