/**
 * 対戦ルールの上書き（Firestore の battle_rules を起動時に1回だけ読み、以後は同期的に引く）。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { db } from '../../firebase';
import { collection, getDocs } from '../../utils/firestoreMetered';
import { normalizeRule } from '../core/battleRules';
import type { BattleRule } from '../core/types';

// ============================================================
// ルール（Firestore で上書きできるようにする）
// ============================================================

/**
 * ルールの上書き値を覚えておく場所。
 *
 * ★同期版を用意する理由★
 * 部屋を作る処理の中でルールが必要になるが、
 * そこで毎回 Firestore を読むと待ち時間が増える。
 * 起動時に1回だけ読んで、以後はここから同期的に取る。
 */
const ruleCache = new Map<string, Partial<BattleRule>>();
let ruleLoaded = false;

export function loadRuleSync(subject: string): Partial<BattleRule> {
  return ruleCache.get(subject) || {};
}

/**
 * ルールの上書きを読み込む（起動時に1回だけ）。
 *
 * ★なぜ Firestore からルールを読むのか★
 * 「1試合の問題数」「配点」は運用しながら調整したい値である。
 * コードに埋めるとアプリの更新が必要になり、
 * 更新前後の端末で違うルールの試合が起きてしまう。
 * Firestore に置けば、全員が同じ値を即座に共有できる。
 *
 * 読めなかった場合はコード側の既定値で動く（対戦が止まらないこと優先）。
 */
export async function loadBattleRuleOverrides(): Promise<void> {
  if (ruleLoaded) return;
  ruleLoaded = true;
  try {
    const snap = await getDocs(collection(db, 'battle_rules'));
    for (const d of snap.docs) {
      ruleCache.set(d.id, d.data() as Partial<BattleRule>);
    }
  } catch {
    // 既定値のまま動かす
  }
}

/** 教科の実効ルール（Firestore の上書きを反映した最終形） */
export function effectiveRule(subject: string): BattleRule {
  return normalizeRule(subject, loadRuleSync(subject));
}
