import React from 'react';
import { Save, ListOrdered } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { ExplanationBody } from '../ExplanationBody';
import { QuestionFigure } from '../QuestionFigure';
import { ListeningAudioPlayer } from '../ListeningAudioPlayer';
import { getFigureNumber } from '../../utils/figureNumbering';
import { buildSubQuestionList, isSubQuestionListRedundant, extractInlineQuestionRows, extractListeningQuestionRows, cleanQuestionText, findSubQuestionSentence } from '../../utils/questionDisplay';
import type { Problem } from '../../types/curriculum';
import type { ResultPage } from './explanationLogic';

/**
 * 解答・解説画面の左カラム（問題文ペイン）に並ぶ「1問ぶん」のブロック。
 *   結果表示の見出し（Q番号・カテゴリ・ノートに保存・あなたの正答率）
 *   → 復習用の音源 → 問題文（スマホのリスニング行／横並び行／通常の本文）→ 図 → 設問一覧
 * 2026-10-14 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・条件は元のまま。
 * 状態は持たない。正答率（scorePercentage）は親で従来と同じ順に計算して渡す。
 * React の key は呼び出し側（<ProblemStatement key={question.id} …>）に付ける。
 */
export interface ProblemStatementProps {
  question: Problem;
  qIndex: number;
  scorePercentage: number;
  singleQuestionIndex?: number;
  rangeOffset: number;
  pagerOn: boolean;
  resultPages: ResultPage[];
  safeResultPage: number;
  savingNote: Record<string, boolean>;
  handleSaveNote: (question: Problem, index: number) => void;
  reorderMobile: boolean;
  isEnglishChapter: boolean;
  figureNumberMap: Record<string, number>;
  // このリポジトリは @types/react を導入していないため、JSX の key が
  // props として型チェックされる（ExplanationBody.tsx と同じ書き方）。
  key?: React.Key;
}

