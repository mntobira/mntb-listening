# -*- coding: utf-8 -*-
# 第3回 大問III（小説：退職する部活の顧問と部長）
PART = {'roman': 'III',
 'points': 30,
 'intro': '次の文章は，ある物語の一節である。語り手の Maya は高校の陸上部の部長で，長年部を指導してきた Mr. Okafor '
          'が今年度で退職することを知ったところである。これを読んで，問1〜4に答えなさい。',
 'passage': ['The track was empty by the time I found him. Mr. Okafor was sitting on the bottom row of the '
             'stands* with a clipboard on his knees, the way he had sat after every practice for the three '
             'years I had known him. His old whistle still hung from a cord around his neck, although '
             'practice had ended an hour before. The evening light made the red lanes look almost purple.',
             '“You heard,” he said, without looking up.',
             '“Everybody heard. Ms. Duarte announced it in assembly.” I sat down two rows above him. “You '
             'could have told us first.”',
             '“( A ).” He tapped his pen against the board. “I was going to tell the team on Friday. Then '
             'the principal decided it should be official.”',
             '“Thirty-two years,” I said. “That’s what she said. Thirty-two years.”',
             '“Thirty-three, actually. She can never get it right.”',
             'For a while we watched a groundskeeper drag a hose across the long-jump pit*. Somewhere behind '
             'the gym a car alarm went off and stopped. Neither of us mentioned it. It felt easier to watch '
             'the water than to look at each other.',
             '“Who’s going to coach us?” I asked.',
             '“They’ll find someone. Probably someone young, with a stopwatch app and strong opinions about '
             'nutrition.” He almost smiled. “You’ll like them more than me.”',
             '“That’s not funny.”',
             '“( B ).”',
             'I picked at a splinter in the wooden bench. I wanted to say something important, something '
             'that would show him what the last three years had meant, but every sentence I started sounded '
             'like a greeting card. In the end what came out was, “I was terrible when I started. Do you '
             'remember?”',
             '“I remember you fell over at the first hurdle and got up and finished the race with grass in '
             'your hair.”',
             '“Everyone laughed.”',
             '“Not everyone.” Only then did he turn around and look at me over his glasses. “I wrote your '
             'name down that day, on the list of runners I wanted to keep an eye on. ( C ).”',
             '“Why?”',
             '“Because you got up.” He shrugged, as if it were the most obvious thing in the world. “{u1|I '
             'can teach almost anyone to run faster. I can’t teach that.}”',
             'My hands suddenly felt useless. I looked at the track, at the white lines that had been '
             'repainted so many times they had grown thick at the edges, and tried to picture someone else '
             'standing at the finish with a stopwatch.',
             '“What will you do?” I asked. “After.”',
             '“My daughter wants me to move closer to her. She has a garden that needs work and two boys who '
             'need someone to shout at them while they run.” He held up the clipboard. “I’ll still have '
             'this. ( D ).”',
             '“You could come back. To watch, I mean. At the regional meet*.”',
             'He said nothing for a while. {wa|The man turned off the hose, and in the sudden silence the '
             'sprinklers ticking on the far field were the only sound.}',
             '“Maybe,” he said. “If you promise not to make a speech.”',
             '“I had no speech planned.”',
             '“{wb|You had one ready},” he said. “I could see it on your face.”',
             'I laughed, and something in my chest loosened. He stood up slowly, the way his knees had made '
             'him stand up all spring, and tucked the clipboard under his arm.',
             '“Go home, Maya. Captains need sleep too.” At the gate he stopped and looked back at the empty '
             'track. “( E ).”',
             '{u2|I stayed until the lights came on, so that I would remember exactly how it looked.}'],
 'notes': [('stands', '観客席'), ('long-jump pit', '走り幅跳びの砂場'), ('regional meet', '地区大会')],
 'questions': [{'no': 1,
                'points': 10,
                'kind': 'dialog_blanks',
                'stem': '空所( A )〜( E )を補うのに最もふさわしい発言を，選択肢(あ)〜(お)からそれぞれ一つ選び，記号で答えなさい。各選択肢は一回ずつ用いること。',
                'choices': ['I know, and I’m sorry',
                            'I meant it as a compliment',
                            'It was a good place to work',
                            'Yours was the only name on it that day',
                            'Old habits'],
                'answer': {'A': 0, 'B': 1, 'C': 3, 'D': 4, 'E': 2},
                'why': {'A': '“You could have told us '
                             'first.”（先に言ってくれてもよかったのに）に対して，「わかっている，すまない」と認めて謝る(あ)。直後に「金曜日に話すつもりだった」と事情を説明する流れとも合う。',
                        'B': '“That’s not '
                             'funny.”（笑えません）に対して，「ほめ言葉のつもりで言ったんだ」と言い直す(い)。直前の「君たちは私よりその人の方を好きになるよ」という発言を受けている。',
                        'C': '「その日，気にかけておきたい選手のリストに君の名前を書いた。その日そのリストに載ったのは君の名前だけだった」。it は直前の the list '
                             'を指す。リストの話と結びつくのは(え)だけ。',
                        'D': 'クリップボードを掲げて「これはまだ持っているだろう。長年の習慣だからね」。退職後も孫の走りを記録する，というユーモア。名詞句だけの(お) Old '
                             'habits（Old habits die hard の省略）が入る。',
                        'E': '門で立ち止まり，誰もいないトラックを振り返って「いい職場だった」と言う(う)。33年間指導してきた場所への別れの言葉。'},
                'check': '一意性の確認：( C )は直前の the list を it で受ける(え)以外は入らない。( A )は “You could have told us '
                         'first.” への謝罪，( B )は “That’s not funny.” '
                         'への言い直しで，それぞれ(あ)(い)以外では応答が成り立たない。残る(う)(お)のうち，( D '
                         ')はクリップボードを掲げる動作に続く説明で，習慣の話になる(お)が入る。(う)を( D '
                         ')に入れると「これはまだ持っている。いい職場だった」となり，クリップボードの話とつながらない。よって( E )は(う)に決まる。'},
               {'no': 2,
                'points': 7,
                'kind': 'trans_ref',
                'stem': '下線部(1)を，that が指す内容を具体的に示して和訳しなさい。',
                'answer': 'ほとんど誰にでも，より速く走ることは教えられるが，転んでも立ち上がるということは教えられない。',
                'alts': ['私はほぼ誰にでもより速く走る方法を教えることができるが，倒れても起き上がって走り続けることは教えることができない。'],
                'criteria': [('that＝（転んでも）立ち上がる（起き上がってまた走る）こと', 4),
                             ('I can teach almost anyone to run faster：「ほとんど誰にでもより速く走ることを教えられる」', 2),
                             ('I can’t teach that：「それは教えられない」（対比の処理）', 1)],
                'explain': ['that は直前の “Because you got up.”（君が立ち上がったからだ）を指す。1年目の最初のレースで転んだ Maya '
                            'が，起き上がって最後まで走ったことを受けている。',
                            'teach A to do「Aに〜することを教える」。almost anyone「ほとんど誰にでも」。',
                            '「速さは教えられるが，倒れても立ち上がる心は教えられない」という対比に，Mr. Okafor が Maya のどこを評価していたかが表れている。']},
               {'no': 3,
                'points': 6,
                'kind': 'wavy',
                'stem': '波線部(a)・(b)の意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'The man turned off the hose, and in the sudden silence the sprinklers '
                                   'ticking on the far field were the only sound.',
                           'choices': ['Maya is becoming annoyed by the noise of the sprinklers.',
                                       'Another team’s practice is about to start on the far field.',
                                       'The sudden quiet marks Mr. Okafor’s pause as he considers the offer.',
                                       'The groundskeeper interrupts their conversation because it is '
                                       'getting late.'],
                           'answer': 2,
                           'why': '“He said nothing for a while.” '
                                  'の直後に置かれた情景描写で，誘いに対して彼が考え込む「間」を，突然の静けさで表している。(え)管理人は会話をさえぎっていない。(あ)(い)は本文に根拠がない。'},
                          {'label': 'b',
                           'word': 'You had one ready',
                           'choices': ['He could tell Maya had meant to say something heartfelt.',
                                       'He wanted Maya to give a speech at the regional meet.',
                                       'He thought Maya was not very good at giving speeches.',
                                       'He had heard that Maya planned to speak in assembly.'],
                           'answer': 0,
                           'why': '“I could see it on your face.”（顔に書いてあった）が続くので，You had one ready（one＝a '
                                  'speech）は「（スピーチを）ちゃんと用意していた」＝「君は何か感動的なことを言おうとしていた（とわかっていた）」という意味。Maya '
                                  'が前半で「大切なことを言いたかった」と思っていたことと対応する。(い)は “If you promise not to make a '
                                  'speech” と逆。(う)(え)は本文にない。'}]},
               {'no': 4,
                'points': 7,
                'kind': 'ja_free',
                'stem': '下線部(2)で Maya がそのようにしたのはなぜか。本文の内容に即して，日本語で説明しなさい。',
                'answer': '3年間指導してくれた Mr. Okafor '
                          'が退職し，彼と過ごしたこの夕方のトラックの光景はもう二度と同じ形では見られなくなるので，それを大切な思い出として心にしっかり刻んでおきたかったから。',
                'alts': ['恩師が今年で去ってしまい，彼がいつも座っていたトラックの夕暮れの景色が最後になると感じたため，それを正確に覚えておきたかったから。'],
                'criteria': [('Mr. Okafor が退職する（去ってしまう）こと', 2),
                             ('彼とトラックで過ごしたこの時間・光景がもう同じ形では戻らないこと', 2),
                             ('その光景を（正確に）記憶に刻んでおきたかったこと', 3)],
                'explain': ['so that I would remember exactly how it looked は目的を表す。it は直前で Mr. Okafor が振り返った '
                            'the empty track（トラックの光景）。',
                            '33年間指導した Mr. Okafor '
                            'が退職し，練習後に彼が観客席に座る光景はもう見られなくなる。前半で「大切なことを言いたかったが言葉にならなかった」Maya '
                            'が，言葉の代わりに光景を記憶に刻もうとしている，という心情を読み取る。',
                            '採点では，退職という事情，二度と戻らない時間であること，記憶に刻みたいという目的の3点を見る。']}],
 'translation': ['私が先生を見つけたとき，トラックには誰もいなかった。オカフォー先生は観客席の一番下の列に座り，ひざにクリップボードを載せていた。私が先生を知ってからの3年間，毎回の練習の後にそうして座っていたのと同じように。練習は1時間前に終わっていたのに，古い笛がまだひもで首から下がっていた。夕方の光で，赤いレーンはほとんど紫色に見えた。',
                 '「聞いたんだね」と，先生は顔を上げずに言った。',
                 '「みんな聞きました。ドゥアルテ先生が全校集会で発表したんです」私は先生の2列上に座った。「先に私たちに言ってくれてもよかったのに」',
                 '「（A：わかっている，すまない）」先生はペンでボードをたたいた。「金曜日にチームに話すつもりだったんだ。そうしたら校長が，正式に発表すべきだと決めてね」',
                 '「32年」と私は言った。「ドゥアルテ先生はそう言っていました。32年って」',
                 '「本当は33年だ。彼女はいつも間違えるんだよ」',
                 'しばらくの間，私たちは管理人が走り幅跳びの砂場の上にホースを引きずっていくのを眺めていた。体育館の裏のどこかで車の警報が鳴り，止まった。どちらもそれには触れなかった。互いの顔を見るより，水を眺めているほうが気が楽だった。',
                 '「誰が私たちを指導するんですか」と私は尋ねた。',
                 '「誰か見つけるさ。たぶん若い人で，ストップウォッチのアプリを使って，栄養について強い意見を持っている人だろう」先生はほとんど笑いそうになった。「君たちは私よりその人の方を好きになるよ」',
                 '「笑えません」',
                 '「（B：ほめ言葉のつもりで言ったんだ）」',
                 '私は木のベンチのささくれをいじった。何か大切なこと，この3年間が自分にとってどんな意味を持っていたかを先生に伝えられることを言いたかったが，言いかけた文はどれもグリーティングカードのように聞こえた。結局，口から出てきたのは「私，始めたころはひどかったですよね。覚えていますか」という言葉だった。',
                 '「最初のハードルで転んで，起き上がって，髪に芝をつけたまま最後まで走ったのを覚えているよ」',
                 '「みんな笑いました」',
                 '「みんなじゃない」先生はそのとき初めて振り返り，眼鏡越しに私を見た。「その日，気にかけておきたい選手のリストに君の名前を書いたんだ。（C：その日そのリストに載ったのは君の名前だけだった）」',
                 '「どうしてですか」',
                 '「君が立ち上がったからだ」先生は，それが世界で一番わかりきったことであるかのように肩をすくめた。「⑴ほとんど誰にでも，より速く走ることは教えられる。だが，それは教えられない」',
                 '急に自分の手が役に立たないもののように感じられた。私はトラックを見た。何度も塗り直されて縁が太くなった白い線を見て，ほかの誰かがストップウォッチを持ってゴールに立っている姿を思い浮かべようとした。',
                 '「これからどうするんですか」と私は尋ねた。「その後は」',
                 '「娘が近くに引っ越してきてほしいと言っていてね。手入れの必要な庭と，走るときに誰かにどなってもらう必要のある男の子が2人いるんだ」先生はクリップボードを掲げた。「これはまだ持っているだろう。（D：長年の習慣だからね）」',
                 '「戻ってきてもいいんですよ。見に，という意味です。地区大会に」',
                 '先生はしばらく何も言わなかった。(a)その男の人がホースの水を止め，突然の静けさの中で，聞こえるのは向こうのグラウンドでカチカチと鳴るスプリンクラーの音だけになった。',
                 '「たぶんね」と先生は言った。「君がスピーチをしないと約束するならね」',
                 '「スピーチなんて用意していません」',
                 '「(b)ちゃんと用意してあっただろう」と先生は言った。「顔に書いてあったよ」',
                 '私は笑い，胸の中の何かがほどけた。先生は，春の間ずっとひざのせいでそうしていたように，ゆっくりと立ち上がり，クリップボードを小脇に抱えた。',
                 '「家に帰りなさい，マヤ。部長にも睡眠は必要だ」門のところで先生は立ち止まり，誰もいないトラックを振り返った。「（E：いい職場だった）」',
                 '⑵私は照明がつくまでそこにいた。それがどんなふうに見えたかを正確に覚えておけるように。'],
 'vocab': [('stands', '観客席'),
           ('clipboard', 'クリップボード'),
           ('assembly', '全校集会'),
           ('official', '正式な'),
           ('groundskeeper', '（グラウンドの）管理人'),
           ('go off', '（警報が）鳴る'),
           ('pick at …', '〜をいじる'),
           ('splinter', 'ささくれ，とげ'),
           ('hurdle', 'ハードル'),
           ('keep an eye on …', '〜を気にかけておく'),
           ('shrug', '肩をすくめる'),
           ('Old habits die hard.', '長年の習慣はなかなか抜けない'),
           ('compliment', 'ほめ言葉'),
           ('loosen', 'ほどける，ゆるむ'),
           ('whistle', '笛'),
           ('picture', '〜を思い浮かべる'),
           ('tuck A under one’s arm', 'Aを小脇に抱える'),
           ('so that S would …', 'Sが〜できるように')]}
