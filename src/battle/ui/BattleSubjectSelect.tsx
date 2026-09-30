/**
 * ===================================================================
 * BattleSubjectSelect — 対戦する教科をえらぶ
 * ===================================================================
 *
 * ★収録数をそのままカードに書く理由★
 * 教科によって使える小問の数が10倍以上ちがう（化学基礎763 / 地理25）。
 * 数を隠すと「地理で連戦したらまた同じ問題が出た＝バグ」と受け取られる。
 * 先に「25問から出ます」と書いておけば、同じ問題が回ってくることが
 * 仕様として理解できる。利用者からも
 * 「ただ 問題両少なかったらしんどい」と懸念が出ていた点なので、
 * 隠さずに見せる方針にした。
 *
 * ★索引（件数だけの軽い表）を使う理由★
 * 実際の問題データ（教科あたり16〜55KB）を読まなくても件数が分かる。
 * 教科選択の段階で全教科ぶん読み込むと 180KB になるので、
 * 件数だけを持つ軽い表（生成物）を見る。
 * 実データは「対戦が始まる教科1つだけ」を後から読む。
 *
 * ★POOL_COUNTS ではなく poolCountOf を使う★
 * POOL_COUNTS は形式を問わない総数なので、
 * そのルールで実際には出せない形式まで数に入ってしまう。
 * 例えば「収録159問」と書いてあるのに、ルールが使う形式は
 * その一部しか無い、という食い違いが起きる。
 * ★画面に出す数は必ず「そのルールで出せる数」でなければならない。★
 */

import { useEffect, useState } from 'react';
import { getChapterIndexOfSubject } from '../../data/chapterIndex.generated';
import { externalChapterTitleOf, externalSubjectOf } from '../../data/externalSubjects';
import { ArrowLeft, Info } from 'lucide-react';
import { subjectTheme } from '../../data/subjectTheme';
import type { SubjectKey } from '../../data/allChapters';
import { POOL_FORMAT_COUNTS, poolCountOf, loadPool } from '../data/battlePool';
import { effectiveRule } from '../data/battle';
import { AMBER, BattleButton, BattleShell, BattleTitle, INK, INK_SUB, LINE } from './BattleParts';
import type { BattleAnswerFormat, BattleRule } from '../core/types';

/** 出題数に対して収録数が少ない教科の目印（1試合ぶんの3倍を下回るか） */
const THIN_POOL_FACTOR = 3;

/**
 * ★問題数を選べる★（2026-09）
 *
 * ご指示（原文）：
 *   > 後問題数決めれるようにして
 *
 * ■ 選べる値
 *   5 / 10 / 15 の 3 つ。
 *   ・5  … 休み時間に 1 試合（2〜3 分）
 *   ・10 … 既定（教科の既定と同じ。化学基礎など）
 *   ・15 … じっくり
 *   Firestore のルール（battle_rooms の battleValidNewRoom）が
 *   questionCount を 3〜20 に制限しているので、この範囲に收まっている。
 *
 * ■ どのモードで選べるか
 *   フレンド対戦（部屋を作る側）と AI 対戦。
 *   ★全国対戦では選べない★—— 待機列は「同じ教科」でマッチさせている。
 *   問題数も条件に入れると待機列が 3 つに割れてさらにマッチしにくくなる。
 *   全国はレートが動く公式戦なので、条件が揃っていることにも意味がある。
 *
 * ■ 収録数が足りない教科
 *   地理（127問）で 15 問はプールの 12% を 1 試合で使う。
 *   選べはするが、カードの注意書き（formatNote）が選んだ問題数で計算されるので
   *   「同じ問題が出ることがあります」が自動でつく。
 *   プールが問題数より少ないときは drawQuestionIds があるぶんだけ出す。
 */
export const QUESTION_COUNT_CHOICES = [5, 10, 15] as const;
export type QuestionCountChoice = (typeof QUESTION_COUNT_CHOICES)[number];

