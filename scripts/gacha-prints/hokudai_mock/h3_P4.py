# -*- coding: utf-8 -*-
# 第3回 大問4 会話文と要約（書き下ろし）。[[n]] は要約の空所。語群は I・O を使わない。人物は架空。
LEAD = ('Read the conversation [I] between two university students, Haruka and Sota, and then the summary of it [II]. '
        'The summary has 12 blanks. Fill each blank with the most suitable word from the box; no word may be used more than once. '
        'Mark your answers by giving the letter of each chosen word.')

LINES = [
 ('Sota', 'Haruka, you look exhausted. Did you stay up late again?'),
 ('Haruka', 'Sort of. I was up until two finishing a report, and then I couldn’t fall asleep, so I ended up scrolling through videos on my phone until nearly four.'),
 ('Sota', 'Four? That’s brutal. How many hours of sleep do you usually get during the week?'),
 ('Haruka', 'Honestly, maybe five on a good night. I tell myself I’ll catch up at the weekend, but then I sleep until noon on Saturday and feel even more sluggish afterwards.'),
 ('Sota', 'I used to be exactly the same. In my first year, I thought sleeping less was a sign that I was working hard. I was almost proud of how tired I was.'),
 ('Haruka', 'And now you’re not? You always seem so energetic in our morning seminar.'),
 ('Sota', 'That’s because I changed my routine last spring. I kept nodding off in lectures, and I failed a statistics test that I’d actually studied for. That was a wake-up call, if you’ll forgive the expression.'),
 ('Haruka', 'Very funny. So what did you change?'),
 ('Sota', 'The biggest thing was setting a fixed time to go to bed and get up, even at the weekend. At first it felt rigid and a bit boring, but after a few weeks my body seemed to adjust, and I started waking up before my alarm.'),
 ('Haruka', 'Even at the weekend? That sounds impossible for me. Saturday mornings are the only time I can really relax.'),
 ('Sota', 'I don’t mean you can never have a lie-in. But if the difference between weekdays and weekends is huge, it’s a bit like flying to another time zone every Friday night and flying back on Sunday.'),
 ('Haruka', 'Hmm, I’ve never thought of it like that. What about the phone, though? Lying in bed watching videos is the one stretch of the day that feels like my own time.'),
 ('Sota', 'I understand that completely. What helped me was leaving my phone charging on the desk across the room. If I want to check it, I have to get up, and usually I can’t be bothered.'),
 ('Haruka', 'That’s clever, in a slightly sneaky way. But don’t you miss messages from friends?'),
 ('Sota', 'Occasionally, but nobody has ever been offended because I replied in the morning instead of at midnight. Most people are relieved, actually, because it means they don’t feel obliged to answer straight away either.'),
 ('Haruka', 'I suppose that’s true. Still, my problem is partly the amount of work. If I go to bed at midnight, I won’t finish my assignments.'),
 ('Sota', 'Maybe, but are you sure you’re working efficiently at one in the morning? When I was exhausted, I’d read the same paragraph four or five times without taking anything in.'),
 ('Haruka', 'Okay, you’ve got me there. Last night I spent half an hour rewriting one sentence, and this morning I couldn’t understand what I’d been trying to say.'),
 ('Sota', 'Exactly. These days I do the most demanding tasks in the morning, when my head is clear, and save simple things like checking references for the evening.'),
 ('Haruka', 'I’m not convinced I could become a morning person overnight, but maybe I could try going to bed an hour earlier for a couple of weeks and see whether it makes any difference.'),
 ('Sota', 'That’s a sensible way to start. Small changes are much easier to maintain than a complete transformation.'),
 ('Haruka', 'And I’ll leave the phone on my desk. If I start complaining that I’m bored in bed, you’re not allowed to say I told you so.'),
 ('Sota', 'Deal. But I might ask you in a fortnight whether you’ve stopped falling asleep in the seminar.'),
]

