/**
 * 解説画面の右カラム：大問1つぶんの「採点結果・正誤・小問カード・音源・共通の解説」（C-03）。
 * Explanation.tsx の IIFE（{(() => { ... })()}）の中身をそのまま移した。JSX・クラス名・文言は1文字も変えていない。
 *
 * ★部品（コンポーネント）ではなく描画関数にしている理由★
 *   同じフォルダの renderSubQuestionCard と同じく、呼び出し元の React の木を1段も変えないため。
 *   部品にすると要素の種類が1段増え、音源プレーヤーなど子の状態の持ち方が以前と変わりうる。
 *   開閉などの状態の持ち主は、これまでどおり Explanation。
 */
import React from 'react';
import { ListeningAudioPlayer } from '../ListeningAudioPlayer';
import { ListeningCompactAnswers } from './ListeningCompactAnswers';
import { MobileResultChips } from './MobileResultChips';
import { renderSubQuestionCard } from './SubQuestionCard';
import { ScoreHead } from './ScoreHead';
import { SharedExplanation } from './SharedExplanation';
import { buildExplanationSlices } from './explanationSlices';
import { isAttempted, textTracksOf } from './helpers';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { buildListeningOptionTexts } from '../../utils/listeningOptions';
import type { Problem, SubQuestion } from '../../types/curriculum';

