# -*- coding: utf-8 -*-
# 第1回 大問4 会話文と要約（書き下ろし）。[[n]] は要約の空所。語群は I・O を使わない。
LEAD = ('Read the conversation [I] between two university students, Mei and Daichi, and then the summary of it [II]. '
        'The summary has 12 blanks. Fill each blank with the most suitable word from the box; no word may be used more than once. '
        'Mark your answers by giving the letter of each chosen word.')

LINES = [
 ('Daichi', 'Mei, do you have a minute? I need some advice about something I’ve been thinking about for a while.'),
 ('Mei', 'Sure, I’ve got plenty of time before my next class. What’s going on? You look as if something has been bothering you all morning.'),
 ('Daichi', 'I’ve been thinking about getting a dog. There’s an animal shelter near the station, and I’ve been looking at their website every night for a week.'),
 ('Mei', 'That’s exciting! But you live in a small apartment near the campus, don’t you? Are pets even allowed in a building like that?'),
 ('Daichi', 'That was my first question too. I checked with the landlord yesterday, and small dogs are fine as long as I pay a little extra rent.'),
 ('Mei', 'Well, that’s one problem solved, then. Have you found a particular dog that you like, or are you still just looking at the photos?'),
 ('Daichi', 'There’s a four-year-old mixed breed called Biscuit. The staff said she was found wandering near the river last spring. She’s docile and affectionate, but she gets nervous around strangers.'),
 ('Mei', 'Why not get a puppy instead? If you started with a very young dog, you could train it exactly the way you wanted from the beginning.'),
 ('Daichi', 'I thought about that, but puppies demand constant attention, and I’m in lectures most of the day. An adult dog that’s already calm might fit my timetable better. Besides, older dogs often wait much longer to find a home.'),
 ('Mei', 'That’s a kind way of looking at it. But be honest with yourself, Daichi. A dog isn’t like a plant you can water once a week. Who’ll take care of her when you have exams, or when you go home during the holidays?'),
 ('Daichi', 'My sister lives about twenty minutes away, and she’s offered to help. She grew up with dogs, so she knows what she’s doing.'),
 ('Mei', 'OK. What about money, though? Food, vaccinations, and regular trips to the vet add up much more quickly than people expect, and if she gets seriously sick, the bills can be huge.'),
 ('Daichi', 'I know. I’ve drawn up a rough budget, and I think I can manage if I cut back on eating out. The shelter also said they’d pay for her first check-up.'),
 ('Mei', 'You’ve clearly done your homework. I’m a little surprised, to be honest. Last year you couldn’t even keep a goldfish alive!'),
 ('Daichi', 'Don’t remind me. That’s exactly why I want to be careful this time. I’d hate to make a decision I’ll regret, and I’m determined not to take her home and then send her back.'),
 ('Mei', 'That’s the right attitude. Can you spend time with her before deciding? Some shelters let you take a dog for a walk first.'),
 ('Daichi', 'Yes, they encourage it. I’m going on Saturday to walk her around the park. If she seems comfortable with me, I might try having her for a weekend.'),
 ('Mei', 'That sounds sensible. Would you like me to come along with you on Saturday? I’m certainly no expert, but another pair of eyes might help you notice things you would otherwise miss.'),
 ('Daichi', 'Actually, that would be great. You’re much better than I am at noticing small details, especially about how animals are feeling.'),
 ('Mei', 'I’ll take that as a compliment. One last point, though: don’t decide only because she looks sad in the photos. Think about whether your daily life really has room for her.'),
 ('Daichi', 'You’re right. I’ll write down my weekly schedule tonight and see where the walks would fit.'),
 ('Mei', 'Good idea. And if it doesn’t work out with Biscuit, that’s perfectly fine too. It’s always better to wait for the right dog than to rush into something you can’t handle.'),
 ('Daichi', 'Thanks, Mei. I feel a lot clearer about the whole thing now than I did when we started talking.'),
]

