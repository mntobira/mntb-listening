/**
 * ===================================================================
 * とびら君の「ミニ豆知識」データ
 * ===================================================================
 *
 * ■ なぜコンポーネントから切り出したのか
 * 以前は DoorMascot.tsx の中に文字列配列が直接書かれていて、
 *   ・毎回ランダムに1つ出すだけ（同じものが何度も続く／一生出ないものがある）
 *   ・分野が分からないので「今の自分に関係あるか」が判断できない
 *   ・何種類あるのか、どれを見たのかが分からない
 * という状態だった。
 *
 * 豆知識は「タイトル画面で受け取る、いちばん軽い復習教材」である。
 * そこで単なる文字列ではなく **分野（category）を持つデータ** にして、
 *   ① カテゴリを表示して「何の話か」を一目で分かるようにする
 *   ② 一度見たものを覚えておき、**未読を優先**して出す（＝全部に必ず出会える）
 *   ③ 「何個中いくつ見たか」を出して、集めていく手応えを作る
 * という3つの付加価値を成立させる。
 *
 * ■ 口調のルール（既存のセリフと揃えること）
 *   ・基本は「です・ます」。行動をうながす時だけ「〜しよう」。
 *   ・1文が長くなりすぎないよう、句点で区切って2文までにする。
 *   ・記号や添字は Unicode で完成させて書く（textFormatter を通さない素の <p> に出すため）。
 *
 * ■ 科目（subject）を持たせた理由
 * ある科目の豆知識を別の科目の画面で出しても学習の役に立たない。
 * そこで各豆知識に **どの科目の画面で出してよいか** を持たせ、
 * 画面側が subject を渡してその科目のものだけを出すようにしている。
 *   ・'common' … どの科目でも役に立つ（学習法・試験の作法）
 *   ・教科ID（'english_listening' など） … その科目専用
 * 科目を足すときは、分野（TipCategory）と CATEGORY_SUBJECT に1行ずつ足し、豆知識を並べる。
 */

/** 豆知識の分野。表示用のラベルと絵文字をここで一元管理する。 */
export type TipCategory =
  // ── 科目を問わない試験の作法 ──
  | 'exam'
  // ── 英語リスニングで扱う分野 ──
  | 'listeningBasic'
  | 'listeningSound'
  | 'listeningNumber'
  | 'listeningStrategy'
  | 'listeningTraining';

// 教科IDの型は data/subjects.ts の SubjectKey が唯一の定義
import type { SubjectKey } from './subjects';

/**
 * 画面側が渡してくる「いま開いている科目」。
 * 実体は SubjectKey（アプリ全体で唯一の教科ID定義）。
 */
export type TipSubject = SubjectKey;

/**
 * 豆知識を出してよい範囲。
 *   'common' … どの科目でも出す（マークの読み方など科目に依らない作法）
 *   他       … その科目専用
 */
export type TipSubjectScope = 'common' | TipSubject;

export interface TipCategoryMeta {
  /** 吹き出しに出す短いラベル */
  label: string;
  /** ラベルの先頭につける絵文字 */
  emoji: string;
}

export const TIP_CATEGORIES: Record<TipCategory, TipCategoryMeta> = {
  exam: { label: '共通テスト対策', emoji: '🎯' },
  listeningBasic: { label: 'リスニングの基本', emoji: '🎧' },
  listeningSound: { label: '音の変化', emoji: '🔊' },
  listeningNumber: { label: '数字・図表', emoji: '🔢' },
  listeningStrategy: { label: '解き方の作戦', emoji: '🧭' },
  listeningTraining: { label: '毎日のトレーニング', emoji: '🏃' },
};

/**
 * 分野がどの科目に属するかの対応。
 * 豆知識1件ごとに subject を書き忘れても、分野から自動で決まるようにしておく
 * （＝データ追加時の事故を構造的に防ぐ）。
 */
