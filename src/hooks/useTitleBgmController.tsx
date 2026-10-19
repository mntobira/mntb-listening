/**
 * タイトル BGM の制御（App.tsx から移した。中身は一字一句そのまま）。
 *   ・BGM の ON/OFF と音量（端末に保存し、対戦 BGM の設定と同期）
 *   ・画面ごとの鳴らす／止める、90秒フェードアウト、操作での再開
 *   ・<audio> の読み込み失敗時は無音モードに切り替える
 * App は戻り値（audioRef / handleAudioError / handleToggleBgm など）だけを使う。
 */
import React, { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../utils/storageGuard';
import { FEATURES } from '../config/features';
import { appBgmVolume, isBgmFadeComplete } from '../utils/bgmFade';
import { writeAudioPreferences, readAudioPreferences } from '../battle/audio/audioPreferences';
import { setTitleBgmVolume, unlockTitleBgm } from '../battle/audio/titleMediaAudio';
import { battleAudio } from '../battle/audio/battleAudio';
import { BGM_ENABLED_KEY, BGM_SILENT_STATES } from './titleBgmConstants';

/** audio.play() 失敗時のログ文言（どの場面で失敗したかで少しずつ違う。文言は以前のまま） */
interface BgmPlayErrorMessages { decode: string; decodeHint?: string; blocked: string; unexpected: string }
const DECODE_HINT = '音源ファイルが読み込めないか、サポートされていない形式です。無音でアプリを続行します。';
const BGM_PLAY_ERROR_MESSAGES = {
  INTERACTION: {
    decode: '[BGM Error] Decode failed on interaction. Switching to silent mode.',
    decodeHint: DECODE_HINT,
    blocked: '[BGM Info] Autoplay blocked by browser. Waiting for user interaction.',
    unexpected: '[BGM Error] Unexpected playback error on interaction:',
  },
  AUTOPLAY: {
    decode: '[BGM Error] Decode failed (NotSupportedError). Switching to silent mode.',
    decodeHint: DECODE_HINT,
    blocked: '[BGM Info] Autoplay blocked by browser. Waiting for user interaction.',
    unexpected: '[BGM Error] Unexpected playback error:',
  },
  TOGGLE: {
    decode: '[BGM Error] Decode failed on toggle. Switching to silent mode.',
    blocked: '[BGM Info] Playback blocked by browser on toggle.',
    unexpected: '[BGM Error] Unexpected playback error on toggle:',
  },
} as const satisfies Record<string, BgmPlayErrorMessages>;

/** appState は App の AppState（画面名の文字列）。App を import すると循環するので string で受ける。 */
export function useTitleBgmController({ appState, hasEntered }: { appState: string; hasEntered: boolean }) {
  // BGM state
  const audioRef = useRef<HTMLAudioElement>(null);
  const titlePauseTimer = useRef<number | null>(null);
  /*
    ===== BGM の初期状態について =====
    ★以前は常に ON（useState(true)）だった。これを OFF 既定に変える。★

    ■ なぜ OFF にするのか
      学習アプリで音が勝手に鳴り始めるのは、
        ・図書館・電車・自習室では実害になる
        ・イヤホンを繋いだ瞬間に大音量で鳴ることがある
        ・「まず音を止める」から始まる体験になる
      という問題がある。音楽を聴きながらやりたい人は
      自分の好きな曲を別に流しているので、
      ★アプリ側が鳴らす理由は元々弱い。★
      機能自体は消さず、設定画面のトグルからONにできる。

      既定値は src/config/features.ts の FEATURES.bgm で持つ。
      「どの機能を出すか」の判断を1か所に集めておくため
      （このファイルに true/false を直接書かない）。

    ■ 選択を覚える
      毎回OFFに戻ると、ONにしたい人には毎回操作が必要になる。
      localStorage に覚えるので、ONにした人は次回もON。
      ★保存値が無い人（＝新規・これまでのユーザー全員）は
        フラグの既定値に従うので、OFF から始まる。★

    ■ 保存値の読み方
      'on' / 'off' という文字で保存する（true/false の文字列より
      あとから3値目を足しやすく、読んで意味が分かる）。
      壊れた値・読めない場合は既定値に倒す。
      localStorage が使えない環境（プライベートモード等）で
      例外が飛んでも起動を止めないよう try で囲む。
  */
  const [isBgmEnabled, setIsBgmEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(BGM_ENABLED_KEY);
      if (saved === 'on') return true;
      if (saved === 'off') return false;
    } catch {
      /* 読めない環境では既定値に従う */
    }
    // まだ選んでいない人は、対戦BGMの設定（既定ON）に合わせる＝BGMのスイッチは1つ（2026-10-01）
    try { return readAudioPreferences().bgm; } catch { return FEATURES.bgm; }
  });
  const [bgmVolume, setBgmVolume] = useState(() => readAudioPreferences().volume);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAudioValid, setIsAudioValid] = useState(true);
  /*
    フェードが終わって音が消えた状態。
    ★これを画面に出さないと「ONなのに鳴っていない」＝故障に見える。★
    ヘッダーのボタンのラベルを「もう一度鳴らす」に変えるために使う。
  */
  const [isBgmFadedOut, setIsBgmFadedOut] = useState(false);
  const hasLoggedAudioError = useRef(false);

  /**
   * audio.play() が失敗したときの共通処理（もとは同じ分岐が3か所にコピーされていた）。
   * 出す文言・出し分け・無音モードへの切り替えは以前と完全に同じ。
   */
  const handlePlayError = (e: { name?: string; message?: string }, messages: BgmPlayErrorMessages) => {
    if (e.name === 'NotSupportedError' || e.message?.includes('no supported sources')) {
      if (!hasLoggedAudioError.current) {
        hasLoggedAudioError.current = true;
        console.error(messages.decode, e);
        if (messages.decodeHint) console.warn(messages.decodeHint);
      }
      setIsAudioValid(false);
    } else if (e.name === 'NotAllowedError') {
      console.warn(messages.blocked, e);
    } else {
      console.error(messages.unexpected, e);
    }
  };

  /**
   * ★設定のスライダーの値を、再生開始・フェードの計算にも使う（A13）★
   * 以前はここが 0.1 固定で、500ms ごとのフェード計算が audio.volume を 0.1 に戻していたため、
   * スライダーを動かしても音量が変わらなかった。タイマーの中から最新の値を読むので ref で持つ。
   */
  const bgmVolumeRef = useRef(bgmVolume);
  bgmVolumeRef.current = bgmVolume;
  useEffect(() => {
    if (readAudioPreferences().volume !== bgmVolume) writeAudioPreferences({ volume: bgmVolume });
    battleAudio().setSettings({ ...readAudioPreferences(), volume: bgmVolume });
    if (audioRef.current) {
      setTitleBgmVolume(audioRef.current, appBgmVolume(bgmVolume, bgmElapsedMs()));
    }
  }, [bgmVolume]);

  // ON/OFF の選択を覚える（次回もその状態で始まる）。
  // localStorage が使えない環境でも起動を止めない。
  useEffect(() => {
    try {
      safeSetItem(BGM_ENABLED_KEY, isBgmEnabled ? 'on' : 'off');
    } catch {
      /* 保存できなくても今回のセッションでは効いているので続行する */
    }
    /*
      ★BGMのON/OFFは1つのボタンで全部（2026-10-01）★
      以前は対戦BGMが別スイッチ（battle_audio_settings.bgm・既定ON）で、
      ホームのBGMボタンを切っても対戦BGM（待ち時間・試合中）は鳴り続けていた。
      アプリBGMのON/OFFを対戦側の設定へそのまま写し、どの画面のボタンでも両方が切り替わるようにする。
    */
    if (readAudioPreferences().bgm !== isBgmEnabled) writeAudioPreferences({ bgm: isBgmEnabled });
  }, [isBgmEnabled]);
  // 逆向き：対戦ロビーのBGMボタン（対戦側の設定）で切り替えたら、アプリBGMも同じにする
  useEffect(() => {
    const sync = () => {
      const settings = readAudioPreferences();
      setIsBgmEnabled(prev => prev === settings.bgm ? prev : settings.bgm);
      setBgmVolume(prev => prev === settings.volume ? prev : settings.volume);
    };
    const onStorage = (event: StorageEvent) => { if (event.key === 'battle_audio_settings' || event.key === null) sync(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('battle-audio-settings', sync);
    return () => { window.removeEventListener('battle-audio-settings', sync); window.removeEventListener('storage', onStorage); };
  }, []);

  useEffect(() => {
    // BattleMode remains mounted while hidden to preserve matches. Its owners must
    // not leak music into home (double BGM) or listening practice (answer interference).
    if (appState === 'battle') return;
    const reviewing = ['study_hub', 'note_list', 'note_detail'].includes(appState);
    const token = Symbol('app-audio-policy');
    const engine = battleAudio();
    engine.setSettings({ ...readAudioPreferences(), bgm: isBgmEnabled });
    engine.setBgmOwner(token, reviewing ? 'matching' : null, 100);
    const resume = () => { if (reviewing && document.visibilityState !== 'hidden') engine.unlock(); };
    resume();
    window.addEventListener('pointerdown', resume);
    document.addEventListener('visibilitychange', resume);
    return () => { engine.releaseBgmOwner(token); window.removeEventListener('pointerdown', resume); document.removeEventListener('visibilitychange', resume); };
  }, [appState, isBgmEnabled]);

  const bgmStateRef = useRef({ isBgmEnabled, isAudioValid, appState });
  useEffect(() => {
    bgmStateRef.current = { isBgmEnabled, isAudioValid, appState };
  }, [isBgmEnabled, isAudioValid, appState]);

  /*
    ===== ONのままでも90秒で自然に消える（フェードアウト） =====

    ■ 何のためか
      ONにした人でも「鳴り続けてほしい」わけではない。
      始めた直後は気分が乗るが、問題文を読み始めると音は邪魔になる。
      止めたくなったときに設定画面まで戻るのは手間なので、
      ★放っておいても消える★ようにする。

    ■ 「鳴っていた時間」だけを数える
      単に「ONにした時刻から90秒」で数えると、
      演習中（quiz / explanation）は止まっているのに時間だけ進み、
      演習から戻ってきた瞬間にはもう消えている、という
      「一度も聞けていないのに終わっている」状態が起きる。
      そこで ★実際に鳴っていた時間を足し込む★ 方式にする。
        bgmPlayedMsRef  … これまで鳴っていた合計（一時停止中も保持）
        bgmPlaySinceRef … いま鳴り始めた時刻（止まっているときは null）

    ■ 音量の計算はこのファイルに書かない
      「経過ミリ秒 → 音量」の対応は utils/bgmFade.ts の純粋関数に置く。
      ここに書くと目視でしか確認できないが、
      切り出せばブラウザを開かずに機械検査できる。

    ■ 消えたあとは pause する
      音量0のまま再生を続けると、電池を削り、
      端末の「再生中の音楽」を占有し続けてしまう（他アプリの音楽が戻らない）。
  */
  const bgmPlayedMsRef = useRef(0);
  const bgmPlaySinceRef = useRef<number | null>(null);

  /** 現在までに「実際に鳴っていた」合計ミリ秒。 */
  const bgmElapsedMs = () => {
    const since = bgmPlaySinceRef.current;
    return bgmPlayedMsRef.current + (since === null ? 0 : Date.now() - since);
  };

  /** 再生時間の計測をやり直す（ONに入れ直したとき＝もう一度聞きたいとき）。 */
  const resetBgmFade = () => {
    bgmPlayedMsRef.current = 0;
    bgmPlaySinceRef.current = null;
  };

  /** 鳴り始めた／止まった、を計測に反映する。 */
  const markBgmPlaying = (playing: boolean) => {
    if (playing) {
      if (bgmPlaySinceRef.current === null) bgmPlaySinceRef.current = Date.now();
      return;
    }
    const since = bgmPlaySinceRef.current;
    if (since !== null) {
      bgmPlayedMsRef.current += Date.now() - since;
      bgmPlaySinceRef.current = null;
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      
      // Attempt to play immediately on interaction to satisfy strict browser policies
      const audio = audioRef.current;
      const { isBgmEnabled, isAudioValid, appState } = bgmStateRef.current;
      
      if (audio && isAudioValid && isBgmEnabled && !BGM_SILENT_STATES.includes(appState)) {
        unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current));
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            handlePlayError(e, BGM_PLAY_ERROR_MESSAGES.INTERACTION);
          });
        }
      }

      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    // 画面を移るたびに viewport を通常の device-width・等倍へ戻す。
    // 一度 maximum-scale=1.0 で固定してから次フレームで拡大許可を戻すことで、
    // 前の画面のズーム状態を引き継がない（D対策）。ピンチズーム自体は許可したまま（C3）。
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0');
    requestAnimationFrame(() => {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    });
  }, [appState]);

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const target = e.target as HTMLAudioElement;
    const error = target.error;
    
    if (!hasLoggedAudioError.current) {
      hasLoggedAudioError.current = true;
      console.error('[BGM Error] Failed to load or decode. Details:', {
        code: error?.code,
        message: error?.message,
        networkState: target.networkState,
        readyState: target.readyState,
        src: target.src
      });
      console.warn('音源ファイルが読み込めないか、ブラウザでサポートされていない形式です。無音でアプリを続行します。');
    }
    setIsAudioValid(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioValid || hasLoggedAudioError.current) return;
    
    // Starting from the title mounts <audio>; a prior title tap may already have
    // set hasInteracted, so hasEntered must also trigger this effect.
    const shouldPlay = hasEntered && isBgmEnabled && hasInteracted && !BGM_SILENT_STATES.includes(appState);

    if (shouldPlay) {
      /*
        ★音量は設定のスライダーの値（bgmVolumeRef）にフェードの倍率をかけたもの★
        以前は 0.1 固定で、スライダーを動かしても再生開始やフェードの計算が
        0.1 に戻してしまい「音量が変わらない」状態だった（2026-09-30 修正）。
      */
      unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current, bgmElapsedMs()));
      // すでにフェードが終わっている（＝90秒＋5秒鳴り終えた）なら鳴らさない。
      // 画面を移動しただけで音が復活しては「消えた」ことにならない。
      if (isBgmFadeComplete(bgmElapsedMs())) {
        markBgmPlaying(false);
        audio.pause();
        return;
      }
      markBgmPlaying(true);
      // 鳴っている最中に play() を重ねて呼ばない（画面遷移のたびに呼ぶとバッファが詰まり「ガガッ」と鳴る）
      if (titlePauseTimer.current) { window.clearTimeout(titlePauseTimer.current); titlePauseTimer.current = null; }
      if (!audio.paused) return;
      // Play might fail if user hasn't interacted with the document yet or if source is invalid
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          handlePlayError(e, BGM_PLAY_ERROR_MESSAGES.AUTOPLAY);
        });
      }
    } else {
      // 止まる側でも計測を止める。演習中に進んだ時間を数えてしまうと
      // 「演習から戻ったらもう消えていた」状態になる。
      markBgmPlaying(false);
      // いきなり pause せず、音量を絞ってから止める（ブツッ・ガガッを防ぐ）。
      // 短い時間で戻ってきたら（演習→解説などの行き来）止めずに続ける。
      if (!audio.paused && !titlePauseTimer.current) {
        setTitleBgmVolume(audio, 0);
        titlePauseTimer.current = window.setTimeout(() => { titlePauseTimer.current = null; audio.pause(); }, 250);
      }
    }
  }, [appState, isBgmEnabled, hasInteracted, isAudioValid, hasEntered]);

  /*
    ===== フェードを実際に進める時計 =====
    音量の計算式（utils/bgmFade.ts）は「経過時間を渡せば音量が出る」形なので、
    誰かが定期的に呼んでやる必要がある。鳴っている間だけ 500ms ごとに呼ぶ。

    ★鳴っていないときは時計を作らない★（依存配列に isBgmEnabled 等を入れ、
    OFF・演習中・音源不正のときは setInterval を張らない）。
    常時タイマーを回すと、音を切っている人の電池まで削ることになる。
  */
  useEffect(() => {
    if (!isBgmEnabled || !isAudioValid || hasInteracted === false) return;
    if (BGM_SILENT_STATES.includes(appState)) return;

    const id = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const elapsed = bgmElapsedMs();
      setTitleBgmVolume(audio, appBgmVolume(bgmVolumeRef.current, elapsed));
      if (isBgmFadeComplete(elapsed)) {
        markBgmPlaying(false);
        audio.pause();
        // 「もう鳴らない」ことを画面にも伝える（ヘッダーのボタンの見た目が変わる）。
        setIsBgmFadedOut(true);
      }
    }, 500);

    return () => window.clearInterval(id);
  }, [isBgmEnabled, isAudioValid, hasInteracted, appState]);

  // iOS/Safari では audio.play() をユーザー操作（クリック/タップ）と同一の
  // コールスタック内で呼ばないと再生がブロックされる。
  // 設定画面のトグルでは React state 更新 → useEffect 再生では間に合わないため、
  // 操作ハンドラ内で直接 play/pause を実行する。
  const handleToggleBgm = (enabled: boolean) => {
    setIsBgmEnabled(enabled);
    setHasInteracted(true);
    /*
      ★ONに入れ直したら再生時間の計測をやり直す★
      「もう一度鳴らしたい」という操作なので、
      前回の90秒を引き継いだままだと押しても鳴らない
      （＝ボタンが壊れているように見える）。
      OFFにしたときも0に戻す。次にONにしたときが「始まり」だから。
    */
    resetBgmFade();
    setIsBgmFadedOut(false);
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      if (!isAudioValid || hasLoggedAudioError.current) return;
      if (BGM_SILENT_STATES.includes(appState)) return;
      unlockTitleBgm(audio, appBgmVolume(bgmVolumeRef.current));
      markBgmPlaying(true);
      // iOS Safari 対策:
      // 音源がまだデコードされていない場合、ユーザー操作と同一スタックで
      // load() → play() を呼ぶことで再生ブロック/デコード失敗を回避しやすくなる。
      try {
        if (audio.readyState < 2) {
          audio.load();
        }
      } catch {
        /* load 失敗は play 側の catch で処理 */
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          handlePlayError(e, BGM_PLAY_ERROR_MESSAGES.TOGGLE);
        });
      }
    } else {
      markBgmPlaying(false);
      audio.pause();
    }
  };

  return {
    audioRef,
    isBgmEnabled,
    setIsBgmEnabled,
    bgmVolume,
    setBgmVolume,
    setHasInteracted,
    isBgmFadedOut,
    handleAudioError,
    handleToggleBgm,
  };
}
