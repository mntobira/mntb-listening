#!/usr/bin/env python3
"""Build searchable Japanese PDF guides and all MiniMax scripts; no API calls."""
from pathlib import Path
import json
import re
import html
import hashlib
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle, Image

ROOT = Path(__file__).resolve().parents[1]
assert Path.cwd() == ROOT, 'Run in project root'
PACK = ROOT / '.delivery/listening-audio-prompts-2026-09-18'
OUT = ROOT / '.delivery'
ART = ROOT / '.tmpwork/minimax-guide'
JOBS = json.loads((PACK / 'jobs.json').read_text())
assert len(JOBS) == 364 and sum(len(j['segments']) for j in JOBS) == 1309
pdfmetrics.registerFont(TTFont('JP', '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'))
pdfmetrics.registerFont(TTFont('EN', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('ENBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
TEAL = colors.HexColor('#176b70')
INK = colors.HexColor('#20313c')
LIGHT = colors.HexColor('#eff6f6')
STYLES = {
 'title': ParagraphStyle('title', fontName='JP', fontSize=25, leading=37, textColor=TEAL, spaceAfter=18),
 'h1': ParagraphStyle('h1', fontName='JP', fontSize=18, leading=27, textColor=TEAL, spaceAfter=14, keepWithNext=True),
 'h2': ParagraphStyle('h2', fontName='JP', fontSize=12, leading=19, textColor=TEAL, spaceBefore=10, spaceAfter=6, keepWithNext=True),
 'body': ParagraphStyle('body', fontName='JP', fontSize=10.4, leading=17.5, textColor=INK, spaceAfter=9, wordWrap='CJK'),
 'small': ParagraphStyle('small', fontName='JP', fontSize=8.7, leading=13.5, textColor=INK, spaceAfter=6, wordWrap='CJK'),
 'english': ParagraphStyle('english', fontName='EN', fontSize=11.2, leading=18, textColor=INK, spaceAfter=12, splitLongWords=False),
 'label': ParagraphStyle('label', fontName='JP', fontSize=9, leading=14, textColor=TEAL, spaceBefore=8, spaceAfter=5, keepWithNext=True),
 'note': ParagraphStyle('note', fontName='JP', fontSize=10.3, leading=17.5, textColor=INK, backColor=LIGHT, borderPadding=9, spaceBefore=6, spaceAfter=16, wordWrap='CJK'),
}
CHAPTERS = {'el1_A':'第1問 A','el1_B':'第1問 B','el2':'第2問','el3':'第3問','el4_A':'第4問 A','el4_B':'第4問 B','el5':'第5問','el6_A':'第6問 A','el6_B':'第6問 B'}

def mixed(text):
    # Droid fallback is used only for non-ASCII glyphs; Latin uses embedded DejaVu.
    parts = re.split(r'([\x20-\x7e]+)', str(text))
    return ''.join('<font name="EN">'+html.escape(p)+'</font>' if p and all(32 <= ord(c) < 127 for c in p) else html.escape(p).replace('\n','<br/>') for p in parts)

def p(text, style='body'):
    return Paragraph(mixed(text), STYLES[style])

def en(text):
    return Paragraph(html.escape(text).replace('\n','<br/>'), STYLES['english'])

def heading(text, key, level=0):
    item = p(text, 'h1' if level == 0 else 'h2')
    item.bookmark = (key, text, level)
    return item

def table(rows, widths):
    t = Table([[p(c,'small') for c in row] for row in rows], colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),LIGHT),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),0.8,TEAL),('LINEBELOW',(0,1),(-1,-1),0.3,colors.HexColor('#dbe4e6')),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    return t

class Document(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.locations = {}
    def afterFlowable(self, item):
        if hasattr(item, 'bookmark'):
            key, text, level = item.bookmark
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=level, closed=level == 0)
            self.locations[key] = self.page

def page_decoration(c, doc):
    w,h=A4
    c.setStrokeColor(TEAL);c.setLineWidth(0.7);c.line(44,h-35,w-44,h-35)
    c.setFillColor(TEAL);c.setFont('EN',8);c.drawString(44,h-25,'MANATOBI  /  MINIMAX AUDIO PRODUCTION')
    c.setFillColor(colors.HexColor('#66737b'));c.setFont('EN',8)
    c.drawString(44,24,'Checked 2026-09-18 | Scripts are not audio licences')
    c.drawRightString(w-44,24,str(doc.page))