TRANSLATION = [
 'ハルカ，疲れ切った顔をしているね。また夜更かししたの？',
 'まあね。レポートを仕上げるのに2時までかかって，それから眠れなくなって，結局4時近くまで携帯で動画をスクロールしていたの。',
 '4時？　それはひどいね。平日はふだん何時間くらい寝ているの？',
 '正直，よく眠れた夜でも5時間くらいかな。週末に取り戻せばいいって自分に言い聞かせるんだけど，土曜日に昼まで寝ると，その後かえってだるくなるの。',
 '僕も前はまったく同じだったよ。1年生のときは，睡眠を削るのは一生懸命勉強している証拠だと思っていた。自分がどれほど疲れているかをほとんど自慢に思っていたくらいだ。',
 'で，今は違うの？　朝のゼミではいつもすごく元気そうだけど。',
 'それは去年の春に生活習慣を変えたからだよ。講義中に何度もうとうとして，実はちゃんと勉強した統計学の試験に落ちたんだ。あれは目が覚める出来事だった。しゃれみたいな言い方で悪いけど。',
 'おもしろいね。それで，何を変えたの？',
 'いちばん大きかったのは，週末も含めて，寝る時刻と起きる時刻を決めたことだね。最初は窮屈でちょっと退屈に感じたけど，何週間かすると体が慣れたみたいで，目覚ましが鳴る前に起きるようになったんだ。',
 '週末も？　私には無理そう。土曜日の朝だけが本当にくつろげる時間なのに。',
 '朝寝坊がまったくできないという意味じゃないよ。でも平日と週末の差がすごく大きいと，毎週金曜日の夜に別の時間帯の国へ飛んで，日曜日に飛んで戻ってくるようなものなんだ。',
 'うーん，そんなふうに考えたことはなかったな。でも，携帯はどうなの？　ベッドで動画を見ているのが，1日の中で唯一自分の時間だと感じられるのに。',
 'それはすごくよくわかるよ。僕の場合は，携帯を部屋の反対側の机で充電しておくのが役に立った。見たければ起き上がらなきゃいけないし，たいていは面倒になるんだ。',
 'うまいやり方だね，ちょっとずるいけど。でも，友だちからのメッセージを見逃すのは平気なの？',
 'たまにはね。でも，夜中じゃなくて朝に返事をしたからって気を悪くした人は一人もいないよ。むしろほとんどの人はほっとしているんだ。自分もすぐに返事をしなきゃという気持ちにならずにすむからね。',
 'それはそうかもね。それでも，私の問題は一つには課題の量なの。12時に寝たら，課題が終わらないよ。',
 'そうかもしれないけど，夜中の1時に本当に効率よく作業できているって言い切れる？　僕は疲れ切っていたとき，同じ段落を4回も5回も読んで，何も頭に入っていなかったよ。',
 'わかった，一本取られたよ。ゆうべは一つの文を書き直すのに30分かかって，今朝になったら何を言おうとしていたのかわからなかった。',
 'そういうこと。最近は，いちばん頭を使う作業は頭がすっきりしている朝にやって，参考文献の確認みたいな簡単なことは夜に回しているんだ。',
 'いきなり朝型人間になれるかは自信がないけど，2週間くらい1時間早く寝てみて，何か違いがあるか試してみようかな。',
 'それは賢い始め方だね。小さな変化のほうが，すっかり生まれ変わろうとするよりずっと続けやすいから。',
 'それと，携帯は机に置いておくね。ベッドで退屈だって文句を言い始めても，「だから言ったでしょ」とは言わないでよ。',
 '約束する。でも2週間後に，ゼミで居眠りしなくなったかどうか聞くかもしれないよ。',
]

