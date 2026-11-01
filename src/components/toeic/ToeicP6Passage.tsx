/**
 * TOEIC Part 6：ページの上（PCでは左）に出す文書（2026-10-31）
 *
 * 空所は回の中の通し番号つき。選んだ答えを空所に入れて見せ、採点後は正誤の色を付ける
 * （Part 5 の空所と同じ .tp-blank の見た目。文挿入の長い文も入るよう、文書の中では行内で折り返す）。
 * 空所の正解は採点前には出さない。
 */
import type { SubQuestion } from '../../types/curriculum';
import { splitParagraph, type ToeicP6Set } from '../../data/toeic/toeicPart6Kit';
import { formatText } from '../../utils/textFormatter';
import { isAnswerCorrect } from '../../utils/answerJudge';
import { locateP6 } from './toeicPageModel';

export function ToeicP6Passage({ set, setIndex, offset, page, answers, scored }: {
  set: ToeicP6Set; setIndex: number; offset: number; page: readonly SubQuestion[]; answers: Record<string, string>; scored: boolean;
}) {
  const subOf = (n: number) => page.find((sq) => { const at = locateP6(sq.id); return at && at.blank === n - 1; });
  return (
    <section className="tp-doc" aria-label={`文書${setIndex + 1}（${set.genre}）`} data-toeic-doc={setIndex + 1}>
      <p className="tp-doc-head">
        <span className="tp-doc-genre">{set.genre}</span>
        <span>文書{setIndex + 1}・問{offset + 1}〜{offset + set.b.length}</span>
      </p>
      {set.title && <h3 className="tp-doc-title" lang="en">{set.title}</h3>}
      {set.p.map((para, i) => (
        <p key={i} lang="en">
          {splitParagraph(para).map((piece, j) => {
            if (piece.blank == null) return <span key={j}>{formatText(piece.text || '', [], { prose: true })}</span>;
            const no = offset + piece.blank;
            const sq = subOf(piece.blank);
            const chosen = sq ? answers[sq.id] || '' : '';
            const filled = sq && chosen ? (sq.optionTexts || [])[sq.options.indexOf(chosen)] ?? '' : '';
            const result = scored && sq && chosen ? (isAnswerCorrect(sq, chosen) ? 'right' : 'wrong') : undefined;
            return (
              <span key={j} className="tp-blank tp-doc-blank" data-filled={filled ? true : undefined} data-result={result} data-toeic-doc-blank={no}>
                <span className="tp-doc-no">({no})</span>
                {filled ? <span>{formatText(filled, [], { prose: true })}</span> : <span className="tp-sr">空所</span>}
              </span>
            );
          })}
        </p>
      ))}
    </section>
  );
}
