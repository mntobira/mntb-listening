/**
 * ===================================================================
 * 対戦モード: 出題と解答の画面
 * ===================================================================
 *
 * ■ 解答形式を1画面で扱う
 *   choice4 … 4つの選択肢から選ぶ（元から4択の問題）
 *   choice  … 2〜3択・5〜6択（元データがその数で作られている問題）
 *   kana    … 五十音キーボードで1文字ずつ押して書く（「みんはや」方式）
 *   word    … 4つの語句カードから選ぶ（元が短答・記述／現在は停止中）
 *   panel   … 文字パネルを順に押して語を組み立てる（現在は停止中）
 *
 * ★手で入力する形式を1つも作っていない★
 * 制限時間が10〜30秒しかないところに日本語IMEの変換が入ると、
 * 端末やIMEの差で実力と関係なく勝敗が決まってしまう。
 * 「押すだけ」で答えられる形に統一している。
 * 五十音キーボード（kana）も ★アプリが描いたキーを押す★ 方式なので、
 * 変換の確定を待つ必要がなく、この方針から外れていない。
 *
 * -------------------------------------------------------------------
 * ■ 選択式とかな入力を混ぜて出す
 * -------------------------------------------------------------------
 * 利用者の指定は「1文字ずつ押していく方式をもっと入れてほしい。
 * ただし全ての問題をそうしなくてよい。四択問題も含めて」だった。
 * 何割をかな入力にするかは ルールの kanaShare（既定 0.3）で決まり、
 * この画面は ★1問ごとに question.format を見て出し分けるだけ★ にしている。
 *
 * -------------------------------------------------------------------
 * ■ 答えた直後に正解を見せない
 * -------------------------------------------------------------------
 * 相手がまだ考えている間に自分の画面で正解が分かると、
 * 画面を見せ合える環境（教室・通話）で不正ができてしまう。
 * ★両者が答えるか締切が来るまで、正解は隠す。★
 * 自分が押した選択肢だけを「選択中」として示す。
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BattleText } from './BattleText';
import { Check, CircleCheck, CircleX, Hourglass, RotateCcw, Play, Pause, Info } from 'lucide-react';
import { PICTURE_GRID_SPLITS } from '../data/pictureGrid.generated';
import './battle-question.css';

import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import type { BattleQuestion } from '../core/types';
import { KANA_LAYOUT, kanaTextOf } from '../core/kanaKeyboard';
import { AMBER, GOLD, INK, INK_SUB, LINE, TimeBar, WRONG } from './BattleParts';

/** 正解の色（ライトUIの緑） */
const CORRECT = '#1E7D46';

/** 空欄の目印（生成スクリプトと同じ文字列） */
const BLANK_MARK = '［　？　］';

interface Props {
  question: BattleQuestion;
  /** 何問目か（0始まり） */
  index: number;
  total: number;
  remainMs: number;
  /**
   * この問の制限時間（秒）。
   *
   * ★question.timeLimit をそのまま使ってはいけない★
   * 実際の制限時間は core/battleCore.ts の resolveTimeLimit が決める
   * （ルールの上書きや一律の倍率がかかる）。バーの分母だけプールの素の
   * 秒数を見ると、残り時間が分母を超えてバーがはみ出す。
   * 呼ぶ側（useBattleRoom / useAiBattle）はもともと resolveTimeLimit を
   * 呼んでいるので、その値をそのまま渡してもらう。
   * 省略時は question.timeLimit（古い呼び出しを壊さないため）。
   */
  limitSec?: number;
  answered: boolean;
  /**
   * 解答の受付を止めているか（★answered とは別の意味★）。
   *
   * answered は「自分がもう答えた」。
   * locked は「いま押しても解答として残らない」。
   * 圏外がこれに当たる。Firestore は圏外でも書き込みを端末に溜め、
   * 画面上は解答済みに見えるのに、通信が戻ったときには締切を過ぎていて
   * ルールに拒否される（＝答えたのに消える）。
   *
   * 2つを同じ値で扱うと「答えたのか、押せないだけなのか」が
   * 画面から区別できなくなるので、別の prop にしている。
   */
  locked?: boolean;
  /** 自分が選んだ選択肢 */
  myChoice: number;
  /** 自分が押したパネル／キーの順 */
  myPanel: number[];
  /** 正解を見せてよい状態か（両者解答済み／締切後） */
  reveal: boolean;
  onChoose: (index: number) => void;
  onPushPanel: (index: number) => void;
  onPopPanel: () => void;
  /** かな入力: 最後の1文字を「゛゜小」で切り替える */
  onCyclePanel: () => void;
  /** かな入力: 「けってい」 */
  onCommitKana: () => void;
}