SUMMARY = [
 'Daichi asks his friend Mei for advice because he is [[1]] adopting a dog from an animal shelter near the station. Mei first wonders whether animals are [[2]] in his apartment, but Daichi explains that his landlord has consented, provided that he pays slightly higher rent.',
 'The dog Daichi likes is a gentle four-year-old mongrel called Biscuit, although strangers tend to cause her [[3]]. Mei suggests that a puppy might be easier to train, but Daichi feels that an adult dog would better [[4]] his hectic days at university. He also notes that older dogs usually have to wait longer before someone offers them a permanent home.',
 'Mei then asks who will look after the dog during exams and holidays. Daichi replies that his sister, who is [[5]] with dogs, has volunteered to help. Mei also reminds him that the [[6]] of food, vaccinations, and veterinary treatment can mount up rapidly. Daichi says he has drawn up a budget and intends to spend [[7]] money on eating out. Mei is surprised at how thoroughly Daichi has [[8]], since he once failed to keep even a goldfish alive.',
 'Daichi says that this embarrassing episode is the reason he wants to act with [[9]] now, because he is anxious to avoid returning the dog to the shelter after taking her home. He plans to walk Biscuit in the park on Saturday and may then foster her for a weekend. Mei offers to accompany him so that he can hear a second [[10]].',
 'Finally, Mei advises Daichi not to make his choice simply out of [[11]] for a dog that looks mournful in photographs. Instead, he should reflect carefully on whether his everyday routine genuinely has room for her. Daichi decides to write down his weekly schedule, and he feels much less [[12]] than he did when the conversation began.',
]

OPTIONS = [('A', 'admired'), ('B', 'anxiety'), ('C', 'beneath'), ('D', 'caution'), ('E', 'confused'), ('F', 'considering'), ('G', 'costs'),
           ('H', 'delay'), ('J', 'familiar'), ('K', 'frequently'), ('L', 'humor'), ('M', 'ignored'), ('N', 'less'), ('P', 'opinion'),
           ('Q', 'permitted'), ('R', 'prepared'), ('S', 'rarely'), ('T', 'suit'), ('U', 'sympathy'), ('V', 'wealthy'), ('W', 'weather')]

ANSWERS = {1: 'F', 2: 'Q', 3: 'B', 4: 'T', 5: 'J', 6: 'G', 7: 'N', 8: 'R', 9: 'D', 10: 'P', 11: 'U', 12: 'E'}

WHY = {
 1: 'be considering doing「〜しようかと考えている」。会話の “I’ve been thinking about getting a dog.” の言い換え。is の後で -ing 形が入るのは considering だけ。',
 2: '「動物の飼育が許されているか」。会話の “Are pets even allowed in a building like that?” の allowed を permitted で言い換えている。be 動詞の後の過去分詞。',
 3: 'cause 人 anxiety「人を不安にさせる」。会話の “she gets nervous around strangers” の言い換え。cause の2つ目の目的語なので名詞が入る。',
 4: 'suit「〜に合う」。would better の後なので動詞の原形。会話の “might fit my timetable better” の言い換え。',
 5: 'be familiar with ～「〜をよく知っている・慣れている」。会話の “She grew up with dogs, so she knows what she’s doing.” に対応。',
 6: 'the costs of ～「〜の費用」。会話の “add up much more quickly than people expect” は費用がかさむこと。主語で can grow の前なので名詞。',
 7: 'spend less money on ～「〜に使うお金を減らす」。会話の “cut back on eating out” の言い換え。',
 8: 'how well Daichi has prepared「ダイチがどれほどしっかり準備したか」。会話の “You’ve clearly done your homework.”（よく下調べした）に対応。has の後の過去分詞で，目的語なしで意味が通るのは prepared。',
 9: 'act with caution「慎重に行動する」。会話の “I want to be careful this time” の言い換え。前置詞 with の後なので名詞。',
 10: 'a second opinion「別の人の意見」。会話の “another pair of eyes might help” の言い換え。',
 11: 'out of sympathy「同情から」。会話の “don’t decide only because she looks sad in the photos” に対応。out of の後なので名詞。',
 12: 'feel much less confused「混乱がずっと少なくなる」。会話の最後の “I feel a lot clearer about the whole thing now” を逆の形容詞（less confused）で言い換えている。',
}

