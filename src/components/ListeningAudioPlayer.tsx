import React, { useMemo } from 'react';
import './quiz-compact.css';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Play, Pause, RotateCcw, Repeat2, FileText, ChevronDown } from 'lucide-react';
import type { ListeningAudioTrack } from '../data/englishListeningQ1AProblems';
import { ListeningEvidenceScript } from './ListeningEvidenceScript';
import { useListeningPlayback } from './useListeningPlayback';
import { hasRealAudio } from '../utils/listeningSpeech';

export { ListeningEvidenceScript } from './ListeningEvidenceScript';

/**
 * ListeningAudioPlayer
 * ------------------------------------------------------------------
 * 英語リスニングの音源を「わかりやすい場所で・すぐ押せる形で」再生するための
 * 共通コンポーネント。QuestionFigure と同じ設計方針（tone で明色／暗色を切替、
 * Quiz と Explanation の両方から同じ見た目で使える）で作っている。
 *
 * ■ なぜ専用コンポーネントにするのか
 *   リスニングは「音を聞く」ことが問題そのもの。図版（QuestionFigure）と違って
 *   ・問題を解く前（Quiz）  … スクリプトを見せずに音だけ流す
 *   ・解答したあと（Explanation）… スクリプト＋和訳＋語句を見ながら聞き直す
 *   という2つのモードが必要で、置き場所も2か所ある。
 *   ボタンの位置・色・サイズがぶれると「音源どこ？」となるため一元化する。
 *
 * ■ 表示の要点（ご要望：音源のボタンはわかりやすい場所に）
 *   ・問題文ペインの**最上部**に置き、ヘッドホンアイコン＋「音源を聞く」で明示する
 *   ・問1〜問4 のボタンを常に見える形（アコーディオンで隠さない）で横並びにする
 *   ・タップ領域は 48px 以上（スマホでの取りこぼしを防ぐ）
 *   ・再生中のボタンは色が反転し、どれが鳴っているか一目でわかる
 *
 * ■ mode
 *   'practice' … 解答前。スクリプトは伏せ、音と「2回続けて再生」だけを提供する。
 *   'review'   … 解答後（復習用）。スクリプト・和訳・語句を開いて確認できる。
 *
 * ■ BGM との関係
 *   App.tsx の BGM は quiz / explanation では停止するため、通常は競合しない。
 *   それでも保険として、再生開始時に他の音声要素を pause する
 *   （同一ページ内に複数プレーヤーがある場合の重なりも防ぐ）。
 */

