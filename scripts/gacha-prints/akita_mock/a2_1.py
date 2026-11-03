# -*- coding: utf-8 -*-
# 第2回 Ⅰ 長文読解（星空を取り戻した村・光害）。{u|…} 設問で問う語句。設問は a2_1q.py
from a2_1q import QUESTIONS, VOCAB
P = {
 'kind': 'reading',
 'title': '長文読解',
 'intro': 'Study the article and respond to each question by choosing one of the four options. Write the letter of the option you choose.',
 'headline': 'The Village That Switched Off the Night',
 'paras': [
  "When Corin Pask was a boy, he could lie on the grass behind his parents’ farm in the village of Carrow Fell and watch the pale band of stars we call the Milky Way stretching across the sky. By the time his own daughter was born, it had disappeared. Nothing had happened to the stars themselves. What had changed was the light on the ground: brighter streetlights along the new road, floodlights at a garden centre, and security lamps on almost every house.",
  "Scientists call this problem light pollution. Across much of the globe, the night sky is now so bright that most residents have never seen more than a handful of stars. Unlike other kinds of pollution, it leaves no smell and no rubbish behind, so it is easy to {u|overlook}. Yet researchers have linked too much artificial lighting after dark to poorer sleep in humans, and to confusion among birds, insects and other animals that rely on darkness.",
  "Six years ago, Pask, who now chairs the village council, persuaded his neighbours to try something unusual. Instead of adding more lights, Carrow Fell would reduce them. The aim was to be recognised as a dark-sky village, a title given to places that keep their night skies unusually dark. To earn it, the village had to measure the brightness of its sky regularly and show that it was controlling outdoor lighting.",
  "The changes were mostly practical. Old streetlights, which scattered light in every direction, were replaced with lamps that point downwards and give off a warmer, yellower glow. Lights in the car park were fitted with timers so that they switched off at midnight. Residents were offered free shades for their security lamps, which stop the light from spilling into the sky and into their neighbours’ bedrooms.",
  "Not everyone welcomed the plan. Some older residents worried that darker streets would make it easier for burglars* to break into homes, and that walking home at night would become dangerous. At the first public meeting, one man asked whether the council intended to “send the village back to the Middle Ages”. Pask admits that the fear was understandable. “People connect light with safety,” he says. “We had to show them that better lighting does not mean more lighting.”",
  "To answer these concerns, the council asked the local police to share crime figures for the village before and after the change. Over the following three years, the number of reported break-ins did not rise. A police officer told a later meeting that badly aimed lights can actually help criminals by creating deep shadows and dazzling* anyone who looks towards them. Gradually, opposition faded, and several of the plan’s strongest critics now offer to help with sky measurements.",
  "There were also benefits that few people had expected. The new lamps use far less electricity than the old ones, and the village’s energy bill for street lighting fell by nearly half. That money has been spent on repairing the village hall. Meanwhile, a local naturalist who counts moths each summer has recorded a steady increase in their numbers, although she is careful to point out that the weather may also play a part.",
  "The most visible change, however, has been in tourism. Once Carrow Fell received its dark-sky title, visitors began to arrive in winter, a season when the village used to be almost empty. A former barn now houses a small observatory, and the pub now holds “star suppers”, at which guests eat by candlelight before going outside with a guide. For a village that had been losing young people for decades, the new jobs have been welcome.",
  "Some astronomers, though, warn that success can bring its own problems. A rise in visitors brings a rise in cars, and headlights in narrow lanes can spoil the very darkness that people have come to see. Carrow Fell now asks visitors to park on the outskirts of the village and walk the last few hundred metres with red torches, which affect night vision less than white ones. Whether this arrangement will work if visitor numbers keep growing is still {u|an open question}.",
  "Pask insists that the project was never only about astronomy. For him, it concerns the kind of place people want to live in. “We put much effort into protecting old buildings and beautiful views,” he says. “The night sky is part of our landscape, too. It belonged to our grandparents, and it should belong to our grandchildren.”",
  "Last winter, Pask took his daughter, now twelve, to the field behind the old farm. They lay on a blanket and waited for their eyes to adjust. After about twenty minutes, the Milky Way slowly appeared, just as he remembered it. His daughter said nothing for several minutes. Then she asked why nobody had told her it was there.",
 ],
 'notes': [('burglars', '泥棒，押し込み強盗'), ('dazzling', '（強い光で）目をくらませる')],
 'translation': [
  'コリン・パスクが少年だったころ，彼はキャロウフェル村にある両親の農場の裏手の草の上に寝転がり，空に広がる，天の川と呼ばれる星々の淡い帯を眺めることができた。自分の娘が生まれたころには，それは消えてしまっていた。星そのものに何かが起きたわけではない。変わったのは地上の明かりだった。新しい道路沿いのより明るい街灯，園芸店の投光照明，そしてほとんどすべての家についた防犯灯である。',
  '科学者はこの問題を光害と呼ぶ。地球上の多くの場所で，今では夜空があまりに明るく，ほとんどの住民はほんの数個より多くの星を見たことがない。ほかの種類の汚染と違って，光害はにおいもごみも残さないので，見過ごされやすい。しかし研究者たちは，暗くなってからの過剰な人工の照明を，人間の睡眠の質の低下や，暗さに頼る鳥や昆虫などの動物の混乱と結びつけてきた。',
  '6年前，現在は村議会の議長を務めるパスクは，風変わりなことを試してみようと隣人たちを説得した。明かりを増やすのではなく，キャロウフェルは明かりを減らすことにしたのである。目標は，夜空を際立って暗く保っている場所に与えられる称号である「星空の村」に認定されることだった。それを得るために，村は空の明るさを定期的に測定し，屋外の照明を管理していることを示さなければならなかった。',
  '変更の大部分は実際的なものだった。あらゆる方向に光をまき散らしていた古い街灯は，下向きで，より暖かく黄色っぽい光を出す灯具に取り替えられた。駐車場の照明にはタイマーがつけられ，真夜中に消えるようになった。住民には防犯灯用の笠が無料で配られた。笠は光が空や隣家の寝室に漏れるのを防ぐ。',
  '誰もがこの計画を歓迎したわけではなかった。年配の住民の中には，通りが暗くなると泥棒が家に押し入りやすくなり，夜に歩いて帰るのが危険になると心配する人もいた。最初の住民集会では，ある男性が，議会は「村を中世に戻す」つもりなのかと尋ねた。パスクはその不安はもっともだったと認める。「人は明かりと安全を結びつけます」と彼は言う。「より良い照明とはより多い照明のことではないと，示さなければなりませんでした」',
  'こうした懸念に応えるため，議会は地元の警察に，変更の前後の村の犯罪件数を公表してくれるよう頼んだ。その後の3年間，届け出のあった侵入盗の件数は増えなかった。ある警察官は後の集会で，向きの悪い照明は深い影を作り，そちらを見る人の目をくらませるので，実は犯罪者の助けになりうると話した。次第に反対は弱まり，計画を最も強く批判していた人の何人かは，今では空の測定を手伝おうと申し出ている。',
  'ほとんどの人が予想していなかった利点もあった。新しい灯具は古いものよりはるかに電気を使わず，村の街灯の電気代はほぼ半分に減った。そのお金は村の集会所の修理に使われた。一方，毎年夏にガの数を数えている地元の自然愛好家は，ガの数が着実に増えていることを記録している。ただし彼女は，天候も関係しているかもしれないと注意深く指摘している。',
  'しかし，最も目に見える変化は観光に表れている。キャロウフェルが星空の称号を得ると，かつては村がほとんど空っぽになっていた季節である冬に，訪問者がやって来るようになった。かつての納屋には今では小さな天文台が入り，パブでは今では「星空の夕食会」が開かれている。客はろうそくの明かりで食事をしてから，ガイドと一緒に外へ出るのである。何十年も若者が流出していた村にとって，新しい仕事はありがたいものだった。',
  'しかし天文学者の中には，成功がそれ自体の問題をもたらしうると警告する人もいる。訪問者が増えると車も増え，狭い小道のヘッドライトは，人々がわざわざ見に来た暗さそのものを台無しにしかねない。キャロウフェルは現在，訪問者に村の外れに車を止め，最後の数百メートルを赤いライトを持って歩くよう求めている。赤いライトは白いものほど夜間の視力に影響しないのである。訪問者数が増え続けてもこの方法がうまくいくかどうかは，まだわからない。',
  'パスクは，この事業は決して天文学のためだけのものではなかったと強調する。彼にとって，それは人々がどんな場所に住みたいかということに関わっている。「私たちは古い建物や美しい景色を守ることに多くの労力をかけています」と彼は言う。「夜空も私たちの景観の一部です。それは祖父母のものでしたし，孫たちのものであるべきです」',
  '昨年の冬，パスクは今は12歳になった娘を，古い農場の裏の野原に連れていった。二人は毛布の上に寝転び，目が慣れるのを待った。20分ほどすると，彼が覚えていたとおりに，天の川がゆっくりと現れた。娘は数分の間何も言わなかった。それから，どうして誰もそれがそこにあると教えてくれなかったのかと尋ねた。',
 ],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
