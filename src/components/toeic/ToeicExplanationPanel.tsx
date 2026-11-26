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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, Briefcase, ChevronDown, KeyRound, Languages, Lightbulb, ListChecks, Search, Square, Volume2 } from 'lucide-react';
import { formatText } from '../../utils/textFormatter';
import { isSpeechSupported, speak, stopSpeech } from '../../utils/listeningSpeech';
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
 * 採点後の誤答・未回答時は `[誤答 → 正解]` を問題文の空所にインラインで直接表示する。
 * cues を渡すと、問題文の中の手がかりにマーカーを引く（採点後だけ渡す）。
 */
export function StemWithBlank({ stem, filled, correctWord, compareRight, result, cues }: {
  stem: string; filled: string; correctWord?: string; compareRight?: string; result?: 'right' | 'wrong' | 'blank'; cues?: readonly ResolvedCue[];
}) {
  const at = stem.indexOf(BLANK);
  const marks = (cues || []).map((c) => ({ start: c.start, length: c.phrase.length, n: c.n }));
  if (at < 0) return <MarkedText text={stem} marks={marks} />;
  const before = stem.slice(0, at);
  const after = stem.slice(at + BLANK.length);
  const afterMarks = marks.map((m) => ({ ...m, start: m.start - at - BLANK.length }));
  const targetRight = correctWord ?? compareRight;
  const showCorrection = (result === 'wrong' || result === 'blank') && Boolean(targetRight);
  return (
    <>
      <MarkedText text={before} marks={marks} />
      {showCorrection ? (
        <span className="tp-blank-compare" data-toeic-blank>
          {result === 'wrong' && filled && (
            <>
              <span className="tp-blank" data-filled data-result="wrong">
                {formatText(filled, [], { prose: true, noMath: true })}
              </span>
              <span className="tp-blank-arrow" aria-hidden="true">→</span>
            </>
          )}
          <span className="tp-blank" data-filled data-result="right">
            {formatText(targetRight || '', [], { prose: true, noMath: true })}
          </span>
        </span>
      ) : (
        <span className="tp-blank" data-filled={filled ? true : undefined} data-result={result === 'blank' ? undefined : result} data-toeic-blank>
          {filled ? formatText(filled, [], { prose: true, noMath: true }) : <span className="tp-sr">空所</span>}
        </span>
      )}
      <MarkedText text={after} marks={afterMarks} />
    </>
  );
}

type Role = 'key' | 'hint' | 'rule' | 'choices' | 'tip' | 'tr' | 'kw';
const ICON: Record<Role, ReactNode> = {
  key: <KeyRound size={13} aria-hidden="true" />,
  hint: <Search size={12} aria-hidden="true" />,
  rule: <Lightbulb size={12} aria-hidden="true" />,
  choices: <ListChecks size={12} aria-hidden="true" />,
  tip: <Briefcase size={12} aria-hidden="true" />,
  tr: <Languages size={12} aria-hidden="true" />,
  kw: <BookOpen size={12} aria-hidden="true" />,
};

function Section({ role, label, children }: { role: Role; label: string; children: ReactNode }) {
  return (
    <section className="tp-sec tp-sec-inline" data-role={role} data-toeic-section={role}>
      <h4 className="tp-lbl" data-role={role}>{ICON[role]}<span>{label}</span></h4>
      <div className="tp-sec-content">{children}</div>
    </section>
  );
}

/**
 * 1問ぶんの解説。誤答・未回答は最初から開き、正解は閉じておく（open は親が持つ）。
 * 問題カードに既に空所比較と選択肢が表示されているため、Part 5/6 では重複する再掲を省き、
 * 「和訳」「要点（正解の理由）」をすぐ読める2ブロック中心にし、音声読み上げと他の選択肢の理由・ポイントの開閉を備える。
 */
