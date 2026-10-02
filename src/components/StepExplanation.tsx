/**
 * 1問ずつ進む演習（リスニング・英文法）の「解答と解説」画面（2026-10-02 D2 改訂）。
 *
 * ■ ご要望
 *   ・ひとりで学ぶの解答と解説が前のまま過ぎる。マナコイン（点数の演出）はいらない。
 *   ・1つのセクションは「問1 → 解説 → 問2 → 解説 → …」の流れ。
 *   ・対戦とつながっているので、操作が全然違うとこんがらがる。
 *     ただし完全に同じだと今どちらを解いているか分からなくなる。
 *
 * ■ 作り
 *   対戦の結果カード（BattleResult）と同じ並び・同じ言葉にそろえる：
 *     正解/不正解の帯 → 問題 → あなたの回答 → 正しい答え → ひとことの理由 → 詳しい解説
 *   違いを出すのは「色と見出し」だけ。対戦は夜の青、演習は紙のクリーム＋「演習」の札。
 *   点数・コンボ・ランキングの演出は出さない（学習に集中する画面）。
 *   ボタンは下に2つだけ：「問題に戻る」「次の問題へ（問N+1）」。
 */
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, CircleCheck, CircleX, Lightbulb, PenLine } from 'lucide-react';
import { ExplanationBody } from './ExplanationBody';
import { ListeningAudioPlayer } from './ListeningAudioPlayer';
import { sliceEnhancedBySubQuestion } from '../utils/explanationFormat';
import { isAnswerCorrect } from '../utils/answerJudge';
import { buildListeningOptionTexts } from '../utils/listeningOptions';
import { stepLabelOf } from '../utils/listeningSteps';
import './step-explanation.css';

const MARKS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

/** 英文法の問題文から「問N　文」と選択肢を取り出す（データの書式は englishGrammarKit.ts で固定） */
function grammarBlock(text: string, no: number): { sentence: string; choices: string[] } | null {
  const lines = String(text || '').split('\n');
  const at = lines.findIndex((l) => new RegExp(`^問${no}[\\s　]`).test(l.trim()));
  if (at < 0) return null;
  const sentence = lines[at].trim().replace(new RegExp(`^問${no}[\\s　]+`), '');
  const choices: string[] = [];
  for (let i = at + 1; i < lines.length; i++) {
    const m = lines[i].trim().match(/^([①-⑧])\s*(.+)$/);
    if (!m) break;
    choices.push(m[2]);
  }
  return { sentence, choices };
}

/** 解説本文の最初の段落から「ひとことの理由」を作る（なければ出さない） */
function oneLineReason(sub: any): string {
  const theme = sub?.detailedExplanation?.theme;
  return typeof theme === 'string' ? theme.trim() : '';
}

