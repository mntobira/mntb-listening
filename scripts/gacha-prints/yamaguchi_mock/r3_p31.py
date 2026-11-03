# -*- coding: utf-8 -*-
# 第3回 Ⅲ-1：学生寮の「傘の貸し出し」をめぐる会話（書き下ろし。人物・団体・地名は架空）
P31 = {
    'points': 30,
    'lead': '以下は，学生寮に住む留学生の Noah と大学生の Haruka の会話である。会話の前に，寮の掲示板に貼られたお知らせを示す。'
            'お知らせの内容をふまえて，会話の（①）〜（⑥）を英語で埋めよ。入る語は1語とは限らない。',
    'article': {
        'title': 'New at Elmwood Hall: Borrow an Umbrella',
        'paras': [
            "Starting next Monday, Elmwood Hall will lend umbrellas to residents free of charge. Thirty umbrellas will be kept in a stand "
            "beside the front desk. Residents may borrow one for up to three days by writing their room number in the notebook next to the stand.",
            "The umbrellas were donated by graduates who once lived in the hall. “We hope residents will look after them so that everyone can "
            "use them,” said hall manager Petra Lindqvist. Broken umbrellas should be returned to the front desk rather than thrown away, as "
            "volunteers from the Engineering Club have offered to repair them.",
        ],
        'notes': [('resident', '寮生'), ('donate', '寄付する'), ('graduate', '卒業生')],
    },
    'conversation': [
        ('Noah', "Haruka, did you see the notice by the front desk? The hall is going to lend umbrellas."),
        ('Haruka', "Oh, good. I left mine on the bus last week. When does it {c1}?"),
        ('Noah', "Next Monday. There’ll be thirty umbrellas in a stand next to the desk."),
        ('Haruka', "Do we have to pay for them?"),
        ('Noah', "No, they’re free. You can keep one for {c2} three days."),
        ('Haruka', "That’s generous. Where did they get so many umbrellas?"),
        ('Noah', "They were {c3} by people who used to live here. Isn’t that nice?"),
        ('Haruka', "It really is. So what do I do if I want to borrow one? Do I ask the staff?"),
        ('Noah', "You just write your {c4} in the notebook beside the stand."),
        ('Haruka', "Easy. But what if one breaks? I always seem to break umbrellas on windy days."),
        ('Noah', "Don’t throw it away. Take it back to the front desk. The Engineering Club will {c5} it."),
        ('Haruka', "I didn’t know they did that. {c6} kind of them!"),
    ],
    'answers': [['start', 'begin'],
                ['up to', 'as long as', 'a maximum of'],
                ['donated', 'given'],
                ['room number'],
                ['repair', 'fix', 'try to repair'],
                ['How', 'That’s very', 'That is very']],
    'expl': [
        '「いつから始まるの？」。does の後なので原形 start ／ begin。',
        'お知らせ for up to three days。「最長で3日間」up to ／ as long as ／ a maximum of。',
        'お知らせ The umbrellas were donated by graduates。受け身なので過去分詞 donated ／ given。',
        'お知らせ by writing their room number in the notebook。your room number。',
        'お知らせ volunteers from the Engineering Club have offered to repair them。will の後なので原形 repair ／ fix。',
        '感嘆文 How kind of them!（なんて親切なんだろう）。That’s very kind of them! も可。',
    ],
    'conversation_ja': [
        'Noah：Haruka，受付の横のお知らせ見た？　寮が傘を貸し出すんだって。',
        'Haruka：よかった。先週バスに置き忘れちゃったの。いつから始まるの？',
        'Noah：来週の月曜日。受付の横の傘立てに30本置かれるんだ。',
        'Haruka：お金を払わなきゃいけないの？',
        'Noah：いや，無料だよ。最長3日間借りられる。',
        'Haruka：気前がいいね。どこでそんなにたくさんの傘を手に入れたの？',
        'Noah：以前ここに住んでいた人たちが寄付してくれたんだ。いい話だよね。',
        'Haruka：本当に。じゃあ借りたいときはどうすればいいの？　職員さんに頼むの？',
        'Noah：傘立ての横のノートに部屋番号を書くだけだよ。',
        'Haruka：簡単ね。でも壊れたらどうしよう。風の強い日にいつも傘を壊しちゃうみたいで。',
        'Noah：捨てないで。受付に返すんだ。工学部のサークルが直してくれるよ。',
        'Haruka：そんなことしてくれるなんて知らなかった。なんて親切なの！',
    ],
    'article_ja': [
        '来週の月曜日から，エルムウッド寮は寮生に傘を無料で貸し出します。受付の横の傘立てに30本の傘を置きます。寮生は，傘立ての横のノートに部屋番号を書くことで，最長3日間1本借りることができます。',
        '傘はかつてこの寮に住んでいた卒業生から寄付されたものです。「皆が使えるよう，寮生の皆さんに大切に扱ってもらえればと思います」と寮の管理人ペトラ・リンドクヴィストさんは話しています。壊れた傘は捨てずに受付に返してください。工学部のサークルのボランティアが修理を申し出てくれています。',
    ],
}
