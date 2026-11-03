"""言い換え（翻案）検出：書き下ろしの英文1文ごとに、過去問の全文と内容語の重なりを比べる。
   旗：共有内容語5語以上 かつ 自分の文の内容語の55%以上が同じ過去問の1文に含まれる"""
import sys,re,glob
sys.argv=['x']; exec(open('/home/user/work/strict/strict.py').read().split("report = {}")[0])
def sents(t): return [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', t) if len(s.split())>=6]
src_s=[]
for k,t in src_texts.items():
    for s in sents(t):
        c=content(en_tokens(s))
        if len(c)>=4: src_s.append((k,s,c))
flags=0
for f in sorted(glob.glob('/home/user/work/niji/out/*[0-9]_[qa].html')):
    name=f.split('/')[-1]
    for s in sents(text_of(f)):
        c=content(en_tokens(s))
        if len(c)<6: continue
        best=max(((len(c&sc)/len(c),len(c&sc),k,ss) for k,ss,sc in src_s), default=(0,0,'',''))
        if best[1]>=5 and best[0]>=0.55:
            flags+=1; print(f'{name} {best[0]:.2f}/{best[1]}\n   自作: {s[:160]}\n   過去: {best[3][:160]}  <- {best[2]}')
print('FLAGS',flags)
