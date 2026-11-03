import os as _os
from pathlib import Path as _P
# 過去問の OCR などの照合用データ（著作物のため git に入れない）。既定は .tmpwork/kobe_ref/{ocr,analysis}
REF_DIR = _P(_os.environ.get('KOBE_REF_DIR', str(_P(__file__).resolve().parents[3] / '.tmpwork/kobe_ref')))
import sys, re, json, importlib
from wordfreq import zipf_frequency as z
sys.path.insert(0, str(_P(__file__).resolve().parent))
R=sys.argv[1] if len(sys.argv)>1 else '1'
P={k:importlib.import_module(f'r{R}_{k}').PART for k in ['I','II','III','IV']}
REF=json.load(open(REF_DIR / 'analysis/stats_full.json'))
def strip(t): return re.sub(r'\{[a-z0-9]+\|([^}]*)\}',r'\1',t).replace('*','')
def norm(t): return t.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"')
SPLIT=r'(?<=[.?!])["\']?\s+(?=["\']?(?:\(\s*[A-Za-z]\s*\)|\(|[A-Z]))'
def wc(x): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'\-]*",x))
log={}
rng={'ev':[REF[k] for k in REF if not k.endswith('III')],'nv':[REF[k] for k in REF if k.endswith('III')]}
for k in ['I','II','III']:
    t=norm(' '.join(strip(p) for p in P[k]['passage']))
    S=[x for x in re.split(SPLIT,t) if re.search(r'[A-Za-z]{2}',x)]; sl=[wc(x) for x in S]
    toks=[w.lower() for w in re.findall(r"[A-Za-z]+",t)]
    caps=set(w.lower() for w in re.findall(r"(?<![.?!\"]\s)\b[A-Z][a-z]+",t))
    cont=[w for w in toks if w not in caps and (len(w)>1)]
    q=re.findall(r'"([^"]*)"',t); qw=sum(wc(x) for x in q)
    d=dict(words=wc(t),paras=len(P[k]['passage']),sents=len(S),avg=round(sum(sl)/len(S),1),maxs=max(sl),
           zipf_lt4=round(sum(1 for w in cont if z(w,'en')<4)/len(cont)*100,1),zipf_lt3=round(sum(1 for w in cont if z(w,'en')<3)/len(cont)*100,1),
           dialog=round(qw/wc(t)*100),notes=len(P[k].get('notes',[])))
    ref=rng['nv'] if k=='III' else rng['ev']
    chk={}
    for m in ['words','avg','zipf_lt4','zipf_lt3']:
        lo=min(r[m] for r in ref); hi=max(r[m] for r in ref); chk[m]=f'{lo}–{hi}:'+('OK' if lo<=d[m]<=hi else 'NG')
    d['range']=chk; log[k]=d
# Japanese char counts / English word counts
def jlen(s): return len(s.replace('\n',''))
jl=[]
for k in ['I','II','III']:
    for q in P[k]['questions']:
        if q['kind']=='ja_limit':
            for a in [q['answer']]+q['alts']: jl.append((k,q['no'],q['limit'],jlen(a),'OK' if jlen(a)<=q['limit'] and jlen(a)>=q['limit']*0.8 else 'NG'))
log['ja_limits']=jl
ew=[]
for q in P['IV']['questions']:
    for lab,m in q['models']:
        n=wc(m); tg=q['target']; ew.append((q['no'],lab,tg,n,'OK' if abs(n-tg)<=tg*0.15 else 'NG'))
log['en_models']=ew
# plagiarism: 5-gram overlap with past papers + answers
src=''
import glob
for f in glob.glob(str(REF_DIR / 'ocr/*.txt')): src+=' '+open(f).read()
def grams(t,n=5):
    w=[x.lower() for x in re.findall(r"[A-Za-z]+",norm(t))]
    return set(tuple(w[i:i+n]) for i in range(len(w)-n+1))
SG=grams(src)
mine=''
for k in ['I','II','III']:
    mine+=' '.join(strip(p) for p in P[k]['passage'])
    for q in P[k]['questions']:
        for key in ['choices']: mine+=' '+' '.join(q.get(key,[]) if isinstance(q.get(key,[]),list) else [])
        for it in q.get('items',[]): mine+=' '+' '.join(it['choices'])
        for r in q.get('rows',[]): mine+=' '+' '.join(r)
for q in P['IV']['questions']: mine+=' '+q['stem']+' '+' '.join(m for _,m in q['models'])
mine+=' '+P['IV']['intro_en']
hits=sorted(' '.join(g) for g in grams(mine)&SG)
log['plagiarism_5gram_hits']=hits
# common-phrase whitelist judgement left to report
# choice-set overlap with past synonym questions
past_words={'boils down to','inherent','accounted for','on the go','embrace','ties','driver of','a range of issues','in the big picture','elation','enhanced','ongoing','pondering','solidifies','deployed','advance','orbiting','psychology','gains','pinning down','ushers in','succinctly','drawn to','imminent','long shot','look up to','out of my mind','stay put','cutting it fine'}
used=[it['word'] for k in ['I','II','III'] for q in P[k]['questions'] for it in q.get('items',[]) if 'word' in it]
log['underlined_overlap_with_past']=[w for w in used if w.lower() in past_words]
json.dump(log,open(_P(__file__).resolve().parent / f'logs/verify_r{R}.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(log,ensure_ascii=False,indent=1))
