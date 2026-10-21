import React from 'react';
import { BookOpen, CheckCircle2, ChevronDown, Circle, KeyRound, XCircle } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { answerCardMarker, optionCircledMark } from '../../utils/questionDisplay';
import { stripScriptBox } from '../../utils/listeningExplanation';
import { ExplanationBody } from '../ExplanationBody';
import { ListeningEvidenceScript } from '../ListeningAudioPlayer';
import { isAttempted, pictureCellOf } from './helpers';
import type { AudioTrack, Problem, SubQuestion } from '../../types/curriculum';

/**
 * リスニング（と英文法の英文トラック）の答え合わせ：1画面で完結させる形。
 * スマホ（reorderMobile）と PC のリスニング（pcListening）の両方で使う。
 * 2026-10-13 のリファクタリングで Explanation.tsx から切り出した。JSX・クラス名・文言・並び順は元のまま。
 *
 * ★リスニングの解説（スマホ）：1画面で完結させる（2026-09-30 利用者の要望）★
 *   「上に再生があるのに下にもう一度再生ボタンは要らない。
 *     この1画面に解説とスクリプトを持ってきたい。詳細解説はボタンで伸びればいい」
 *   ・再生は上の帯だけ（下の2つ目のプレーヤーは出さない）
 *   ・問ごとに「○×・あなたの答え→正解」を1行で出す
 *   ・その下にスクリプトと和訳を直接出す（押さなくても読める）
 *   ・解説／思考手順／押さえたい表現はタップで開く
 *
 * ★2026-10-21：要点（lx-core）と思考手順（lx-steps）の英語も prose で組む★
 *   以前は formatText(theme) のままで、英単語が化学式・数式用のセリフ体（Cambria Math）に化けていた。
 *
 * 開閉の状態（openExplanationBySq）は親が持ったまま。ここでは読むのと、親の setter を呼ぶだけ。
 */
