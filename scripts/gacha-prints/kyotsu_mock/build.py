"""共通テスト 英語 予想問題（LR プリント）を作る。

  python3 scripts/gacha-prints/kyotsu_mock/build.py          # 5回分すべて
  python3 scripts/gacha-prints/kyotsu_mock/build.py 1 3      # 第1回・第3回だけ

出力: public/prints/print_lr_kyotsu_{r,l}_{n}.pdf ＋ thumbs/*.webp
     .tmpwork/kyotsu-mock.json（ページ数・KB。src/data/kyotsuMockPrints.ts に写す）
データ: setN_r.py（READING）・setN_l.py（LISTENING）
"""
import sys, json, importlib
from pathlib import Path
from reportlab.platypus import Paragraph, Spacer, CondPageBreak, KeepTogether, Table, TableStyle
from reportlab.platypus.flowables import PageBreakIfNotEmpty as PageBreak
from reportlab.lib.units import mm
from reportlab.lib import colors

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import render as R  # noqa: E402

ROOT = HERE.parents[2]
OUT = ROOT / 'public' / 'prints'
EXPECT = {
    'R': {'parts': 8, 'marks': 44, 'points': 100},
    'L': {'parts': 6, 'marks': 37, 'points': 100},
}


def page_break(story):
    """末尾の余白を消してから改ページ（余白だけが次のページにはみ出して白紙ができるのを防ぐ）"""
    while story and isinstance(story[-1], Spacer):
        story.pop()
    story.append(PageBreak())


def validate(kind, data):
    parts = data['parts']
    marks = R.number_marks(parts)
    total = sum(R.q_points(q)[0] for p in parts for s in p['sections'] for q in s['qs'])
    for p in parts:
        sub = sum(R.q_points(q)[0] for s in p['sections'] for q in s['qs'])
        assert sub == p['pts'], f'{kind} {p["label"]}: 配点 {sub} != {p["pts"]}'
    e = EXPECT[kind]
    assert len(parts) == e['parts'], (kind, len(parts))
    assert marks == e['marks'], f'{kind}: 解答数 {marks} != {e["marks"]}'
    assert total == e['points'], f'{kind}: 合計 {total} != 100'
    return marks


def english_words(data):
    import re
    n = 0
    def walk(b):
        nonlocal n
        if isinstance(b, (list, tuple)):
            for x in b:
                walk(x)
        elif isinstance(b, str):
            n += len(re.findall(r"[A-Za-z][A-Za-z'’-]*", b))
        elif isinstance(b, dict):
            for v in b.values():
                walk(v)
    for p in data['parts']:
        for s in p['sections']:
            walk(s.get('blocks', [])); walk(s.get('script', []))
            for q in s['qs']:
                walk(q.get('prompt', '')); walk(q.get('choices', [])); walk(q.get('pre', [])); walk(q.get('script', []))
    return n


