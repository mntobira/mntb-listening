# -*- coding: utf-8 -*-
"""問題データ作成の補助。4択は「正解を choices[0] に書き，解説ではほかの選択肢を {c1}〜{c3} で指す」形で書き，
mc() が指定位置へ正解を移して番号 (1)〜(4) に置き換える（正解位置の偏りを防ぐため）。"""
import random, re

def balanced(seed, n):
    rnd = random.Random(seed); out = []
    while len(out) < n:
        b = [0, 1, 2, 3]; rnd.shuffle(b); out += b
    return out[:n]

class Pos:
    """呼ぶたびに 0〜3 を返す。4回ごとに 0〜3 が1回ずつ出る（偏りなし）。"""
    def __init__(self, seed): self.seq = balanced(seed, 400); self.i = 0
    def __call__(self):
        p = self.seq[self.i]; self.i += 1; return p

def mc(label, choices, why, pos, **kw):
    assert len(choices) == 4, label
    order = [1, 2, 3]; order.insert(pos, 0)
    disp = {orig: slot + 1 for slot, orig in enumerate(order)}
    w = re.sub(r'\{c(\d)\}', lambda m: f'({disp[int(m.group(1))]})', why)
    return dict(label=label, choices=[choices[i] for i in order], answer=pos, why=w, **kw)