# ---- 要約・語群・解説は下に追記 ----
SUMMARY = [
 'Sota notices that Haruka looks [[1]], and she admits that she stayed awake until almost four in the morning, first finishing a report and then watching videos on her phone. She usually gets only about five hours of sleep on weekdays and tries to make up for this by sleeping late at the weekend, which actually leaves her feeling even more lethargic.',
 'Sota confesses that he used to have similar habits and even regarded a lack of sleep as [[2]] of diligence. However, after repeatedly dozing off in lectures and failing a test he had prepared for, he decided to [[3]] his routine. The most important change was to go to bed and wake up at a [[4]] time every day. Although this seemed monotonous at first, his body gradually got used to it.',
 'Haruka doubts that she could follow the same schedule, because Saturday mornings are her only chance to unwind. Sota explains that a large gap between weekdays and weekends is [[5]] to travelling across time zones twice a week. Haruka also mentions that watching videos in bed is the only time she feels is truly her own. Sota recommends keeping the phone on the other side of the room, so that checking it requires [[6]].',
 'When Haruka asks whether he worries about missing messages, Sota replies that his friends have never been [[7]] by a delayed reply, and that many of them seem [[8]] not to feel pressure to respond immediately. Haruka then argues that she needs to stay up late because of her [[9]], but Sota questions whether she can concentrate properly in the middle of the night. Haruka [[10]] that she wasted half an hour on a single sentence the previous night.',
 'Sota explains that he now tackles difficult work in the morning and leaves easier tasks for the evening. Although Haruka is [[11]] that she can change completely, she decides to go to bed an hour earlier for two weeks as an experiment, since modest changes are easier to [[12]] than a total transformation. She also agrees to leave her phone on her desk.',
]

OPTIONS = [('A', 'abandon'), ('B', 'admits'), ('C', 'comparable'), ('D', 'confident'), ('E', 'doubtful'), ('F', 'effort'), ('G', 'evidence'),
           ('H', 'exhausted'), ('J', 'fixed'), ('K', 'flexible'), ('L', 'forbidden'), ('M', 'grateful'), ('N', 'modify'), ('P', 'offended'),
           ('Q', 'refuses'), ('R', 'relieved'), ('S', 'sustain'), ('T', 'talent'), ('U', 'unrelated'), ('V', 'wealthy'), ('W', 'workload')]

ANSWERS = {1: 'H', 2: 'G', 3: 'N', 4: 'J', 5: 'C', 6: 'F', 7: 'P', 8: 'R', 9: 'W', 10: 'B', 11: 'E', 12: 'S'}

WHY = {
 1: 'looks exhausted「疲れ切って見える」。会話の冒頭 “you look exhausted” と同じ語。look の後なので形容詞。',
 2: 'regard A as evidence of B「AをBの証拠とみなす」。会話の “I thought sleeping less was a sign that I was working hard” の sign を evidence で言い換えている。',
 3: 'decided to modify his routine「習慣を改めることにした」。会話の “I changed my routine last spring” の言い換え。to の後なので動詞の原形。',
 4: 'at a fixed time「決まった時刻に」。会話の “setting a fixed time to go to bed and get up” に対応。',
 5: 'be comparable to ～「〜に匹敵する・似ている」。会話の “it’s a bit like flying to another time zone every Friday night” の言い換え。',
 6: 'require effort「手間がかかる」。会話の “If I want to check it, I have to get up, and usually I can’t be bothered.” に対応。requires の目的語なので名詞。',
 7: 'have never been offended by ～「〜で気分を害したことがない」。会話の “nobody has ever been offended because I replied in the morning” に対応。',
 8: 'seem relieved「ほっとしているようだ」。会話の “Most people are relieved, actually” に対応。seem の後なので形容詞。',
 9: 'because of her workload「課題の量のために」。会話の “my problem is partly the amount of work” の言い換え。her の後なので名詞。',
 10: 'Haruka admits that …「ハルカは〜と認める」。会話の “Okay, you’ve got me there.”（一本取られた）の後で自分の失敗を認めている。主語が3人称単数なので admits。',
 11: 'be doubtful that …「〜を疑わしく思う」。会話の “I’m not convinced I could become a morning person overnight” の言い換え。',
 12: 'easier to sustain「維持しやすい」。会話の “Small changes are much easier to maintain than a complete transformation” の maintain を sustain で言い換えている。',
}

