/**
 * TOEIC® L&R（Part 5 / Part 6 / Part 7 / リスニング）専用の解答・解説カード。
 *
 * ■ まなとび英検（EikenClozePageQuiz）＆ 英文法解説（listeningExplanation.ts）の UI 設計を踏襲：
 *   1. 問題画面と完全に同じフォント（font-modern / prose: true, noMath: true）・丸番号・空所つき英文
 *   2. 空所は誤答時に「[選んだ語句（赤取消線）] → [正解語句（緑枠）]」を英文の中で一目で対比（英検 ecp-blank-compare 方式）
 *   3. 問題画面と同じ 2×2 マーク式選択肢（長い選択肢は自動で1列）に「あなた・正解／正解／あなた」バッジを重ねる
 *   4. 1画面目で「正誤＆分野ピル＋ノート保存」「設問＋2×2選択肢」「正解の理由（紺タグ）＋和訳（ティールタグ）」がタップ不要で揃う
 *   5. 完成文の英語読み上げ（「英文を聞く」「0.8x」）＋「着眼点・ポイント・他の選択肢の理由・コツ・重要語句」を1行ツール帯から展開（英文法と同じ色札：着眼点 #2F7C74 / ポイント #B0464F / 選択肢 #5A6573 / TOEICでのコツ #1F5FA8）
 *   6. Part 6・Part 7 は関連文書、リスニングは該当パートの再生＆スクリプトも統合して確認できる
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  MinusCircle,
  Square,
  Volume2,
  XCircle,
} from 'lucide-react';
import type { Chapter, Problem, SubQuestion } from '../../types/curriculum';
import { auth } from '../../firebase';
import { notify } from '../../utils/dialog';
import { formatText } from '../../utils/textFormatter';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { isSpeechSupported, speak, stopSpeech } from '../../utils/listeningSpeech';
import { MarkedText } from '../toeic/ToeicExplanationPanel';
import { ToeicP6Passage } from '../toeic/ToeicP6Passage';
import { ToeicP7Passage } from '../toeic/ToeicP7Passage';
import { ToeicListeningAudioBar } from '../toeic/ToeicListeningAudioBar';
import { isToeicNoteSaved, saveToeicNote } from '../toeic/toeicNote';
import {
  cueMarksInWhy,
  isToeicListeningChapter,
  isToeicPart6Chapter,
  isToeicPart7Chapter,
  p6SetOf,
  p6Snippet,
  p7EvidenceDoc,
  p7SetOf,
  p7Stem,
  prefersSingleColumn,
  toeicExplanationFor,
  type ResolvedCue,
} from '../toeic/toeicPageModel';
import {
  toeicListeningChoiceTexts,
  toeicListeningPageAudioOf,
  toeicListeningStem,
} from '../../data/toeic/toeicListeningPage';
import { isAttempted } from './helpers';
import '../toeic/toeic-page.css';

const BLANK = '______';
const markLetter = (mark: string) => mark.replace(/[()]/g, '');

function questionNumberOf(sq: SubQuestion, fallback: number): number {
  const m = String(sq.label || '').match(/(\d+)/);
  return m ? Number(m[1]) : fallback;
}

function roundNumberOf(problem: Problem, fallback = 1): number {
  const m = String(problem.id || '').match(/_r(\d+)$/);
  return m ? Number(m[1]) : fallback;
}

function reviewStemOf(problem: Problem, sq: SubQuestion): string {
  const tpl = toeicListeningStem(sq, true);
  if (tpl) return tpl;
  const p7 = p7Stem(sq);
  if (p7) return p7;
  const p6 = p6Snippet(sq);
  if (p6) return p6;
  const ex = toeicExplanationFor(sq);
  if (ex) return ex.sentence;
  const label = String(sq.label || '');
  const line = String(problem.text || '')
    .split('\n')
    .find((l) => l.startsWith(`${label}　`) || l.startsWith(`${label} `));
  return line ? line.slice(label.length).trim() : '';
}

/**
 * まなとび英検の InlineBlankLine と TOEIC の StemWithBlank（手がかりマーカー）を統合した空所描画。
 * 誤答時は空所内で `[選んだ語（赤取消線）] → [正解語（緑）]` を対比表示する。
 */
