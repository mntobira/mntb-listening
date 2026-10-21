import { stopVocabAudio } from './vocabAudio';
/**
 * ===================================================================
 * listeningSpeech.ts ― リスニング音源の「MP3が無いとき」の読み上げ
 * ===================================================================
 *
 * ■ なぜ必要か
 *   配布PDFから取り込んだ類題集（第1問A 13セット＋第1問B 15セット＝112問）には
 *   MP3 が付属していない。しかしリスニングは「音を聞く」ことが問題そのものなので、
 *   音が出ないと問題として成立しない。
 *   そこでブラウザ標準の Web Speech API（SpeechSynthesis）で script を読み上げ、
 *   MP3 が用意できるまでの間も本番と同じ操作（再生・もう1回・2回続けて）で
 *   練習できる状態を保つ。
 *
 * ■ 設計方針
 *   ・SpeechSynthesis はグローバルに1つしか無い（同時に複数は鳴らせない）ため、
 *     このモジュールで「今どれを読んでいるか」を一元管理する。
 *   ・英語の声を優先して選ぶ。端末に英語音声が無い場合は既定音声にフォールバックする。
 *   ・読み上げ終了・中断のどちらでも必ずコールバックが1回だけ呼ばれるようにする
 *     （呼ばれないと再生中アイコンが戻らず「止まらない」ように見えてしまう）。
 *   ・SSR／テスト環境（window が無い・speechSynthesis が無い）では
 *     例外を投げずに「利用不可」を返し、呼び出し側が UI を出し分けられるようにする。
 */

/** この環境で読み上げが使えるか。SSR・古い端末・テスト環境では false。 */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * 英語の音声を選ぶ。
 * en-US → en-GB → en 系 → 既定（null）の順に落としていく。
 * getVoices() は初回呼び出し時に空配列を返す実装があるため、
 * 取れなかった場合は null を返して端末の既定音声に任せる。
 */
export function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  let voices: SpeechSynthesisVoice[] = [];
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    return null;
  }
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
    null
  );
}

/**
 * 対話（第3問・第4問）用に、A と B で聞き分けられる2つの声を選ぶ。
 *
 * ■ なぜ必要か
 *   第3問は「2人の対話」を1回だけ聞いて答える大問。
 *   1つの声で全部読み上げると、どこで話者が替わったのか分からず
 *   「誰がどう言ったか」を問う設問（What will the man do? など）が解けない。
 *   本番の音源は男性／女性の2人なので、読み上げでも声を替える必要がある。
 *
 * ■ 選び方
 *   1. 英語音声を集める（en-US → en-GB → en 系）。
 *   2. 名前が違う2つが取れれば、それを A / B に割り当てる。
 *   3. 1つしか無い端末では同じ声を返し、呼び出し側が pitch をずらして
 *      聞き分けられるようにする（voice が null でも動く）。
 */
export function pickEnglishVoicePair(): [SpeechSynthesisVoice | null, SpeechSynthesisVoice | null] {
  if (!isSpeechSupported()) return [null, null];
  let voices: SpeechSynthesisVoice[] = [];
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    return [null, null];
  }
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  if (english.length === 0) return [null, null];

  const first = pickEnglishVoice() || english[0];
  const second = english.find((v) => v.name !== first.name) || first;
  return [first, second];
}

export interface SpeakOptions {
  /** 読み上げ速度。0.75 でゆっくり確認できる */
  rate?: number;
  /** 読み終わり（または中断）で1回だけ呼ばれる */
  onEnd?: () => void;
}

/** 対話1行ぶん。who は話者ラベル（'A' / 'B'）。 */
export interface SpeechTurn {
  who: string;
  text: string;
}

/** 現在読み上げ中の識別子。null なら停止中。 */
let currentId: string | null = null;
/** 二重発火を防ぐため、utterance ごとに終了通知済みかを持つ */
let endNotified = false;

/** いま読み上げている識別子を返す（テスト・UI 判定用）。 */
export function getSpeakingId(): string | null {
  return currentId;
}

/** 読み上げを止める。onEnd は呼ばれる（UI の再生アイコンを必ず戻すため）。 */
export function stopSpeech(): void {
  stopVocabAudio(); // 英単語の録音（utils/vocabAudio）も一緒に止める＝画面を変えても音が残らない
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* 中断できない環境は無視する */
  }
  currentId = null;
}

