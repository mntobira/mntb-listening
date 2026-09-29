#!/usr/bin/env python3
"""
第2問（48問＝16回×3問）の「録り直し用」台本 PDF を作る（ElevenLabs Eleven v3 向け・クレジット不要）。

  python3 scripts/build-q2-rerecord-pdf.py   → .delivery/manatobi_q2_rerecord_<日付>.pdf

■ 2026-09-19 版（ハブの話者ラベル PDF）からの修正点
  - 問題データの話者記号 M は「男性」とは限らない（1-2・8-1・10-2 は M=Mother＝母親）。
    旧 PDF は 1-2 の母親を「男1」にしていた。ここでは場面の話者説明から性別を決め直す。
  - 旧版で抜けていた 10 問（絵を画像生成で順次作成中・録音待ち）も録り直し対象に含める。
    旧 PDF は音源のある 38 問だけだったため、回の中で問番号が飛んでいた（例：第2回は問1→問3）。
  - 保存名・まとめ録りの受け付け方を、今回の取り込みツール（receive → split → import）に合わせる。
台本の英文は問題データ（scripts/data/q2_shuffled.json）そのまま。書き換えない。
"""
from pathlib import Path
from datetime import date
import html, json, re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
SETS = json.loads((ROOT / 'scripts/data/q2_shuffled.json').read_text())
PUBLIC = ROOT / 'public/listening_audio'
TODAY = date.today().isoformat()
OUT = ROOT / '.delivery' / f'manatobi_q2_rerecord_{TODAY}.pdf'

pdfmetrics.registerFont(TTFont('JP', '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'))
pdfmetrics.registerFont(TTFont('EN', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('ENB', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
TEAL, INK, LIGHT, WARN = colors.HexColor('#176b70'), colors.HexColor('#20313c'), colors.HexColor('#eff6f6'), colors.HexColor('#fff4e0')
ST = {
    'title': ParagraphStyle('t', fontName='JP', fontSize=22, leading=32, textColor=TEAL, spaceAfter=12),
    'h1': ParagraphStyle('h1', fontName='JP', fontSize=16, leading=24, textColor=TEAL, spaceBefore=4, spaceAfter=8, keepWithNext=True),
    'h2': ParagraphStyle('h2', fontName='JP', fontSize=11.5, leading=17, textColor=TEAL, spaceBefore=8, spaceAfter=3, keepWithNext=True),
    'body': ParagraphStyle('b', fontName='JP', fontSize=9.8, leading=15.5, textColor=INK, spaceAfter=5, wordWrap='CJK'),
    'small': ParagraphStyle('s', fontName='JP', fontSize=8.4, leading=12.5, textColor=INK, spaceAfter=2, wordWrap='CJK'),
    'who': ParagraphStyle('w', fontName='JP', fontSize=8.6, leading=12, textColor=TEAL, spaceBefore=4, keepWithNext=True),
    'en': ParagraphStyle('e', fontName='EN', fontSize=11, leading=16, textColor=INK, leftIndent=10, spaceAfter=2),
    'note': ParagraphStyle('n', fontName='JP', fontSize=9.4, leading=15, textColor=INK, backColor=LIGHT, borderPadding=7, spaceBefore=4, spaceAfter=10, wordWrap='CJK'),
    'warn': ParagraphStyle('wn', fontName='JP', fontSize=9.2, leading=14.5, textColor=INK, backColor=WARN, borderPadding=6, spaceBefore=3, spaceAfter=6, wordWrap='CJK'),
}


# 埋め込みフォント（Droid）に無い字を置き換える（丸数字・×・→ など）
SUBST = {'①': '(1)', '②': '(2)', '③': '(3)', '④': '(4)', '×': 'x', '→': '->', '（': '（', '★': '*'}


def mixed(t):
    t = ''.join(SUBST.get(ch, ch) for ch in str(t))
    parts = re.split(r'([\x20-\x7e]+)', str(t))
    return ''.join('<font name="EN">' + html.escape(p) + '</font>' if p and all(32 <= ord(c) < 127 for c in p)
                   else html.escape(p).replace('\n', '<br/>') for p in parts)


def P(t, s='body'):
    return Paragraph(mixed(t), ST[s])


def table(rows, widths):
    t = Table([[P(c, 'small') for c in r] for r in rows], colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), LIGHT), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('LINEBELOW', (0, 0), (-1, 0), 0.8, TEAL), ('LINEBELOW', (0, 1), (-1, -1), 0.3, colors.HexColor('#dbe4e6')),
                           ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5)]))
    return t


