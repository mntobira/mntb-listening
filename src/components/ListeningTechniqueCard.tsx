/**
 * リスニング：回の一覧のいちばん上に出す「読み方・解き方のテクニック」（2026-10-31 E11）
 *   ・回のカード（黄・緑）と見分けられるよう、青系の色にする
 *   ・開閉式。閉じていれば1行（44px）だけなので、回の一覧は押し下げない
 *   ・中身は src/data/listeningTechniques.ts（解き方だけを自分の言葉でまとめたもの）
 */
import { Lightbulb } from 'lucide-react';
import { LISTENING_COMMON_TIPS, techniqueOf } from '../data/listeningTechniques';

export function ListeningTechniqueCard({ chapterId }: { chapterId: string }) {
  const t = techniqueOf(chapterId);
  if (!t) return null;
  return (
    <details className="lt-card" data-listening-technique>
      <summary>
        <Lightbulb size={16} aria-hidden="true" />
        <span>読み方・解き方のテクニック</span>
      </summary>
      <div className="lt-body">
        <section aria-label="どこを見るか">
          <h4>どこを見るか</h4>
          <ul>{t.look.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section aria-label="先読みのしかた">
          <h4>先読みのしかた</h4>
          <ul>{t.preview.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section aria-label="できる人がやっていること">
          <h4>できる人がやっていること</h4>
          <ul>{t.pros.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section aria-label="よくある悩み">
          <h4>よくある悩み</h4>
          <dl>{t.worries.map((w) => <div key={w.q}><dt>{w.q}</dt><dd>{w.a}</dd></div>)}</dl>
        </section>
        <section aria-label="全大問に共通">
          <h4>全大問に共通</h4>
          <ul>{LISTENING_COMMON_TIPS.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
    </details>
  );
}
