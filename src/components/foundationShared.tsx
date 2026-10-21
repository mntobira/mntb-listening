import React, { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { parseSupportProgress, supportStorageKey, type SupportProgress } from '../data/listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { speak, stopSpeech, isSpeechSupported } from '../utils/listeningSpeech';
import { pauseAllAudio } from '../utils/audioElements';
import { playVocabAudio, prefetchVocabAudioIndex, stopVocabAudio } from '../utils/vocabAudio';

export { prefetchVocabAudioIndex };

/** 「英文法・英単語を固める」ページ（FoundationPage）の共通部品。 */

/** 端末の音声で読む（他の音源は止める）。 */
export function say(text: string, onEnd?: () => void): boolean {
  pauseAllAudio();
  stopVocabAudio();
  return speak('listening-support', text, 1, { rate: .85, onEnd });
}

/**
 * 英単語を読む。録音（ElevenLabs）があればそれを、無ければ端末の音声で読む。
 * 録音の有無は public/audio/vocab/index.json で決まる（utils/vocabAudio.ts）。
 */
export function sayWord(wordId: string, text: string): void {
  pauseAllAudio();
  stopSpeech();
  // 待たずに鳴らす（iPhone はタップの中で play() しないと音が出ない）。録音が無い・壊れていれば端末の読み上げ
  if (!playVocabAudio(wordId, () => say(text))) say(text);
}

export function ReadAloud({ text, label = '読み上げ' }: { text: string; label?: string } & React.Attributes) {
  const [playing, setPlaying] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; stopSpeech(); }; }, [text]);
  return <button type="button" className="fd-say" disabled={!isSpeechSupported()} aria-pressed={playing}
    onClick={() => { if (playing) { stopSpeech(); setPlaying(false); return; } setPlaying(say(text, () => { if (alive.current) setPlaying(false); })); }}>
    <Volume2 size={16} aria-hidden="true" />{playing ? '止める' : label}
  </button>;
}

/**
 * 覚えた印（単語・文法ポイント）。以前の ListeningSupport と同じ保存形式・同じキーを使う
 * （＝これまで付けた印はそのまま引き継がれる）。
 */
export function useSupportProgress(uid: string) {
  const [saved, setSaved] = useState<{ progress: SupportProgress; error: string }>(() => {
    try {
      const store = safeLocalStorage();
      if (!store) throw new Error('この端末では保存できません。学習内容は閲覧できます。');
      return { progress: parseSupportProgress(store.getItem(supportStorageKey(uid))), error: '' };
    } catch (e) { return { progress: { version: 1, words: [], grammar: [] }, error: e instanceof Error ? e.message : '保存記録を読み込めません。' }; }
  });
  const [saveError, setSaveError] = useState('');
  const mark = (kind: 'words' | 'grammar', id: string, done: boolean) => {
    if (saved.error) return;
    try {
      const store = safeLocalStorage(); if (!store) throw new Error('この端末では保存できません。');
      // 別タブで付けた印を消さないよう、保存直前に最新を読み直す。
      const current = parseSupportProgress(store.getItem(supportStorageKey(uid)));
      const ids = new Set(current[kind]); const added = done && !ids.has(id); if (done) ids.add(id); else ids.delete(id);
      // 単語帳で新しく「覚えた」にした語はミッション（単語帳でN語）を進める。外して付け直しても1日の上限はミッション側で止まる
      if (added && kind === 'words') void import('../battle/data/growthStore').then(m => m.recordVocabActivity('vocab_learn', 1, id));
      const next = { ...current, [kind]: [...ids] };
      store.setItem(supportStorageKey(uid), JSON.stringify(next));
      setSaved({ progress: next, error: '' }); setSaveError('');
    } catch (e) { setSaveError(e instanceof Error ? e.message : '保存に失敗しました。'); }
  };
  return { progress: saved.progress, error: saved.error || saveError, locked: !!saved.error, mark };
}