function ReviewStemWithBlank({
  stem,
  chosenText,
  correctText,
  status,
  cues,
}: {
  stem: string;
  chosenText: string;
  correctText: string;
  status: 'correct' | 'wrong' | 'blank';
  cues?: readonly ResolvedCue[];
}) {
  const at = stem.indexOf(BLANK);
  const marks = (cues || []).map((c) => ({ start: c.start, length: c.phrase.length, n: c.n }));
  if (at < 0) return <MarkedText text={stem} marks={marks} />;
  const before = stem.slice(0, at);
  const after = stem.slice(at + BLANK.length);
  const afterMarks = marks.map((m) => ({ ...m, start: m.start - at - BLANK.length }));
  const showWrongCompare = status === 'wrong' && Boolean(chosenText) && Boolean(correctText);

  return (
    <>
      <MarkedText text={before} marks={marks} />
      {showWrongCompare ? (
        <span className="tp-blank-compare" data-toeic-blank>
          <span className="tp-blank" data-filled data-result="wrong">
            {formatText(chosenText, [], { prose: true, noMath: true })}
          </span>
          <span className="tp-blank-arrow" aria-hidden="true">→</span>
          <span className="tp-blank" data-filled data-result="right">
            {formatText(correctText, [], { prose: true, noMath: true })}
          </span>
        </span>
      ) : (
        <span
          className="tp-blank"
          data-filled={correctText ? true : undefined}
          data-result="right"
          data-toeic-blank
        >
          {correctText ? formatText(correctText, [], { prose: true, noMath: true }) : <span className="tp-sr">空所</span>}
        </span>
      )}
      <MarkedText text={after} marks={afterMarks} />
    </>
  );
}

export interface ToeicReviewCardProps {
  chapter: Pick<Chapter, 'id' | 'abstractTitle' | 'realTitle'>;
  question: Problem;
  allQuestions: Problem[];
  objectiveSqs: SubQuestion[];
  answers: Record<string, string>;
  isGuest?: boolean;
  compact?: boolean;
}