FAQ = 'For personal use (like social media posts or non-profit presentations), you\'re welcome to use the audio freely - just remember to include our logo or credit us as the source. For commercial use (such as monetized content or business purposes), please subscribe to our starter plan and above.'

COMMON = 'Create a clean English listening-exam recording. Speak only the supplied spoken text, exactly once. Do not read filenames, speaker labels, production instructions, Japanese context or JSON keys. Do not translate, paraphrase, correct grammar, add introductions, repeat the script, or add closing words. Preserve contractions, negation, numbers, names and paragraph order. Use clear natural connected speech, restrained emotion and natural sentence stress. Avoid theatrical acting and exaggerated emphasis on answer clues. Keep the approved voice consistent for each speaker. Follow the documented accent; do not silently convert all speakers to American English. Aim for dry close-microphone sound, with no added reverb, music or sound effects. Do not whisper. Avoid vocal fry. Start at a moderately slow natural pace and verify clarity before scaling up. Do not speed up or truncate a recording to fit a battle timer.'

def guide():
    s=[]
    s += [heading('マナトビ\nMiniMax 音声制作ガイド', 'guide'),p('全364音源・1,309発話の台本付き','title'),p('調査日：2026年9月18日\n対象：MiniMax Audio公式Web版。falやAPI契約とは区別します。'),p('先に結論：無料で試すことはできます。ただし、収益化アプリ用の音声は、公式FAQに従いStarter以上の契約中に新しく生成する方針です。','note'),p('このPDFの使い方','h2'),p('前半で声の切替と商用条件を確認し、後半から必要な問題を開いてください。PDFのしおりから「第1問A」などの章・各音源へ移動できます。文字を選択・コピーできるPDFです。'),p('入力欄へ貼るのは「読み上げ本文」だけ。話者名、ファイル名、指示は貼らないでください。','note'),table([['章','完成音源数'],*[[name,str(sum(j['chapterId']==cid for j in JOBS))] for cid,name in CHAPTERS.items()]], [355,145]),p('補助単語の新規録音、BGM、動画は対象外。統合版・旧音源は変更していません。','small'),PageBreak()]
    s += [heading('1. 無料枠と商用利用は別です','licence'),p('公式FAQの回答（生成音声について）','h2'),en(FAQ),p('日本語で要約すると：個人利用・非営利の発表等ではロゴまたは出典表示を付けて利用可能。収益化コンテンツや事業目的はStarter以上に加入してください、という説明です。'),p('無料枠の現行表示','h2'),p('公式料金ページにはFree：月10,000 credits、HD約12分と表示されていました。未ログイン向け紹介ページには5回の無料試用もあります。地域・アカウント・時期で変わり得るため、実際の残高と入力欄の消費見積りを優先してください。'),p('「無料期間中のsongsの商用利用」は音楽の説明です。今回の英語読み上げ（Speech/TTS）に、その許可をそのまま当てはめないでください。','note'),p('この教材は全140,599文字（英字だけで110,391文字）。無料10,000 creditsでは一巡分にも足りません。公式FAQは「通常、英字1字＝1credit」と説明していますが、空白・記号などの実課金は入力欄で確認します。'),p('支払いと証拠','h2'),p('Starter以上の契約が有効になったことを確認してから、本番を新規生成してください。生成日時、モデル、声名、設定、プラン、規約URL・確認日を記録します。無料時の音源への遡及適用、解約後の継続配信、追加credits購入だけの権利は、このFAQでは確定できません。'),p('出典： https://www.minimax.io/audio/subscribe\n生成前にもFAQを開いて再確認してください。','small'),PageBreak()]
    s += [heading('2. サイトを開いて、声を選ぶ','voice_ui'),p('1  https://www.minimax.io/audio を開く。初回のお知らせは右上の×で閉じます。Sign Inで自分のアカウントへログイン。'),p('2  TEXT TO SPEECH（または左のText to Speech）を選び、モデル表示がspeech-2.8-hdになっていることを確認。Musicではありません。'),p('3  本文入力欄の下にある現在の声名（確認時はCalm Woman）を押すと、Voice Selectionが開きます。'),p('4  Libraryを選び、Filtersや検索でEnglish、性別、必要なアクセントを探します。声のカードにあるUseを押して使用する声を変更。元の画面の声名が変わったことを確認します。'),p('「女性にして」と文章を書くのではなく、声のカードを選ぶ操作です。A: / B:を貼るだけで別人に切り替わるとは限りません。','note')]
    image=ART/'minimax_voice_picker.png'
    if image.exists():
        s += [Image(str(image),width=490,height=344.5),p('実際に確認した未ログイン画面。Voice Selection / Library / Filters / Useを確認。生成・課金・ログイン後のダウンロード動作は未実行です。画面構成は更新される場合があります。','small')]
    s += [PageBreak()]
    s += [heading('3. 「人を変える」具体例','dialogue_example'),p('第2問・第1回・問1（カフェ）は、W＝女性店員、M＝男性客の順です。まず女性の声を1つ、男性の声を1つ決め、名前をメモしておきます。'),table([['順','選ぶ声','貼る本文','保存名'],['1','女性の声A','Would you like anything to drink with your sandwich?','001'],['2','男性の声B',"I’ll have coffee, please. No sugar, but with milk.",'002'],['3','最初と同じ女性A','Ice or hot?','003'],['4','最初と同じ男性B','Hot, please.','004']],[30,105,315,50]),p('この表は操作説明用です。コピーには後半の原文欄を使ってください。台本のIceをIcedなどに勝手に直しません。','small'),p('各行ごとの操作','h2'),p('① 声名をクリック → 該当する声のUseを選ぶ。\n② 入力欄をいったん空にして、その行の本文だけ貼る。\n③ 生成前に声名・モデル・消費creditsを確認してGenerate。\n④ 最初と最後の語が切れていないか試聴。保存できる画面でDownload等の保存操作を行う。保存ボタンの位置はログイン後の実画面で確認してください。\n⑤ 001、002…の番号で保存。次の発話へ進み、話者が戻ったら同じ声名を選び直す。'),p('無理に自分で結合しなくて大丈夫です。発話ごとに名前を付けてこの部屋へ返せば、こちらで順番と間を確認して結合します。','note'),p('Voice Slots（Clone & Design）は自作・クローン声の枠です。会話で何人を話させるかとは別の項目で、今回は標準声を選ぶため、実在の人の声をクローンする必要はありません。'),PageBreak()]
    s += [heading('4. 声の選び方と設定','settings'),p('第一候補はMiniMax Speech 2.8 HD。初回試聴の女性声はAPI上のEnglish_Graceful_Ladyでした。ただし、公式Web版の表示名や提供状況が同じとは限りません。見当たらない場合はIDを本文欄へ貼らず、声一覧の画面をこの部屋へ送ってください。'),p('選び方','h2'),p('Englishかつ指定アクセントを優先し、Female/Male等の表示を確認。息が多い、ささやき、怪物、強い演技の声を避け、短い本文で声の聞き取りやすさを比較します。現在の候補一覧にはUS・British・Indian等の区分が見られました。名称だけで性別やアクセントを決めません。'),table([['項目','初期案と注意'],['Speed','0.85〜0.95程度を比較。数値指定欄がない場合は標準から開始。速度は各サービス・声で体感が異なります。'],['Emotion','neutralを選べる場合はneutral。無感情にせず自然な強弱は残す。'],['Pitch / Volume','原則デフォルト。高低だけで別人を作らず、別の標準ボイスを使う。'],['保存形式','無圧縮WAVまたはFLACが選べれば優先。MP3のみでも可。拡張子だけ変更しない。'],['反響感','別の標準声・同一音量で試聴。強いノイズ除去で子音を削らない。No reverbを本文に書かない。']],[100,400]),p('原本にアクセント指定がある話者は、その指定を保持。未指定部分だけ「米国英語」を制作上の初期案としています。話者情報の不足がある48音源は後半に要確認と表示しています。実voice_id/声名の最終選定は未完了です。'),p('最初は短文→男女対話→4話者→長文の順に少数を試してください。364音源を一気に生成せず、声と音量を決めてから章ごとに進めます。'),PageBreak()]
    s += [heading('5. 予算・契約で間違えないために','budget'),p('公式Web版とAPI版とfalは、料金も契約も別です。','note'),p('公式Web料金ページのStarterは100,000 credits。全台本は英字だけで約110,000字あるため、1か月分のStarterだけで全量＋再生成が収まる前提にはしません。まずサンプルの実消費を確認し、必要なら追加creditsまたは上位プランを比較します。'),p('価格表示に注意','h2'),p('取得した画面ではYearlyが選ばれ、Starterの$4.5/monthは年$54一括請求の表示でした。月契約はMonthlyへ切り替えて請求総額を確認してください。安い月額換算を月払いと間違えないこと。最終購入はご自身で判断してください。'),p('公式ページ間にも違いがあります','h2'),p('現行料金画面は無料月10,000 credits。一方、2026-02-12更新のSubscription Service Termsには日次無料creditsという旧説明が残っています。Standardの枠にも差があり、無料配布量や料金は現在の購入画面を優先し、権利の不明点はサポートへ確認します。'),p('falを使う場合','h2'),p('falは前払いcreditsの従量課金です。MiniMax Speech 2.8 HDの公開表示$0.10/1000文字を全140,599文字へ単純計算すると約$14.06（一巡のみ）。無料配布creditsの有無・量は保証しません。fal側のCommercial use表示と規約を確認し、MiniMax Audio公式WebのStarter契約と同一扱いにしません。'),p('本番公開前の未確認項目','h2'),p('無料時の音声を後から商用にできるか／解約後の継続配信／標準声固有の条件／未成年も使う収益化アプリで完成音声を配信する範囲。必要な表示を含め、曖昧な点は書面で確認してください。APIを学習者に直接使わせる設計にはしません。'),PageBreak()]
    s += [heading('6. サポートへの質問・返却方法','return'),p('問い合わせ先：contact.audio@minimax.io\n公式Audio利用規約に記載された窓口です。問い合わせはまだ送っていません。'),en('I plan to use MiniMax Audio Speech 2.8 HD with stock voices to create 364 English listening recordings for a monetized educational app. The app may be used by minors, but users will only play pre-generated audio files and will not access MiniMax or its API. Please confirm: (1) Starter or above permits this use; (2) any stock-voice restrictions and attribution/AI-disclosure requirements; (3) whether recordings generated while subscribed may remain distributed after cancellation; (4) whether free-period recordings gain commercial rights after subscribing; and (5) whether top-up credits alone grant the same commercial rights. Please distinguish Speech/TTS from song-generation terms.'),p('返却するもの','h2'),p('音源名ごとのフォルダに001、002…と音声を入れ、声名・モデル・設定・生成日時・プラン・確認した条件をメモしてZIPで返してください。こちらで結合、台本一致、音量、再生時間、アプリへの接続を検証します。APIキー・カード情報・住所は不要です。'),p('全ファイルは1回読み。番号や日本語訳を読み上げず、2回読みはアプリ側に任せます。長い音声を55秒以内へ無理に縮めないでください。','note'),p('読み方の指示と本文は別','h2'),p('次ページの英語プロンプトは外部担当者・音声生成エージェント向けの制作指示です。MiniMaxの普通のTTS入力欄へは貼らないでください。後半は全364音源の本文と話者の順番です。'),PageBreak()]
    s += [heading('7. 全音源に共通する制作プロンプト','common'),en(COMMON),p('補足指示','h2'),en('Use licensed stock voices only. Do not clone real people or children. Resolve unknown speaker roles before production. Generate each turn separately if the interface does not provide verified multi-speaker support. Keep speaker-to-voice mapping fixed within each conversation. Do not combine all speakers into one voice. Leave unresolved accent requirements pending rather than silently replacing them. Return separate numbered lossless segments if assembly is difficult. Record generation date, provider, model, voice names, settings and commercial-rights evidence. Do not claim that this prompt itself grants a commercial licence.'),p('本文に貼るもの','h2'),p('後半の「読み上げ本文」だけです。話者名・ファイル名・制作指示を混ぜないため、本文は英字フォント、操作ラベルは小さい緑色で区別します。'),PageBreak()]
    s += [heading('8. 出典と確認範囲','sources'),p('以下は2026-09-18に確認した一次資料です。申込み直前にも最新表示をご確認ください。'),p('MiniMax Audio公式画面・声選択\nhttps://www.minimax.io/audio\nVoice Selection / Library / Filters / Useを実ブラウザで確認。未ログインで画面確認のみ。'),p('公式料金ページ・展開したFAQ\nhttps://www.minimax.io/audio/subscribe\n無料月10,000 creditsと、TTS商用利用はStarter以上という回答を確認。'),p('無料試用の紹介ページ\nhttps://www.minimax.io/audio/text-to-speech/ai-voice-generator\n5回の無料試用を案内。商用利用の許可とは別。'),p('公式Audio利用規約\nhttps://www.minimax.io/audio/doc/terms-of-service.html\nWeb利用とAPI利用を区別。生成物の権利・コンテンツ基準・個別追加条件に注意。'),p('Audio Subscription Service Terms\nhttps://www.minimax.io/audio/doc/paid-service-terms.html\n最終更新2026-02-12。無料配布量やプラン内容に現行料金画面と差異がある。'),p('fal対象モデル・料金方針\nhttps://fal.ai/models/fal-ai/minimax/speech-2.8-hd\nhttps://fal.ai/docs/documentation/model-apis/pricing\nhttps://fal.ai/terms'),p('この資料は操作・制作の手引きで、法的な許諾書ではありません。未確認の権利を承認済みにしていません。全台本は既存教材から抽出し、話者名・発話順・指定アクセントを保持しています。'),p('PDFでコピーした際の改行は整えてよいですが、単語・数値・否定・句読点・固有名詞は勝手に変更しないでください。全文検索やしおりで目的の音源を探せます。')]
    return s


