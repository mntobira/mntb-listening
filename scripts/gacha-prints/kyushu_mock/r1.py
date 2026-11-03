# -*- coding: utf-8 -*-
# 九州大学 予想問題 第1回（データの組み立て）
from r1_p1 import PART as P1
from r1_p1q import QUESTIONS as Q1
from r1_p2 import PART as P2
from r1_p2q import QUESTIONS as Q2
from r1_p3 import PART as P3
from r1_p3q import QUESTIONS as Q3
from r1_p4 import PART as P4
from r1_p5 import PART as P5

ROUND = {'n': 1, 'date': '2026年11月',
         'P1': {**P1, 'questions': Q1}, 'P2': {**P2, 'questions': Q2}, 'P3': {**P3, 'questions': Q3},
         'P4': P4, 'P5': P5}
