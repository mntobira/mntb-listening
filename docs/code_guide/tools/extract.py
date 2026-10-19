"""
各ファイルの中身から事実を抜き出す（カルテの「くわしく」「つながり」「規模」の材料）。
  - 行数（wc -l と同じ：改行の数）
  - 先頭の説明コメント（/** */ か // の連続）
  - export している名前
  - import している相対パス（解決後のパス）と、外部パッケージ
  - 逆引き：このファイルを import しているファイル
推測は入れない。読めたものだけを JSON にする。
"""
import json, os, re, sys
ROOT = sys.argv[1]
files = [l.rstrip('\n') for l in open(sys.argv[2], encoding='utf-8') if l.strip()]
EXTS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.css', '.json']
CODE = re.compile(r'\.(ts|tsx|mts|mjs|js|jsx|cjs)$')

def read(p):
    try: return open(os.path.join(ROOT, p), encoding='utf-8', errors='replace').read()
    except Exception: return ''

def resolve(src, spec):
    if not spec.startswith('.'): return None
    base = os.path.normpath(os.path.join(os.path.dirname(src), spec))
    for e in EXTS:
        if os.path.isfile(os.path.join(ROOT, base + e)): return base + e
    for e in EXTS[1:]:
        c = os.path.join(base, 'index' + e)
        if os.path.isfile(os.path.join(ROOT, c)): return c
    return None

def head_comment(t):
    """ファイル先頭付近の説明コメントを返す。@license だけのブロック・ファイル名だけの行は飛ばす"""
    t = t.lstrip('\ufeff')
    t = re.sub(r'^(#!.*\n)', '', t)
    blocks = []
    for m in re.finditer(r'/\*\*?([\s\S]*?)\*/', t[:12000]):
        if t[:m.start()].count('\n') > 60: break
        body = [re.sub(r'^\s*\*\s?', '', l).rstrip() for l in m.group(1).split('\n')]
        body = [x for x in body if x and not set(x) <= set('=-*_─ ') and not x.startswith('@license') and not x.startswith('SPDX-')]
        if body: blocks.append(' '.join(body))
        if sum(len(b) for b in blocks) > 120: break
    if not blocks:
        lines = []
        for l in t.split('\n')[:40]:
            s = l.strip()
            if s.startswith('//'):
                x = s[2:].strip()
                if x and not re.fullmatch(r'src/[\w./-]+', x): lines.append(x)
            elif s.startswith('#') and not s.startswith('#!'): lines.append(s[1:].strip())
            elif lines and not s: break
        blocks = [' '.join(lines)]
    txt = ' '.join(blocks)
    return re.sub(r'\s+', ' ', txt)[:900]

out = {}
for f in files:
    t = read(f)
    rec = {'lines': t.count('\n'), 'bytes': len(t.encode('utf-8'))}
    if CODE.search(f):
        code = re.sub(r'/\*[\s\S]*?\*/', '', t); code = re.sub(r'^\s*//.*$', '', code, flags=re.M)
        specs = re.findall(r'''(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)''', code)
        specs = [a or b or c or d for a, b, c, d in specs]
        rec['imports'] = sorted({r for s in specs if (r := resolve(f, s))})
        rec['packages'] = sorted({('/'.join(s.split('/')[:2]) if s.startswith('@') else s.split('/')[0]) for s in specs if not s.startswith('.') and not s.startswith('/')})
        ex = re.findall(r'export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|class|interface|type|enum)\s+([A-Za-z0-9_$]+)', code)
        ex += [n.strip().split(' as ')[-1] for grp in re.findall(r'export\s*\{([^}]*)\}', code) for n in grp.split(',') if n.strip()]
        if re.search(r'export\s+default\b', code) and 'default' not in ex: ex.append('default')
        rec['exports'] = list(dict.fromkeys(ex))[:30]
        rec['comment'] = head_comment(t)
    elif f.endswith('.css'):
        rec['comment'] = head_comment(t)
        rec['imports'] = []
    elif f.endswith('.md'):
        hs = re.findall(r'^#{1,3}\s+(.+)$', t, re.M)[:8]
        rec['headings'] = hs
        first = next((l.strip() for l in t.split('\n') if l.strip() and not l.startswith('#')), '')
        rec['comment'] = first[:400]
    elif f.endswith('.json'):
        try:
            d = json.loads(t); rec['json_keys'] = list(d)[:20] if isinstance(d, dict) else f'list[{len(d)}]'
        except Exception: rec['json_keys'] = 'unparsed'
    out[f] = rec
# 逆引き
for f, r in out.items():
    for i in r.get('imports', []):
        if i in out: out[i].setdefault('importedBy', []).append(f)
json.dump(out, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out), 'files')