function formatNote(rule: BattleRule, count: number): string {
  if (rule.note) return rule.note;
  if (count < rule.questionCount * THIN_POOL_FACTOR) {
    return '収録数が少ないため、同じ問題が出ることがあります';
  }
  return '';
}

export function BattleSubjectSelect({
  title,
  onPick,
  onBack,
  allowQuestionCount = false,
  currentSubject,
}: {
  /** 「部屋をつくる」「相手をさがす」など、何のための選択かを出す */
  title: string;
  /**
   * 教科を選んだとき。
   * questionCount は allowQuestionCount のときだけ渡る（利用者が選んだ問題数）。
   * 渡らないときは教科の既定（ルールの questionCount）を使う。
   */
  onPick: (subject: string, questionCount?: QuestionCountChoice, chapterId?: string) => void;
  onBack: () => void;
  /**
   * 問題数の選択を出すか。フレンド対戦（部屋を作る）と AI 対戦で true。
   * 全国対戦は false（待機列を割らないため。QUESTION_COUNT_CHOICES のコメント参照）。
   */
  allowQuestionCount?: boolean;
  /** 本体で選択中の科目。該当カードの枠を濃くして「いま学習中の科目」を示す。 */
  currentSubject?: string;
}) {
  // 選んでいる問題数。既定は 10（教科の既定と同じものが大半）。
  const [questionCount, setQuestionCount] = useState<QuestionCountChoice>(10);
  const [unitSubject, setUnitSubject] = useState<string | null>(null);
  const [units, setUnits] = useState<{ id: string; title: string; count: number }[] | null>(null);
  const [unitError, setUnitError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!unitSubject) return;
    let alive = true;
    setUnits(null);
    setUnitError(false);
    void loadPool(unitSubject).then(pool => {
      if (!alive) return;
      const formats = effectiveRule(unitSubject).formats;
      const groups = new Map<string, Set<string>>();
      for (const q of pool) {
        if (!formats.includes(q.format)) continue;
        const group = groups.get(q.chapterId) || new Set<string>();
        group.add(q.subQuestionId);
        groups.set(q.chapterId, group);
      }
      // 外部教科（理科・英単語）は本体の索引に無い。
      // ★getChapterIndexOfSubject は未知の教科で先頭教科（化学基礎）の索引を返す★ので、
      // 外部教科のときは登録簿（externalSubjects）の並びを使う。
      const external = externalSubjectOf(unitSubject);
      const index = external ? [] : getChapterIndexOfSubject(unitSubject);
      const orderSource: readonly { id: string }[] = external ? external.chapters : index;
      const order = new Map<string, number>(orderSource.map((c, i) => [c.id, i] as const));
      setUnits([...groups].map(([id, questions]) => {
        const entry = index.find(c => c.id === id);
        return { id, count: questions.size,
          title: entry?.abstractTitle || entry?.realTitle || entry?.title || externalChapterTitleOf(unitSubject, id) || id };
      }).sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999)
        || a.id.localeCompare(b.id, undefined, { numeric: true })));
    }).catch(() => { if (alive) setUnitError(true); });
    return () => { alive = false; };
  }, [unitSubject, retry]);
  // 収録があり、かつ有効な教科だけを並べる。
  // ★POOL_COUNTS の並び順をそのまま使う★
  //   生成器が「収録数の多い順」ではなく既存 SUBJECTS の順で書き出しているので、
  //   既存アプリの教科の並びと一致する（利用者が探す位置が変わらない）。
  const entries = Object.keys(POOL_FORMAT_COUNTS)
    .map((subject) => {
      const base = effectiveRule(subject);
      // 問題数を選べるときは、カードの表示（○問しょうぶ・注意書き・かなの問数）も
      // 選んだ数で計算する。表示と実際の出題数が食い違うと「嚇された」になる。
      const rule: BattleRule = allowQuestionCount ? { ...base, questionCount } : base;
      return {
        subject,
        rule,
        // ★そのルールで実際に出せる数★（形式で絞った数）
        count: poolCountOf(subject, rule.formats),
        // かな入力（みんはや方式）が何問あるか。0なら案内も出さない。
        kanaCount: poolCountOf(subject, ['kana'] as BattleAnswerFormat[]),
      };
    })
    .filter((e) => e.rule.enabled && e.count > 0);

  if (unitSubject) {
    const theme = subjectTheme(unitSubject as SubjectKey);
    return <BattleShell footer={<BattleButton variant="ghost" onClick={() => setUnitSubject(null)} icon={<ArrowLeft size={18} />}>科目選択にもどる</BattleButton>}>
      <BattleTitle subtitle={`${theme.label} ／ 単元をえらぶ`} />
      {/* 説明は1行に。「少ない単元は収録数だけ」は各カードの「今回 N問」で分かる */}
      <p className="mb-2 text-sm font-bold" style={{ color: INK }}>出題範囲を選ぶ（最大{questionCount}問）</p>
      {unitError ? <div role="alert"><p>単元を読み込めませんでした。</p><BattleButton onClick={() => setRetry(n => n + 1)}>再読み込み</BattleButton></div>
        : !units ? <p role="status">単元を読み込んでいます…</p>
        : <div className="grid grid-cols-2 gap-2" aria-label="単元一覧">
          <button type="button" data-battle-unit="all" onClick={() => onPick(unitSubject, questionCount)}
            className="col-span-2 min-h-[52px] rounded-2xl border-2 px-4 py-2 text-left font-black" style={{ borderColor: theme.accent, color: INK, background: theme.surface }}>
            全単元から出題<span className="ml-2 text-xs">{Math.min(questionCount, units.reduce((n, u) => n + u.count, 0))}問</span>
          </button>
          {units.map(unit => <button key={unit.id} type="button" data-battle-unit={unit.id}
            onClick={() => onPick(unitSubject, questionCount, unit.id)}
            className="min-h-[52px] min-w-0 rounded-2xl border-2 bg-white px-3 py-2 text-left" style={{ borderColor: LINE, color: INK }}
            aria-label={`${unit.title}（収録 ${unit.count}問・今回 ${Math.min(questionCount, unit.count)}問）`}>
            <span className="block truncate text-sm font-black">{unit.title}</span>
            <span className="mt-0.5 block text-xs" style={{ color: INK_SUB }}>今回 {Math.min(questionCount, unit.count)}問<span className="opacity-70">／{unit.count}</span></span>
          </button>)}
        </div>}
    </BattleShell>;
  }

  return (
    <BattleShell
      footer={
        <BattleButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={18} />}>
          もどる
        </BattleButton>
      }
    >
      <BattleTitle subtitle={title} />
      {/* 説明の1行は省く：科目カードを押せば次へ進むことはカードの形で分かる（1画面に収める） */}

      {allowQuestionCount && (
        <section
          className="mb-2 rounded-2xl border-2 px-3 py-2"
          style={{ borderColor: LINE, background: '#FFFFFF' }}
          aria-label="問題数"
        >
          <p className="mb-1.5 text-xs font-black" style={{ color: INK_SUB }}>
            問題数
          </p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="1試合の問題数">
            {QUESTION_COUNT_CHOICES.map((n) => {
              const selected = n === questionCount;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-question-count={n}
                  onClick={() => setQuestionCount(n)}
                  className="min-h-11 rounded-xl border-2 py-1.5 text-center transition active:scale-[0.98]"
                  style={{
                    borderColor: selected ? AMBER : LINE,
                    background: selected ? `${AMBER}1A` : '#FAF8F3',
                    color: selected ? AMBER : INK,
                  }}
                >
                  <span className="block text-xl font-black tabular-nums leading-none">{n}</span>
                  <span className="mt-1 block text-xs font-bold" style={{ color: INK_SUB }}>
                    {n === 5 ? 'さっと' : n === 10 ? 'ふつう' : 'じっくり'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ★「キーボード入力はありません」と書けなくなった★
          五十音キーボードで1文字ずつ押す形式を入れたので、
          「えらぶだけ」ではなくなっている。
          ただし手打ち入力（IMEの変換）は今も1つも無いので、
          そこを取り違えないように書き分けている。 */}
      {/* 制限時間と答え方の説明は「押したら開く」（ふだんは1行だけ） */}
      <details
        className="mb-2 text-xs font-bold leading-relaxed"
        style={{ color: INK_SUB }}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5"><Info size={14} className="shrink-0" aria-hidden="true" />制限時間と答え方</summary>
        <span className="block pb-1 pl-5">
          選択式は通常25〜55秒、五十音入力は文字数に応じて47〜55秒です。
          <br />
          答え方は「えらぶ」と「五十音を おす」の2つ。
          <br />
          文字を打ちこむ（へんかんする）ことはありません。
        </span>
      </details>

      {!allowQuestionCount && <p className="mb-3 text-xs font-bold" style={{ color: INK_SUB }}>全国対戦は全単元から出題します。単元を指定したいときはAI・フレンド対戦を選んでください。</p>}
      <div className="grid gap-2.5">
        {entries.map(({ subject, count, kanaCount, rule }) => {
          const theme = subjectTheme(subject as SubjectKey);
          const note = formatNote(rule, count);
          // ★かな入力が混ざる教科だけに出す★
          // 地理やリスニングは0問なので、書くと嘘になる。
          const kanaPerMatch =
            kanaCount > 0 && rule.kanaShare > 0
              ? Math.min(Math.round(rule.questionCount * rule.kanaShare), kanaCount)
              : 0;

          return (
            <button
              key={subject}
              type="button"
              id={`battle-subject-${subject}`}
              onClick={() => allowQuestionCount ? setUnitSubject(subject) : onPick(subject)}
              className="w-full rounded-2xl px-4 py-2.5 text-left transition active:scale-[0.99]"
              style={{
                border: `${subject === currentSubject ? 3 : 2}px solid ${subject === currentSubject ? theme.accent : `${theme.accent}66`}`,
                background: `${theme.accent}14`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-black" style={{ color: theme.accent }} aria-current={subject === currentSubject ? 'true' : undefined}>
                  {theme.label}
                </span>
                {/* 問題数を上で選べるときは「N問しょうぶ」は重複なので出さない（全国対戦だけ出す） */}
                {!allowQuestionCount && <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-black tabular-nums"
                  // ★アイボリー地に白文字は読めない★
                  //   もとは color: '#FFFFFF' だったが、この画面は
                  //   紙の色（#FDFBF7）の上なので、白だとほぼ見えない。
                  style={{ background: `${theme.accent}2E`, color: INK }}
                >
                  {rule.questionCount}問しょうぶ
                </span>}
              </div>

              <p className="mt-1 text-xs font-bold" style={{ color: INK_SUB }}>
                収録{' '}
                <span className="tabular-nums font-black" style={{ color: INK }}>
                  {count}
                </span>{' '}
                問
                {kanaPerMatch > 0 && (
                  <>
                    <span style={{ color: LINE }}> ｜ </span>
                    <span className="tabular-nums font-black" style={{ color: AMBER }}>
                      {kanaPerMatch}
                    </span>
                    <span style={{ color: AMBER }}> 問は 五十音で かく</span>
                  </>
                )}
              </p>

              {note && (
                // ★金（#F4D03F）は文字色に使えない★
                //   アイボリー地の上ではコントラストが1.5程度しかなく読めない。
                //   注意書きは読めることが目的なので AMBER を使う。
                <p className="mt-1 text-xs font-bold leading-snug" style={{ color: AMBER }}>
                  {note}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {entries.length === 0 && (
        <p className="py-10 text-center text-sm font-bold" style={{ color: INK_SUB }}>
          いま対戦できる教科がありません。
        </p>
      )}
    </BattleShell>
  );
}
