# -*- coding: utf-8 -*-
"""東北大 予想問題の検査（商用利用のため毎回実行）。 python3 check.py 1 2 3 → logs/check.json（NG があれば終了コード1）
 1) オリジナル性：過去問（公式PDFのOCR・出題意図）・予備校の解答例と英語4語連続／日本語13字連続の一致，登場人物名の重複，
    題材の近さ（TF-IDF）。照合先は .tmpwork/tohoku_ref に加え，あれば hokudai・kobe・osaka・ritsu の ref も使う。render.py の固定文言も照合。
 2) 設問の質：選択肢の重複・正解がちょうど1つ（2つ選ぶ問題は2つ）・○×と正解の対応・解説の英文引用“…”が本文に実在・
    下線/空欄/語義/整序の番号順と設問との対応・整序の正解が本文の完成文と一致・正解位置の偏り・正解だけ極端に長い選択肢・禁止語。
"""
import re, sys, json, glob, os, importlib
from pathlib import Path
from collections import Counter
HERE = Path(__file__).resolve().parent; ROOT = HERE.parents[2]; sys.path.insert(0, str(HERE))
import render
L = render.L
REFS = [ROOT / '.tmpwork/tohoku_ref'] + [ROOT / f'.tmpwork/{u}_ref' for u in ('hokudai', 'kobe', 'osaka', 'ritsu')]
GENERIC_OK = {('a', 'b', 'c', 'd'), ('b', 'c', 'd', 'e'), ('c', 'd', 'e', 'f')}
BANNED = ['的中', '必ず出る', '合格できる', 'MANATOBI MOCK EXAM SERIES']

def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')).strip()
def words(t): return [w.lower() for w in re.findall(r"[A-Za-z]+(?:'[a-z]+)?", norm(t))]
def jchars(t): return re.sub(r'[^\u3040-\u30ff\u4e00-\u9fff]', '', t)
def strip(t):
    t = re.sub(r'\{[ugw][^|]*\|([^}]*)\}', r'\1', t)
    return re.sub(r'\[\[[^\]]+\]\]|\{o\d\}', ' ', t).replace('*', '')
def collect(o, out):
    if isinstance(o, str): out.append(strip(o))
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
pos = Counter(); longest = [0, 0]

def quotes_ok(tag, texts, pool):
    for t in texts:
        for qt in re.findall(r'“([^”]+)”', t):
            for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                seg = seg.strip(' ,.;:!?"\'').lower()
                if len(seg) >= 8 and re.search(r'[a-z]{3}', seg) and seg not in pool: ng.append((tag, 'quote_not_found', seg[:80]))

def marks_ok(tag, rs, ans):
    for i, r in enumerate(rs):
        if not r.strip()[:1] in '○×': ng.append((tag, 'no_mark', i)); continue
        if (i in ans) != r.strip().startswith('○'): ng.append((tag, 'mark_mismatch', i))

def bias(ch, a):
    Ls = [len(c) for c in ch]; longest[1] += 1
    if Ls[a] == max(Ls) and Ls.count(max(Ls)) == 1 and max(Ls) > 1.4 * sorted(Ls)[-2]: longest[0] += 1

