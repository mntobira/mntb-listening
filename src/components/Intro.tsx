import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, Coins, Headphones, Music, PenLine, Repeat2, Swords, Target, Trophy } from 'lucide-react';
import { TobiraBuddy } from './TobiraBuddy';
import './intro.css';

/**
 * 使い方（2026-10-01 D 作り直し）
 *   以前は見出し＋段落3つだけで、何から始めればいいか伝わらなかった。
 *   ① 4ステップ（演習 → 単語 → 復習 → 対戦）を絵と短い一言で
 *   ② ごほうび（マナコイン・ミッション・ガチャ）の流れ
 *   ③ 困ったとき（よくある質問）は畳む
 *   ④ クレジット（BGM の配布元・URL は利用規約で記載が必須）
 */
const STEPS = [
  { icon: Headphones, tone: 'blue', title: 'リスニングを解く', body: '第1問A〜第6問B。音声を聞いて答え、解説でスクリプト・和訳・決め手を確認。' },
  { icon: BookOpen, tone: 'gold', title: '単語を覚える', body: '単語帳で100語ずつめくる。意味や英語を隠して確かめ、4択でも解ける。' },
  { icon: Repeat2, tone: 'lilac', title: '間違いを復習', body: '間違えた問題は復習ノートへ。日をあけて出し直すので、苦手が残らない。' },
  { icon: Swords, tone: 'night', title: '対戦で力試し', body: 'AIはゲストでもすぐ。フレンド・全国対戦はログインで。正解＋速さで勝負。' },
] as const;

const FAQ = [
  { q: '音が出ない', a: '端末の消音（マナー）を切り、音量を上げてください。イヤホンをつなぎ直すと直ることもあります。ホーム右上のスピーカーで BGM のオン・オフを切り替えられます。' },
  { q: '対戦がつながらない', a: '対戦メニューの「つながらないとき」から通信チェックができます。学校の Wi‑Fi では自動で通信方式を切り替えます。' },
  { q: '記録はどこに保存される？', a: 'ゲストはこの端末に保存します。Google でログインすると、ほかの端末でも同じ記録を使えます。' },
  { q: 'マナコインは何に使う？', a: 'ガチャ・ショップで、とびら君のきせかえや学習プリントと交換できます。課金はありません。' },
];

export function Intro({ onBack, onBattle }: { onBack: () => void; onBattle?: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return <main className="intro-page pb-app-nav" data-intro>
    <header className="intro-head">
      <button type="button" className="intro-back" onClick={onBack} aria-label="ホームに戻る"><ChevronLeft size={18} aria-hidden="true" /><span>ホーム</span></button>
      <h1>使い方</h1>
    </header>

    <section className="intro-hero" aria-label="マナトビとは">
      <TobiraBuddy size="md" input={{ screen: 'home' }} pose="/mascots/bowing.webp" line="ようこそ！ 4ステップで、聞ける耳をつくろう" />
    </section>

    <ol className="intro-steps" aria-label="4つのステップ">
      {STEPS.map((s, i) => <li key={s.title} className="intro-step" data-tone={s.tone}>
        <span className="intro-step-no" aria-hidden="true">{i + 1}</span>
        <span className="intro-step-icon" aria-hidden="true"><s.icon /></span>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
      </li>)}
    </ol>

    <section className="intro-loop" aria-label="ごほうびの流れ">
      <h2>がんばると、こうなる</h2>
      <ul>
        <li><PenLine aria-hidden="true" /><span>解く・覚える</span></li>
        <li aria-hidden="true" className="intro-arrow">→</li>
        <li><Target aria-hidden="true" /><span>ミッション達成</span></li>
        <li aria-hidden="true" className="intro-arrow">→</li>
        <li><Coins aria-hidden="true" /><span>マナコイン</span></li>
        <li aria-hidden="true" className="intro-arrow">→</li>
        <li><Trophy aria-hidden="true" /><span>ガチャ・きせかえ</span></li>
      </ul>
    </section>

    <section className="intro-faq" aria-label="困ったとき">
      <h2>困ったとき</h2>
      {FAQ.map((f, i) => <div key={f.q} className="intro-faq-item" data-open={open === i || undefined}>
        <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}><span>{f.q}</span><ChevronDown size={18} aria-hidden="true" /></button>
        {open === i && <p>{f.a}</p>}
      </div>)}
    </section>

    <section className="intro-credit" aria-label="クレジット" data-intro-credit>
      <h2><Music size={16} aria-hidden="true" />クレジット</h2>
      <dl>
        <div><dt>対戦の待ち時間 BGM</dt><dd>「夕凪」作曲：やっすん</dd></div>
        <div><dt>対戦中 BGM</dt><dd>「風の列車」作曲：坂田白</dd></div>
        <div><dt>配布元</dt><dd>創作堂さくら紅葉 <a href="https://yukizakura.net/" target="_blank" rel="noopener noreferrer">https://yukizakura.net/</a></dd></div>
      </dl>
    </section>

    <div className="intro-cta">
      {onBattle && <button type="button" className="intro-cta-battle" onClick={onBattle}><Swords size={18} aria-hidden="true" />対戦ロビーへ</button>}
      <button type="button" className="intro-cta-home" onClick={onBack}>さっそく始める</button>
    </div>
  </main>;
}
