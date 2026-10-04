"""レベル報酬の UR「共通テスト リスニングの聞き方」（Lv.15 で解放）。
python3 scripts/gacha-prints/build-level-ur.py で public/prints/ に PDF とサムネイルを書き出す。"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from ur_common import st, esc, unit_bar, box, make_thumb, NIGHT, GOLD, F, FB
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, CondPageBreak

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/prints/print_level_listening_howto.pdf'
THUMB = ROOT / 'public/prints/thumbs/print_level_listening_howto.webp'

SECTIONS = [
  ('0. 音が流れる前の30秒で勝負が決まる', [
    ('先に選択肢を読む', '音声の前に必ず①〜④をざっと読み、「何が違うか」（人・時・場所・数・気持ち）に下線を引く。違いが分かれば、聞くべき1語が決まる。'),
    ('設問文から「聞く対象」を絞る', '「話者の状況に最も近い」「女性が次にすること」など、誰の・いつの情報を聞くのかを先に決める。'),
    ('数字・曜日は表に', '第2問・第4問のように数や曜日が出るときは、余白に小さな表を作っておくと聞きながら埋められる。'),
  ]),
  ('1. 第1問（短い発話）', [
    ('言い換えを待つ', '正解は本文と同じ単語ではなく言い換え（forgot it on the train → does not have her umbrella）になりやすい。同じ単語が入った選択肢は「ひっかけ」を疑う。'),
    ('時制と否定に注意', 'was going to（するつもりだったが、しなかった）／hasn\'t yet など、最後に意味がひっくり返る表現を聞き逃さない。'),
  ]),
  ('2. 第2問・第3問（対話）', [
    ('最後の発言が決め手', '対話は途中で予定が変わることが多い。Actually / But / Then how about ... のあとが「最終的な答え」。'),
    ('誰の発言かを分ける', 'メモは「男：」「女：」の2列にする。質問がどちらについてかを先に確認。'),
  ]),
  ('3. 第4問〜第6問（長めの英文・1回読み）', [
    ('1回しか流れない前提で', '迷った問は印だけ付けて次へ。前の問を引きずると、次の問の答えの場所を聞き逃す。'),
    ('講義は「主張→理由→例」', '最初の1〜2文でテーマ、However のあとで主張、For example のあとで具体例。図表問題は「増えた・減った・同じ」の向きだけを先に取る。'),
    ('条件に合うものを選ぶ問題', '条件（値段・距離・時間など）ごとに ○× の表を作り、全部 ○ のものを選ぶ。'),
  ]),
  ('4. 毎日の練習のしかた（このアプリで）', [
    ('解く → スクリプトで確認 → もう一度聞く', '答え合わせで黄色いマーカー（聞き取りの決め手）を見たら、その部分だけ「もう1回」で聞き直す。分かった音を耳に残すのが一番伸びる。'),
    ('0.75倍 → 標準 → 2回続けて', '聞き取れなかった問は0.75倍で音を確認し、標準速度に戻して聞く。本番前は「2回続けて」で本番と同じ条件に。'),
    ('まちがえた問題は復習ノートへ', '間違えた問だけが自動で集まる。忘れかけたころ（翌日・3日後・1週間後）に解き直すのが最短。'),
  ]),
]

def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=14 * mm, rightMargin=14 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
                          title='共通テスト リスニングの聞き方', author='マナトビ')
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')
    def deco(c, d):
        c.saveState(); c.setFillColor(NIGHT); c.rect(0, A4[1] - 10 * mm, A4[0], 10 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white); c.setFont(FB, 9); c.drawString(14 * mm, A4[1] - 6.6 * mm, 'マナトビ  UR  レベル報酬（Lv.15）')
        c.setFillColor(colors.HexColor('#6b5d45')); c.setFont(F, 8); c.drawRightString(A4[0] - 14 * mm, 9 * mm, f'{d.page}'); c.restoreState()
    doc.addPageTemplates([PageTemplate(id='p', frames=[frame], onPage=deco)])
    story = [Spacer(1, 6 * mm)]
    story.append(box([Paragraph('共通テスト リスニングの聞き方', st['h2']),
                      Paragraph(esc('「聞き取れない」の多くは耳の問題ではなく、聞く前の準備と、聞いたあとの復習のしかたの問題です。'
                                    'このプリントでは、大問ごとに「どこを・どう聞くか」と、毎日の練習のしかたをまとめました。'), st['body'])]))
    story.append(Spacer(1, 5 * mm))
    for head, items in SECTIONS:
        story.append(CondPageBreak(40 * mm))
        story.append(unit_bar(head)); story.append(Spacer(1, 3 * mm))
        for t, b in items:
            story.append(Paragraph(f'<b>{esc(t)}</b>', st['q']))
            story.append(Paragraph(esc(b), st['body'])); story.append(Spacer(1, 2.5 * mm))
        story.append(Spacer(1, 3 * mm))
    story.append(box([Paragraph('<b>本番の合言葉</b>', st['q']),
                      Paragraph(esc('選択肢を先に読む／言い換えを待つ／最後の発言を信じる／迷ったら次へ。'), st['body'])], pad=8))
    doc.build(story)
    make_thumb(OUT, THUMB)
    print(OUT, doc.page)

if __name__ == '__main__':
    build()
