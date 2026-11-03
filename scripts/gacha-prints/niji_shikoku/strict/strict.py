"""厳格な盗用チェック（2026-11-03）
  基準（前回の 英5語・日12字 より厳しく）：
   A. 英語4語の連続一致（機能語だけの4語は除く）
   B. 日本語8字の連続一致（試験の決まり文句は除く）
   C. 最長一致：英語は連続何語、日本語は連続何字が一致するか（ファイルごとの最大）
   D. 内容語の重なり：書き下ろしの各大問と過去問の各ファイルで、内容語（機能語以外・4字以上）の
      Jaccard と「過去問側の語のうち何割を使っているか」。話題・語彙の流用（翻案）の目安
  python3 strict.py [slug...]
"""
import re, sys, glob, html, json, collections

SRC = sorted(set(glob.glob('/home/user/work/shikoku/*/*.txt')) | set(glob.glob('/home/user/work/sanin/*/*.txt')) - set(glob.glob('/home/user/work/shikoku/*/senbatsu.txt'))
     - set(glob.glob('/home/user/work/shikoku/toku/list.txt')) - set(glob.glob('/home/user/work/shikoku/kaga/youkou.txt')))
STOP = set("""a an the and or but if of to in on at by for with from as is are was were be been being am do does did have has had
i you he she it we they me him her us them my your his its our their this that these those there here what which who whom whose
when where why how not no so than then too very can could will would shall should may might must also just only into out up down
over under about after before because while all any some each more most other such own same both few s t don one two""".split())
STOCK_JA = ('解答用紙', '問題冊子', '受験番号', '試験開始', '日本語に訳しなさい', '英語に訳しなさい', '選びなさい', '答えなさい',
            '次の英文を読んで', '記入しなさい', '大学とは関係', '過去問', '予想問題', '問題', '解答', '解説', '番号', '下線部')

def en_tokens(t): return re.findall(r"[a-z]+(?:'[a-z]+)?", t.lower().replace('’', "'"))
def ja_chars(t): return ''.join(re.findall(r'[\u3040-\u30ff\u3400-\u9fff々ー]', t))

src_texts = {p.replace('/home/user/work/shikoku/', ''): open(p, errors='ignore').read() for p in SRC}
src_en4 = collections.defaultdict(set); src_ja8 = collections.defaultdict(set)
src_entok = {}; src_ja = {}
for k, t in src_texts.items():
    toks = en_tokens(t); src_entok[k] = toks; j = ja_chars(t); src_ja[k] = j
    for i in range(len(toks) - 3):
        g = tuple(toks[i:i + 4])
        if not all(w in STOP for w in g): src_en4[g].add(k)
    for i in range(len(j) - 7): src_ja8[j[i:i + 8]].add(k)

def longest_run_en(toks, src_set_by_n):
    # 一致する最長の連続語数（4語一致を起点に伸ばす）
    best, where = 0, ''
    i = 0
    while i < len(toks) - 3:
        g = tuple(toks[i:i + 4])
        if g in src_en4:
            n = 4
            for k in src_en4[g]:
                s = ' '.join(src_entok[k]); m = 4
                while i + m < len(toks) and (' ' + ' '.join(toks[i:i + m + 1]) + ' ') in (' ' + s + ' '): m += 1
                if m > best: best, where = m, ' '.join(toks[i:i + m]) + f'  ⟵ {k}'
        i += 1
    return best, where

def longest_run_ja(j):
    best, where = 0, ''
    for i in range(len(j) - 7):
        g = j[i:i + 8]
        if g in src_ja8 and not any(s in g for s in STOCK_JA):
            for k in src_ja8[g]:
                m = 8
                while i + m < len(j) and j[i:i + m + 1] in src_ja[k]: m += 1
                if m > best: best, where = m, j[i:i + m] + f'  ⟵ {k}'
    return best, where

def content(toks): return {w for w in toks if w not in STOP and len(w) >= 4}
src_content = {k: content(v) for k, v in src_entok.items() if len(v) > 200}

def text_of(f): return html.unescape(re.sub(r'<style.*?</style>|<[^>]+>', ' ', open(f).read(), flags=re.S))

report = {}
slugs = sys.argv[1:]
for slug in slugs:
    for f in sorted(glob.glob(f'/home/user/work/niji/out/{slug}[0-9]_[qa].html')):
        name = f.split('/')[-1]; t = text_of(f); toks = en_tokens(t); j = ja_chars(t)
        en4 = sorted({' '.join(toks[i:i + 4]) for i in range(len(toks) - 3) if tuple(toks[i:i + 4]) in src_en4})
        ja8 = sorted({j[i:i + 8] for i in range(len(j) - 7) if j[i:i + 8] in src_ja8 and not any(s in j[i:i + 8] for s in STOCK_JA)})
        le, lw = longest_run_en(toks, None); lj, ljw = longest_run_ja(j)
        mine = content(toks); ov = []
        for k, sc in src_content.items():
            inter = mine & sc
            if not sc: continue
            ov.append((round(len(inter) / len(mine | sc), 3), round(len(inter) / len(sc), 3), k))
        ov.sort(reverse=True)
        report[name] = dict(en4=en4, ja8=ja8, en_longest=[le, lw], ja_longest=[lj, ljw], overlap_top=ov[:3])
        print(f'== {name}: EN4={len(en4)} JA8={len(ja8)} 最長 EN={le}語 JA={lj}字  語彙重なり最大 J={ov[0][0] if ov else 0} ({ov[0][2] if ov else "-"})')
        if le >= 6: print('   EN最長:', lw)
        if lj >= 10: print('   JA最長:', ljw)
json.dump(report, open('/home/user/work/strict/report.json', 'w'), ensure_ascii=False, indent=1)
