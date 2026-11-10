import { useEffect, useRef, useState } from 'react';
import { CinematicClip, CINEMATIC_CLIPS } from './CinematicClip';
import { ArrowRight, BookHeart, Headphones, PenLine, Repeat2, Swords } from 'lucide-react';
import { PhilosophyPage } from './PhilosophyPage';
import { useGrowthProgress } from '../hooks/useGrowthProgress';
import { equippedPoseSrc } from '../battle/core/growth';
import { TobiraAccessories } from '../battle/ui/TobiraAccessories';
import { auth } from '../firebase';
import './launch-screen.css';
import { getDaysUntilExam, EXAM_DATE_LABEL } from '../utils/examCountdown';
import { fadeOutLaunchSfx, launchCueSchedule, playLaunchSfx, preloadLaunchSfx, type LaunchSfx } from '../battle/audio/launchSfx';
import { resumeSharedAudio } from '../battle/audio/sharedAudioContext';
import { readAudioPreferences } from '../battle/audio/audioPreferences';
import { TOEIC_DISCLAIMER } from '../utils/toeicDisclaimer';

/**
 * タイトル画面（2026-09-30 作り直し）。保存された画面やアカウントには一切触れない（見た目だけ）。
 *
 * 1画面（スクロールなし）に ロゴ → とびら君 → 主コピー → 3つのチップ → はじめる を収める。
 *  - 主コピー「聞いて、解いて、競って、これ1本で。」（2026-10-06・ストア画像と同じ）。
 *  - 起動エンブレムはアプリのロゴ（白背景のまま。透過版はストア画像だけで使う）。
 *  - ロゴは背景を透過した /brand/manatobi-logo.webp（白い四角を残さない）。
 *  - とびら君は全身を見せ、足元に楕円の接地影を置く。背後は「閉じた円」の光背にする（途中で切れた弧にしない）。
 *  - 意味のない飾り（◆・罫線）は置かない。
 *  - 主CTA「はじめる」はオレンジの塗り＋濃紺の文字。副CTAは廃止（2026-10-19 ログイン必須）。下に「ログインして始めます」の案内だけ出す。
 *
 * 登場の流れ（動画は約2.7秒。つなぎ目を作らない）:
 *   intro     … 動画の1コマ目（poster）→ 約2.7秒の登場動画
 *   crossfade … 動画の最後のコマを残したまま、同じ位置・同じ大きさの静止画シーンを重ねてフェード
 *               F6（2026-11-04）静止画シーンの背景は、最後のコマからとびら君だけを消した画像（title-plate.webp）。
 *               以前は光の輪と床を CSS で描いていたため、雲・星が消えて「別の絵」に切り替わって見えた
 *   done      … 動画を外し、静止画シーン（装備したポーズ・アクセサリ）だけが残る
 * 動画が使えない時（動きを減らす設定・データセーバー・読み込み失敗）は、歩いて登場する演出にする。
 *
 * 静止画シーンの配置（.launch-box 内の %）は、動画 title.mp4 の最後のコマ（720×720）を実測した値。
 *   とびら君: x 149〜569 / y 124〜576、床の楕円: x 97〜621 / y 550〜637
 */
type Phase = 'intro' | 'crossfade' | 'done';

