/** レベル1：基礎（高1〜高2・共通テスト基礎）。3段落・各40〜60語・設問3問（日本語） */
import { p, q } from './types';

export const LEVEL1 = [
  p('r1-01', 1, 'The Library Cat', '図書館のネコ', [
    `A small public library in the north of England has an unusual member of staff: a gray cat named Pepper. Six years ago, on a rainy afternoon, she walked in through the front door and simply refused to leave. The librarians, who did not have the heart to send her back into the rain, gave her a bed near the heater.`,
    `Today, Pepper is the main reason some children visit the library. Several of them used to say that they hated reading. Now they sit next to her and read picture books aloud, because, as one boy explains, "Pepper never laughs when I make a mistake."`,
    `The number of children borrowing books has almost doubled since Pepper arrived. "She cannot read a word," says the head librarian, "but she has done more for reading in this town than any poster we have ever made."`,
  ], [['did not have the heart to ~', '〜する気になれなかった'], ['used to ~', '以前は〜していた'], ['refuse to ~', '〜するのを拒む'], ['almost doubled', 'ほぼ2倍になった']], [
    q('r1-01-1', 1, 'detail', 'ペッパーが図書館で暮らすようになったきっかけは何か。', [
      '雨の日に自分から入ってきて、出て行こうとしなかった', '図書館の職員が店で買ってきた', '近所の子どもたちが連れてきた', '前の飼い主が図書館にあずけた'],
      '雨の午後に正面の扉から入ってきて、どうしても出て行こうとしなかった。職員は雨の中へ追い出す気になれなかった。',
      `she walked in through the front door and simply refused to leave`, '正面の扉から入ってきて、どうしても出て行こうとしなかった',
      'did not have the heart to ~ は「〜する気になれない（かわいそうで）」。'),
    q('r1-01-2', 2, 'reason', '子どもたちがペッパーの横で声に出して読むのはなぜか。', [
      '間違えてもペッパーは笑わないから', 'ペッパーが本を選んでくれるから', '図書館の決まりだから', '読むとごほうびがもらえるから'],
      '男の子の言葉「ペッパーはぼくが間違えても絶対に笑わない」が理由になっている。',
      `"Pepper never laughs when I make a mistake."`, '「ペッパーはぼくが間違えても、ぜったいに笑わないんだ」',
      'used to say that they hated reading「以前は読書が嫌いだと言っていた（今はちがう）」。'),
    q('r1-01-3', 3, 'paraphrase', '図書館長の言葉の意味に最も近いものはどれか。', [
      'ペッパーはどんなポスターよりも町の読書のために役立った', 'ペッパーは文字が読めるようになった', '図書館はポスターを作るのをやめた', 'ペッパーが来ても本を借りる人は変わらなかった'],
      '「比較級＋than any 〜」は最上級と同じ意味。「今まで作ったどんなポスターよりも読書のために多くのことをした」。',
      `she has done more for reading in this town than any poster we have ever made`, '彼女は、私たちがこれまで作ったどんなポスターよりも、この町の読書のために多くのことをしてくれた',
      '比較級 + than any other 〜 ＝「どの〜よりも…」（最上級の意味）。'),
  ]),

  p('r1-02', 1, 'The Bus Stop Bookshelf', 'バス停の本棚', [
    `In a quiet town in Japan, an old man noticed that people waiting at the bus stop always looked bored. Buses came only once an hour, and there was nothing to do but stare at the road. So he built a small wooden bookshelf and put ten of his own books on it.`,
    `He attached a simple sign: "Take one, leave one." At first, he worried that the books would be stolen or ruined by the rain. To his surprise, the shelf was soon so full that he had to build a second one.`,
    `Now people of all ages stop to look at the books, even when they are not waiting for a bus. "I wanted to give people something to read," he says. "What I did not expect was that it would give them something to talk about."`,
  ], [['nothing to do but ~', '〜するしかない'], ['to one\'s surprise', '驚いたことに'], ['so ~ that ...', 'とても〜なので…'], ['of all ages', 'あらゆる年齢の']], [
    q('r1-02-1', 1, 'reason', '男性が本棚を作ったのはなぜか。', [
      'バスを待つ人がいつも退屈そうだったから', '家に本が多すぎて置き場所がなかったから', '町から頼まれたから', 'バス停に屋根がなかったから'],
      'バスは1時間に1本で、待つ人は道路を見つめるしかなく、いつも退屈そうだった。',
      `people waiting at the bus stop always looked bored`, 'バス停で待っている人たちがいつも退屈そうに見えた',
      'there was nothing to do but stare「見つめるしかなかった」。but は「〜以外」。'),
    q('r1-02-2', 2, 'detail', '本棚を置いたあと、どうなったか。', [
      '本がすぐにいっぱいになり、2つ目の本棚を作った', '本が盗まれてなくなった', '雨で本がだめになった', '看板の言葉を変えた'],
      '心配とは逆に、本棚はすぐに「とてもいっぱいになったので2つ目を作らなければならなかった」。',
      `the shelf was soon so full that he had to build a second one`, '本棚はすぐにとてもいっぱいになり、2つ目を作らなければならなかった',
      'so ~ that ...「とても〜なので…」。To his surprise は「彼が驚いたことに」。'),
    q('r1-02-3', 3, 'main', '男性が予想していなかったことは何か。', [
      '本棚が人々の会話のきっかけになったこと', '子どもが本を読まないこと', 'バスの本数が増えたこと', '本棚が新聞にのったこと'],
      '「読むものを与えたかったが、予想しなかったのは話すことを与えたことだ」。What I did not expect was 〜 の形に注意。',
      `What I did not expect was that it would give them something to talk about.`, '予想していなかったのは、それが人々に話のたねを与えることだった',
      'What I did not expect was that ~「予想していなかったのは〜ということだ」（関係代名詞 what）。'),
  ]),

  p('r1-03', 1, 'A Tree for Every Baby', '誕生の木', [
    `In a small village in India, there is a tradition that may surprise visitors. Every time a girl is born, her family and neighbors plant 111 trees together. The custom began about twenty years ago, when the village head lost his young daughter and decided to plant trees in her memory.`,
    `The trees are not only a celebration. Many of them are fruit trees, and the money from selling the fruit is saved for the girl's education. Families also promise that their daughters will not marry before they are old enough and will be allowed to finish school.`,
    `Thanks to the custom, the land around the village, which used to be dry, is now covered with hundreds of thousands of trees. The tradition shows that one person's sad experience can grow into something that benefits a whole community.`,
  ], [['in one\'s memory', '〜をしのんで'], ['not only A (but also B)', 'Aだけでなく(Bも)'], ['thanks to ~', '〜のおかげで'], ['be covered with ~', '〜でおおわれている']], [
    q('r1-03-1', 1, 'reason', 'この習慣が始まったきっかけは何か。', [
      '村長が幼い娘を亡くし、その思い出に木を植えたこと', '政府が木を植えるよう命じたこと', '村で果物が売れなくなったこと', '女の子の誕生を祝う祭りが禁止されたこと'],
      '「村長が幼い娘を亡くし、娘をしのんで木を植えることにした」のが始まり。',
      `when the village head lost his young daughter and decided to plant trees in her memory`, '村長が幼い娘を亡くし、彼女をしのんで木を植えることにしたとき',
      'in her memory「彼女をしのんで・記念して」。'),
    q('r1-03-2', 2, 'detail', '果物を売ったお金は何に使われるか。', [
      '女の子の教育のためにたくわえられる', '村の道路を直すのに使われる', '新しい木を買うのに使われる', '結婚式の費用に使われる'],
      '「果物を売ったお金は、その女の子の教育のためにたくわえられる」。',
      `the money from selling the fruit is saved for the girl's education`, '果物を売ったお金は、その女の子の教育のためにたくわえられる',
      'The trees are not only a celebration. のあとに「それだけではない」具体例が続く。'),
    q('r1-03-3', 3, 'main', '最後の段落の内容と合うものはどれか。', [
      'かつて乾いていた土地が、たくさんの木でおおわれるようになった', '村の木は数百本しかない', '習慣はすでに終わってしまった', '木を植えたせいで土地が乾いた'],
      '「かつて乾いていた村のまわりの土地は、今では何十万本もの木でおおわれている」。',
      `the land around the village, which used to be dry, is now covered with hundreds of thousands of trees`, 'かつて乾いていた村のまわりの土地は、今では何十万本もの木でおおわれている',
      'hundreds of thousands of ~「何十万もの〜」。, which used to be dry は前の名詞の補足説明。'),
  ]),

  p('r1-04', 1, 'The Lost Umbrella', '忘れられた傘', [
    `Every year, Tokyo's lost-and-found center receives hundreds of thousands of umbrellas. Most of them are cheap plastic ones that people leave on trains and never come back for. After a few months, the center has no choice but to throw them away.`,
    `One company decided that this waste was a chance rather than a problem. It collects the forgotten umbrellas and repairs the ones that can still be used. Then it lends them out at stations for a small fee, so people caught in sudden rain do not need to buy a new one.`,
    `The idea is popular, but the company says the best solution would be simpler. "If people chose one good umbrella and took care of it," says the founder, "there would be far fewer umbrellas to lose in the first place."`,
  ], [['have no choice but to ~', '〜するしかない'], ['A rather than B', 'BよりむしろA'], ['take care of ~', '〜を大切にする'], ['in the first place', 'そもそも']], [
    q('r1-04-1', 1, 'detail', '忘れられた傘は、数か月たつとどうなるか。', [
      '捨てるしかなくなる', '持ち主に送り返される', '外国に寄付される', '駅で売られる'],
      '「数か月後、センターはそれらを捨てるしかない」。',
      `the center has no choice but to throw them away`, 'センターはそれらを捨てるしかない',
      'have no choice but to ~「〜するしかない」。'),
    q('r1-04-2', 2, 'detail', 'その会社がしていることとして正しいものはどれか。', [
      '使える傘を直して、駅で安く貸し出している', '新しいビニール傘を作って売っている', '傘を燃やして電気を作っている', '傘の持ち主をさがしている'],
      '「まだ使える傘を直し、駅で少しの料金で貸し出す」。',
      `Then it lends them out at stations for a small fee`, 'そしてそれらを駅で、少しの料金で貸し出している',
      'A rather than B「BというよりむしろA」：問題ではなくチャンスととらえた。'),
    q('r1-04-3', 3, 'inference', '創業者が考える「いちばんよい解決策」はどれか。', [
      'よい傘を1本選んで大切に使うこと', '駅の数を増やすこと', '雨の日は外出しないこと', '貸し出しの料金を上げること'],
      '仮定法「もし人々がよい傘を1本選んで大切にすれば、そもそもなくす傘がずっと少なくなるだろう」。',
      `If people chose one good umbrella and took care of it`, 'もし人々がよい傘を1本選んで大切に使えば',
      '仮定法過去：If + 過去形, would + 動詞の原形 ＝「もし〜なら…だろうに」。'),
  ]),

  p('r1-05', 1, 'Learning to Ride at Sixty', '60歳の自転車', [
    `When Maria turned sixty, she made a surprising decision: she would finally learn to ride a bicycle. As a child, she had never had the chance, because her family was too poor to buy one. For years, she had felt embarrassed every time her friends went cycling without her.`,
    `The first weeks were hard. She fell several times, and some people laughed at her in the park. However, her grandson, who was only ten, practiced with her every weekend. "Don't look at your feet," he kept telling her. "Look where you want to go."`,
    `After two months, Maria rode all the way to the next town. She says her grandson's advice was useful for more than cycling. "It is never too late to learn," she says, "as long as you keep looking ahead."`,
  ], [['too ~ to ...', 'あまりに〜で…できない'], ['keep ~ing', '〜し続ける'], ['all the way', 'はるばる'], ['as long as ~', '〜しさえすれば']], [
    q('r1-05-1', 1, 'reason', 'マリアが子どものころ自転車に乗れなかったのはなぜか。', [
      '家が貧しくて自転車を買えなかったから', '自転車が危ないと親に止められたから', '近くに自転車の店がなかったから', '体が弱かったから'],
      '「家族があまりに貧しくて、自転車を買えなかった」。too ~ to ... の構文。',
      `her family was too poor to buy one`, '家族はあまりに貧しくて、自転車を買えなかった',
      'too ~ to ...「あまりに〜なので…できない」。one は a bicycle の代わり。'),
    q('r1-05-2', 2, 'detail', '孫がマリアにくり返し言ったことは何か。', [
      '足もとではなく、行きたいほうを見ること', '公園で練習するのをやめること', 'もっと速くこぐこと', '笑う人を気にしないこと'],
      '「足を見ないで。行きたいところを見て」と言い続けた。',
      `"Look where you want to go."`, '「行きたいところを見て」',
      'kept telling her「彼女に言い続けた」。keep ~ing ＝〜し続ける。'),
    q('r1-05-3', 3, 'main', 'マリアの最後の言葉が伝えていることはどれか。', [
      '前を向き続ければ、学ぶのに遅すぎることはない', '自転車は若いうちに習うべきだ', '孫の言うことは聞かないほうがよい', '遠くの町へは自転車で行くべきではない'],
      '「前を見続けさえすれば、学ぶのに遅すぎることはない」。as long as は条件。',
      `"It is never too late to learn," she says, "as long as you keep looking ahead."`, '「前を見続けさえすれば、学ぶのに遅すぎることはない」',
      'It is never too late to ~「〜するのに遅すぎることはない」。'),
  ]),

  p('r1-06', 1, 'Message in a Bottle', 'びんの手紙', [
    `While walking along a beach in Scotland, a twelve-year-old boy found a glass bottle with a piece of paper inside. The message was written in a child's handwriting. It said that the writer lived in Canada and wanted to make a friend "on the other side of the ocean."`,
    `The note had been written more than thirty years earlier. With help from the internet, the boy's mother found the writer, who was now a grown woman with children of her own. She could hardly believe that the bottle had traveled so far and survived for so long.`,
    `The two families now talk online every month. "When I threw the bottle into the sea," the woman says, "I never really expected an answer. It just took a little longer than I hoped."`,
  ], [['on the other side of ~', '〜の向こう側に'], ['of one\'s own', '自分自身の'], ['can hardly ~', 'ほとんど〜できない'], ['take longer than ~', '〜より時間がかかる']], [
    q('r1-06-1', 1, 'detail', '手紙を書いた人の願いは何だったか。', [
      '海の向こう側に友だちを作ること', '家族をさがすこと', 'スコットランドに住むこと', 'びんを集めること'],
      '「海の向こう側に友だちを作りたい」と書かれていた。',
      `wanted to make a friend "on the other side of the ocean."`, '「海の向こう側に」友だちを作りたいと思っていた',
      'While walking ~ は While he was walking ~ の省略。'),
    q('r1-06-2', 2, 'detail', '手紙について正しいものはどれか。', [
      '30年以上前に書かれたものだった', '少年の母親が書いたものだった', '先週書かれたばかりだった', '大人が仕事で書いたものだった'],
      '「その手紙は30年以上前に書かれていた」。過去完了 had been written で、見つかったときより前のことを表す。',
      `The note had been written more than thirty years earlier.`, 'その手紙は30年以上前に書かれていた',
      'had been written（過去完了の受け身）：過去のある時点よりさらに前。'),
    q('r1-06-3', 3, 'inference', '女性の最後の言葉から分かることはどれか。', [
      '返事が来るのに、思っていたより長くかかったと冗談まじりに言っている', '返事が来たことを怒っている', '今でも毎日びんを海に投げている', '返事はすぐに来ると確信していた'],
      '「本気で返事を期待していなかった。思っていたより少し長くかかっただけ」と、30年をユーモアをこめて表している。',
      `It just took a little longer than I hoped.`, 'ただ、思っていたより少し時間がかかっただけです',
      'never really expected「本当に期待していたわけではなかった」。'),
  ]),

  p('r1-07', 1, 'The Night Market', '夜市', [
    `In many Asian cities, night markets are an important part of daily life. When the sun goes down and the air becomes cooler, empty streets are filled with food stalls, colorful lights, and crowds of people. Some markets stay open until two or three in the morning.`,
    `For visitors, the food is the biggest attraction. You can try dozens of dishes without spending much money, from grilled squid to sweet potato balls. Many stall owners have sold the same dish for decades, and their recipes are often family secrets.`,
    `For local people, however, a night market is more than a place to eat. It is where neighbors meet, students study with friends, and families spend time together after a long day. In this sense, it works as a kind of living room for the whole city.`,
  ], [['be filled with ~', '〜でいっぱいである'], ['dozens of ~', '何十もの〜'], ['for decades', '何十年も'], ['in this sense', 'この意味で']], [
    q('r1-07-1', 1, 'detail', '夜市について第1段落で述べられていることはどれか。', [
      '朝の2時や3時まで開いている市もある', '昼間だけ開いている', '涼しい季節には開かれない', '屋根のある建物の中で開かれる'],
      '「朝の2時か3時まで開いている市もある」。',
      `Some markets stay open until two or three in the morning.`, '朝の2時か3時まで開いている市もある',
      'When the sun goes down ...「日が沈むと」。'),
    q('r1-07-2', 2, 'detail', '屋台の店主について正しいものはどれか。', [
      '何十年も同じ料理を売っている人が多い', '毎晩ちがう料理を出す', 'レシピを客に教えている', 'ほとんどが学生である'],
      '「多くの店主は何十年も同じ料理を売ってきた」。現在完了 have sold は継続。',
      `Many stall owners have sold the same dish for decades`, '多くの屋台の店主は、何十年も同じ料理を売ってきた',
      'have sold ~ for decades：現在完了の継続「何十年も〜してきた」。'),
    q('r1-07-3', 3, 'main', '筆者が夜市を「街全体の居間」とたとえたのはなぜか。', [
      '近所の人や家族が集まって時間を過ごす場所だから', '家具がたくさん売られているから', '屋根があって雨にぬれないから', '観光客だけが集まる場所だから'],
      '「近所の人が会い、学生が勉強し、家族が一緒に過ごす場所」なので「居間」にたとえている。',
      `It is where neighbors meet, students study with friends, and families spend time together after a long day.`, 'そこは近所の人が出会い、学生が友だちと勉強し、家族が長い一日のあとに一緒に過ごす場所だ',
      'more than a place to eat「食べる場所以上のもの」。'),
  ]),

  p('r1-08', 1, 'A Robot in the Classroom', '教室のロボット', [
    `An elementary school in South Korea has started using a small robot in its English classes. The robot can say simple sentences, ask questions, and even dance when students give correct answers. Not surprisingly, the children love it.`,
    `However, the robot is not meant to replace the human teacher. "It is good at repeating the same words many times without getting tired," the teacher explains. "But it cannot tell when a child is sad or confused. Noticing that is my job."`,
    `The school plans to use the robot only for speaking practice. In this way, the teacher hopes to have more time for what machines cannot do: listening to each student and encouraging those who are losing confidence.`,
  ], [['not surprisingly', '当然のことながら'], ['be meant to ~', '〜することになっている・〜のためのもの'], ['tell (when) ~', '〜を見分ける'], ['losing confidence', '自信をなくしかけている']], [
    q('r1-08-1', 1, 'detail', 'ロボットができることとして述べられていないものはどれか。', [
      '子どもの宿題を採点する', '簡単な文を話す', '質問をする', '正解するとおどる'],
      '本文にあるのは「簡単な文を話す・質問する・正解するとおどる」の3つ。採点は書かれていない。',
      `The robot can say simple sentences, ask questions, and even dance when students give correct answers.`, 'そのロボットは簡単な文を話し、質問をし、生徒が正解するとおどることさえできる',
      '「述べられていないもの」を選ぶ問題（NOT問題）。'),
    q('r1-08-2', 2, 'detail', '先生が考える、ロボットにできないことは何か。', [
      '子どもが悲しんだり困ったりしているのに気づくこと', '同じ言葉を何度もくり返すこと', '英語の文を言うこと', '疲れずに働くこと'],
      '「子どもが悲しいときや困っているときを見分けられない。それに気づくのが私の仕事だ」。',
      `But it cannot tell when a child is sad or confused.`, 'でも、子どもが悲しんでいるときや困っているときを見分けることはできない',
      'tell は「言う」だけでなく「見分ける・わかる」の意味がある。'),
    q('r1-08-3', 3, 'main', 'この学校がロボットを使う目的として最も適切なものはどれか。', [
      '先生が一人ひとりの生徒と向き合う時間を増やすため', '先生の数を減らすため', '英語の授業をなくすため', 'ロボットの売り上げを伸ばすため'],
      '「機械にはできないこと、つまり生徒一人ひとりの話を聞き励ます時間を増やしたい」。',
      `the teacher hopes to have more time for what machines cannot do`, '先生は、機械にはできないことのための時間をもっと持ちたいと願っている',
      'コロン（:）のあとは前の内容の具体的な説明。'),
  ]),

  p('r1-09', 1, 'Grandma\'s Recipe Book', '祖母のレシピ帳', [
    `When Emma's grandmother passed away, she left behind an old notebook full of handwritten recipes. Some pages were stained with oil, and others had notes in the margins, such as "Tom's favorite" or "Too salty — use less next time."`,
    `Emma decided to cook every recipe in the book, one each week. It took her almost two years. Some dishes failed completely, because her grandmother had often written "a little" or "enough" instead of exact amounts.`,
    `Through the project, Emma came to know her grandmother in a new way. "The recipes told me what she cooked," she says, "but the notes told me who she was: someone who never stopped trying to do better for the people she loved."`,
  ], [['passed away', '亡くなった（pass away）'], ['leave behind ~', '〜をあとに残す'], ['instead of ~', '〜の代わりに'], ['come to ~', '〜するようになる']], [
    q('r1-09-1', 1, 'detail', 'ノートについて第1段落で述べられていることはどれか。', [
      '余白に、家族の好みや改善点のメモがあった', '印刷された料理の本だった', '新品できれいなままだった', 'レシピは1つしかなかった'],
      '余白に「トムの大好物」「しょっぱすぎ──次は少なめに」などのメモがあった。',
      `others had notes in the margins`, '余白にメモが書かれたページもあった',
      'Some pages ..., and others ...「〜のページもあれば、…のページもある」。'),
    q('r1-09-2', 2, 'reason', '失敗した料理があったのはなぜか。', [
      '正確な分量ではなく「少し」「適量」と書かれていたから', 'エマが料理を一度もしたことがなかったから', '材料が手に入らなかったから', 'ノートのページが破れていたから'],
      '「正確な量の代わりに『少し』や『十分な量』とよく書いていた」から。',
      `her grandmother had often written "a little" or "enough" instead of exact amounts`, '祖母は正確な量の代わりに、「少し」や「十分」とよく書いていた',
      'because 以下が理由。instead of ~「〜の代わりに」。'),
    q('r1-09-3', 3, 'main', 'エマが最後に気づいたことはどれか。', [
      'メモから、祖母が愛する人のためにずっと工夫し続ける人だったと分かった', '祖母は料理が下手だった', 'レシピより自分の料理のほうがおいしい', '料理は2年では覚えられない'],
      '「メモは祖母がどんな人だったかを教えてくれた。愛する人のためにより良くしようとし続ける人だ」。',
      `someone who never stopped trying to do better for the people she loved`, '愛する人たちのために、より良くしようとするのを決してやめなかった人',
      'what she cooked（何を作ったか）と who she was（どんな人か）の対比。'),
  ]),

  p('r1-10', 1, 'A Week Without Phones', 'スマホなしの1週間', [
    `A high school in Ireland asked its students to try something that many of them found frightening: a whole week without their phones. The phones were not taken away, but students agreed to leave them at home or in their lockers.`,
    `The first two days were difficult. Several students said they kept reaching for their pockets without thinking. By the end of the week, however, many reported that they were sleeping better and talking more with their friends during lunch.`,
    `The school did not ban phones after the experiment. Instead, it asked students to decide for themselves how to use them. "We did not want to make a rule," the principal explains. "We wanted them to notice something they could not see while the phone was always in their hand."`,
  ], [['take away ~', '〜を取り上げる'], ['without thinking', '無意識に'], ['by the end of ~', '〜の終わりまでには'], ['for oneself', '自分で']], [
    q('r1-10-1', 1, 'detail', 'この試みの内容として正しいものはどれか。', [
      '生徒が自分でスマホを家やロッカーに置いておく', '学校がスマホを取り上げる', 'スマホを新しいものに交換する', 'スマホで宿題を提出する'],
      '「スマホは取り上げられなかったが、生徒は家かロッカーに置いておくことに同意した」。',
      `The phones were not taken away, but students agreed to leave them at home or in their lockers.`, 'スマホは取り上げられなかったが、生徒たちは家かロッカーに置いておくことに同意した',
      'not A, but B の形。取り上げたのではなく、自分で置いた。'),
    q('r1-10-2', 2, 'detail', '1週間の終わりに多くの生徒が報告したことはどれか。', [
      'よく眠れるようになり、友だちとよく話すようになった', '勉強の時間が減った', 'もっとスマホがほしくなった', '昼休みが退屈になった'],
      '「よく眠れるようになり、昼休みに友だちとよく話すようになった」。However のあとに大事な内容が来る。',
      `many reported that they were sleeping better and talking more with their friends during lunch`, '多くの生徒が、よく眠れるようになり、昼休みに友だちとよく話すようになったと報告した',
      'However は「しかし」：前半（つらかった）と後半（よい変化）の対比。'),
    q('r1-10-3', 3, 'inference', '校長がルールを作らなかった理由として最も適切なものはどれか。', [
      '生徒に自分で気づいて、使い方を決めてほしかったから', 'ルールを作る時間がなかったから', 'スマホは勉強に必要だから', '親が反対したから'],
      '「ルールを作りたかったのではない。いつもスマホを持っていると見えないことに気づいてほしかった」。',
      `We wanted them to notice something they could not see while the phone was always in their hand.`, 'いつもスマホを手にしていると見えないことに、生徒自身に気づいてほしかった',
      'want + 人 + to ~「人に〜してほしい」。'),
  ]),

  p('r1-11', 1, 'The Quiet Hour', '静かな時間', [
    `Supermarkets are usually noisy places, with music playing, announcements, and bright lights everywhere. For most shoppers, this is not a problem. For some people, however, especially those who are very sensitive to sound and light, shopping can be stressful and exhausting.`,
    `To help these customers, a supermarket chain in New Zealand introduced a "quiet hour" once a week. During this time, the music is turned off, the lights are made softer, and staff avoid making announcements or moving noisy carts.`,
    `The idea was meant for a small group of shoppers, but it turned out to be popular with many others. Elderly people and parents with small children said they also enjoyed the calm atmosphere. A change made for a few ended up helping a lot of people.`,
  ], [['be sensitive to ~', '〜に敏感である'], ['turn off ~', '〜を消す'], ['turn out to be ~', '〜だと分かる'], ['end up ~ing', '結局〜することになる']], [
    q('r1-11-1', 1, 'detail', '買い物がつらく感じられるのはどのような人か。', [
      '音や光にとても敏感な人', '買い物にお金をかけない人', '車を持っていない人', '料理が好きな人'],
      '「特に音や光にとても敏感な人にとって、買い物はストレスで疲れるものになりうる」。',
      `especially those who are very sensitive to sound and light`, '特に、音や光にとても敏感な人たち',
      'those who ~「〜する人たち」。'),
    q('r1-11-2', 2, 'not', '「静かな時間」に行われることとして述べられていないものはどれか。', [
      '商品の値段を下げる', '音楽を止める', '照明をやわらかくする', '店内放送をひかえる'],
      '本文にあるのは「音楽を止める・照明をやわらかく・放送やうるさいカートをひかえる」。値下げは書かれていない。',
      `the music is turned off, the lights are made softer, and staff avoid making announcements or moving noisy carts`, '音楽は止められ、照明はやわらかくされ、店員は放送やうるさいカートの移動をひかえる',
      'avoid ~ing「〜するのを避ける」。'),
    q('r1-11-3', 3, 'main', '最後の段落の要点として最も適切なものはどれか。', [
      '少数の人のための工夫が、多くの人の役に立った', '静かな時間は高齢者には不評だった', 'この試みはすぐに中止された', '子ども連れは来店を断られた'],
      '「少数のために作られた変化が、結局たくさんの人を助けることになった」。',
      `A change made for a few ended up helping a lot of people.`, '少数の人のために行われた変化が、結局多くの人を助けることになった',
      'made for a few は過去分詞の後置修飾「少数のために作られた」。'),
  ]),

  p('r1-12', 1, 'A Garden on the School Roof', '屋上の菜園', [
    `Three years ago, the roof of a junior high school in Osaka was nothing but gray concrete. Today, it is a garden where students grow tomatoes, cucumbers, and herbs. The project was started by a science teacher who wanted her students to see where food really comes from.`,
    `Caring for the garden is not always easy. In summer, the plants must be watered every morning, even during the holidays. Students take turns, and those who live nearby often come to school early to help.`,
    `The vegetables are used in school lunches a few times a month. Interestingly, the teachers have noticed that students who usually leave their vegetables uneaten finish them on those days. Food seems to taste better when you have grown it yourself.`,
  ], [['nothing but ~', 'ただの〜にすぎない'], ['take turns', '交代でする'], ['leave ~ uneaten', '〜を食べ残す'], ['taste better', 'よりおいしく感じる']], [
    q('r1-12-1', 1, 'reason', '理科の先生が菜園を始めたのはなぜか。', [
      '食べ物が実際にどこから来るのかを生徒に見せたかったから', '屋上がこわれていたから', '野菜を売ってお金をためたかったから', '給食の量が少なかったから'],
      '「食べ物が本当はどこから来るのかを生徒に見てほしかった」。',
      `who wanted her students to see where food really comes from`, '食べ物が本当はどこから来るのかを生徒に見てほしいと思っていた',
      'nothing but gray concrete「ただの灰色のコンクリートにすぎなかった」。'),
    q('r1-12-2', 2, 'detail', '夏の水やりについて正しいものはどれか。', [
      '生徒が交代で、休みの日も毎朝水をやる', '先生が一人で水をやる', '雨の日だけ水をやる', '機械が自動で水をやる'],
      '「夏は休み中も毎朝水やりが必要で、生徒は交代でしている」。',
      `Students take turns, and those who live nearby often come to school early to help.`, '生徒は交代でしており、近くに住む生徒はよく早く登校して手伝う',
      'take turns「交代でする」。'),
    q('r1-12-3', 3, 'main', '最後の段落から分かることはどれか。', [
      '自分で育てた野菜は、ふだん残す生徒も食べきる', '屋上の野菜は給食に使われない', '生徒は野菜をもっと残すようになった', '先生たちは野菜が嫌いである'],
      '「ふだん野菜を残す生徒も、その日は食べきる。自分で育てた食べ物はおいしく感じるようだ」。',
      `students who usually leave their vegetables uneaten finish them on those days`, 'ふだん野菜を食べ残す生徒たちが、その日には食べきる',
      'leave + O + 過去分詞「Oを〜のままにしておく」。'),
  ]),
];
