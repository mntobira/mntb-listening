# -*- coding: utf-8 -*-
"""北大 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問・解答例（OCR）と英語4語連続／日本語13字連続の一致、題材の近さ（TF-IDF）、登場人物名の重複。
    照合先は .tmpwork/hokudai_ref/ocr に加え、あれば kobe_ref・osaka_ref・ritsu_ref も使う。render.py の固定文言も照合する。
 2) 設問の質：解説の英文引用“…”が本文・選択肢に実在するか／選択肢の重複／○×と正解の対応／下線・空所の番号順／
    要約の空所（[[1]]〜）と語群（各1回・I と O は使わない）／正解位置の偏り／正解だけが極端に長い選択肢
"""
import re, sys, json, glob, os, importlib
from pathlib import Path
from collections import Counter
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
REFS = [Path(os.environ.get('HOKUDAI_REF_DIR', str(ROOT / '.tmpwork/hokudai_ref')))] + [ROOT / f'.tmpwork/{u}_ref' for u in ('kobe', 'osaka', 'ritsu')]
GENERIC_OK = {('a', 'b', 'c', 'd'), ('b', 'c', 'd', 'e'), ('c', 'd', 'e', 'f')}

def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')).strip()
def words(t): return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]
def jchars(t): return re.sub(r'[^\u3040-\u30ff\u4e00-\u9fff]', '', t)
def strip(t): return re.sub(r'\[\[\d+\]\]', ' ', re.sub(r'\*\d?', '', re.sub(r'\{u\d\|([^}]*)\}', r'\1', t)))
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
pos = Counter(); longest = [0, 0]

def quotes_ok(tag, texts, pool):
    for t in texts:
        for qt in re.findall(r'“([^”]+)”', t):
            for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                seg = seg.strip(' ,.;:!?"\'').lower()
                if len(seg) >= 8 and re.search(r'[a-z]{3}', seg) and seg not in pool: ng.append((tag, 'quote_not_found', seg[:80]))

def choice_q(tag, q):
    ch = q['choices']; rs = q['reasons']
    if len(set(map(norm, ch))) != len(ch): ng.append((tag, 'dup_choice'))
    if len(rs) != len(ch): ng.append((tag, 'n_reasons'))
    ans = q['answer'] if isinstance(q['answer'], list) else [q['answer']]
    if q['kind'] == 'tf2' and (len(ch) != 6 or len(set(ans)) != 2): ng.append((tag, 'tf2_shape', ans))
    if q['kind'] == 'mc1' and len(ch) not in (4, 5): ng.append((tag, 'mc1_n'))
    for i, r in enumerate(rs):
        if (i in ans) != r.strip().startswith('○'): ng.append((tag, 'mark_mismatch', i))
        if not r.strip()[:1] in '○×': ng.append((tag, 'no_mark', i))
    if q['kind'] == 'mc1':
        pos[(len(ch), q['answer'])] += 1
        L = [len(c) for c in ch]; longest[1] += 1
        if L[q['answer']] == max(L) and L.count(max(L)) == 1 and max(L) > 1.4 * sorted(L)[-2]: longest[0] += 1

