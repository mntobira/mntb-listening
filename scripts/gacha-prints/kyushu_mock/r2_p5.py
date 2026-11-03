# -*- coding: utf-8 -*-
# 第2回〔5〕グラフを説明する英作文（約80語・30点）。市・調査・数値は架空
PART = {
 'points': 30,
 'lead': 'The graph below shows how residents of Tarwick City aged 20 to 39 mainly got their news, in 2015 and in 2025.',
 'chart': {
  'title': 'Main source of news for Tarwick residents aged 20–39 (%)',
  'categories': ['Television', 'Newspapers', 'News websites', 'Social media'],
  'series': [('2015', [41, 17, 27, 15]), ('2025', [19, 6, 30, 45])],
  'max': 50, 'step': 10,
  'source': 'Source: Tarwick City Media Survey（架空の調査・数値はすべて架空）',
 },
 'instruction': 'Describe the main changes shown in the graph, using about **80 words**.',
 'lines': 12,
 'facts': [
  '2015年はテレビが 41% で最も多かったが，2025年は 19% と半分以下になった。',
  'ソーシャルメディアは 15% → 45% と 3 倍になり，2025年に最も多い情報源になった。',
  '新聞は 17% → 6% と大きく減り，2025年は最も少ない。',
  'ニュースサイトは 27% → 30% とほぼ横ばいで，わずかに増えた。',
 ],
 'criteria': [
  ('グラフが何を示しているか（誰の，何の割合を，どの2つの年で）を最初に述べている', 6),
  ('増えたもの（ソーシャルメディア・ニュースサイト）と減ったもの（テレビ・新聞）を数値を挙げて正しく述べている', 12),
  ('最も目立つ変化（順位の入れかわり・3倍・半分以下など）を比較の表現でまとめている', 6),
  ('語彙・文法が正確で，約80語（目安 65〜95語）で書けている', 6),
 ],
 'tips': [
  '問われているのは主な変化の説明。グラフにない理由を書く場合は，最後に1文だけにとどめる。',
  'tripled（3倍になった）/ fell by more than half（半分以上減った）/ remained almost unchanged（ほぼ変わらなかった）など，変化の大きさを表す動詞を使い分ける。',
  '「最も多い」の入れかわりは replaced television as the most common source などで1文にまとめる。',
  '4項目すべてに触れてよいが，変化の大きいものから順に書くと読みやすい。',
 ],
 'models': [
  ('変化の大きい順にまとめる',
   '何のグラフか → ソーシャルメディアが3倍で最多に → テレビは半分以下 → 新聞の減少とニュースサイトの横ばい',
   "The graph compares the main news sources of Tarwick residents aged 20 to 39 in 2015 and 2025. The biggest change is the rise of social media, which tripled from 15% to 45% and became the most common source. In contrast, television, the top source in 2015 at 41%, fell to just 19%. Newspapers also dropped sharply, from 17% to 6%. Only news websites remained fairly stable, rising slightly from 27% to 30%."),
  ('増えたもの・減ったものに分けてまとめる',
   '何のグラフか → 減った2つ（テレビ・新聞）→ 増えた2つ（ソーシャルメディア・ニュースサイト）→ 一言のまとめ',
   "This graph shows how young adults in Tarwick City got their news in 2015 and 2025. Traditional media lost much of their audience. Television fell by more than half, from 41% to 19%, and newspapers declined from 17% to only 6%. On the other hand, online sources grew. Social media jumped from 15% to 45%, while news websites increased a little to 30%. Overall, people in this age group now rely mainly on the internet for news."),
 ],
 'model_ja': [
  'このグラフは，タービック市の20〜39歳の住民の主な情報源を，2015年と2025年で比べたものである。最も大きな変化はソーシャルメディアの伸びで，15%から45%へと3倍になり，最も多い情報源になった。対照的に，2015年に41%で首位だったテレビは，わずか19%に下がった。新聞も17%から6%へと大きく減った。ニュースサイトだけはほぼ安定しており，27%から30%へとわずかに増えた。',
 ],
}