def build(target, with_scripts):
    story=guide()
    if with_scripts:
        current=None
        for number,j in enumerate(JOBS,1):
            story.append(PageBreak())
            if j['chapterId'] != current:
                current=j['chapterId']
                story.append(heading(CHAPTERS[current], 'chapter_'+current))
            title=f"{number:03d} / 364  {j['label']}  [{j['id']}]"
            story.append(heading(title,'track_'+j['id'],1))
            story.append(p('完成ファイル：'+j['targetRelativePath'],'small'))
            story.append(p('問題ID：'+j['problemId']+' ／ 1回読み ／ '+str(len(j['segments']))+'発話','small'))
            if j['contextNotSpoken']:story.append(p('場面（読まない）：'+j['contextNotSpoken'],'small'))
            if j['sourceRoleReviewRequired']:story.append(p('要確認：原本に話者情報が不足しています。以下の提案を事実として扱わず、声を決める前に確認してください。','note'))
            for v in j['speakerPlan']:
                sex={'female':'女性','male':'男性'}.get(v['sex'],'未指定')
                accent=v['accent'] or '原本未指定（初期案：American）'
                role=v['role'] or '原本に役柄の明示なし'
                story.append(p(f"話者 {v['speaker']}：{sex} ／ {accent} ／ {role}",'small'))
                if v.get('age'):story.append(p('年齢設定：'+v['age'],'small'))
                if v.get('tone') and v['tone'] != 'restrained, natural':story.append(p('口調の参考：'+v['tone'],'small'))
            story.append(p('制作指示：共通プロンプトに従い、下記本文だけを生成。同じ話者には同じ声を選ぶ。声名・実IDは未確定。','small'))
            for seg in j['segments']:
                name=f"{seg['index']:03d}"
                label=f"{name}  話者：{seg['speaker']}  ｜ 読み上げ本文（ここだけコピー）"
                story.append(KeepTogether([p(label,'label'),en(seg['text'])]))
                story.append(p('保存：'+seg['outputFile']+' （別形式なら正しい拡張子で保存）','small'))
    doc=Document(str(target),pagesize=A4,rightMargin=46,leftMargin=46,topMargin=49,bottomMargin=44,title='マナトビ MiniMax全台本・生成手順' if with_scripts else 'マナトビ MiniMax操作・商用利用ガイド',author='Manatobi production handoff',pageCompression=1)
    doc.build(story,onFirstPage=page_decoration,onLaterPages=page_decoration)
    return doc.locations

if __name__ == '__main__':
    outputs={}
    for name,full in [('manatobi_minimax_complete_prompts_2026-09-18.pdf',True),('manatobi_minimax_quick_guide_2026-09-18.pdf',False)]:
        target=OUT/name
        assert not target.exists(), f'Output exists: {target}'
        locations=build(target,full)
        outputs[name]={'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'bookmarks':locations}
    (ART/'pdf_build_manifest.json').write_text(json.dumps(outputs,ensure_ascii=False,indent=2))
    print(json.dumps({k:{'bytes':v['bytes'],'bookmarkCount':len(v['bookmarks'])} for k,v in outputs.items()},indent=2))
