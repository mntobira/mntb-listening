# -*- coding: utf-8 -*-
"""弘前大 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問（公式PDFのOCR・解答例・出題意図）と英語4語連続／日本語13字連続の一致，登場人物名の重複，
    題材の近さ（TF-IDF）。照合先は .tmpwork/hirosaki_ref に加え，あれば tohoku・hokudai・kobe・osaka・ritsu の ref も使う。
    render.py の固定文言も照合。
 2) 設問の質：下線部の番号順と設問との対応・和訳の段落数／行数・短答の答えが本文にある・Yes/No の形・
    空所補充（jaen）の答えの記号が重複しない・解説の英文引用“…”が本文に実在・配点の合計・禁止語。
"""
import re, sys, json, glob, importlib
from pathlib import Path
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
REFS = [ROOT / '.tmpwork/hirosaki_ref'] + [ROOT / f'.tmpwork/{u}_ref' for u in ('tohoku', 'hokudai', 'kobe', 'osaka', 'ritsu')]
GENERIC_OK = {('a', 'b', 'c', 'd'), ('b', 'c', 'd', 'e')}
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
            if g in EN4 and g not in GENERIC_OK: e4[' '.join(g)] = sorted(EN4[g])[:3]
        j = jchars(x)
        for i in range(len(j) - 12):
            if j[i:i + 13] in JA13: j13[j[i:i + 13]] = sorted(JA13[j[i:i + 13]])[:3]
    return e4, j13

rounds = sys.argv[1:] or ['1']
rep, ng = {}, []

def quotes_ok(tag, texts, pool):
    for t in texts:
        for qt in re.findall(r'“([^”]+)”', t):
            for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                seg = seg.strip(' ,.;:!?"\'').lower()
                if len(seg) >= 8 and re.search(r'[a-z]{3}', seg) and seg not in pool: ng.append((tag, 'quote_not_found', seg[:80]))

def raw_text(P):
    if P['type'] in ('dialogue', 'jaen'): return ' '.join(t for _, t in P['lines'])
    return ' '.join(P['passage'])

for R in rounds:
    D = importlib.import_module(f'h{R}').DATA
    for part in ('1', '2', '3', '4'):
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
        P = D[n]; tag = f'r{R}-{n}'; raw = raw_text(P)
        pool = norm(render.plain(raw)).lower()
        if P['type'] in ('dialogue', 'jaen'):
            if len(P['translation']) != len(P['lines']): ng.append((tag, 'translation_lines', len(P['translation']), len(P['lines'])))
        else:
            if len(P['translation']) != len(P['passage']): ng.append((tag, 'translation_paragraphs', len(P['translation']), len(P['passage'])))
        for nt, _ in P.get('notes') or []:
            if not re.search(re.escape(nt) + r'\*', raw, re.I): ng.append((tag, 'note_not_marked', nt))
        for m in re.findall(r"([A-Za-z][A-Za-z\-]*)\*", raw):
            if m.lower() not in [x.lower() for x, _ in P.get('notes') or []]: ng.append((tag, 'mark_without_note', m))
        if P['type'] in ('reading', 'dialogue'):
            unders = re.findall(r'\{u(\d)\|', raw)
            if unders != [str(i) for i in range(1, len(unders) + 1)]: ng.append((tag, 'underline_numbers', unders))
            stems = ' '.join(q['stem'] for q in P['questions'])
            for u in unders:
                if f'下線部({u})' not in stems: ng.append((tag, 'underline_not_asked', u))
            for u in re.findall(r'下線部\((\d)\)', stems):
                if u not in unders: ng.append((tag, 'underline_missing', u))
            if [q['no'] for q in P['questions']] != list(range(1, len(P['questions']) + 1)): ng.append((tag, 'q_numbers'))
            for q in P['questions']:
                qt = f'{tag}-Q{q["no"]}'
                if sum(p for _, p in q['criteria']) != q['points']: ng.append((qt, 'criteria_sum'))
                if q['kind'] == 'short' and q['answer'].lower() not in pool: ng.append((qt, 'short_answer_not_in_text', q['answer']))
                if q['kind'] == 'yesno' and q['yn'] not in ('Yes', 'No'): ng.append((qt, 'yesno_shape'))
                if q['kind'] == 'yesno' and q['yn'] not in q['criteria'][0][0]: ng.append((qt, 'yesno_criteria'))
                quotes_ok(qt, q.get('explain', []), pool)
        elif P['type'] == 'summary':
            if sum(p for _, p in P['criteria']) != render.POINTS[n]: ng.append((tag, 'criteria_sum'))
            quotes_ok(tag, P.get('explain', []), pool)
        elif P['type'] == 'jaen':
            blanks = re.findall(r'\(\((\d)\)\)', raw)
            if blanks != [str(i) for i in range(1, len(blanks) + 1)]: ng.append((tag, 'blank_numbers', blanks))
            ans = P['answer']
            if sorted(map(str, ans)) != blanks: ng.append((tag, 'answer_keys', list(ans)))
            if sorted(ans.values()) != sorted(render.JL[:len(P['options'])]): ng.append((tag, 'answer_letters_not_unique', list(ans.values())))
            if set(P['models']) != set(render.JL[:len(P['options'])]) or set(P['explain']) != set(P['models']): ng.append((tag, 'models_explain_keys'))
            if sum(p for _, p in P['criteria']) * 1 != P['each'] or P['each'] * len(blanks) != render.POINTS[n]: ng.append((tag, 'jaen_points'))
            quotes_ok(tag, list(P['explain'].values()), pool)
    P3 = D['3']; tag = f'r{R}-3'
    for c in P3['convs']:
        if len(c['translation']) != len(c['lines']): ng.append((tag, 'translation_lines', c['label']))
        if '[...]' not in c['lines'][-1][1]: ng.append((tag, 'last_line_not_blank', c['label']))
        if sum(p for _, p in c['criteria']) != c['points']: ng.append((tag, 'criteria_sum', c['label']))
        if len(c['models']) < 2: ng.append((tag, 'models', c['label']))
    for w in P3['words']:
        if sum(p for _, p in w['criteria']) != w['points']: ng.append((tag, 'criteria_sum', w['label']))
    P4 = D['4']
    if sum(p for _, p in P4['criteria']) != 50: ng.append((f'r{R}-4', 'criteria_sum'))

# 題材の近さ：弘前大の公開部分と，他大学の長文に対して
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
        D = importlib.import_module(f'h{R}').DATA
        for part in ('1', '2'): mk.append(f'r{R}-{part}'); mt.append(render.plain(raw_text(D[part])))
        mk.append(f'r{R}-3'); mt.append(' '.join(render.plain(t) for c in D['3']['convs'] for _, t in c['lines']))
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
rep['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(rep, open(HERE / 'logs/check.json', 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps({k: v for k, v in rep.items() if k in ('topic', 'topic_past_ref', 'render_fixed', 'ng', 'topic_error')}, ensure_ascii=False, indent=1, default=list))
sys.exit(1 if ng else 0)
