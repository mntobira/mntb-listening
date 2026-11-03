# -*- coding: utf-8 -*-
# 第2回 大問3 英文＋英語で答える問題（書き下ろし）。____ は解答者が埋める空所。
PASSAGE = [
 "For more than a century, public libraries in many countries have charged small fines when borrowers return books late. The idea seemed simple: a penalty would encourage people to bring materials back on time, so that others could use them. In recent years, however, more and more libraries have decided to abolish these fines altogether, and the decision has provoked lively debate among librarians, local politicians, and readers.",
 "Supporters of the change argue that fines do more harm than good. The amounts involved are usually small, but for families with limited income, even a modest debt can become a reason to stop visiting the library. Some children, after losing or damaging a single book, are banned from borrowing until the charge is paid, and they may never come back. Librarians have also pointed out that collecting fines takes up staff time that could be spent helping visitors find information or organizing reading programs. In some cases, the cost of processing small payments is almost as high as the money collected.",
 "Libraries that have removed fines often report encouraging results. Many say that former members have returned, and that the number of books brought back has not fallen; in some places it has even risen, because people who were embarrassed about overdue items no longer avoid the building. Instead of charging money, these libraries send friendly reminders and, if an item is kept for a very long time, ask the borrower to replace it.",
 "Critics, however, worry that removing penalties sends the wrong message. They argue that returning borrowed property on time is a basic responsibility, and that without any consequence, some people will keep popular books for months while others wait. Some also fear that the lost income, though small, will make it harder for libraries to buy new materials.",
 "The debate reflects a deeper question about what libraries are for. If they are mainly lenders of property, fines may seem a fair way to protect shared resources. If they are places meant to welcome everyone, especially those with few other sources of books and information, then anything that keeps people away may be too high a price to pay.",
]

QA = {'points': 8, 'lead': 'Fill in the blanks to finish the sentence below.',
      'frame': 'The second paragraph suggests that supporters of the change believe fines can discourage ____ and that collecting them uses up ____.',
      'answers': ['families with little money from continuing to use the library ／ staff time that could be used to help visitors',
                  'poorer families and children from coming back to the library ／ librarians’ working hours, which could go to more useful tasks'],
      'criteria': [('1つ目の空所：収入の少ない家庭（子ども）が図書館に来なくなること', 4), ('2つ目の空所：職員の時間（来館者の手助けなどに使えるはずの時間）', 3),
                   ('文法・語法（discourage A from doing の形など）', 1)],
      'explain': ['第2段落 “for families with limited income, even a modest debt can become a reason to stop visiting the library” と “collecting fines takes up staff time” が根拠。',
                  'discourage は「人に〜する気をなくさせる」。discourage 人 from doing の形で書くと自然。',
                  '本文の文をそのまま写すことは指示で禁じられている。limited income → little money のように言い換える。']}

QB = {'points': 8, 'lead': 'Fill in the blanks to finish the sentence below.',
      'frame': 'The fourth paragraph shows that critics are concerned that, without fines, ____, and that libraries may have less money to ____.',
      'answers': ['some borrowers will hold on to popular books for months while other people are kept waiting ／ purchase new books and other materials',
                  'people will stop feeling responsible for returning what they borrow on time ／ spend on adding to their collections'],
      'criteria': [('1つ目の空所：人気の本を長く返さない人が出る（返却の責任が軽んじられる）', 4), ('2つ目の空所：新しい資料を買う', 3), ('文法・語法（to の後は動詞の原形）', 1)],
      'explain': ['第4段落 “some people will keep popular books for months while others wait” と “make it harder for libraries to buy new materials” が根拠。',
                  '1つ目の空所は that 節の中なので，主語と動詞をそろえた節で書く。',
                  '2つ目の空所は less money to の後なので，動詞の原形（buy / purchase / spend on など）で始める。']}

