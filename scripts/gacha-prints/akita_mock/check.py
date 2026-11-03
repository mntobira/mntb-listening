# -*- coding: utf-8 -*-
"""秋田大 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問（公式PDFのOCR・模範解答例）と英語4語連続／日本語13字連続の一致，登場人物名の重複，題材の近さ（TF-IDF）。
    照合先は .tmpwork/akita_ref に加え，あれば iwate・hirosaki・tohoku・hokudai・kobe・osaka・ritsu の ref も使う。render.py の固定文言も照合。
 2) 設問の質：選択肢はちょうど4つで重複なし・正解の記号が範囲内・正解位置の偏り・正解だけ極端に長い選択肢・
    設問の Paragraph [k] が本文の段落数の範囲内・設問の <<語句>> が本文の下線 {u|…} と一致（過不足なし）・
    注の付け忘れ・和訳の段落数・解説の英文引用“…”が本文か選択肢に実在・配点の合計・禁止語・英作文の採点観点の合計。
"""
import re, sys, json, glob, importlib
from pathlib import Path
from collections import Counter
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
REFS = [ROOT / '.tmpwork/akita_ref'] + [ROOT / f'.tmpwork/{u}_ref' for u in ('iwate', 'hirosaki', 'tohoku', 'hokudai', 'kobe', 'osaka', 'ritsu')]
GENERIC_OK = {('a', 'b', 'c', 'd')}
BANNED = ['的中', '必ず出る', '合格できる', 'MANATOBI MOCK EXAM SERIES']

def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')).strip()
def words(t): return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]
def jchars(t): return re.sub(r'[^\u3040-\u30ff\u4e00-\u9fff]', '', t)
def collect(o, out):
    if isinstance(o, str): out.append(render.plain(o))
    elif isinstance(o, dict): [collect(v, out) for v in o.values()]
    elif isinstance(o, (list, tuple)): [collect(v, out) for v in o]

SRC = {}
for d in REFS:
    for f in glob.glob(str(d / 'ocr/*.txt')): SRC[f'{d.name}/{Path(f).stem}'] = open(f, errors='ignore').read()
ALLSRC = '\n'.join(SRC.values())
EN4, JA13 = {}, {}
for k, t in SRC.items():
    w = words(t)
    for i in range(len(w) - 3): EN4.setdefault(tuple(w[i:i + 4]), set()).add(k)
    j = jchars(t)
    for i in range(len(j) - 12): JA13.setdefault(j[i:i + 13], set()).add(k)

def overlaps(texts):
    e4, j13 = {}, {}
    for x in texts:
        w = words(x)
        for i in range(len(w) - 3):
            g = tuple(w[i:i + 4])
            if g in EN4 and g not in GENERIC_OK and not all(len(y) == 1 for y in g): e4[' '.join(g)] = sorted(EN4[g])[:3]
        j = jchars(x)
        for i in range(len(j) - 12):
            if j[i:i + 13] in JA13: j13[j[i:i + 13]] = sorted(JA13[j[i:i + 13]])[:3]
    return e4, j13

rounds = sys.argv[1:] or ['1']
rep, ng = {}, []
pos = Counter(); longest = [0, 0]

def quotes_ok(tag, texts, pool):
    for t in texts:
        for qt in re.findall(r'“([^”]+)”', t):
            for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                seg = seg.strip(' ,.;:!?"\'').lower()
                if len(seg) >= 8 and re.search(r'[a-z]{3}', seg) and seg not in pool: ng.append((tag, 'quote_not_found', seg[:80]))

