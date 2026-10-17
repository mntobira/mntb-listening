"""自己チェック：①全カードの必須欄 ②ひとことでの字数と「〜係」 ③禁止語 ④秘密の値が成果物に無いこと ⑤文字色のコントラスト"""
import json, re, subprocess, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import G, ROOT as SRC
cards = json.load(open(f'{G}/data/cards.json'))
R = {'errors': [], 'warnings': []}
TAGS = {'画面', '部品', 'データ', '通信', '設定', 'テスト', '音声・画像', '文書'}
BANNED = ['様々な処理', 'いろいろな処理', '各種処理', '革新的', '最先端', '画期的', '圧倒的']
for c in cards:
    for k in ['path', 'one', 'detail', 'lines', 'tag', 'conf']:
        if c.get(k) in (None, ''): R['errors'].append(f'{c["id"]}: {k} が空')
    if c['tag'] not in TAGS: R['errors'].append(f'{c["id"]}: タグ {c["tag"]}')
    if c['conf'] not in ('高', '中', '低'): R['errors'].append(f'{c["id"]}: 確信度 {c["conf"]}')
    if not (20 <= len(c['one']) <= 40): R['errors'].append(f'{c["id"]}: ひとことで {len(c["one"])}字')
    if not c['one'].endswith('係'): R['errors'].append(f'{c["id"]}: 〜係 で終わらない')
    for b in BANNED:
        if b in c['one'] + c['detail']: R['errors'].append(f'{c["id"]}: 禁止語 {b}')
    if c['kind'] == 'file' and len(c['links']) > 3: R['errors'].append(f'{c["id"]}: つながり>3')

# 秘密：ソースから実際の値を集め、成果物に1つも含まれないことを確かめる
def vals():
    out = set()
    t = open(f'{SRC}/capacitor.config.ts').read(); out |= set(re.findall(r'ca-app-pub-[\d~/]+', t))
    for f in ['src/utils/adConfig.ts']:
        out |= set(re.findall(r'ca-app-pub-[\d~/]+', open(f'{SRC}/{f}').read()))
    out |= set(re.findall(r'"default"\s*:\s*"([^"]+)"', open(f'{SRC}/.firebaserc').read()))
    for f in ['src/features/legal/legalText.ts', 'src/utils/feedback.ts', 'src/utils/feedbackReply.ts', 'docs/FEEDBACK_SETUP.md']:
        out |= set(re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+', open(f'{SRC}/{f}').read()))
    out |= set(re.findall(r'https://script\.google\.com/[^\s\'"`)]+', subprocess.run('git grep -h -o "https://script.google.com/[^ \\"\'`)]*"', shell=True, cwd=SRC, capture_output=True, text=True).stdout))
    out |= set(re.findall(r'https://docs\.google\.com/forms/[^\s\'"`)]+', open(f'{SRC}/src/features/legal/legalText.ts').read()))
    out |= set(re.findall(r'AIza[0-9A-Za-z_-]{20,}', subprocess.run('git grep -h -o "AIza[0-9A-Za-z_-]*"', shell=True, cwd=SRC, capture_output=True, text=True).stdout))
    return {v for v in out if len(v) >= 6}
secret = vals()
outs = ['interactive.html', '.work/poster.html', '.work/file-guide.html', 'data/cards.json', 'research.md', 'codemap.md'] + sorted('.work/maps/' + x for x in (os.listdir(f'{G}/.work/maps') if os.path.isdir(f'{G}/.work/maps') else []) if x.endswith('.html'))
found = []
for o in outs:
    p = f'{G}/{o}'
    if not os.path.exists(p): continue
    t = open(p, encoding='utf-8', errors='ignore').read()
    for v in secret:
        if v in t: found.append((o, v[:6] + '…'))
    for rx in [r'[\w.+-]+@(?!example)[\w-]+\.(com|jp|net|org)\b', r'ca-app-pub-\d', r'AIza[0-9A-Za-z_-]{20,}']:
        for m in re.finditer(rx, t):
            found.append((o, m.group(0)[:6] + '…'))
R['secretsChecked'] = len(secret); R['secretsFound'] = found
if found: R['errors'].append(f'秘密の値が成果物に含まれる: {found[:5]}')

# コントラスト（WCAG）
def lum(h):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def cr(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)
pairs = [('文字 ink / 地 paper', '#16273a', '#fbf8f1'), ('補足 ink-3 / 地 paper', '#5a6b7e', '#fbf8f1'), ('補足 ink-3 / 白', '#5a6b7e', '#ffffff'),
         ('補足 ink-3 / 淡青 paper-2', '#5a6b7e', '#f4f7fc'), ('本文 ink-2 / 白', '#3b4d62', '#ffffff'), ('強調 orange / 白', '#a65400', '#ffffff'),
         ('強調 orange / 淡橙', '#a65400', '#fff2e0'), ('青 blue / 白', '#2458a6', '#ffffff'), ('青 blue / 淡青', '#2458a6', '#e8f0fb'),
         ('白 / 紺 navy', '#ffffff', '#1c2a39'), ('文字 ink / タグ media', '#16273a', '#fdf3dc'), ('警告文 / 淡橙', '#7a4300', '#fff2e0'),
         ('要確認 orange / 薄橙地', '#a65400', '#fffaf2')]
R['contrast'] = [(n, round(cr(a, b), 2)) for n, a, b in pairs]
for n, v in R['contrast']:
    if v < 4.5: R['errors'].append(f'コントラスト不足 {n} {v}')
R['lowConf'] = [(c['path'], c['one']) for c in cards if c['conf'] == '低']
R['midConf'] = [(c['path'], c['one']) for c in cards if c['conf'] == '中']
R['cards'] = len(cards); R['files'] = sum(c.get('count', 1) for c in cards)
json.dump(R, open(f'{G}/data/selfcheck.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: (v if k not in ('lowConf', 'midConf') else len(v)) for k, v in R.items()}, ensure_ascii=False, indent=1))
sys.exit(1 if R['errors'] else 0)
