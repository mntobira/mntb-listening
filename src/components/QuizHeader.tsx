/**
 * =====================================================================
 * 演習画面のヘッダー帯（単元名・スコア・順位・進捗）
 * =====================================================================
 * ■ なぜ Quiz.tsx から切り出したのか
 *   Quiz.tsx の JSX に残っていた「上部の帯」100 行分。
 *   ペイン2つ（ProblemPane / AnswerPane）を切り出したあと、
 *   ここだけが JSX の塊として残っていたので同じ形にそろえた。
 *
 * ■ 動きも見た目も 1 ピクセルも変えていない
 *   JSX は Quiz.tsx にあったものをそのまま移しただけ。
 *   props 名も Quiz.tsx 側の呼び名と同じにしてある。
 *
 * ■ ここを触るときの注意
 *   「入力中だけ隠す」条件（!isDesktop && keyboardVisible）は、
 *   実際の端末でキーボードの占有率を数えて決めたもの。
 *   PC（isDesktop）には一切かからない条件にしてある。
 *   詳しい経緯は下のコメントに残してある。
 */
import { useState } from 'react';
import { ArrowLeft, Lightbulb, Trophy, X } from 'lucide-react';
import { LiveStandingPill } from './LiveStandingPill';

export interface QuizHeaderProps {
  /** 章（単元）の表示名。Quiz.tsx では chapter.abstractTitle を渡している。
   *  （chapter.title ではないので注意。取り違えると帯の見出しが変わる） */
  chapterAbstractTitle: string;
  /** 演習モード（mini_test など）。見た目の色分けに使う。 */
  mode: string;
  /** 画面幅が PC 相当か。true のときは「入力中に隠す」条件がかからない。 */
  isDesktop: boolean;
  /** スマホでソフトキーボードが出ているか。 */
  keyboardVisible: boolean;
  /** 「単元選択に戻る」を押したとき。 */
  handleExit: () => void;
  /** 章の途中経過（点数・コンボ）。 */
  run: { score: number; combo: number; [k: string]: any };
  /** ライブ順位（同じ章を解いている人の中での位置）。無いときは null。 */
  liveStanding: any;
  /** いま何問目か（1 から数えた値）。 */
  progressPosition: number;
  /** 全部で何問か。 */
  progressTotal: number;
  /** この単元で扱う内容（chapter.topics）。解く前・迷ったときに「ポイント」で見られる */
  topics?: string[];
}