export function BattleQuestionView({
  question,
  index,
  total,
  remainMs,
  answered,
  locked = false,
  myChoice,
  myPanel,
  reveal,
  onChoose,
  onPushPanel,
  onPopPanel,
  onCyclePanel,
  onCommitKana,
  limitSec,
}: Props) {
  const theme = subjectTheme(question.subject as SubjectKey);
  const effectiveLimitSec = limitSec ?? question.timeLimit;
  const isInput = question.format === 'kana' || question.format === 'panel';
  const hasAnswer = answered && (isInput ? myPanel.length > 0 : myChoice >= 0);
  const correct = hasAnswer && (isInput
    ? myPanel.length === question.panelOrder.length && myPanel.every((key, i) => key === question.panelOrder[i])
    : myChoice === question.answerIndex);
  const answerText = (panel: number[], choice: number) => question.format === 'kana'
    ? kanaTextOf(panel)
    : question.format === 'panel' ? panel.map(i => question.options[i] || '').join('')
    : question.options[choice] || '';
  const feedbackColor = correct ? CORRECT : hasAnswer ? WRONG : INK_SUB;
  // 2×2 の絵で答える問題か（区切り位置が分かっている絵だけ）
  const pictureGrid = question.imageUrl && question.options.length === 4 && question.format !== 'kana' && question.format !== 'panel'
    ? PICTURE_GRID_SPLITS[question.imageUrl] : undefined;
  const isListening = question.subject === 'english_listening';
  // 「（話者：女性（管理人））」のように、問題文の中身がすでに設問（label）に含まれているときは出さない（重複をなくす）
  const promptCore = (question.prompt || '').trim().replace(/^[（(]/, '').replace(/[）)]$/, '').replace(/^話者[:：]\s*/, '');
  const promptDuplicatesLabel = isListening && promptCore.length > 0 && (question.label || '').includes(promptCore);
  // 逆向きの重複：問題文の末尾に「Question: 〜」として設問と同じ英文が入っていることがある（太字の設問と2回出る）。
  //   その部分だけ落として、場面の説明（話者・場面）は残す。
  const labelText = (question.label || '').trim();
  const promptShown = isListening && labelText.length > 8 && (question.prompt || '').includes(labelText)
    ? (question.prompt || '').replace(labelText, '').replace(/\s*Question[:：]\s*$/i, '').trim()
    : (question.prompt || '');

  return (
    <section id="battle-question" className="flex min-w-0 flex-1 flex-col">
      {/* 進捗と残り時間 */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-black" style={{ color: INK_SUB }}>
            <span style={{ color: '#B7791F' }} className="text-base tabular-nums">
              {index + 1}
            </span>
            <span className="mx-0.5">/</span>
            {total}もん
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-black"
            style={{ background: `${theme.accent}26`, color: theme.accent }}
          >
            {formatLabel(question.format, question.options.length)}
          </span>
        </div>
        <TimeBar remainMs={remainMs} limitSec={effectiveLimitSec} />
      </div>

      {question.subject === 'english_listening' && <BattleListeningAudio
        key={question.id} src={question.audioUrl} stopped={answered || reveal} />}

      {/* 問題文 */}
      <article
        tabIndex={0}
        aria-label="問題文（長い場合はスクロール）"
        className={`arena-question-prompt rounded-2xl border-2 ${pictureGrid ? 'mb-2 px-3 py-2' : 'mb-3 px-4 py-3.5'}`}
        data-picture-grid={pictureGrid ? '' : undefined}
        style={{
          borderColor: `${theme.accent}44`,
          background: theme.surface,
        }}
      >
        {promptShown && !(isListening && pictureGrid) && !promptDuplicatesLabel && (
          <p
            className="bq-scene mb-2 whitespace-pre-wrap text-[13px] leading-relaxed"
            style={{ color: INK_SUB }}
            data-long={isListening && promptShown.length > 24 ? '' : undefined}
            onClick={(e) => e.currentTarget.toggleAttribute('data-open')}
          >
            {/* 低い画面ではたたんだとき1行で読めるよう、改行をつめた版も持っておく */}
            <span className="bq-scene-full">{renderWithBlank(promptShown, question.subject)}</span>
            <span className="bq-scene-line" aria-hidden="true">{promptShown.replace(/\s+/g, ' ')}</span>
          </p>
        )}
        <p className="text-[15px] font-bold leading-relaxed" style={{ color: INK }}>
          <BattleText text={question.label} subject={question.subject} />
        </p>
        {/* ★図・絵★（リスニング第1問B・第2問の「絵を選ぶ」問題、図つきの問題）
            以前は対戦画面が画像を描かなかったため、絵を選ぶ問題は対戦に入れられなかった。
            ★A11：2×2 に並んだ絵は、絵そのものを押して答える（下の①〜④ボタンは出さない）★ */}
        {question.imageUrl && !pictureGrid && (
          <BattleFigure key={question.id} src={question.imageUrl} picture={question.subject === 'english_listening'} />
        )}
      </article>

      {reveal && (
        <div role="status" aria-live="polite" aria-atomic="true" data-answer-feedback
          className="mb-3 rounded-2xl border-2 px-4 py-3"
          style={{ borderColor: feedbackColor, background: correct ? '#ECFDF3' : hasAnswer ? '#FFF1F2' : '#F5F5F4', color: feedbackColor }}>
          <p className="flex items-center gap-2 text-xl font-black">
            {correct ? <CircleCheck size={26} /> : hasAnswer ? <CircleX size={26} /> : <Hourglass size={26} />}
            {correct ? '正解！' : hasAnswer ? '不正解' : '未回答・時間切れ'}
          </p>
          <p className="mt-1 text-sm font-bold">あなたの回答：{hasAnswer
            ? <BattleText text={answerText(myPanel, myChoice)} subject={question.subject} />
            : '回答が確定されていません'}</p>
          <p className="mt-1 text-sm font-bold" style={{ color: CORRECT }}>正しい答え：
            <BattleText text={answerText(question.panelOrder, question.answerIndex)} subject={question.subject} />
          </p>
        </div>
      )}

      {/* 解答欄 */}
      {question.format === 'kana' ? (
        <KanaAnswer
          question={question}
          answered={answered}
          locked={locked || reveal}
          myPanel={myPanel}
          reveal={reveal}
          onPush={onPushPanel}
          onPop={onPopPanel}
          onCycle={onCyclePanel}
          onCommit={onCommitKana}
        />
      ) : question.format === 'panel' ? (
        <PanelAnswer
          question={question}
          answered={answered}
          locked={locked || reveal}
          myPanel={myPanel}
          reveal={reveal}
          onPush={onPushPanel}
          onPop={onPopPanel}
        />
      ) : pictureGrid ? (
        <PictureGridAnswer
          question={question}
          split={pictureGrid}
          answered={answered}
          locked={locked || reveal}
          myChoice={myChoice}
          reveal={reveal}
          onChoose={onChoose}
        />
      ) : (
        <ChoiceAnswer
          question={question}
          answered={answered}
          locked={locked || reveal}
          myChoice={myChoice}
          reveal={reveal}
          onChoose={onChoose}
        />
      )}

      {/* 待ちの案内 */}
      {answered && !reveal && (
        <p
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold"
          style={{ color: INK_SUB }}
        >
          <Hourglass size={13} className="animate-pulse" />
          あいてを まっています
        </p>
      )}
    </section>
  );
}

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
function ChoiceAnswer({
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

  return (
    <div className={`grid gap-2 ${single ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
            className="flex min-w-0 min-h-[58px] items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-center text-[13px] font-bold leading-snug shadow-sm transition active:scale-[0.97] disabled:active:scale-100"
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
function PanelAnswer({
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
function KanaAnswer({
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

// ============================================================
// 表示のヘルパ
// ============================================================

/**
 * 画面右上の形式バッジの文言。
 *
 * ★選択肢の数をそのまま書く★
 * 2択なのに「4つから えらぶ」と出ていると、
 * 「選択肢が消えている＝壊れている」と誤解される。
 */
function formatLabel(format: string, optionCount: number): string {
  if (format === 'kana') return 'もじを 1つずつ おす';
  if (format === 'word') return 'ことばを えらぶ';
  if (format === 'panel') return 'もじを ならべる';
  if (optionCount > 0) return `${optionCount}つから えらぶ`;
  return 'えらぶ';
}

/**
 * 問題文の中の空欄を目立たせる。
 *
 * ★空欄を強調する理由★
 * 穴埋め問題は「長い文のどこか1箇所」を答える形なので、
 * どこを答えるのかが一目で分からないと、
 * 文章を読み直す時間だけで制限時間を使ってしまう。
 */
function renderWithBlank(text: string, subject: string): ReactNode {
  const parts = text.split(/(［\s*(?:？|[A-Za-zＡ-Ｚａ-ｚア-ン])\s*］)/u);
  if (parts.length === 1) return <BattleText text={text} subject={subject} />;
  return parts.map((part, i) => i % 2 === 1 ? (
    <mark
      key={`blank-${i}`}
      data-answer-blank
      aria-label={part === BLANK_MARK ? '解答する空欄' : `空欄${part.slice(1, -1).trim()}`}
      className="mx-0.5 inline-block rounded px-1.5 py-0.5 text-[13px] font-black"
      style={{ background: GOLD, color: INK }}
    >
      {part.slice(1, -1).trim()}
    </mark>
  ) : <BattleText key={`part-${i}`} text={part} subject={subject} />);
}

/**
 * Audio-only battle player. No script or scene hint enters the answering DOM.
 *
 * ★A10：高さ約40pxの自前プレーヤー（2026-09-30）★
 *   ブラウザ標準の <audio controls> は端末ごとに大きさが違い、注意書きと合わせて約110pxあった。
 *   ［▶／❚❚］＋進み具合のバー＋状態1語、の1行にする。注意書きは (i) を押したときだけ出す。
 */
function BattleListeningAudio({ src, stopped }: { key?: string; src?: string; stopped: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState('読み込み中');
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [info, setInfo] = useState(false);
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    let disposed = false;
    if (stopped) el.pause();
    else el.play().catch(() => {
      if (!disposed) setStatus('▶を押して再生');
    });
    return () => { disposed = true; el.pause(); };
  }, [src, stopped]);
  if (!src) return <p role="alert">この問題の音源を読み込めませんでした。</p>;
  const toggle = () => {
    const el = audio.current;
    if (!el || stopped) return;
    if (failed) { el.load(); }
    if (el.paused) el.play().catch(() => setStatus('音量を確認して再生'));
    else el.pause();
  };
  return <section className="battle-listening-audio bqa" aria-label="対戦の音源">
    <button type="button" className="bqa-play" onClick={toggle} disabled={stopped}
      aria-label={playing ? '音源を一時停止' : failed ? '音源を再読み込みして再生' : '音源を再生'}>
      {playing ? <Pause size={18} aria-hidden="true" /> : failed ? <RotateCcw size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
    </button>
    <span className="bqa-track" aria-hidden="true"><i style={{ width: `${progress}%` }} /></span>
    <span className="bqa-status" role="status">{stopped ? '解答終了' : status}</span>
    <button type="button" className="bqa-info" onClick={() => setInfo(v => !v)} aria-expanded={info} aria-label="音源の注意を表示"><Info size={16} aria-hidden="true" /></button>
    {info && <p className="bqa-note">音源の再生中・停止中も制限時間は進みます。聞こえないときは端末の音量を確認してください。</p>}
    <audio ref={audio} src={src} preload="auto"
      onPlaying={() => { setFailed(false); setPlaying(true); setStatus('再生中'); }}
      onPause={() => { setPlaying(false); setStatus('一時停止'); }}
      onEnded={() => { setPlaying(false); setProgress(100); setStatus('再生終了'); }}
      onTimeUpdate={(e) => { const el = e.currentTarget; if (el.duration > 0) setProgress(Math.min(100, el.currentTime / el.duration * 100)); }}
      onError={() => { setFailed(true); setPlaying(false); setStatus('読み込み失敗・↻で再試行'); }} />
  </section>;
}

/**
 * ★A11：2×2 の絵を、そのまま4つのボタンにする★
 *   1枚の画像を CSS で4分割して表示（画像ファイルは1つのまま＝通信量は同じ）。
 *   左上に ①〜④ の札。押した絵がそのまま答えになる。
 */
function PictureGridAnswer({ question, split, answered, locked, myChoice, reveal, onChoose }: {
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
            }} />
            <b className="bq-picture-badge">{question.options[i] || ['①', '②', '③', '④'][i]}</b>
            {right && <span className="bq-picture-tag" data-kind="right"><Check size={14} aria-hidden="true" />正解</span>}
            {wrongPick && <span className="bq-picture-tag" data-kind="wrong">あなた</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 対戦の図・絵。
 *
 * ★読み込みに失敗したら1回だけ読み直す★（電波が悪くても絵が出ないまま終わらないように）
 * ★タップで大きく表示★（スマホで①〜④の細部が見えるように。もう一度タップで戻る）
 * 読み込み中は枠だけ出して高さを確保し、選択肢の位置がずれて押し間違えないようにする。
 */
function BattleFigure({ src, picture }: { key?: string; src: string; picture: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);
  const url = attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}r=${attempt}`;
  return (
    <figure className={`battle-figure mt-2 ${zoom ? 'is-zoom' : ''}`} data-battle-figure data-picture={picture || undefined}>
      {failed ? (
        <button type="button" className="min-h-11 w-full rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-500"
          onClick={() => { setFailed(false); setLoaded(false); setAttempt((n) => n + 1); }}>
          絵を読み込めませんでした。タップしてもう一度読み込む
        </button>
      ) : (
        <button type="button" className="battle-figure-button" onClick={() => setZoom((z) => !z)}
          aria-label={zoom ? '絵を元の大きさに戻す' : '絵を大きく表示する'}>
          {!loaded && <div className="battle-figure-skeleton" aria-hidden="true" />}
          <img
            src={url}
            alt={picture ? '選択肢①〜④の絵' : '問題の図'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (attempt < 1) { setAttempt((n) => n + 1); return; }
              setFailed(true);
            }}
            // 読み込み中は枠（skeleton）が高さを持ち、画像は重ねて透明にしておく
            style={loaded ? undefined : { position: 'absolute', inset: 0, opacity: 0 }}
          />
        </button>
      )}
    </figure>
  );
}
