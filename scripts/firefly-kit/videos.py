"""Adobe Firefly（Firefly Video モデル）で作る、とびら君の動画の一覧（2026-10-24）。

ここが唯一の元データ。build_kit.py がここから
  ・PDF（プロンプト集・設定・参照画像の対応）
  ・動画ごとの画像カード（PNG）
  ・参照画像（緑背景／とびら君だけ透過／クリーム背景）
  ・コピペ用 prompts.txt
  ・docs/FIREFLY_KIT.md（台帳）
を作る。

種類
  motion   … 背景なし（緑で作って透過にする）。いつもの静止画のとびら君の位置で、その場で短く動く。
             → scripts/tobira-motion/import.sh で webm/webp/png に変換（src/components/TobiraMotion.tsx）
  cinema   … 全画面の演出（クリーム色の背景ごと使う・透過しない）。光・紙ふぶきなどの演出はこちら。
             → scripts/firefly-kit/import-cinematic.sh で mp4 に変換（src/components/CinematicClip.tsx）
"""

# ── 全プロンプト共通の固定文（Firefly の上限 175 語に収まるよう短くしてある） ──
CHAR = ("3D cartoon mascot: a blue arched door-frame body with light-blue circuit lines, "
        "a light-blue half-open wooden door with a gold knob on the left side of its face, "
        "a peach face with big brown eyes and a smile, thin blue arms, a yellow pencil in the right hand, "
        "a small yellow triangle in the left hand, short blue legs. Keep the design exactly the same throughout.")

GREEN = ("Solid flat pure chroma-key green background (#00FF00), evenly lit, no shadows, no floor, "
         "no particles, no sparkles, no text. Locked-off static camera, full body centered with margin, "
         "always facing the viewer. Smooth polished Pixar-like animation.")

CREAM = ("Warm cream background (#FBF5E8) with a soft round floor shadow and gentle studio light. "
         "Static camera, character centered and always facing the viewer, nothing covers its face. "
         "Absolutely no text, letters, numbers or symbols. Smooth polished Pixar-like animation.")

# 参照ポーズ（public/mascots/<pose>.webp）
POSES = ['basic', 'bowing', 'cheering', 'good', 'happy', 'listening', 'science', 'sleeping',
         'studying', 'thinking', 'trophy', 'walking']

# 既存動画の1コマ目（クリーム背景の正方形・床の影あり）。撮り直しの First/Last にそのまま使える
CINE_FRAMES = ['title_first', 'attack_first', 'gacha_first', 'victory_first']

# first / last：'green:<pose>' 'cream:<pose>' 'frame:<既存動画の1コマ目>' のどれか。last=None は First だけ
V = []
def add(**kw):
    kw.setdefault('last', kw['first'])
    kw.setdefault('loop', False)
    kw.setdefault('status', 'new')
    V.append(kw)

# ════════════════════════════════════════════════════════════════
# A. 撮り直し（いまアプリで使っている全画面の演出 4本）
# ════════════════════════════════════════════════════════════════
add(id='C01', name='title', kind='cinema', prio='A', status='reshoot', sec='2.5〜3.5',
    first='frame:title_first', last='frame:title_first', cut='0.3 3.2',
    where='起動画面（LaunchScreen.tsx）。最後のコマから静止画の場面へクロスフェード',
    ja='目をパチッと開けて伸び → 正面に手をふる → 後ろで紙ひこうきが2〜3機ゆっくり飛ぶ → 元の立ち姿',
    action=("Title intro: the character blinks awake, does a happy little stretch, then waves hello to the viewer "
            "with the pencil hand. Two small white paper airplanes glide slowly far behind it. "
            "It settles back into the exact same standing pose and place, smiling."),
    note='前回は顔の前に崩れた文字が出て不採用。文字が出たら作り直し。差し替えたら docs/CODEMAP.md の配置％を最後のコマで測り直す')