export const CATEGORY_SUBJECT: Record<TipCategory, TipSubjectScope> = {
  exam: 'common',
  listeningBasic: 'english_listening',
  listeningSound: 'english_listening',
  listeningNumber: 'english_listening',
  listeningStrategy: 'english_listening',
  listeningTraining: 'english_listening',
};

export interface MascotTip {
  /**
   * 既読管理に使う安定した ID。
   * ★並べ替えても既読が壊れないよう、配列の添字ではなく固定の文字列にする★
   * 文言を直しても既読を保ちたいので、ID は内容とは独立に振る。
   */
  id: string;
  category: TipCategory;
  text: string;
  /**
   * どの科目の画面で出すか。
   * 省略時は CATEGORY_SUBJECT から分野に応じて決まる（書き忘れ防止）。
   */
  subject?: TipSubjectScope;
}

export const mascotTips: MascotTip[] = [

  // 選択肢の消去法はリスニングでもそのまま使えるので全科目共通にする
  { id: 't08', category: 'exam', subject: 'common', text: '選択肢問題は「明らかに違う選択肢」から消去。極端な値や単位ミスの選択肢は外しやすい。' },
  { id: 't14', category: 'exam', subject: 'common', text: '「正しいものを選べ」か「誤っているものを選べ」か、設問の指示に必ず印をつけてから解こう。' },

  // ── 🎧 リスニングの基本 ──
  { id: 'ls_ba01', category: 'listeningBasic', text: '共通テストのリスニングは第1問と第2問が2回読み、第3問以降は1回読みです。まずこの差を把握しよう。' },
  { id: 'ls_ba02', category: 'listeningBasic', text: '音声が始まる前の時間で選択肢とイラストに目を通します。問われることが予想できると聞くのが楽になります。' },
  { id: 'ls_ba03', category: 'listeningBasic', text: '英語は文の後半に大事な情報が来ることが多いです。最後まで気を抜かずに聞き切ろう。' },
  { id: 'ls_ba04', category: 'listeningBasic', text: '知らない単語が出ても止まらないことが大切。全体の流れをつかめば答えられる問題が多くあります。' },
  { id: 'ls_ba05', category: 'listeningBasic', text: '内容語である名詞・動詞・形容詞は強く長く読まれます。ここを拾うだけで意味の骨組みが見えます。' },

  // ── 🔊 音の変化 ──
  { id: 'ls_so01', category: 'listeningSound', text: '語の終わりと次の語の始まりはつながって聞こえます。an apple が「アナポゥ」に近くなるのが連結の例です。' },
  { id: 'ls_so02', category: 'listeningSound', text: '似た子音が続くと前の音が落ちます。good time が「グッタイム」に近くなるのが脱落の例です。' },
  { id: 'ls_so03', category: 'listeningSound', text: 't が母音にはさまれると d のように濁ります。water が「ワラー」に近く聞こえるのはこの変化です。' },
  { id: 'ls_so04', category: 'listeningSound', text: '前置詞や代名詞は弱形になって短く読まれます。for や can が消えたように聞こえても慌てないようにしよう。' },
  { id: 'ls_so05', category: 'listeningSound', text: 'アメリカ発音以外も出題されます。イギリス発音では否定の短縮形が「カーント」に近く響きます。' },
  { id: 'ls_so06', category: 'listeningSound', text: 'want to が「ウォナ」、going to が「ゴナ」のように縮めて読まれます。形で覚えておくと拾えます。' },

  // ── 🔢 数字・図表 ──
  { id: 'ls_nu01', category: 'listeningNumber', text: 'thirteen と thirty は強く読まれる位置が違います。後ろが強ければ13、前が強ければ30です。' },
  { id: 'ls_nu02', category: 'listeningNumber', text: '料金や個数の問題は、聞こえた数字をそのまま選ばず、割引や個数をかけた計算まで終わらせよう。' },
  { id: 'ls_nu03', category: 'listeningNumber', text: '時刻の問題では quarter・half・to・past の4語が決め手になります。15分と30分の言い方を押さえよう。' },
  { id: 'ls_nu04', category: 'listeningNumber', text: 'グラフや表の問題では、増えたか減ったか、いちばん大きいのはどれかを先にメモしておこう。' },
  { id: 'ls_nu05', category: 'listeningNumber', text: '数字は聞いた瞬間に問題冊子へ書き取ります。覚えておこうとすると次の音を聞き逃します。' },
  { id: 'ls_nu06', category: 'listeningNumber', text: '単位にも注意しよう。ドルとセント、マイルとキロの違いで選択肢が分かれることがあります。' },

  // ── 🧭 解き方の作戦 ──
  { id: 'ls_st01', category: 'listeningStrategy', text: '選択肢どうしを比べて違う部分に印をつけておくと、その1点だけを聞き分ければよくなります。' },
  { id: 'ls_st02', category: 'listeningStrategy', text: '言い換えに注意しよう。音声の語がそのまま使われている選択肢は、かえって誤りのことがあります。' },
  { id: 'ls_st03', category: 'listeningStrategy', text: 'but や however の後ろに答えが来やすいです。話の向きが変わる合図として聞き取ろう。' },
  { id: 'ls_st04', category: 'listeningStrategy', text: '長い講義形式では、話し手の主張と具体例を分けてメモすると設問に対応しやすくなります。' },
  { id: 'ls_st05', category: 'listeningStrategy', text: '分からない問題は思い切って印をつけて次へ進みます。1問に引きずられると後続もまとめて失います。' },
  { id: 'ls_st06', category: 'listeningStrategy', text: '複数人の会話では、だれの意見かを名前の頭文字でメモすると混ざらずに済みます。' },
  { id: 'ls_st07', category: 'listeningStrategy', text: 'イラスト選択の問題は、絵の違いを先に言葉にしておくのがコツです。位置・数・向きに注目しよう。' },

  // ── 🏃 毎日のトレーニング ──
  { id: 'ls_tr01', category: 'listeningTraining', text: '同じ音声を聞く、原稿で確認する、もう一度聞くの順で使うと、聞き取れない原因がはっきりします。' },
  { id: 'ls_tr02', category: 'listeningTraining', text: 'シャドーイングは音声から少し遅れて声に出す練習。音の変化を体で覚えるのに向いています。' },
  { id: 'ls_tr03', category: 'listeningTraining', text: 'ディクテーションは聞いた英語を書き取る練習。聞き落としている語が目に見えるので弱点探しに効きます。' },
  { id: 'ls_tr04', category: 'listeningTraining', text: 'リスニングは毎日15分の積み上げが効きます。週末にまとめてやるより耳が慣れます。' },
  { id: 'ls_tr05', category: 'listeningTraining', text: '知っている単語でも音を知らなければ聞き取れません。新しい語は必ず音でも覚えよう。' },
  { id: 'ls_tr06', category: 'listeningTraining', text: '倍速で聞いてから等倍に戻すと、本番の速さがゆっくり感じられます。仕上げの練習に向いています。' },
];

/** 総数（吹き出しの「◯／◯個」表示に使う） */
export const TIP_TOTAL = mascotTips.length;

/**
 * 豆知識が実際にどの範囲に属するかを返す。
 * subject が書かれていなければ分野から補う（データ追加時の書き忘れを吸収する）。
 */
export function tipScopeOf(tip: MascotTip): TipSubjectScope {
  return tip.subject ?? CATEGORY_SUBJECT[tip.category];
}

/**
 * 指定した科目の画面で出してよい豆知識だけを返す。
 *
 *   ・'common'       … 常に含める
 *   ・科目専用        … 一致したときだけ含める
 *
 * 科目を渡さない場合は全件返す（既存の呼び出しを壊さないため）。
 */
export function tipsForSubject(subject?: TipSubject): MascotTip[] {
  if (!subject) return mascotTips;
  return mascotTips.filter((tip) => {
    const scope = tipScopeOf(tip);
    return scope === 'common' || scope === subject;
  });
}

