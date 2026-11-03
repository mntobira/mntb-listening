"""大阪大 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問・東進解答（OCR）と英語4語連続／日本語13字連続の一致、題材の近さ（TF-IDF）
    照合先は .tmpwork/osaka_ref/ocr（大阪大）に加え、あれば .tmpwork/kobe_ref/ocr（神戸大）も使う
 2) 設問の質：解説の英文引用“…”が本文・選択肢に実在するか／選択肢の重複／正解番号の範囲／
    内容一致の正解ちょうど2つと○×の一致／正解位置の偏り／正解だけが極端に長い選択肢
"""
import re, sys, json, glob, os, importlib
from pathlib import Path
from collections import Counter
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
REFS = [Path(os.environ.get('OSAKA_REF_DIR', str(ROOT / '.tmpwork/osaka_ref'))), ROOT / '.tmpwork/kobe_ref']
K = 'イロハニホヘ'
GENERIC_OK = {('a', 'b', 'c', 'a')}

def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')).strip()
def words(t): return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]
def jchars(t): return re.sub(r'[^\u3040-\u30ff\u4e00-\u9fff]', '', t)
def strip(t): return re.sub(r'\{u[A-Za-z0-9]*\|([^}]*)\}', r'\1', t).replace('*', '')
def collect(o, out):
    if isinstance(o, str): out.append(strip(o))
    elif isinstance(o, dict): [collect(v, out) for v in o.values()]
    elif isinstance(o, (list, tuple)): [collect(v, out) for v in o]

SRC = {}
for d in REFS:
    for f in glob.glob(str(d / 'ocr/*.txt')): SRC[f'{d.name}/{Path(f).stem}'] = open(f).read()
EN4, JA13 = {}, {}
for k, t in SRC.items():
    w = words(t)
    for i in range(len(w) - 3): EN4.setdefault(tuple(w[i:i + 4]), set()).add(k)
    j = jchars(t)
    for i in range(len(j) - 12): JA13.setdefault(j[i:i + 13], set()).add(k)

rounds = sys.argv[1:] or ['1']
# レンダラーに直接書いた指示文・表紙の注意も検査（Python の文字列リテラルを抜き出す）
FIXED = re.findall(r"'([^'\n]{6,})'|\"([^\"\n]{6,})\"", open(HERE / 'render.py').read())
FIXED = [a or b for a, b in FIXED]
rep, ng = {}, []
pos = Counter(); longest = [0, 0]
for R in rounds:
    D = importlib.import_module(f'o{R}').DATA
    for part in ['I', 'II', 'III', 'IV']:
        texts = []; collect(D[part], texts)
        e4 = {}; j13 = {}
        for x in texts:
            w = words(x)
            for i in range(len(w) - 3):
                g = tuple(w[i:i + 4])
                if g in EN4 and g not in GENERIC_OK: e4[' '.join(g)] = sorted(EN4[g])
            j = jchars(x)
            for i in range(len(j) - 12):
                if j[i:i + 13] in JA13: j13[j[i:i + 13]] = sorted(JA13[j[i:i + 13]])
        rep[f'r{R}-{part}'] = dict(en4=e4, ja13=j13)
        if e4: ng.append((f'r{R}-{part}', 'en4', list(e4)))
        if j13: ng.append((f'r{R}-{part}', 'ja13', list(j13)))
    # 2) 設問の質（II）
    P = D['II']
    pool = norm(' '.join(strip(p) for p in P['passage'])).lower()
    for q in P['questions']:
        for c in q.get('choices', []): pool += ' ' + norm(c).lower()
        for it in q.get('items', []):
            pool += ' ' + norm(it.get('word', '')).lower() + ' ' + ' '.join(norm(c).lower() for c in it['choices'])
    tx = []
    for q in P['questions']:
        tx += q.get('explain', []) + q.get('reasons', [])
        tx += [it.get('why', '') for it in q.get('items', [])]
    for t in tx:
        for qt in re.findall(r'“([^”]+)”', t):
            for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                seg = seg.strip(' ,.;:').lower()
                if len(seg) >= 8 and re.search(r'[a-z]{3}', seg) and seg not in pool: ng.append((f'r{R}-II', 'quote_not_in_passage', seg[:80]))
    for q in P['questions']:
        k = q['kind']
        if k in ('synonym', 'en_mc'):
            for it in q['items']:
                ch = it['choices']
                if len(set(map(norm, ch))) != len(ch): ng.append((f'r{R}-II', 'dup_choice', it['label']))
                if not 0 <= it['answer'] < len(ch): ng.append((f'r{R}-II', 'bad_answer', it['label']))
                pos[it['answer']] += 1
                L = [len(c) for c in ch]; longest[1] += 1
                if L[it['answer']] == max(L) and L.count(max(L)) == 1 and max(L) > 1.4 * sorted(L)[-2]: longest[0] += 1
                bad = [x for x in re.findall(r'\((イ|ロ|ハ|ニ)\)', it['why']) if K.index(x) == it['answer']]
                if bad: ng.append((f'r{R}-II', 'why_names_answer_as_wrong', it['label']))
        if k == 'tf2':
            a = sorted(q['answer'])
            if len(a) != 2: ng.append((f'r{R}-II', 'tf2_not_two'))
            for i, r in enumerate(q['reasons']):
                if (i in a) != r.strip().startswith('○'): ng.append((f'r{R}-II', 'tf2_mark_mismatch', i))
        if k == 'mc1':
            pos[q['answer']] += 1
            for i, r in enumerate(q['reasons']):
                if (i == q['answer']) != r.strip().startswith('○'): ng.append((f'r{R}-II', 'mc1_mark_mismatch', i))
    if len(P['translation']) != len(P['passage']): ng.append((f'r{R}-II', 'translation_paragraphs'))
    # IV：(B)(イ)(ロ) がそろっている
    subs = [(it['label'], it['sub']) for it in D['IV']['items']]
    if subs != [('A', ''), ('B', 'イ'), ('B', 'ロ')]: ng.append((f'r{R}-IV', 'items', subs))