# ───────── リーディング ─────────
def build_reading(n, data):
    marks = validate('R', data)
    words = english_words(data)
    pdf = OUT / f'print_lr_kyotsu_r_{n}.pdf'
    label = f'共通テスト 英語リーディング 予想問題 第{n}回'
    doc = R.make_doc(pdf, label + '（LR）', label)
    toc = [(p['label'], p['title']) for p in data['parts']]
    story = R.cover_story(
        f'大学入学共通テスト 予想問題（2025年度〜 新課程の形式）　第{n}回',
        f'外　国　語\n〔英語（リーディング）〕',
        f'{data["theme"]}\n80分・100点・大問8・解答数{marks}　オリジナル問題（本文・設問・解説すべて書き下ろし）',
        [('80分', '試験時間'), ('100点', '配点'), (f'{marks}', '解答数'), (f'約{words // 10 * 10:,}語', '英文の量')],
        ['**本番と同じ順で80分で解く**。時間配分の目安：第1〜3問 15分／第4問 10分／第5問 13分／第6問 13分／第7問 13分／第8問 14分（見直し2分）。',
         '答えは「解答用紙」の番号に○。終わったら「正解と配点」で採点し、「解説」で根拠の場所を確認する。',
         '本番の傾向（情報の検索・事実と意見の区別・推敲・複数資料の統合・要約・論理展開）をすべての大問で再現しています。',
         '各大問の解説の最初に**本文の要旨（日本語）**があります。読み終えた後の内容確認に使えます。'],
        toc)

    for p in data['parts']:
        story += [R.bar(f'{p["label"]}　（配点　{p["pts"]}）'), Spacer(1, 3 * mm)]
        for s in p['sections']:
            if s.get('tag'):
                story.append(Paragraph(f'<font name="JPB">{s["tag"]}</font>', R.st['h3']))
            if s.get('instr'):
                story += [R.boxed([Paragraph(R.ml(s['instr']), R.st['ja'])], pad=6), Spacer(1, 4)]
            for b in s.get('blocks', []):
                story += R.render_block(b)
            story.append(Spacer(1, 2 * mm))
            for q in s['qs']:
                story += R.q_flow(q)
        page_break(story)

    # 解答用紙
    story += [Paragraph('解答用紙（マークシートの代わり）', R.st['h2']),
              Paragraph('選んだ番号を○で囲む。採点後、間違えた番号に印をつけ、解説で根拠の位置を確かめる。', R.st['jas']), Spacer(1, 3 * mm),
              R.mark_sheet(marks), PageBreak()]
    # 正解と配点
    t, total = R.key_table(data['parts'], marks)
    story += [Paragraph('正解と配点', R.st['h2']), t, Spacer(1, 4 * mm)]
    story.append(R.boxed([Paragraph('<font name="JPB">得点の目安</font>', R.st['ja']),
                          Paragraph('80点以上：難関国公立の合格圏／65点：中堅国公立・共テ利用の標準／50点：平均点前後。'
                                    '第5問以降で崩れる人は「設問を先に読み、探す情報を決めてから本文へ」を徹底する。', R.st['ex'])],
                         ))
    story.append(PageBreak())
    # 解説
    story.append(Paragraph('解説', R.st['h2']))
    for p in data['parts']:
        story += [CondPageBreak(50 * mm), R.bar(f'{p["label"]}　{p["title"]}'), Spacer(1, 2 * mm)]
        if p.get('gist'):
            story.append(R.boxed([Paragraph('<font name="JPB">本文の要旨</font>', R.st['ja'])] + [Paragraph(R.ml(x), R.st['ex']) for x in p['gist']],
                                 bg=R.PAPER, border=R.LINE))
            story.append(Spacer(1, 3 * mm))
        for s in p['sections']:
            for q in s['qs']:
                story += R.explain_flow(q)
        if p.get('vocab'):
            story.append(Paragraph('<font name="JPB">語句</font>　' + '　／　'.join(R.esc(v) for v in p['vocab']), R.st['jas']))
            story.append(Spacer(1, 3 * mm))
    doc.build(story)
    return pdf, marks, words, R.check_answer_balance(data['parts'])


# ───────── リスニング ─────────
def script_flow(lines, times=None):
    out = []
    if times:
        out.append(Paragraph(f'<font name="JPB" size="8.5">［{times}回読み］</font>', R.st['jas']))
    rows = []
    for ln in lines:
        sp, e, j = ln
        rows.append([Paragraph(f'<b>{R.esc(sp)}</b>' if sp else '', R.S('sp', font='ENB', fontSize=9.4, leading=13)),
                     [Paragraph(R.en(e), R.st['scr']), Paragraph(R.ml(j), R.st['tr'])]])
    t = Table(rows, colWidths=[22 * mm, R.W - 22 * mm])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 2),
                           ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
                           ('LINEBELOW', (0, 0), (-1, -2), 0.25, colors.HexColor('#999999'))]))
    out += [R.boxed([t], pad=5), Spacer(1, 3)]
    return out


