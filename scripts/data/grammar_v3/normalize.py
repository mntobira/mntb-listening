"""3つの納品データ（1-7章 / 8-11章 / 12-16章）を1つの形にそろえる。
内部用の番号対応表は読まない。出力: scripts/data/grammar_v3/normalized.json"""
import json, glob, re, sys, os
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), 'normalized.json')
TITLES = {1:'時制',2:'態',3:'助動詞',4:'仮定法',5:'不定詞',6:'動名詞',7:'分詞'}
BLANK = '______'

def sect(text, name):
    m = re.search(r'【' + name + r'】(.*?)(?=\n?【|$)', text, re.S)
    return m.group(1).strip() if m else ''

def fill(prompt, answer):
    # 書き換え問題は (b) の文だけを完成文にする
    lines = [l for l in prompt.split('\n') if l.strip()]
    target = next((l for l in lines if re.search(r'\(\s*\)|（\s*）', l)), lines[-1])
    target = re.sub(r'^\s*\([ab]\)\s*', '', target)
    target = re.sub(r'^【並べかえ】\s*「[^」]*」\s*', '', target)
    return re.sub(r'\(\s*\)|（\s*）', answer, target, count=1).strip()

def blankify(prompt):
    return re.sub(r'\(\s*\)|（\s*）', BLANK, prompt, count=1)

out = []
# ---- 1-7章 ----
for f in sorted(glob.glob(f'{SRC}/マナトビ_英文法_1-7章*/grammar_ch1-7/english_grammar.ch?.json')):
    for x in json.load(open(f)):
        ch = int(x['source']['chapterId'].replace('eg_ch', ''))
        ex = x['explanation']
        ans = next(o for o in x['options'] if o['correct'])['text']
        tr = sect(ex, '訳')
        reorder = x['prompt'].startswith('【並べかえ】')
        if reorder:
            m = re.search(r'「([^」]*)」', x['prompt']); tr = m.group(1) if m else ''
        out.append(dict(chapter=ch, chapterTitle=TITLES[ch], no=x['number'], grammar=x['grammar'],
            prompt=blankify(x['prompt']), options=[o['text'] for o in x['options']],
            answerIndex=[o['correct'] for o in x['options']].index(True),
            why=[o['why'] for o in x['options']], translation=tr, full=fill(x['prompt'], ans),
            hint='', point=sect(ex, 'ポイント'), plus=sect(ex, '注意'), timeLimit=x['timeLimit'], src='A'))
# ---- 8-11章 ----
for x in json.load(open(glob.glob(f'{SRC}/manatobi_grammar_ch08-11*/english_grammar_ch08-11_all.json')[0])):
    ans = x['options'][x['answerIndex']]['text']
    out.append(dict(chapter=x['chapter'], chapterTitle=x['chapterTitle'], no=x['number'], grammar=x['grammarPoint'],
        prompt=blankify(x['prompt']), options=[o['text'] for o in x['options']], answerIndex=x['answerIndex'],
        why=[o['why'] for o in x['options']], translation=x['translation'], full=fill(x['prompt'], ans),
        hint=x['hint'], point=sect(x['explanation'], 'ポイント'), plus=x['plusNote'], timeLimit=x['timeLimit'], src='B'))
# ---- 12-16章 ----
for x in json.load(open(glob.glob(f'{SRC}/manatobi_grammar_ch12-16*/manatobi_grammar_ch12-16.json')[0])):
    t = 25 if x['originalFormat'] != '空所補充' else 20
    out.append(dict(chapter=x['chapter'], chapterTitle=x['chapterTitle'], no=x['no'], grammar=x['pointTitle'],
        prompt=blankify(x['question']), options=x['options'], answerIndex=x['answerIndex'],
        why=[re.sub(r'^[○×]\s*', '', n) for n in x['optionNotes']], translation=x['japanese'],
        full=fill(x['question'], x['answer']), hint='', point=x['point_summary'], plus='',
        body=x['explanation'], timeLimit=t, src='C'))

# ---- 12〜16章の「→ Point 120」はアプリに無い番号なので「→ 第13章 No.x〜y」に置き換える ----
C12 = json.load(open(glob.glob(f'{SRC}/manatobi_grammar_ch12-16*/manatobi_grammar_ch12-16.json')[0]))
pt = {}
for x in C12:
    pt.setdefault(x['point'], []).append((x['chapter'], x['no']))
def ref(m):
    rows = pt.get(int(m.group(1)))
    if not rows: return ''
    ch = rows[0][0]; nos = [n for c, n in rows if c == ch]
    return f"→ 第{ch}章 No.{min(nos)}〜{max(nos)}" if len(nos) > 1 else f"→ 第{ch}章 No.{nos[0]}"
for r in out:
    for k in ('body', 'point', 'plus'):
        if r.get(k): r[k] = re.sub(r'→\s*Point\s*(\d+)', ref, r[k])

# ---- 検査 ----
bad = []
for r in out:
    if len(r['options']) != 4 or len(set(r['options'])) != 4: bad.append(('options', r['chapter'], r['no']))
    if BLANK not in r['prompt']: bad.append(('blank', r['chapter'], r['no']))
    if not r['translation']: bad.append(('translation', r['chapter'], r['no']))
    if not all(r['why']): bad.append(('why', r['chapter'], r['no']))
print('total', len(out), 'bad', bad[:20], len(bad))
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