add(id='C02', name='attack', kind='cinema', prio='A', status='reshoot', sec='3.0（1.15倍で約2.6秒）',
    first='frame:attack_first', last='frame:attack_first', cut='0.8 3.1',
    where='対戦：3問連続正解のコンボ攻撃（ArenaFighters.tsx）。答え合わせの3.5秒に必ず収める',
    ja='きりっと構える → 鉛筆の先が青と金に光る → 前へ踏み込み大きく一振り（光の弧）→ 床に波紋 → ぴょんと戻って元の立ち姿',
    action=("Combo special attack: the character crouches with a determined face, the pencil tip glows blue and gold, "
            "it steps forward and swings the pencil in one big arc leaving a glowing light-blue trail, "
            "a soft ring ripples on the floor, then it hops back to its original friendly standing pose. "
            "It never turns its back to the viewer."),
    note='前回は回転で背中が見えた。今回は「背中を見せない」を明記。長さは取り込みで 2.3〜3.0 秒に切る（テストで 3.5 秒未満を確認）')

add(id='C03', name='gacha', kind='cinema', prio='A', status='reshoot', sec='3.0',
    first='frame:gacha_first', last='frame:gacha_first', cut='0.2 3.0',
    where='ガチャ：開封の共通部分（GachaReveal.tsx）。このあとレア度ごとの動画（C05〜C09）へつなぐ',
    ja='わくわく顔で両手を胸の前に → 顔の扉がゆっくり開き、中から白い光がもれる → 扉を閉じて元の立ち姿（色はつけない＝レア度はこの後で見せる）',
    action=("Gacha opening, anticipation: the character looks excited and holds both hands near its chest, "
            "the door on its face slowly swings open and soft white light glows from inside, "
            "it peeks at the viewer with a playful smile, then the door closes halfway again "
            "and it returns to the same standing pose."),
    note='光の色は白だけ（金・虹は UR 用に取っておく）。手の鉛筆・三角が消えたら作り直し')

add(id='C04', name='victory', kind='cinema', prio='A', status='reshoot', sec='3.5',
    first='frame:victory_first', last='cream:cheering', cut='0.0 3.6',
    where='対戦の勝利画面（BattleResult.tsx）。最後のコマを残して結果を重ねる',
    ja='正面のままジャンプ → 鉛筆を高く上げる → 色とりどりの紙ふぶきがふわっと降る → 着地して応援ポーズで止まる（後ろを向かない）',
    action=("Victory celebration: facing the viewer the whole time, the character jumps up joyfully and raises the pencil high, "
            "soft colorful confetti drifts down around it, it lands with a little bounce and ends in a cheerful "
            "banzai pose with a big smile. It never turns around and there is no spotlight."),
    note='前回は後半で後ろ向きに回り、最後が背中だった。「never turns around」を必ず残す')

# ════════════════════════════════════════════════════════════════
# B. ガチャのレア度別（はずれは地味に短く・UR はとびきり豪華に）
# ════════════════════════════════════════════════════════════════
add(id='C05', name='gacha_n', kind='cinema', prio='A', sec='1.5',
    first='cream:basic', last='cream:basic', cut='0.3 1.6',
    where='ガチャ：N（はずれ）。短く・あっさり（GachaReveal.tsx）',
    ja='扉を少しだけ開けてのぞく → 小さな白い光 → 「まあまあ」と小さくうなずく。演出は最小限',
    action=("Small modest reveal: the character opens the door on its face just a little, a tiny soft white glow appears, "
            "it gives a small easygoing nod and a gentle smile, then returns to the same standing pose. "
            "Calm and simple, no effects."),
    note='はずれは「さっと終わる」のが大事。1.5秒で切る')

add(id='C06', name='gacha_r', kind='cinema', prio='A', sec='2.0',
    first='cream:basic', last='cream:good', cut='0.3 2.3',
    where='ガチャ：R。青い光（GachaReveal.tsx）',
    ja='扉が開いて青い光がふわっと → 小さな青い星が数個 → ウインクしてグッド',
    action=("Rare reveal: the door on its face opens and a soft blue light glows out, "
            "a few small blue stars float up gently, the character winks and gives a thumbs-up to the viewer."),
    note='')

add(id='C07', name='gacha_sr', kind='cinema', prio='A', sec='2.5',
    first='cream:basic', last='cream:happy', cut='0.2 2.7',
    where='ガチャ：SR。紫と銀の光（GachaReveal.tsx）',
    ja='扉が勢いよく開き紫と銀の光の帯 → キラキラが舞う → 両手を上げてよろこぶ',
    action=("Super rare reveal: the door on its face swings open quickly and bands of purple and silver light stream out, "
            "shimmering silver sparkles swirl around, the character throws both arms up and laughs happily."),
    note='')