QC = {'points': 26,
      'stem': 'It is often argued that public facilities such as libraries, museums, and sports centers should be free for everyone and paid for entirely by taxes. Do you agree? Give your view and the reasons for it, using between 70 and 100 words.',
      'criteria': [('主張が明確（賛成・反対の立場を最初に示し，最後まで一貫）', 7), ('理由・具体例が適切で説得力がある（本文の論点を自分の言葉で使ってよい）', 9),
                   ('構成（主張→理由→まとめ，つなぎの語）', 4), ('語彙・文法の正確さ（70〜100語を守る）', 6)],
      'models': [('賛成', 'I agree that public facilities should be free and supported by taxes. Places like libraries and museums give everyone the chance to learn, regardless of how much money their families have. If people have to pay each time, those with low incomes may stop going, just as some families stopped visiting libraries because of small fines. In addition, healthy and well-educated citizens benefit the whole community, so it is reasonable for the whole community to share the cost. Free access is an investment in our future.'),
                 ('反対', 'I do not agree that all public facilities should be completely free. Running a sports center or a museum is expensive, and if everything is paid for by taxes, people who never use these places must still pay for them. A small entrance fee can help facilities maintain their equipment and offer better services. However, discounts should be given to students, older people, and families with low incomes, so that nobody is excluded. In my view, this balanced approach is fairer than making everything free.')],
      'tips': ['最初の1文で立場（agree / disagree）をはっきり書く。両方の立場を並べるだけで終わると主張が不明確で大きく減点。',
               '本文の論点（罰金が利用をためらわせる，収入が減ると資料が買えない）を使ってよいが，本文の文をそのまま写さない。',
               '設問の ‘paid for entirely by taxes’ という条件にも触れると，問いに正面から答えていることが伝わる。',
               '語数は70〜100語。少なすぎても多すぎても減点。数字や調査結果を作り話で書かないこと。']}

TRANSLATION = [
 '1世紀以上にわたり，多くの国の公共図書館は，利用者が本を延滞して返却すると少額の罰金を科してきた。その考え方は単純に思えた。罰則があれば人々は資料を期限どおりに返すようになり，ほかの人が利用できる，というものである。しかし近年，こうした罰金を完全に廃止することに決める図書館が増えており，その決定は図書館員や地元の政治家，読者の間で活発な議論を呼んでいる。',
 'この変更の支持者は，罰金は益よりも害のほうが大きいと主張する。かかわる金額はふつう少額だが，収入の限られた家庭にとっては，わずかな借金でも図書館に通うのをやめる理由になりうる。本を1冊なくしたり傷めたりしただけで，その料金を払うまで貸し出しを禁止される子どももおり，二度と戻ってこないかもしれない。図書館員はまた，罰金の徴収には職員の時間がかかり，その時間は来館者が情報を見つける手助けや読書プログラムの企画に使えるはずだと指摘している。少額の支払いを処理する費用が，集めたお金とほぼ同じくらいになる場合もある。',
 '罰金をなくした図書館は，しばしば心強い結果を報告している。多くの図書館によれば，以前の利用者が戻ってきており，返却される本の数は減っていない。延滞している資料を恥ずかしく思っていた人々がもう建物を避けなくなったため，増えたところさえある。こうした図書館は，お金を取る代わりに丁寧な督促の連絡を送り，資料が非常に長く返されない場合には，借りた人に弁償を求めている。',
 'しかし批判する人々は，罰則をなくすと誤ったメッセージを送ることになると心配している。借りた物を期限どおりに返すのは基本的な責任であり，何の結果も伴わなければ，人気のある本を何か月も手元に置き，その間ほかの人が待たされることになる，と彼らは主張する。また，失われる収入はわずかでも，図書館が新しい資料を買うのを難しくするのではないかと恐れる人もいる。',
 'この議論は，図書館は何のためにあるのかという，より深い問いを反映している。図書館が主として物を貸すところであるなら，罰金は共有の資源を守る公正な方法に思えるかもしれない。図書館が誰をも，とりわけ本や情報を手に入れる手段がほかにほとんどない人々を迎え入れるための場所であるなら，人々を遠ざけるものはどんなものであれ，払うには高すぎる代償かもしれない。',
]

VOCAB = [('fine', '罰金'), ('borrower', '借り手・利用者'), ('penalty', '罰則'), ('abolish', '廃止する'),
         ('provoke', '引き起こす'), ('do more harm than good', '益より害のほうが大きい'), ('modest', 'わずかな'), ('ban A from doing', 'Aが〜するのを禁じる'),
         ('take up ～', '（時間を）とる'), ('process', '処理する'), ('overdue', '期限の過ぎた'), ('reminder', '督促・注意の知らせ'),
         ('consequence', '（行為の）結果'), ('lender', '貸し手'), ('resource', '資源'), ('discourage A from doing', 'Aに〜する気をなくさせる')]

PART = {'passage': PASSAGE, 'qA': QA, 'qB': QB, 'qC': QC, 'translation': TRANSLATION, 'vocab': VOCAB, 'notes': []}