export function QuizHeader({
  chapterAbstractTitle,
  mode,
  isDesktop,
  keyboardVisible,
  handleExit,
  run,
  liveStanding,
  progressPosition,
  progressTotal,
  topics = [],
}: QuizHeaderProps) {
  // Quiz.tsx にあったときの呼び名をそのまま残す（下の JSX を書き換えないため）。
  const chapter = { abstractTitle: chapterAbstractTitle };
  /**
   * ★この単元のポイント★（ひとりで学ぶの学びやすさ）
   * 解く前に「何を確かめる単元か」、迷ったときに「どの考え方を使うか」を
   * 問題を離れずに確かめられるようにする。答えは見せない（扱う内容の一覧だけ）。
   */
  const [pointsOpen, setPointsOpen] = useState(false);
  const points = topics.filter((t) => typeof t === 'string' && t.trim()).slice(0, 8);
  return (
    <>
    {/*
      Header (Fixed)

      ★B-3：解答を打っている間だけ、上部の帯を引っ込める★
      ─────────────────────────────────────────────────────
      ご指摘：
        「解答打つ時にこんなに画面塞がれるとしんどい
          (ア) 前へ 1/9 次へ 完了のところは必要だけど、
          それ以外の☑️とか色々消せないの？
          どちらにせよこれだと回答打ちづらい」

      ■ まず画面の占有を、誰が出しているかで分けて数えた
        （いただいた画面／844px 高さ換算）
          アプリのヘッダー（単元名・スコア・1/4）    7%  ← アプリ側
          タイマーバー（残り 6:10）                3%  ← アプリ側
          問題ヘッダー（Q1 問題文・たたむ・全画面）   5%  ← アプリ側
          問題文＋解答欄（★本体★）               25%
          ブラウザの操作バー（< > ↻ ⇧ ⋮）          6%  ← ブラウザ側
          キーボードの ∧ ∨ ☑️ の行                6%  ← ★ブラウザ側★
          かなキーボード本体                      48%  ← ブラウザ側

      ■ ★正直に書きます：☑️ の行はこちらから消せません★
        お尋ねの「☑️とか」の行は、キーボード（IME）と
        ブラウザが出している部分で、Webページ側の CSS や
        JavaScript からは操作できません。合計 60% がここです。
        「消せます」と書くのは嘘になるので書きません。

      ■ できること＝アプリ側の 15%（約126px）を入力中だけ空ける
        ヘッダー・タイマー・問題ヘッダーは、
        文字を打っている最中には読む必要がないものです。
        keyboardVisible の間だけ引っ込めると
          本体 25% → 40%（211px → 337px、約1.6倍）
        になります。

      ■ 消さないもの
        ・「(ア) 前へ 1/9 次へ 完了」バー … 必要と明言されたので残す
        ・入力欄と問題文               … 本体
        ・ヘッダーの中身そのもの         … 消さずに「隠す」だけ。
          「完了」でキーボードが閉じれば即座に元に戻る。
      PC（isDesktop）には一切かからない条件にしてある。
    */}
    <div className={`flex-none px-2 py-1 md:p-6 border-b border-gray-200 bg-white shadow-sm z-10 flex items-center justify-between gap-2 md:gap-4 ${
      !isDesktop && keyboardVisible ? 'hidden' : ''
    }`}>
      <div className="flex items-center text-left gap-2 md:gap-4 min-w-0">
        <button 
          onClick={handleExit}
          title="単元選択に戻る"
          aria-label="単元選択に戻る"
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
        >
          <ArrowLeft size={18} className="md:w-5 md:h-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm md:text-xl font-handwriting text-[#2C3E50] font-bold truncate">
            {chapter.abstractTitle}
          </h2>
          <div className="text-xs text-gray-500 font-bold mt-0.5">
            {mode === 'mini_test' ? '小テスト' : '演習問題'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* 現在順位ピル（臨場感）。
            既存のスコアピル・進捗ピルと同じ「丸いピル」の形・同じ色域にそろえ、
            並べても違和感が出ないようにしている。ゲスト時は standing が null で非表示。 */}
        <LiveStandingPill standing={liveStanding} />

        {points.length > 0 && (
          <button type="button" onClick={() => setPointsOpen(true)} data-unit-points-button
            className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-[#F4D03F]/50 bg-[#FFF9E0] px-2 text-xs font-bold text-[#8a6d00] md:px-3"
            aria-haspopup="dialog" aria-label="この単元のポイントを見る">
            <Lightbulb size={13} aria-hidden="true" />
            <span className="hidden sm:inline">ポイント</span>
          </button>
        )}

        {/* 現在の累積スコアピル（スコア機能の視覚フィードバック） */}
        <div className="flex items-center gap-1.5 bg-[#F4D03F]/15 border border-[#F4D03F]/30 rounded-full px-2 py-1 md:px-3 md:py-1.5" title={`累積スコア / 連続正解 ${run.runningCombo}`}>
          <Trophy size={12} className="text-[#D4A017]" />
          <div className="font-mono font-bold text-[#1B2631] text-xs md:text-sm tabular-nums">
            {run.totalScore}
          </div>
          {run.runningCombo >= 3 && (
            <span className="text-xs font-bold text-orange-500 ml-0.5">🔥{run.runningCombo}</span>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-gray-100 rounded-full px-3 py-1 md:px-4 md:py-1.5 shrink-0">
          <div className="text-xs md:text-sm text-gray-500 font-bold hidden sm:block">進捗</div>
          {/* 分母は「今回解く範囲の問題数」。
              1回分（例：第3回演習）だけを選んで解いているときに
              章全体の 14 が分母になると、あと13回残っているように見えて
              いつまでも終わらない印象になるため。

              ★リスニング（1問ずつモード）では「問」を数える★
              ご要望「問1で1つの進捗、問2で1つの進捗」に合わせ、
              4問ある回では 1/4 → 2/4 → 3/4 → 4/4 と動く。
              以前は4問まとめて1件だったので 1/1 のまま動かず、
              解いた実感がまったく残らなかった。 */}
          <div className="font-mono font-bold text-[#2C3E50] text-xs md:text-base">
            <span className="text-sm md:text-lg">{progressPosition}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span>{progressTotal}</span>
          </div>
        </div>
      </div>
    </div>
    {pointsOpen && (
      <div className="unit-points-backdrop" role="presentation" onClick={() => setPointsOpen(false)}>
        <div className="unit-points" role="dialog" aria-modal="true" aria-labelledby="unit-points-title" data-unit-points onClick={(e) => e.stopPropagation()}>
          <header>
            <Lightbulb size={18} aria-hidden="true" />
            <h3 id="unit-points-title">この単元のポイント</h3>
            <button type="button" onClick={() => setPointsOpen(false)} aria-label="閉じる" autoFocus><X size={18} /></button>
          </header>
          <p className="unit-points-title">{chapter.abstractTitle}</p>
          <ol>{points.map((t, i) => <li key={i}>{t}</li>)}</ol>
          <p className="unit-points-note">迷ったら、どの考え方を使う問題かをここで確かめてから解いてみよう。解説は答えを出したあとに見られます。</p>
          <button type="button" className="unit-points-close" onClick={() => setPointsOpen(false)}>問題にもどる</button>
        </div>
      </div>
    )}
    </>
  );
}