for R in rounds:
    D = importlib.import_module(f'h{R}').DATA
    for part in ('P1', 'P2', 'P3', 'P4'):
        texts = []; collect(D[part], texts)
        e4, j13 = overlaps(texts)
        rep[f'r{R}-{part}'] = dict(en4=e4, ja13=j13)
        if e4: ng.append((f'r{R}-{part}', 'en4', list(e4)))
        if j13: ng.append((f'r{R}-{part}', 'ja13', list(j13)))
    for nm in D.get('names', []):
        if re.search(r'\b' + re.escape(nm) + r'\b', ALLSRC): ng.append((f'r{R}', 'name_in_past', nm))
    for n in ('1', '2'):
        P = D['P' + n]; tag = f'r{R}-P{n}'; raw = ' '.join(P['passage'])
        pool = norm(' '.join(strip(p) for p in P['passage'])).lower()
        pool += ' ' + ' '.join(norm(c).lower() for q in P['questions'] for c in q.get('choices', []))
        unders = re.findall(r'\{u(\d)\|', raw)
        if unders != [str(i) for i in range(1, len(unders) + 1)]: ng.append((tag, 'underline_order', unders))
        blanks = re.findall(r'\(\s*(ア|イ|ウ|エ)\s*\)', raw)
        if blanks != list('アイウエ'[:len(blanks)]): ng.append((tag, 'blank_order', blanks))
        stems = ' '.join(q['stem'] for q in P['questions'])
        for u in unders:
            if f'下線部({u})' not in stems: ng.append((tag, 'underline_not_asked', u))
        for b in blanks:
            if f'( {b} )' not in stems and f'({b})' not in stems: ng.append((tag, 'blank_not_asked', b))
        if [q['no'] for q in P['questions']] != list(range(1, len(P['questions']) + 1)): ng.append((tag, 'q_numbers'))
        for q in P['questions']:
            if q['kind'] in ('mc1', 'tf2'):
                choice_q(f'{tag}-Q{q["no"]}', q); quotes_ok(f'{tag}-Q{q["no"]}', q['reasons'] + [q.get('note', '')], pool)
            else:
                quotes_ok(f'{tag}-Q{q["no"]}', q['explain'], pool)
            if q['kind'] == 'extract':
                for a in q['answer']:
                    if norm(a).lower() not in pool: ng.append((tag, 'extract_not_in_text', a))
        if len(P['translation']) != len(P['passage']): ng.append((tag, 'translation_paragraphs', len(P['translation']), len(P['passage'])))
    P3 = D['P3']; tag = f'r{R}-P3'
    pool = norm(' '.join(strip(p) for p in P3['passage']) + ' ' + P3['qC']['stem'] + ' ' + P3['qA']['frame'] + ' ' + P3['qB']['frame']).lower()
    quotes_ok(tag, P3['qA']['explain'] + P3['qB']['explain'] + P3['qC']['tips'], pool)
    for k in ('qA', 'qB'):
        if P3[k]['frame'].count('____') < 1: ng.append((tag, 'no_blank', k))
    if len(P3['translation']) != len(P3['passage']): ng.append((tag, 'translation_paragraphs'))
    if len(P3['qC']['models']) < 2: ng.append((tag, 'models'))
    P4 = D['P4']; tag = f'r{R}-P4'
    letters = [k for k, _ in P4['options']]
    if len(set(letters)) != len(letters) or 'I' in letters or 'O' in letters: ng.append((tag, 'option_letters'))
    if letters != sorted(letters): ng.append((tag, 'letters_not_sorted'))
    ws = [w for _, w in P4['options']]
    if ws != sorted(ws, key=str.lower): ng.append((tag, 'options_not_alpha'))
    if len(set(ws)) != len(ws): ng.append((tag, 'dup_option'))
    bl = [int(x) for x in re.findall(r'\[\[(\d+)\]\]', ' '.join(P4['summary']))]
    if bl != list(range(1, len(bl) + 1)) or list(P4['answers']) != bl: ng.append((tag, 'summary_blanks', bl))
    av = list(P4['answers'].values())
    if len(set(av)) != len(av) or any(a not in letters for a in av): ng.append((tag, 'answers', av))
    if set(P4['why']) != set(P4['answers']): ng.append((tag, 'why_keys'))
    if len(P4['translation']) != len(P4['lines']): ng.append((tag, 'translation_lines', len(P4['translation']), len(P4['lines'])))
    if len(P4['summary_translation']) != len(P4['summary']): ng.append((tag, 'summary_translation'))
    unused = [w for k, w in P4['options'] if k not in av]
    for w in unused:
        if w not in P4['unused']: ng.append((tag, 'unused_not_explained', w))
    cpool = norm(' '.join(strip(t) for _, t in P4['lines']) + ' ' + ' '.join(P4['summary'])).lower()
    quotes_ok(tag, list(P4['why'].values()) + [P4['unused']], cpool)

# 3) 題材の近さ（長文の本文 vs 過去の長文）
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    past = json.load(open(REFS[0] / 'analysis/passages.json'))
    pk, pt = [], []
    for y, P in past.items():
        for k, t in P.items():
            if t: pk.append(f'{y}-{k}'); pt.append(t)
    mk, mt = [], []
    for R in rounds:
        D = importlib.import_module(f'h{R}').DATA
        for part in ('P1', 'P2', 'P3'):
            mk.append(f'r{R}-{part}'); mt.append(' '.join(strip(p) for p in D[part]['passage']))
        mk.append(f'r{R}-P4'); mt.append(' '.join(strip(t) for _, t in D['P4']['lines']))
    v = TfidfVectorizer(stop_words='english', sublinear_tf=True).fit(pt + mt)
    S = cosine_similarity(v.transform(mt), v.transform(pt)); SP = cosine_similarity(v.transform(pt))
    pp = sorted(SP[i][j] for i in range(len(pk)) for j in range(i + 1, len(pk)))
    rep['topic'] = {k: (round(float(S[i].max()), 3), pk[S[i].argmax()]) for i, k in enumerate(mk)}
    rep['topic_past_ref'] = dict(median=round(float(pp[len(pp) // 2]), 3), max=round(float(pp[-1]), 3))
    for k, (s, _) in rep['topic'].items():
        if s >= rep['topic_past_ref']['max']: ng.append((k, 'topic_too_close', s))
except Exception as ex:
    rep['topic_error'] = str(ex)

# render.py の固定文言（指示文など）も照合
FIXED = re.findall(r"'([^'\n]{8,})'|\"([^\"\n]{8,})\"", open(HERE / 'render.py').read())
fe, fj = overlaps([a or b for a, b in FIXED])
rep['render_fixed'] = dict(en4=sorted(fe), ja13=sorted(fj))
if fe or fj: ng.append(('render.py', 'fixed_text_overlap', sorted(fe) + sorted(fj)))
rep['answer_positions'] = {f'{n}択-{p}': c for (n, p), c in sorted(pos.items())}
rep['far_longest_answer'] = f'{longest[0]}/{longest[1]}'
if longest[1] and longest[0] / longest[1] > 0.15: ng.append(('all', 'longest_answer_bias', rep['far_longest_answer']))
for n in (4, 5):
    cs = [pos.get((n, p), 0) for p in range(n)]
    if sum(cs) >= 6 and max(cs) - min(cs) > max(2, sum(cs) // n): ng.append(('all', f'position_bias_{n}', cs))
rep['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(rep, open(HERE / 'logs/check.json', 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps({k: v for k, v in rep.items() if k in ('topic', 'topic_past_ref', 'render_fixed', 'answer_positions', 'far_longest_answer', 'ng')}, ensure_ascii=False, indent=1, default=list))
sys.exit(1 if ng else 0)