UNUSED = ('使わない語：admired（称賛された）・beneath（〜の下に）・delay（遅らせる）・frequently（しばしば）・humor（ユーモア）・ignored（無視された）・'
          'rarely（めったに〜ない）・wealthy（裕福な）・weather（天気）。たとえば空所(2)に ignored を入れると文法上は成り立つが，'
          '会話の “Are pets even allowed in a building like that?” と合わない。空所(7)に rarely や frequently を入れると spend の後の語順として誤り。')

TRANSLATION = [
 'メイ，ちょっといい？　しばらく前から考えていることについて相談があるんだ。',
 'いいよ，次の授業までたっぷり時間があるから。どうしたの？　朝からずっと何か気にかかっているみたいだね。',
 '犬を飼おうかと考えているんだ。駅の近くに動物保護施設があって，1週間毎晩そこのウェブサイトを見ているんだよ。',
 'わくわくするね！　でも，キャンパスの近くの小さなアパートに住んでいるよね？　ああいう建物で，そもそもペットは飼っていいの？',
 '僕も最初にそれを考えた。きのう大家さんに確認したら，家賃を少し多く払えば小型犬は大丈夫だって。',
 'じゃあ，問題が一つ片づいたわけだね。特に気に入った犬は見つかったの？　それともまだ写真を見ているだけ？',
 'ビスケットっていう4歳の雑種がいるんだ。職員の人の話では，去年の春に川の近くでさまよっているところを見つかったんだって。従順で人なつっこいけど，知らない人の近くだと緊張するんだ。',
 'その代わりに子犬にしたら？　すごく小さいうちから飼い始めれば，最初から思いどおりにしつけられるよ。',
 'それも考えたけど，子犬は絶えず目を離せないし，僕は1日のほとんど講義があるからね。もう落ち着いている成犬のほうが，僕の時間割に合うかもしれない。それに，年をとった犬は家が見つかるまでずっと長く待つことが多いんだ。',
 'それは優しい考え方だね。でも，自分に正直になって，ダイチ。犬は週に1回水をやればいい植物とは違うんだよ。試験のときや，休みに実家に帰るときは，誰が面倒を見るの？',
 '姉が20分くらいのところに住んでいて，手伝うと言ってくれているんだ。姉は犬と一緒に育ったから，扱い方をわかっているよ。',
 'わかった。でも，お金はどう？　えさや予防接種，定期的な動物病院通いの費用は，みんなが思っているよりずっと早くかさむし，重い病気になったら請求額がすごいことになるかも。',
 'わかってる。大まかな予算を立てたんだけど，外食を減らせばやっていけると思う。施設も最初の健康診断の費用は出してくれるって言っていたし。',
 'ちゃんと下調べしてあるんだね。正直，ちょっと驚いた。去年は金魚さえ生かしておけなかったのに！',
 '思い出させないでよ。だからこそ今回は慎重にやりたいんだ。後悔するような決断はまっぴらだし，連れて帰ってから返すようなことは絶対にしないと決めているんだ。',
 'その心構えが正しいよ。決める前に一緒に過ごすことはできるの？　先に散歩させてくれる施設もあるけど。',
 'うん，むしろ勧めているよ。土曜日に行って，公園を散歩させるつもり。僕と一緒で落ち着いていられそうなら，週末だけ預かってみるかもしれない。',
 'それはいい考えだね。土曜日に一緒に行こうか？　専門家ではまったくないけど，もう一人の目があれば，見落としそうなことに気づく助けになるかも。',
 '実は，そうしてもらえるとすごく助かる。君は僕よりずっと細かいことによく気がつくから。特に動物がどう感じているかについてはね。',
 'ほめ言葉として受け取っておくね。でも，最後に一つ。写真で悲しそうに見えるからというだけで決めないで。自分の毎日の生活に，本当にその子のための余裕があるかを考えて。',
 'そのとおりだね。今夜，1週間の予定を書き出して，散歩がどこに入るか見てみるよ。',
 'いい考えだね。それに，ビスケットとうまくいかなくても，それはそれでまったく問題ないよ。手に負えないことに飛びつくより，ぴったりの犬を待つほうがいつだっていいんだから。',
 'ありがとう，メイ。話し始めたときよりも，このことについてずっと頭の中がすっきりしたよ。',
]

