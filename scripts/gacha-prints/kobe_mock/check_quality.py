"""設問の質の自動監査（3回分）。
  1) 解説の英文引用“…”が本文（または設問の選択肢）にそのまま存在するか（… は省略として扱う）
  2) 選択肢の構造：正解の番号が範囲内・選択肢の重複なし・tf2 は正解ちょうど2つで理由の○×と一致
     dialog_blanks は正解が全て異なる・使わない選択肢は無い（5空所5択）
  3) 正解の位置の偏り（あ〜え）・正解が最長の選択肢である割合（テストワイズネス対策）
  4) 全訳の段落数＝本文の段落数・注(*)の語が本文にある
出力：logs/quality.json（NG があれば終了コード1）
"""
import re, json, sys, importlib
from collections import Counter
from pathlib import Path
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

def strip(t): return re.sub(r'\{[a-z0-9]+\|([^}]*)\}', r'\1', t).replace('*', '')
def norm(t):
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t).strip()

ng, info = [], {}
pos = Counter(); longest = [0, 0]
for R in '123':
    for part in ['I', 'II', 'III', 'IV']:
        P = importlib.import_module(f'r{R}_{part}').PART
        tag = f'r{R}-{part}'
        if part == 'IV':
            continue
        body = norm(' '.join(strip(p) for p in P['passage']))
        pool = body
        for q in P['questions']:
            for c in q.get('choices', []): pool += ' ' + norm(c)
            for it in q.get('items', []):
                for c in it['choices']: pool += ' ' + norm(c)
        # 1) 引用
        texts = []
        for q in P['questions']:
            for k in ('explain', 'reasons'):
                texts += q.get(k, [])
            if isinstance(q.get('why'), dict): texts += list(q['why'].values())
            if q.get('check'): texts.append(q['check'])
            for it in q.get('items', []): texts.append(it.get('why', ''))
        for t in texts:
            for qt in re.findall(r'“([^”]+)”', t):
                if not re.search(r'[A-Za-z]{3}', qt): continue
                for seg in re.split(r'\s*(?:…|\.\.\.)\s*', norm(qt)):
                    seg = seg.strip(' ,.;:')
                    if len(seg) >= 8 and seg.lower() not in pool.lower():
                        ng.append((tag, 'quote_not_in_passage', seg[:90]))
        # 2) 構造
        for q in P['questions']:
            k = q['kind']
            if k in ('synonym', 'wavy', 'blanks'):
                for it in q['items']:
                    ch = it['choices']
                    if len(set(map(norm, ch))) != len(ch): ng.append((tag, 'dup_choice', q['no'], it['label']))
                    if not 0 <= it['answer'] < len(ch): ng.append((tag, 'bad_answer', q['no'], it['label']))
                    if 'word' in it and norm(ch[it['answer']]).lower() == norm(it['word']).lower(): ng.append((tag, 'answer_equals_word', it['label']))
                    pos[it['answer']] += 1
                    L = [len(c) for c in ch]; longest[1] += 1
                    if L[it['answer']] == max(L) and L.count(max(L)) == 1: longest[0] += 1
            elif k == 'combo':
                rows = [tuple(r) for r in q['rows']]
                if len(set(rows)) != len(rows): ng.append((tag, 'dup_combo_rows', q['no']))
                pos[q['answer']] += 1
            elif k == 'tf2':
                a = sorted(q['answer'])
                if len(a) != 2 or len(set(a)) != 2: ng.append((tag, 'tf2_not_two', q['no']))
                for i, r in enumerate(q['reasons']):
                    mark = r.strip()[:1]
                    if (i in a) != (mark == '○'): ng.append((tag, 'tf2_reason_mark_mismatch', q['no'], i, mark))
                if len(q['choices']) != len(q['reasons']): ng.append((tag, 'tf2_len', q['no']))
            elif k == 'dialog_blanks':
                v = list(q['answer'].values())
                if len(set(v)) != len(v): ng.append((tag, 'dialog_dup', q['no']))
                if len(q['choices']) != len(v): ng.append((tag, 'dialog_unused_choice', q['no'], len(q['choices']), len(v)))
        # 4) 全訳・注
        if len(P['translation']) != len(P['passage']): ng.append((tag, 'translation_paragraphs', len(P['translation']), len(P['passage'])))
        for w, _ in P.get('notes', []):
            if w.lower().rstrip('s') not in body.lower(): ng.append((tag, 'note_not_in_passage', w))
info['answer_position'] = {('あいうえおか')[k]: v for k, v in sorted(pos.items())}
info['correct_is_unique_longest'] = f'{longest[0]}/{longest[1]}'
info['ng'] = ng
json.dump(info, open(HERE / 'logs/quality.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(info, ensure_ascii=False, indent=1))
sys.exit(1 if ng else 0)
