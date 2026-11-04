import { useEffect, useState } from 'react';

/**
 * 広告を出さない人（2026-11-04 ご要望「塾クラスの生徒には広告を出さない」）。
 *   ・いまの理由は「塾クラス（plan == 'juku'）に入っている」だけ（hooks/useJukuAdFree.ts が切り替える）。
 *   ・ON の間は、バナー（と、その場所の余白）・ガチャの「動画で1回」の広告を出さない。
 *     動画で1回は今までどおりアプリ内の応援動画で引ける（回数・ルールは同じ）。
 *   ・ここは firebase を読まない（広告の部品とテストを軽く保つ）。
 * 戻すとき：AdBannerSlot.tsx と rewardedAd.ts の isAdFree() を外し、App.tsx の useJukuAdFree() を消す。
 */
let adFree = false;
const listeners = new Set<(on: boolean) => void>();

export function isAdFree(): boolean {
  return adFree;
}

export function setAdFree(on: boolean): void {
  if (adFree === on) return;
  adFree = on;
  listeners.forEach((l) => l(on));
}

export function subscribeAdFree(l: (on: boolean) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** 画面用：広告を出さない人か（切り替わったら描き直す） */
export function useAdFree(): boolean {
  const [on, setOn] = useState(isAdFree);
  useEffect(() => {
    setOn(isAdFree());
    return subscribeAdFree(setOn);
  }, []);
  return on;
}
