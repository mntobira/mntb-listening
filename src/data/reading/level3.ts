/** レベル3：応用（GMARCH・関関同立・地方国立）。3〜4段落・各60〜85語・段落ごとの問い＋全体の問い（日本語） */
import { p, q } from './types';

export const LEVEL3 = [
  p('r3-01', 3, 'The Paradox of Choice', '選択肢が多すぎると', [
    `We tend to assume that the more options we have, the happier we will be. If a café offers fifty kinds of coffee, surely everyone can find the perfect cup. A growing body of research, however, suggests that beyond a certain point, additional choice may do more harm than good.`,
    `In a well-known experiment, a supermarket set up a table offering free samples of jam. On some days twenty-four flavors were displayed; on others, only six. The larger display attracted more visitors, but shoppers who saw only six flavors were roughly ten times as likely to actually buy a jar.`,
    `Psychologists offer two explanations. First, a large number of options increases the mental effort required to decide, so people often postpone the decision altogether. Second, having many alternatives raises our expectations. After choosing, we are more likely to wonder whether another option would have been better, and this lingering doubt reduces our satisfaction.`,
    `None of this means that choice is bad. Few people would prefer a world with only one kind of shoe. The point is rather that freedom of choice is valuable only up to a point, and that offering fewer, well-selected options can sometimes serve people better.`,
  ], [['do more harm than good', '益より害のほうが大きい'], ['a growing body of research', '増えつつある研究'], ['postpone ~ altogether', '〜をすっかり先のばしにする'], ['up to a point', 'ある程度までは']], [
    q('r3-01-1', 1, 'detail', '第1段落で、研究が示唆していることはどれか。', [
      'ある点を超えると、選択肢を増やすことはかえって害になりうる', '選択肢は多ければ多いほど人を幸せにする', 'コーヒーの種類は50種類がちょうどよい', '選択肢の数は満足度と関係がない'],
      'beyond a certain point, additional choice may do more harm than good「ある点を超えると、さらなる選択肢は益より害が大きいかもしれない」。',
      `beyond a certain point, additional choice may do more harm than good`, 'ある点を超えると、それ以上の選択肢は益より害のほうが大きいかもしれない',
      'do more harm than good は入試頻出の表現。'),
    q('r3-01-2', 2, 'detail', 'ジャムの実験の結果として正しいものはどれか。', [
      '種類が多いほうが人は集まったが、実際に買う割合は種類が少ないほうがずっと高かった', '種類が多いほうが多く売れた', '種類が少ないと誰も立ち寄らなかった', 'どちらの日も売れた数は同じだった'],
      '「多い展示のほうが客を集めたが、6種類だけ見た客は約10倍、実際に1瓶買う可能性が高かった」。',
      `shoppers who saw only six flavors were roughly ten times as likely to actually buy a jar`, '6種類だけを見た客は、実際に1瓶買う可能性がおよそ10倍高かった',
      '倍数表現 ten times as likely to ~。'),
    q('r3-01-3', 3, 'reason', '選択肢が多いと満足度が下がる理由として、本文が挙げているものはどれか。', [
      '選んだあとで、ほかのほうがよかったのではと疑い続けやすくなるから', '選択肢が多いと値段が高くなるから', '店員の説明が不十分になるから', '品質の悪い商品が混ざるから'],
      'Second 以下。期待が上がり、選んだあと「別の選択肢がよかったのでは」と考え、その疑いが満足を下げる。',
      `we are more likely to wonder whether another option would have been better, and this lingering doubt reduces our satisfaction`, '別の選択肢のほうがよかったのではないかと考えやすくなり、この消えない疑いが満足感を下げる',
      'would have been better：仮定法過去完了「（実際とちがい）よかっただろうに」。'),
    q('r3-01-4', 0, 'main', '筆者の主張として最も適切なものはどれか。', [
      '選択の自由はある程度までしか価値がなく、厳選した少ない選択肢のほうがよい場合もある', '選択すること自体が悪である', '選択肢は一つに限るべきだ', '人はいつも選択肢の少ない世界を好む'],
      '最終段落 None of this means ~. The point is rather that ~ が主張。「ある程度まで」がポイント。',
      `freedom of choice is valuable only up to a point`, '選択の自由は、ある程度までしか価値がない',
      'None of this means that ~「このことは〜という意味ではまったくない」→ 極端な読み取りを防ぐ。'),
  ]),

  p('r3-02', 3, 'Plastic That Disappears?', '分解するプラスチック', [
    `"Biodegradable" plastic bags are often sold as an environmentally friendly alternative to ordinary plastic. The word suggests that they will simply break down and return to nature once they are thrown away. The reality, unfortunately, is far less reassuring.`,
    `Many biodegradable plastics break down only under specific conditions, such as the high temperatures found in industrial composting facilities. In the ocean or in a garden, they may last for years. In one British study, researchers left several types of "biodegradable" bags in soil and seawater for three years. At the end of the experiment, some of them were still strong enough to carry a full load of shopping.`,
    `There is also a danger that the label itself encourages careless behavior. If people believe that a bag will disappear on its own, they may be less careful about where they throw it away. In this sense, a product designed to reduce pollution could end up increasing it.`,
    `For these reasons, many experts argue that the real solution lies not in new materials but in using fewer single-use bags in the first place.`,
  ], [['alternative to ~', '〜の代わりになるもの'], ['far less ~', 'はるかに〜でない'], ['on one\'s own', 'ひとりでに'], ['lie in ~', '〜にある']], [
    q('r3-02-1', 1, 'paraphrase', '"The reality, unfortunately, is far less reassuring." の意味に最も近いものはどれか。', [
      '実際は、言葉から受ける印象ほど安心できるものではない', '実際は、思った以上に安全である', '実際のところは誰にもわからない', '実際は、ふつうのプラスチックより危険だ'],
      'far less reassuring「はるかに安心できない」。「自然に戻る」という言葉の印象ほど安心できない、という意味。',
      `The reality, unfortunately, is far less reassuring.`, '残念ながら、現実ははるかに安心できないものだ',
      'far は比較級を強める（much と同じ）。'),
    q('r3-02-2', 2, 'detail', 'イギリスの研究の結果として正しいものはどれか。', [
      '3年後も、買い物の荷物を運べるほど丈夫な袋があった', 'すべての袋が完全になくなっていた', '海水の袋だけが残っていた', '土の中の袋は植物の栄養になった'],
      '「実験の終わりに、いくつかはまだ買い物の荷物いっぱいを運べるほど丈夫だった」。',
      `some of them were still strong enough to carry a full load of shopping`, 'その一部は、まだ買い物の荷物いっぱいを運べるほど丈夫だった',
      '形容詞 + enough to ~「〜するほど…」。'),
    q('r3-02-3', 3, 'inference', '第3段落で筆者が指摘している皮肉な点はどれか。', [
      '汚染を減らすための製品が、かえって汚染を増やしかねないこと', '生分解性の袋が高すぎること', '人々が袋を使わなくなること', '袋がすぐに分解されすぎること'],
      '「消える」と信じると捨て方が雑になる。だから「汚染を減らすための製品が、結局汚染を増やすことになりうる」。',
      `a product designed to reduce pollution could end up increasing it`, '汚染を減らすために作られた製品が、結局それを増やすことになりかねない',
      'designed to ~ は過去分詞の後置修飾。end up ~ing「結局〜することになる」。'),
    q('r3-02-4', 0, 'main', '専門家が考える本当の解決策はどれか。', [
      'そもそも使い捨ての袋の使用を減らすこと', '新しい素材を開発すること', '袋を土に埋めること', '生分解性の袋だけを使うこと'],
      'not in new materials but in ~「新素材ではなく、そもそも使い捨て袋を減らすことにある」。',
      `the real solution lies not in new materials but in using fewer single-use bags in the first place`, '本当の解決策は新しい素材ではなく、そもそも使い捨ての袋を使う量を減らすことにある',
      'lie not in A but in B「AではなくBにある」。'),
  ]),

  p('r3-03', 3, 'The Myth of Learning Styles', '学習スタイルの思い込み', [
    `Many students have been told that they are "visual learners" or "auditory learners," and that they will learn best if lessons match their particular style. The idea is so widespread that it appears in teacher training courses around the world. Surprisingly, however, there is little evidence that it is true.`,
    `To test the theory properly, researchers first identify students' preferred styles and then teach them either in their preferred way or in a different way. If the theory were correct, students taught in their own style should perform better. In study after study, they did not.`,
    `This is not to say that preferences do not exist. People certainly enjoy some ways of learning more than others. What the research shows is that preference and effectiveness are two different things.`,
    `What does seem to matter is the nature of the content. A map is best understood visually, and a language's pronunciation is best learned by listening — regardless of the learner's supposed style.`,
  ], [['so ~ that ...', 'とても〜なので…'], ['study after study', '研究に次ぐ研究で'], ['This is not to say that ~', 'だからといって〜というわけではない'], ['regardless of ~', '〜に関係なく']], [
    q('r3-03-1', 1, 'detail', '第1段落の内容と合うものはどれか。', [
      '学習スタイルの考えは広まっているが、正しいという証拠はほとんどない', '学習スタイルの考えは科学的に証明されている', '教員研修では学習スタイルを扱わない', '学習スタイルは最近生まれた考えだ'],
      '「その考えは教員研修にも出てくるほど広まっているが、正しいという証拠はほとんどない」。',
      `there is little evidence that it is true`, 'それが正しいという証拠はほとんどない',
      'evidence that ~ の that は同格「〜という証拠」。little は「ほとんどない」。'),
    q('r3-03-2', 2, 'detail', '実験の結果として正しいものはどれか。', [
      '自分の好むスタイルで教えられた生徒が、成績がよくなるわけではなかった', '好むスタイルで教えられた生徒のほうが成績がよかった', '好まないスタイルで教えると成績が大きく下がった', '実験は一度しか行われなかった'],
      '「理論が正しければ自分のスタイルで教わった生徒がよい成績のはずだ。研究に次ぐ研究で、そうはならなかった」。',
      `In study after study, they did not.`, '研究に次ぐ研究で、そうはならなかった',
      'If the theory were correct, ... should ~：仮定法。did not = did not perform better。'),
    q('r3-03-3', 3, 'paraphrase', '"preference and effectiveness are two different things" の意味として最も適切なものはどれか。', [
      '好きな学び方が、効果的な学び方だとは限らない', '好きな学び方こそ最も効果的だ', '学び方の好みは存在しない', '効果的な学び方は人によって全く違う'],
      '「好み」と「効果」は別物。好みはあるが（譲歩）、それが効果を決めるわけではない。',
      `What the research shows is that preference and effectiveness are two different things.`, '研究が示しているのは、好みと効果は別物だということだ',
      'This is not to say that ~（譲歩）→ What the research shows is ~（主張）。'),
    q('r3-03-4', 4, 'main', '筆者が「本当に重要だ」と考えるものはどれか。', [
      '学ぶ内容の性質に合った方法で学ぶこと', '学習者の好きなスタイル', '先生の話し方', '教室の明るさ'],
      '「重要に思われるのは内容の性質だ。地図は見て、発音は聞いて学ぶのが最もよい。学習者のスタイルに関係なく」。',
      `What does seem to matter is the nature of the content.`, '本当に重要だと思われるのは、内容の性質である',
      'does seem の does は動詞の強調「本当に〜」。'),
  ]),

  p('r3-04', 3, 'Food Miles', 'フードマイル', [
    `"Buy local" has become a popular slogan among people who want to reduce their impact on the environment. The reasoning seems simple: food that travels a shorter distance from farm to table must produce less pollution. The number of kilometers food travels is sometimes called its "food miles."`,
    `However, transport is often only a small part of the total environmental cost of food. How the food is produced usually matters far more. Tomatoes grown in heated greenhouses in a cold country, for example, may be responsible for more greenhouse gases than tomatoes grown outdoors in a sunny country and shipped hundreds of kilometers.`,
    `The method of transport matters, too. Goods carried in bulk by ship produce relatively little pollution per item, whereas food flown in by airplane or carried in a private car on a short shopping trip can produce a surprising amount.`,
    `This does not mean that buying local food is pointless; it may support local farmers and provide fresher produce. But if the goal is to protect the environment, what we eat and how it is grown deserve more attention than how far it has traveled.`,
  ], [['impact on ~', '〜への影響'], ['be responsible for ~', '〜の原因である'], ['in bulk', '大量に'], ['whereas ~', '〜であるのに対し']], [
    q('r3-04-1', 1, 'detail', '「地元のものを買う」という考えの根拠として本文で述べられているものはどれか。', [
      '農場から食卓までの距離が短い食べ物ほど汚染が少ないはずだという考え', '地元の食べ物は値段が安いという考え', '地元の食べ物は味がよいという考え', '外国の食べ物は安全でないという考え'],
      'The reasoning seems simple:（その理屈は単純に思える）のあとに内容がある。',
      `food that travels a shorter distance from farm to table must produce less pollution`, '農場から食卓まで移動する距離が短い食べ物は、汚染が少ないにちがいない',
      'must は「〜にちがいない」（推量）。'),
    q('r3-04-2', 2, 'inference', '温室のトマトの例が示していることはどれか。', [
      '輸送距離より、どう生産されたかのほうが環境への影響が大きいことがある', '温室で育てたトマトのほうが環境にやさしい', 'トマトは長い距離を運べない', '晴れた国ではトマトが育たない'],
      '「どう生産されるかのほうがはるかに重要」。寒い国の暖房温室トマトは、遠くから運ばれた露地トマトより温室効果ガスが多い場合がある。',
      `How the food is produced usually matters far more.`, '食べ物がどのように生産されるかのほうが、ふつうははるかに重要だ',
      'How the food is produced が主語（名詞節）。'),
    q('r3-04-3', 3, 'detail', '輸送方法について正しいものはどれか。', [
      '船で大量に運ぶと、1品あたりの汚染は比較的少ない', '飛行機で運ぶのが最も汚染が少ない', '短い買い物でも自家用車なら汚染はない', '輸送方法による差はない'],
      '「船で大量に運ぶと1品あたりの汚染は比較的少ないのに対し、飛行機や短い自家用車の買い物は驚くほど多い」。',
      `Goods carried in bulk by ship produce relatively little pollution per item`, '船で大量に運ばれる品物は、1品あたりの汚染が比較的少ない',
      'whereas は対比「〜であるのに対して」。'),
    q('r3-04-4', 0, 'main', '筆者の主張として最も適切なものはどれか。', [
      '環境のためには、移動距離よりも何をどう育てたかに注目すべきだ', '地元の食べ物を買うのは無意味だ', '食べ物はすべて船で運ぶべきだ', 'フードマイルは環境に関係ない'],
      '最終段落。地元産を買う意味は認めつつ（譲歩）、「環境が目的なら、何を食べどう育てたかが移動距離より注目に値する」。',
      `what we eat and how it is grown deserve more attention than how far it has traveled`, '何を食べるか、そしてそれがどう育てられたかは、どれだけ遠くから来たかよりも注目に値する',
      'This does not mean that ~ ; But ~：譲歩→主張の型。'),
  ]),

  p('r3-05', 3, 'Praise and Effort', 'ほめ方と努力', [
    `Most parents and teachers believe that praising children for being clever will boost their confidence. A series of experiments by psychologists suggests that the kind of praise matters a great deal — and that the most common kind may actually do harm.`,
    `In one study, children were given a set of fairly easy puzzles. Afterward, some were told, "You must be smart," while others were told, "You must have worked hard." The children were then offered a choice between a harder puzzle and an easier one. Most of those praised for their intelligence chose the easy task, whereas most of those praised for effort chose the challenge.`,
    `The researchers' explanation is that praising intelligence teaches children that ability is fixed. If you are "smart," failing at something difficult might show that you are not smart after all, so it is safer to avoid the risk. Praising effort, by contrast, teaches that ability can grow, which makes mistakes part of learning rather than a judgment on who you are.`,
  ], [['a great deal', '大いに'], ['after all', '結局'], ['by contrast', '対照的に'], ['A rather than B', 'BではなくA']], [
    q('r3-05-1', 1, 'inference', '第1段落で筆者が示唆していることはどれか。', [
      '最もよくあるほめ方が、かえって害になるかもしれない', 'ほめることは常に自信を高める', 'ほめ方の種類は関係ない', '子どもはほめないほうがよい'],
      '「ほめ方の種類はとても重要で、最もよくある種類はかえって害になるかもしれない」。',
      `the most common kind may actually do harm`, '最もよくある種類のほめ方は、実は害になるかもしれない',
      'ダッシュ（—）のあとに筆者の言いたいことが来る。'),
    q('r3-05-2', 2, 'detail', '実験の結果として正しいものはどれか。', [
      '頭のよさをほめられた子の多くは、簡単なパズルを選んだ', '努力をほめられた子の多くは、簡単なパズルを選んだ', 'どちらの子も難しいパズルを選んだ', 'ほめられた子はパズルを選ばなかった'],
      '「知能をほめられた子の多くは簡単な課題を、努力をほめられた子の多くは挑戦を選んだ」。',
      `Most of those praised for their intelligence chose the easy task`, '知能をほめられた子どもの多くは、簡単な課題を選んだ',
      'those praised for ~「〜でほめられた人たち」（過去分詞の後置修飾）。'),
    q('r3-05-3', 3, 'reason', '知能をほめられた子が難しい課題を避けた理由として、研究者が考えているものはどれか。', [
      '難しい課題で失敗すると、自分が頭がよくないと示されてしまうと考えるから', '難しい課題は時間がかかるから', '先生にしかられるのがこわいから', '簡単な課題のほうが楽しいから'],
      '能力が固定的だと学ぶと、「難しいことで失敗すれば、結局は頭がよくないと示すかもしれない」ので、危険を避ける。',
      `failing at something difficult might show that you are not smart after all`, '難しいことに失敗すると、結局は自分が頭がよくないことを示してしまうかもしれない',
      'failing at ~ が主語（動名詞）。after all「結局」。'),
    q('r3-05-4', 0, 'main', 'この文章の主旨として最も適切なものはどれか。', [
      '頭のよさより努力をほめると、子どもは失敗を学びの一部と考えて挑戦するようになる', '子どもは頭のよさをほめられるべきだ', 'パズルは子どもの知能を高める', 'ほめることは子どもの自信に無関係だ'],
      '努力をほめると「能力は伸びる」と学び、失敗が「自分への判定」ではなく「学びの一部」になる。',
      `which makes mistakes part of learning rather than a judgment on who you are`, 'それにより、まちがいは自分がどんな人間かへの判定ではなく、学びの一部になる',
      'make + O + C「OをCにする」。'),
  ]),

  p('r3-06', 3, 'When Silent Reading Was Strange', '黙読の歴史', [
    `Today, we take it for granted that reading is a silent activity. In libraries, on trains, and in classrooms, people read without making a sound. For much of history, however, this was not the case. In the ancient world, reading usually meant reading aloud, even when one was alone.`,
    `A famous passage written in the fourth century describes a bishop who read silently, moving his eyes over the page without speaking. The writer found the habit so remarkable that he tried to guess the reasons for it. This suggests that silent reading, though not unknown, was unusual enough to attract attention.`,
    `One reason for the change was the way texts were written. Early manuscripts often had no spaces between words and little punctuation, so reading them aloud helped readers work out where one word ended and the next began. As spaces and punctuation became standard, it became easier to read with the eyes alone.`,
  ], [['take it for granted that ~', '〜を当然と思う'], ['this was not the case', 'そうではなかった'], ['so ~ that ...', 'とても〜なので…'], ['work out ~', '〜を理解する・見分ける']], [
    q('r3-06-1', 1, 'detail', '第1段落の内容と合うものはどれか。', [
      '古代では、ひとりのときでも声に出して読むのがふつうだった', '古代の人は本を読まなかった', '昔から読書は黙ってするものだった', '図書館では声に出して読むのが決まりだ'],
      '「古代では、読むことはふつう、ひとりのときでさえ声に出して読むことを意味した」。',
      `In the ancient world, reading usually meant reading aloud, even when one was alone.`, '古代の世界では、読むことはふつう、ひとりのときでさえ、声に出して読むことを意味した',
      'take it for granted that ~：it は that 以下を指す形式目的語。'),
    q('r3-06-2', 2, 'inference', '4世紀の文章から推測できることはどれか。', [
      '黙読は知られてはいたが、注目されるほど珍しかった', '黙読は当時ありふれていた', '司教は字が読めなかった', '黙読は法律で禁止されていた'],
      '書き手がその習慣を驚くべきものと思い理由まで推測した。つまり「知られていなかったわけではないが、注目を集めるほど珍しかった」。',
      `silent reading, though not unknown, was unusual enough to attract attention`, '黙読は、知られていなかったわけではないが、注目を集めるほど珍しかった',
      'not unknown（二重否定）＝「知られていなくはない」。'),
    q('r3-06-3', 3, 'reason', '昔の写本を声に出して読んだ理由として本文が挙げているものはどれか。', [
      '単語の間に空白がなく、句読点も少なかったので、単語の区切りを見分けるため', '紙が高価だったから', '本の数が少なかったから', '目が悪い人が多かったから'],
      '「単語の間に空白がなく句読点もほとんどなかったので、声に出すと単語の区切りを見分けやすかった」。',
      `reading them aloud helped readers work out where one word ended and the next began`, '声に出して読むことで、読み手は1つの語がどこで終わり、次の語がどこで始まるかを見分けやすくなった',
      'help + 人 + 動詞の原形「人が〜するのに役立つ」。'),
  ]),

  p('r3-07', 3, 'The Wisdom of Crowds', '集団の知恵', [
    `In 1906, the scientist Francis Galton visited a country fair where about eight hundred people were trying to guess the weight of an ox. Most of them were not experts, and many of their guesses were far from correct. Yet when Galton calculated the average of all the guesses, it was within one percent of the true weight.`,
    `This phenomenon, known as the "wisdom of crowds," works because individual errors tend to cancel each other out. Some people guess too high and others too low, so the average comes close to the truth.`,
    `However, the effect has an important condition: people must make their judgments independently. If they can hear one another's opinions, they tend to be influenced by the first or loudest voices, and their errors begin to point in the same direction. A crowd, in other words, is wise only when its members think for themselves.`,
  ], [['far from ~', '〜からほど遠い'], ['within one percent of ~', '〜との差が1%以内'], ['cancel each other out', '互いに打ち消し合う'], ['think for oneself', '自分の頭で考える']], [
    q('r3-07-1', 1, 'detail', 'ガルトンが気づいたことはどれか。', [
      '全員の推測の平均が、実際の重さとほぼ同じだった', '専門家の推測がいちばん正確だった', 'ほとんどの人の推測が正確だった', '平均は実際の重さと大きくちがった'],
      '「全員の推測の平均を計算すると、本当の重さとの差が1%以内だった」。Yet（しかし）のあとが要点。',
      `it was within one percent of the true weight`, 'それは本当の重さとの差が1%以内だった',
      'Yet は But と同じく逆接。'),
    q('r3-07-2', 2, 'reason', '「集団の知恵」がはたらく理由はどれか。', [
      '一人ひとりの誤りが互いに打ち消し合うから', '集団の中に必ず専門家がいるから', '人は集団の中では慎重になるから', '平均をとると数が大きくなるから'],
      '「個人の誤りは互いに打ち消し合う傾向がある。高すぎる人も低すぎる人もいるので、平均は真実に近づく」。',
      `individual errors tend to cancel each other out`, '個々の誤りは互いに打ち消し合う傾向がある',
      'Some ~ and others ...「〜な人もいれば…な人もいる」。'),
    q('r3-07-3', 3, 'main', '集団が賢くなるための条件として筆者が述べていることはどれか。', [
      'メンバーが他人の意見に影響されず、それぞれ独立して判断すること', 'メンバー全員が専門家であること', '最初に発言した人の意見に従うこと', 'できるだけ大きな声で議論すること'],
      '「人々は独立して判断しなければならない」。他人の意見を聞くと誤りが同じ方向を向く。in other words でまとめている。',
      `A crowd, in other words, is wise only when its members think for themselves.`, '言いかえれば、集団が賢いのは、そのメンバーが自分の頭で考えるときだけだ',
      'only when ~「〜するときだけ」。'),
  ]),

  p('r3-08', 3, 'Robots and Jobs', 'ロボットと仕事', [
    `Whenever a new technology appears, people worry that machines will take away their jobs. Such fears are not new. In the early nineteenth century, a group of English textile workers known as the Luddites famously destroyed the machines that they believed threatened their livelihoods.`,
    `History shows that technology does eliminate certain jobs, but it also creates new ones that no one could have imagined before. Two hundred years ago, most people worked on farms; today, only a small percentage do, yet unemployment has not risen in proportion.`,
    `The concern today is that artificial intelligence may be different, because it can perform not only physical tasks but also mental ones, such as writing and analysis. Some economists believe that the transition will be smooth, as in the past. Others warn that even if new jobs eventually appear, the people who lose their jobs may not be the ones who are able to take the new ones.`,
  ], [['take away ~', '〜を奪う'], ['does + 動詞', '確かに〜する（強調）'], ['in proportion', 'それに比例して'], ['not only A but also B', 'AだけでなくBも']], [
    q('r3-08-1', 1, 'detail', 'ラッダイトについて本文で述べられていることはどれか。', [
      '生活をおびやかすと考えた機械を壊した', '新しい機械を発明した', '農場で働いていた', '機械の導入に賛成した'],
      '「自分たちの生計をおびやかすと信じた機械を壊した」。',
      `destroyed the machines that they believed threatened their livelihoods`, '自分たちの生計をおびやかすと信じた機械を壊した',
      'that they believed threatened ~：関係代名詞の中に they believed が挟まった形（連鎖関係詞）。'),
    q('r3-08-2', 2, 'detail', '歴史が示していることとして正しいものはどれか。', [
      '技術は仕事をなくすが、想像もできなかった新しい仕事も生む', '技術は仕事を減らすだけだ', '農業で働く人は今も多数派だ', '技術が進むと失業が必ず増える'],
      'does eliminate の does は強調「確かになくす」。しかし同時に新しい仕事も生み出す。',
      `it also creates new ones that no one could have imagined before`, 'それはまた、以前は誰も想像できなかった新しい仕事も生み出す',
      'could have imagined：仮定法過去完了に近い「想像できただろう」。'),
    q('r3-08-3', 3, 'inference', '一部の経済学者が警告していることはどれか。', [
      '新しい仕事が生まれても、仕事を失った人がそれに就けるとは限らない', 'AIは仕事を一つも生まない', '移行は過去と同じく円滑に進む', 'AIは体を使う仕事しかできない'],
      '「新しい仕事がやがて現れても、仕事を失う人と新しい仕事に就ける人は同じではないかもしれない」。',
      `the people who lose their jobs may not be the ones who are able to take the new ones`, '仕事を失う人々が、新しい仕事に就ける人々であるとは限らない',
      'even if ~「たとえ〜でも」。Some ... Others ... で意見を対比。'),
  ]),

  p('r3-09', 3, 'Why We Procrastinate', '先のばしの心理', [
    `Almost everyone has put off an important task until the last minute. We often describe this as a problem of laziness or poor time management. Psychologists, however, increasingly see procrastination as a problem of managing emotions rather than time.`,
    `When a task makes us feel anxious, bored, or insecure, avoiding it brings immediate relief. Checking messages or tidying the desk feels better, at least for a moment. The trouble is that the relief does not last, and the task remains — usually accompanied by guilt.`,
    `If this view is correct, simply making a detailed schedule may not help much. A more effective approach may be to make the task less unpleasant, for example by breaking it into small steps or by being kind to oneself after failing. Interestingly, people who forgive themselves for procrastinating once tend to procrastinate less the next time.`,
  ], [['put off ~', '〜を先のばしにする'], ['A rather than B', 'BではなくA'], ['at least', '少なくとも'], ['break ~ into ...', '〜を…に分ける']], [
    q('r3-09-1', 1, 'paraphrase', '心理学者は先のばしをどのような問題と見ているか。', [
      '時間ではなく感情をうまく扱えない問題', '怠けぐせの問題', '時間の使い方が下手な問題', '記憶力の問題'],
      '「時間ではなく感情を管理する問題」。rather than の前後に注意。',
      `procrastination as a problem of managing emotions rather than time`, '先のばしを、時間ではなく感情を管理する問題として',
      'see A as B「AをBとみなす」。'),
    q('r3-09-2', 2, 'detail', '課題を避けたときに起こることとして正しいものはどれか。', [
      'すぐに気が楽になるが長続きせず、課題と罪悪感が残る', 'ずっと気が楽なままである', '課題が自然に終わる', 'すぐにやる気が出る'],
      '「安心はすぐ得られるが長続きせず、課題はたいてい罪悪感をともなって残る」。',
      `the relief does not last, and the task remains — usually accompanied by guilt`, 'その安心は続かず、課題はたいてい罪悪感をともなって残る',
      'The trouble is that ~「困ったことに〜」。'),
    q('r3-09-3', 3, 'main', '筆者が勧める方法として、本文に合うものはどれか。', [
      '課題を小さく分けたり、失敗した自分を許したりして、課題をいやでなくする', 'くわしい予定表を作る', '先のばしした自分をきびしく責める', '課題を一度に全部終わらせる'],
      '「課題をいやでなくすること。たとえば小さな段階に分ける、失敗後に自分にやさしくする」。自分を許す人は次に先のばししにくい。',
      `A more effective approach may be to make the task less unpleasant`, 'より効果的な方法は、課題をあまりいやなものでなくすることかもしれない',
      'If this view is correct「この見方が正しいなら」→ 時間管理の解決策は効きにくい。'),
  ]),

  p('r3-10', 3, 'Endangered Languages', '消えゆく言語', [
    `Of the roughly seven thousand languages spoken in the world today, about forty percent are in danger of disappearing. Many have fewer than a thousand speakers, most of whom are elderly. Linguists estimate that, on average, one language falls silent every few weeks.`,
    `When a language dies, more is lost than a set of words and grammar rules. Each language contains knowledge built up over generations: names for local plants and their uses, ways of describing the landscape, songs, and stories. Some of this knowledge exists nowhere else.`,
    `Fortunately, the situation is not hopeless. Hawaiian, for example, had only a few hundred young speakers in the 1980s. Thanks to schools that teach entirely in the language, thousands of children now speak it. The example shows that a language can be revived, provided that a community decides it is worth saving.`,
  ], [['be in danger of ~ing', '〜する危険がある'], ['most of whom', 'そのほとんどが'], ['build up ~', '〜を積み上げる'], ['provided that ~', '〜という条件で']], [
    q('r3-10-1', 1, 'detail', '第1段落の内容と合うものはどれか。', [
      '世界の言語の約4割が消滅の危機にある', '世界には約700の言語がある', '危機にある言語の話者は若者が多い', '言語は毎年1つずつ消えている'],
      '「約7000の言語のうち、約40%が消える危険にある」。',
      `about forty percent are in danger of disappearing`, '約40%が消滅の危機にある',
      ', most of whom are elderly「そのほとんどが高齢者だ」（関係代名詞の非制限用法）。'),
    q('r3-10-2', 2, 'detail', '言語が消えると失われるものとして、筆者が述べているものはどれか。', [
      '何世代にもわたって積み上げられた知識', '国の領土', '学校の数', '新しい言葉を作る力'],
      '「各言語には何世代にもわたって築かれた知識が含まれている」。単語や文法以上のものが失われる。',
      `Each language contains knowledge built up over generations`, 'それぞれの言語には、何世代にもわたって積み上げられた知識が含まれている',
      'more is lost than ~「〜以上のものが失われる」。'),
    q('r3-10-3', 3, 'main', 'ハワイ語の例が示していることはどれか。', [
      '地域社会が守る価値があると決めれば、言語は復活させられる', '一度消えかけた言語はもどらない', 'ハワイ語は話す人が減り続けている', '学校で言語を教えるのは効果がない'],
      '「共同体が救う価値があると決めるという条件で、言語は復活しうる」。provided that は条件。',
      `a language can be revived, provided that a community decides it is worth saving`, '共同体が救う価値があると決めさえすれば、言語は復活させることができる',
      'provided that ~ = if ~（条件）。be worth ~ing「〜する価値がある」。'),
  ]),

  p('r3-11', 3, 'The Value of Doing Nothing', '何もしない時間', [
    `In modern society, being busy is often treated as a sign of importance. People proudly complain about how little free time they have, and empty moments are quickly filled with work or entertainment. It is as if doing nothing were a waste of time.`,
    `Research on the brain, however, suggests otherwise. When we are not focused on any particular task, a network of brain regions becomes more active. This network seems to be involved in reflecting on our experiences, imagining the future, and understanding other people.`,
    `In other words, the mind is far from idle when we are "doing nothing." It may be during these quiet moments that we make sense of what has happened to us and come up with new ideas. If so, a schedule with no gaps may cost us more than we realize.`,
  ], [['as if ~ were ...', 'まるで〜であるかのように'], ['suggests otherwise', 'そうではないことを示す'], ['far from ~', '決して〜ではない'], ['make sense of ~', '〜を理解する']], [
    q('r3-11-1', 1, 'paraphrase', '"It is as if doing nothing were a waste of time." が表していることはどれか。', [
      '現代社会では、何もしないことが時間のむだであるかのように扱われている', '何もしないことは本当に時間のむだだ', '人々は何もしない時間を大切にしている', '忙しい人は時間をむだにしている'],
      'as if + 仮定法過去「まるで〜であるかのように」。筆者はそれが正しいとは考えていない。',
      `It is as if doing nothing were a waste of time.`, 'それはまるで、何もしないことが時間のむだであるかのようだ',
      'as if + 過去形（were）：事実とちがう「まるで〜のよう」。'),
    q('r3-11-2', 2, 'detail', '特定の作業に集中していないときの脳について正しいものはどれか。', [
      'ある脳の領域のネットワークがより活発になる', '脳の活動はほとんど止まる', '脳は眠っているのと同じ状態になる', '記憶が消えていく'],
      '「特定の作業に集中していないとき、脳の領域のネットワークがより活発になる」。',
      `a network of brain regions becomes more active`, '脳の領域のネットワークがより活発になる',
      'suggests otherwise「そうではないことを示す」＝前の段落への反論。'),
    q('r3-11-3', 3, 'main', '筆者の主張として最も適切なものはどれか。', [
      'すき間のない予定は、思っている以上に私たちから大切なものを奪っているかもしれない', '何もしない時間はできるだけ減らすべきだ', '忙しいことは大切さの証拠だ', '新しいアイデアは仕事中にしか生まれない'],
      '静かな時間に経験を理解し新しい考えを思いつくのかもしれない。だから「すき間のない予定は思っている以上の代償になる」。',
      `a schedule with no gaps may cost us more than we realize`, 'すき間のない予定は、私たちが思っている以上の代償を払わせているかもしれない',
      'It may be during ~ that ...：強調構文「…するのは〜の間なのかもしれない」。'),
  ]),

  p('r3-12', 3, 'Urban Trees', '街路樹の価値', [
    `City trees are often seen simply as decoration, something that makes streets look nicer. In recent years, however, researchers have begun to measure their benefits more carefully, and the results suggest that trees are far more valuable than their appearance alone would indicate.`,
    `On hot summer days, streets lined with trees can be several degrees cooler than streets without them, because leaves provide shade and release moisture into the air. Trees also absorb rainwater, reducing the risk of flooding, and filter some of the pollution from traffic.`,
    `There are effects on people, too. Studies have found that hospital patients with a view of trees recover slightly faster than those facing a brick wall. Considering such benefits, cutting down old trees to save on maintenance costs may turn out to be a false economy.`,
  ], [['far more ~ than ...', '…よりはるかに〜'], ['lined with ~', '〜が並んでいる'], ['considering ~', '〜を考えると'], ['false economy', '見せかけの節約']], [
    q('r3-12-1', 1, 'detail', '研究が示していることとして、第1段落の内容に合うものはどれか。', [
      '街路樹は見た目から想像される以上に価値がある', '街路樹は飾りにすぎない', '街路樹の価値は測れない', '街路樹は街を暗くする'],
      '「木は見た目だけから想像されるよりもはるかに価値がある」。',
      `trees are far more valuable than their appearance alone would indicate`, '木は、その見た目だけから想像されるよりも、はるかに価値がある',
      'than ~ would indicate「〜が示すであろうよりも」。'),
    q('r3-12-2', 2, 'not', '街路樹のはたらきとして、第2段落で述べられていないものはどれか。', [
      '騒音を完全になくす', '日かげを作り、通りを涼しくする', '雨水を吸収して洪水の危険を減らす', '交通による汚染の一部をとりのぞく'],
      '「騒音」はどこにもない。残りの3つは第2段落にある。',
      `Trees also absorb rainwater, reducing the risk of flooding, and filter some of the pollution from traffic.`, '木はまた雨水を吸収して洪水の危険を減らし、交通による汚染の一部をろ過する',
      ', reducing ~ は分詞構文「そして〜を減らす」。'),
    q('r3-12-3', 3, 'paraphrase', '"a false economy" の意味として、この文脈で最も適切なものはどれか。', [
      '節約したつもりで、かえって損をすること', '本当の節約になること', '経済が成長すること', 'お金をむだに使わないこと'],
      '管理費を節約するために古い木を切っても、涼しさ・洪水対策・健康などの利益を失う。つまり「見せかけの節約」。',
      `cutting down old trees to save on maintenance costs may turn out to be a false economy`, '維持費を節約するために古い木を切ることは、見せかけの節約だと分かるかもしれない',
      'Considering ~「〜を考慮すると」。turn out to be ~「〜だと分かる」。'),
  ]),
];
