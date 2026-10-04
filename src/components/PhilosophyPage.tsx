import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PHILOSOPHY_SECTIONS, PHILOSOPHY_SUBTITLE, PHILOSOPHY_TITLE } from '../data/philosophy';
import './philosophy-page.css';

/**
 * 「学びの扉 ～私達に出来ることを～」（タイトル画面から開く理念ページ）。
 * 背景は絵画（本の山に座る受験生）を固定で敷き、手前に半透明の便箋を重ねて手書き体で語りかける。
 * 段落はスクロールに合わせて1つずつふわっと現れる（動きを減らす設定では最初から全部表示）。
 */
export function PhilosophyPage({ onBack }: { onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const items: HTMLElement[] = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(el => el.classList.add('is-shown')); return;
    }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-shown'); io.unobserve(e.target); } }), { root, threshold: 0.15 });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <main className="philosophy-page" aria-label={`${PHILOSOPHY_TITLE} ${PHILOSOPHY_SUBTITLE}`} data-philosophy>
      <div className="philosophy-bg" aria-hidden="true" />
      <div className="philosophy-scroll" ref={ref}>
        <header className="philosophy-top">
          <button type="button" onClick={onBack} className="philosophy-back"><ArrowLeft size={18} aria-hidden="true" />タイトルへ</button>
        </header>
        <section className="philosophy-hero" data-reveal>
          <h1>{PHILOSOPHY_TITLE}</h1>
          <p>{PHILOSOPHY_SUBTITLE}</p>
        </section>
        <article className="philosophy-letter">
          {PHILOSOPHY_SECTIONS.map((sec, si) => (
            <section key={si} className="philosophy-section">
              {si > 0 && <div className="philosophy-divider" aria-hidden="true">✦</div>}
              {sec.heading && <h2 data-reveal>{sec.heading}</h2>}
              {sec.paragraphs.map((p, pi) => (
                <p key={pi} data-reveal className={sec.highlight?.includes(pi) ? 'is-key' : undefined}>{sec.highlight?.includes(pi) ? <span>{p}</span> : p}</p>
              ))}
            </section>
          ))}
          <p className="philosophy-sign" data-reveal>— マナトビ 開発チーム</p>
        </article>
        <div className="philosophy-actions">
          <button type="button" onClick={onBack} className="philosophy-start">タイトルへ戻る</button>
        </div>
      </div>
    </main>
  );
}
