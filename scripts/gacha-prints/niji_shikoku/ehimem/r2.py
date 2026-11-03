# 愛媛大学（医学部医学科）前期 総合問題（英文読解・論述）予想問題 第2回（すべてマナトビ編集部の書き下ろし）

S1 = {
    'title': '医療・科学の英文', 'pts': 100,
    'lead': '以下は、医療における人工知能（AI）の活用について、ある科学雑誌に掲載された解説記事（架空）である。これを読み、問1〜問6に答えよ。*印の語には本文の後に注を付した。字数を指定した問いでは、句読点やかっこも1字として数える。',
    'passages': [{'title': 'When the Second Opinion Comes from a Machine', 'paras': [
        "In several hospitals, a new kind of colleague has quietly joined the radiology* department. It does not drink coffee or take holidays, and it can examine thousands of chest X-rays in the time a human specialist needs to read a few dozen. {u:①:These AI systems are trained on enormous collections of images that have already been labeled by doctors, and they learn to recognize patterns associated with disease.} In some studies, their accuracy in spotting early signs of lung cancer has matched that of experienced radiologists.",
        "Supporters argue that such tools could ease one of medicine’s most pressing problems: the shortage of specialists. In many rural regions, patients wait weeks for their scans to be read. An AI system that sorts images by urgency could make sure that the most serious cases are seen first. {u:②:The machine, in this view, does not replace the doctor; it decides where the doctor’s limited attention is most needed.}",
        "Yet the technology raises difficult questions. An AI system is only as good as the data it learns from. If most of the images used in training come from one group of patients — for example, adults from wealthy countries — the system may perform less well for children, for older people, or for patients of different ethnic backgrounds. {u:③:Such weaknesses are easy to miss, because a system that is correct ninety-five percent of the time can still be wrong in a systematic way for a particular group.}",
        "There is also the question of responsibility. When a doctor misses a tumor*, it is clear who must answer for the mistake. When a doctor follows the advice of a machine that turns out to be wrong, the situation is less clear. Some experts worry about “automation bias”: the tendency of people to trust a computer’s judgment even when their own observations suggest otherwise. {u:④:Paradoxically, the better a system performs on average, the more likely doctors may be to stop questioning it.}",
        "Most researchers now favor a model in which AI acts as a second reader rather than a final judge. The machine flags images that may need attention, and a human doctor makes the decision and explains it to the patient. {u:⑤:This arrangement keeps the speed of the computer while preserving something that patients consistently say they value: a person who takes responsibility and can be asked “why?”}",
    ]}],
    'notes': [('radiology', '放射線科'), ('tumor', '腫瘍')],
    'qs': [
        {'n': '問1', 'q': '下線部①について、AI がどのようにして病気を見つけられるようになるのかを説明した部分から、学習の材料となるものを表す英語を、本文中から連続する4語で抜き出せ。', 'sheet': 1},
        {'n': '問2', 'q': '下線部②で、AI の役割はどのようなものだと述べられているか。60字以内の日本語でまとめよ。', 'sheet': 'grid60'},
        {'n': '問3', 'q': '下線部③を、本文の趣旨がわかるように、100字以内の日本語に訳せ。', 'sheet': 'grid100'},
        {'n': '問4', 'q': '下線部④のような逆説が生じるのはなぜか。automation bias の意味を示しながら、日本語で説明せよ。', 'sheet': 4},
        {'n': '問5', 'q': '下線部⑤の This arrangement の内容と、それが患者にとって望ましい理由を、80字以内の日本語で述べよ。', 'sheet': 'grid80'},
        {'n': '問6', 'q': 'AI による画像診断支援を地方の病院に導入するとした場合、医師はどのような点に注意すべきだと考えるか。本文の内容をふまえ、自分の考えを240字以内の日本語で述べよ。', 'sheet': 'grid240'},
    ],
    'ans': [
        {'n': '問1', 'pts': 8, 'ans': 'enormous collections of images',
         'exp': '下線部① are trained on enormous collections of images that have already been labeled by doctors。「医師がすでにラベルを付けた膨大な画像の集まり」で学習する。連続4語は enormous collections of images。'},
        {'n': '問2', 'pts': 12, 'ans': '医師に取って代わるのではなく、画像を緊急度で振り分け、限られた医師の注意が最も必要な所に向くよう優先順位を決める役割。',
         'exp': 'not replace … ; it decides where the doctor’s limited attention is most needed。前文の sorts images by urgency も手がかり。'},
        {'n': '問3', 'pts': 16, 'ans': 'そうした弱点は見落とされやすい。95％の確率で正しいシステムであっても、特定の集団に対しては系統的に（決まった傾向で）誤ることがありうるからである。',
         'exp': 'Such weaknesses＝特定の患者層で性能が下がること。easy to miss「見落としやすい」、in a systematic way「系統的に、偏った形で」、for a particular group「特定の集団に対して」。'},
        {'n': '問4', 'pts': 16, 'ans': 'automation bias とは、自分の観察が別のことを示していても、コンピューターの判断を信頼してしまう人間の傾向のこと。システムが平均して高い性能を示すほど医師はそれを信頼するようになり、疑う習慣を失うため、まれな誤りを見逃しやすくなるから。',
         'exp': 'automation bias の定義 6点、the better …, the more likely … の因果（高性能→信頼→疑わなくなる）10点。'},
        {'n': '問5', 'pts': 14, 'ans': 'AI が注意の必要な画像に印を付け、医師が最終判断をして患者に説明する体制。速さを保ちつつ、責任を負い「なぜか」を尋ねられる人間が残るから。',
         'exp': '体制（AI は第二の読影者、決定と説明は医師）と、患者が価値を置くもの（責任をとり、理由を尋ねられる人）を80字以内で。'},
        {'n': '問6', 'pts': 34, 'ans': '（解答例）AI は専門医の少ない地方で読影の遅れを減らし、重い患者を早く見つける助けになる。しかし注意すべき点が二つある。第一に、AI がどのような患者のデータで学習したかを確認することだ。地方には高齢の患者が多く、学習データと患者層が異なれば精度が下がるおそれがある。第二に、AI の結果をうのみにしないことだ。医師は自分の目で画像を確認し、AI と判断が分かれた場合はその理由を考える習慣を保つ必要がある。最終的な診断と患者への説明は医師が責任をもって行い、AI はあくまで補助として使うべきだと考える。',
         'short': '解答例は解説欄参照',
         'exp': '【出題の意図】医療AIの利点（専門医不足の緩和・優先度づけ）と限界（データの偏り・自動化バイアス・責任の所在）を理解し、地域医療の文脈で具体的に考えさせる。\n【採点の観点】①利点を認めたうえで注意点を挙げている ②本文の論点（学習データの偏り、自動化バイアス、責任）をふまえている ③地方病院という条件（高齢者が多い・専門医が少ない）に結びつけている ④字数・論理・表現。\n【加点要素】患者への説明と同意、導入後の精度の検証、医師の教育・研修に触れている。'},
    ],
    'tr': [
        '【セカンドオピニオンが機械から来るとき】いくつかの病院で、新しい種類の同僚がひっそりと放射線科に加わった。コーヒーも飲まず休暇もとらず、人間の専門医が数十枚を読む間に何千枚もの胸部X線写真を調べることができる。(①) こうしたAIシステムは、医師がすでにラベルを付けた膨大な画像の集まりで訓練され、病気に関連するパターンを見分けることを学ぶ。いくつかの研究では、肺がんの初期の兆候を見つける精度が、経験豊富な放射線科医に匹敵した。',
        '支持者たちは、こうした道具が医療の最も差し迫った問題の一つ、つまり専門医不足を和らげうると主張する。多くの地方では、患者は画像を読んでもらうまで何週間も待つ。画像を緊急度で振り分けるAIシステムがあれば、最も深刻な症例が最初に診られるようにできる。(②) この見方では、機械は医師に取って代わるのではなく、医師の限られた注意が最も必要とされる場所を決めるのである。',
        'しかし、この技術は難しい問いを投げかける。AIシステムは、学習するデータと同じ程度にしか優れていない。訓練に使われた画像のほとんどがある一つの患者集団――たとえば裕福な国の成人――のものであれば、そのシステムは子どもや高齢者、異なる民族的背景を持つ患者に対しては性能が落ちるかもしれない。(③) こうした弱点は見落とされやすい。95％の確率で正しいシステムでも、特定の集団に対しては系統的に誤りうるからだ。',
        '責任の問題もある。医師が腫瘍を見逃したとき、誰がその誤りの責任を負うべきかは明らかだ。医師が機械の助言に従い、それが誤りだとわかったときには、事情はそれほど明らかではない。一部の専門家は「自動化バイアス」を心配する。自分の観察が別のことを示していても、コンピューターの判断を信じてしまう人間の傾向のことである。(④) 逆説的だが、システムの平均的な性能が高いほど、医師はそれを疑うのをやめてしまいやすくなるかもしれない。',
        '今ではほとんどの研究者が、AIを最終的な判定者ではなく第二の読影者とする方式を支持している。機械が注意の必要な画像に印を付け、人間の医師が決定を下して患者に説明する。(⑤) この体制は、コンピューターの速さを保ちながら、患者が一貫して大切だと言うもの――責任を引き受け、「なぜ」と尋ねることのできる人――を守るのである。',
    ],
    'vocab': [('colleague', '同僚'), ('specialist', '専門医'), ('label', 'ラベルを付ける'), ('associated with', '〜と関連した'),
              ('accuracy', '精度'), ('pressing', '差し迫った'), ('shortage', '不足'), ('urgency', '緊急性'),
              ('ethnic', '民族の'), ('systematic', '系統的な'), ('answer for', '〜の責任を負う'), ('tendency', '傾向'),
              ('paradoxically', '逆説的に'), ('flag', '印を付ける'), ('preserve', '守る、保つ')],
}

