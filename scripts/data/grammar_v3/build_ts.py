"""normalized.json → src/data/egV3Items.generated.ts（アプリ用・統一形式）
統一形式（3つの納品のうち最も情報量の多い第8〜11章 v3 の形にそろえる）:
  【着眼点】→【ポイント】→ 選択肢ごとの ○／× の理由 →【プラス】
  和訳は「完成した英文」の枠に出す。元データに無い段は作らない（でっち上げない）。"""
import json, os, re
HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '../../..'))
d = json.load(open(os.path.join(HERE, 'normalized.json')))
MARKS = ['①', '②', '③', '④']
def count_word(text, phrase):
    return len(re.findall(r'(?<![A-Za-z])' + re.escape(phrase) + r'(?![A-Za-z])', text, re.I))

def marked(r, ans):
    # 完成文に同じ語が2回出るとき（as … as など）は、空所の直後の語まで含めて1か所に絞る
    full = r['full']
    if count_word(full, ans) <= 1: return ans
    m = re.search(r'______\s*([A-Za-z\'’]+)', r['prompt'])
    if m and count_word(full, ans + ' ' + m.group(1)) == 1: return ans + ' ' + m.group(1)
    m = re.search(r'([A-Za-z\'’]+)\s*______', r['prompt'])
    if m and count_word(full, m.group(1) + ' ' + ans) == 1: return m.group(1) + ' ' + ans
    return ans

items = []
for r in d:
    ans = r['options'][r['answerIndex']]
    lines = []
    if r['hint']: lines.append(f"【着眼点】{r['hint']}")
    point = r.get('body') or r['point']
    lines.append(f"【ポイント】{point}")
    lines.append('【選択肢】')
    for i, (o, w) in enumerate(zip(r['options'], r['why'])):
        ok = i == r['answerIndex']
        lines.append(f"{MARKS[i]} {o}　{'○' if ok else '×'} {w}")
    if r['plus']: lines.append(f"【プラス】{r['plus']}")
    # 「押さえたい表現」に出す一言：12〜16章は一言ポイント、ほかは文法事項名（【ポイント】と重ねない）
    meaning = r['point'] if r['src'] == 'C' else r['grammar']
    theme = ''
    items.append(dict(c=r['chapter'], t=r['chapterTitle'], n=r['no'], g=r['grammar'], s=r['prompt'],
                      o=r['options'], a=r['answerIndex'], f=r['full'], tr=r['translation'],
                      k=marked(r, ans), km=meaning, th=theme, cm=lines, tl=r['timeLimit'], one=f"{ans}。{r['point']}"[:120]))
out = os.path.join(ROOT, 'src/data/egV3Items.generated.ts')
with open(out, 'w') as fp:
    fp.write("/**\n * 英文法 第1〜20章 4択（全%d問）※自動生成・手で編集しないこと\n" % len(items))
    fp.write(" * 元データ: scripts/data/grammar_v3/normalized.json（normalize.py → build_ts.py）\n */\n")
    fp.write("export type EgV3Item = { c: number; t: string; n: number; g: string; s: string; o: [string, string, string, string]; a: 0 | 1 | 2 | 3; f: string; tr: string; k: string; km: string; th: string; cm: string[]; tl: number; one: string };\n")
    fp.write("export const EG_V3_ITEMS: readonly EgV3Item[] = JSON.parse(%s);\n" % json.dumps(json.dumps(items, ensure_ascii=False), ensure_ascii=False))
print('wrote', out, len(items))
