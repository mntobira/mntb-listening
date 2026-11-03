# -*- coding: utf-8 -*-
# 第2回 V 語彙（書き下ろし）。〔1〕空所補充，〔2〕下線語 {u|…} の同意語。
from mk import Pos, mc
P = Pos(205)
PART = {
 'q1': {'items': [
  mc('A', ['puddle', 'pebble', 'pillar', 'parcel'],
     'puddle は「水たまり」。車が水をはね上げて通り抜けるもの。{c1}「小石」{c2}「柱」{c3}「小包」は splashed through と合わない。', P(),
     text='The car splashed through a ______ and soaked my trousers.'),
  mc('B', ['sneezing', 'shivering', 'staring', 'sighing'],
     'sneeze は「くしゃみをする」。花粉症の症状として，くしゃみが止まらない。{c1}「震える」{c2}「じっと見る」{c3}「ため息をつく」は hay fever（花粉症）の症状として合わない。', P(),
     text='My hay fever is so bad that I can’t stop ______.'),
  mc('C', ['fragile', 'flexible', 'fertile', 'fluent'],
     'fragile は「壊れやすい」。“Handle with care”（取り扱い注意）と書かれる箱の中身。{c1}「柔軟な」{c2}「肥沃な」{c3}「流ちょうな」は文脈に合わない。', P(),
     text='The box says “Handle with care” because the glasses inside are ______.'),
  mc('D', ['dispose', 'dispute', 'display', 'dismiss'],
     'dispose of A は「Aを処分する」。of を伴って「捨てる」の意味になるのは dispose。{c1}「論争する」{c2}「展示する」{c3}「退ける」は of と結びつかない。', P(),
     text='Please ______ of your batteries at the collection point.'),
  mc('E', ['reluctantly', 'eagerly', 'proudly', 'cheerfully'],
     'reluctantly は「しぶしぶ」。“although he had no desire to”（そうしたいとは思わなかったけれども）と合う。{c1}「熱心に」{c2}「誇らしげに」{c3}「快活に」は「したくなかった」と矛盾する。', P(),
     text='He ______ agreed to help, although he had no desire to.'),
 ]},
 'q2': {'items': [
  mc('A', ['clear', 'puzzling', 'distant', 'gentle'],
     'evident は「明らかな」。{c1}「不可解な」は逆に近い。{c2}「遠い」{c3}「穏やかな」は意味が異なる。', P(),
     text='It was {u|evident} from her face that she was upset.'),
  mc('B', ['quit', 'joined', 'criticized', 'visited'],
     'resign は「辞任する」。{c1}「加わった」は逆。{c2}「批判した」{c3}「訪れた」は意味が異なる。', P(),
     text='The coach {u|resigned} after the team lost ten games in a row.'),
  mc('C', ['sufficient', 'missing', 'expensive', 'modern'],
     'adequate は「十分な・適切な」。{c1}「欠けている」は逆に近い。{c2}「高価な」{c3}「現代的な」は意味が異なる。', P(),
     text='The hospital lacked {u|adequate} equipment.'),
  mc('D', ['keep', 'break', 'lower', 'record'],
     'sustain は「維持する・持続させる」。{c1}「壊す」は逆に近い。{c2}「下げる」{c3}「記録する」は意味が異なる。', P(),
     text='It is hard to {u|sustain} a high speed on this mountain road.'),
  mc('E', ['unwilling', 'eager', 'able', 'invited'],
     'be hesitant to do は「〜するのをためらう」。{c1}「熱心な」は逆。{c2}「できる」{c3}「招かれた」は意味が異なる。', P(),
     text='Many people are {u|hesitant} to speak in public.'),
 ]},
}