def gender_of(who: str, speakers: str) -> str:
    """話者記号 → 'F'(女性) / 'M'(男性)。M は Mother のこともあるので場面の話者説明で決める"""
    if who == 'W' or who == 'D':
        return 'F'
    if who in ('K', 'S', 'F'):
        return 'M'
    if who == 'M':
        return 'F' if speakers.startswith('母親') else 'M'
    raise ValueError(who)


def role_of(who: str, speakers: str, order: list[str]) -> str:
    """話者説明（例：女性(店員) / 男性(客)）から、性別が合う役柄を取り出す（並び順は当てにしない：15-2 は説明と話す順が逆）"""
    roles = [r.strip() for r in speakers.split('/')]
    fem = lambda r: r.startswith(('女', '母', '娘'))
    g = gender_of(who, speakers)
    same = [r for r in roles if fem(r) == (g == 'F')]
    others = [w for w in order if gender_of(w, speakers) == g]
    i = others.index(who)
    return same[i] if i < len(same) else ''


def tag_for(text: str) -> str:
    return '[curious]' if text.rstrip().endswith('?') else '[calm]'


def build():
    story = []
    total = sum(len(s['questions']) for s in SETS)
    rows = []
    for s in SETS:
        for q in s['questions']:
            stem = f"el2_set{s['set']}_q{q['q']}"
            rows.append((s['set'], q['q'], stem, (PUBLIC / f'{stem}.mp3').exists(), q))
    missing = [r for r in rows if not r[3]]

    story += [P('マナトビ 英語リスニング 第2問 録り直し台本（Eleven v3）', 'title'),
              P(f'全 {total} 問（16回 × 問1〜問3）・{sum(len(r[4]["turns"]) for r in rows)} 発話　／　作成 {TODAY}'),
              P('台本の英文は問題データそのまま（書き換えなし）。見出しの「女1・男1」は声の割当で、英文には入れない。', 'note')]

    story += [P('1. 旧PDF（2026-09-19 話者ラベル版）からの修正点', 'h1'),
              P('1) 抜けていた問を追加：旧PDFはアプリに音源がある38問だけで、回の中で問番号が飛んでいた（例：第2回 問1→問3）。'
                f'台本がそろっている残り{len(missing)}問も入れて、全48問を番号順に並べた。'),
              P('2) 話者の性別を訂正：問題データの記号 M は Mother（母親）のことがある。旧PDFは第1回 問2 の母親を「男1」にしていた。'
                '第1回 問2・第8回 問1・第10回 問2 は「女1＝母親」「男1＝息子」が正しい。'),
              P('3) 返し方を今回の取り込み方式に合わせた（下の「3. 保存と返し方」）。')]

    story += [P('抜けていた問（録音待ち・絵は順次追加）', 'h2'),
              table([['回-問', 'ファイル名', '場面', '設問']] +
                    [[f'{a}-{b}', st, q['scene'], q['question']] for a, b, st, _, q in missing], [40, 92, 180, 190]),
              P('この10問は絵（(1)〜(4)のイラスト）を画像生成で作り直している途中。第3回 問3（パン）・第5回 問1（料理本）・第8回 問2（ブックカバー）・第14回 問2（犬）・第16回 問1（ケーキ）・第16回 問3（ラケット）・第2回 問2（座席図）・第3回 問1（予定表）・第10回 問2（時間割）は絵ができてアプリに追加済み、残り1問（第7回 問2）は絵ができ次第追加する。48問の音声は 2026-09-28 に受領済み（Q2_1〜5）。絵が無い1問の音声は保管してあり、絵ができた時点で取り込む。', 'warn')]

    story += [P('2. 生成設定', 'h1'),
              P('モデル：Eleven v3（eleven_v3）／ Stability：Natural ／ 速度：0.9 から試聴（第1問と同じ）'),
              P('声：同じ問の中では「女1」「男1」をそれぞれ同じ声で通す。問が変わったら同じ声でも別の声でもよい。'
                '第1問で使った声（Juniper / Oliver Silk / Mark Dou など）を女性・男性に1つずつ決めて全問で使い回すと、取り込み後の聞き比べが楽。'),
              P('先頭の [calm] / [curious] は演技の目安。不自然なら外して生成してよい。英文そのものは変えない（数字・否定・固有名詞は特に注意）。'),
              P('商用：ElevenLabs の有料契約が有効な状態で新規生成したものだけを送る（第1問と同じ条件）。', 'note')]

    story += [P('3. 保存と返し方（どれでも取り込める）', 'h1'),
              table([['方式', '名前の付け方', '備考'],
                     ['A. 1問＝1ファイル（おすすめ）', 'el2_set1_q1.mp3 のように「ファイル名」欄のとおり', 'Dialogue 機能で1問ぶんの会話を1本にしたもの'],
                     ['B. 1問＝発話ごと', 'フォルダ el2_set1_q1/ の中に 001.mp3, 002.mp3 …（話す順）', '発話数が台本と違うと取り込まない（取り違え防止）。間は0.35秒で自動結合'],
                     ['C. まとめ録り', 'ファイル名は自由（ElevenLabs の既定名のままでよい）', '第1問と同じく、文字起こし＋無音位置で自動で切り分ける。1ファイルに入れる順番はこの PDF の並び順どおりに']],
                    [110, 190, 200]),
              P('送られた音声は「商用の新音源」として audio_sources/commercial/ に原本ごと保管し、旧音源とは混ぜない（旧音源と同じ中身のファイルは自動で弾く）。'
                '確認が済んだら、旧音源は第1問と同じく削除する。', 'note')]

    story += [P('4. 一覧（チェック用）', 'h1'),
              table([['回-問', 'ファイル名', '話者（声の割当）', 'アプリ']] +
                    [[f'{a}-{b}', st, ' / '.join(f"{'女' if gender_of(w, q['speakers']) == 'F' else '男'}={role_of(w, q['speakers'], list(dict.fromkeys(t['who'] for t in q['turns'])))}"
                                                  for w in dict.fromkeys(t['who'] for t in q['turns'])),
                      '収録済' if has else '★今回追加（録音待ち）'] for a, b, st, has, q in rows],
                    [40, 100, 250, 90]),
              PageBreak()]

    for s in SETS:
        head = [P(f"第{s['set']}回（{s['difficulty']}）", 'h1')]  # 見出しだけページ末に残らないよう最初の問と一緒に置く
        for q in s['questions']:
            stem = f"el2_set{s['set']}_q{q['q']}"
            has = (PUBLIC / f'{stem}.mp3').exists()  # 旧音源がある＝既存の問
            order = list(dict.fromkeys(t['who'] for t in q['turns']))
            count = {'F': 0, 'M': 0}
            label = {}
            for w in order:
                g = gender_of(w, q['speakers'])
                count[g] += 1
                label[w] = f"{'女' if g == 'F' else '男'}{count[g]}"
            block = head + [P(f"問{q['q']}　{stem}{'' if has else '　★今回追加（録音待ち）'}", 'h2'),
                     P(f"場面（読まない）：{q['scene']}　／　話者：" + '・'.join(f"{label[w]}＝{role_of(w, q['speakers'], order)}" for w in order), 'small')]
            if s['set'] in (1, 8, 10) and 'M' in order and q['speakers'].startswith('母親'):
                block.append(P('旧PDFでは母親を「男1」にしていた。女性の声で録る。', 'warn'))
            for i, t in enumerate(q['turns'], 1):
                block += [P(f"{label[t['who']]}｜セリフ {i:03d}（保存番号 {i:03d}）", 'who'),
                          Paragraph(html.escape(f"{tag_for(t['text'])} {t['text']}"), ST['en'])]
            block.append(P(f"設問（読まない・画面に出る）：{q['question']}", 'small'))
            head = []
            story.append(KeepTogether(block))
        story.append(Spacer(1, 6))

    def deco(c, doc):
        w, h = A4
        c.setStrokeColor(TEAL); c.setLineWidth(0.7); c.line(40, h - 32, w - 40, h - 32)
        c.setFillColor(TEAL); c.setFont('EN', 8); c.drawString(40, h - 24, 'MANATOBI / LISTENING Q2 RE-RECORD / eleven_v3')
        c.setFillColor(colors.HexColor('#66737b')); c.drawString(40, 22, f'{TODAY} | scripts unchanged from app data')
        c.drawRightString(w - 40, 22, str(doc.page))

    OUT.parent.mkdir(exist_ok=True)
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=40, rightMargin=40, topMargin=44, bottomMargin=40,
                            title='マナトビ 第2問 録り直し台本', author='Manatobi')
    doc.build(story, onFirstPage=deco, onLaterPages=deco)
    print(f'{OUT.relative_to(ROOT)}  （{total}問・録音待ち{len(missing)}問を含む）')


if __name__ == '__main__':
    build()
