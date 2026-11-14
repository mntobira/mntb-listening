#!/usr/bin/env python3
"""
TOEIC® L&R リスニング（全15回・120トラック・180問）の ElevenLabs 読み上げ原稿 PDF を作成する。

■ 特徴（scripts/elevenlabs-onepass/make.py と同じ品質基準）
  ・英語本文は DejaVuSans（合字 ﬁ/ﬂ/ﬀ が発生しないフォント）で描画
  ・点線枠の中は ElevenLabs にそのままコピー＆ペーストできる英文と <break time="..." /> のみ
    （日本語訳や解説は枠の外・または別ブロックに分離）
  ・生成後に pdftotext と pdfinfo で全120トラックの英文一致＆合字ゼロを自動検証する
"""
import json
import os
import re
import subprocess
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT_DIR = os.path.join(ROOT, 'docs/elevenlabs_toeic_listening')
MANIFEST_PATH = os.path.join(OUT_DIR, 'manifest.json')
PDF_PATH = os.path.join(OUT_DIR, 'ElevenLabs_TOEICリスニング_全15回_原稿.pdf')

pdfmetrics.registerFont(TTFont('JA', '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'))
pdfmetrics.registerFont(TTFont('EN', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('ENB', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

W, H = A4
ML = 13 * mm
BOXW = W - 2 * ML

NAVY = colors.HexColor('#1F3566')
GOLD_BG = colors.HexColor('#FFF8E7')
SOFT_BG = colors.HexColor('#F8FAFC')
GREY = colors.HexColor('#475569')
MUTED = colors.HexColor('#64748B')
BORDER = colors.HexColor('#94A3B8')


def font_for(ch: str, bold_en: bool = False) -> str:
    if ord(ch) < 0x2000 or ch in '—“”’‘…':
        return 'ENB' if bold_en else 'EN'
    return 'JA'


def runs(text: str, bold_en: bool = False) -> list[list[str]]:
    out: list[list[str]] = []
    for ch in text:
        f = font_for(ch, bold_en)
        if out and out[-1][0] == f:
            out[-1][1] += ch
        else:
            out.append([f, ch])
    return out


def mwidth(text: str, size: float, bold_en: bool = False) -> float:
    return sum(pdfmetrics.stringWidth(t, f, size) for f, t in runs(text, bold_en))


def mdraw(c: canvas.Canvas, x: float, y: float, text: str, size: float, right: bool = False, bold_en: bool = False) -> None:
    if right:
        x -= mwidth(text, size, bold_en)
    for f, t in runs(text, bold_en):
        c.setFont(f, size)
        c.drawString(x, y, t)
        x += pdfmetrics.stringWidth(t, f, size)


def wrap_en_line(line: str, font_name: str, size: float, max_w: float) -> list[str]:
    if pdfmetrics.stringWidth(line, font_name, size) <= max_w:
        return [line]
    words = line.split(' ')
    out: list[str] = []
    cur = ''
    for w in words:
        cand = f'{cur} {w}'.strip() if cur else w
        if pdfmetrics.stringWidth(cand, font_name, size) <= max_w:
            cur = cand
        else:
            if cur:
                out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


def draw_ja_wrapped(c: canvas.Canvas, x: float, y: float, text: str, size: float, max_w: float, leading: float) -> float:
    line = ''
    indent = '　' if text.startswith('・') else ''
    for ch in text:
        if mwidth(line + ch, size) > max_w:
            mdraw(c, x, y, line, size)
            y -= leading
            line = indent + ch
        else:
            line += ch
    if line:
        mdraw(c, x, y, line, size)
        y -= leading
    return y


def draw_footer(c: canvas.Canvas, page_no: int, total_pages: int) -> None:
    c.setFillColor(MUTED)
    mdraw(c, ML, 8.5 * mm, 'まなとび　TOEIC リスニング 全15回 ElevenLabs 収録用スクリプト', 8)
    mdraw(c, W - ML, 8.5 * mm, f'{page_no} / {total_pages}', 8.5, right=True)


def draw_cover_page(c: canvas.Canvas, total_pages: int) -> None:
    # ヘッダー帯
    c.setFillColor(NAVY)
    c.roundRect(ML, H - 34 * mm, BOXW, 21 * mm, 3 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    mdraw(c, ML + 5 * mm, H - 22 * mm, 'ElevenLabs 収録用スクリプト　TOEIC リスニング 全15回', 15.5, bold_en=True)
    mdraw(c, ML + 5 * mm, H - 29.5 * mm, '全15回 × 8トラック ＝ 計120ファイル（Part 2 応答90問・Part 3 会話45問・Part 4 説明文45問／計180問）', 9.2)

    y = H - 43 * mm
    sections = [
        '■ 1. このPDFの使い方（コピペでそのまま収録できます）',
        '・各回は「2ページ見開き構成」です（全15回＝30ページ＋この表紙1ページ＝計31ページ）。',
        '　1ページ目：Part 2（問1〜問6の6ファイル：tpl_rXX_p2_q1.mp3 〜 q6.mp3）',
        '　2ページ目：Part 3（会話1ファイル：tpl_rXX_p3.mp3）＋ Part 4（説明文1ファイル：tpl_rXX_p4.mp3）',
        '・各トラックの「点線の枠の中」には英語と <break time="..." /> だけが入っています（和訳や解説は枠外）。',
        '・点線の枠の中だけをコピーして ElevenLabs に貼り付け、見出し左上のファイル名（例 tpl_r01_p2_q1.mp3）で保存してください。',
        '■ 2. ElevenLabs の推奨設定',
        '・モデル：Eleven Multilingual v2（<break time="..." /> タグがそのまま無音の間として機能します）',
        '・パラメータ目安：Stability 60〜70% ／ Similarity 75% ／ Style 0% ／ Speed 0.95〜1.0 ／ Speaker boost ON',
        '・声の選び方（おすすめ）：アメリカ英語またはイギリス英語の聞き取りやすい女性声 (W) と男性声 (M) を1人ずつ決めます。',
        '　- Part 2（応答）：1声の Text to Speech でそのまま1本ずつ生成できます（さらにこだわる場合は Studio で質問者と A〜C を分けてもOK）。',
        '　- Part 3（会話）：枠内の各行頭に [Woman] / [Man] が付いています。ElevenLabs Studio（Projects）に貼り付けて [Woman] を女性声、[Man] を男性声に割り当てて書き出すと自然な2人の会話になります（単一TTSで録る場合は行頭の [Woman] / [Man] だけ消してください）。',
        '　- Part 4（説明文）：指定の性別（女性 W または 男性 M）の Text to Speech にそのまま貼り付けて1発で生成できます。',
        '■ 3. アプリへの音声反映手順（録音前でもアプリは動作します）',
        '・録音した .mp3 ファイルをフォルダにまとめ、次のコマンドを1行実行するだけでアプリに取り込まれます：',
        '　python3 scripts/toeic-listening-audio/import_mp3.py <MP3を入れたフォルダ>',
        '・public/audio/toeic_listening/<trackId>.mp3 にコピーされ、index.json が自動更新されます。',
        '・まだ MP3 を入れていないトラックがあっても、アプリ側で自動的にブラウザ音声合成（Web Speech API）へ切り替わるため、1回分ずつ順番に録音・追加していく運用でも問題なく遊べます。',
        '■ 4. ファイル名ルール一覧（第01回〜第15回：XX は 01〜15 の2桁）',
        '・tpl_rXX_p2_q1.mp3 〜 tpl_rXX_p2_q6.mp3 …… Part 2 応答問題（問1〜問6・各約12〜16秒）',
        '・tpl_rXX_p3.mp3 ………………………………… Part 3 会話問題（問7〜9用対話・約45〜60秒）',
        '・tpl_rXX_p4.mp3 ………………………………… Part 4 説明文問題（問10〜12用トーク・約45〜60秒）',
    ]

    for p in sections:
        is_head = p.startswith('■')
        if is_head:
            y -= 2.2 * mm
            c.setFillColor(NAVY)
            size = 10.8
            lead = 15.5
        else:
            c.setFillColor(colors.black)
            size = 9.3
            lead = 13.8
        y = draw_ja_wrapped(c, ML, y, p, size, BOXW, lead)

    # 商標注記
    c.setFillColor(GOLD_BG)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.roundRect(ML, 15 * mm, BOXW, 12 * mm, 2 * mm, stroke=1, fill=1)
    c.setFillColor(GREY)
    mdraw(c, ML + 3 * mm, 21.8 * mm, '※ 本スクリプトはすべて「まなとび」オリジナルの書き下ろし問題です（実在しない架空の社名・人名・施設名を使用）。', 8.2)
    mdraw(c, ML + 3 * mm, 17.5 * mm, '※ TOEIC is a registered trademark of ETS. This product is not endorsed or approved by ETS.', 8.0)

    draw_footer(c, 1, total_pages)
    c.showPage()


def draw_track_box(
    c: canvas.Canvas,
    top_y: float,
    track: dict,
    font_size: float = 8.8,
    pad_v: float = 2.6 * mm,
) -> float:
    """1トラックの見出し＋点線コピー枠を描き、次の描画開始 y 座標を返す"""
    # 見出し行（枠外：コピー対象外）
    c.setFillColor(NAVY)
    c.setFont('ENB', 9.8)
    c.drawString(ML, top_y, track['fileName'])
    fn_w = pdfmetrics.stringWidth(track['fileName'], 'ENB', 9.8)

    meta_text = f"{track['titleJa']} ｜ {track['voiceGuide']}"
    avail_w = BOXW - fn_w - 2.5 * mm
    meta_size = 7.4
    while meta_size > 6.2 and mwidth(meta_text, meta_size) > avail_w:
        meta_size -= 0.3
    if mwidth(meta_text, meta_size) > avail_w:
        meta_text = f"{track['titleJa']}"
    c.setFillColor(GREY)
    mdraw(c, ML + fn_w + 2.5 * mm, top_y, meta_text, meta_size)

    # 枠内の英文（折り返し計算）
    inner_w = BOXW - 6 * mm
    wrapped_rows: list[tuple[str, bool]] = []
    for raw_line in track['lines']:
        is_break = raw_line.startswith('<break')
        for seg in wrap_en_line(raw_line, 'EN', font_size, inner_w):
            wrapped_rows.append((seg, is_break))

    lead = font_size * 1.34
    box_top = top_y - 2.2 * mm
    box_h = len(wrapped_rows) * lead + pad_v * 2

    c.setFillColor(SOFT_BG)
    c.setStrokeColor(NAVY)
    c.setDash(3.5, 2.5)
    c.setLineWidth(1.0)
    c.roundRect(ML, box_top - box_h, BOXW, box_h, 2.2 * mm, stroke=1, fill=1)
    c.setDash()

    cy = box_top - pad_v - font_size * 0.85
    c.setFont('EN', font_size)
    for seg, is_break in wrapped_rows:
        c.setFillColor(MUTED if is_break else colors.black)
        c.drawString(ML + 3 * mm, cy, seg)
        cy -= lead

    return box_top - box_h - 4.2 * mm


def draw_round_pages(c: canvas.Canvas, round_no: int, round_tracks: list[dict], start_page_no: int, total_pages: int) -> None:
    p2_tracks = [t for t in round_tracks if t['part'] == 'Part 2']
    p3_track = next(t for t in round_tracks if t['part'] == 'Part 3')
    p4_track = next(t for t in round_tracks if t['part'] == 'Part 4')

    # --- 1ページ目: Part 2（6トラック） ---
    c.setFillColor(NAVY)
    mdraw(c, ML, H - 14 * mm, f'第{round_no:02d}回（1/2）Part 2 応答問題　問1〜問6（6本）', 11.2, bold_en=True)
    c.setFillColor(GREY)
    mdraw(c, W - ML, H - 14 * mm, '点線枠内のみ ElevenLabs へ貼り付け', 8.0, right=True)

    y = H - 21.5 * mm
    for tr in p2_tracks:
        y = draw_track_box(c, y, tr, font_size=8.4, pad_v=2.0 * mm)
        assert y > 12 * mm, f'Round {round_no} Part 2 overflow: y={y}'

    draw_footer(c, start_page_no, total_pages)
    c.showPage()

    # --- 2ページ目: Part 3（会話）＋ Part 4（説明文）＋ 和訳確認メモ ---
    c.setFillColor(NAVY)
    mdraw(c, ML, H - 14 * mm, f'第{round_no:02d}回（2/2）Part 3 会話 ＆ Part 4 説明文（2本）', 11.2, bold_en=True)
    c.setFillColor(GREY)
    mdraw(c, W - ML, H - 14 * mm, 'Part 3 は [Woman]/[Man] 2声・Part 4 は1声', 8.0, right=True)

    y = H - 22 * mm
    y = draw_track_box(c, y, p3_track, font_size=8.6, pad_v=2.6 * mm)
    y -= 2.0 * mm
    y = draw_track_box(c, y, p4_track, font_size=8.8, pad_v=2.6 * mm)

    # 下部に収録チェック用の短い日本語サマリーを添える（点線枠の外）
    if y > 32 * mm:
        y -= 1.5 * mm
        c.setFillColor(GOLD_BG)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        memo_h = min(y - 14 * mm, 38 * mm)
        c.roundRect(ML, y - memo_h, BOXW, memo_h, 2 * mm, stroke=1, fill=1)
        my = y - 4.5 * mm
        c.setFillColor(NAVY)
        mdraw(c, ML + 3 * mm, my, f'【収録内容チェック用メモ（第{round_no:02d}回・枠外のためコピー不要）】', 8.2)
        my -= 4.3 * mm
        c.setFillColor(GREY)
        p3_ja = ' / '.join(p3_track['referenceJa'])
        p4_ja = ' '.join(p4_track['referenceJa'])
        for label_line in [f'・Part 3 概要：{p3_ja}', f'・Part 4 概要：{p4_ja}']:
            # 2行までに収める
            clipped = label_line if len(label_line) <= 135 else label_line[:134] + '…'
            my = draw_ja_wrapped(c, ML + 3 * mm, my, clipped, 7.5, BOXW - 6 * mm, 10.5)
            if my < y - memo_h + 4 * mm:
                break

    assert y > 12 * mm, f'Round {round_no} Part 3/4 overflow: y={y}'
    draw_footer(c, start_page_no + 1, total_pages)
    c.showPage()


def verify_pdf(pdf_path: str, tracks: list[dict], expected_pages: int) -> None:
    raw = subprocess.run(['pdftotext', '-raw', pdf_path, '-'], capture_output=True, text=True, check=True).stdout
    flat = re.sub(r'\s+', ' ', raw)

    missing: list[str] = []
    for tr in tracks:
        expected_str = re.sub(r'\s+', ' ', ' '.join(tr['lines'])).strip()
        if expected_str not in flat:
            missing.append(tr['trackId'])

    ligatures = [ch for ch in ('ﬁ', 'ﬂ', 'ﬀ', 'ﬃ', 'ﬄ') if ch in raw]
    info_out = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True, check=True).stdout
    m = re.search(r'Pages:\s+(\d+)', info_out)
    pages = int(m.group(1)) if m else 0

    print(f'[verify_pdf] {pdf_path}')
    print(f'[verify_pdf] Pages={pages} (expected {expected_pages}), Tracks={len(tracks)}, Missing={len(missing)}, Ligatures={ligatures}')
    if missing:
        raise AssertionError(f'PDF 内でスクリプト一致が確認できなかったトラック: {missing[:5]}')
    if ligatures:
        raise AssertionError(f'合字が混入しています: {ligatures}')
    if pages != expected_pages:
        raise AssertionError(f'ページ数不一致: {pages} != {expected_pages}')


def main() -> None:
    if not os.path.exists(MANIFEST_PATH):
        raise SystemExit(f'先に export-manifest.mts を実行してください: {MANIFEST_PATH}')
    manifest = json.load(open(MANIFEST_PATH, encoding='utf-8'))
    tracks: list[dict] = manifest['tracks']
    assert len(tracks) == 120, f'120トラック必要ですが {len(tracks)} 件でした'

    total_pages = 1 + 15 * 2  # 表紙1ページ + 各回2ページ×15回 = 31ページ
    c = canvas.Canvas(PDF_PATH, pagesize=A4)
    c.setTitle('ElevenLabs 収録用スクリプト TOEIC リスニング 全15回')
    c.setAuthor('まなとび')
    c.setSubject('TOEIC Listening Rounds 1-15 ElevenLabs Recording Scripts')

    draw_cover_page(c, total_pages)
    for r in range(1, 16):
        r_tracks = [t for t in tracks if t['round'] == r]
        draw_round_pages(c, r, r_tracks, 2 + (r - 1) * 2, total_pages)

    c.save()
    verify_pdf(PDF_PATH, tracks, total_pages)


if __name__ == '__main__':
    main()