SUMMARY_TRANSLATION = [
 'ダイチは，駅の近くの動物保護施設から犬を引き取ることを(1)考えているので，友人のメイに助言を求める。メイはまず，彼のアパートで動物の飼育が(2)許されているのかと疑問に思うが，ダイチは，家賃を少し高く払うなら大家が同意してくれたと説明する。',
 'ダイチが気に入った犬はビスケットという優しい4歳の雑種だが，知らない人がいると(3)不安になりがちである。メイは子犬のほうがしつけやすいのではと言うが，ダイチは成犬のほうが大学での多忙な毎日によりよく(4)合うと感じている。彼はまた，年をとった犬は誰かに終の住みかを与えてもらえるまでふつう長く待たなければならないと指摘する。',
 '次にメイは，試験や休みの間，誰が犬の世話をするのかと尋ねる。ダイチは，犬の扱いに(5)慣れている姉が手伝いを買って出てくれたと答える。メイはまた，えさや予防接種，動物病院での治療の(6)費用は急速にかさむことがあると念を押す。ダイチは，予算を立てており，外食に使うお金を(7)減らすつもりだと言う。メイは，ダイチがかつて金魚さえ生かしておけなかったので，彼がどれほど念入りに(8)準備したかに驚く。',
 'ダイチは，その恥ずかしい出来事こそが，今回は(9)慎重に行動したい理由だと言う。犬を連れて帰った後で施設に返したくないからである。彼は土曜日に公園でビスケットを散歩させ，その後，週末だけ一時的に預かるかもしれない。メイは，彼が別の人の(10)意見を聞けるように，同行すると申し出る。',
 '最後にメイは，写真で悲しげに見える犬への(11)同情だけで選ばないようダイチに助言する。むしろ，自分の日々の暮らしに本当にその犬のための余地があるかをよく考えるべきだという。ダイチは1週間の予定を書き出すことに決め，会話を始めたときよりずっと(12)混乱が少なくなったと感じている。',
]

VOCAB = [('animal shelter', '動物保護施設'), ('landlord', '大家'), ('mixed breed', '雑種'), ('wander', 'さまよう'), ('docile', 'おとなしい・従順な'), ('affectionate', '人なつっこい・愛情深い'),
         ('vaccination', '予防接種'), ('add up', '（費用などが）かさむ'), ('cut back on ～', '〜を減らす'), ('check-up', '健康診断'),
         ('do one’s homework', '下調べをする'), ('regret', '後悔する'), ('sensible', '賢明な'), ('compliment', 'ほめ言葉'),
         ('be familiar with ～', '〜に慣れている'), ('second opinion', '別の人の意見'), ('out of sympathy', '同情から'), ('adopt', '（動物を）引き取る'), ('consent', '同意する'), ('mount up', '（費用が）かさむ'), ('foster', '一時的に預かって世話をする'), ('mournful', '悲しげな')]

PART = {'lead': LEAD, 'lines': LINES, 'summary': SUMMARY, 'options': OPTIONS, 'answers': ANSWERS, 'why': WHY, 'unused': UNUSED,
        'translation': TRANSLATION, 'summary_translation': SUMMARY_TRANSLATION, 'vocab': VOCAB, 'notes': []}