export function LaunchScreen({ onStart }: {
  /** 2026-10-19 ゲスト入口は廃止（ログイン必須）。未ログインなら次にログイン画面が出る */
  onStart: () => void;
}) {
  const { progress } = useGrowthProgress();
  const [phase, setPhase] = useState<Phase>('intro');
  const [gate, setGate] = useState<'emblem' | 'title' | 'philosophy'>('emblem');
  /** エンブレムの段階：in（白からふわっと）→ hold（表示）→ out（白へ消える）→ タイトルへ */
  const [emblemPhase, setEmblemPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [emblemSkipped, setEmblemSkipped] = useState(false);
  /*
    起動エンブレム（市販アプリのスプラッシュと同じ間合い・2026-10-02 D2）
      0.0〜0.7秒  白からフェードイン
      0.7〜2.5秒  そのまま見せる
      2.5〜3.2秒  フェードアウト（白へ）
      3.4秒      タイトル画面がフェードインで現れる
    画面のどこを押しても飛ばせる（飛ばすときも0.4秒だけフェードアウトしてから切り替える）。
  */
  /*
    起動の効果音（宣伝動画の冒頭と同じ・2026-10-17）
      エンブレムが出たら「きらきら」→ タイトルの1.3秒前から「すーっ」→ タイトルが出た瞬間に「ふわっ」
    起動画面では常に鳴らす（切替ボタンは置かない）。音量は設定の音量。
    音源を読み込んでから演出タイマーを始め、初回読み込み中にキューが消えるのを防ぐ。
  */
  const sfxTimers = useRef<number[]>([]);
  const bloomDone = useRef(false);
  const skipRequested = useRef(false);
  const cue = (name: LaunchSfx) => { playLaunchSfx(name, readAudioPreferences().volume); };
  const clearSfxTimers = () => { sfxTimers.current.forEach(t => window.clearTimeout(t)); sfxTimers.current = []; };
  useEffect(() => {
    if (gate !== 'emblem') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const at = reduced ? { hold: 0, out: 900, title: 1100 } : { hold: 700, out: 2500, title: 3400 };
    let alive = true;
    const visualTimers: number[] = [];
    void preloadLaunchSfx().then(() => {
      if (!alive || skipRequested.current) return; // 片付け後（StrictMode の2回目・飛ばした後）に予約しない
      // preload 内で AudioContext を作成しているため、作成後に再開を試す。
      resumeSharedAudio();
      const t0 = performance.now();
      visualTimers.push(
        window.setTimeout(() => setEmblemPhase(p => (p === 'in' ? 'hold' : p)), at.hold),
        window.setTimeout(() => setEmblemPhase('out'), at.out),
        window.setTimeout(() => setGate(g => (g === 'emblem' ? 'title' : g)), at.title),
      );
      for (const c of launchCueSchedule(at.title)) {
        if (c.name === 'title_bloom') continue;
        const wait = c.at - (performance.now() - t0);
        if (wait < -500) continue;
        sfxTimers.current.push(window.setTimeout(() => cue(c.name), Math.max(0, wait)));
      }
    });
    return () => { alive = false; visualTimers.forEach(t => window.clearTimeout(t)); clearSfxTimers(); };
  }, [gate]);
  useEffect(() => {
    if (gate !== 'title' || bloomDone.current) return;
    bloomDone.current = true;
    let alive = true;
    void preloadLaunchSfx().then(() => {
      if (!alive) return;
      resumeSharedAudio();
      cue('title_bloom');
    });
    return () => { alive = false; };
  }, [gate]);
  // タイトルから先へ進んだら起動音はすっと消す（このあと鳴る「誕生」と重ねない）
  useEffect(() => { if (gate === 'philosophy') fadeOutLaunchSfx(); }, [gate]);
  useEffect(() => () => fadeOutLaunchSfx(), []);
  const skipEmblem = () => {
    if (emblemPhase === 'out') return;
    skipRequested.current = true;
    setEmblemSkipped(true); setEmblemPhase('out');
    // 飛ばしたら「すーっ」は鳴らさず、音源の準備後にタイトルへ進む。
    clearSfxTimers(); resumeSharedAudio();
    void preloadLaunchSfx().then(() => {
      resumeSharedAudio();
      window.setTimeout(() => setGate(g => (g === 'emblem' ? 'title' : g)), 450);
    });
  };
  const [played, setPlayed] = useState(false);
  const [walkReady, setWalkReady] = useState(false);
  useEffect(() => {
    if (phase !== 'crossfade') return;
    const t = setTimeout(() => setPhase('done'), 380);
    return () => clearTimeout(t);
  }, [phase]);
  const finishIntro = () => setPhase(p => (p === 'intro' ? (played ? 'crossfade' : 'done') : p));
  // 動画を再生できなかった時だけ歩いて登場
  const walk = phase === 'done' && !played;
  // PC：キーボードの Enter で進める（タイトル → 入る）。入力中・ボタンにフォーカス中は邪魔しない
  useEffect(() => {
    if (gate !== 'title') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('button, a, input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const enter = () => onStart();
  if (gate === 'emblem') return <main className="launch-emblem" data-phase={emblemPhase} data-skip={emblemSkipped || undefined} aria-label={`マナトビ 起動エンブレム（タップで進む）。${TOEIC_DISCLAIMER}`} role="button" tabIndex={0} onClick={skipEmblem} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipEmblem(); } }}><div className="launch-emblem-inner"><img className="launch-emblem-applogo" src="/brand/app-icon-logo.webp" alt="マナトビ" width={640} height={640}/><h1>聞いて、解いて、<br/>競って、<em>これ1本</em>で。</h1></div><p className="launch-emblem-disclaimer">{TOEIC_DISCLAIMER}</p></main>;
  if (gate === 'philosophy') return <PhilosophyPage onBack={() => setGate('title')} />;
  // C13（2026-10-29）：「学ぶ入口を、もっと快適に。」のお知らせ画面は削除。共通テストまでの日数はホームにあるので、はじめる → そのままホームへ入る。
  return <main className="launch-screen" aria-label="マナトビ タイトル画面" data-launch-screen>
    <div className="launch-content">
      <h1 className="launch-brand"><img src="/brand/manatobi-logo.webp" width={1008} height={321} alt="マナトビ" fetchPriority="high" /></h1>
      <div className="launch-stage" data-phase={phase} aria-label="とびら君の登場演出">
        <div className="launch-box">
          <div className="launch-scene" aria-hidden="true">
            {/* F6（2026-11-04）動画の最後のコマから、とびら君だけを消した背景（雲・星・紙飛行機・光の輪・床）。
                動画が終わっても背景が入れ替わらず、とびら君だけが静止画（装備したポーズ）に切り替わる */}
            <img className="launch-plate" src="/cinematics/title-plate.webp" alt="" width={720} height={720} draggable={false} />
            <div className="launch-sparkles"><i /><i /><i /><i /><i /><i /></div>
            <div className={`launch-arrival ${walk && walkReady ? 'walk-ready' : ''} ${!walk ? 'is-idle' : ''}`}>
              <div className="launch-gait">
                <img className="launch-walking-pose" src="/mascots/walking.webp" alt="" draggable={false} onLoad={() => setWalkReady(true)} />
                <img className="launch-equipped-pose" src={progress ? equippedPoseSrc(progress) : '/mascots/basic.webp'} alt="" draggable={false} />
                {progress && <TobiraAccessories progress={progress} />}
              </div>
            </div>
          </div>
          {phase !== 'done' && <CinematicClip src={CINEMATIC_CLIPS.title.src} poster={CINEMATIC_CLIPS.title.poster} hold eager label="とびら君の登場動画"
            onActiveChange={active => { if (active) setPlayed(true); }} onComplete={finishIntro} />}
        </div>
      </div>
      <p className="launch-copy">聞いて、解いて、<br className="launch-copy-break" />競って、<em>これ1本</em>で。</p>
      {/* PC だけ：コピーの下に一言の説明（スマホは1画面に収めるため出さない） */}
      <p className="launch-lead">共通テスト英語リスニングの第1問〜第6問を、本番と同じ音源で。<br />解いたその場でスクリプト・読み方・解説まで確かめられます。</p>
      {/* できること。スマホは小さなチップ、PC は説明つきのカードにする（同じ要素を CSS で出し分け） */}
      <ul className="launch-chips" aria-label="できること">
        <li><PenLine size={16} aria-hidden="true" /><span><b>演習</b><small>第1問〜第6問を本番どおりに</small></span></li>
        <li><Repeat2 size={16} aria-hidden="true" /><span><b>復習</b><small>読んでいる単語が光る</small></span></li>
        <li><Swords size={16} aria-hidden="true" /><span><b>オンライン対戦</b><small>友だち・全国・AI と</small></span></li>
      </ul>
      <div className="launch-actions">
        <p className="launch-countdown-mini" aria-label={`共通テストまで${getDaysUntilExam()}日`}><Headphones size={16} aria-hidden="true" />共通テストまで <strong>{getDaysUntilExam()}</strong>日<small>{EXAM_DATE_LABEL}</small></p>
        <button type="button" className="launch-start mt-btn mt-btn-accent" onClick={() => { fadeOutLaunchSfx(); enter(); }}><Headphones size={20} aria-hidden="true" />はじめる<ArrowRight size={20} aria-hidden="true" /></button>
        <p className="launch-note">{auth.currentUser ? '学習のつづきから始まります' : 'Google か Apple でログインして始めます'}</p>
        <button type="button" className="launch-philosophy" data-open-philosophy onClick={() => setGate('philosophy')}><BookHeart size={16} aria-hidden="true" />学びの扉 ～私達に出来ることを～</button>
        <p className="launch-kbd" aria-hidden="true"><kbd>Enter</kbd> ではじめる</p>
      </div>
    </div>
  </main>;
}