/**
 * script を読み上げる。
 *
 * @param id     UI 側の識別子（subId）。同じ id を再度渡すと読み直しになる。
 * @param text   読み上げる英文
 * @param times  読み上げ回数（本番の2回読みを再現するときは 2）
 * @returns 読み上げを開始できたか。false なら呼び出し側でエラー表示する。
 */
export function speak(id: string, text: string, times = 1, opts: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) return false;
  const body = (text || '').trim();
  if (!body) return false;

  // 直前の読み上げは必ず止める（重なると何を言っているか分からなくなる）
  stopSpeech();

  const total = Math.max(1, Math.min(3, Math.floor(times)));
  currentId = id;
  endNotified = false;

  const finish = () => {
    if (endNotified) return;
    endNotified = true;
    currentId = null;
    opts.onEnd?.();
  };

  /** n 回目の読み上げを積む。最後の回が終わったときだけ finish する。 */
  const enqueue = (index: number) => {
    const u = new window.SpeechSynthesisUtterance(body);
    u.lang = 'en-US';
    u.rate = opts.rate ?? 1;
    const voice = pickEnglishVoice();
    if (voice) u.voice = voice;
    if (index === total - 1) {
      u.onend = finish;
      u.onerror = finish;
    } else {
      // 2回読みの1回目と2回目の間に、本番同様の短い間を作る
      u.onerror = finish;
    }
    window.speechSynthesis.speak(u);
  };

  try {
    for (let i = 0; i < total; i += 1) enqueue(i);
  } catch {
    finish();
    return false;
  }
  return true;
}

/**
 * 対話（A / B の掛け合い）を、話者ごとに声を替えて読み上げる。
 *
 * @param id     UI 側の識別子（subId）
 * @param turns  A / B の発話を順番に並べた配列
 * @param times  通し回数（第3問は1回読みなので通常 1）
 *
 * ■ 実装の要点
 *   ・1発話＝1 utterance にする。utterance ごとに voice を替えられるので、
 *     これが「話者を聞き分けられる」最も確実な方法になる。
 *   ・声が1種類しか無い端末でも聞き分けられるよう、pitch を A=1.05 / B=0.9 と
 *     わずかにずらす（声色を替える端末では二重に分かりやすくなるだけで害はない）。
 *   ・終了通知は最後の発話だけに付ける。途中の utterance に付けると
 *     1行読み終わった時点で「再生終了」扱いになり、UI のアイコンが戻ってしまう。
 */
export function speakDialogue(
  id: string,
  turns: SpeechTurn[],
  times = 1,
  opts: SpeakOptions = {},
): boolean {
  if (!isSpeechSupported()) return false;
  const lines = (turns || [])
    .map((t) => ({ who: (t.who || 'A').trim(), text: (t.text || '').trim() }))
    .filter((t) => t.text.length > 0);
  if (lines.length === 0) return false;

  stopSpeech();

  const total = Math.max(1, Math.min(3, Math.floor(times)));
  currentId = id;
  endNotified = false;

  const finish = () => {
    if (endNotified) return;
    endNotified = true;
    currentId = null;
    opts.onEnd?.();
  };

  const [voiceA, voiceB] = pickEnglishVoicePair();

  // 3人以上（A/B/C）にも耐えるよう、登場順に A 側・B 側を交互に割り当てる。
  const speakers = Array.from(new Set(lines.map((l) => l.who)));

  const queue: { text: string; voice: SpeechSynthesisVoice | null; pitch: number }[] = [];
  for (let pass = 0; pass < total; pass += 1) {
    lines.forEach((line) => {
      const isSecond = speakers.indexOf(line.who) % 2 === 1;
      queue.push({
        text: line.text,
        voice: isSecond ? voiceB : voiceA,
        pitch: isSecond ? 0.9 : 1.05,
      });
    });
  }

  try {
    queue.forEach((item, index) => {
      const u = new window.SpeechSynthesisUtterance(item.text);
      u.lang = 'en-US';
      u.rate = opts.rate ?? 1;
      u.pitch = item.pitch;
      if (item.voice) u.voice = item.voice;
      if (index === queue.length - 1) {
        u.onend = finish;
        u.onerror = finish;
      } else {
        u.onerror = finish;
      }
      window.speechSynthesis.speak(u);
    });
  } catch {
    finish();
    return false;
  }
  return true;
}

/**
 * トラックが「MP3 を持っているか」を判定する。
 * false のとき、UI は読み上げ（SpeechSynthesis）にフォールバックする。
 */
export function hasRealAudio(track: { audioUrl?: string }): boolean {
  return typeof track.audioUrl === 'string' && track.audioUrl.trim().length > 0;
}