add(id='C08', name='gacha_ur_build', kind='cinema', prio='A', sec='3.0',
    first='cream:basic', last=None, cut='0.0 3.0',
    where='ガチャ：UR の前半「ため」（GachaReveal.tsx）。画面が暗くなり金色が満ちていく',
    ja='背景が夜空のように暗くなる → とびら君の扉のふちが金色に光りだす → 足元から金色の光の輪が何重にも広がる → 扉のすき間から虹色の光線がもれる（まだ開けない）',
    action=("Ultra rare build-up: the cream background slowly dims to a deep night-blue, the edges of the character's door "
            "begin to glow bright gold, golden rings of light pulse outward from its feet one after another, "
            "and rainbow light beams leak from the gap of the door. The character trembles with excitement, "
            "eyes wide, holding the door knob."),
    note='Last は入れない（First だけ＋Camera: Static）。暗くなっても体の色は変えない。3秒で切り、C09 へつなぐ')

add(id='C09', name='gacha_ur_finale', kind='cinema', prio='A', sec='4.0',
    first='cream:basic', last='cream:trophy', cut='0.0 4.0',
    where='ガチャ：UR の後半「大当たり」（GachaReveal.tsx）。景品＝本（UR プリント）が出てくる',
    ja='扉が全開 → 金と虹の光が噴き出す → 光の中から金色に輝く分厚い本がゆっくり浮かび上がる → とびら君が本を高くかかげる → 金色の紙ふぶき',
    action=("Ultra rare jackpot: the door on its face bursts wide open and brilliant gold and rainbow light pours out, "
            "a thick glowing golden book slowly rises from the light, the character catches it and holds it high above "
            "its head with both hands, golden confetti and twinkling stars rain down, a warm golden glow fills the scene. "
            "Grand and luxurious."),
    note='本の表紙に文字が出たら作り直し（「no text」が効かないときは本を「plain golden cover」と書き足す）')

# ════════════════════════════════════════════════════════════════
# C. そのほかの全画面演出（新規）
# ════════════════════════════════════════════════════════════════
add(id='C10', name='levelup', kind='cinema', prio='B', sec='3.0',
    first='cream:basic', last='cream:cheering', cut='0.2 3.2',
    where='レベルアップ（成長画面・対戦結果）',
    ja='ぐっとしゃがむ → 高くジャンプして空中で正面のままくるっと一回転（横回転はしない）→ 着地すると足元から金の光の柱 → バンザイ',
    action=("Level up: the character crouches, then leaps high and does a quick forward somersault while still facing the viewer, "
            "lands firmly, a pillar of golden light rises from its feet, and it raises both arms in a banzai pose."),
    note='背中が見える回転になったら作り直し')

add(id='C11', name='perfect', kind='cinema', prio='B', sec='3.0',
    first='cream:basic', last='cream:trophy', cut='0.2 3.2',
    where='全問正解（ResultSummary.tsx）',
    ja='目を丸くしておどろく → 頭の上に金のトロフィーが光とともに現れる → 両手でかかげる → 紙ふぶき',
    action=("Perfect score: the character's eyes go wide with surprise, a shining golden trophy appears above its head in a flash of light, "
            "it grabs the trophy and lifts it high with both hands, soft colorful confetti falls."),
    note='トロフィーの形は trophy.webp に近いほど良い')

add(id='C12', name='login_bonus', kind='cinema', prio='B', sec='3.0',
    first='cream:bowing', last='cream:happy', cut='0.2 3.2',
    where='ログインボーナス（その日はじめて）',
    ja='ぺこりとおじぎ → 顔の扉が開き、中から小さなプレゼント箱が出てくる → 箱を差し出してにっこり',
    action=("Daily login gift: the character bows politely, stands up, the door on its face opens and a small wrapped gift box "
            "with a ribbon floats out, the character catches it and offers it toward the viewer with a happy smile."),
    note='')

add(id='C13', name='set_complete', kind='cinema', prio='B', sec='3.0',
    first='cream:basic', last='cream:happy', cut='0.2 3.2',
    where='ガチャのセットがそろったとき（GachaSetsModal.tsx）',
    ja='まわりに丸いメダルが4枚ふわっと集まる → 一つに合わさって大きな金メダルに → とびら君の胸に付いて光る → 誇らしげに胸を張る',
    action=("Collection complete: four small round medals float in from around the character and merge into one big shining gold medal, "
            "which attaches to the character's chest and sparkles, the character puffs out its chest proudly."),
    note='メダルに文字・数字が出たら作り直し')

