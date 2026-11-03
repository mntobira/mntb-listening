# -*- coding: utf-8 -*-
# 第3回 Ⅰ 長文読解（地域の共有冷蔵庫）。{u|…} 設問で問う語句。設問は a3_1q.py
from a3_1q import QUESTIONS, VOCAB
P = {
 'kind': 'reading',
 'title': '長文読解',
 'intro': 'Study the article and respond to each question by choosing one of the four options. Write the letter of the option you choose.',
 'headline': 'A Fridge on the Corner',
 'paras': [
  "Outside a laundrette on a busy street in the town of Ashcombe stands an ordinary white refrigerator. It is not plugged in to sell drinks, and nobody guards it. A handwritten sign on the door explains the rules: anyone can leave food in it, and anyone can take food from it. Nobody has to give a name, fill in a form or explain why.",
  "The fridge was the idea of Priya Lowden, a nurse who often worked night shifts at the local hospital. Walking home at dawn, she noticed bakery staff putting unsold bread into bins, while a few streets away people queued outside a charity for free meals. “It seemed absurd,” she says. “The food and the people who needed it were only ten minutes apart, but nothing connected them.”",
  "Lowden borrowed the idea from similar projects she had read about in other countries, where they are often called community fridges. She persuaded the owner of the laundrette to provide electricity, found a second-hand fridge online and asked a few friends to help keep it clean. On the first day, she filled it herself with fruit, yoghurt and sandwiches. By the next morning, it was empty.",
  "Within a few months, the fridge had become part of daily life on the street. A greengrocer drops off vegetables that are slightly bruised but perfectly edible. Office workers leave the extra sandwiches from lunchtime meetings. Families who have bought too much before going on holiday bring what would otherwise go off while they are away. On a typical day, volunteers estimate that around forty people take something.",
  "Running the fridge requires more organisation than its simple appearance suggests. Volunteers check it twice a day, remove anything past its use-by date and wipe the shelves. They also keep a list of items the fridge does not take, such as raw meat, home-cooked dishes and opened packets, because these carry a higher risk of making people ill. Lowden says the rules are strict {u|for good reason}. “One case of food poisoning could close the whole project,” she explains.",
  "Who uses the fridge? The answer surprised the volunteers. They had expected mainly people with very low incomes, and many users do fall into that group. But others are students in the last days of the month, pensioners* who are careful with money, and workers who simply dislike seeing food wasted. Because nobody has to prove that they are poor, Lowden believes, people who would never visit a charity feel comfortable opening the door.",
  "That lack of checks is also what worries some critics. A local councillor* has asked whether a few people might take far more than their share, perhaps to sell it. Others argue that a fridge on the corner, however kind, cannot replace proper support for families who regularly cannot afford food. If the town relies on volunteers to {u|fill the gap}, they say, the deeper causes of the problem may be ignored.",
  "Lowden does not dismiss these points. She agrees that the fridge cannot cure poverty, and she says that the volunteers have seen very little evidence of people taking food to sell. When someone takes a large amount, she says, it is usually because they are collecting for neighbours or relatives who cannot leave their homes. “We decided early on to trust people,” she says. “If we start treating everyone as a suspect, we lose the thing that makes this work.”",
  "The project has had effects beyond the food itself. Several businesses that donate regularly say they now think more carefully about how much they order. The bakery that once threw away bread now sends its leftovers to the fridge every evening and has reduced its daily baking slightly. Some users have become volunteers themselves, and a small group meets each month to discuss how the project could be improved.",
  "Ashcombe now has three fridges, and the council has offered a small grant to cover electricity and cleaning materials. Lowden welcomes the support but hopes the fridges will remain a community effort rather than a council service. “What matters,” she says, “is that people see food as something to share, not something to throw away.”",
 ],
 'notes': [('pensioners', '年金生活者'), ('councillor', '（地方議会の）議員')],
 'translation': [
  'アッシュコムの町のにぎやかな通りにあるコインランドリーの外に，ごくふつうの白い冷蔵庫が置かれている。飲み物を売るために電源が入っているのではなく，誰も見張っていない。扉に貼られた手書きの紙が決まりを説明している。誰でも食べ物を入れてよく，誰でも食べ物を持っていってよい。誰も名前を書いたり，用紙に記入したり，理由を説明したりしなくてよい。',
  'この冷蔵庫は，地元の病院でよく夜勤をしていた看護師，プリヤ・ローデンの発案だった。明け方に歩いて帰る途中，彼女はパン屋の店員が売れ残ったパンをごみ箱に入れる一方で，数本先の通りでは人々が慈善団体の前で無料の食事を求めて並んでいることに気づいた。「ばかげていると思いました」と彼女は言う。「食べ物とそれを必要とする人々はたった10分しか離れていないのに，それをつなぐものが何もなかったのです」',
  'ローデンは，ほかの国で行われている同じような取り組みについて読んだことがあり，その考えを取り入れた。それらはしばしば地域冷蔵庫と呼ばれている。彼女はコインランドリーの店主を説得して電気を提供してもらい，インターネットで中古の冷蔵庫を見つけ，友人数人に掃除を手伝ってくれるよう頼んだ。初日，彼女は自分で果物やヨーグルト，サンドイッチを冷蔵庫に詰めた。翌朝までに，冷蔵庫は空になっていた。',
  '数か月のうちに，冷蔵庫は通りの日常生活の一部になった。八百屋は，少し傷んではいるが十分に食べられる野菜を置いていく。会社員は昼の会議で余ったサンドイッチを入れていく。休暇に出かける前に買いすぎた家族は，留守の間に悪くなってしまうものを持ってくる。ボランティアの見積もりでは，ふつうの日でおよそ40人が何かを持っていく。',
  '冷蔵庫の運営には，その簡単な見た目から想像されるより多くの段取りが必要である。ボランティアは1日2回冷蔵庫を点検し，消費期限の過ぎたものを取り除き，棚を拭く。また，生肉や家庭で調理した料理，開封済みの袋などは人の具合を悪くする危険が高いので，冷蔵庫に入れられない品物の一覧も作っている。ローデンは，決まりが厳しいのにはもっともな理由があると言う。「食中毒が1件でも起きれば，事業全体がなくなりかねません」と彼女は説明する。',
  '誰が冷蔵庫を使っているのだろうか。その答えはボランティアを驚かせた。彼らは主にとても収入の低い人々を予想しており，実際に多くの利用者はそうした人々である。しかしほかにも，月の終わりの数日の学生や，お金に気をつけている年金生活者，食べ物が無駄になるのを見るのがただ嫌な勤め人もいる。誰も自分が貧しいことを証明しなくてよいので，慈善団体には決して行かないような人々でも気軽に扉を開けられるのだとローデンは考えている。',
  'その確認のなさこそが，一部の批判する人々を心配させている点でもある。ある地元の議員は，自分の分をはるかに超えて持っていく人がいるのではないか，ひょっとすると売るためではないかと問いかけた。また，角にある冷蔵庫は，どれほど親切なものであっても，食べ物を買えないことがよくある家庭への適切な支援の代わりにはなりえないと主張する人もいる。町がその穴を埋めるのをボランティアに頼れば，問題のより根本的な原因が無視されかねない，と彼らは言う。',
  'ローデンはこうした指摘を退けはしない。冷蔵庫で貧困をなくすことはできないことには同意しているし，ボランティアは売るために食べ物を持っていく人の証拠をほとんど見ていないとも言う。大量に持っていく人がいるときは，たいてい家から出られない近所の人や親戚の分を集めているからだと彼女は言う。「私たちは早い段階で，人を信じることに決めました」と彼女は言う。「全員を容疑者のように扱い始めたら，この取り組みをうまくいかせているものを失ってしまいます」',
  'この取り組みは，食べ物そのものを超えた効果をもたらしている。定期的に寄付をしているいくつかの店は，今では注文する量をもっと慎重に考えるようになったと言う。かつてパンを捨てていたパン屋は，今では毎晩売れ残りを冷蔵庫に送っており，毎日焼く量をわずかに減らした。利用者の中には自らボランティアになった人もいて，小さなグループが毎月集まって，取り組みをどう改善できるかを話し合っている。',
  'アッシュコムには今では冷蔵庫が三つあり，議会は電気代と清掃用品をまかなうための少額の補助金を申し出た。ローデンは支援を歓迎しているが，冷蔵庫が議会のサービスではなく地域の取り組みであり続けることを望んでいる。「大切なのは，人々が食べ物を捨てるものではなく分け合うものだと考えることです」と彼女は言う。',
 ],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
