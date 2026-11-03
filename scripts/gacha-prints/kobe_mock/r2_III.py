# -*- coding: utf-8 -*-
# 第2回 大問III（小説：祖母の家を片づける姉妹）
PART = {'roman': 'III',
 'points': 30,
 'intro': '次の文章は，ある物語の一節である。語り手の Hazel と姉の Ruth は，亡くなった祖母が暮らしていた家を片づけに来ている。これを読んで，問1〜4に答えなさい。',
 'passage': ['The house smelled the way it always had, of floor polish and old paper, but the silence was '
             'new. Grandma had lived here for fifty-one years, and in three weeks it would belong to a young '
             'couple from the city who planned to knock down the kitchen wall. My sister Ruth had driven up '
             'from London that morning with a car full of empty boxes and a typed list.',
             '“Kitchen first,” she said, pinning the list to the fridge with a magnet shaped like a lemon. '
             '“Then the bedrooms. The attic on Sunday.”',
             '“Good morning to you too,” I said.',
             'She sighed. “( A ). I’ve been on the road since six.”',
             'We worked without talking for an hour. Ruth wrapped plates in newspaper with quick, exact '
             'movements, {wa|the way she did everything}. I kept stopping. Even the linoleum* by the sink '
             'had been worn into a pale path where she had stood for half a century. Every drawer held '
             'something: a ball of string, half a packet of birthday candles, a recipe card written in '
             'Grandma’s round, careful hand.',
             '“Hazel, we’ll never finish if you read everything.”',
             '“It’s her shortbread*. Look, she’s crossed out ‘two eggs’ and written ‘one.’”',
             '“( B ).” Ruth held out a black bin bag.',
             'I put the card in my pocket instead.',
             'Near lunchtime I found the tin. It was at the back of the top cupboard, behind a stack of cake '
             'trays nobody had used in years, and it was heavier than it looked. Inside were dozens of '
             'brittle, yellowed envelopes, all addressed to Grandma in the same narrow handwriting and tied '
             'in bundles with frayed kitchen string.',
             '“Ruth.”',
             'She looked over my shoulder and went still. “Those are from Grandpa,” she said. “From when he '
             'worked on the ships.”',
             '“How do you know?”',
             '“She showed me once. I was about ten. I’d broken her blue vase, and I was crying, and she sat '
             'me down at this table and read me one to cheer me up.” Ruth took a bundle and turned it over '
             'in her hands. “( C ) until now.”',
             '“You never told me.”',
             '“{u1|I didn’t think you’d care about that.}” {wb|She said it lightly, but she did not look at '
             'me.}',
             '“Of course I care. Why would you think I wouldn’t?”',
             '“Because you left.” She put the bundle back in the tin. “You went to Canada, Hazel. For six '
             'years. I was the one who drove up every other weekend. I sorted out her pills and her bills '
             'and the man who came about the roof.”',
             '“I phoned her every Sunday.”',
             '“I know you did. But ( D ) as being here.”',
             'I wanted to argue, to explain about the job and the flights and how every visit had felt too '
             'short to be worth the cost. Instead I looked at the envelopes. Grandma had kept every single '
             'one, for sixty years, through three house moves and a flood that had ruined half the '
             'furniture. She had not thrown away a word.',
             '“I should have come home more,” I said.',
             'For a long moment Ruth said nothing. Outside, a neighbor was mowing a lawn, and the sound rose '
             'and fell like breathing. Then she stood up, brushed the dust from her knees, took the list off '
             'the fridge, folded it in half, and put it in the drawer with the string and the candles. She '
             'sat down again and pushed the tin slowly across the table toward me.',
             '“( E ),” she said. “Read me one. {u2|The attic can wait}.”'],
 'notes': [('linoleum', 'リノリウム（床材の一種）'), ('shortbread', 'ショートブレッド（バターを多く使った焼き菓子）'), ('bin bag', 'ごみ袋')],
 'questions': [{'no': 1,
                'points': 10,
                'kind': 'dialog_blanks',
                'stem': '空所( A )〜( E )を補うのに最もふさわしい発言を，選択肢(あ)〜(お)からそれぞれ一つ選び，記号で答えなさい。各選択肢は一回ずつ用いること。',
                'choices': ['I’d forgotten all about it',
                            'Phoning isn’t the same thing',
                            'Photograph it if you want',
                            'Sorry, I’m just tired',
                            'You keep them'],
                'answer': {'A': 3, 'B': 2, 'C': 0, 'D': 1, 'E': 4},
                'why': {'A': '“Good morning to you '
                             'too”（あいさつもなしか，という皮肉）に対して，ため息をついて「ごめん，疲れているだけ。6時から運転してきたの」と謝る(え)。',
                        'B': '祖母のレシピのカードを読みふける妹に，「写真を撮りたいなら撮れば」と言ってごみ袋を差し出す(う)。it はレシピのカード（単数）。Hazel '
                             'は捨てずにポケットに入れる。',
                        'C': '“( C ) until now.”：「今まですっかり忘れていた」。10歳のときの思い出を語った直後で，until now と結びつくのは(あ)だけ。',
                        'D': '“But ( D ) as being here.”：「でも電話するのは，ここにいるのと同じではない」。the same thing as … '
                             'の形になるのは(い)だけ。直前の “I phoned her every Sunday.” に対する反論。',
                        'E': '缶（中の手紙）を妹の方へ押しやって「あなたが持っていて」。them は手紙（複数）を指す(お)。'},
                'check': '一意性の確認：( C )は直後の until now，( D )は直後の as being here と文法的につながる選択肢がそれぞれ(あ)(い)しかない。( B '
                         ')の it は単数のレシピのカード，( E )の them は複数の手紙を受けるので，(う)は( B )，(お)は( E )に決まる。残る(え)は( A '
                         ')に入り，ため息と「6時から運転している」という理由とも合う。'},
               {'no': 2,
                'points': 7,
                'kind': 'trans_ref',
                'stem': '下線部(1)を，that が指す内容を具体的に示して和訳しなさい。',
                'answer': '祖母が祖父からの手紙を読んで（泣いていた）私を慰めてくれたことなんて，あなたは気にしないと思っていた。',
                'alts': ['おばあちゃんがおじいちゃんの手紙を読み聞かせて私を元気づけてくれた話に，あなたが関心を持つとは思わなかった。'],
                'criteria': [('that＝祖母が祖父からの手紙を読んで（Ruth を）慰めてくれたこと', 4),
                             ('care about …：「〜を気にかける・〜に関心を持つ」', 2),
                             ('I didn’t think you’d …：「あなたが〜するとは思わなかった」（時制の一致の処理）', 1)],
                'explain': ['that は直前で Ruth が語った出来事，“she sat me down at this table and read me one to cheer '
                            'me up” を指す。one は one of the letters（祖父からの手紙）。',
                            'you’d＝you would（時制の一致）。I didn’t think you’d care は「あなたが気にかけるとは思わなかった」。',
                            '“You never told me.”（話してくれなかったね）への返答で，「話さなかったのはあなたが関心を持たないと思ったから」という Ruth '
                            'の気持ちが表れている。']},
               {'no': 3,
                'points': 6,
                'kind': 'wavy',
                'stem': '波線部(a)・(b)の意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'the way she did everything',
                           'choices': ['Ruth wrapped everything in the house in newspaper.',
                                       'Ruth did everything quickly and precisely.',
                                       'Ruth always did whatever Hazel told her to do.',
                                       'Ruth did everything more slowly than Hazel.'],
                           'answer': 1,
                           'why': '“with quick, exact movements, the way she did '
                                  'everything”：素早く正確な動きで，彼女が何でもそうするように。the way＝「〜するやり方で」。(あ)は everything '
                                  'を「家の中の全部」と読み違えた誤り。(う)は本文にない。(え)は手を止めてばかりいる Hazel の方が遅いので逆。'},
                          {'label': 'b',
                           'word': 'She said it lightly, but she did not look at me.',
                           'choices': ['She was too busy sorting the letters to look up at all.',
                                       'She was joking and did not mean what she said.',
                                       'She tried to sound casual, but she was actually hurt.',
                                       'She was so angry that she could not keep her voice down.'],
                           'answer': 2,
                           'why': '軽い口調で言いながら目を合わせない＝平気なふりをしているが，実は傷ついている。直後に “Because you left.” '
                                  'と本心を語ることから裏づけられる。(い)は lightly の字面による誤答で，続く本心の告白と矛盾。(あ)は根拠なし。(え)は lightly '
                                  'と逆。'}]},
               {'no': 4,
                'points': 7,
                'kind': 'ja_free',
                'stem': '下線部(2)で Ruth が伝えようとしていることは何か。文字どおりの意味と，その裏にある意味を明らかにして，日本語で説明しなさい。',
                'answer': '文字どおりには屋根裏部屋の片づけは後回しでよいという意味だが，裏には，予定表どおりに急いで片づけるよりも，妹と一緒に祖母や祖父の思い出に向き合い，わだかまりをほどく時間を優先したいという気持ちがある。',
                'alts': ['屋根裏の作業は急がなくてよいと言うことで，効率よく片づけるのをやめて，妹と祖父母の手紙を読み，気持ちを分かち合おうとしている。'],
                'criteria': [('文字どおりの意味：屋根裏の片づけは後でよい（急がなくてよい）', 2),
                             ('予定表（リスト）どおりに急いで片づけるのをやめる', 2),
                             ('妹と一緒に祖父母の思い出（手紙）に向き合う・わだかまりをほどくことを優先する', 3)],
                'explain': ['Ruth は朝，「台所，寝室，日曜は屋根裏」と予定表を冷蔵庫に貼り，妹が手を止めるたびに急がせていた。',
                            'その予定表を外して引き出しにしまい，手紙の缶を妹に渡して “Read me one.” '
                            'と言う。予定表をしまう行動と合わせて，「効率より，今ここで妹と思い出を分かち合う方が大事だ」という気持ちの変化を読み取る。',
                            '直前の Hazel の “I should have come home more.” を受けて，姉妹のわだかまりがほどけ始める場面でもある。']}],
 'translation': ['家はいつもと同じように床磨きの蝋と古い紙のにおいがしたが，静けさは初めてのものだった。祖母はここに51年間暮らしていたが，3週間後には，台所の壁を取り壊すつもりの都会から来た若い夫婦のものになる。姉のルースは，空の箱と，打ち込んだ予定表を車いっぱいに積んで，その朝ロンドンから車でやって来たのだった。',
                 '「まず台所」と，レモンの形をした磁石で予定表を冷蔵庫に留めながら彼女は言った。「それから寝室。屋根裏は日曜日」',
                 '「どうも，おはよう」と私は言った。',
                 '彼女はため息をついた。「（A：ごめん，疲れているだけ）。6時から運転しっぱなしなの」',
                 '私たちは1時間ほど口をきかずに作業した。ルースは，(a)彼女が何でもそうするように，素早く正確な動きで皿を新聞紙に包んでいった。私は手を止めてばかりいた。流しのそばのリノリウムの床でさえ，祖母が半世紀立ち続けた場所が白っぽい道のようにすり減っていた。どの引き出しにも何かが入っていた。ひもの玉，使いかけの誕生日用ろうそく，祖母の丸く丁寧な字で書かれたレシピのカード。',
                 '「ヘイゼル，全部読んでいたら終わらないよ」',
                 '「おばあちゃんのショートブレッドだよ。見て，『卵2個』を消して『1個』って書いてある」',
                 '「（B：写真を撮りたいなら撮れば）」ルースは黒いごみ袋を差し出した。',
                 '私は代わりにそのカードをポケットに入れた。',
                 '昼近くに，私はその缶を見つけた。それは戸棚の一番上の奥，何年も誰も使っていないケーキ型の山の後ろにあり，見た目より重かった。中には何十通もの，もろく黄ばんだ封筒が入っていて，どれも同じ細い筆跡で祖母に宛てられ，ほつれた台所用のひもで束ねてあった。',
                 '「ルース」',
                 '彼女は私の肩越しにのぞき込み，動きを止めた。「おじいちゃんからの手紙よ」と彼女は言った。「船で働いていたころの」',
                 '「どうして知ってるの？」',
                 '「一度見せてもらったの。10歳くらいのとき。おばあちゃんの青い花瓶を割って泣いていたら，おばあちゃんがこのテーブルに私を座らせて，元気づけようと1通読んでくれたの」ルースは束を一つ手に取り，手の中でひっくり返した。「今まで（C：すっかり忘れていた）」',
                 '「そんなこと，話してくれなかったね」',
                 '「⑴あなたがそんなことを気にするとは思わなかった」(b)彼女はそれを軽い口調で言ったが，私の方を見なかった。',
                 '「気にするに決まってるよ。どうして気にしないなんて思うの？」',
                 '「あなたが出て行ったから」彼女は束を缶に戻した。「カナダに行ったでしょ，ヘイゼル。6年間も。1週おきに車で来ていたのは私。おばあちゃんの薬も請求書も，屋根のことで来た業者の相手も，全部私がやったの」',
                 '「毎週日曜日には電話していたよ」',
                 '「知ってる。でも，（D：電話するのは）ここにいるのと同じじゃない」',
                 '私は言い返したかった。仕事のことや飛行機のこと，どの帰省も短すぎて費用に見合わないと感じていたことを説明したかった。その代わりに，私は封筒を見つめた。祖母は60年間，3回の引っ越しと家具の半分をだめにした洪水を経ても，1通残らず取っておいたのだ。祖母は一言も捨てていなかった。',
                 '「もっと帰ってくればよかった」と私は言った。',
                 'ルースは長い間黙っていた。外では近所の人が芝を刈っていて，その音が呼吸のように高くなったり低くなったりした。それから彼女は立ち上がり，ひざのほこりを払い，冷蔵庫から予定表を外し，半分に折って，ひもやろうそくの入った引き出しにしまった。彼女はまた座り，缶をテーブルの上でゆっくりと私の方へ押しやった。',
                 '「（E：あなたが持っていて）」と彼女は言った。「1通読んで聞かせて。⑵屋根裏は後でいいから」'],
 'vocab': [('floor polish', '床磨き剤（蝋）'),
           ('knock down', '〜を取り壊す'),
           ('pin A to B', 'AをBに留める'),
           ('Good morning to you too.', '（皮肉で）どうも，おはよう'),
           ('on the road', '（車で）移動中で'),
           ('the way S V', 'SがVするやり方で'),
           ('cross out', '〜を線で消す'),
           ('go still', '動きを止める'),
           ('cheer … up', '〜を元気づける'),
           ('care about …', '〜を気にかける'),
           ('lightly', '軽い調子で'),
           ('sort out', '〜を処理する，片づける'),
           ('every other weekend', '1週おきの週末に'),
           ('ruin', '〜をだめにする'),
           ('brittle', 'もろい'),
           ('frayed', 'ほつれた'),
           ('be worn into …', 'すり減って〜になる'),
           ('mow', '（芝）を刈る'),
           ('can wait', '後回しにできる')]}