export interface StepExplanationProps {
  chapter: any;
  question: any;
  /** いま解説している小問（音源1本に複数の解答欄がある回では複数） */
  subs: any[];
  answers: Record<string, string>;
  /** 回の中の位置（1始まり）と総数 */
  position: number;
  total: number;
  /** 次の問のラベル（「問2」など）。範囲の最後なら null */
  nextLabel: string | null;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function StepExplanation({ chapter, question, subs, answers, position, total, nextLabel, isLast, onBack, onNext }: StepExplanationProps) {
  const [openDetail, setOpenDetail] = useState(true);
  const slices = useMemo(() => sliceEnhancedBySubQuestion(String(question?.explanation || '')), [question]);
  const optionTexts = useMemo(() => buildListeningOptionTexts(question), [question]);
  const tracks: any[] = Array.isArray(question?.audioTracks) ? question.audioTracks : [];
  const subIds = new Set(subs.map((s) => String(s.id)));
  const focusedTracks = tracks.filter((t) => subIds.has(String(t?.subId)) || (Array.isArray(t?.subIds) && t.subIds.some((id: string) => subIds.has(String(id)))));
  const isListening = tracks.length > 0;
  const allCorrect = subs.every((sq) => isAnswerCorrect(sq, answers[sq.id]));
  const anyAnswered = subs.some((sq) => !!answers[sq.id]);
  const unitTitle = String(chapter?.abstractTitle || chapter?.title || '');

  return (
    <div className="step-ex" data-step-explanation data-result={allCorrect ? 'correct' : 'wrong'}>
      <header className="step-ex-head">
        <button type="button" className="step-ex-back" onClick={onBack} aria-label="問題に戻る"><ArrowLeft size={18} aria-hidden="true" /></button>
        <div className="step-ex-title">
          <span className="step-ex-mode"><PenLine size={12} aria-hidden="true" />演習</span>
          <strong>{unitTitle}</strong>
        </div>
        <span className="step-ex-progress" aria-label={`${total}問中${position}問目`}>{position}<small>/{total}</small></span>
      </header>
      <ol className="step-ex-dots" aria-hidden="true">{Array.from({ length: total }, (_, i) => <li key={i} data-state={i + 1 < position ? 'done' : i + 1 === position ? 'now' : 'todo'} />)}</ol>

      <main className="step-ex-body">
        {subs.map((sq, i) => {
          const ok = isAnswerCorrect(sq, answers[sq.id]);
          const picked = answers[sq.id] || '';
          const label = stepLabelOf(sq, i);
          const no = Number(label.replace(/\D/g, '')) || i + 1;
          const block = isListening ? null : grammarBlock(String(question?.text || ''), no);
          const texts = optionTexts.get(sq.id) || block?.choices || [];
          const textOf = (mark: string) => { const idx = MARKS.indexOf(String(mark).trim()); return idx >= 0 && texts[idx] ? texts[idx] : ''; };
          const body = slices?.subs.find((s) => s.id === sq.id)?.body || '';
          const reason = oneLineReason(sq);
          return (
            <article key={sq.id} className="step-ex-card" data-correct={ok}>
              <div className="step-ex-verdict">
                {ok ? <CircleCheck size={22} aria-hidden="true" /> : <CircleX size={22} aria-hidden="true" />}
                <strong>{ok ? '正解' : picked ? '不正解' : '未回答'}</strong>
                <span>{label}</span>
              </div>
              {block?.sentence && <p className="step-ex-question">{block.sentence}</p>}
              <dl className="step-ex-answers">
                <div data-kind="mine"><dt>あなたの回答</dt><dd>{picked ? <><b>{picked}</b>{textOf(picked) && <span>{textOf(picked)}</span>}</> : '未回答'}</dd></div>
                <div data-kind="right"><dt>正しい答え</dt><dd><b>{String(sq.correctAnswer)}</b>{textOf(String(sq.correctAnswer)) && <span>{textOf(String(sq.correctAnswer))}</span>}</dd></div>
              </dl>
              {reason && <p className="step-ex-reason"><Lightbulb size={14} aria-hidden="true" />{reason}</p>}
            </article>
          );
        })}

        {isListening && focusedTracks.length > 0 && (
          <section className="step-ex-audio" aria-label="音声とスクリプト">
            <ListeningAudioPlayer tracks={focusedTracks} mode="review" tone="light" title="もう一度聞く（スクリプトつき）" readCount={question?.readCount === 1 ? 1 : 2} compact />
          </section>
        )}

        <section className="step-ex-detail">
          <button type="button" className="step-ex-detail-toggle" aria-expanded={openDetail} onClick={() => setOpenDetail((v) => !v)}>
            <BookOpen size={16} aria-hidden="true" />詳しい解説<ChevronDown size={16} aria-hidden="true" data-open={openDetail} />
          </button>
          {openDetail && <div className="step-ex-detail-body">
            {subs.map((sq) => {
              const body = slices?.subs.find((s) => s.id === sq.id)?.body || '';
              return body ? <div key={sq.id}><ExplanationBody text={body} prose /></div> : null;
            })}
            {!slices && <ExplanationBody text={String(question?.explanation || '')} prose />}
            {!anyAnswered && <p className="step-ex-note">答えを選んでから解説を読むと、どこで迷ったかが分かりやすくなります。</p>}
          </div>}
        </section>
      </main>

      <footer className="step-ex-foot">
        <button type="button" className="step-ex-secondary" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />問題に戻る</button>
        <button type="button" className="step-ex-primary" onClick={onNext} data-step-next>
          {isLast ? '結果を見る' : nextLabel ? `次の問題へ（${nextLabel}）` : '次の問題へ'}<ArrowRight size={16} aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
