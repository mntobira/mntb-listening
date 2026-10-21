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
import { CircleCheck, CircleX, Hourglass, RotateCcw, Play, Pause, Info } from 'lucide-react';
import { PICTURE_GRID_SPLITS } from '../data/pictureGrid.generated';
import './battle-question.css';

import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import type { BattleQuestion } from '../core/types';
import { kanaTextOf } from '../core/kanaKeyboard';
import { GOLD, INK, INK_SUB, TimeBar, WRONG } from './BattleParts';
import { CORRECT, ChoiceAnswer, PanelAnswer, KanaAnswer, PictureGridAnswer } from './BattleAnswerControls';


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
  /** 「1/10もん」と「4つからえらぶ」の間に置く一言（相手は回答ずみ！ など）。別の行を使わない */
  notice?: ReactNode;
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
  notice,
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
  /** 問題文の上の欄が「英文」そのもの（英文法・英単語）。一人で学ぶと同じ太字で見せる */
  const isEnglishSentence = question.subject === 'english_grammar' || question.subject === 'english_vocab';
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
        <div className="bq-progress-row mb-2 flex items-center justify-between gap-2">
          <p className="shrink-0 text-xs font-black" style={{ color: INK_SUB }}>
            <span style={{ color: '#B7791F' }} className="text-base tabular-nums">
              {index + 1}
            </span>
            <span className="mx-0.5">/</span>
            {total}もん
          </p>
          {notice && <div className="bq-progress-notice min-w-0 flex-1 text-center">{notice}</div>}
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-black"
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
            // ★英文法・英単語は、この欄が「英文そのもの」★（リスニングの「場面」の小さな補足とは役割が違う）
            //   以前は場面と同じ 13px・細字・灰色で、英文が読みにくかった（利用者の指摘）。
            //   一人で学ぶ（ProblemPane の英文欄：16px・太字・濃い色）と同じ見た目にそろえる。
            className={isEnglishSentence
              ? 'bq-scene bq-english mb-2.5 whitespace-pre-wrap rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-[16px] font-bold leading-relaxed'
              : 'bq-scene mb-2 whitespace-pre-wrap text-[13px] leading-relaxed'}
            style={{ color: isEnglishSentence ? '#111827' : INK_SUB }}
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
