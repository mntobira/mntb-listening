# -*- coding: utf-8 -*-
# 第3回 Ⅲ-2：傘の修理を申し出るメールへの返信（書き下ろし。人物・団体・地名は架空）
P32 = {
    'points': 40,
    'lead': 'Haruka は寮の受付にメール（A）を送り，壊れた傘を直す手伝いをしたいと申し出た。これに対し，管理人の Petra Lindqvist さんから返信（B）が届いた。'
            '①〜④の内容をそれぞれ英文にして，返信（B）の空欄に入れよ。',
    'instructions': [
        '手伝いを申し出てくれたことに，心からお礼を言いたいということ。',
        'すでに壊れた傘が7本，受付に返されているということ。',
        '作業には寮の1階の談話室を使ってよいということ。',
        '必要な道具があれば，前もって知らせてほしいということ。',
    ],
    'mail_a': {
        'from': 'Haruka Mori', 'to': 'Elmwood Hall Front Desk', 'subject': 'Helping with umbrella repairs',
        'body': [
            'Dear Ms. Lindqvist,',
            'I live in Room 214. I saw the notice about the new umbrella service, and I think it is a wonderful idea. I am a member of the '
            'Engineering Club, and I would be glad to help repair any umbrellas that break. I am free on most weekday evenings.',
            'Please let me know if there is anything I can do.',
            'Best wishes,{br}Haruka Mori',
        ],
    },
    'mail_b': {
        'from': 'Petra Lindqvist', 'to': 'Haruka Mori', 'subject': 'Re: Helping with umbrella repairs',
        'body': [
            'Dear Haruka,',
            '{c1} The umbrella service has been more popular than we expected.',
            'Unfortunately, the wind last weekend was very strong. {c2} Most of them have broken ribs, but one has a torn cover.',
            'I have spoken to the other staff about where you could work. {c3} It is usually empty in the evenings, and there is a large table there.',
            '{c4} We have a few basic tools at the desk, but we may not have everything you need. Thank you again for your kindness.',
            'Kind regards,{br}Petra Lindqvist{br}Hall Manager, Elmwood Hall',
        ],
    },
    'slots': [
        {'models': ['I would like to thank you very much for offering to help.',
                    'Thank you so much for kindly offering your help.'],
         'tips': ['「～してくれたことに礼を言う」は thank you for ～ing。for の後は動名詞 offering。',
                  '「心から」は very much ／ so much ／ sincerely。I would like to thank you ... とすると改まった言い方になる。'],
         'criteria': [('「お礼を言う」（thank you for）', 4), ('「手伝いを申し出てくれた」（offering to help ／ offering your help）', 4), ('動名詞など文法', 2)]},
        {'models': ['Seven broken umbrellas have already been returned to the front desk.',
                    'We have already received seven broken umbrellas at the front desk.'],
         'tips': ['「すでに～された」は現在完了の受け身 have already been returned。already は have と過去分詞の間に置く。',
                  '主語を we にして We have already received ... としてもよい。「受付に」は to ／ at the front desk。'],
         'criteria': [('「7本の壊れた傘」', 3), ('「すでに返されている」（have already been returned ／ have received）', 5), ('「受付に」・文法', 2)]},
        {'models': ['You are welcome to use the common room on the first floor for the work.',
                    'You may use the lounge on the ground floor when you repair them.'],
         'tips': ['「～してよい」は You may ／ can ... ／ You are welcome to ...（遠慮なく～してください）。',
                  '「1階」はアメリカ英語で the first floor，イギリス英語で the ground floor。「談話室」は common room ／ lounge。'],
         'criteria': [('「使ってよい」（may ／ can ／ are welcome to）', 4), ('「1階の談話室」', 4), ('「作業に」・文法', 2)]},
        {'models': ['If you need any tools, please let me know in advance.',
                    'Please tell us beforehand if there are any tools you need.'],
         'tips': ['「前もって」は in advance ／ beforehand。文の最後に置くのが自然。',
                  '「必要な道具があれば」は If you need any tools ／ if there are any tools you need。tool は数えられる名詞なので複数形。'],
         'criteria': [('「必要な道具があれば」', 4), ('「知らせてほしい」（please let me know ／ tell us）', 3), ('「前もって」・文法', 3)]},
    ],
    'mail_b_ja': [
        'Haruka さんへ',
        '【①】傘の貸し出しは思っていた以上に好評です。',
        'あいにく，先週末の風はとても強いものでした。【②】ほとんどは骨が折れていますが，1本は布が破れています。',
        'どこで作業してもらえるか，ほかの職員と話しました。【③】夕方はたいてい誰もおらず，大きなテーブルもあります。',
        '【④】受付にも基本的な道具はいくつかありますが，必要なものがすべてそろっているとは限りません。改めて，ご親切に感謝します。',
        'よろしくお願いします。　ペトラ・リンドクヴィスト（エルムウッド寮 管理人）',
    ],
}
