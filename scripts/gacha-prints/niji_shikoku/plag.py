"""盗用チェック：書き下ろしの HTML と、公開過去問・解答例のテキストの連続一致（英語5語・日本語12字）を数える。
  python3 plag.py kagawa tokushima ...   （out/ の <slug>N_[qa].html が対象）
"""
import re, sys, glob, html

SRC = glob.glob('/home/user/work/shikoku/*/*.txt') + glob.glob('/home/user/work/sanin/*/*.txt')
# 試験の決まり文句（大学をまたいで誰でも書く定型）は一致しても数えない
STOCK_JA = ('解答用紙', '問題冊子', '受験番号', '試験開始', '日本語に訳しなさい', '英語に訳しなさい', '選びなさい')


def en_tokens(t):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", t.lower().replace('’', "'"))


def ja_chars(t):
    return ''.join(re.findall(r'[\u3040-\u30ff\u3400-\u9fff々ー]', t))


def grams(seq, n, join):
    return {join(seq[i:i + n]) for i in range(len(seq) - n + 1)}


src_en, src_ja = set(), set()
for p in SRC:
    t = open(p, errors='ignore').read()
    src_en |= grams(en_tokens(t), 5, ' '.join)
    src_ja |= grams(ja_chars(t), 12, ''.join)

total = 0
for pat in sys.argv[1:]:
    for f in sorted(glob.glob(f'/home/user/work/niji/out/{pat}[0-9]_[qa].html')):
        t = html.unescape(re.sub(r'<style.*?</style>|<[^>]+>', ' ', open(f).read(), flags=re.S))
        e = sorted(grams(en_tokens(t), 5, ' '.join) & src_en)
        j = sorted(g for g in grams(ja_chars(t), 12, ''.join) & src_ja if not any(s in g for s in STOCK_JA))
        total += len(e) + len(j)
        extra = ('\n   ' + ' | '.join(e[:15] + j[:15])) if e or j else ''
        print(f'== {f.split("/")[-1]}: EN5={len(e)} JA12={len(j)}{extra}')
print('TOTAL', total)
