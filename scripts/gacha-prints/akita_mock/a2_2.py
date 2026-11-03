# -*- coding: utf-8 -*-
# 第2回 Ⅱ 長文読解（週4日制にした地方の学校）。{u|…} 設問で問う語句。設問は a2_2q.py
from a2_2q import QUESTIONS, VOCAB
P = {
 'kind': 'reading',
 'title': '長文読解',
 'intro': 'Study the article and respond to each question by choosing one of the four options. Write the letter of the option you choose.',
 'headline': 'Four Days of Lessons, One Day of Something Else',
 'paras': [
  "Every Friday morning, the corridors of Bramwell Valley School are silent. The classrooms are locked, the buses stay in their garage, and the school’s 340 pupils are somewhere else entirely. Three years ago, this rural school became one of a small but growing number that teach lessons on only four days a week. The school day is about fifty minutes longer from Monday to Thursday, so the total number of teaching hours has hardly changed.",
  "The decision was not made because of a new theory about learning. It began with a much more practical problem: the school could not find enough teachers. Bramwell Valley lies more than an hour’s drive from the nearest city, and for several years in a row, advertisements for maths and science posts received no applications at all. The head teacher, Nadia Coombe, says she was spending more time searching for staff than thinking about lessons.",
  "A four-day week, she hoped, would make the job more attractive. Teachers would have one weekday to plan lessons, mark work, attend training or simply rest. The plan seemed to {u|pay off}. In the first year after the change, the school received more than three times as many applications as before, and two teachers who had been planning to leave decided to stay. “It had been years since I last chose between candidates instead of begging people to come,” Coombe says.",
  "There were savings, too. With no buses running on Fridays and the heating turned down in empty buildings, the school spent noticeably less on transport and energy. Coombe is quick to add, however, that saving money was never the main goal, and that the amounts involved were smaller than some newspapers reported.",
  "For pupils, the effects have been mixed. Many say they like the longer weekend, and attendance on the remaining four days has improved slightly. Some older students use Fridays for part-time jobs, while others catch up on homework or take part in sports. But the longer school day is tiring, especially for the youngest children, and several teachers have noticed that concentration drops sharply in the final lesson of the afternoon.",
  "The biggest worry concerns families. When the school is closed, someone has to look after the children who are too young to stay at home alone. Parents with flexible jobs, or with grandparents nearby, have managed fairly easily. For others, especially single parents and those working in shops or factories, Fridays have become a weekly headache. Some have had to pay for childcare they cannot really afford.",
  "To ease this burden, the school now opens its hall on Fridays for an optional programme run by local volunteers and community groups. Children can join a cooking club, help on a nearby farm, or learn first aid. The programme is free, but places are limited, and it does not count as formal teaching. Critics say it is a {u|stopgap} rather than a solution: a sensible short-term measure that does not answer the deeper question of who should take responsibility for children on a weekday.",
  "What about learning itself? Here the evidence is far from clear. Exam results at Bramwell Valley have stayed roughly the same since the change. Studies of four-day schools elsewhere have produced conflicting results: some find small falls in achievement, particularly in maths, while others find no difference at all. Researchers caution that schools which adopt a four-day week tend to be small and rural, which makes it hard to compare them fairly with other schools.",
  "Supporters of the idea argue that the extra day can be valuable in itself. A day without lessons, they say, gives young people time to develop interests that a crowded timetable leaves no room for. Opponents reply that this only works for children whose families can offer them something worthwhile to do. For pupils from poorer homes, an unstructured day may simply mean more hours in front of a screen.",
  "Coombe herself is cautious. She does not recommend the four-day week to every school, and she says that the arrangement is reviewed every year. “It solved a staffing crisis that was threatening the whole school,” she says. “But I would not pretend it has no costs. Those costs fall most heavily on the families with the least room to cope, and we have a duty to keep looking for ways to help them.”",
  "For now, the experiment continues. Last month, the school asked parents and pupils whether they wanted to keep the four-day week. Just over sixty per cent said yes. It was a clear majority, but not an overwhelming one, and Coombe is aware that the families who said no are often the ones whose voices are hardest to hear.",
 ],
 'notes': [],
 'translation': [
  '毎週金曜日の朝，ブラムウェル・バレー校の廊下は静まり返っている。教室には鍵がかかり，バスは車庫に止まったままで，340人の生徒はまったく別の場所にいる。3年前，この地方の学校は，週に4日しか授業をしない，数は少ないが増えつつある学校の一つになった。月曜から木曜までの授業日はおよそ50分長くなっているので，授業時間の合計はほとんど変わっていない。',
  'この決定は，学習についての新しい理論によって下されたわけではない。始まりは，もっと実際的な問題だった。学校が十分な数の教員を見つけられなかったのである。ブラムウェル・バレーは最寄りの都市から車で1時間以上かかる場所にあり，数年続けて，数学と理科の教員の募集には応募がまったくなかった。校長のナディア・クームは，授業について考えるより教員を探すことに多くの時間を費やしていたと言う。',
  '週4日制にすれば仕事がもっと魅力的になる，と彼女は期待した。教員は平日の1日を，授業の準備や採点，研修への参加，あるいはただ休むことに使える。計画はうまくいったようだった。変更後の最初の年，学校には以前の3倍を超える応募があり，辞めるつもりだった教員2人がとどまることにした。「来てくれるよう頼み込むのではなく，候補者の中から選んだのは何年ぶりかのことでした」とクームは言う。',
  '節約もあった。金曜日にはバスが走らず，誰もいない校舎の暖房も弱められるので，学校の交通費と光熱費ははっきりと減った。しかしクームはすかさず，お金の節約は決して主な目的ではなかったし，関わる金額も一部の新聞が報じたより小さかったと付け加える。',
  '生徒にとって，影響は良い面も悪い面もある。長い週末が好きだという生徒は多く，残りの4日間の出席率はわずかに上がった。上級生の中には金曜日をアルバイトに使う人もいれば，宿題の遅れを取り戻したり，スポーツに参加したりする人もいる。しかし長くなった授業日は疲れるもので，特に最も幼い子どもたちにとってはそうである。午後の最後の授業で集中力が急に落ちることに気づいている教員も何人かいる。',
  '最大の心配は家庭に関わるものである。学校が休みのとき，家に一人でいるには幼すぎる子どもの世話を誰かがしなければならない。働き方に融通のきく親や，近くに祖父母がいる親は，かなり楽にやりくりしてきた。それ以外の親，特に一人親や店や工場で働く人にとって，金曜日は毎週の頭痛の種になっている。払う余裕のない保育料を払わなければならなくなった人もいる。',
  'この負担を和らげるため，学校は現在，地元のボランティアや地域の団体が運営する任意参加のプログラムのために，金曜日に講堂を開放している。子どもたちは料理クラブに参加したり，近くの農場を手伝ったり，応急手当を学んだりできる。プログラムは無料だが定員があり，正式な授業には数えられない。批判する人々は，それは解決策ではなく一時しのぎだと言う。短期的な対策としては理にかなっているが，平日に子どもの責任を誰が負うべきかという，より根本的な問いには答えていないというのである。',
  '学習そのものについてはどうだろうか。ここでは，証拠ははっきりしているとはとても言えない。ブラムウェル・バレーの試験結果は，変更以来ほぼ同じままである。ほかの地域の週4日制の学校についての研究は，相反する結果を出している。特に数学で成績がわずかに下がったとするものもあれば，まったく差がないとするものもある。研究者たちは，週4日制を取り入れる学校は小規模で地方にある傾向があるので，ほかの学校と公平に比べるのは難しいと注意を促している。',
  'この考えを支持する人々は，増えた1日にはそれ自体に価値があると主張する。授業のない日があれば，詰まった時間割では入る余地のない興味を育てる時間が若者に与えられる，と彼らは言う。反対する人々は，それがうまくいくのは，家庭が何か価値のあることをさせてあげられる子どもだけだと反論する。貧しい家庭の生徒にとって，予定のない1日は，画面の前で過ごす時間が増えるだけのことかもしれない。',
  'クーム自身は慎重である。彼女はすべての学校に週4日制を勧めるわけではなく，この仕組みは毎年見直されていると言う。「学校全体を脅かしていた教員不足の危機を解決してくれました」と彼女は言う。「でも，費用がないふりをするつもりはありません。その費用は，対処する余裕が最も少ない家庭に最も重くのしかかります。私たちには，その家庭を助ける方法を探し続ける責任があるのです」',
  '今のところ，この試みは続いている。先月，学校は保護者と生徒に，週4日制を続けたいかどうかを尋ねた。はいと答えたのは60パーセントをわずかに超える人々だった。はっきりした過半数ではあったが，圧倒的というほどではない。そしてクームは，いいえと答えた家庭こそ，その声が最も聞こえにくい家庭であることが多いと承知している。',
 ],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
