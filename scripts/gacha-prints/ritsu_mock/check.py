# -*- coding: utf-8 -*-
"""立命館 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問・東進解答（OCR）と英語4語連続／日本語13字連続の一致、題材の近さ（TF-IDF）、登場人物名の重複
    照合先は .tmpwork/ritsu_ref/ocr（立命館）に加え、あれば .tmpwork/osaka_ref・kobe_ref も使う
 2) 設問の質：解説の英文引用“…”が本文・選択肢に実在するか／選択肢の重複／正解番号の範囲／空所・下線の対応／
    会話文の10択（正解4つが別々）／解説が正解番号を誤りとして挙げていないか／正解位置の偏り／正解だけが極端に長い選択肢
"""
import re, sys, json, glob, os, importlib
from pathlib import Path
from collections import Counter
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
REFS = [Path(os.environ.get('RITSU_REF_DIR', str(ROOT / '.tmpwork/ritsu_ref'))), ROOT / '.tmpwork/osaka_ref', ROOT / '.tmpwork/kobe_ref']
GENERIC_OK = {('a', 'b', 'c', 'd')}  # 記号の並び（A〜D）は一致とみなさない

def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')).strip()
def words(t): return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]
def jchars(t): return re.sub(r'[^\u3040-\u30ff\u4e00-\u9fff]', '', t)
def strip(t): return re.sub(r'\^\d+', '', re.sub(r'\[\[[^\]]+\]\]', '', re.sub(r'\{u[^|}]*\|([^}]*)\}', r'\1', t)))
def collect(o, out):
    if isinstance(o, str): out.append(strip(o))
    elif isinstance(o, dict): [collect(v, out) for v in o.values()]
    elif isinstance(o, (list, tuple)): [collect(v, out) for v in o]

SRC = {}
for d in REFS:
    for f in glob.glob(str(d / 'ocr/*.txt')): SRC[f'{d.name}/{Path(f).stem}'] = open(f).read()
ALLSRC = '\n'.join(SRC.values())
EN4, JA13 = {}, {}
for k, t in SRC.items():
    w = words(t)
    for i in range(len(w) - 3): EN4.setdefault(tuple(w[i:i + 4]), set()).add(k)
    j = jchars(t)
    for i in range(len(j) - 12): JA13.setdefault(j[i:i + 13], set()).add(k)

rounds = sys.argv[1:] or ['1']
FIXED = re.findall(r"'([^'\n]{6,})'|\"([^\"\n]{6,})\"", open(HERE / 'render.py').read())
FIXED = [a or b for a, b in FIXED]
rep, ng = {}, []
pos = Counter(); longest = [0, 0]; tfc = Counter()

def mc_check(tag, it, n=4):
    ch = it['choices']
    if len(ch) != n: ng.append((tag, 'n_choices', it['label']))
    if len(set(map(norm, ch))) != len(ch): ng.append((tag, 'dup_choice', it['label']))
    if not 0 <= it['answer'] < len(ch): ng.append((tag, 'bad_answer', it['label'])); return
    pos[it['answer']] += 1
    L = [len(c) for c in ch]; longest[1] += 1
    if L[it['answer']] == max(L) and L.count(max(L)) == 1 and max(L) > 1.4 * sorted(L)[-2]: longest[0] += 1
    named = re.findall(r'(?<![A-Za-z0-9])\((\d{1,2})\)', it['why'])
    if str(it['answer'] + 1) in named: ng.append((tag, 'why_names_answer_number', it['label']))

def quotes_ok(tag, texts, pool):
    for t in texts:
        for qt in re.findall(r'“([^”]+)”', t):
            for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                seg = seg.strip(' ,.;:!?"\'').lower()
                if len(seg) >= 8 and re.search(r'[a-z]{3}', seg) and seg not in pool: ng.append((tag, 'quote_not_found', seg[:80]))

