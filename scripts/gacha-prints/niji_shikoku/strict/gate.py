"""厳格ゲート：英語5語以上（記号の並びを除く）・日本語10字以上（固有名詞を除く）の一致を0件にする"""
import sys
argv=sys.argv[1:]; sys.argv=['x']; exec(open('/home/user/work/strict/strict.py').read().split("report = {}")[0])
LAB=set('abcdefgh'); PROPER=('高知大学医学部医学科','愛媛大学医学部医学科','鳥取大学')
tot=0
for slug in argv:
  for f in sorted(glob.glob(f'/home/user/work/niji/out/{slug}[0-9]_[qa].html')):
    t=text_of(f); toks=en_tokens(t); j=ja_chars(t); name=f.split('/')[-1]; hits=set()
    for i in range(len(toks)-4):
        g=tuple(toks[i:i+4])
        if g in src_en4:
            for k in src_en4[g]:
                s=' '+' '.join(src_entok[k])+' '
                if (' '+' '.join(toks[i:i+5])+' ') in s:
                    m=5
                    while i+m<len(toks) and (' '+' '.join(toks[i:i+m+1])+' ') in s: m+=1
                    p=toks[i:i+m]
                    if sum(w not in LAB for w in p)>=4: hits.add('EN: '+' '.join(p)+'  <- '+k)
    for i in range(len(j)-9):
        g=j[i:i+8]
        if g in src_ja8:
            for k in src_ja8[g]:
                if j[i:i+10] in src_ja[k]:
                    m=10
                    while i+m<len(j) and j[i:i+m+1] in src_ja[k]: m+=1
                    p=j[i:i+m]
                    if not any(x in p for x in PROPER) and not any(s in p for s in ('解答用紙に記入','日本語に訳しなさい','英語に訳しなさい')): hits.add('JA: '+p+'  <- '+k)
    tot+=len(hits)
    for h in sorted(hits): print(name, h)
print('TOTAL', tot)