export interface ListeningAudioPlayerProps {
  /** 再生対象のトラック一覧（問1〜問4） */
  tracks: ListeningAudioTrack[];
  /** 解答前（音のみ）／復習（スクリプトつき） */
  mode?: 'practice' | 'review';
  /** 配色モード。Quiz の明るいペイン／Explanation の暗いペインに合わせる */
  tone?: 'light' | 'dark';
  /** パネル見出し。省略時は mode に応じた既定値 */
  title?: string;
  /** 本番の読み上げ回数（2回読みなら「2回続けて再生」を出す） */
  readCount?: 1 | 2;
  /**
   * 特定の問だけを対象にする場合の subId。
   * Explanation で「この問の音源だけ」を出したいときに使う。
   */
  focusSubId?: string;
  /**
   * 表示バリアント。
   *   'panel'  … 既定。見出し＋速度切替つきのパネル（問題文ペイン上部に置く形）
   *   'inline' … 見出しを省き、再生ボタンだけを縦に細く並べる。
   *              「1問とその再生ボタンを横に並べる」ため、解答カードの左側に
   *              差し込む用途。focusSubId と併用して1問ぶんだけを出す。
   */
  variant?: 'panel' | 'inline';
  /**
   * inline バリアントのボタンの並べ方。
   *   'vertical'   … 既定。縦1列（解答カードの左に細く差し込む従来の形）
   *   'horizontal' … 横1列に折り返して並べる。
   *
   * ご要望「音源はその画面の上側の問題のところに設置すること／
   * 選択肢のところに設置しても押しずらい」に対応するため、
   * 問題ブロックの上部に横帯として置けるようにした。
   * 横帯なら 4.5rem 幅の縦列に押し込まれず、指で押しやすい大きさを保てる。
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * panel バリアントを「高さを詰めた形」で描くか。
   *
   * ★ご要望8（スマホの解答・解説画面）★
   *   「音源のボタンと問題が上。下は合ってるか間違ってるかとスクリプトを載せて、
   *     解説は問1のボタンを押すと出てくる感じで」
   *
   *   上（問題文ペイン）は inline の横帯にしたので、下は「正誤＋スクリプト」を
   *   担当する。ところが panel は
   *     ヘッドホンバッジ＋見出し＋サブテキスト＋速度＋各問ボタン＋もう1回
   *     ＋スクリプト＋「◯◯を2回続けて」
   *   を全部積むため実測で約430px あり、これだけで1画面を食い潰していた
   *   （採点結果 top=377 / 問1チップ top=746 / 思考の型が画面外）。
   *
   *   compact では「聞き直す」と「スクリプトを開く」に絞る。
   *     ・ヘッドホンバッジ／サブテキスト／もう1回／2回続けて行 … 出さない
   *     ・各問は［▶問N］＋［スクリプト］の横1組だけ
   *     ・スクリプト本体（和訳・押さえたい表現）は従来と同じものを開く
   *   スクリプトを削らないのが要点。ご要望は「小さくコンパクトにする」であって
   *   「無くす」ではない。
   *
   *   PC からは渡さないため、PC の見た目は完全に不変。
   */
  compact?: boolean;
  /**
   * スクリプトを最初から開いた状態で出すか（＝ボタンを押さなくても読める）。
   *
   * ★ご要望11★
   *   「スクリプトを押さなくても直で下に出てるようにしたい」
   *   「パソコン版の方も、スクリプトとかは絶対に出して欲しい。今たたまれとるけど」
   *
   *   受験生が解説画面で最初に見たいのは「読まれた英文そのもの（スクリプト）」で、
   *   そこが1タップ隠れているのは順序として逆だった、というご指摘。
   *   true のときは開閉ボタンを出さず、常に開いた状態で描画する。
   *   （開閉ボタンを残すと「閉じられる＝また隠せる」ことになり、
   *     「絶対に出して欲しい」というご要望と食い違うため出さない。）
   */
  alwaysOpenScript?: boolean;
  /**
   * 本番と同じく「1回だけ再生」に制限する（第4問以降・practice のとき）。
   *
   * 1回読みの大問で何度も聞けると練習にならない、という配布側の指示に従う。
   * 再生し終わった音源はボタンを押せなくし「再生済み」と表示する。
   * review（解説）では制限しない。途中で止めた場合は最後まで聞いていないので
   * 制限しない（一時停止→再開ができる）。
   */
  playOnce?: boolean;
  /** 追加クラス（余白調整） */
  className?: string;
}

