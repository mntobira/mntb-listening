#!/usr/bin/env python3
"""
英文解釈の重要表現 ↔ 単語帳（public/data/listeningVocabulary.json）の語を突き合わせ、
src/data/reading/vocabLinks.generated.ts を書き出す（2026-10-31）。
  入力：.tmp_ui/phrases.json（npx tsx scripts/reading/dump_phrases.mts > .tmp_ui/phrases.json）
  番号は単語帳と同じ「レベルごとに1から」（vocabQuiz.wordNumbers と同じ数え方）。
  一致のしかた：~ ／ A B ／ one's ／ do などの記号を「□」にそろえ、語の並びが完全に同じものだけ（あいまい一致はしない）。
"""
import json, re, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
vocab = json.load(open(os.path.join(ROOT, 'public/data/listeningVocabulary.json')))['words']
phr = json.load(open(os.path.join(ROOT, '.tmp_ui/phrases.json')))

PH = '□'
def norm(s):
    """記号（~ ／ A B ／ one's ／ do・doing ／ ~ing）は「□」1つに置き換えて残す（消すと take place と take one's place が同じになる）。
    （）の中は省いてよい語なので外す。先頭・末尾の □ は外す（despite ~ ＝ despite）。"""
    s = s.replace('’', "'")
    s = re.sub(r'\(.*?\)|（.*?）', ' ', s)
    s = re.sub(r"\.\.\.|[~～〜…]", ' ~ ', s)
    out = []
    for t in re.split(r'[\s,]+', s):
        if not t: continue
        if t in ('A', 'B', 'S', 'V', 'C', 'O', '~', "one's", 'do', 'doing', 'p.p.') or t.startswith('~'):
            t = PH
        else:
            t = t.lower()
        if t == PH and out and out[-1] == PH: continue
        out.append(t)
    while out and out[0] == PH: out.pop(0)
    while out and out[-1] == PH: out.pop()
    return ' '.join(out)

num, index = {}, {}
for w in vocab:
    num[w['level']] = num.get(w['level'], 0) + 1
    key = norm(w['word'])
    if key and key not in index:
        index[key] = (w['id'], w['level'], num[w['level']], w['word'])

links, miss = {}, []
for p in phr:
    for en, ja in p['phrases']:
        if en in links: continue
        k = norm(en)
        hit = index.get(k)
        # 1語だけの表現は単語帳の単語とも一致させる（almost doubled → 一致させない：2語）
        if hit: links[en] = {'id': hit[0], 'level': hit[1], 'no': hit[2], 'word': hit[3]}
        else: miss.append(en)

out = os.path.join(ROOT, 'src/data/reading/vocabLinks.generated.ts')
with open(out, 'w') as f:
    f.write('/**\n * 英文解釈の重要表現 → 単語帳の語（レベル・番号）※自動生成・手で編集しないこと\n'
            ' * 作り方：scripts/reading/match_vocab.py（語の並びが同じものだけ。あいまい一致はしない）\n */\n')
    f.write('export interface ReadingVocabLink { id: string; level: string; no: number; word: string }\n')
    f.write('export const READING_VOCAB_LINKS: Readonly<Record<string, ReadingVocabLink>> = ')
    f.write(json.dumps(links, ensure_ascii=False, indent=1, sort_keys=True))
    f.write(';\n')
print('linked', len(links), '/', len(links) + len(miss))
print('miss sample', miss[:60])
