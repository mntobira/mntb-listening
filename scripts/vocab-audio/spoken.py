"""単語帳の見出し（～・A/B・人 などを含む）を、読み上げる英文に直す。

  make up for        → make up for
  afterward(s)            → afterwards
  (just) around the corner→ just around the corner
  in/within sight         → in sight            （/ は最初の形）
  give (人) a hand        → give someone a hand
  If S had 過去分詞, ...   → If S had done, S would have done
"""
import re

JA = {
    '過去分詞': 'done', '金額': 'money', '時間': 'time', '場所': 'somewhere', '人': 'someone', '物': 'something',
}

def spoken(word: str) -> str:
    s = word
    s = s.split('＝')[0]
    s = s.replace('～ (金額)', '(金額)')
    s = re.sub(r'（[^）(]*[\u3040-\u30ff\u4e00-\u9fff][^）]*）', ' ', s)  # 全角かっこの日本語注記（複数形 など）は読まない
    s = s.replace('（', '(').replace('）', ')')
    s = re.sub(r'～\s*[/／].*$', '～', s)                  # 「to put it ～/put ～」は最初の形だけ
    for ja, en in JA.items():
        s = s.replace(ja, en)
    s = s.replace('；', ';').replace('／', '/')
    s = re.sub(r'\s*/\s*do\b.*$', '', s) if ' /do ' in word.replace('／', ' /') else s
    s = re.sub(r',?\s*etc\.?', '', s)
    s = s.replace('〜', '～').replace('…', '～').replace('...', '～')
    s = s.strip().strip('～').strip()
    # 途中の ～ は短い間（…）にする。消すと「so ～ that ～」が「so that」になり意味が変わる
    s = re.sub(r'\s*～\s*', ' … ', s)
    s = re.sub(r'(\w)\((\w+)\)', r'\1\2', s)                # afterward(s) → afterwards
    for _ in range(3):                                           # 入れ子のかっこも外す
        s = re.sub(r'\(([^()]*)\)', r'\1', s)                  # (just) → just / (on someone ; at somewhere)
    s = re.sub(r"([A-Za-z']+)(?:/[A-Za-z']+)+", r'\1', s)     # in/within → in
    s = re.sub(r'\bS\b', 'someone', s)                        # 主語の記号 S は someone と読む
    s = s.replace(';', ',')
    s = re.sub(r'\s+,', ',', s)
    s = re.sub(r'\(\s*(?:…\s*)?\)', ' ', s)
    s = re.sub(r'(?:\s*…\s*)+([,.]|$)', r'\1', s)            # 末尾・句読点の前の … は不要
    s = re.sub(r'^(?:\s*…\s*)+', '', s)
    s = re.sub(r'\s+', ' ', s).strip(' ,.')
    return s or word