add(id='C14', name='rank_up', kind='cinema', prio='B', sec='3.0',
    first='cream:walking', last='cream:trophy', cut='0.2 3.2',
    where='ランキング・段位が上がったとき',
    ja='光る階段を3段ぴょんぴょん上る → いちばん上でトロフィーを掲げる',
    action=("Rank up: three glowing light-blue steps appear and the character hops up them one by one, "
            "reaches the top step and lifts a golden trophy high, a soft shine sweeps across."),
    note='')

add(id='C15', name='streak', kind='cinema', prio='B', sec='3.0',
    first='cream:studying', last='cream:cheering', cut='0.2 3.2',
    where='連続学習（7日・30日など）の達成',
    ja='本を読んでいる → ぱたんと閉じて立ち上がる → まわりに7つの小さな光の玉が輪になって回る → ガッツポーズ',
    action=("Study streak: the character is reading a blue book, closes it with a snap and stands up, "
            "seven small glowing orbs of warm light circle around it in a ring, it pumps its fist with a proud grin."),
    note='')

add(id='C16', name='lose_cinema', kind='cinema', prio='C', sec='3.0',
    first='cream:thinking', last='cream:good', cut='0.2 3.2',
    where='対戦の負け（全画面版。背景なしの M04 encourage と好きな方を採用）',
    ja='少ししょんぼり → やわらかい光がさしこむ → 深呼吸してうなずき、グッド',
    action=("Gentle encouragement after a loss: the character looks a little sad with drooping shoulders, "
            "a soft warm ray of light shines in, it takes a deep breath, straightens up, nods and gives a thumbs-up."),
    note='')

# ════════════════════════════════════════════════════════════════
# D. 背景なしモーション（緑で作って、とびら君だけ透過）
# ════════════════════════════════════════════════════════════════
add(id='M01', name='greet', kind='motion', prio='A', sec='3.0', first='green:basic', cut='0.3 3.0',
    where='ホームのとびら君（Home.tsx）：その日はじめて開いたとき',
    ja='まばたき → 正面に2回手をふる → 小さくはねる → 元の立ち姿',
    action=("The character blinks, smiles at the viewer and waves hello with the pencil hand two times, "
            "does a tiny happy bounce, then lowers its arm and settles back into its original standing pose."))
add(id='M02', name='wakeup', kind='motion', prio='A', sec='3.5', first='green:sleeping', last='green:basic', cut='0.5 3.5',
    where='ホーム：3日以上あいて開いたとき（greet の代わり）',
    ja='ねむそうに目を開ける → 目をこする → 伸びをして小さくあくび → 気づいて手をふる',
    action=("The character starts sleepy with closed eyes, slowly opens them, rubs one eye, stretches both arms up with a small yawn, "
            "notices the viewer, smiles and waves, then stands in its friendly standing pose."))
add(id='M03', name='cheer', kind='motion', prio='A', sec='2.5', first='green:basic', cut='0.4 2.5',
    where='ミッション達成スタンプ（MissionToast.tsx）',
    ja='少ししゃがむ → バンザイでジャンプ → ふわっと着地 → 得意げにうなずく',
    action=("The character crouches slightly, jumps up joyfully with both arms raised in a banzai pose, "
            "lands softly with a small squash-and-stretch bounce, gives a proud nod and returns to its standing pose."))
add(id='M04', name='encourage', kind='motion', prio='A', sec='3.0', first='green:thinking', last='green:basic', cut='0.3 3.0',
    where='対戦の負け（BattleResult.tsx）',
    ja='少ししょんぼり → 深呼吸 → ガッツポーズで力強くうなずく',
    action=("The character looks a little disappointed with drooping shoulders, takes a deep breath, straightens up, "
            "makes a determined fist pump with the pencil hand and nods firmly to the viewer with a confident smile."))
add(id='M05', name='think', kind='motion', prio='A', sec='2.4', first='green:thinking', loop=True, cut='0.5 2.4',
    where='全国対戦の相手さがし（BattleMatchingRadar.tsx）：待っている間くり返し',
    ja='あごに手を当てて首を左右にかしげる・目がきょろきょろ（くり返し）',
    action=("The character puts a hand to its chin and thinks, slowly tilts its head left and right, "
            "eyes glancing up and around curiously, a small gentle sway of the body. Seamless loop."))
