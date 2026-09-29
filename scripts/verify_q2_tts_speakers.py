"""まとめ録りの音声が「ちゃんと3人の声になっているか」を実測で判定する。

使い方:
    python3 scripts/verify_q2_tts_speakers.py \
        .tmpwork/tts/batch02.mp3 \
        .tmpwork/tts/batch02_words.json \
        scripts/data/q2_tts_batches/batch02.json

    第4引数で「何秒以上の区間を使うか」を変えられる（既定 0.8 秒）。

★なぜ耳ではなく実測なのか★
  聞き取り検証ツール（analyze_media_content）は
  「ナレーターが女性役と同じ声だから録り直しが必要」と報告したが、
  ★同じ応答の中で「音声ファイルが渡されていない」とも述べており、
    判定の根拠が無かった。★
  録り直しはクレジットを消費し、良い音源を捨てる危険もあるため、
  数値で確かめてから判断する。

★前に使っていた基準（ナレーター内 − ナレーターと相手 ≧ 0.03）は捨てた★
  「ナレーター内の類似度」は区間が短いほど下がるという性質がある。
  batch02 のナレーターは "Number one." のような1秒前後の区間を多く含むため
  ナレーター内が 0.9604 まで落ち、差が +0.0096 しか出ず
  「同一人物の疑い」と誤判定された。
  つまりこの基準では「声が似ている」のか「区間が短い」のか区別できない。
  （実際 batch02 は下の方法で 7/7 = 100% 分離できていた）

★今の方法（一つ抜き最近傍法）★
  区間を1つ抜き、残りから作った3役の重心のうちどれに最も近いかを当てる。
  声が本当に3人なら、抜いた区間は自分の役に戻るはず。
  「当たった率」で見るので、区間の長さのバラつきに強い。

★判定★
  ナレーターの正答率が
    80% 以上 … 3人目として分離できている（合格）
    60〜80%  … 分離は弱いが別人として機能する
    60% 未満 … 同一人物の疑い。録り直しを検討
  でたらめに当てた場合は約 33% になる（3役なので）。

★実測の記録★
  batch01（Daniel）… ナレーター 7/7 = 100%  全体 26/29 = 89.7%
                      F0: ナレーター 173.7 / 女性役 220.9 / 男性役 107.0 Hz
  batch02（Daniel）… ナレーター 7/7 = 100%  全体 26/29 = 89.7%
                      F0: ナレーター 205.2 / 女性役 197.5 / 男性役 122.3 Hz
  ※ batch02 はナレーターと女性役の「声の高さ」が近い（205 vs 198）が、
     声質では 100% 分離できている。
     ★声の高さだけで判断すると誤判定する★という実例。
"""
import json, sys
import numpy as np
import librosa

audio_path, words_path, batch_json = sys.argv[1], sys.argv[2], sys.argv[3]
MIN_SEG = float(sys.argv[4]) if len(sys.argv) > 4 else 0.8

words = json.load(open(words_path))['words']
spec = json.load(open(batch_json))
role_of = {'Speaker 1': 'female', 'Speaker 2': 'male', 'Speaker 3': 'narrator'}
script_lines = []
for q in spec['questions']:
    script_lines.append(('narrator', q['marker']))
    for ln in q['lines']:
        sp, txt = ln.split(':', 1)
        script_lines.append((role_of[sp.strip()], txt.strip()))

def norm(s):
    return ''.join(c.lower() for c in s if c.isalnum())

wlist = [w for w in words if norm(w.get('text', ''))]
segs, wi = [], 0
for role, text in script_lines:
    toks = [norm(t) for t in text.split() if norm(t)]
    if not toks:
        continue
    found = next((p for p in range(wi, min(wi + 10, len(wlist)))
                  if norm(wlist[p]['text']).startswith(toks[0][:4])), wi)
    end_i = max(found, min(found + len(toks), len(wlist)) - 1)
    segs.append((role, float(wlist[found]['start']), float(wlist[end_i]['end'])))
    wi = end_i + 1

y, sr = librosa.load(audio_path, sr=22050)
X, Yl, durs = [], [], []
for role, st, en in segs:
    if en - st < MIN_SEG:
        continue
    a = y[int(st * sr):int(en * sr)]
    if len(a) < sr // 2:
        continue
    m = librosa.feature.mfcc(y=a, sr=sr, n_mfcc=20)
    X.append(np.concatenate([m.mean(axis=1), m.std(axis=1)]))
    Yl.append(role)
    durs.append(en - st)
X = np.array(X)
Yl = np.array(Yl)
roles = ['narrator', 'female', 'male']

print(f'--- {audio_path} （{MIN_SEG}秒以上の区間のみ）---')
print('【区間数】', {r: int((Yl == r).sum()) for r in roles},
      f'／ 長さ 平均 {np.mean(durs):.2f}秒 最短 {min(durs):.2f}秒')

# F0
print('【声の高さ F0中央値(Hz)】')
for r in roles:
    f0s = []
    for (role, st, en) in segs:
        if role != r or en - st < MIN_SEG:
            continue
        a = y[int(st * sr):int(en * sr)]
        if len(a) < sr // 2:
            continue
        f0s.append(np.median(librosa.yin(a, fmin=60, fmax=400, sr=sr)))
    print(f'  {r:9s} {np.median(f0s):6.1f}')

# 一つ抜き最近傍（重心）
def cos(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

hit = {r: [0, 0] for r in roles}
confusion = {r: {c: 0 for c in roles} for r in roles}
for i in range(len(X)):
    cents = {}
    for r in roles:
        idx = [j for j in range(len(X)) if Yl[j] == r and j != i]
        if idx:
            cents[r] = X[idx].mean(axis=0)
    pred = max(cents, key=lambda r: cos(X[i], cents[r]))
    true = Yl[i]
    hit[true][1] += 1
    confusion[true][pred] += 1
    if pred == true:
        hit[true][0] += 1

print('【一つ抜き最近傍：区間を自分の役に当てられたか】')
for r in roles:
    ok, n = hit[r]
    print(f'  {r:9s} {ok}/{n} = {ok/n*100:5.1f}%   誤答先: ' +
          ', '.join(f'{c}={confusion[r][c]}' for c in roles if c != r and confusion[r][c]))
tot_ok = sum(hit[r][0] for r in roles)
tot_n = sum(hit[r][1] for r in roles)
acc = tot_ok / tot_n
print(f'  全体 {tot_ok}/{tot_n} = {acc*100:.1f}%  （でたらめなら約33%）')

nacc = hit['narrator'][0] / hit['narrator'][1]
print('【判定】')
if nacc >= 0.8:
    print(f'  ナレーターの正答率 {nacc*100:.1f}% → ★3人目として分離できている★')
elif nacc >= 0.6:
    print(f'  ナレーターの正答率 {nacc*100:.1f}% → 分離は弱いが別人として機能する')
else:
    print(f'  ナレーターの正答率 {nacc*100:.1f}% → ★同一人物の疑い。録り直しを検討★')
