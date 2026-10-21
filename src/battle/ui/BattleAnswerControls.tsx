/** 対戦の解答操作（4択・パネル・かな入力・絵を押して答える）。BattleQuestionView.tsx から分けた。中身は不変。 */
import { type CSSProperties } from 'react';
import { BattleText } from './BattleText';
import { Check, RotateCcw } from 'lucide-react';
import './battle-question.css';
import type { BattleQuestion } from '../core/types';
import { KANA_LAYOUT, kanaTextOf } from '../core/kanaKeyboard';
import { AMBER, GOLD, INK, INK_SUB, LINE, WRONG } from './BattleParts';


/** 正解の色（ライトUIの緑） */
export const CORRECT = '#1E7D46';

// ============================================================
// 選択式（4択・2〜3択・5〜6択）
// ============================================================

/**
 * 選択肢から選ぶ（choice4 と choice の両方）。
 *
 * ★選択肢の数は4つとは限らない★
 * 元データをそのまま出す方針にしたので、
 * 2択（109件）・3択（49件）・5〜6択 もそのまま届く。
 * 「四択に揃えるために誘いを追加する」のは問題を作り直すことなので、やらない。
 *
 * ★列数の決め方★
 *   2択・3択   … 1列（「元素／単体」のような短い対置を横に並べると、
 *                 どちらを選んだのか見違えやすい）
 *   4択以上   … 2列
 *   長い選択肢 … 1列
 *
 * ★もとの2列固定の理由（4択以上では今も同じ）★
 * 縦1列にすると、選択肢が長いとき下2つが画面外になり、
 * スクロールした人だけ不利になる。
 * 2列なら文字数の多い選択肢でも1画面に収まる。
 */