add(id='M06', name='idle', kind='motion', prio='A', sec='3.0', first='green:basic', loop=True, cut='0.5 3.0',
    where='ホームのとびら君（待機中にときどき）',
    ja='ゆっくり呼吸して体がわずかに上下・1回まばたき・鉛筆を少しゆらす（くり返し）',
    action=("Idle loop: the character breathes slowly so its body rises and falls slightly, blinks once, "
            "and gently sways the pencil, staying in the same friendly standing pose. Seamless loop."),
    note='同じ画像を First/Last に入れると動きが小さくなりやすい（ここはそれで正解）')
add(id='M07', name='correct', kind='motion', prio='A', sec='1.8', first='green:basic', last='green:good', cut='0.2 2.0',
    where='問題に正解したとき（CorrectBurst.tsx の cheering の代わり）',
    ja='ぱっと笑顔 → ウインクしてグッド',
    action=("Quick correct-answer reaction: the character's face lights up, it winks and gives a crisp thumbs-up to the viewer."))
add(id='M08', name='combo', kind='motion', prio='A', sec='2.0', first='green:trophy', cut='0.2 2.2',
    where='2問以上連続正解（CorrectBurst.tsx の trophy の代わり）',
    ja='トロフィーを頭の上で2回ぐっと持ち上げる・満面の笑み',
    action=("The character lifts the golden trophy above its head and pumps it up twice with a huge grin, "
            "a small happy hop, then holds the same pose."))
add(id='M09', name='oops', kind='motion', prio='A', sec='2.0', first='green:thinking', last='green:basic', cut='0.2 2.2',
    where='不正解のとき（はげまし・責めない）',
    ja='「あれ？」と目を丸く → 頭をかいて照れ笑い → 「次いこう」とうなずく',
    action=("Gentle wrong-answer reaction: the character's eyes go round in surprise, it scratches its head with a sheepish smile, "
            "then nods encouragingly to the viewer."))
add(id='M10', name='listen', kind='motion', prio='A', sec='3.0', first='green:listening', loop=True, cut='0.3 3.0',
    where='リスニング音声の再生中（くり返し）',
    ja='ヘッドホンで目を閉じ、リズムに合わせて小さくうなずく・体を左右にゆらす（くり返し）',
    action=("The character wears white headphones, eyes happily closed, nodding gently to a rhythm and swaying side to side. "
            "Seamless loop."),
    note='音符を出させない（緑に混ざる）')
add(id='M11', name='study', kind='motion', prio='B', sec='3.0', first='green:studying', loop=True, cut='0.3 3.0',
    where='学習中・解説を読んでいるとき（くり返し）',
    ja='本を読み、ページを1枚めくってうなずく（くり返し）',
    action=("The character sits reading a blue book, turns one page, nods thoughtfully and keeps reading. Seamless loop."))
add(id='M12', name='nap', kind='motion', prio='B', sec='3.0', first='green:sleeping', loop=True, cut='0.3 3.0',
    where='しばらく操作がないとき・夜の時間帯（くり返し）',
    ja='ふとんの中でゆっくり寝息・ときどきむにゃむにゃ（くり返し）',
    action=("The character sleeps peacefully under its blanket, breathing slowly so the blanket rises and falls, "
            "a tiny sleepy smile. Seamless loop."),
    note='「Zzz」の文字は出させない')
add(id='M13', name='bow', kind='motion', prio='B', sec='2.5', first='green:basic', last='green:basic', cut='0.2 2.6',
    where='はじめての案内（Intro.tsx）・お知らせ',
    ja='ていねいにおじぎ → 顔を上げてにっこり',
    action=("The character bows politely from the waist with closed eyes, holds for a moment, "
            "then straightens up and smiles warmly at the viewer."))
add(id='M14', name='walk', kind='motion', prio='B', sec='2.0', first='green:walking', loop=True, cut='0.2 2.2',
    where='起動画面の歩く場面（LaunchScreen.tsx）（くり返し）',
    ja='その場で元気に足ぶみして歩く（前に進まない・くり返し）',
    action=("The character walks cheerfully in place, swinging its arms, without moving across the frame. Seamless walk cycle loop."))
