import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Headphones, Share2 } from 'lucide-react';
import { PHILOSOPHY_SECTIONS, PHILOSOPHY_SUBTITLE, PHILOSOPHY_TITLE } from '../data/philosophy';
import './philosophy-page.css';

/**
 * 「学びの扉 ～私達に出来ることを～」（タイトル画面から開く理念ページ）。
 *
 * ★2026-10-05 作り直し：「読み物」ではなく「手紙を受け取る体験」に★
 *   - 背景の絵（青×オレンジの水彩・本の山に座る少年）は画面に固定し、スクロールでゆっくりずらす（parallax）
 *   - 本文は半透明のすりガラスの便箋。絵が淡く透け、上端は絵になじませて境目を作らない
 *   - 本文は Zen Maru Gothic（やわらかいゴシック）、タイトルは Shippori Mincho（端正な明朝）
 *   - 強調は3段階：通常／軽い強調（細い下線）／核心メッセージ（大きく・中央・少し遅れて現れる）
 *   - 文章は1文字も変えていない（data/philosophy.ts の見せ方の指定だけを足した）
 */
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700&family=Zen+Maru+Gothic:wght@500;700&display=swap';

function useLetterFonts() {
  useEffect(() => {
    if (document.querySelector(`link[data-philosophy-font]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = FONT_HREF; link.setAttribute('data-philosophy-font', '');
    document.head.appendChild(link);
  }, []);
}

/** 段落を「前の文 → 核心の一文 → 後ろの文」に分ける。文章そのものは変えない */
function splitCore(text: string, core: string | undefined): [string, string, string] | null {
  if (core === undefined) return null;
  if (core === '') return ['', text, ''];
  const i = text.indexOf(core);
  if (i < 0) return null;
  return [text.slice(0, i).trim(), core, text.slice(i + core.length).trim()];
}

/**
 * standalone … 宣伝用の単独ページ（/message）として開いたとき。
 *   最後に「マナトビを開く」と「この手紙をシェアする」を出す（アプリ内では出さない）。
 */
export function PhilosophyPage({ onBack, backLabel = 'タイトルへ', standalone = false }: { onBack: () => void; backLabel?: string; standalone?: boolean }) {
  const [shared, setShared] = useState('');
  const share = async () => {
    const url = `${location.origin}/message`;
    const data = { title: `${PHILOSOPHY_TITLE} ${PHILOSOPHY_SUBTITLE}`, text: 'マナトビ 開発者からの手紙', url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url); setShared('リンクをコピーしました');
    } catch { /* 閉じただけ */ }
  };
  useLetterFonts();
  const ref = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const items: HTMLElement[] = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof IntersectionObserver === 'undefined' || reduce) {
      items.forEach(el => el.classList.add('is-shown'));
      return;
    }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-shown'); io.unobserve(e.target); } }), { root, threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
    // 背景はスクロールの 1/12 だけ動かす（絵が奥にあるように見える）
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (bg.current) bg.current.style.transform = `translate3d(0, ${-root.scrollTop / 12}px, 0) scale(1.12)`; }); };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); root.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <main className="philosophy-page" aria-label={`${PHILOSOPHY_TITLE} ${PHILOSOPHY_SUBTITLE}`} data-philosophy>
      <div className="philosophy-bg" ref={bg} aria-hidden="true" />
      <div className="philosophy-feathers" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="philosophy-scroll" ref={ref}>
        <header className="philosophy-top">
          {standalone
            ? <a href="/" className="philosophy-glass-btn philosophy-back philosophy-brand"><img src="/brand/manatobi-logo.webp" alt="マナトビ" width={84} height={27} /></a>
            : <button type="button" onClick={onBack} className="philosophy-glass-btn philosophy-back"><ArrowLeft size={18} aria-hidden="true" />{backLabel}</button>}
        </header>
        <section className="philosophy-hero" data-reveal>
          <div className="philosophy-hero-inner">
            <h1>{PHILOSOPHY_TITLE}</h1>
            <p>{PHILOSOPHY_SUBTITLE}</p>
          </div>
          <span className="philosophy-scroll-hint" aria-hidden="true" />
        </section>
        <article className="philosophy-letter">
          {PHILOSOPHY_SECTIONS.map((sec, si) => (
            <section key={si} className="philosophy-section">
              {si > 0 && <div className="philosophy-divider" aria-hidden="true" data-reveal><span>✦</span></div>}
              {sec.heading && <h2 data-reveal>{sec.heading}</h2>}
              {sec.paragraphs.map((p, pi) => {
                const parts = splitCore(p, sec.core?.[pi]);
                if (parts) {
                  const [before, core, after] = parts;
                  return <Fragment key={pi}>
                    {before && <p data-reveal>{before}</p>}
                    <p data-reveal className="is-core">{core}</p>
                    {after && <p data-reveal>{after}</p>}
                  </Fragment>;
                }
                const key = sec.highlight?.includes(pi);
                return <p key={pi} data-reveal className={key ? 'is-key' : undefined}>{key ? <span>{p}</span> : p}</p>;
              })}
            </section>
          ))}
          <p className="philosophy-sign" data-reveal>— マナトビ 開発チーム</p>
        </article>
        {standalone ? <div className="philosophy-actions is-standalone">
          <a href="/" className="philosophy-cta"><Headphones size={20} aria-hidden="true" />マナトビでリスニングを始める</a>
          <button type="button" onClick={() => void share()} className="philosophy-glass-btn"><Share2 size={17} aria-hidden="true" />この手紙をシェアする</button>
          {shared && <p role="status" className="philosophy-shared">{shared}</p>}
        </div> : <div className="philosophy-actions">
          <button type="button" onClick={onBack} className="philosophy-glass-btn philosophy-start">{backLabel.replace(/へ$/, '')}へ戻る</button>
        </div>}
      </div>
    </main>
  );
}
