# -*- coding: utf-8 -*-
"""山形大 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問（公式PDFのOCR・解答例・出題の意図）と英語4語連続／日本語13字連続の一致，登場人物名の重複，題材の近さ（TF-IDF）。
    照合先は .tmpwork/yamagata_ref に加え，あれば akita・iwate・hirosaki・tohoku・hokudai・kobe・osaka・ritsu の ref も使う。render.py の固定文言も照合。
 2) 設問の質：下線 {u|…}・{s|…}・{o|…}・[[a]] と設問の対応（過不足なし・指定の段落にある）・同意語の選択肢・語群（1語余る・重複なし）・
    並べ替えの語句と正解の一致・選択肢の数と重複・正解の記号が範囲内・正解位置の偏り・正解だけ極端に長い選択肢・
    注の付け忘れ・和訳の段落数・解説の英文引用“…”が本文か選択肢に実在・配点と採点基準の合計・禁止語。
"""
import re, sys, json, glob, importlib
from pathlib import Path
from collections import Counter
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
import render
sys.path.insert(0, str(HERE))
REFS = [ROOT / '.tmpwork/yamagata_ref'] + [ROOT / f'.tmpwork/{u}_ref' for u in ('akita', 'iwate', 'hirosaki', 'tohoku', 'hokudai', 'kobe', 'osaka', 'ritsu')]
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

def choice_stats(qt, ch, ans):
    if len(set(map(norm, ch))) != len(ch): ng.append((qt, 'dup_choices'))
    if not 0 <= ans < len(ch): ng.append((qt, 'answer_index')); return
    pos[ans] += 1
    Ls = [len(c) for c in ch]; longest[1] += 1
    if Ls[ans] == max(Ls) and Ls.count(max(Ls)) == 1 and max(Ls) > 1.4 * sorted(Ls)[-2]: longest[0] += 1