export function ChoiceAnswer({
  question,
  answered,
  locked,
  myChoice,
  reveal,
  onChoose,
}: {
  question: BattleQuestion;
  answered: boolean;
  locked: boolean;
  myChoice: number;
  reveal: boolean;
  onChoose: (index: number) => void;
}) {
  // ★options が空のときに Math.max(...[]) は -Infinity になる★
  // kana 形式は options を持たないので、万一ここに落ちてきても
  // 画面が壊れないように 0 を混ぜておく。
  const longest = Math.max(0, ...question.options.map((o) => o.length));
  const few = question.options.length <= 3;
  const single = longest > 14 || few;
  // ★図つき4択で選択肢が「①」〜「④」だけのとき★ 横一列に並べる（2026-10-01）。
  // 2×2 だと 320×568 で問題が少しスクロールしたため。ボタンの高さは 44px 以上のまま。
  const row4 = !!question.imageUrl && question.options.length === 4 && longest <= 3;

  return (
    <div className={`grid gap-2 ${row4 ? 'grid-cols-4' : single ? 'grid-cols-1' : 'grid-cols-2'}`} data-choice-row={row4 || undefined}>
      {question.options.map((option, i) => {
        const picked = myChoice === i;
        const correct = reveal && i === question.answerIndex;
        const wrongPick = reveal && picked && i !== question.answerIndex;

        // 色の決め方:
        //   正解が見えてよい状態 → 正解を金、自分の誤答を赤
        //   まだ見せない状態     → 自分が押したものだけ金枠
        const border = correct
          ? CORRECT
          : wrongPick
            ? WRONG
            : picked
              ? '#E5B93C'
              : LINE;
        const background = correct
          ? `${CORRECT}14`
          : wrongPick
            ? `${WRONG}12`
            : picked
              ? `${GOLD}40`
              : '#FFFFFF';
        const textColor = correct ? CORRECT : wrongPick ? WRONG : INK;

        return (
          <button
            key={`${question.id}-${i}`}
            type="button"
            disabled={answered || locked}
            onClick={() => onChoose(i)}
            // 英文法・英単語の選択肢は英語そのものなので、一人で学ぶと同じ 15px 太字で読みやすく
            className={`flex min-w-0 min-h-[58px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-center ${(question.subject === 'english_grammar' || question.subject === 'english_vocab') ? 'text-[15px] font-extrabold' : 'text-[13px] font-bold'} leading-snug shadow-sm transition active:scale-[0.97] disabled:active:scale-100`}
            // ★圏外のときだけ薄くする★
            // 解答済み（answered）では自分の選択を見せ続けたいので薄くしない。
            // 押せない理由（圏外）のときは、見た目でも伝わる必要がある。
            style={{
              borderColor: border,
              background,
              color: textColor,
              opacity: locked && !answered ? 0.45 : 1,
            }}
          >
            {correct && <Check size={15} style={{ color: CORRECT }} className="shrink-0" />}
            <span>
              {reveal && (correct || picked) && <span className="mb-1 block text-xs font-black">{correct ? '正しい答え' : 'あなたの回答'}</span>}
              <BattleText text={option} subject={question.subject} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// 文字パネル
// ============================================================

/**
 * 文字パネルを順に押して語を組み立てる。
 *
 * ★手で入力する形式の代わり★
 * 4択だけだと「選択肢を見れば思い出せる」ので、
 * 用語を本当に覚えているかを問えない。
 * 文字パネルは自分で語を組み立てる必要があるため、
 * 手入力に近い手応えを、入力速度に左右されずに出せる。
 *
 * ★必要な文字数が並んだ瞬間に確定する★
 * 「決定」ボタンを押させると、その1タップぶん遅くなる。
 * 制限時間が短いので、その差が点数に出てしまう。
 */
export function PanelAnswer({
  question,
  answered,
  locked,
  myPanel,
  reveal,
  onPush,
  onPop,
}: {
  question: BattleQuestion;
  answered: boolean;
  locked: boolean;
  myPanel: number[];
  reveal: boolean;
  onPush: (index: number) => void;
  onPop: () => void;
}) {
  const need = question.panelOrder.length;
  const correctText = question.panelOrder.map((i) => question.options[i]).join('');
  const myText = myPanel.map((i) => question.options[i]).join('');
  const isCorrect = reveal && myText === correctText;

  return (
    <div className="flex flex-col gap-3">
      {/* 組み立て中の欄 */}
      <div
        className="flex items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-3"
        style={{
          borderColor: reveal ? (isCorrect ? CORRECT : WRONG) : `${GOLD}AA`,
          background: '#FFFFFF',
        }}
      >
        {Array.from({ length: need }).map((_, slot) => {
          const optionIndex = myPanel[slot];
          const filled = optionIndex !== undefined;
          return (
            <span
              key={`slot-${slot}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black"
              style={{
                background: filled ? GOLD : '#F4F1EA',
                color: filled ? INK : INK_SUB,
                border: filled ? 'none' : `2px dashed ${LINE}`,
              }}
            >
              {filled ? question.options[optionIndex] : ''}
            </span>
          );
        })}
      </div>

      {/* 正解の表示（両者が答えた後だけ） */}
      {reveal && !isCorrect && (
        <p className="text-center text-xs font-bold" style={{ color: CORRECT }}>
          こたえ: {correctText}
        </p>
      )}

      {/* 文字パネル */}
      <div className="flex flex-wrap justify-center gap-2">
        {question.options.map((char, i) => {
          const used = myPanel.includes(i);
          return (
            <button
              key={`${question.id}-panel-${i}`}
              type="button"
              disabled={answered || locked || used}
              onClick={() => onPush(i)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-xl font-black shadow-sm transition active:scale-[0.94] disabled:opacity-25 disabled:active:scale-100"
              style={{
                borderColor: LINE,
                background: '#FFFFFF',
                color: INK,
              }}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* 1つ戻す */}
      {!answered && myPanel.length > 0 && (
        <button
          type="button"
          onClick={onPop}
          className="mx-auto flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold"
          style={{ borderColor: LINE, background: '#FFFFFF', color: INK_SUB }}
        >
          <RotateCcw size={13} />
          1つもどす
        </button>
      )}
    </div>
  );
}

// ============================================================
// 五十音キーボード（「みんはや」方式）
// ============================================================

/**
 * 五十音表を1文字ずつ押して用語を書く。
 *
 * -------------------------------------------------------------------
 * ■ 文字パネル（PanelAnswer）との決定的な違い
 * -------------------------------------------------------------------
 * 文字パネルは「答えの文字＋同じ章から借りたダミー3枚」を並べて
 * 選ばせていたので、★並んだ文字を見れば答えが絞れた★
 * （「酸」「化」が並んでいれば答えは酸化しかない）。
 *
 * 五十音キーボードは画面がいつも同じ表なので、ヒントが一切出ない。
 * 「思い出して書く」を、入力速度に左右されずに問える唯一の形になっている。
 *
 * -------------------------------------------------------------------
 * ■ 手打ち入力（IME）ではない
 * -------------------------------------------------------------------
 * アプリが描いたキーを押すだけなので、変換の確定を待つ必要がない。
 * 制限時間が10〜30秒しかないところに日本語IMEを持ち込むと、
 * 端末やIMEの差で実力と関係なく勝敗が決まってしまう。
 *
 * -------------------------------------------------------------------
 * ■ ★「けってい」ボタンを置いている理由（文字パネルとは逆）★
 * -------------------------------------------------------------------
 * 文字パネルは文字数が揃った瞬間に自動で送っていた（1タップぶん速い）。
 * かな入力で同じことをすると壊れる。
 *
 * かな入力の最後の1文字が「゛゜小」で作る文字である語が実測で9つある
 * （ダイヤモン「ド」／ステッ「プ」／アミラー「ゼ」／ヌクレオチ「ド」など）。
 * 文字数が揃った瞬間に送ると、濁点を付ける前の「ダイヤモント」で確定し、
 * ★正しく覚えている人が誤答になる★。
 * そのため、かな入力だけは利用者が「けってい」を押すまで待つ。
 *
 * -------------------------------------------------------------------
 * ■ 文字数のマスを見せている理由
 * -------------------------------------------------------------------
 * 答えが何文字かは出題データに元から入っているので、隠しても
 * 画面の裏側を見れば分かってしまう（隠す意味がない）。
 * それなら見せて「あと何文字か」が分かるようにした方が、
 * 押し間違いに気づけて公平になる。
 */
export function KanaAnswer({
  question,
  answered,
  locked,
  myPanel,
  reveal,
  onPush,
  onPop,
  onCycle,
  onCommit,
}: {
  question: BattleQuestion;
  answered: boolean;
  locked: boolean;
  myPanel: number[];
  reveal: boolean;
  onPush: (index: number) => void;
  onPop: () => void;
  onCycle: () => void;
  onCommit: () => void;
}) {
  const need = question.panelOrder.length;
  const correctText = kanaTextOf(question.panelOrder);
  const myText = kanaTextOf(myPanel);
  const isCorrect = reveal && myText === correctText;
  const full = myPanel.length >= need;
  const disabled = answered || locked;

  return (
    <div className="flex flex-col gap-2.5">
      {/* 書いている途中の欄 */}
      <div
        className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2.5"
        style={{
          borderColor: reveal ? (isCorrect ? CORRECT : WRONG) : `${GOLD}AA`,
          background: '#FFFFFF',
        }}
      >
        {Array.from({ length: need }).map((_, slot) => {
          const key = myPanel[slot];
          const filled = key !== undefined;
          // ★いま書き換えられるのは最後の1文字だけ★
          // 「゛゜小」が効く場所を枠線で示しておくと、
          // どこが変わるのか押す前に分かる。
          const isLast = filled && slot === myPanel.length - 1;
          return (
            <span
              key={`kana-slot-${slot}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black"
              style={{
                background: filled ? GOLD : '#F4F1EA',
                color: filled ? INK : INK_SUB,
                border: filled
                  ? isLast && !answered
                    ? `2px solid ${AMBER}`
                    : '2px solid transparent'
                  : `2px dashed ${LINE}`,
              }}
            >
              {filled ? kanaTextOf([key]) : ''}
            </span>
          );
        })}
      </div>

      {/* 正解の表示（両者が答えた後だけ） */}
      {reveal && !isCorrect && (
        <p className="text-center text-xs font-bold" style={{ color: CORRECT }}>
          こたえ: {correctText}
        </p>
      )}

      {/* ★答え終わった後はキーボードを消す★
          押せないキーを並べたままにすると、
          「反応しない」と受け取られて何度も押されることになる。 */}
      {!answered && !reveal && (
        <>
          {/* 五十音表（5段 × 10行） */}
          <div className="flex flex-col gap-1">
            {KANA_LAYOUT.map((row, r) => (
              <div key={`kana-row-${r}`} className="grid grid-cols-10 gap-1">
                {row.map((key, c) => {
                  if (key === null) {
                    // ★空きマスは詰めずに空けておく★
                    // 詰めると行がずれて、五十音表として読めなくなる。
                    return <span key={`kana-gap-${r}-${c}`} />;
                  }
                  return (
                    <button
                      key={`kana-key-${key}`}
                      type="button"
                      disabled={disabled || full}
                      onClick={() => onPush(key)}
                      className="flex aspect-square items-center justify-center rounded-lg border text-base font-black shadow-sm transition active:scale-[0.9] disabled:opacity-30 disabled:active:scale-100"
                      style={{ borderColor: LINE, background: '#FFFFFF', color: INK }}
                    >
                      {kanaTextOf([key])}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 操作ボタン */}
          <div className="flex items-stretch justify-center gap-2">
            {/* ★濁点・半濁点・小書きは1つのボタンで回す★
                82文字すべてを並べるとスマホで1キーが指より小さくなる。
                押すごとに カ→ガ→カ のように一周して戻るので、
                押しすぎても詰まらない。 */}
            <button
              type="button"
              disabled={disabled || myPanel.length === 0}
              onClick={onCycle}
              className="rounded-xl border-2 px-4 py-2.5 text-sm font-black shadow-sm transition active:scale-[0.95] disabled:opacity-30 disabled:active:scale-100"
              style={{ borderColor: AMBER, background: '#FFFFFF', color: AMBER }}
            >
              ゛゜小
            </button>
            <button
              type="button"
              disabled={disabled || myPanel.length === 0}
              onClick={onPop}
              className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition active:scale-[0.95] disabled:opacity-30 disabled:active:scale-100"
              style={{ borderColor: LINE, background: '#FFFFFF', color: INK_SUB }}
            >
              <RotateCcw size={13} />
              1つけす
            </button>
            {/* ★文字数が揃うまで押せない★
                足りない状態で送ると必ず不正解になるので、
                誤タップで解答権を失わないようにしている。 */}
            <button
              type="button"
              disabled={disabled || !full}
              onClick={onCommit}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-black shadow transition active:scale-[0.95] disabled:opacity-30 disabled:active:scale-100"
              style={{ background: full ? GOLD : LINE, color: INK }}
            >
              <Check size={15} />
              けってい
            </button>
          </div>

          <p className="text-center text-xs font-bold leading-snug" style={{ color: INK_SUB }}>
            だくてん・はんだくてん・ちいさい もじ は
            <span style={{ color: AMBER }}> ゛゜小 </span>
            で つけます
          </p>
        </>
      )}
    </div>
  );
}

/**
 * ★A11：2×2 の絵を、そのまま4つのボタンにする★
 *   1枚の画像を CSS で4分割して表示（画像ファイルは1つのまま＝通信量は同じ）。
 *   左上に ①〜④ の札。押した絵がそのまま答えになる。
 */
export function PictureGridAnswer({ question, split, answered, locked, myChoice, reveal, onChoose }: {
  question: BattleQuestion; split: readonly [number, number]; answered: boolean; locked: boolean;
  myChoice: number; reveal: boolean; onChoose: (index: number) => void;
}) {
  const [cx, cy] = split;
  const cells = [
    { x0: 0, y0: 0, x1: cx, y1: cy }, { x0: cx, y0: 0, x1: 1, y1: cy },
    { x0: 0, y0: cy, x1: cx, y1: 1 }, { x0: cx, y0: cy, x1: 1, y1: 1 },
  ];
  return (
    <div className="bq-picture-grid" role="group" aria-label="絵を選んで答える">
      {cells.map((c, i) => {
        const w = c.x1 - c.x0, h = c.y1 - c.y0;
        const picked = myChoice === i;
        const right = reveal && i === question.answerIndex;
        const wrongPick = reveal && picked && i !== question.answerIndex;
        return (
          <button key={`${question.id}-pic-${i}`} type="button" disabled={answered || locked} onClick={() => onChoose(i)}
            className="bq-picture" data-picked={picked || undefined} data-right={right || undefined} data-wrong={wrongPick || undefined}
            aria-label={`絵 ${question.options[i] || i + 1} を選ぶ`} aria-pressed={picked}
            style={{ opacity: locked && !answered ? 0.45 : 1 }}>
            <span className="bq-picture-img" aria-hidden="true" style={{
              backgroundImage: `url("${question.imageUrl}")`,
              backgroundSize: `${100 / w}% ${100 / h}%`,
              backgroundPosition: `${w >= 1 ? 0 : (c.x0 / (1 - w)) * 100}% ${h >= 1 ? 0 : (c.y0 / (1 - h)) * 100}%`,
              aspectRatio: `${w} / ${h}`,
              '--ar': String(w / h),
            } as CSSProperties} />
            <b className="bq-picture-badge">{question.options[i] || ['①', '②', '③', '④'][i]}</b>
            {right && <span className="bq-picture-tag" data-kind="right"><Check size={14} aria-hidden="true" />正解</span>}
            {wrongPick && <span className="bq-picture-tag" data-kind="wrong">あなた</span>}
          </button>
        );
      })}
    </div>
  );
}