add(id='M15', name='happy', kind='motion', prio='B', sec='2.5', first='green:happy', cut='0.2 2.7',
    where='ガチャの結果（N・R）・ショップで買えたとき',
    ja='左右にステップして小さくおどる・笑顔',
    action=("The character does a cute little happy dance, stepping left and right and wiggling, laughing with joy, "
            "then returns to the same pose."))
add(id='M16', name='science', kind='motion', prio='C', sec='2.5', first='green:science', loop=True, cut='0.2 2.7',
    where='理科・化学のプリント／実験のテーマ',
    ja='フラスコを軽くふって中の液体が回る → 目を輝かせる（くり返し）',
    action=("The character wearing safety goggles gently swirls the flask so the liquid inside spins, "
            "then looks at it with sparkling curious eyes. Seamless loop."))
add(id='M17', name='ready', kind='motion', prio='B', sec='2.0', first='green:good', last='green:basic', cut='0.2 2.2',
    where='対戦開始の直前（カウントダウン）',
    ja='鉛筆をにぎって「よし！」と構える・力強くうなずく',
    action=("The character grips the pencil, gets into a determined ready stance, and gives one strong nod to the viewer."))
add(id='M18', name='draw', kind='motion', prio='B', sec='2.0', first='green:good', last='green:good', cut='0.2 2.2',
    where='対戦の引き分け',
    ja='肩をすくめて笑う → グッド',
    action=("The character shrugs with a friendly laugh, then gives a thumbs-up to the viewer."))
add(id='M19', name='levelup_jump', kind='motion', prio='B', sec='2.5', first='green:basic', last='green:cheering', cut='0.2 2.7',
    where='レベルアップ（小さく出す場所用。全画面は C10）',
    ja='しゃがむ → 高くジャンプ → バンザイで着地',
    action=("The character crouches, jumps high with excitement and lands in a big banzai pose."))
add(id='M20', name='idea', kind='motion', prio='B', sec='2.0', first='green:thinking', last='green:basic', cut='0.2 2.2',
    where='ヒントを出すとき・解説を開くとき',
    ja='考える → ひらめいて目を見開き、鉛筆を上に向ける',
    action=("The character is thinking, then suddenly gets an idea: eyes open wide, it points the pencil upward with an excited smile."),
    note='電球などの小道具は出させない')
add(id='M21', name='bye', kind='motion', prio='C', sec='2.0', first='green:basic', cut='0.2 2.2',
    where='学習を終えるとき・ログアウト',
    ja='ゆっくり手をふって「またね」',
    action=("The character waves goodbye slowly with a warm smile, then lowers its hand."))
add(id='M22', name='surprise', kind='motion', prio='C', sec='1.5', first='green:basic', cut='0.1 1.6',
    where='時間切れ・タイムアップ',
    ja='びくっと小さくとび上がる → 苦笑い',
    action=("The character is startled and jumps a little in surprise, then gives an awkward smile."))
add(id='M23', name='write', kind='motion', prio='C', sec='2.5', first='green:basic', loop=True, cut='0.2 2.7',
    where='メモ・ミッション一覧（くり返し）',
    ja='鉛筆で空中にすらすら書くしぐさ（線は出さない・くり返し）',
    action=("The character writes in the air with the pencil, little quick strokes, concentrating with a smile. "
            "No lines appear. Seamless loop."))
add(id='M24', name='clap', kind='motion', prio='C', sec='2.0', first='green:happy', cut='0.2 2.2',
    where='フレンドの勝利・ランキング上昇の通知',
    ja='にこにこ拍手',
    action=("The character claps happily several times with a big smile."))


def prompt(v):
    bg = GREEN if v['kind'] == 'motion' else CREAM
    end = ''
    if v['kind'] == 'motion' and not v['loop'] and v['last'] == v['first']:
        end = ' It starts and ends in the exact same pose and position.'
    if v['loop']:
        end = ' The last frame matches the first frame exactly.'
    return f"{CHAR}\n{v['action']}{end}\n{bg}"


def words(s):
    return len(s.split())


# Firefly のプロンプト上限（175語）を超えないこと
for _v in V:
    assert words(prompt(_v)) <= 175, (_v['id'], words(prompt(_v)))
assert len({v['id'] for v in V}) == len(V) and len({v['name'] for v in V}) == len(V)