UNUSED = ('使わない語：abandon（捨てる）・confident（自信のある）・flexible（柔軟な）・forbidden（禁じられた）・grateful（感謝している）・'
          'refuses（拒む）・talent（才能）・unrelated（無関係な）・wealthy（裕福な）。たとえば空所(4)に flexible を入れると文法上は成り立つが，'
          '会話の “setting a fixed time” と逆になる。空所(11)に confident を入れると，続く「実験として試す」という慎重な態度と合わない。'
          '空所(3)に abandon を入れると「習慣を捨てる」となり，会話の “changed my routine” と意味がずれる。')

SUMMARY_TRANSLATION = [
 'ソウタはハルカが(1)疲れ切っているように見えることに気づき，彼女は，最初はレポートを仕上げ，次に携帯で動画を見て，朝の4時近くまで起きていたと認める。彼女は平日はふだん5時間ほどしか眠らず，週末に遅くまで寝てそれを埋め合わせようとしているが，そうするとかえって一層だるく感じてしまう。',
 'ソウタは，自分も以前は同じような習慣があり，睡眠不足を勤勉さの(2)証拠とみなしてさえいたと打ち明ける。しかし，講義中に何度も居眠りし，準備していた試験に落ちた後，彼は生活習慣を(3)改めることにした。最も重要な変化は，毎日(4)決まった時刻に寝て起きることだった。最初は単調に思えたが，体は次第にそれに慣れていった。',
 'ハルカは，土曜日の朝だけがくつろげる機会なので，同じ予定に従えるとは思えない。ソウタは，平日と週末の差が大きいと，週に2回時間帯を越えて移動するのに(5)等しいと説明する。ハルカはまた，ベッドで動画を見ているのが唯一本当に自分の時間だと感じられると言う。ソウタは，携帯を見るのに(6)手間がかかるように，部屋の反対側に置いておくことを勧める。',
 'ハルカがメッセージを見逃すのが心配ではないかと尋ねると，ソウタは，返事が遅れたことで友人が(7)気を悪くしたことは一度もなく，多くの友人はすぐに返事をしなければという重圧を感じずにすんで(8)ほっとしているようだと答える。次にハルカは，(9)課題の量のせいで夜更かしが必要だと主張するが，ソウタは，夜中にきちんと集中できているのかと疑問を投げかける。ハルカは，前の晩に一つの文に30分を無駄にしたことを(10)認める。',
 'ソウタは，今は難しい作業を朝に片づけ，簡単な作業を夜に回していると説明する。ハルカは自分がすっかり変われるかは(11)疑わしいと思っているが，ささやかな変化のほうが全面的な変身よりも(12)続けやすいので，実験として2週間1時間早く寝ることに決める。彼女はまた，携帯を机に置いておくことにも同意する。',
]

VOCAB = [('exhausted', '疲れ切った'), ('brutal', 'ひどい・過酷な'), ('catch up', '（遅れを）取り戻す'), ('sluggish', 'だるい'),
         ('nod off', 'うとうとする'), ('wake-up call', '目を覚まさせる出来事・警鐘'), ('rigid', '窮屈な・厳格な'), ('lie-in', '朝寝坊'),
         ('time zone', '時間帯'), ('can’t be bothered', '面倒でやる気にならない'), ('sneaky', 'ずるい'), ('offended', '気を悪くした'),
         ('feel obliged to do', '〜しなければならないと感じる'), ('take ～ in', '〜を理解する'), ('you’ve got me there', '一本取られた'), ('demanding', '負担の大きい'),
         ('transformation', '変身・一変'), ('fortnight', '2週間'), ('lethargic', 'だるい・無気力な'), ('diligence', '勤勉'),
         ('monotonous', '単調な'), ('unwind', 'くつろぐ'), ('comparable to ～', '〜に匹敵する'), ('workload', '仕事量'), ('sustain', '維持する')]

PART = {'lead': LEAD, 'lines': LINES, 'summary': SUMMARY, 'options': OPTIONS, 'answers': ANSWERS, 'why': WHY, 'unused': UNUSED,
        'translation': TRANSLATION, 'summary_translation': SUMMARY_TRANSLATION, 'vocab': VOCAB, 'notes': []}
