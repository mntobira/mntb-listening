# -*- coding: utf-8 -*-
"""問題データ作成の補助。選択問題は「正解を choices[0]（reasons[0]）に書き」，mc1() が指定位置へ移す（正解位置の偏りを防ぐ）。
解説文中のほかの選択肢は {c1}〜{c4} で書くと，並べ替え後の記号 (A)〜(E) に置き換わる。"""
import random, re
L = 'ABCDEFGH'

def balanced(seed, n, k=4):
    rnd = random.Random(seed); out = []
    while len(out) < n:
        b = list(range(k)); rnd.shuffle(b); out += b
    return out[:n]

class Pos:
    """呼ぶたびに 0〜k-1 を返す（k 回ごとに各位置が1回ずつ）。"""
    def __init__(self, seed, k=4): self.seq = balanced(seed, 400, k); self.i = 0
    def __call__(self):
        p = self.seq[self.i]; self.i += 1; return p

_POS = {}
def pos_for(R):
    """回ごとに共通の正解位置列（大問1・2の選択問題を通して偏りなし）"""
    return _POS.setdefault(R, Pos(1000 + int(R)))

def _order(n, pos):
    order = list(range(1, n)); order.insert(pos, 0); return order

def sub(text, order):
    disp = {orig: L[slot] for slot, orig in enumerate(order)}
    return re.sub(r'\{c(\d)\}', lambda m: f'({disp[int(m.group(1))]})', text)

def mc1(no, points, stem, choices, reasons, pos, **kw):
    n = len(choices); assert len(reasons) == n and pos < n
    order = _order(n, pos)
    return dict(no=no, points=points, kind='mc1', stem=stem, choices=[choices[i] for i in order],
                answer=pos, reasons=[sub(reasons[i], order) for i in order], **kw)