export function ProblemStatement({ question, qIndex, scorePercentage, singleQuestionIndex, rangeOffset, pagerOn, resultPages, safeResultPage, savingNote, handleSaveNote, reorderMobile, isEnglishChapter, figureNumberMap }: ProblemStatementProps) {
  return (
                  <div className="space-y-4 md:space-y-6">
                    {singleQuestionIndex === undefined && (
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`font-bold px-3 py-1 rounded-full text-xs md:text-sm shadow-sm border ${'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            Q{(singleQuestionIndex !== undefined ? singleQuestionIndex : rangeOffset + (pagerOn ? (resultPages[safeResultPage]?.qIndex ?? qIndex) : qIndex)) + 1}
                          </div>
                          <div className={`text-left font-bold text-sm md:text-base ${'text-gray-800'}`}>
                            {question.category || '問題'}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveNote(question, qIndex); }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${savingNote[question.id] ? ('bg-gray-100 text-gray-500 border-gray-200') : ('bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100')}`}
                            disabled={savingNote[question.id]}
                          >
                            <Save size={14} />
                            {savingNote[question.id] ? '保存中...' : 'ノートに保存'}
                          </button>
                          <div className="flex flex-col items-end">
                            <div className={`text-[10px] md:text-xs font-bold mb-0.5 ${'text-gray-500'}`}>あなたの正答率</div>
                            <div className={`font-mono font-bold text-base md:text-lg ${scorePercentage >= 80 ? ('text-emerald-600') : scorePercentage <= 40 ? ('text-red-500') : ('text-amber-500')}`}>
                              {scorePercentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Problem Restatement
                        表示ルール1・2：左側の「問題文」欄には共通リード文に加えて、
                        続く全小問の設問文を順番に表示する（左側だけで全問いが理解できる）。 */}
                    <div className={`${reorderMobile
                      // スマホの1問ごとの答え合わせ：枠なし・演習画面と同じ文字サイズ
                      //（親ペインの text-[15px] leading-[1.85] を継承）。
                      ? ''
                      : 'p-4 rounded-lg border text-sm md:text-base leading-relaxed'} ${
                      (reorderMobile ? 'text-gray-800' : 'bg-white border-gray-200 text-gray-800')
                    }`}>
                      {/* ★英語リスニング：復習用の音源をここに置く。
                          採点直後の画面なので、「聞き取れなかった箇所を
                          スクリプト・和訳つきで聞き直す」導線として最重要の位置。
                          mode='review' でスクリプト／和訳／語句を開けるようにする。 */}
                      {/*
                        ★ご要望8（スマホ・リスニングの解説）★
                          「音源は問題みたいに上の端に寄せて。音源のボタンと問題が上。
                            下は合ってるか間違ってるかとスクリプトを載せて、
                            解説は問1のボタンを押すと出てくる感じで。」

                        ■ 実測した不具合（390x664・el1_A[0]）
                          パネル型（variant='panel' / mode='review'）の
                          「復習用の音源を聞く」が見出し＋説明文＋速度切替＋
                          問Nボタン＋もう1回＋スクリプト＋2回続けて…を
                          縦に積むため、問題文ペインだけで約430px を占有し、
                          ・スクリプトのボタンがペインの折り目で切れる
                          ・採点結果が top=377（画面のほぼ下端）に押し出される
                          ・この単元の思考の型は画面外（測定値 null）
                          という状態だった。

                        ■ 直し方（スマホのみ／PCは従来のパネルのまま）
                          上（問題文ペイン）は横帯の inline に変えて
                          「再生ボタンと問題」だけにする＝上端に寄る。
                          スクリプトは下（採点結果の側）の review プレーヤーへ移す。
                          ご要望どおり「上＝音源＋問題／下＝正誤＋スクリプト」になる。

                        ■ 情報は消さない
                          実測で確認したとおり、選択肢①〜④は問題文の中にしか
                          無いので問題文は削らない（削ると答え合わせができない）。
                          スクリプトも消さず、下に移すだけ。
                      */}
                      {Array.isArray(question.audioTracks) &&
                        question.audioTracks.length > 0 && (
                          <ListeningAudioPlayer
                            tracks={question.audioTracks}
                            // スマホは「聞き直す」ボタンだけの横帯（スクリプトは下へ）
                            mode={reorderMobile ? 'practice' : 'review'}
                            variant={reorderMobile ? 'inline' : 'panel'}
                            orientation={reorderMobile ? 'horizontal' : 'vertical'}
                            tone={'light'}
                            readCount={question.readCount || 2}
                            /* ★ご要望11「パソコン版の方も、スクリプトとかは
                                 絶対に出して欲しい。今たたまれとるけど」★
                               PC はここがパネル型なので、ここを常時展開にする。
                               スマホ側はこの上帯には出さず、下（採点結果の下）の
                               プレーヤーで出す（ご要望「☑️採点結果のしたはスクリプト」）。 */
                            alwaysOpenScript={!reorderMobile}
                            className={reorderMobile ? 'mb-2' : 'mb-4'}
                          />
                        )}
                      {/* 問題文にも Markdown テーブル（実験結果の表など）が含まれるため
                          ExplanationBody を通して本物の <table> で描画する。 */}
                      {/* ★スマホ：小問行を横並びにする（ご要望8）
                          「(1)から4問縦書きになってるけど、横書きにしたら
                            1画面に収まるくない？」

                          解説画面でも演習画面とまったく同じ判定・同じ見た目にする。
                          （実測で、解説画面では (4) が画面外に切れていた）
                          条件は extractInlineQuestionRows に集約してあり、
                          科目ではなく「その問題自身が短いか」で決まる。
                          条件を満たさない問題は null が返るので、下の
                          ExplanationBody（従来の縦積み）にそのまま落ちる。 */}
                      {(() => {
                        /**
                         * ★ご要望11（スマホ・リスニングの解説）★
                         *   「第1問Aではから続く文章は要らんくて、
                         *     問題ページの^問題はいらないよね。
                         *     ここには上半分に音源(ボタン小さくして)と問題を入れて」
                         *   「一画面に収める＋受験生は何をみたいか
                         *     → 文章(スクリプト・正誤)をまずみたい
                         *       (選択肢は問題に戻れば見れる・
                         *        選択肢まで解説の方に書くとおそらく文字が収まりきらない)
                         *     → その後に解説を読みたい」
                         *
                         * ■ 何を出さないか（＝ここで削るもの）
                         *   (a) 「第1問 A では、短い英文が2回読まれます。…」の形式説明
                         *       … 解いた直後の人が読み返す情報ではない。
                         *   (b) 「【音源の聞き方】…」の操作説明
                         *       … 音源ボタンはすぐ上にあるので、説明は要らない。
                         *   (c) 選択肢 ①〜④ の一覧
                         *       … ご指摘どおり、選択肢を解説側に全部書くと
                         *         4問×4択＝16行になり1画面に収まらない。
                         *         選択肢は「問題に戻れば見れる」のでここには出さない。
                         *
                         * ■ 何を残すか
                         *   各問の設問文（問1 傘について、話者の状況に最も近い英文）だけ。
                         *   これは「何を問われたか」の思い出しに必要で、かつ1行に収まる。
                         *   スクリプト・正誤・解説は下（採点結果以降）が担当する。
                         *
                         * ■ 科目名で決め打ちしない
                         *   「英文の音源を持つ問題（audioTracks）で、かつ
                         *     問題文が『問N ＋ ①〜④』の形をしている」という
                         *   問題データ自身の形で判定する。
                         *   形が違う問題（第1問Bの図選択など）はこの分岐に入らず、
                         *   従来どおりの描画にそのまま落ちる。
                         */
                        const listeningRows = reorderMobile && isEnglishChapter
                          ? extractListeningQuestionRows(question)
                          : null;
                        if (listeningRows) {
                          return (
                            <ul className="flex flex-col gap-1">
                              {listeningRows.map((row, ri) => {
                                // 英文法：設問名（「be 動詞以外の SVC」）より、空所つきの英文そのものを出す
                                const sentence = findSubQuestionSentence(question, (question.subQuestions || [])[ri]);
                                return (
                                <li key={row.marker} className="flex items-baseline gap-1.5">
                                  <span className="shrink-0 font-bold text-gray-500">
                                    {row.marker}
                                  </span>
                                  <span className="min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere]">
                                    {formatText(sentence || row.body, [], { prose: true })}
                                  </span>
                                </li>
                                );
                              })}
                            </ul>
                          );
                        }
                        const inline = reorderMobile
                          ? extractInlineQuestionRows(cleanQuestionText(question.text))
                          : null;
                        if (!inline) {
                          return (
                            <ExplanationBody
                              text={cleanQuestionText(question.text)}
                              tone={'light'}
                              prose={isEnglishChapter}
                            />
                          );
                        }
                        return (
                          <div className="flex flex-col gap-1.5">
                            {inline.lead && (
                              <ExplanationBody
                                text={inline.lead}
                                tone={'light'}
                                prose={isEnglishChapter}
                              />
                            )}
                            {/* grid ではなく flex-wrap（想定より長い項目が来ても
                                折り返すだけで、はみ出し・文字切れにならない） */}
                            <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
                              {inline.rows.map((row, rIdx) => (
                                <li
                                  key={rIdx}
                                  className="flex min-w-0 grow basis-[calc(50%-0.25rem)] items-baseline gap-1"
                                >
                                  {row.marker && (
                                    <span className="shrink-0 font-bold text-gray-500">
                                      {formatText(row.marker)}
                                    </span>
                                  )}
                                  {/* 英語は散文として組む（化学式扱いのセリフ体を避ける） */}
                                  <span className="min-w-0">{formatText(row.body, [], { prose: isEnglishChapter })}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                      {/* 問題に付随する図・イラスト（PDF由来の図版など） */}
                      {question.imageUrl && (
                        <QuestionFigure
                          src={question.imageUrl}
                          caption={question.imageCaption}
                          figureNumber={getFigureNumber(figureNumberMap, question.id)}
                          tone={'light'}
                          className="mt-4"
                        />
                      )}

                      {/*
                        全小問の設問文一覧。

                        ★ご要望「設問一覧と問題が同じなので、同じやつはもう設問一覧いらない」★
                        ただし「数学なら消す」という決め打ちはしない。
                        全306問を走査すると、重複の有無は科目では決まらなかった
                        （数学にも重複しない問題が6件、化学基礎にも完全重複が30件ある）。
                        いちばん危険なのは「一部だけ重複」41件で、一覧ごと消すと
                        問題文に載っていない設問が読めなくなる。
                        そこで isSubQuestionListRedundant() で
                        「一覧の全項目が問題文にある問題」だけを対象にする。

                        またスマホ限定にする（PC は従来どおり一覧を出す）。
                        スマホは高さが足りないので重複を削る価値が大きいが、
                        PC は横に余裕があり、ご要望も「パソコン版は何も変更しないでね」。
                      */}
                      {(() => {
                        const sqList = buildSubQuestionList(question);
                        if (sqList.length === 0) return null;
                        if (reorderMobile && isSubQuestionListRedundant(question)) return null;
                        /* ★ご要望11★ スマホのリスニングでは、上の「問題」ブロックが
                           すでに同じ設問文（問1 傘について…）を出しているので、
                           ここで「設問一覧」を出すと同じ文字が2回並ぶ。
                           「一画面に収める」ためにも、重複する側を出さない。 */
                        if (reorderMobile && isEnglishChapter && extractListeningQuestionRows(question)) return null;
                        return (
                          <div className={`mt-4 pt-3 border-t border-dashed ${'border-gray-300'}`}>
                            <div className={`text-[11px] font-bold mb-2 flex items-center gap-1.5 ${'text-gray-500'}`}>
                              <ListOrdered size={13} />
                              <span>設問一覧</span>
                            </div>
                            <ol className="space-y-2">
                              {sqList.map((item, sIdx) => (
                                <li key={sIdx} className="flex items-start gap-2">
                                  {item.marker && (
                                    <span className={`shrink-0 font-bold text-xs px-2 py-0.5 rounded-md border mt-0.5 ${
                                      'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                      {formatText(item.marker)}
                                    </span>
                                  )}
                                  <span className="min-w-0 leading-relaxed">
                                    {formatText(item.body, [], { prose: isEnglishChapter })}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
  );
}