# 3) 題材の近さ（II の本文 vs 過去の長文）
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    past = json.load(open(REFS[0] / 'analysis/passages.json'))
    pk = [k for k in past if past[k]]; pt = [past[k] for k in pk]
    mk = [f'r{R}-II' for R in rounds]; mt = [' '.join(strip(p) for p in importlib.import_module(f'o{R}').DATA['II']['passage']) for R in rounds]
    mk += [f'r{R}-I{it["label"]}' for R in rounds for it in importlib.import_module(f'o{R}').DATA['I']['items']]
    mt += [' '.join(strip(p) for p in it['passage']) for R in rounds for it in importlib.import_module(f'o{R}').DATA['I']['items']]
    v = TfidfVectorizer(stop_words='english', sublinear_tf=True).fit(pt + mt)
    S = cosine_similarity(v.transform(mt), v.transform(pt)); SP = cosine_similarity(v.transform(pt))
    pp = sorted(SP[i][j] for i in range(len(pk)) for j in range(i + 1, len(pk)))
    rep['topic'] = {k: (round(float(S[i].max()), 3), pk[S[i].argmax()]) for i, k in enumerate(mk)}
    rep['topic_past_ref'] = dict(median=round(float(pp[len(pp) // 2]), 3), max=round(float(pp[-1]), 3))
    for k, (s, _) in rep['topic'].items():
        if s >= rep['topic_past_ref']['max']: ng.append((k, 'topic_too_close', s))
except Exception as ex:
    rep['topic_error'] = str(ex)

fx = []; collect(FIXED, fx)
fe = {' '.join(tuple(words(x)[i:i+4])) for x in fx for i in range(len(words(x)) - 3) if tuple(words(x)[i:i+4]) in EN4}
fj = {jchars(x)[i:i+13] for x in fx for i in range(len(jchars(x)) - 12) if jchars(x)[i:i+13] in JA13}
rep['render_fixed'] = dict(en4=sorted(fe), ja13=sorted(fj))
if fe or fj: ng.append(('render.py', 'fixed_text', sorted(fe) + sorted(fj)))
rep['answer_position'] = {K[k]: v for k, v in sorted(pos.items())}
rep['correct_is_far_longest'] = f'{longest[0]}/{longest[1]}'
rep['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(rep, open(HERE / 'logs/check.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in rep.items() if not k.startswith('r')}, ensure_ascii=False, indent=1))
sys.exit(1 if ng else 0)