for R in rounds:
    D = importlib.import_module(f'y{R}').DATA
    if sum(D['points'].values()) != 200: ng.append((f'r{R}', 'total_points'))
    for part in D['points']:
        texts = []; collect(D[part], texts)
        e4, j13 = overlaps(texts)
        rep[f'r{R}-{part}'] = dict(en4=e4, ja13=j13)
        if e4: ng.append((f'r{R}-{part}', 'en4', list(e4)))
        if j13: ng.append((f'r{R}-{part}', 'ja13', list(j13)))
        for b in BANNED:
            if any(b in t for t in texts): ng.append((f'r{R}-{part}', 'banned_word', b))
    for nm in D.get('names', []):
        if re.search(r'\b' + re.escape(nm) + r'\b', ALLSRC): ng.append((f'r{R}', 'name_in_past', nm))
    for n in D['points']:
        P = D[n]; tag = f'r{R}-{n}'
        paras = render.all_paras(P)
        if sum(q['points'] for q in P['questions']) != D['points'][n]: ng.append((tag, 'points_sum'))
        pool = norm(render.filled(P)).lower()
        pool += ' ' + ' '.join(norm(c).lower() for q in P['questions'] for c in q.get('choices', []) + q.get('statements', []) + [x for it in q.get('items', []) for x in it['choices']])
        for ps in P['passages']:
            raw = ' '.join(ps['paras'])
            if len(ps.get('translation', [])) != len(ps['paras']): ng.append((tag, 'translation_paragraphs', ps['headline'][:20]))
            for nt, _ in ps.get('notes') or []:
                if not re.search(re.escape(nt) + r'\*', raw, re.I): ng.append((tag, 'note_not_marked', nt))
            for m in re.findall(r"([A-Za-z][A-Za-z\-]*)\*", raw):
                if m.lower() not in [x.lower() for x, _ in ps.get('notes') or []]: ng.append((tag, 'mark_without_note', m))
        # 本文の印と設問の対応
        U = [(i + 1, u) for i, p in enumerate(paras) for u in re.findall(r'\{u\|([^}]*)\}', p)]
        S = [(i + 1, s) for i, p in enumerate(paras) for s in re.findall(r'\{s\|([^}]*)\}', p)]
        O = [(i + 1, o) for i, p in enumerate(paras) for o in re.findall(r'\{o\|([^}]*)\}', p)]
        B = [(i + 1, b) for i, p in enumerate(paras) for b in re.findall(r'\[\[([a-e])\]\]', p)]
        qU = [(q['para'], q['target']) for q in P['questions'] if q['kind'] in ('trans', 'explain')]
        qS = [(it['para'], it['word']) for q in P['questions'] if q['kind'] == 'syn' for it in q['items']]
        if sorted(U) != sorted(qU): ng.append((tag, 'underline_vs_questions', U, qU))
        if sorted(S) != sorted(qS): ng.append((tag, 'syn_vs_questions', S, qS))
        qO = [q for q in P['questions'] if q['kind'] == 'order']
        if len(O) != len(qO): ng.append((tag, 'order_count', len(O), len(qO)))
        for (pi, o), q in zip(O, qO):
            ws = [w.strip() for w in o.split('/')]
            if pi != q['para'] or sorted(ws) != sorted(q['words']): ng.append((tag, 'order_words', o, q['words']))
            if sorted(q['answer'].split()) != sorted(' '.join(q['words']).split()): ng.append((tag, 'order_answer', q['answer']))
        qB = [q for q in P['questions'] if q['kind'] == 'blank']
        bl = sorted(b for _, b in B)
        ql = sorted(k for q in qB for k in q['answers'])
        if bl != ql: ng.append((tag, 'blank_letters', bl, ql))
        for q in qB:
            ok_paras = q['para'] if isinstance(q['para'], list) else [q['para']]
            if any(pi not in ok_paras for pi, _ in B): ng.append((tag, 'blank_para'))
            vals = list(q['answers'].values())
            if len(set(vals)) != len(vals) or not set(vals) <= set(q['words']) or len(q['words']) != len(vals) + 1: ng.append((tag, 'blank_words'))
        nos = [q['no'] for q in P['questions']]
        if nos != list(range(1, len(nos) + 1)): ng.append((tag, 'question_numbers', nos))
        for q in P['questions']:
            qt = f'{tag}-Q{q["no"]}'; k = q['kind']
            if not q.get('ja'): ng.append((qt, 'no_ja'))
            for x in re.findall(r'¶(\d+)', q['stem']):
                if not 1 <= int(x) <= len(paras): ng.append((qt, 'paragraph_out_of_range', x))
            if k == 'syn':
                for it in q['items']:
                    if len(it['choices']) not in (4, 5): ng.append((qt, 'syn_choices', it['label']))
                    choice_stats(f'{qt}({it["label"]})', it['choices'], it['answer'])
            elif k == 'mc':
                if len(q['choices']) not in (4, 5): ng.append((qt, 'mc_choices'))
                choice_stats(qt, q['choices'], q['answer'])
            elif k == 'multi':
                if len(q['answers']) != q['n'] or len(set(q['answers'])) != q['n'] or any(not 0 <= a < len(q['choices']) for a in q['answers']): ng.append((qt, 'multi_answers'))
                if len(set(map(norm, q['choices']))) != len(q['choices']): ng.append((qt, 'dup_choices'))
            elif k == 'tf':
                if len(q['answers']) != len(q['statements']) or set(q['answers']) - {'T', 'F'}: ng.append((qt, 'tf_answers'))
                if len(set(q['answers'])) < 2: ng.append((qt, 'tf_all_same'))
            elif k in ('trans', 'explain', 'write'):
                if sum(p for _, p in q['criteria']) != q['points']: ng.append((qt, 'criteria_sum'))
                if k == 'write' and len(q['models']) < 2: ng.append((qt, 'models'))
            if k not in ('write',) and len(q.get('explain', ['x', 'y'])) < (1 if k in ('syn',) else 2): ng.append((qt, 'explain_too_short'))
            quotes_ok(qt, q.get('explain', []) + [it.get('explain', '') for it in q.get('items', [])], pool)

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
        D = importlib.import_module(f'y{R}').DATA
        for n in D['points']:
            for ps in D[n]['passages']: mk.append(f'r{R}-{n}-{ps["headline"][:16]}'); mt.append(render.plain(' '.join(ps['paras'])))
    v = TfidfVectorizer(stop_words='english', sublinear_tf=True).fit(pt + mt)
    S_ = cosine_similarity(v.transform(mt), v.transform(pt)); SP = cosine_similarity(v.transform(pt))
    pp = sorted(SP[i][j] for i in range(len(pk)) for j in range(i + 1, len(pk)))
    rep['topic'] = {k: (round(float(S_[i].max()), 3), pk[S_[i].argmax()]) for i, k in enumerate(mk)}
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