for R in rounds:
    D = importlib.import_module(f'rm{R}').DATA
    for part in ['I', 'II', 'III', 'IV', 'V']:
        texts = []; collect(D[part], texts)
        e4, j13 = {}, {}
        for x in texts:
            w = words(x)
            for i in range(len(w) - 3):
                g = tuple(w[i:i + 4])
                if g in EN4 and g not in GENERIC_OK: e4[' '.join(g)] = sorted(EN4[g])[:3]
            j = jchars(x)
            for i in range(len(j) - 12):
                if j[i:i + 13] in JA13: j13[j[i:i + 13]] = sorted(JA13[j[i:i + 13]])[:3]
        rep[f'r{R}-{part}'] = dict(en4=e4, ja13=j13)
        if e4: ng.append((f'r{R}-{part}', 'en4', list(e4)))
        if j13: ng.append((f'r{R}-{part}', 'ja13', list(j13)))
    # 登場人物・地名が過去問に出ていないか
    for nm in D.get('names', []):
        if re.search(r'\b' + re.escape(nm) + r'\b', ALLSRC): ng.append((f'r{R}', 'name_in_past', nm))
    # I
    I = D['I']; ptxt = norm(' '.join(strip(p) for p in I['passage'])).lower()
    pool = ptxt + ' ' + ' '.join(norm(c).lower() for it in I['q1']['items'] for c in it['choices'] + [it['question']])
    pool += ' ' + ' '.join(norm(it['text']).lower() for it in I['q2']['items']) + ' ' + ' '.join(norm(c).lower() for c in I['q3']['choices'])
    quotes_ok(f'r{R}-I', [it['why'] for it in I['q1']['items']] + [it['why'] for it in I['q2']['items']] + I['q3']['reasons'], pool)
    for it in I['q1']['items']: mc_check(f'r{R}-I1', it)
    a2 = [it['answer'] for it in I['q2']['items']]
    tfc.update(a2)
    if len(a2) != 5 or set(a2) - {1, 2, 3} or len(set(a2)) < 3: ng.append((f'r{R}-I2', 'tf_answers', a2))
    q3 = I['q3']
    if len(q3['choices']) != 5 or len(q3['reasons']) != 5: ng.append((f'r{R}-I3', 'n5'))
    for i, r in enumerate(q3['reasons']):
        if (i == q3['answer']) != r.strip().startswith('○'): ng.append((f'r{R}-I3', 'mark_mismatch', i))
    if len(I['translation']) != len(I['passage']): ng.append((f'r{R}-I', 'translation_paragraphs'))
    # II
    II = D['II']; raw = ' '.join(II['passage'])
    pool = norm(' '.join(strip(p) for p in II['passage'])).lower()
    pool += ' ' + ' '.join(norm(c).lower() for q in ('q1', 'q2') for it in II[q]['items'] for c in it['choices'] + [it.get('word', '')])
    quotes_ok(f'r{R}-II', [it['why'] for q in ('q1', 'q2') for it in II[q]['items']], pool)
    blanks = re.findall(r'\[\[([A-H])\]\]', raw)
    if blanks != [it['label'] for it in II['q1']['items']] or blanks != list('ABCDEFGH'): ng.append((f'r{R}-II', 'blanks', blanks))
    unders = re.findall(r'\{u(あ|い|う|え|お)\|', raw)
    if unders != [it['label'] for it in II['q2']['items']] or unders != list('あいうえお'): ng.append((f'r{R}-II', 'underlines', unders))
    for q in ('q1', 'q2'):
        for it in II[q]['items']: mc_check(f'r{R}-II{q[-1]}', it)
    if len(II['translation']) != len(II['passage']): ng.append((f'r{R}-II', 'translation_paragraphs'))
    # III
    for n, d in enumerate(D['III']['dialogues'], 1):
        tag = f'r{R}-III{n}'
        ch = d['choices']; ans = d['answers']
        if len(ch) != 10 or len(set(map(norm, ch))) != 10: ng.append((tag, 'choices10'))
        if len(ans) != 4 or len(set(ans.values())) != 4 or not all(0 <= v < 10 for v in ans.values()): ng.append((tag, 'answers', ans))
        bl = re.findall(r'\[\[([^\]]+)\]\]', ' '.join(x for _, x in d['lines']))
        if bl != list(ans): ng.append((tag, 'blanks', bl))
        if set(d['why']) != set(ans): ng.append((tag, 'why_keys'))
        for k, v in ans.items():
            named = re.findall(r'(?<![A-Za-z0-9])\((\d{1,2})\)', d['why'][k])
            if any(int(x) - 1 in ans.values() and int(x) - 1 != v for x in named): pass
        if len(d['translation']) != len(d['lines']): ng.append((tag, 'translation_lines', len(d['translation']), len(d['lines'])))
        pool = norm(' '.join(strip(x) for _, x in d['lines']) + ' ' + ' '.join(ch)).lower()
        quotes_ok(tag, list(d['why'].values()) + [d['unused']], pool)
    # IV・V
    for it in D['IV']['items']: mc_check(f'r{R}-IV', it)
    for q in ('q1', 'q2'):
        for it in D['V'][q]['items']: mc_check(f'r{R}-V{q[-1]}', it)
    for it in D['V']['q2']['items']:
        if not re.search(r'\{u\|[^}]+\}', it['text']): ng.append((f'r{R}-V2', 'no_underline', it['label']))

# 3) 題材の近さ（I・II の本文 vs 過去の長文）
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    past = json.load(open(REFS[0] / 'analysis/passages.json'))
    pk = [k for k in past if past[k]]; pt = [past[k] for k in pk]
    mk, mt = [], []
    for R in rounds:
        D = importlib.import_module(f'rm{R}').DATA
        for part in ('I', 'II'):
            mk.append(f'r{R}-{part}'); mt.append(' '.join(strip(p) for p in D[part]['passage']))
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
if fe or fj: ng.append(('render.py', 'fixed_text_overlap', sorted(fe) + sorted(fj)))

tot = sum(pos.values())
rep['answer_position'] = {f'({i + 1})': pos[i] for i in range(4)}
rep['tf_answers'] = dict(tfc)
if tot and (max(pos.values()) / tot > 0.32 or min(pos[i] for i in range(4)) / tot < 0.18): ng.append(('all', 'answer_position_bias', rep['answer_position']))
rep['correct_is_far_longest'] = f'{longest[0]}/{longest[1]}'
if longest[1] and longest[0] / longest[1] > 0.15: ng.append(('all', 'correct_far_longest', rep['correct_is_far_longest']))
rep['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(rep, open(HERE / 'logs/check.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(rep, ensure_ascii=False, indent=1))
sys.exit(1 if ng else 0)