export function ToeicReviewCard({
  chapter,
  question,
  allQuestions,
  objectiveSqs,
  answers,
  isGuest = false,
  compact = false,
}: ToeicReviewCardProps) {
  const chapterId = chapter.id;
  const isListening = isToeicListeningChapter(chapterId);
  const isP6 = isToeicPart6Chapter(chapterId);
  const isP7 = isToeicPart7Chapter(chapterId);
  const fullQuestion = allQuestions.find((q) => q?.id === question?.id) ?? question;
  const allSubs = fullQuestion.subQuestions || objectiveSqs;
  const roundNo = roundNumberOf(fullQuestion, 1);

  const [docOpen, setDocOpen] = useState(false);
  const [docTab, setDocTab] = useState(0);
  const [openMoreBySq, setOpenMoreBySq] = useState<Record<string, boolean>>({});
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const canSpeak = useMemo(() => !isListening && isSpeechSupported(), [isListening]);

  const noteUid = auth.currentUser?.uid || 'guest';
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});
  const isSaved = (sqId: string) => savedNotes[sqId] ?? isToeicNoteSaved(noteUid, sqId);

  useEffect(() => {
    setSpeakingKey(null);
    stopSpeech();
    return () => stopSpeech();
  }, [chapterId, question.id]);

  const handleToggleSpeak = (sqId: string, textToSpeak: string, rate: number) => {
    const clean = String(textToSpeak || '').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const key = `${sqId}:${rate}`;
    if (speakingKey === key) {
      stopSpeech();
      setSpeakingKey(null);
      return;
    }
    setSpeakingKey(key);
    const started = speak(key, clean, 1, {
      rate,
      onEnd: () => setSpeakingKey((cur) => (cur === key ? null : cur)),
    });
    if (!started) setSpeakingKey(null);
  };

  const handleSaveNote = (sq: SubQuestion, no: number) => {
    const ex = toeicExplanationFor(sq);
    if (!ex || isSaved(sq.id)) return;
    try {
      saveToeicNote({ uid: noteUid, chapter, problem: fullQuestion, sq, ex, questionNo: no, roundNo });
      setSavedNotes((prev) => ({ ...prev, [sq.id]: true }));
      notify(isGuest ? 'ノートに保存しました！（ゲスト利用のため、この端末にだけ保存されます）' : 'ノートに保存しました！');
    } catch {
      notify('保存に失敗しました。');
    }
  };

  const firstSq = objectiveSqs[0];
  const p6Doc = isP6 && firstSq ? p6SetOf(firstSq) : null;
  const p7Doc = isP7 && firstSq ? p7SetOf(firstSq) : null;
  const listeningAudio = isListening && objectiveSqs.length > 0 ? toeicListeningPageAudioOf(objectiveSqs) : null;

  // Part 7 の根拠ハイライト（現在の小問の根拠を文書側にも自動反映）
  const p7Evidence: Record<number, string[]> | null = (() => {
    if (!p7Doc || !firstSq) return null;
    const q = p7SetOf({ id: firstSq.id })?.question;
    if (!q) return null;
    const map: Record<number, string[]> = {};
    for (const e of q.e) {
      const n = p7EvidenceDoc(p7Doc.set, e) - 1;
      if (n >= 0) (map[n] ||= []).push(e);
    }
    return map;
  })();

  const p6FocusBlank = isP6 && firstSq ? questionNumberOf(firstSq, 1) : null;

  return (
    <div className={`tp-review-stack${compact ? ' is-compact' : ''}`} data-toeic-review>
      {/* リスニング：対象問だけの音声再生バー＋スクリプト開閉 */}
      {listeningAudio && (
        <ToeicListeningAudioBar
          info={listeningAudio}
          scored
          pageKey={`review_${question.id}_${objectiveSqs.map((s) => s.id).join('_')}`}
        />
      )}

      {/* Part 6 / Part 7：本文（文書）を必要なときだけ開閉して確認できる（初期は畳んで1画面に設問・解説を収める） */}
      {(p6Doc || p7Doc) && (
        <details
          className="tp-review-doc-fold"
          open={docOpen || undefined}
          onToggle={(e) => setDocOpen((e.currentTarget as HTMLDetailsElement).open)}
          data-toeic-review-doc
        >
          <summary>
            <FileText size={15} aria-hidden="true" />
            <span>
              {p6Doc
                ? `本文を確認する（${p6Doc.set.genre}・文書${p6Doc.setIndex + 1}）`
                : `本文・根拠箇所を確認する（セット${(p7Doc?.setIndex ?? 0) + 1}）`}
            </span>
            <ChevronDown size={17} className="tp-ex-chev" aria-hidden="true" />
          </summary>
          <div className="tp-review-doc-body">
            {p6Doc && (
              <ToeicP6Passage
                set={p6Doc.set}
                setIndex={p6Doc.setIndex}
                offset={p6Doc.offset}
                page={allSubs}
                answers={answers}
                scored
                focusBlank={p6FocusBlank}
              />
            )}
            {p7Doc && (
              <ToeicP7Passage
                set={p7Doc.set}
                setIndex={p7Doc.setIndex}
                offset={p7Doc.offset}
                tab={docTab}
                onTab={setDocTab}
                evidence={p7Evidence}
              />
            )}
          </div>
        </details>
      )}

      {objectiveSqs.map((sq, idx) => {
        const no = questionNumberOf(sq, allSubs.findIndex((s) => s.id === sq.id) + 1 || idx + 1);
        const chosen = String(answers[sq.id] ?? '').trim();
        const attempted = isAttempted(chosen);
        const ok = attempted && isAnswerCorrect(sq, chosen);
        const status: 'correct' | 'wrong' | 'blank' = !attempted ? 'blank' : ok ? 'correct' : 'wrong';
        const ex = toeicExplanationFor(sq);
        const texts = isListening
          ? toeicListeningChoiceTexts(sq, true)
          : ex?.choices.length === sq.options.length
            ? ex.choices.map((c) => c.text)
            : (sq.optionTexts || []);
        const chosenIdx = sq.options.findIndex((m) => m.trim() === chosen);
        const correctIdx = sq.options.findIndex((m) => m.trim() === String(sq.correctAnswer ?? '').trim());
        const correctText = (correctIdx >= 0 ? texts[correctIdx] : ex?.choices.find((c) => c.correct)?.text) ?? '';
        const chosenText = chosenIdx >= 0 ? (texts[chosenIdx] ?? '') : '';
        const stem = reviewStemOf(fullQuestion, sq);
        const singleCol = prefersSingleColumn(texts);
        const moreOpen = openMoreBySq[sq.id] ?? !compact;
        const saved = isSaved(sq.id);
        const speechTarget = ex?.completed || stem.replace(BLANK, correctText);
        const hasMoreDetails = Boolean(
          ex && (
            ex.choices.some((c) => !c.correct && c.reason) ||
            ex.hint ||
            ex.rule ||
            ex.tip ||
            ex.keywords.length > 0
          ),
        );

        let verdictNode: ReactNode;
        if (status === 'correct') {
          verdictNode = (
            <span className="tp-judge" data-result="correct">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>正解</span>
            </span>
          );
        } else if (status === 'wrong') {
          verdictNode = (
            <span className="tp-judge" data-result="wrong">
              <XCircle size={16} aria-hidden="true" />
              <span>不正解（正解 {sq.correctAnswer}）</span>
            </span>
          );
        } else {
          verdictNode = (
            <span className="tp-judge" data-result="blank">
              <MinusCircle size={16} aria-hidden="true" />
              <span>未回答（正解 {sq.correctAnswer}）</span>
            </span>
          );
        }

        return (
          <article
            key={sq.id}
            id={`sq-${sq.id}`}
            className="tp-item tp-review-card"
            data-status={status}
            data-toeic-question={no}
          >
            {/* 1行目：正誤・分野小分類ピル・ノート保存（まなとび英検＆TOEIC演習と同じヘッダー構成） */}
            <div className="tp-review-head">
              <div className="tp-review-head-left">
                {verdictNode}
                {ex && (
                  <span className="tp-skill" data-toeic-skill>
                    {ex.skill}
                    {ex.subType && <small>{ex.subType}</small>}
                  </span>
                )}
              </div>
              {ex && (
                <button
                  type="button"
                  className="tp-review-save"
                  data-toeic-save
                  data-saved={saved || undefined}
                  disabled={saved}
                  onClick={() => handleSaveNote(sq, no)}
                  aria-label={saved ? `問${no}はノートに保存済み` : `問${no}をノートに保存`}
                >
                  {saved ? <BookmarkCheck size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />}
                  <span>{saved ? '保存済み' : 'ノート保存'}</span>
                </button>
              )}
            </div>

            {/* 問題文（丸番号＋空所［誤答→正解対比］＋手がかり黄色マーカー） */}
            <p className="tp-sentence tp-review-stem" lang="en">
              <span className="tp-no" aria-hidden="true">{no}</span>
              <span className="tp-sr">問{no}　</span>
              <ReviewStemWithBlank
                stem={stem}
                chosenText={chosenText}
                correctText={correctText}
                status={status}
                cues={!isP6 && !isP7 && !isListening ? ex?.cues : undefined}
              />
            </p>

            {/* 選択肢：演習画面と同じ 2×2（長い選択肢は1列）＋右上「あなた・正解／正解／あなた」バッジ */}
            <div
              className={`tp-choices is-scored tp-review-choices${singleCol ? ' is-single' : ''}`}
              aria-disabled="true"
              role="group"
              aria-label={`問${no} の選択肢と正誤`}
            >
              {sq.options.map((mark, i) => {
                const checked = chosen === mark.trim();
                const isRight = mark.trim() === String(sq.correctAnswer ?? '').trim();
                const isWrongPick = checked && !isRight;
                return (
                  <div
                    key={mark}
                    className="tp-choice"
                    data-checked={checked || undefined}
                    data-result={isRight ? 'right' : isWrongPick ? 'wrong' : undefined}
                  >
                    <span className="tp-bubble" aria-hidden="true">{markLetter(mark)}</span>
                    <span className="tp-choice-body">
                      <span className="tp-choice-text">
                        {formatText(texts[i] ?? mark, [], { prose: true, noMath: true })}
                      </span>
                    </span>
                    {(isRight || isWrongPick) && (
                      <span className="tp-choice-badge" data-tone={isRight ? 'right' : 'wrong'} data-toeic-badge>
                        {isRight && checked ? 'あなた・正解' : isRight ? '正解' : 'あなた'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* まなとび英検＆英文法スタイル：左に色札（要点・和訳・根拠）を添えた高密度解説ボックス */}
            {ex && (
              <div className="tp-review-ex-box" data-toeic-core>
                {(isP6 || isP7 || isListening) && ex.sentence && ex.sentence !== stem && (
                  <div className="tp-review-line" data-role="evidence">
                    <span className="tp-review-tag" data-role="hint">
                      {isP7 ? '根拠' : isListening ? '音声' : '文脈'}
                    </span>
                    <p className="tp-review-line-text is-en" lang="en">
                      <ReviewStemWithBlank
                        stem={ex.sentence}
                        chosenText=""
                        correctText={correctText}
                        status="correct"
                        cues={ex.cues}
                      />
                    </p>
                  </div>
                )}

                <div className="tp-review-line is-key" data-role="key" data-toeic-section="key">
                  <span className="tp-review-tag" data-role="key">要点</span>
                  <p className="tp-review-line-text">
                    <MarkedText text={ex.why} marks={cueMarksInWhy(ex.cues)} />
                  </p>
                </div>

                {ex.translation && (
                  <div className="tp-review-line" data-role="tr" data-toeic-section="tr">
                    <span className="tp-review-tag" data-role="tr">和訳</span>
                    <p className="tp-review-line-text is-tr whitespace-pre-line">{ex.translation}</p>
                  </div>
                )}

                {/* ツール帯：完成文の英語音声再生（英文を聞く / 0.8x）＋他の選択肢・ポイントの開閉（まなとび英検 ecp-ex-subtools 方式） */}
                {(canSpeak || hasMoreDetails) && (
                  <div className="tp-review-subtools">
                    {canSpeak && speechTarget && (
                      <div className="tp-review-audio-btns">
                        <button
                          type="button"
                          className="tp-review-speak-btn"
                          data-speaking={speakingKey === `${sq.id}:1` || undefined}
                          onClick={() => handleToggleSpeak(sq.id, speechTarget, 1)}
                        >
                          {speakingKey === `${sq.id}:1` ? <Square size={12} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
                          <span>{speakingKey === `${sq.id}:1` ? '停止' : '英文を聞く'}</span>
                        </button>
                        <button
                          type="button"
                          className="tp-review-speak-btn is-slow"
                          data-speaking={speakingKey === `${sq.id}:0.8` || undefined}
                          onClick={() => handleToggleSpeak(sq.id, speechTarget, 0.8)}
                          aria-label="完成文を0.8倍速でゆっくり聞く"
                        >
                          <span>{speakingKey === `${sq.id}:0.8` ? '停止' : '0.8x'}</span>
                        </button>
                      </div>
                    )}

                    {hasMoreDetails && (
                      <button
                        type="button"
                        className="tp-review-more-btn"
                        aria-expanded={moreOpen}
                        onClick={() => setOpenMoreBySq((prev) => ({ ...prev, [sq.id]: !moreOpen }))}
                        data-toeic-more-toggle
                      >
                        <span>{moreOpen ? '詳細を閉じる' : '選択肢の理由・ポイント'}</span>
                        <ChevronDown size={15} className={`tp-ex-chev${moreOpen ? ' is-open' : ''}`} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {/* 展開部：英文法と同じ色札（着眼点 #2F7C74・ポイント #B0464F・選択肢 #5A6573・コツ #1F5FA8）＋重要語チップ */}
                {moreOpen && hasMoreDetails && (
                  <div className="tp-review-more-body" data-toeic-more>
                    {ex.hint && (
                      <div className="tp-review-line" data-role="hint">
                        <span className="tp-review-tag" data-role="hint">着眼点</span>
                        <p className="tp-review-line-text">{ex.hint}</p>
                      </div>
                    )}
                    {ex.rule && (
                      <div className="tp-review-line" data-role="rule">
                        <span className="tp-review-tag" data-role="rule">ポイント</span>
                        <p className="tp-review-line-text">{ex.rule}</p>
                      </div>
                    )}
                    <div className="tp-review-line" data-role="choices">
                      <span className="tp-review-tag" data-role="choices">選択肢</span>
                      <ul className="tp-ex-choices tp-review-choice-reasons">
                        {ex.choices.map((c) => (
                          <li key={c.mark} data-correct={c.correct || undefined}>
                            <span className="tp-ex-mark" aria-hidden="true">{c.correct ? '○' : '×'}</span>
                            <span>
                              <b lang="en">{c.mark} {formatText(c.text, [], { prose: true, noMath: true })}</b>
                              {' — '}
                              {c.correct ? '正解' : c.reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {ex.tip && (
                      <div className="tp-review-line" data-role="tip">
                        <span className="tp-review-tag" data-role="tip">コツ</span>
                        <p className="tp-review-line-text is-tip">{ex.tip}</p>
                      </div>
                    )}
                    {ex.keywords.length > 0 && (
                      <div className="tp-review-vocab-chips" aria-label="重要語句">
                        {ex.keywords.map((w) => (
                          <span key={w.en} className="tp-review-vocab-chip">
                            <strong lang="en">{formatText(w.en, [], { prose: true, noMath: true })}</strong>
                            <span>{w.ja}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