def check_q(tag, q, pool, P):
    k = q['kind']
    if k in ('mc1', 'tf2', 'insert'):
        ch = q['choices']
        if len(set(map(norm, ch))) != len(ch): ng.append((tag, 'dup_choice'))
        if len(q['reasons']) != len(ch): ng.append((tag, 'n_reasons'))
    if k == 'mc1':
        if len(q['choices']) != 4: ng.append((tag, 'mc1_n'))
        marks_ok(tag, q['reasons'], [q['answer']]); pos[(4, q['answer'])] += 1; bias(q['choices'], q['answer'])
        if q.get('blank') and f'[[{q["blank"]}]]' not in ' '.join(P['passage']): ng.append((tag, 'blank_missing', q['blank']))
        quotes_ok(tag, q['reasons'] + [q.get('note', '')], pool)
    elif k == 'tf2':
        if len(q['choices']) != 5 or len(set(q['answer'])) != 2: ng.append((tag, 'tf2_shape'))
        marks_ok(tag, q['reasons'], q['answer']); quotes_ok(tag, q['reasons'], pool)
    elif k == 'insert':
        v = list(q['answer'].values()); slots = list(q['answer'])
        if sorted(v) != list(range(len(q['choices']))): ng.append((tag, 'insert_answers', v))
        for s in slots:
            if f'[[{s}]]' not in ' '.join(P['passage']): ng.append((tag, 'insert_slot_missing', s))
        for s, i in q['answer'].items():
            if f'［{s}］' not in q['reasons'][i]: ng.append((tag, 'insert_reason_slot', s))
        quotes_ok(tag, q['reasons'], pool)
    elif k == 'gram2':
        labs = [r[0] for r in q['reasons']]; raw = ' '.join(P['passage'])
        if re.findall(r'\{g([ア-コ])\|', raw) != labs: ng.append((tag, 'gram_labels_order'))
        bad = [lab for lab, _, r in q['reasons'] if r.startswith('誤り')]
        if bad != q['answer'] or len(bad) != 2 or bad[0] not in 'アイウエオ' or bad[1] not in 'カキクケコ': ng.append((tag, 'gram_answer', bad))
        for lab, w, r in q['reasons']:
            if not (r.startswith('誤り') or r.startswith('正しい')): ng.append((tag, 'gram_reason_mark', lab))
            if f'{{g{lab}|{w}}}' not in raw: ng.append((tag, 'gram_text_mismatch', lab))
    elif k == 'order':
        ws = q['words']; c = q['correct']
        if sorted(c) != [L[i] for i in range(len(ws))]: ng.append((tag, 'order_not_perm'))
        built = ' '.join(ws[L.index(x)] for x in c)
        if built != q['sentence_part']: ng.append((tag, 'order_mismatch', built))
        if q['sentence_part'] not in q['sentence'].replace(',', ''): ng.append((tag, 'order_sentence'))
        if '{o%s}' % q['under'] not in ' '.join(P['passage']): ng.append((tag, 'order_slot_missing'))
        if f'下線部({q["under"]})' not in q['stem']: ng.append((tag, 'order_stem'))
        for p in q['ask']:
            if f'{p}番目' not in q['stem']: ng.append((tag, 'order_ask', p))
        ans = ' '.join(f'({c[p - 1]})' for p in q['ask'])
        if not all(f'({c[p - 1]})' in q['explain'][-1] for p in q['ask']): ng.append((tag, 'order_explain_answer', ans))
    elif k == 'synonym':
        raw = ' '.join(P['passage'])
        if re.findall(r'\{w([a-d])\|', raw) != [it['label'] for it in q['items']]: ng.append((tag, 'syn_labels'))
        for it in q['items']:
            if len(it['choices']) != 4 or len(set(it['choices'])) != 4: ng.append((tag, 'syn_choices', it['label']))
            if f'{{w{it["label"]}|{it["word"]}}}' not in raw: ng.append((tag, 'syn_word_mismatch', it['label']))
            pos[(4, it['answer'])] += 1
    else:
        quotes_ok(tag, q.get('explain', []), pool)

for R in rounds:
    D = importlib.import_module(f't{R}').DATA
    for part in ('I', 'II', 'III', 'IV'):
        texts = []; collect(D[part], texts)
        e4, j13 = overlaps(texts)
        rep[f'r{R}-{part}'] = dict(en4=e4, ja13=j13)
        if e4: ng.append((f'r{R}-{part}', 'en4', list(e4)))
        if j13: ng.append((f'r{R}-{part}', 'ja13', list(j13)))
        for b in BANNED:
            if any(b in t for t in texts): ng.append((f'r{R}-{part}', 'banned_word', b))
    for nm in D.get('names', []):
        if re.search(r'\b' + re.escape(nm) + r'\b', ALLSRC): ng.append((f'r{R}', 'name_in_past', nm))
    for n in ('I', 'II'):
        P = D[n]; tag = f'r{R}-{n}'; raw = ' '.join(P['passage'])
        pool = norm(' '.join(render.filled(P))).lower()
        pool += ' ' + ' '.join(norm(c).lower() for q in P['questions'] for c in q.get('choices', []))
        unders = re.findall(r'\{u(\d)\|', raw) + re.findall(r'\{o(\d)\}', raw)
        if sorted(unders) != [str(i) for i in range(1, len(unders) + 1)]: ng.append((tag, 'underline_numbers', unders))
        order_seen = [m.group(1) or m.group(2) for m in re.finditer(r'\{u(\d)\||\{o(\d)\}', raw)]
        if order_seen != sorted(order_seen): ng.append((tag, 'underline_order', order_seen))
        stems = ' '.join(q['stem'] for q in P['questions'])
        for u in unders:
            if f'下線部({u})' not in stems: ng.append((tag, 'underline_not_asked', u))
        for b in re.findall(r'\[\[(I|II|III)\]\]', raw):
            if f'[ {b} ]' not in stems and f'( {b} )' not in stems: ng.append((tag, 'blank_not_asked', b))
        if [q['no'] for q in P['questions']] != list(range(1, len(P['questions']) + 1)): ng.append((tag, 'q_numbers'))
        for q in P['questions']: check_q(f'{tag}-Q{q["no"]}', q, pool, P)
        if len(P['translation']) != len(P['passage']): ng.append((tag, 'translation_paragraphs', len(P['translation']), len(P['passage'])))
    P3 = D['III']; tag = f'r{R}-III'
    conv = ' '.join(t for _, t in P3['lines'])
    if [m for m in re.findall(r'\{w(\d)\|', conv)] != [it['label'] for it in P3['q1']['items']]: ng.append((tag, 'w_labels'))
    for it in P3['q1']['items']:
        if f'{{w{it["label"]}|{it["word"]}}}' not in conv: ng.append((tag, 'w_word_mismatch', it['label']))
        if len(set(it['choices'])) != 4: ng.append((tag, 'w_choices', it['label']))
        pos[(4, it['answer'])] += 1
    if len(P3['translation']) != len(P3['lines']): ng.append((tag, 'translation_lines', len(P3['translation']), len(P3['lines'])))
    if len(P3['q2']['models']) < 2: ng.append((tag, 'models'))
    P4 = D['IV']; tag = f'r{R}-IV'; raw = ' '.join(P4['passage'])
    for q in P4['questions']:
        if f'下線部({q["no"]})' not in q['stem'] or f'{{u{q["no"]}|' not in raw: ng.append((tag, 'iv_underline', q['no']))
        if q['kind'] == 'trans_en':
            m = re.search(r'\{u%d\|([^}]*)\}' % q['no'], raw)
            if not m or m.group(1) != q['source']: ng.append((tag, 'iv_source_mismatch', q['no']))
        else:
            if len(q['options']) != 10 or len(set(q['options'])) != 10: ng.append((tag, 'iv_options', q['no']))
            if len(q['correct']) != 8 or len(set(q['correct'])) != 8: ng.append((tag, 'iv_correct', q['no']))
            if sorted(q['options'], key=str.lower) != q['options'] and q['no'] == 0: pass
            exp = q['explain'][-1]
            for i, mk in q['marks'].items():
                if f'{mk} {q["options"][L.index(q["correct"][int(i) - 1])]} ({q["correct"][int(i) - 1]})' not in exp: ng.append((tag, 'iv_explain_answer', q['no'], mk))

