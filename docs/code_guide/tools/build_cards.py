"""cards/*.txt + data/bundles.py + 対象リポジトリの中身 → data/cards.json と data/sync.json
くわしく・つながりはファイルから取り出した事実（exports / imports / importedBy / 参照元 / 冒頭の説明）だけで組み立てる。
リファクタリングへの追従：
  ・新しいファイル（カードも束ねもない）→ sync.json の new に出し、仮カード（確信度 低・要確認）で載せる
  ・消えたファイルのカード → removed に出し、載せない
  ・冒頭の説明 / export が書いたときから変わったカード → changed に出す（basis.json と比べる）"""
import json, re, os, sys, glob, subprocess, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import G, ROOT, WORK, DATA, CARDS, sh, tracked as tracked_files, commit
sys.path.insert(0, DATA); from bundles import B
OUT = DATA
ALL = tracked_files()

SECRET = [
  (re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+'), '（メールアドレス・省略）'),
  (re.compile(r'https?://\S+'), '（URL・省略）'),
  (re.compile(r'ca-app-pub-[\d~/]+'), '（広告ID・省略）'),
  (re.compile(r'AIza[0-9A-Za-z_-]{20,}'), '（キー・省略）'),
  (re.compile(r'\b[A-Za-z0-9_-]{32,}\b'), '（長い識別子・省略）'),
]
def scrub(s):
    for r, t in SECRET: s = r.sub(t, s)
    return s

def first_sentence(c, limit=90):
    c = re.sub(r'\s+', ' ', c or '').strip()
    c = re.sub(r'^[■★☆=\-─ ]+', '', c)
    if not c: return ''
    m = re.search(r'^(.{8,}?[。.!?！？])(\s|$)', c)
    s = m.group(1) if m else c
    if len(s) > limit: s = s[:limit].rstrip() + '…'
    return scrub(s)

# 参照元（import 以外の文字列参照）: 追跡中のテキストファイルを1回だけ読む
TEXT_EXT = ('.ts','.tsx','.mts','.mjs','.js','.json','.md','.py','.sh','.html','.css','.yml','.txt','.java','.swift','.rules','.plist','.gradle','.xml')
texts = {}
for p in ALL:
    if not p.endswith(TEXT_EXT): continue
    fp = os.path.join(ROOT, p)
    try:
        if os.path.getsize(fp) > 2_000_000: continue
        texts[p] = open(fp, encoding='utf-8', errors='ignore').read()
    except Exception: pass

def lead_comment(path):
    """ファイル最上部（最初の import / コードより前）に書かれたコメントだけを返す。途中のコメントは使わない"""
    t = texts.get(path, '').lstrip('\ufeff')
    t = re.sub(r'^#!.*\n', '', t)
    out = []; L = t.split('\n'); i = 0
    while i < len(L):
        s = L[i].strip()
        if not s: i += 1; continue
        if s.startswith('/*'):
            buf = []
            while i < len(L):
                x = L[i].strip(); i += 1
                end = '*/' in x
                x = x.split('*/')[0]; x = re.sub(r'^/\*+', '', x); x = re.sub(r'^\*+\s?', '', x)
                buf.append(x)
                if end: break
            out.append(' '.join(buf)); continue
        if s.startswith('//'): out.append(s[2:]); i += 1; continue
        if s.startswith('#') and path.endswith(('.sh', '.yml', '.py')): out.append(s[1:]); i += 1; continue
        # 説明より前に import が並ぶ書き方（import を先頭に足しただけのリファクタリングでも説明を見失わない）。
        # import 文だけを読み飛ばし、その直後のコメントまでを「冒頭」とみなす。それ以外のコードが出たら終わり
        if not out and re.match(r'^import\b', s) and path.endswith(('.ts', '.tsx', '.mts', '.mjs', '.js')):
            while i < len(L) and not re.search(r"(from\s+)?['\"][^'\"]+['\"];?\s*$", L[i]): i += 1
            i += 1; continue
        break
    txt = ' '.join(out)
    txt = re.sub(r'@license|SPDX-License-Identifier:\s*\S+', '', txt)
    txt = re.sub(r'^\s*(src|scripts|tests)/[\w./-]+\.(tsx?|css|mts)\s*', '', txt)
    txt = re.sub(r'[=─━]{3,}|-{3,}', ' ', txt)
    return re.sub(r'\s+', ' ', txt).strip()

def mentions(path):
    base = os.path.basename(path)
    stem = re.sub(r'\.(tsx?|mts|mjs|js|py|sh|md|json|css|html)$', '', base)
    key = base if len(stem) < 6 else stem
    out = []
    for p, t in texts.items():
        if p == path: continue
        if key in t: out.append(p)
    return out

rows = []
for f in sorted(glob.glob(f'{CARDS}/*.txt')):
    for line in open(f, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line or line.startswith('#'): continue
        p = line.split('|')
        rows.append(dict(path=p[0], tag=p[1], conf=p[2], one=p[3], detail=p[4] if len(p) > 4 else ''))

alive = set(ALL)
in_bundle = lambda p: any(re.search(b[2], p) for b in B)
written = {r['path'] for r in rows}
removed = sorted(written - alive)
new = sorted(p for p in ALL if p not in written and not in_bundle(p))
rows = [r for r in rows if r['path'] in alive]
for p in new:
    rows.append(dict(path=p, tag=None, conf='低', one='', detail='', draft=True))
# 事実の取り出し（extract.py をそのまま使う）
lst = os.path.join(WORK, 'individual.txt'); open(lst, 'w').write('\n'.join(r['path'] for r in rows) + '\n')
subprocess.run([sys.executable, os.path.join(G, 'tools', 'extract.py'), ROOT, lst, os.path.join(WORK, 'facts.json')], check=True, capture_output=True)
facts = json.load(open(os.path.join(WORK, 'facts.json')))
TAG_GUESS = [(r'^tests/|\.test\.', 'テスト'), (r'\.(md|txt)$', '文書'), (r'\.css$', '部品'), (r'^src/(data|types)/', 'データ'),
             (r'\.(json|ya?ml|rules)$|config', '設定'), (r'^src/components/.*\.tsx$', '部品'), (r'\.(png|jpe?g|webp|svg|mp3|mp4)$', '音声・画像')]

ex_label = lambda e: '・'.join(e[:3]) + (f' など{len(e)}個' if len(e) > 3 else '')
short = lambda x: x.split('/')[-1]
cards = []
for r in rows:
    fa = facts.get(r['path'], {})
    imports = fa.get('imports', []) or []; by = fa.get('importedBy', []) or []
    exps = fa.get('exports', []) or []; pk = fa.get('packages', []) or []
    detail = r['detail']
    if r.get('draft'):
        r['tag'] = next((t for rx, t in TAG_GUESS if re.search(rx, r['path'])), 'データ')
        r['one'] = 'カードがまだ書かれていない新しいファイル。役割は要確認の係'
    if not detail:
        s = []
        if r['path'].endswith('.py'):
            import ast
            try: c = first_sentence(ast.get_docstring(ast.parse(texts.get(r['path'], ''))) or '')
            except Exception: c = ''
            c = c or first_sentence(lead_comment(r['path']))
        elif r['path'].endswith('.md'): c = ''
        else: c = first_sentence(lead_comment(r['path']))
        if c: s.append(f'冒頭の説明：「{c}」')
        if fa.get('headings') and not c: s.append('主な見出し：' + '／'.join(scrub(re.sub(r'[*`#]', '', h)) for h in fa['headings'][:3]) + '。')
        elif False: s.append('主な見出し：' + '／'.join(scrub(h) for h in fa['headings'][:3]) + '。')
        elif fa.get('json_keys') and isinstance(fa['json_keys'], list): s.append('主な項目：' + '・'.join(fa['json_keys'][:5]) + '。')
        if exps: s.append(f'{ex_label(exps)}を公開する。')
        if imports or pk:
            parts = []
            if imports:
                top = sorted(imports, key=lambda x: (x.endswith('.css'), -len(facts.get(x, {}).get('importedBy', []) or [])))[:3]
                parts.append('・'.join(short(x) for x in top) + (f' など{len(imports)}ファイル' if len(imports) > 3 else ''))
            ext = [x for x in pk if not x.startswith('node:')]
            if ext: parts.append('外部部品 ' + '・'.join(ext[:3]))
            s.append('読み込むもの：' + '、'.join(parts) + '。')
        if by: s.append('・'.join(short(x) for x in by[:2]) + (f' など{len(by)}ファイル' if len(by) > 2 else '') + 'から読み込まれる。')
        detail = ''.join(s[:4]) or '中身の説明が書かれていないため、ファイル名と内容から役割を判断した。'
    if r['tag'] == 'テスト' and r['path'].startswith(('tests/', 'functions/')) and not r['detail']:
        t = texts.get(r['path'], '')
        nit = len(re.findall(r'\b(?:it|test)\(', t))
        names = [re.sub(r'\s+', ' ', m) for m in re.findall(r"(?:describe|it)\(\s*['\"`]([^'\"`]{4,60})", t)]
        target = [short(x) for x in imports if not x.startswith('tests/')][:3]
        seg = []
        if nit: seg.append(f'{nit}件の確認（it）を持つ。')
        else: seg.append('ブラウザを実際に動かして画面を確かめる検査スクリプト（Playwright）。')
        if names: seg.append('主な確認：「' + '」「'.join(names[:2]) + '」。')
        if target: seg.append('対象：' + '・'.join(target) + '。')
        elif 'readFileSync' in t: seg.append('ソースコードを文字として読み込んで検査する。')
        detail = ''.join(seg)
    detail = scrub(detail)
    # つながり（最大3）
    links = []
    for x in by[:2]: links.append({'dir': 'from', 'path': x})
    callees = sorted(imports, key=lambda x: (x.endswith('.css'), -len(facts.get(x, {}).get('importedBy', []) or [])))
    for x in callees:
        if len(links) >= 3: break
        links.append({'dir': 'to', 'path': x})
    if not links:
        for x in mentions(r['path'])[:3]: links.append({'dir': 'ref', 'path': x})
    cards.append(dict(
        id=r['path'], path=r['path'], name=short(r['path']),
        folder=r['path'].split('/')[0] if '/' in r['path'] else '(ルート)',
        one=r['one'], detail=detail, links=links, lines=fa.get('lines', 0),
        tag=r['tag'], conf=r['conf'], kind='file',
        exports=exps[:8], nImports=len(imports), nBy=len(by), draft=bool(r.get('draft'))))

# 束ね
native = {c['path'] for c in cards}
rest = [x for x in ALL if x not in native]
rest = [x for x in rest if x not in native]
empty_bundles = []
for b in B:
    mem = [x for x in rest if re.search(b[2], x)]
    if not mem: empty_bundles.append(b[0]); continue
    lines = 0; size = 0
    for x in mem:
        fp = os.path.join(ROOT, x)
        try: size += os.path.getsize(fp)
        except Exception: pass
        if x in texts: lines += texts[x].count('\n')
    exts = {}
    for x in mem:
        e = os.path.splitext(x)[1].lower() or '(なし)'; exts[e] = exts.get(e, 0) + 1
    dirs = sorted({os.path.dirname(x) or '(ルート)' for x in mem})
    common = os.path.commonpath(mem) if len(mem) > 1 else os.path.dirname(mem[0])
    # 置き場所の表示：1か所ならそのフォルダ、複数ならフォルダを列挙（最大4）
    shown = [('リポジトリ直下' if d == '(ルート)' else d + '/') for d in dirs] if len(dirs) <= 4 else [common + '/ 以下 ' + str(len(dirs)) + 'か所']
    where = mem[0] if len(mem) == 1 else '、'.join(shown)
    tree = (common if common else '(ルート)')
    top = {x.split('/')[0] if '/' in x else '(ルート)' for x in mem}
    cards.append(dict(id=b[0], path=where, tree=tree,
        name=b[1], folder=top.pop() if len(top) == 1 else '(ルート)',
        one=b[5], detail=scrub(b[6]), links=[], lines=lines, tag=b[3], conf=b[4], kind='bundle',
        count=len(mem), bytes=size, exts=dict(sorted(exts.items(), key=lambda kv: -kv[1])[:5]),
        members=mem[:6]))
# 書いたときの「根拠」と比べる：冒頭の説明・export・タグ付けの材料が変わったら見直し候補
def basis_of(c):
    fa = facts.get(c['path'], {})
    src = lead_comment(c['path'])[:600] + '|' + ','.join(sorted(fa.get('exports', []) or []))
    return hashlib.sha1(src.encode()).hexdigest()[:12]
bpath = f'{DATA}/basis.json'
basis = json.load(open(bpath)) if os.path.exists(bpath) else {}
changed = []
for c in cards:
    if c['kind'] != 'file' or c['draft']: continue
    h = basis_of(c); old = basis.get(c['path'])
    if old is None: basis[c['path']] = {'h': h, 'lines': c['lines']}; continue
    grew = old['lines'] and abs(c['lines'] - old['lines']) / max(old['lines'], 1) >= .3 and abs(c['lines'] - old['lines']) >= 30
    if old['h'] != h or grew:
        changed.append({'path': c['path'], 'why': ('冒頭の説明・export が変わった' if old['h'] != h else '') + ('／' if old['h'] != h and grew else '') + (f"行数 {old['lines']:,}→{c['lines']:,}" if grew else ''), 'one': c['one']})
        c['changed'] = True
if '--accept' in sys.argv:   # 見直しが済んだら根拠を今の中身に更新する
    targets = sys.argv[sys.argv.index('--accept') + 1:] or [c['path'] for c in cards if c['kind'] == 'file' and not c['draft']]
    for c in cards:
        if c['path'] in targets and c['kind'] == 'file' and not c['draft']:
            basis[c['path']] = {'h': basis_of(c), 'lines': c['lines']}; c.pop('changed', None)
    changed = [x for x in changed if x['path'] not in targets]
for p in removed: basis.pop(p, None)
json.dump(dict(sorted(basis.items())), open(bpath, 'w'), ensure_ascii=False, indent=0)
head, date, branch = commit()
sync = {'commit': head, 'date': date, 'branch': branch, 'new': new, 'removed': removed, 'changed': changed, 'emptyBundles': empty_bundles}
json.dump(sync, open(f'{DATA}/sync.json', 'w'), ensure_ascii=False, indent=1)
json.dump(cards, open(f'{OUT}/cards.json', 'w'), ensure_ascii=False, indent=0)
print(f'new {len(new)} / removed {len(removed)} / changed {len(changed)} / empty bundles {empty_bundles}')
print(len(cards), 'cards;', sum(1 for c in cards if c['kind'] == 'file'), 'files;',
      sum(c.get('count', 1) for c in cards), 'tracked covered')