export function ToeicExplanationPanel({ ex, correctText, open, onToggle, disableSpeech = false }: {
  ex: ToeicExplanation; correctText: string; open: boolean; onToggle: (open: boolean) => void; disableSpeech?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [speakingRate, setSpeakingRate] = useState<number | null>(null);
  const canSpeak = useMemo(() => !disableSpeech && isSpeechSupported(), [disableSpeech]);
  const speechTarget = ex.completed || ex.sentence.replace(BLANK, correctText);
  const hasMoreDetails = Boolean(
    ex.hint ||
    ex.rule ||
    ex.choices.some((c) => !c.correct && c.reason) ||
    ex.tip,
  );

  useEffect(() => () => stopSpeech(), []);

  const toggleSpeak = (rate: number) => {
    const clean = String(speechTarget || '').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    if (speakingRate === rate) {
      stopSpeech();
      setSpeakingRate(null);
      return;
    }
    setSpeakingRate(rate);
    const key = `tp_ex_${rate}_${clean.slice(0, 24)}`;
    const started = speak(key, clean, 1, {
      rate,
      onEnd: () => setSpeakingRate((cur) => (cur === rate ? null : cur)),
    });
    if (!started) setSpeakingRate(null);
  };

  return (
    <details className="tp-ex" data-toeic-explanation open={open || undefined}
      onToggle={(e) => { const next = (e.currentTarget as HTMLDetailsElement).open; if (next !== open) onToggle(next); }}>
      <summary>
        <BookOpen size={15} aria-hidden="true" />
        <span>{open ? '解説を閉じる' : '訳・解説を見る'}</span>
        <ChevronDown size={17} className="tp-ex-chev" aria-hidden="true" />
      </summary>
      <div className="tp-ex-body tp-ex-compact">
        {/* Part 7 など根拠英文が設問文と別にある問題だけ根拠英文を表示する */}
        {ex.prompt && (
          <div className="tp-ex-evidence-box">
            <h4 className="tp-lbl" data-role="hint" data-toeic-evidence-label>{ICON.hint}<span>根拠（文書の英文）</span></h4>
            <p className="tp-ex-recap" lang="en" data-toeic-recap>
              <StemWithBlank stem={ex.sentence} filled={correctText} result="right" cues={ex.cues} />
            </p>
          </div>
        )}
        <p className="tp-ex-compact-line" data-toeic-section="tr">
          <span className="tp-ex-pill">和訳</span>
          <span>{formatText(ex.translation, [], { prose: true, noMath: true })}</span>
        </p>
        <div className="tp-ex-compact-line tp-ex-compact-key" data-toeic-section="key">
          <span className="tp-ex-pill tp-ex-pill-key">要点</span>
          <p><MarkedText text={ex.why} marks={cueMarksInWhy(ex.cues)} /></p>
        </div>
        {ex.keywords.length > 0 && (
          <div className="tp-ex-word-chips" data-toeic-section="kw">
            {ex.keywords.map((w) => (
              <span key={w.en} className="tp-ex-word-chip">
                <b lang="en">{formatText(w.en, [], { prose: true, noMath: true })}</b>
                <span>{w.ja}</span>
              </span>
            ))}
          </div>
        )}
        {(canSpeak || hasMoreDetails) && (
          <div className="tp-ex-subtools">
            {canSpeak && speechTarget && (
              <div className="tp-ex-audio-btns">
                <button
                  type="button"
                  className="tp-ex-speak-btn"
                  data-speaking={speakingRate === 1 || undefined}
                  onClick={() => toggleSpeak(1)}
                >
                  {speakingRate === 1 ? <Square size={12} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
                  <span>{speakingRate === 1 ? '停止' : '英文を聞く'}</span>
                </button>
                <button
                  type="button"
                  className="tp-ex-speak-btn is-slow"
                  data-speaking={speakingRate === 0.8 || undefined}
                  onClick={() => toggleSpeak(0.8)}
                  aria-label="完成文を0.8倍速でゆっくり聞く"
                >
                  <span>{speakingRate === 0.8 ? '停止' : '0.8x'}</span>
                </button>
              </div>
            )}
            {hasMoreDetails && (
              <button
                type="button"
                className="tp-ex-more-btn"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((prev) => !prev)}
                data-toeic-more-toggle
              >
                <span>{moreOpen ? '選択肢の理由・コツを閉じる' : '他の選択肢の理由・コツを見る'}</span>
                <ChevronDown size={15} className={`tp-ex-more-chev${moreOpen ? ' is-open' : ''}`} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {moreOpen && hasMoreDetails && (
          <div className="tp-ex-more-body" data-toeic-more>
            {ex.hint && <Section role="hint" label="着眼点"><p>{ex.hint}</p></Section>}
            {ex.rule && <Section role="rule" label="ポイント"><p>{ex.rule}</p></Section>}
            <Section role="choices" label="選択肢">
              <ul className="tp-ex-choices">
                {ex.choices.map((c) => (
                  <li key={c.mark} data-correct={c.correct || undefined}>
                    <span className="tp-ex-mark" aria-hidden="true">{c.correct ? '○' : '×'}</span>
                    <span>
                      <b lang="en">{c.mark} {formatText(c.text, [], { prose: true, noMath: true })}</b>
                      　{c.correct ? `正解 — ${ex.why}` : c.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
            {ex.tip && <Section role="tip" label="TOEICでのコツ"><p>{ex.tip}</p></Section>}
          </div>
        )}
      </div>
    </details>
  );
}
