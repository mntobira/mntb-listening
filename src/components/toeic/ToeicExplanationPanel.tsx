/**
 * TOEIC Part 5：採点後の解説（1問ぶん）と、手がかりのマーカー（2026-10-29）
 *
 * 英文法の解説（listeningExplanation.ts の styleReasonLine：【着眼点】【ポイント】【選択肢】【入試ではここ】の札）と
 * 同じ「役割ごとに色と形が違う札」の型を、TOEIC 専用に作り直したもの。英文法側の部品は変えていない（複製）。
 *   札の色は英文法と同じ値：着眼点 #2F7C74／ポイント #B0464F／選択肢 #5A6573／TOEICでのコツ #1F5FA8（入試ではここ と同じ）
 *   いちばん目立たせるのは「正解の理由」（紺の札＋淡い紺の面＋左の太線＋太字）。
 *   札には色だけでなくアイコンと文言も付ける。
 * マーカーは英文法・リスニングと同じ見た目（黄色＋下線＋番号。.listening-evidence と同じ値）。
 */
import type { ReactNode } from 'react';
import { BookOpen, Briefcase, ChevronDown, KeyRound, Languages, Lightbulb, ListChecks, Search } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { cueMarksInWhy, splitByMarks, type ResolvedCue, type ToeicExplanation } from './toeicPageModel';

const BLANK = '______';

/** 文の一部に、番号つきの黄色いマーカーを引いて描く */
export function MarkedText({ text, marks }: { text: string; marks: readonly { start: number; length: number; n: number }[] }) {
  if (!text) return null;
  return (
    <>
      {splitByMarks(text, marks).map((piece, i) => piece.cue
        ? <mark key={i} className="tp-cue" data-toeic-cue={piece.cue} aria-label={`手がかり${piece.cue}`}><sup aria-hidden="true">{piece.cue}</sup>{piece.text}</mark>
        : <span key={i}>{formatText(piece.text, [], { prose: true, noMath: true })}</span>)}
    </>
  );
}

/**
 * 英文の空所 ______ を「太い下線の枠」にして描く。選んだ語があれば空所に入れて見せる。
 * cues を渡すと、問題文の中の手がかりにマーカーを引く（採点後だけ渡す）。
 */
export function StemWithBlank({ stem, filled, result, cues }: {
  stem: string; filled: string; result?: 'right' | 'wrong'; cues?: readonly ResolvedCue[];
}) {
  const at = stem.indexOf(BLANK);
  const marks = (cues || []).map((c) => ({ start: c.start, length: c.phrase.length, n: c.n }));
  if (at < 0) return <MarkedText text={stem} marks={marks} />;
  const before = stem.slice(0, at);
  const after = stem.slice(at + BLANK.length);
  const afterMarks = marks.map((m) => ({ ...m, start: m.start - at - BLANK.length }));
  return (
    <>
      <MarkedText text={before} marks={marks} />
      <span className="tp-blank" data-filled={filled ? true : undefined} data-result={result} data-toeic-blank>
        {filled ? formatText(filled, [], { prose: true, noMath: true }) : <span className="tp-sr">空所</span>}
      </span>
      <MarkedText text={after} marks={afterMarks} />
    </>
  );
}

type Role = 'key' | 'hint' | 'rule' | 'choices' | 'tip' | 'tr' | 'kw';
const ICON: Record<Role, ReactNode> = {
  key: <KeyRound size={14} aria-hidden="true" />,
  hint: <Search size={13} aria-hidden="true" />,
  rule: <Lightbulb size={13} aria-hidden="true" />,
  choices: <ListChecks size={13} aria-hidden="true" />,
  tip: <Briefcase size={13} aria-hidden="true" />,
  tr: <Languages size={13} aria-hidden="true" />,
  kw: <BookOpen size={13} aria-hidden="true" />,
};

function Section({ role, label, children }: { role: Role; label: string; children: ReactNode }) {
  return (
    <section className="tp-sec" data-role={role} data-toeic-section={role}>
      <h4 className="tp-lbl" data-role={role}>{ICON[role]}<span>{label}</span></h4>
      {children}
    </section>
  );
}

/**
 * 1問ぶんの解説。誤答・未回答は最初から開き、正解は閉じておく（open は親が持つ）。
 * 開いたら、問題文の再掲から重要語句まで全部見える（中で更に畳まない）。
 */
export function ToeicExplanationPanel({ ex, correctText, open, onToggle }: {
  ex: ToeicExplanation; correctText: string; open: boolean; onToggle: (open: boolean) => void;
}) {
  return (
    <details className="tp-ex" data-toeic-explanation open={open || undefined}
      onToggle={(e) => { const next = (e.currentTarget as HTMLDetailsElement).open; if (next !== open) onToggle(next); }}>
      <summary>
        <BookOpen size={16} aria-hidden="true" />
        <span>{open ? '解説を閉じる' : '解説を見る'}</span>
        <ChevronDown size={18} className="tp-ex-chev" aria-hidden="true" />
      </summary>
      <div className="tp-ex-body">
        {/* Part 7（2026-11-02）：再掲は「根拠」の英文。どこを読めば答えが出るかを札で示す */}
        {ex.prompt && <h4 className="tp-lbl" data-role="hint" data-toeic-evidence-label>{ICON.hint}<span>根拠（文書の英文）</span></h4>}
        <p className="tp-ex-recap" lang="en" data-toeic-recap>
          <StemWithBlank stem={ex.sentence} filled={correctText} result="right" cues={ex.cues} />
        </p>
        <section className="tp-sec tp-sec-key" data-role="key" data-toeic-section="key">
          <h4 className="tp-lbl" data-role="key">{ICON.key}<span>正解の理由</span></h4>
          <p><MarkedText text={ex.why} marks={cueMarksInWhy(ex.cues)} /></p>
        </section>
        {ex.hint && <Section role="hint" label="着眼点"><p>{ex.hint}</p></Section>}
        {ex.rule && <Section role="rule" label="ポイント"><p>{ex.rule}</p></Section>}
        <Section role="choices" label="選択肢">
          <ul className="tp-ex-choices">
            {ex.choices.map((c) => (
              <li key={c.mark} data-correct={c.correct || undefined}>
                <span className="tp-ex-mark" aria-hidden="true">{c.correct ? '○' : '×'}</span>
                <span><b lang="en">{c.mark} {c.text}</b>　{c.correct ? '正解' : c.reason}</span>
              </li>
            ))}
          </ul>
        </Section>
        {ex.tip && <Section role="tip" label="TOEICでのコツ"><p>{ex.tip}</p></Section>}
        <Section role="tr" label="和訳"><p>{ex.translation}</p></Section>
        {ex.keywords.length > 0 && (
          <Section role="kw" label="重要語句">
            <ul className="tp-ex-words">{ex.keywords.map((w) => <li key={w.en}><b lang="en">{w.en}</b>　{w.ja}</li>)}</ul>
          </Section>
        )}
      </div>
    </details>
  );
}