S2 = {
    'title': '臨床の状況と専門家の見解', 'pts': 100,
    'marks': ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)', '(G)', '(H)'],
    'lead': 'あなたは総合病院の内科に勤める研修医で、文章1のような場面に出会った。これについて、医学教育に携わるある医師が文章2の見解を述べている（いずれも架空）。二つの文章を読み、問1〜問4に答えよ。字数を指定した問いでは、句読点やかっこも1字として数える。',
    'passages': [
        {'title': '文章1', 'paras': [
            "It is late in the evening. Ms. Ueda, a 58-year-old patient admitted two days ago with pneumonia, is recovering well. While checking the medication records, you notice that she received a dose of an antibiotic this morning that was twice the amount written in the prescription. She shows no signs of harm, and the nurse who gave the dose is a respected colleague with many years of experience. When you mention it to her, she looks shocked and then says quietly, “{u:①:She’s fine, isn’t she? If we report this, it will go on my record, and it won’t change anything for the patient.}” Your senior doctor has already gone home. You are not sure what to do.",
        ]},
        {'title': '文章2', 'paras': [
            "Every doctor will be involved in mistakes. The question is not whether errors happen, but what we do after they happen. {u:②:A culture that treats every error as a personal failure encourages people to hide their mistakes, and hidden mistakes cannot be learned from.} The same error, unreported, may happen again to a patient who is less fortunate.",
            "Reporting an incident is therefore not an act of blame. In well-run hospitals, reports are used to find weak points in the system — a confusing label, a busy shift, two drugs with similar names — rather than to punish individuals. The nurse’s fear is understandable, but it reflects a system that has not yet earned her trust. {u:③:Part of a young doctor’s job is to help build that trust, by showing that reporting is a normal and safe thing to do.}",
            "The patient also has a right to know. Telling Ms. Ueda what happened may feel uncomfortable, especially when no harm was done. Yet patients who learn later that information was kept from them often lose faith in their doctors far more than they would have from the mistake itself. {u:④:Honesty, offered with an apology and a clear explanation, usually strengthens the relationship rather than damaging it.}",
        ]},
    ],
    'qs': [
        {'n': '問1', 'q': '次の文は、文章2の内容を医学生がまとめたものである。空所 (a)〜(e) に補うのにふさわしい語を、下の語群からそれぞれ1つずつ選び、記号で答えよ。各語は一度しか使えない。\nErrors should not be seen as personal (a), because this makes people (b) them. Incident reports should be used to find problems in the (c), not to punish people. Patients have a (d) to know what happened, and an honest explanation usually builds (e) between doctors and patients.',
         'opts': ['system', 'trust', 'failures', 'right', 'hide', 'luck', 'repeat', 'doubts'], 'sheet': 'box', 'sub': [('(a)', ''), ('(b)', ''), ('(c)', ''), ('(d)', ''), ('(e)', '')]},
        {'n': '問2', 'q': '下線部①の看護師の主張を要約し、その主張に対して文章2の筆者ならどのように反論すると考えられるか、100字以内の日本語で述べよ。', 'sheet': 'grid100'},
        {'n': '問3', 'q': '下線部③で筆者が若い医師に求めている役割を、下線部②の内容と関連づけて日本語で説明せよ。', 'sheet': 5},
        {'n': '問4', 'q': '文章1の場面で、あなたが研修医であれば、その夜から翌日にかけてどのように行動するか。看護師・上級医・上田さんそれぞれへの関わり方を含め、文章2の見解に対する自分の考えも示しながら、300字以内の日本語で述べよ。', 'sheet': 'grid300'},
    ],
    'ans': [
        {'n': '問1', 'pts': 20, 'ans': '(a) (C) failures　(b) (E) hide　(c) (A) system　(d) (D) right　(e) (B) trust',
         'short': '(a)C (b)E (c)A (d)D (e)B',
         'exp': '(a)(b) 文章2第1段落 treats every error as a personal failure encourages people to hide their mistakes。(c) find weak points in the system。(d) The patient also has a right to know。(e) strengthens the relationship＝信頼を築く。各4点。'},
        {'n': '問2', 'pts': 18, 'ans': '患者に害はなく、報告すれば自分の記録に残るだけで患者には何も変わらないという主張。筆者なら、報告は個人を責めるためでなく仕組みの弱点を見つけるためで、隠せば同じ誤りが他の患者に再び起こると反論する。',
         'exp': '看護師の主張の要約（害なし・記録に残る・患者に影響なし）と、文章2に基づく反論（報告の目的は処罰でなく再発防止・隠された誤りから学べない）を100字以内で。'},
        {'n': '問3', 'pts': 20, 'ans': '誤りを個人の失敗として責める文化では、人々は誤りを隠し、隠された誤りからは学ぶことができない。そこで若い医師は、自ら誤りを報告することが普通で安全なことだと行動で示し、報告しても責められないという信頼を職場に築いていく役割を担うよう求められている。',
         'exp': '②（責める文化→隠す→学べない）6点、③の役割（報告は普通で安全と示す・信頼を築く）14点。'},
        {'n': '問4', 'pts': 42, 'ans': '（解答例）まず上田さんの状態を確認し、過量投与による影響がないか、必要な検査や観察の指示を確かめる。夜間でも、上級医には電話で事実を伝えて指示を仰ぐ。看護師には、報告は個人を責めるためではなく、ラベルや業務の流れなど仕組みの問題を見つけるためのものだと伝え、一緒に報告書を作ることを提案する。不安な気持ちには理解を示したい。翌日は上級医と相談したうえで、上田さんに何が起きたか、体への影響の見通し、再発防止策をわかりやすく説明し、謝罪する。私は文章2の見解に賛成である。害がなかった誤りこそ、次に害が出る前に仕組みを改善する機会だからだ。ただし、報告した人を守る病院の体制づくりも同時に必要だと考える。',
         'short': '解答例は解説欄参照',
         'exp': '【出題の意図】医療安全（インシデント報告・再発防止）と、患者への誠実な情報開示について、研修医という立場で具体的な行動を考えさせる。\n【採点の観点】①患者の安全確認を最優先している ②上級医への報告・相談をしている ③看護師への配慮と報告の意義の説明 ④患者への説明・謝罪の方針 ⑤文章2への評価が論理的 ⑥字数・構成・表現。\n【注意】「看護師の判断に従い報告しない」「看護師を一方的に責める」解答は評価が低い。研修医が単独で患者に説明するのではなく、上級医と相談して行う点にも配慮があるとよい。'},
    ],
    'tr': [
        '【文章1】夜も遅い時間である。2日前に肺炎で入院した58歳の上田さんは順調に回復している。投薬記録を確認していると、あなたは彼女が今朝、処方に書かれた量の2倍の抗菌薬を投与されていたことに気づく。害の兆候はなく、投与した看護師は経験豊富で信頼の厚い同僚だ。あなたがそれを伝えると、彼女は驚いた様子を見せ、それから静かに言う。「(①) 上田さんは大丈夫でしょう？ 報告したら私の記録に残るし、患者さんにとっては何も変わらないわ」。上級医はすでに帰宅している。あなたはどうすべきかわからない。',
        '【文章2】医師は誰でも誤りにかかわることになる。問題は誤りが起きるかどうかではなく、起きた後に何をするかだ。(②) あらゆる誤りを個人の失敗として扱う文化は、人々に誤りを隠すよう促し、隠された誤りから学ぶことはできない。報告されなかった同じ誤りが、もっと不運な患者に再び起こるかもしれない。',
        'したがって、インシデントを報告することは責める行為ではない。よく運営されている病院では、報告は個人を罰するためではなく、仕組みの弱点――紛らわしいラベル、忙しい勤務帯、名前の似た二つの薬――を見つけるために使われる。看護師の恐れは理解できるが、それは彼女の信頼をまだ得られていない仕組みを反映している。(③) 若い医師の仕事の一部は、報告するのは普通で安全なことだと示すことによって、その信頼を築く手助けをすることである。',
        '患者にも知る権利がある。何が起きたかを上田さんに伝えるのは、特に害がなかった場合には気まずく感じられるかもしれない。しかし、情報を伏せられていたことを後で知った患者は、誤りそのものによるよりもはるかに大きく医師への信頼を失うことが多い。(④) 謝罪とわかりやすい説明を添えた誠実さは、たいてい関係を損なうのではなく強めるのである。',
    ],
    'vocab': [('admit', '入院させる'), ('dose', '投与量'), ('prescription', '処方'), ('respected', '尊敬された'),
              ('record', '記録、経歴'), ('senior doctor', '上級医'), ('unreported', '報告されない'), ('fortunate', '幸運な'),
              ('incident', 'インシデント、出来事'), ('blame', '非難'), ('shift', '勤務帯'), ('earn one’s trust', '〜の信頼を得る'),
              ('keep A from B', 'AをBに隠す'), ('apology', '謝罪')],
}

R = {'no': 2, 'sections': [S1, S2]}