export interface ExplanationAnswerItemContext {
  question: Problem;
  answers: Record<string, string>;
  allQuestions: Problem[];
  reorderMobile: boolean;
  pcListening: boolean;
  focusSubQuestionId?: string | null;
  isMobile: boolean;
  isPracticeMode: boolean;
  isEnglishChapter: boolean;
  answerBoxBaseClass: string;
  explBodyBaseClass: string;
  explBodyFontClass: string;
  openExplanationBySq: Record<string, boolean>;
  openThinkingBySq: Record<string, boolean>;
  setOpenExplanationBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpenThinkingBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedSqId: string | null;
  setSelectedSqId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function renderExplanationAnswerItem(ctx: ExplanationAnswerItemContext) {
  const {
    question, answers, allQuestions, reorderMobile, pcListening, focusSubQuestionId,
    isMobile, isPracticeMode, isEnglishChapter, answerBoxBaseClass, explBodyBaseClass, explBodyFontClass,
    openExplanationBySq, openThinkingBySq, setOpenExplanationBySq, setOpenThinkingBySq,
    selectedSqId, setSelectedSqId,
  } = ctx;
  // 小問は「元の並び順（ア→イ→ウ…）」のまま表示する（収録データはすべて選択式）。
  const objectiveSqs = question.subQuestions;

  /* ★B-2：音源・スクリプトを変数に束ねる（描く場所を出し分けるため）★
     スマホでは正誤ボタンの後、PC では従来位置で描く。
     中身はそのまま。詳しくは下の使用箇所のコメントを参照。 */
  const listeningTracks = textTracksOf(question);
  const optionTextsBySq = buildListeningOptionTexts(allQuestions.find((q) => q?.id === question?.id) ?? question);
  const audioPlayerBlock = Array.isArray(question.audioTracks) &&
            question.audioTracks.length > 0 && (
              <ListeningAudioPlayer
                tracks={question.audioTracks}
                mode={reorderMobile ? 'review' : 'practice'}
                variant={reorderMobile ? 'panel' : 'inline'}
                /* ★スマホだけ compact★
                   panel をそのまま出すと約430px あり、
                   採点結果の下にこれが入るだけで
                   問Nチップ（top=746）と「この単元の思考の型」が
                   画面外に落ちていた（実測）。
                   compact はスクリプトを残したまま
                   バッジ・サブ文・もう1回・2回続けて行を省く。
                   PC は compact を渡さないので不変。 */
                compact={reorderMobile}
                orientation="horizontal"
                tone={'light'}
                readCount={question.readCount || 2}
                /* ★ご要望11「スクリプトを押さなくても直で下に出てるようにしたい」
                     「☑️採点結果のしたはスクリプトってことね」★
                   スマホはここが採点結果の直下なので、
                   ボタンを押さずに最初からスクリプトを見せる。
                   受験生が最初に見たいのは「読まれた英文そのもの」であり、
                   そこが1タップ隠れているのは順序が逆だった、というご指摘への対応。 */
                alwaysOpenScript={reorderMobile}
              />
            );
  // 「解いていない問」を「不正解」に混ぜない。
  // 未解答＝手を付けていないだけであり、間違えたわけではない。
  const correctSqs = objectiveSqs.filter((sq) => isAnswerCorrect(sq, answers[sq.id]));
  const incorrectSqs = objectiveSqs.filter(
    (sq) => isAttempted(answers[sq.id]) && !isAnswerCorrect(sq, answers[sq.id]),
  );
  const unansweredSqs = objectiveSqs.filter((sq) => !isAttempted(answers[sq.id]));

  // 解説本文を「小問ごとの本文（sliceForSq）」と「大問全体の共通部分（sharedExplanation）」に切り分ける。
  // 計算は explanation/explanationSlices.ts（元のコードのまま移した）。
  const { sliceForSq, sharedExplanation } = buildExplanationSlices(question, focusSubQuestionId);

  // 小問1つぶんのカード。中身は explanation/SubQuestionCard.tsx（元の JSX のまま）。
  // 呼び出し方（renderSq(sq, isCorrect)）と、開閉などの状態の持ち主（この Explanation）は変えていない。
  const renderSq = (sq: SubQuestion, isCorrect: boolean) => renderSubQuestionCard({
    question, answers, isMobile, isPracticeMode, isEnglishChapter, listeningTracks,
    answerBoxBaseClass, explBodyBaseClass, explBodyFontClass,
    openExplanationBySq, openThinkingBySq, setOpenExplanationBySq, setOpenThinkingBySq,
    sliceForSq,
  }, sq, isCorrect);

  return (
    <>
      {objectiveSqs.length > 0 && (
        <div className={`${reorderMobile ? 'space-y-2' : 'space-y-3 md:space-y-4'} ${(reorderMobile || pcListening) && textTracksOf(question).length > 0 ? 'mt-0' : 'mt-6'}${pcListening ? ' lx-pc-main' : ''}`}>
          {/*
            見出し：採点結果（正誤の内訳を小さく併記）

            ★ご要望8★
              「採点結果みたいなところと正解不正解とかも
                無くすのではなくて、小さくコンパクトにする」
              「☑️採点結果の右に、正解・不正解・未解答・
                フローチャートのボタンを持ってくる」

            右側の並び（正解/不正解/未解答＋フローチャート）は
            すでにこの1行に入っている。スマホではさらに
              ・flex-wrap を外して必ず1行に収める（min-w-0＋truncate）
              ・見出し 16px→13px、アイコン 18→15
              ・内訳 text-xs→text-xs
            として高さを詰める。項目は1つも消さない。
            PC（!reorderMobile）は従来のクラスをそのまま使う。
          */}
          <ScoreHead reorderMobile={reorderMobile} listeningTracks={listeningTracks} objectiveSqs={objectiveSqs} correctSqs={correctSqs} incorrectSqs={incorrectSqs} unansweredSqs={unansweredSqs} />

          {/* ★リスニング：採点結果のすぐ下でも音声を聞き直せるようにする
              （ご要望「解答等解説のところで、音声が聞けるようにボタンを用意してほしい」）。
              左の問題文ペインにもプレーヤーはあるが、スマホでは
              解説（右カラム相当）が先に表示され、左まで戻るのが遠い。
              答え合わせ→もう一度聞く、の動線を1タップにする。
              horizontal の帯型なので縦スペースをほぼ取らない。 */}
          {/*
            ★ご要望8：スクリプトは「下」に置く★
              「下は合ってるか間違ってるかとスクリプトを載せて」

            スマホでは上の問題文ペインを inline（再生ボタンだけ）に
            したので、スクリプト・和訳はこちらの review プレーヤーが
            受け持つ。パネル型にすると採点結果の直下で
            スクリプトを開けるようになり、
            「正誤 → スクリプトで確認」が同じ場所で完結する。
            PC は従来どおり横帯の practice（上のパネルが review）。
          */}
          {/*
            ★B-2：音源・スクリプトの「置く場所」だけをスマホで下げる★
            ─────────────────────────────────────────────────────
            ご指摘：
              「採点結果のところ → 問3 って書いてあるところに
                問3◯ を持ってきてコンパクトにする」

            ■ 何が起きていたか（スマホの並び順）
              1. 採点結果（正解0 / 不正解0 / 未解答1）
              2. 音源・スクリプト（★ここがいちばん背が高い★）
              3. 問3 ○ の正誤ボタン
              4. 「上の正誤ボタンをタップすると…」の案内文

              採点結果と正誤ボタンの間に、最も背の高いブロックが
              丸ごと挟まっていた。そのため
                ・採点結果を見てから正誤ボタンを押すまでにスクロールが必要
                ・案内文が「上の正誤ボタン」と書いているのに、
                  その"上"が画面外にある
              という状態になっていた。

            ■ 直し方（★PC を壊さないための形★）
              JSX を変数 audioPlayerBlock に束ね、
                ・スマホ（reorderMobile）… 正誤ボタンの「後」で描く
                ・PC                      … 従来どおり「ここ」で描く
              と描く場所だけを出し分ける。

              ここを単純に移動させると、移動先が reorderMobile の
              true 分岐の中なので PC 版でプレーヤーが消えてしまう
              （＝「パソコン版は何も変更しない」に反する）。
              実際に一度その形にしてしまい、PC で消えることに
              気づいたのでこの形に直している。

              プレーヤーに渡す設定（compact / alwaysOpenScript など）は
              一切変えていない。並べ替えだけで、項目は1つも消していない。
          */}
          {!reorderMobile && !pcListening && audioPlayerBlock}

          {/* ★スマホの1問ごとの答え合わせ：
                「全ての問いのあってるか間違ってるかだけ出して、
                 その正誤ボタンを押したらその問の解答と解説が出る」
              （ご要望）。緑＝正解・赤＝不正解（従来どおりの色）・
              灰＝未解答のチップを一覧で並べ、タップした問だけ
              詳細カード（解答・解説）を下に表示する。
              一覧は常に見えるので「どこを間違えたか」がひと目で分かる。 */}
          {(reorderMobile || pcListening) && listeningTracks.length > 0 ? (
            /* ★リスニングの解説（スマホ）：1画面で完結させる（2026-09-30 利用者の要望）★
               「上に再生があるのに下にもう一度再生ボタンは要らない。
                 この1画面に解説とスクリプトを持ってきたい。詳細解説はボタンで伸びればいい」
               ・再生は上の帯だけ（下の2つ目のプレーヤーは出さない）
               ・問ごとに「○×・あなたの答え→正解」を1行で出す
               ・その下にスクリプトと和訳を直接出す（押さなくても読める）
               ・解説／思考手順／押さえたい表現はタップで開く */
            <ListeningCompactAnswers
              question={question}
              objectiveSqs={objectiveSqs}
              answers={answers}
              listeningTracks={listeningTracks}
              optionTextsBySq={optionTextsBySq}
              pcListening={pcListening}
              openExplanationBySq={openExplanationBySq}
              setOpenExplanationBySq={setOpenExplanationBySq}
              sliceForSq={sliceForSq}
              explBodyBaseClass={explBodyBaseClass}
              explBodyFontClass={explBodyFontClass}
              isEnglishChapter={isEnglishChapter}
              isPracticeMode={isPracticeMode}
            />
          ) : reorderMobile ? (
            <>
              <MobileResultChips
                question={question}
                objectiveSqs={objectiveSqs}
                answers={answers}
                selectedSqId={selectedSqId}
                setSelectedSqId={setSelectedSqId}
                setOpenExplanationBySq={setOpenExplanationBySq}
              />
              {/* タップした問だけ詳細カード（解答・解説）を出す */}
              {(() => {
                const sel = objectiveSqs.find((sq) => sq.id === selectedSqId);
                if (!sel) return (
                  <p className="text-xs text-gray-400 font-bold text-center py-1">
                    上の正誤ボタンをタップすると、その問の解答・解説が開きます
                  </p>
                );
                return renderSq(sel, isAnswerCorrect(sel, answers[sel.id]));
              })()}

              {/* ★B-2：スマホは音源・スクリプトを正誤ボタンより「下」で描く★
                  これで並び順が
                    採点結果 → 問N○ の正誤ボタン → 案内文 → 音源・スクリプト
                  になり、「採点結果」と「問3○」が隣接する。
                  案内文の「上の正誤ボタン」も、実際に真上を指すようになる。 */}
              {audioPlayerBlock}
            </>
          ) : (
            /* PC・結果表示：元の並び順（ア→イ→ウ…）のまま、正誤の色分けだけ行って上から表示 */
            objectiveSqs.map(sq => renderSq(sq, isAnswerCorrect(sq, answers[sq.id])))
          )}
        </div>
      )}

      <SharedExplanation sharedExplanation={sharedExplanation} reorderMobile={reorderMobile} pcListening={pcListening} listeningTracks={listeningTracks} isEnglishChapter={isEnglishChapter} explBodyBaseClass={explBodyBaseClass} explBodyFontClass={explBodyFontClass} />
    </>
  );
}
