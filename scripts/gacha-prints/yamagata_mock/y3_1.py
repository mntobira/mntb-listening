# -*- coding: utf-8 -*-
# 第3回（2026年度型：1つの大問に新聞記事2本）。記事A＝y3_1a.py・記事B＝y3_1b.py・全訳＝y3_1t.py・設問＝y3_1q.py
from y3_1a import PA
from y3_1b import PB
from y3_1t import TA, TB
from y3_1q import QUESTIONS, VOCAB
P = {
 'title': '長文読解（新聞記事2本）',
 'intro': 'Go through both articles, then answer Q1 to Q8.',
 'passages': [dict(PA, translation=TA), dict(PB, translation=TB)],
 'questions': QUESTIONS,
 'vocab': VOCAB,
}