for R in rounds:
    D = importlib.import_module(f'a{R}').DATA
    if sum(D['points'].values()) != 200: ng.append((f'r{R}', 'total_points'))
    for part in ('1', '2', '3'):
        texts = []; collect(D[part], texts)
        e4, j13 = overlaps(texts)
        rep[f'r{R}-{part}'] = dict(en4=e4, ja13=j13)
        if e4: ng.append((f'r{R}-{part}', 'en4', list(e4)))
        if j13: ng.append((f'r{R}-{part}', 'ja13', list(j13)))
        for b in BANNED:
            if any(b in t for t in texts): ng.append((f'r{R}-{part}', 'banned_word', b))
    for nm in D.get('names', []):
        if re.search(r'\b' + re.escape(nm) + r'\b', ALLSRC): ng.append((f'r{R}', 'name_in_past', nm))
    for n in ('1', '2'):
        P = D[n]; tag = f'r{R}-{n}'
        if sum(q['points'] for q in P['questions']) != D['points'][n]: ng.append((tag, 'points_sum'))
        raw = ' '.join(P['paras'])
        pool = norm(render.text_of(P)).lower() + ' ' + ' '.join(norm(c).lower() for q in P['questions'] for c in q['choices'])
        if len(P.get('translation', [])) != len(P['paras']): ng.append((tag, 'translation_paragraphs', len(P['paras']), len(P.get('translation', []))))
        for nt, _ in P.get('notes') or []:
            if not re.search(re.escape(nt) + r'\*', raw, re.I): ng.append((tag, 'note_not_marked', nt))
        for m in re.findall(r"([A-Za-z][A-Za-z\-]*)\*", raw):
            if m.lower() not in [x.lower() for x, _ in P.get('notes') or []]: ng.append((tag, 'mark_without_note', m))
        unders = re.findall(r'\{u\|([^}]*)\}', raw)
        asked = [x for q in P['questions'] for x in re.findall(r'<<(.+?)>>', q['stem'])]
        if sorted(map(norm, unders)) != sorted(map(norm, asked)): ng.append((tag, 'underline_vs_stems', unders, asked))
        for i, p in enumerate(P['paras']):
            for u in re.findall(r'\{u\|([^}]*)\}', p):
                for q in P['questions']:
                    if f'<<{u}>>' in q['stem']:
                        ks = [int(k) for k in re.findall(r'Paragraph \[(\d+)\]', q['stem'])]
                        if ks and i + 1 not in ks: ng.append((f'{tag}-Q{q["no"]}', 'underline_paragraph', u, i + 1, ks))
        nos = [q['no'] for q in P['questions']]
        if nos != list(range(1, len(nos) + 1)): ng.append((tag, 'question_numbers', nos))
        for q in P['questions']:
            qt = f'{tag}-Q{q["no"]}'
            for k in re.findall(r'Paragraphs? \[(\d+)\](?:\s*(?:-|–|to|and)\s*\[(\d+)\])?', q['stem']):
                for x in k:
                    if x and not 1 <= int(x) <= len(P['paras']): ng.append((qt, 'paragraph_out_of_range', x))
            ch = q['choices']
            if len(ch) != 4 or len(set(map(norm, ch))) != 4: ng.append((qt, 'choices_shape'))
            if not 0 <= q['answer'] < 4: ng.append((qt, 'answer_index'))
            pos[q['answer']] += 1
            Ls = [len(c) for c in ch]; longest[1] += 1
            if Ls[q['answer']] == max(Ls) and Ls.count(max(Ls)) == 1 and max(Ls) > 1.4 * sorted(Ls)[-2]: longest[0] += 1
            if not q.get('ja'): ng.append((qt, 'no_ja_translation'))
            if len(q.get('explain', [])) < 2: ng.append((qt, 'explain_too_short'))
            quotes_ok(qt, q.get('explain', []), pool)
    P = D['3']
    if sum(p for _, p in P['criteria']) != D['points']['3']: ng.append((f'r{R}-3', 'criteria_sum'))
    if len(P['models']) < 2: ng.append((f'r{R}-3', 'models'))

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    pk, pt = [], []
    for d in REFS:
        f = d / 'analysis/passages.json'
        if not f.exists(): continue
        for y, P in json.load(open(f)).items():
            for k, t in (P.items() if isinstance(P, dict) else []):
                if isinstance(t, str) and len(t) > 200: pk.append(f'{d.name}/{y}-{k}'); pt.append(t)
    mk, mt = [], []
    for R in rounds:
        D = importlib.import_module(f'a{R}').DATA
        for n in ('1', '2'): mk.append(f'r{R}-{n}'); mt.append(render.text_of(D[n]))
    v = TfidfVectorizer(stop_words='english', sublinear_tf=True).fit(pt + mt)
    S = cosine_similarity(v.transform(mt), v.transform(pt)); SP = cosine_similarity(v.transform(pt))
    pp = sorted(SP[i][j] for i in range(len(pk)) for j in range(i + 1, len(pk)))
    rep['topic'] = {k: (round(float(S[i].max()), 3), pk[S[i].argmax()]) for i, k in enumerate(mk)}
    rep['topic_past_ref'] = dict(n=len(pk), median=round(float(pp[len(pp) // 2]), 3), max=round(float(pp[-1]), 3))
    for k, (s, _) in rep['topic'].items():
        if s >= rep['topic_past_ref']['max']: ng.append((k, 'topic_too_close', s))
except Exception as ex:
    rep['topic_error'] = str(ex)

SRC_R = open(HERE / 'render.py').read()
FIXED = re.findall(r"'([^'\n]{8,})'|\"([^\"\n]{8,})\"", SRC_R)
fe, fj = overlaps([a or b for a, b in FIXED])
rep['render_fixed'] = dict(en4=sorted(fe), ja13=sorted(fj))
if fe or fj: ng.append(('render.py', 'fixed_text_overlap', sorted(fe) + sorted(fj)))
for b in BANNED:
    if b in SRC_R: ng.append(('render.py', 'banned_word', b))
rep['answer_positions'] = {render.CL[p]: c for p, c in sorted(pos.items())}
rep['far_longest_answer'] = f'{longest[0]}/{longest[1]}'
if longest[1] and longest[0] / longest[1] > 0.2: ng.append(('all', 'longest_answer_bias', rep['far_longest_answer']))
cs = [pos.get(p, 0) for p in range(4)]
if sum(cs) >= 8 and max(cs) - min(cs) > max(2, sum(cs) // 4): ng.append(('all', 'position_bias', cs))
rep['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(rep, open(HERE / 'logs/check.json', 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps({k: v for k, v in rep.items() if k in ('topic', 'topic_past_ref', 'render_fixed', 'answer_positions', 'far_longest_answer', 'ng', 'topic_error')}, ensure_ascii=False, indent=1, default=list))
sys.exit(1 if ng else 0)
