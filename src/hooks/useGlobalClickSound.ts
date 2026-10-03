import { useEffect } from 'react';
import { sharedAudioContextResumed } from '../battle/audio/sharedAudioContext';

export function useGlobalClickSound() {
  useEffect(() => {
    let audioCtx: AudioContext | null = null;

    const playClickSound = () => {
      try {
        // ★アプリ全体で1つの AudioContext を使う★（タイトル曲・対戦の音と共有）
        //   別に作ると iOS で音声出力の組み直しが起き、BGM が崩れる。
        //   またブラウザは同時に開けるコンテキスト数に上限がある。
        audioCtx = sharedAudioContextResumed();
        if (!audioCtx) return;

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        // Quick frequency drop for a "click/tick" sound
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);

        // Quick volume envelope
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
      } catch (e) {
        console.warn('Audio play failed', e);
      }
    };

    const handleClick = (event: MouseEvent) => {
      // Find the closest button element from the clicked target
      const target = event.target as HTMLElement;
      const button = target.closest('button, a[role="button"], input[type="button"], input[type="submit"], .cursor-pointer');

      // 対戦中の画面は選択肢ごとに専用の効果音（tap）を鳴らすので、二重に鳴らさない
      if (button && !button.closest('.arena-live-stage, [data-own-sfx]')) {
        playClickSound();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      // 共有コンテキストは閉じない（ほかの音も止まってしまう）
    };
  }, []);
}