# 題材の近さ：公開されている過去の会話文（Ⅲ）と北大・神戸大などの長文に対して
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
        D = importlib.import_module(f't{R}').DATA
        for part in ('I', 'II'): mk.append(f'r{R}-{part}'); mt.append(' '.join(render.filled(D[part])))
        mk.append(f'r{R}-III'); mt.append(' '.join(strip(t) for _, t in D['III']['lines']))
    v = TfidfVectorizer(stop_words='english', sublinear_tf=True).fit(pt + mt)
    S = cosine_similarity(v.transform(mt), v.transform(pt)); SP = cosine_similarity(v.transform(pt))
    pp = sorted(SP[i][j] for i in range(len(pk)) for j in range(i + 1, len(pk)))
    rep['topic'] = {k: (round(float(S[i].max()), 3), pk[S[i].argmax()]) for i, k in enumerate(mk)}
    rep['topic_past_ref'] = dict(n=len(pk), median=round(float(pp[len(pp) // 2]), 3), max=round(float(pp[-1]), 3))
    for k, (s, _) in rep['topic'].items():
        if s >= rep['topic_past_ref']['max']: ng.append((k, 'topic_too_close', s))
except Exception as ex:
    rep['topic_error'] = str(ex)

FIXED = re.findall(r"'([^'\n]{8,})'|\"([^\"\n]{8,})\"", open(HERE / 'render.py').read())
fe, fj = overlaps([a or b for a, b in FIXED])
rep['render_fixed'] = dict(en4=sorted(fe), ja13=sorted(fj))
if fe or fj: ng.append(('render.py', 'fixed_text_overlap', sorted(fe) + sorted(fj)))
for b in BANNED[:3]:
    if b in open(HERE / 'render.py').read(): ng.append(('render.py', 'banned_word', b))
rep['answer_positions'] = {f'{n}択-{L[p]}': c for (n, p), c in sorted(pos.items())}
rep['far_longest_answer'] = f'{longest[0]}/{longest[1]}'
if longest[1] and longest[0] / longest[1] > 0.2: ng.append(('all', 'longest_answer_bias', rep['far_longest_answer']))
cs = [pos.get((4, p), 0) for p in range(4)]
if sum(cs) >= 8 and max(cs) - min(cs) > max(2, sum(cs) // 4): ng.append(('all', 'position_bias_4', cs))
rep['ng'] = ng
(HERE / 'logs').mkdir(exist_ok=True)
json.dump(rep, open(HERE / 'logs/check.json', 'w'), ensure_ascii=False, indent=1, default=list)
print(json.dumps({k: v for k, v in rep.items() if k in ('topic', 'topic_past_ref', 'render_fixed', 'answer_positions', 'far_longest_answer', 'ng', 'topic_error')}, ensure_ascii=False, indent=1, default=list))
sys.exit(1 if ng else 0)
