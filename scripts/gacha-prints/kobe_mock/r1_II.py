# -*- coding: utf-8 -*-
# 第1回 大問II（科学：都市のヒートアイランドと樹木）
PART = {'roman': 'II',
 'points': 35,
 'intro': '次の文章は，都市の暑さとその対策を論じた英文である。よく読んで，後の問1〜5に答えなさい。',
 'passage': ['On a sweltering summer afternoon, anyone who walks from a sunny parking lot into a park shaded '
             'by tall trees can feel the difference. This everyday experience points to a phenomenon that '
             'has become a serious concern for city planners around the world: the urban heat island. Cities '
             'tend to be warmer than the countryside that encircles them, and the difference is often '
             'greatest not in the middle of the day but after sunset.',
             'Several causes interact to produce this effect. The first is the material from which cities '
             'are built. Asphalt roads and concrete buildings, with their dark and dense surfaces, absorb a '
             'large share of the sunlight that falls on them and store its energy as heat during the day. At '
             'night, when the countryside cools quickly, these surfaces slowly release the heat they have '
             'stored, keeping the surrounding air warm. The shape of a city matters as well: tall buildings '
             'clustered together trap heat between them and obstruct the wind that might otherwise carry it '
             'away. Finally, cities generate heat of their own. Cars, factories, and the air conditioners '
             'that people switch on to escape the heat release warm air into the streets, so that {u1|the '
             'very machines we use to keep ourselves cool end up making the city outside even hotter}.',
             'The consequences are more than a matter of comfort. High temperatures at night make it '
             'difficult for the human body to recover from the heat of the day, and older people and those '
             'with health problems are especially susceptible during prolonged hot spells. Hotter cities '
             'also consume more electricity for cooling, which can {ua|strain} power supplies at exactly the '
             'moment when demand is highest. ( A ), as the climate warms, heat waves are expected to become '
             'more frequent, so the extra heat that cities produce is likely to become more dangerous, not '
             'less.',
             'Among the possible responses, trees have attracted particular attention. A tree cools its '
             'surroundings in two distinct ways. The more obvious is shade: by blocking sunlight before it '
             'reaches the ground, a tree keeps roads, walls, and people from heating up in the first place. '
             'The second is less visible. Trees draw water from the soil through their roots and release it '
             'as vapor through microscopic openings in their leaves, a process known as transpiration*. '
             'Turning liquid water into vapor requires energy, and this energy is taken from the surrounding '
             'air, which therefore becomes cooler. A large tree thus works like a natural air conditioner, '
             'one that runs on water rather than electricity and ( B ) no waste heat at all.',
             'Yet planting trees is not as simple as it sounds. A tree needs space for its roots, which in a '
             'congested city must compete with water pipes, electric cables, and the foundations of '
             'buildings. It also needs water, and in a dry summer the water that a tree needs may itself be '
             'scarce. Young trees take many years to grow large enough to provide meaningful shade, and '
             'those planted in narrow, paved streets often wither long before they reach that size. {u2|For '
             'these reasons, some cities have begun to treat their trees not as decoration but as '
             'infrastructure*}, planning, funding, and caring for them with the same seriousness they give '
             'to roads and drains.',
             'Trees are not the only tool available. Roofs and pavements can be painted in light colors so '
             'that they reflect sunlight instead of absorbing it, and roofs can be covered with soil and '
             'plants. Each of these measures has its own costs and drawbacks, and none of them is enough on '
             'its own. ( C ), the most effective approach is usually to combine several of them, choosing '
             'those that suit the climate and shape of a particular city.',
             'What makes the urban heat island unusual among environmental problems is that both its causes '
             'and its solutions are largely local. A single city cannot stop global warming by itself, but '
             'it can decide what its streets are made of, how its buildings are arranged, and where its '
             'trees are planted. In this sense, the extra heat that cities suffer from is heat of their own '
             'making, and that is {ub|precisely} why ( D ) is within their reach.'],
 'notes': [('transpiration', '蒸散（植物が葉から水分を水蒸気として放出すること）'), ('infrastructure', '社会基盤（道路・上下水道など）')],
 'questions': [{'no': 1,
                'points': 8,
                'kind': 'trans',
                'stem': '下線部(1)を和訳しなさい。',
                'answer': '私たちが自分を涼しく保つために使っているまさにその機械が，結局は屋外の街をさらに暑くしてしまう（ことになる）',
                'alts': ['涼をとるために私たちが使っている機械そのものが，最終的には外の街をいっそう暑くしてしまう'],
                'criteria': [('the very machines：「まさにその機械」（very の強調）', 2),
                             ('we use to keep ourselves cool：関係詞節「自分を涼しく保つために使う」', 2),
                             ('end up doing：「結局〜することになる」', 2),
                             ('making the city outside even hotter：make O C と even（比較級の強調）「さらに暑く」', 2)],
                'explain': ['the very＋名詞「まさにその〜」。machines と we の間に目的格の関係代名詞が省略されている。',
                            'end up doing「結局（最後には）〜することになる」。make the city … hotter は make O C（O を C '
                            'にする）。even は比較級を強めて「さらに・いっそう」。',
                            'the city outside は「屋外の街」。エアコンで室内を冷やすと，その分の熱が外に出るという因果が訳文で伝わればよい。']},
               {'no': 2,
                'points': 8,
                'kind': 'blanks',
                'stem': '空所( A )〜( D )を補うのに最もふさわしい表現を，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'A',
                           'choices': ['Moreover', 'Instead', 'Otherwise', 'Nevertheless'],
                           'answer': 0,
                           'why': '前の2文の「健康への危険」「電力への負担」に，「熱波が増える」という悪い要素をさらに加える流れなので，追加の '
                                  'Moreover。Nevertheless（それにもかかわらず）・Instead（その代わりに）・Otherwise（さもなければ）は，前後に対立・代替・条件の関係がないので入らない。'},
                          {'label': 'B',
                           'choices': ['absorbs', 'produces', 'receives', 'blocks'],
                           'answer': 1,
                           'why': '木を「エアコン」にたとえ，本物のエアコンとの違いを述べる部分。第2段落でエアコンは暖かい空気を出すとあるので，木は排熱を「まったく出さない」＝produces '
                                  'no waste heat。absorbs / blocks / receives no waste heat '
                                  'では「本物のエアコンとの違い」にならず，排熱を出さないという対比が成り立たない。'},
                          {'label': 'C',
                           'choices': ['For example', 'At first', 'In contrast', 'For this reason'],
                           'answer': 3,
                           'why': '「どれも単独では十分ではない」→「だから組み合わせるのが最も効果的」という理由と結論の関係。For example（具体例）・In '
                                  'contrast（対比）・At first（最初は）は前文との関係に合わない。'},
                          {'label': 'D',
                           'choices': ['reducing it',
                                       'ignoring it',
                                       'leaving the city',
                                       'stopping global warming'],
                           'answer': 0,
                           'why': '「余分な熱は自ら作り出したものだ，だからこそ（その熱を）減らすことは手の届く範囲にある」。it は the extra '
                                  'heat。同じ段落で「一つの都市では温暖化を止められない」と述べているので(え)は矛盾。(い)(う)は「自ら作った熱だから」という理由と結びつかない。'}]},
               {'no': 3,
                'points': 9,
                'kind': 'ja_limit',
                'limit': 70,
                'stem': '下線部(2)のように一部の都市が樹木を扱い始めたのはなぜか。その理由を，本文の内容に即して70字以内でまとめなさい（句読点も1字と数える）。',
                'answer': '根の空間が配管や建物の基礎と競合し，夏は水も不足しがちで，日陰を作るまでに長年かかるうえ，狭い舗装道路では育つ前に枯れやすいから。',
                'alts': ['木は根を張る場所を配管や基礎と奪い合い，乾いた夏は水も足りず，十分な日陰を作るまで何年もかかり，狭い通りでは育つ前に枯れやすいから。'],
                'criteria': [('根のための空間が配管・電線・建物の基礎と競合する', 2),
                             ('（乾燥した夏には）必要な水が不足しうる', 2),
                             ('意味のある日陰を作るほど育つまでに長い年月がかかる', 2),
                             ('狭い舗装された通りでは大きくなる前に枯れやすい', 2),
                             ('理由の文として結ばれている（〜から・〜ため）', 1)],
                'explain': ['For these reasons の these reasons '
                            'は同じ段落の前の3文の内容。①根の空間（配管・電線・基礎と競合）②水（乾燥した夏に不足）③時間（日陰を作れるまで長年）と，④狭い舗装道路では途中で枯れる，の4点。',
                            '「飾り」ではなく「道路や排水設備と同じ社会基盤」として計画・予算・手入れをするのは，放っておいては都市の木は育たないから，という論理。70字に収めるには，各要素を短い句にまとめる。']},
               {'no': 4,
                'points': 6,
                'kind': 'tf2',
                'stem': '本文の内容に一致するものを，選択肢(あ)〜(か)から二つ選び，記号で答えなさい。',
                'choices': ['In most cities, the temperature difference between the city and the countryside '
                            'is greatest around noon.',
                            'Roads and buildings in cities take in heat while the sun is up and give it off '
                            'after dark.',
                            'Painting roofs in light colors has been shown to cool cities more effectively '
                            'than planting trees.',
                            'According to the passage, trees cool the air only by blocking sunlight.',
                            'The author believes that cities can stop global warming if they plant enough '
                            'trees.',
                            'Hot nights are dangerous partly because they make it hard for people to recover '
                            'from the heat of the day.'],
                'answer': [1, 5],
                'reasons': ['× 第1段落 “the difference is often greatest not in the middle of the day but after '
                            'sunset” と逆（本文と逆）。',
                            '○ 第2段落 “absorb a large share of the sunlight … and store its energy as heat '
                            'during the day. At night … these surfaces slowly release the heat” の言い換え（take '
                            'in＝absorb，give off＝release）。',
                            '× 第6段落は対策を並べるだけで，屋根を塗る方が木より効果的だという比較はしていない（本文にない比較）。',
                            '× 第4段落 “A tree cools its surroundings in two distinct ways.”（日陰と水の蒸発）。only '
                            'が誤り（言い過ぎ）。',
                            '× 第7段落 “A single city cannot stop global warming by itself” と矛盾（本文と逆）。',
                            '○ 第3段落 “High temperatures at night make it difficult for the human body to '
                            'recover from the heat of the day” の言い換え。']},
               {'no': 5,
                'points': 4,
                'kind': 'synonym',
                'stem': '下線部(a)・(b)の語について，文脈に即した意味として最もふさわしいものを，それぞれの選択肢(あ)〜(え)から一つ選び，記号で答えなさい。',
                'items': [{'label': 'a',
                           'word': 'strain',
                           'choices': ['replace', 'overload', 'protect', 'measure'],
                           'answer': 1,
                           'why': '“consume more electricity for cooling, which can strain power supplies at '
                                  'exactly the moment when demand is '
                                  'highest”：需要が最大のときに電力供給に「過大な負担をかける」。(う)は逆，(あ)(え)は「負担」の意味を持たない。'},
                          {'label': 'b',
                           'word': 'precisely',
                           'choices': ['partly', 'hardly', 'exactly', 'carefully'],
                           'answer': 2,
                           'why': '“that is precisely why …”「まさにそれが理由で」。precisely '
                                  'は「正確に・まさに」。(え)は「（作業を）入念に」という別の文脈の連想による誤り。(あ)(い)は強調の意味にならず，文意が変わる。'}]}],
 'translation': ['うだるように暑い夏の午後，日の当たる駐車場から高い木々の陰になった公園へ歩いて入る人は誰でも，その違いを感じることができる。この日常的な経験は，世界中の都市計画の担当者にとって深刻な懸念となっているある現象，すなわちヒートアイランド（都市の熱の島）を指し示している。都市は周囲の田園地帯よりも暖かい傾向があり，その差は日中よりもむしろ日没後に最も大きくなることが多い。',
                 'いくつかの原因が組み合わさってこの現象を生み出している。一つ目は都市を造っている材料である。アスファルトの道路やコンクリートの建物は，その暗く密な表面によって，当たる日光の多くを吸収し，日中にそのエネルギーを熱として蓄える。夜になって田園地帯が急速に冷えるとき，こうした表面は蓄えていた熱をゆっくりと放出し，周囲の空気を暖かく保つ。都市の形も関係している。すなわち，互いに近接して立つ高い建物はその間に熱を閉じ込め，本来なら熱を運び去るかもしれない風をさえぎる。最後に，都市はそれ自体で熱を生み出している。自動車，工場，そして人々が暑さから逃れるためにつけるエアコンは暖かい空気を通りに放出するので，⑴私たちが自分を涼しく保つために使っているまさにその機械が，結局は屋外の街をさらに暑くしてしまうのである。',
                 'その影響は快適さだけの問題にとどまらない。夜間の高温は人間の体が日中の暑さから回復するのを難しくし，高齢者や健康に問題を抱える人々は，暑い期間が長く続くと特に危険にさらされる。より暑い都市はまた冷房のためにより多くの電力を使うので，まさに需要が最も高いときに電力供給に(a)過大な負担をかけかねない。（A：さらに），気候が温暖化するにつれて熱波はより頻繁になると予想されており，都市が生み出す余分な熱は危険性が減るどころか増す可能性が高い。',
                 '考えられる対策の中で，樹木は特に注目を集めてきた。木は二つの異なる方法で周囲を冷やす。より明らかなのは日陰である。日光が地面に届く前にさえぎることで，木は道路や壁や人々がそもそも熱くならないようにする。二つ目はそれほど目に見えない。木は根を通して土から水を吸い上げ，葉の小さな穴から水蒸気として放出する。これは蒸散と呼ばれる過程である。液体の水を水蒸気に変えるにはエネルギーが必要であり，このエネルギーは周囲の空気から奪われるので，空気は冷やされる。このように，大きな木は天然のエアコンのように働くのであり，それは電気ではなく水で動き，排熱をまったく（B：出さない）エアコンなのである。',
                 'しかし，木を植えることは聞こえるほど簡単ではない。木には根のための空間が必要だが，混み合った都市ではその空間を水道管や電線や建物の基礎と奪い合わなければならない。木には水も必要だが，乾燥した夏には木が必要とする水そのものが不足するかもしれない。若い木が意味のある日陰を作れるほど大きく育つには長い年月がかかり，狭い舗装された通りに植えられた木は，その大きさに達するずっと前に枯れてしまうことが多い。⑵こうした理由から，一部の都市は樹木を飾りとしてではなく社会基盤として扱い始めており，道路や排水設備に向けるのと同じ真剣さで，樹木を計画し，予算をつけ，手入れをしている。',
                 '利用できる手段は樹木だけではない。屋根や舗装を明るい色に塗れば，日光を吸収する代わりに反射させることができるし，屋根を土と植物で覆うこともできる。こうした対策にはそれぞれ費用や限界があり，どれも単独では十分ではない。（C：このため），最も効果的な方法は通常，その都市の気候や形に合ったものを選んで，いくつかを組み合わせることである。',
                 'ヒートアイランドが環境問題の中で珍しいのは，その原因も解決策も大部分が地域的なものだという点である。一つの都市が単独で地球温暖化を止めることはできないが，通りを何で造るか，建物をどう配置するか，木をどこに植えるかは決めることができる。この意味で，都市が苦しんでいる余分な熱は自ら作り出した熱であり，(b)まさにだからこそ，（D：それを減らすこと）は都市の手の届く範囲にあるのである。'],
 'vocab': [('sweltering', 'うだるように暑い'),
           ('urban heat island', 'ヒートアイランド（現象）'),
           ('countryside', '田園地帯'),
           ('absorb', '〜を吸収する'),
           ('release', '〜を放出する'),
           ('trap', '〜を閉じ込める'),
           ('generate', '〜を生み出す'),
           ('the very＋名詞', 'まさにその〜'),
           ('end up doing', '結局〜することになる'),
           ('hot spell', '暑い期間'),
           ('strain', '〜に過大な負担をかける'),
           ('demand', '需要'),
           ('in the first place', 'そもそも'),
           ('vapor', '水蒸気'),
           ('transpiration', '蒸散'),
           ('waste heat', '排熱'),
           ('foundation', '（建物の）基礎'),
           ('in short supply', '不足して'),
           ('drain', '排水設備'),
           ('reflect', '〜を反射する'),
           ('of one’s own making', '自ら作り出した'),
           ('within one’s reach', '手の届く範囲に')]}
