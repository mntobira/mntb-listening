"""単語帳の見出し（～・A/B・人 などを含む）を、ElevenLabs に読ませる英文に直す。

  make up for ～          → make up for
  so ～ that ～           → so — that            （途中の ～ は短い間。消すと意味が変わる。
                                                   … はためらう読み方になるので — を使う：ElevenLabs 公式の推奨）
  afterward(s)            → afterwards
  (just) around the corner→ just around the corner
  in/within sight         → in sight             （/ は最初の形）
  give (人) a hand        → give someone a hand
  If S had 過去分詞, ...   → If someone had done, someone would have done
  What ～ like?           → What — like?         （? は残す＝疑問の調子で読む）

★ふつうの単語（記号の無いもの）は1文字も変えない★（テストで全語を確かめている）
"""
import re

JA = [('過去分詞', 'done'), ('金額', 'money'), ('時間', 'time'), ('場所', 'somewhere'), ('人', 'someone'), ('物', 'something')]
MARK = '～'
_SPECIAL = re.compile(r'[～〜…／/()（）;；＝\u3040-\u30ff\u4e00-\u9fff]|\.\.\.|\betc\b|\bS\b|\bSV\b')


def is_plain(word: str) -> bool:
    """記号・日本語・S などを含まない、そのまま読める見出しか"""
    return not _SPECIAL.search(word)


def spoken(word: str) -> str:
    s = word.strip()
    if is_plain(s):
        return s.rstrip('.').strip()
    s = s.split('＝')[0]
    s = s.replace('～ (金額)', '(金額)')
    s = re.sub(r'（[^）(]*[\u3040-\u30ff\u4e00-\u9fff][^）]*）', ' ', s)   # 全角かっこの日本語注記（複数形 など）は読まない
    s = s.replace('（', '(').replace('）', ')').replace('；', ';').replace('／', '/')
    s = re.sub(r'～\s*/.*$', MARK, s)                                      # 「to put it ～/put ～」は最初の形だけ
    s = re.sub(r'\s+/\s*do\b.*$', '', s)                                    # 「do ～ harm /do harm to ～」も最初の形だけ
    for ja, en in JA:
        s = s.replace(ja, en)
    s = re.sub(r',?\s*\betc\b\.?', '', s)                                   # 単語の途中は消さない（\b で区切る）
    s = s.replace('〜', MARK).replace('…', MARK).replace('...', MARK)
    s = re.sub(MARK + r'ing\b', 'doing', s)                                 # 「～ing」は doing と読む
    s = re.sub(r'(\w)\((\w+)\)', r'\1\2', s)                                # afterward(s) → afterwards
    for _ in range(3):                                                      # 入れ子のかっこも外す
        s = re.sub(r'\(([^()]*)\)', r'\1', s)
    s = re.sub(r"\b([A-Za-z']+)(?:/[A-Za-z']+)+", r'\1', s)                 # in/within → in
    s = re.sub(r'\bSV\b', 'someone does', s)
    s = re.sub(r'\bS\b', 'someone', s)                                      # 主語の記号 S
    s = s.replace(';', ',')
    s = s.strip().strip(MARK).strip()
    s = re.sub(r'\s*' + MARK + r'\s*', ' — ', s)
    s = re.sub(r'(?:\s*—\s*)+([,.?!]|$)', r'\1', s)                         # 末尾・句読点の前の — は不要
    s = re.sub(r'^(?:\s*—\s*)+', '', s)
    s = re.sub(r'\s+,', ',', s)
    s = re.sub(r'\s+([?!])', r'\1', s)
    s = re.sub(r'\s+', ' ', s).strip(' ,')
    s = s.rstrip('.').strip()
    return s or word


def line_for_prompt(word: str) -> str:
    """原稿の1行。疑問文は ? のまま、それ以外は . で言い切る"""
    s = spoken(word)
    return s if s.endswith(('?', '!')) else s + '.'