export function ListeningAudioPlayer({
  tracks,
  mode = 'practice',
  tone = 'light',
  title,
  readCount = 2,
  focusSubId,
  variant = 'panel',
  orientation = 'vertical',
  compact = false,
  alwaysOpenScript = false,
  playOnce = false,
  className = '',
}: ListeningAudioPlayerProps) {
  const isDark = tone === 'dark';
  const isReview = mode === 'review';
  const isInline = variant === 'inline';
  const isRow = isInline && orientation === 'horizontal';
  // compact は panel バリアントだけの装飾（inline はもともと十分小さい）
  const isCompact = compact && !isInline;

  // focusSubId が指定されていればその問だけに絞る
  const list = useMemo(
    () => (focusSubId ? tracks.filter((t) => t.subId === focusSubId) : tracks),
    [tracks, focusSubId],
  );

  // 再生の状態と操作（再生・一時停止・2回読み・1回だけ再生・読み上げ代替）。中身は useListeningPlayback.ts（C-10）
  const {
    playingId, setPlayingId, openScriptId, setOpenScriptId, rate, setRate,
    lockOnce, isLocked, audioRefs, usesSpeech, speechBlocked, play, toggle, handleEnded,
  } = useListeningPlayback(list, { playOnce, isReview });

  if (list.length === 0) return null;

  const heading = title || (isReview ? '復習用の音源を聞く' : '音源を聞く');

  // ---- 配色（Tailwind の JIT が拾えるよう完成クラスを分岐で持つ） ----
  const panelClass = isDark
    ? 'border-[#5BC0BE]/45 bg-[#0B132B]/70'
    : 'border-[#5BC0BE]/55 bg-[#F2FBF9]';
  const headingClass = isDark ? 'text-[#A9E0D8]' : 'text-[#2F7C74]';
  const subTextClass = isDark ? 'text-[#E0E1DD]/70' : 'text-slate-500';
  const idleBtnClass = isDark
    ? 'border-[#5BC0BE]/45 bg-[#1C2541] text-[#E0E1DD] hover:bg-[#243056]'
    : 'border-[#5BC0BE]/50 bg-white text-[#2C3E50] hover:bg-[#E6F7F4]';
  // 2026-10-21：白文字12px のコントラストを AA（4.5:1）以上に。#3E9C93（3.3:1）→ #2B7A72（5.1:1）
  const activeBtnClass = 'border-[#2B7A72] bg-[#2B7A72] text-white ring-2 ring-[#3E9C93]/30';
  const scriptBoxClass = isDark
    ? 'border-[#3A506B]/70 bg-[#0B132B]/60 text-[#E0E1DD]'
    : 'border-[#5BC0BE]/30 bg-white text-slate-700';

  // ─────────────────────────────────────────────────────────────
  // inline バリアント：解答カードの左に差し込む「その問だけの再生ボタン」
  //   ご要望「1問題とそれに該当する再生ボタンを横に配置して」に対応する形。
  //   見出しを省き、幅を取らない縦積みにする。
  //
  //   ★速度切替もここに置く（ご要望：問題文ペイン上部のパネルは不要）
  //     以前は panel バリアント（画面上部の「音源を聞く」欄）だけに
  //     0.75倍／標準の切替があった。そのパネルを廃止したため、
  //     切替が消えてしまわないよう「その問の再生ボタンの真下」に移設する。
  //     ゆっくり確認 → 本番速度、の練習が同じ場所で完結する。
  // ─────────────────────────────────────────────────────────────
  if (isInline) {
    return (
      <div
        /*
          ★ご指摘11「再生ボタンがまた少し大きくなったせいで、④の選択肢みたいに
            少し下に隠れちゃってるから少しだけ再生ボタン小さくして補ったほうがいい」★

          ■ 実際に高さを食っていた原因は「ボタンの高さ」ではなく「折り返し」
            gap-2（8px）だとボタンの合計幅が画面幅をわずかに超え、
            flex-wrap で 2 段に折り返していた。
            1段=44px なので、折り返すと 44px＋gap ぶん丸ごと余分に高さを取り、
            そのぶん選択肢が下に押し出されて ④ が画面外に切れていた。

          ■ だから「高さを削る」のではなく「1段に収める」ことで補う
            gap（8px→6px）と、2回／速度ボタンの左右余白・文字を一回り小さくして
            合計幅を画面内に収め、折り返しを消す。
            これで実質 44px ぶん（＋gap）の高さが選択肢に戻る。
            ★高さ（min-h-[2.75rem]=44px）は削らない★
              以前ご指摘のあった「選択肢のところに設置しても押しずらい」を
              受けて 44px（指で押せる下限）を確保した経緯がある。
              高さを 40px に削ると今度は押しにくさが再発するので、
              折り返しの解消だけで高さを取り戻す。

          ★★上の「44pxは削らない」を、44px → 36px に改める★★
            ------------------------------------------------------------
            新しいご指摘（手書きの指示書）：
              音源ボタン列（▷再生／▷2回再生／▷0.75倍再生／標準）に
              「小さめに」、図に「大きめに」。

            ■ なぜ前回の判断を変えるのか
              44px を確保した当時、このボタン列は★解答ペイン側★＝
              ①〜④ の選択肢と同じ場所にあった。だから「選択肢と
              まぎれて押しにくい」が問題になり、44px が必要だった。
              いまボタン列は問題文ペインに移り、上下に見出しと図しか
              無い独立した1行になっている。まぎれる相手がいないので、
              44px まで確保する理由が無くなった。

            ■ 36px（min-h-[2.25rem]）で止める理由
              実測（390x664・第2問）で、この列は h=44px を占め、
              一方で図は 96x96 しか出ていなかった。
              36px にすると 8px が図に回る。
              ここからさらに 32px・28px と削ることもできるが、
              ★指で押す下限（実測でボタン高 36px＝指の腹とほぼ同じ）を
                下回らせない★。ご要望は「小さめに」であって
                「押せなくしてよい」ではないので、
              　図の取り分（8px）と押しやすさの釣り合う 36px にする。

            ■ 幅も同時に詰める（折り返しを絶対に起こさないため）
              上の通り、この列で本当に高さを食うのは「折り返し」。
              高さを36pxに下げても、幅が画面を超えて2段になったら
              36px 丸ごと損して逆効果になる。だから
                再生 min-w 5rem→4.25rem / 2回 3.5rem→3rem /
                速度 3rem→2.5rem、文字も 11px→10px
              まで一緒に詰め、1段に収まる余裕を広げてから高さを下げる。
        */
        className={`flex ${
          isRow
            ? 'lap-row w-full flex-row flex-wrap items-center gap-1.5'
            : 'shrink-0 flex-col gap-1.5'
        } ${className}`}
        aria-label={`${list[0]?.label ?? ''}の音源`}
      >
        {list.map((track) => {
          const isPlaying = playingId === track.subId;
          return (
            <React.Fragment key={track.subId}>
              {/* 主ボタン：この問だけを再生／停止する */}
              <button
                type="button"
                onClick={() => toggle(track.subId)}
                disabled={speechBlocked || isLocked(track.subId)}
                aria-label={
                  isLocked(track.subId)
                    ? `${track.label} は再生済み（本番は1回読みのため、もう一度は聞けません）`
                    : `${track.label}（${track.hint}）の音源を${isPlaying ? '停止' : '再生'}`
                }
                className={`flex items-center justify-center rounded-xl border-2 font-bold shadow-sm transition-all ${
                  isRow
                    ? 'min-h-[2.25rem] min-w-[4.25rem] flex-1 flex-row gap-1 px-2 py-1'
                    : 'min-h-[3rem] w-[4.5rem] flex-col gap-0.5 px-1 py-1.5 sm:w-20'
                } ${
                  speechBlocked || isLocked(track.subId)
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : `cursor-pointer ${isPlaying ? activeBtnClass : idleBtnClass}`
                }`}
              >
                {isPlaying
                  ? <Pause size={isRow ? 15 : 18} />
                  : <Play size={isRow ? 15 : 18} />}
                <span className={isRow ? 'text-[13px] leading-none' : 'text-xs leading-none'}>
                  {isPlaying ? '停止' : isLocked(track.subId) ? '再生済み（1回読み）' : lockOnce ? '再生（1回のみ）' : '再生'}
                </span>
              </button>

              {/* 本番同様の2回読み。1問ずつ本番条件を再現できるようにする。 */}
              {readCount === 2 && (
                <button
                  type="button"
                  onClick={() => play(track.subId, true)}
                  disabled={speechBlocked}
                  aria-label={`${track.label} を本番と同じように2回続けて再生`}
                  className={`flex items-center justify-center gap-0.5 rounded-lg border font-bold transition-colors ${
                    isRow
                      ? 'min-h-[2.25rem] min-w-[3rem] px-1.5 py-0.5 text-xs'
                      : 'min-h-[2rem] w-[4.5rem] px-1 py-1 text-xs sm:w-20'
                  } ${
                    speechBlocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                      : `cursor-pointer ${idleBtnClass}`
                  }`}
                >
                  <Repeat2 size={10} />2回
                </button>
              )}

              {/* 読み上げ非対応端末では「なぜ押せないか」を必ず伝える。
                  上部パネルを廃止したので、この注記もインライン側に持つ。 */}
              {speechBlocked && (
                <p
                  className={`text-xs font-bold leading-tight ${
                    isRow ? 'w-full' : 'w-[4.5rem] sm:w-20'
                  } ${subTextClass}`}
                >
                  この端末は読み上げ非対応
                </p>
              )}

              {/* 再生速度（0.75倍／標準）。
                  上部パネルを廃止したため、ここが唯一の速度切替になる。
                  幅を取らないよう2段の細いボタンにする。 */}
              <div
                className={
                  isRow
                    ? 'flex flex-row gap-1'
                    : 'flex w-[4.5rem] flex-col gap-1 sm:w-20'
                }
                role="group"
                aria-label="再生速度"
              >
                {[0.75, 1].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRate(r)}
                    aria-pressed={rate === r}
                    className={`rounded-lg border font-bold transition-colors cursor-pointer ${
                      isRow
                        ? 'min-h-[2.25rem] min-w-[2.75rem] px-1 py-0.5 text-xs'
                        : 'min-h-[1.75rem] px-1 py-0.5 text-xs'
                    } ${rate === r ? activeBtnClass : idleBtnClass}`}
                  >
                    {r === 1 ? '標準' : '0.75倍'}
                  </button>
                ))}
              </div>

              {!hasRealAudio(track) ? null : (
                <audio
                  ref={(el) => {
                    audioRefs.current[track.subId] = el;
                  }}
                  src={track.audioUrl}
                  preload="none"
                  onEnded={() => handleEnded(track.subId)}
                  onPause={() => {
                    if (playingId === track.subId) setPlayingId(null);
                  }}
                  playsInline
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border-2 ${
        isCompact ? 'p-2' : 'p-3 sm:p-4'
      } shadow-sm ${panelClass} ${className}`}
      aria-label={heading}
    >
      {/* ── 見出し ──
          compact（スマホの解答・解説）は1行だけ。
          ヘッドホンバッジ（h-9 w-9）とサブテキスト2〜3行を落とすことで
          ここだけで約70px 節約できる。「音源」の文字は残すので
          何のブロックかは分かる。 */}
      {isCompact ? (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h3 className={`flex items-center gap-1 text-xs font-bold leading-none ${headingClass}`}>
            <Headphones size={13} className="shrink-0" />
            <span>音源・スクリプト</span>
          </h3>
          <div className="flex items-center gap-1" role="group" aria-label="再生速度">
            {[0.75, 1].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRate(r)}
                aria-pressed={rate === r}
                className={`min-h-[1.75rem] rounded-md border px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                  rate === r ? activeBtnClass : idleBtnClass
                }`}
              >
                {r === 1 ? '標準' : '0.75倍'}
              </button>
            ))}
          </div>
        </div>
      ) : (
      /* ── 見出し（ヘッドホンアイコンで「ここが音源」と即座に分かるようにする） ── */
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3E9C93] text-white shadow-sm">
            <Headphones size={18} />
          </span>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-bold leading-tight ${headingClass}`}>
              {heading}
            </h3>
            <p className={`text-xs font-bold leading-snug ${subTextClass}`}>
              {isReview
                ? 'スクリプト・和訳を見ながら聞き直せます'
                : `ボタンを押すと音声が流れます（本番は${readCount}回読み）`}
            </p>
            {/*
              MP3 未収録の類題集では読み上げ音声で代替している。
              「録音音声ではない」ことを伝えないと、発音の癖を本番のものだと
              誤解してしまうため、必ず明示する。
            */}
            {usesSpeech && (
              <p className={`mt-0.5 text-xs font-bold leading-snug ${subTextClass}`}>
                {speechBlocked
                  ? '※この端末では読み上げに対応していません。スクリプトを黙読して練習してください。'
                  : '※この回は端末の読み上げ音声で再生します（録音音源ではありません）'}
              </p>
            )}
          </div>
        </div>

        {/* 再生速度。ゆっくり確認 → 本番速度、の順に練習できるようにする。 */}
        <div className="flex items-center gap-1" role="group" aria-label="再生速度">
          {[0.75, 1].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRate(r)}
              aria-pressed={rate === r}
              className={`min-h-[2rem] rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                rate === r ? activeBtnClass : idleBtnClass
              }`}
            >
              {r === 1 ? '標準' : '0.75倍'}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* ── 音源ボタン（常時表示。隠さないことが「わかりやすい場所」の条件） ──
          compact では ［▶問N］＋［スクリプト］を横1組にして2列に詰める
          （縦積み3段 × 4問 → 横1段 × 4問）。 */}
      <div
        className={
          isCompact
            ? 'grid grid-cols-2 gap-1.5'
            : list.length === 1
              ? 'grid grid-cols-1 gap-2 sm:max-w-md'
              : 'grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4'
        }
      >
        {list.map((track) => {
          const isPlaying = playingId === track.subId;
          return (
            <div
              key={track.subId}
              className={isCompact ? 'flex items-stretch gap-1' : 'flex flex-col gap-1.5'}
            >
              {/* 再生ボタンと「もう1回」は横並び（2026-10-12 ご要望） */}
              <div className="flex min-w-0 items-stretch gap-1.5">
              <button
                type="button"
                onClick={() => toggle(track.subId)}
                aria-label={`${track.label}（${track.hint}）の音源を${isPlaying ? '停止' : '再生'}`}
                className={`flex items-center font-bold shadow-sm transition-all cursor-pointer ${
                  isCompact
                    ? 'min-h-[2.25rem] min-w-0 flex-1 gap-1 rounded-lg border px-1.5 py-1'
                    : 'min-h-[3rem] min-w-0 flex-1 gap-2 rounded-xl border-2 px-2.5 py-2 text-left'
                } ${isPlaying ? activeBtnClass : idleBtnClass}`}
              >
                <span className="shrink-0">
                  {isPlaying ? (
                    <Pause size={isCompact ? 14 : 18} />
                  ) : (
                    <Play size={isCompact ? 14 : 18} />
                  )}
                </span>
                {isCompact ? (
                  /* compact は問ラベルだけ。hint（内容の要約）は下の
                     スクリプト側で読めるので二重に置かない。 */
                  <span className="min-w-0 truncate text-[12px] leading-none">{track.label}</span>
                ) : (
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-tight">{track.label}</span>
                    <span
                      className={`block truncate text-xs font-bold leading-tight ${
                        isPlaying ? 'text-white/80' : subTextClass
                      }`}
                    >
                      {track.hint}
                    </span>
                  </span>
                )}
              </button>

              {/* もう1回だけ流す（聞き取れなかったときの即リトライ）。
                  compact では上の再生ボタンで足りるため出さない（高さ優先）。 */}
              {!isCompact && (
                <button
                  type="button"
                  onClick={() => play(track.subId, false)}
                  aria-label={`${track.label} をもう一度再生`}
                  className={`flex min-h-[3rem] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl border px-2.5 py-1 text-[12px] font-bold transition-colors cursor-pointer ${idleBtnClass}`}
                >
                  <RotateCcw size={13} />
                  もう1回
                </button>
              )}
              </div>

              {/* 復習モードのみ：スクリプト・和訳・語句を開く
                  ★compact でも必ず残す★ ご要望は「スクリプトを載せて」なので、
                  ここを削ると要件そのものが消える。アイコン主体に縮めるだけ。 */}
              {/* ★alwaysOpenScript のときは開閉ボタンを出さない★
                  常に開いているので「閉じる／開く」の操作自体が要らないし、
                  押せてしまうと「絶対に出して欲しい」というご要望に反して
                  また隠せる状態に戻ってしまう。 */}
              {isReview && !alwaysOpenScript && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenScriptId(openScriptId === track.subId ? null : track.subId)
                    }
                    aria-expanded={openScriptId === track.subId}
                    aria-label={`${track.label} のスクリプトを${
                      openScriptId === track.subId ? '閉じる' : '開く'
                    }`}
                    className={`flex items-center justify-center rounded-lg border font-bold transition-colors cursor-pointer ${
                      isCompact
                        ? 'min-h-[2.25rem] shrink-0 gap-0.5 px-1.5 py-1 text-xs'
                        : 'min-h-[2rem] gap-1 px-2 py-1 text-xs'
                    } ${idleBtnClass}`}
                  >
                    <FileText size={11} />
                    {!isCompact && 'スクリプト'}
                    <ChevronDown
                      size={11}
                      className={`transition-transform ${
                        openScriptId === track.subId ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </>
              )}

              {/*
                音声本体。controls は出さず、上のボタンに操作を集約する。
                MP3 が無いトラックでは <audio> を作らない（src="" の読み込み
                エラーがコンソールに出るのを避ける）。読み上げ経路が担当する。
              */}
              {hasRealAudio(track) && (
                <audio
                  ref={(el) => {
                    audioRefs.current[track.subId] = el;
                  }}
                  src={track.audioUrl}
                  preload="none"
                  onEnded={() => handleEnded(track.subId)}
                  onPause={() => {
                    if (playingId === track.subId) setPlayingId(null);
                  }}
                  playsInline
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── 本番と同じ「2回続けて再生」（第1問・第2問は2回読み） ──
          compact（スマホの解答・解説）では出さない。
          復習の目的は「正誤の確認とスクリプト照合」であり、本番条件の
          2回読み再生は問題を解く画面（Quiz の inline プレーヤー）に
          残してある。ここでは 4問ぶん × 約36px の行を丸ごと省ける。 */}
      {!isCompact && readCount === 2 && list.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {list.map((track) => (
            <button
              key={`repeat-${track.subId}`}
              type="button"
              onClick={() => play(track.subId, true)}
              aria-label={`${track.label} を本番と同じように2回続けて再生`}
              className={`flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${idleBtnClass}`}
            >
              <Repeat2 size={13} />
              {track.label} を2回続けて
            </button>
          ))}
        </div>
      )}

      {/* ── スクリプト表示 ──
          ★alwaysOpenScript のときは開閉アニメーションを挟まず、
            list のすべての問のスクリプトを常に開いた状態で並べる★
            （ご要望「スクリプトを押さなくても直で下に出てるようにしたい」／
              「パソコン版の方も、スクリプトとかは絶対に出して欲しい」） */}
      {isReview && alwaysOpenScript && (
        <div className={isCompact ? 'mt-1.5 space-y-1.5' : 'mt-3 space-y-2'}>
          {list.map((track) => (
            <div
              key={`open-${track.subId}`}
              className={`rounded-xl border ${isCompact ? 'p-2' : 'p-3'} ${scriptBoxClass}`}
            >
              <p className={`mb-1 text-xs font-bold ${headingClass}`}>
                {track.label} スクリプト
              </p>
              <ListeningEvidenceScript track={track} />
            </div>
          ))}
        </div>
      )}

      {/* ── スクリプト表示（開閉式・従来の挙動） ── */}
      <AnimatePresence initial={false}>
        {isReview &&
          !alwaysOpenScript &&
          openScriptId &&
          (() => {
            const track = list.find((t) => t.subId === openScriptId);
            if (!track) return null;
            return (
              <motion.div
                key={openScriptId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className={`rounded-xl border ${
                    isCompact ? 'mt-1.5 p-2' : 'mt-3 p-3'
                  } ${scriptBoxClass}`}
                >
                  <p className={`mb-1 text-xs font-bold ${headingClass}`}>
                    {track.label} スクリプト
                  </p>
                  <ListeningEvidenceScript track={track} />
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </section>
  );
}