def build_listening(n, data):
    marks = validate('L', data)
    # 本番のリスニングは「問番号＝解答番号」（問1〜問37）
    for p in data['parts']:
        for s in p['sections']:
            for q in s['qs']:
                m = q['marks']
                q['no'] = str(m[0]) if len(m) == 1 else f'{m[0]}〜{m[-1]}'
                q['listening'] = True
    words = english_words(data)
    pdf = OUT / f'print_lr_kyotsu_l_{n}.pdf'
    label = f'共通テスト 英語リスニング 予想問題 第{n}回'
    doc = R.make_doc(pdf, label + '（LR）', label)
    story = R.cover_story(
        f'大学入学共通テスト 予想問題（2025年度〜 新課程の形式）　第{n}回',
        f'外　国　語\n〔英語（リスニング）〕',
        f'{data["theme"]}\n30分・100点・大問6・解答数{marks}　問題冊子＋全スクリプト（英文・全訳）＋解説',
        [('30分', '試験時間'), ('100点', '配点'), (f'{marks}', '解答数'), (f'約{words // 10 * 10:,}語', 'スクリプトの量')],
        ['**音声は付いていません**。スクリプトを家族や友だちに読んでもらうか、読み上げアプリに貼って使う（第1・2問は2回、第3〜6問は1回だけ読む）。',
         '一人で使うなら：①問題冊子だけ見て設問と選択肢を先読み → ②スクリプトを1回黙読して解く（速読の練習）→ ③音読してから再挑戦。',
         '本番と同じく、第4問以降は**読み上げ前に表・ワークシート・図を見て「何を聞き取るか」を決める**のが得点の鍵。',
         'スクリプトには英国・非母語話者の話し手も入れています（話し手の欄に表示）。'],
        [(p['label'], p['title']) for p in data['parts']])

    for p in data['parts']:
        story += [R.bar(f'{p["label"]}　（配点　{p["pts"]}）　音声は{p["sections"][0]["times"]}回流れます。'), Spacer(1, 3 * mm)]
        for s in p['sections']:
            head = []
            if s.get('tag'):
                head.append(Paragraph(f'<font name="JPB">{s["tag"]}</font>', R.st['h3']))
            if s.get('instr'):
                head += [R.boxed([Paragraph(R.ml(s['instr']), R.st['ja'])], pad=6), Spacer(1, 4)]
            for b in s.get('blocks', []):
                head += R.render_block(b)
            story.append(KeepTogether(head + [Spacer(1, 2 * mm)]))
            for q in s['qs']:
                if q.get('situation'):
                    story.append(Paragraph(R.ml(q['situation']), R.st['jas']))
                story += R.q_flow(q)
        page_break(story)

    story += [Paragraph('解答用紙（マークシートの代わり）', R.st['h2']), Spacer(1, 2 * mm), R.mark_sheet(marks), PageBreak()]
    t, total = R.key_table(data['parts'], marks)
    story += [Paragraph('正解と配点', R.st['h2']), t, PageBreak()]

    story.append(Paragraph('スクリプト・全訳・解説', R.st['h2']))
    story.append(Paragraph('英文の下の行が全訳。話し手の M は男性・W は女性。', R.st['jas']))
    for p in data['parts']:
        story += [CondPageBreak(50 * mm), R.bar(f'{p["label"]}　{p["title"]}'), Spacer(1, 2 * mm)]
        for s in p['sections']:
            if s.get('tag'):
                story.append(Paragraph(f'<font name="JPB">{s["tag"]}</font>', R.st['h3']))
            if s.get('script'):
                story.append(CondPageBreak(40 * mm))
                story += script_flow(s['script'], s['times'])
                for q in s['qs']:
                    story += R.explain_flow(q)
            else:
                for q in s['qs']:
                    story.append(CondPageBreak(min(95, 30 + 9 * len(q['script'])) * mm))
                    story += [Paragraph(f'<font name="JPB">問 {q["no"]}</font>', R.st['ja'])] + script_flow(q['script'], s['times']) + R.explain_flow(q)
        if p.get('tips'):
            story.append(R.boxed([Paragraph('<font name="JPB">この大問のコツ</font>', R.st['ja'])] + [Paragraph(R.ml(x), R.st['ex']) for x in p['tips']]))
            story.append(Spacer(1, 3 * mm))
    doc.build(story)
    return pdf, marks, words, R.check_answer_balance(data['parts'])


def main(nums):
    report_path = ROOT / '.tmpwork' / 'kyotsu-mock.json'
    report_path.parent.mkdir(exist_ok=True)
    report = json.loads(report_path.read_text()) if report_path.exists() else {}
    for n in nums:
        for kind, mod, fn in (('r', f'set{n}_r', build_reading), ('l', f'set{n}_l', build_listening)):
            try:
                m = importlib.import_module(mod)
            except ModuleNotFoundError:
                print('skip', mod); continue
            data = m.READING if kind == 'r' else m.LISTENING
            pdf, marks, words, dist = fn(n, data)
            thumb = OUT / 'thumbs' / (pdf.stem + '.webp')
            R.make_thumb(pdf, thumb)
            pages = R.pdf_pages(pdf)
            kb = round(pdf.stat().st_size / 1024)
            report[pdf.stem] = {'pages': pages, 'kb': kb, 'marks': marks, 'words': words, 'dist': dist, 'theme': data['theme']}
            print(f'{pdf.name}: {pages}p {kb}KB marks={marks} words={words} dist={dist}')
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main([int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5])