export function ListeningCompactAnswers({
  question, objectiveSqs, answers, listeningTracks, optionTextsBySq, pcListening,
  openExplanationBySq, setOpenExplanationBySq, sliceForSq,
  explBodyBaseClass, explBodyFontClass, isEnglishChapter, isPracticeMode,
}: {
  question: Problem;
  objectiveSqs: SubQuestion[];
  answers: Record<string, string>;
  listeningTracks: AudioTrack[];
  optionTextsBySq: Map<string, string[]>;
  pcListening: boolean;
  openExplanationBySq: Record<string, boolean>;
  setOpenExplanationBySq: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  sliceForSq: (sq: SubQuestion) => string;
  explBodyBaseClass: string;
  explBodyFontClass: string;
  isEnglishChapter: boolean;
  isPracticeMode: boolean;
}) {
  return (
                                  <div className={`lx-compact${pcListening ? ' is-pc' : ''}`} data-listening-explanation>
                                    {/* ★2026-10-02 夜（ご指摘）：問題画面と同じ選択肢の並びの上に、
                                         正解（緑）・自分が選んだ不正解（赤）を直接つける。
                                         「問題は固定で、今の選択肢のところに合ってるか間違ってるか」 */}
                                    {objectiveSqs.map((sq) => {
                                      const ok = isAnswerCorrect(sq, answers[sq.id]);
                                      const attempted = isAttempted(answers[sq.id]);
                                      const sqIdx = (question?.subQuestions || []).indexOf(sq);
                                      const marker = answerCardMarker(sq, sqIdx < 0 ? 0 : sqIdx, question);
                                      const status = !attempted ? 'none' : ok ? 'ok' : 'ng';
                                      const options: string[] = Array.isArray(sq.options) ? sq.options : [];
                                      const texts = optionTextsBySq.get(sq.id);
                                      const mine = String(answers[sq.id] ?? '');
                                      const right = String(sq.correctAnswer ?? '');
                                      const hasImages = Array.isArray(sq.optionImages);
                                      return (
                                        <section key={`lx-${sq.id}`} className="lx-choices" data-status={status} aria-label={`${marker} の答え合わせ`}>
                                          <header className="lx-choices-head">
                                            <span className="lx-result-mark" aria-hidden="true">{status === 'none' ? <Circle size={18} /> : ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span>
                                            <span className="lx-result-label">{formatText(marker)}</span>
                                            <span className="lx-result-verdict">{status === 'none' ? '未解答' : ok ? '正解' : '不正解'}</span>
                                          </header>
                                          {options.length > 0 && !hasImages ? (
                                            <ol className={`lx-choice-list${pictureCellOf(sq, 0, options.length) ? ' is-pics' : ''}`}>
                                              {options.map((opt, oi) => {
                                                const isRight = opt.trim() === right.trim();
                                                const isMine = attempted && opt.trim() === mine.trim();
                                                const tone = isRight ? 'right' : isMine ? 'wrong' : 'plain';
                                                const body = texts?.[oi];
                                                const mark = optionCircledMark(opt, oi);
                                                // ★2026-10-08 絵の問題（第1問B・第2問）★ 選択肢は①〜④の記号だけなので、
                                                //   復習のときに「どんな問題だったか」が分からなかった。
                                                //   問題のイラスト（2×2 の4コマ）から、その選択肢の1コマを切り出して並べる。
                                                const pic = pictureCellOf(sq, oi, options.length);
                                                return (
                                                  <li key={opt + oi} className={`lx-choice${pic ? ' has-pic' : ''}`} data-tone={tone} data-mine={isMine || undefined}>
                                                    {pic && <span className="lx-choice-pic" role="img" aria-label={`${mark || opt} のイラスト`} style={pic} />}
                                                    <span className="lx-choice-mark">{mark ? `${mark} ` : ''}{formatText(opt)}</span>
                                                    {body && <span className="lx-choice-text">{formatText(body, [], { prose: true })}</span>}
                                                    {(isRight || isMine) && (
                                                      <span className="lx-choice-tag">{isRight && isMine ? 'あなた・正解' : isRight ? '正解' : 'あなた'}</span>
                                                    )}
                                                  </li>
                                                );
                                              })}
                                            </ol>
                                          ) : (
                                            <p className="lx-result-answers">
                                              {attempted && !ok && <><span className="lx-yours">{formatText(mine)}</span><span aria-hidden="true">→</span></>}
                                              <span className="lx-right" aria-label={`正解 ${right}`}>{formatText(right)}</span>
                                            </p>
                                          )}
                                        </section>
                                      );
                                    })}
                                    {/* PC はスクリプトを左の音源パネルに出しているので、ここでは出さない（同じものを2つ置かない） */}
                                    {!pcListening && listeningTracks.map((track) => (
                                      <section key={`lx-script-${track.subId}`} className="lx-script" aria-label={`${track.label} のスクリプト`}>
                                        {listeningTracks.length > 1 && <h5>{track.label}</h5>}
                                        <ListeningEvidenceScript track={track} collapsiblePhrases showHint={false} />
                                      </section>
                                    ))}
                                    {objectiveSqs.map((sq) => {
                                      const slice = stripScriptBox(sliceForSq(sq));
                                      // PC は最初から開いておく（閉じたら閉じたまま）
                                      const open = openExplanationBySq[sq.id] ?? pcListening;
                                      const sqIdx = (question?.subQuestions || []).indexOf(sq);
                                      const marker = answerCardMarker(sq, sqIdx < 0 ? 0 : sqIdx, question);
                                      const theme = sq.detailedExplanation?.theme;
                                      const steps: string[] = sq.detailedExplanation?.steps || [];
                                      return (
                                        <div key={`lx-ex-${sq.id}`} className="lx-fold">
                                          <button type="button" onClick={() => setOpenExplanationBySq(prev => ({ ...prev, [sq.id]: !open }))} aria-expanded={open}>
                                            <BookOpen size={16} aria-hidden="true" />
                                            <span>{objectiveSqs.length > 1 ? <>{formatText(marker)} の</> : null}詳しい解説</span>
                                            <ChevronDown size={18} aria-hidden="true" className={open ? 'rotate-180' : ''} />
                                          </button>
                                          {open && (
                                            <div className={`lx-fold-body ${explBodyBaseClass}`}>
                                              {theme && <p className="lx-core"><KeyRound size={14} aria-hidden="true" />{formatText(theme, [], { prose: isEnglishChapter })}</p>}
                                              {slice.trim()
                                                ? <ExplanationBody text={slice} tone="light" prose={isEnglishChapter} className={`${explBodyFontClass} text-gray-700`} />
                                                : !theme && <p className="text-xs text-gray-500">この問の解説は下の「共通ポイント」にまとめています。</p>}
                                              {steps.length > 0 && isPracticeMode && (
                                                <ol className="lx-steps">{steps.map((step, i) => <li key={i}><b>{i + 1}</b><span>{formatText(step, [], { prose: isEnglishChapter })}</span></li>)}</ol>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
  );
}
