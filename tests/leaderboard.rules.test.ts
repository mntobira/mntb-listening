/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * firestore.rules のランキング（leaderboard_*）に関するユニットテスト。
 *
 * ■ なぜランキングだけ専用のテストを置くのか
 *   ランキングは `allow read: if true`、つまり誰でも読める公開データ。
 *   「書き込めた内容がそのまま全ユーザーの画面に出る」ので、
 *   書き込み検証の穴はそのまま
 *     ・巨大な文字列で全員の表示を壊す
 *     ・想定外のフィールドを公開ストレージに置く
 *     ・他人のスコアを書き換える
 *   に直結する。ここはルールの中でも最もリスクが高い場所なので、
 *   「通ってよい形」と「弾くべき形」を両方テストで固定しておく。
 *
 * 実行:
 *   npm run test:rules
 *   （内部で Firestore エミュレータを起動する）
 */

import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const ALICE = 'uid_alice';
const BOB = 'uid_bob';
const CHAPTER = 'c1_1';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mntb-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function ctxFor(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}
function guestCtx() {
  return testEnv.unauthenticatedContext().firestore();
}

/** アプリ（src/utils/leaderboard.ts）が実際に書いている形。 */
function chapterPayload(uid: string, over: Record<string, unknown> = {}) {
  return {
    uid,
    nickname: '名無しの化学者',
    photoURL: '',
    chapterId: CHAPTER,
    bestScore: 850,
    correctRate: 0.85,
    totalCorrect: 17,
    totalQuestions: 20,
    timeUsedSec: 240,
    playedAt: serverTimestamp(),
    ...over,
  };
}
function totalPayload(uid: string, over: Record<string, unknown> = {}) {
  return {
    uid,
    nickname: '名無しの化学者',
    photoURL: '',
    totalScore: 1700,
    chapterScores: { [CHAPTER]: 850, c1_2_A: 850 },
    updatedAt: serverTimestamp(),
    ...over,
  };
}
function eventPayload(uid: string, over: Record<string, unknown> = {}) {
  return {
    uid,
    nickname: '名無しの化学者',
    photoURL: '',
    chapterId: CHAPTER,
    score: 850,
    correctRate: 0.85,
    totalCorrect: 17,
    totalQuestions: 20,
    timeUsedSec: 240,
    playedAt: serverTimestamp(),
    ...over,
  };
}

const chapterRef = (db: ReturnType<typeof ctxFor>, uid: string, chapterId = CHAPTER) =>
  doc(db, 'leaderboard_chapter', `${chapterId}_${uid}`);

// ==================================================================
// leaderboard_chapter
// ==================================================================
describe('leaderboard_chapter', () => {
  it('アプリが実際に書く形は書き込める（＝機能を壊していない）', async () => {
    const db = ctxFor(ALICE);
    await assertSucceeds(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE)));
  });

  it('ランキングなので誰でも読める（未ログインでも可）', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(chapterRef(ctx.firestore(), ALICE), chapterPayload(ALICE));
    });
    await assertSucceeds(getDoc(chapterRef(guestCtx(), ALICE)));
  });

  it('未ログインでは書き込めない', async () => {
    await assertFails(setDoc(chapterRef(guestCtx(), ALICE), chapterPayload(ALICE)));
  });

  it('他人の uid を名乗った書き込みは弾く', async () => {
    const db = ctxFor(BOB);
    await assertFails(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE)));
  });

  it('ドキュメントIDが `chapterId_uid` でなければ弾く（他人の行を作れない）', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(doc(db, 'leaderboard_chapter', 'not_matching_id'), chapterPayload(ALICE)),
    );
  });

  // --- ここから今回ふさいだ穴 ---
  it('nickname が長すぎる場合は弾く（公開画面を壊せない）', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { nickname: 'あ'.repeat(25) })),
    );
  });

  it('nickname が巨大な文字列（ストレージ悪用）なら弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { nickname: 'x'.repeat(100000) })),
    );
  });

  it('nickname が空文字なら弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { nickname: '' })));
  });

  it('nickname が文字列でなければ弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { nickname: 12345 })));
  });

  it('nickname が欠けていたら弾く', async () => {
    const db = ctxFor(ALICE);
    const { nickname, ...rest } = chapterPayload(ALICE) as Record<string, unknown>;
    await assertFails(setDoc(chapterRef(db, ALICE), rest));
  });

  it('photoURL が長すぎる場合は弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { photoURL: 'h'.repeat(600) })),
    );
  });

  it('想定外のフィールドを混ぜたら弾く（公開領域の悪用防止）', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { payload: 'x'.repeat(50000) })),
    );
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { isAdmin: true })),
    );
  });

  it('スコアの範囲外は弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { bestScore: -1 })));
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { bestScore: 999999999 })),
    );
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { bestScore: '999' })),
    );
  });

  it('正答率が 0〜1 の外なら弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { correctRate: 1.5 })));
    await assertFails(setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { correctRate: -0.1 })));
  });

  it('playedAt がタイムスタンプでなければ弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(chapterRef(db, ALICE), chapterPayload(ALICE, { playedAt: 'いつか' })),
    );
  });

  it('削除はできない（記録の消し逃げ防止）', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(chapterRef(ctx.firestore(), ALICE), chapterPayload(ALICE));
    });
    const { deleteDoc } = await import('firebase/firestore');
    await assertFails(deleteDoc(chapterRef(ctxFor(ALICE), ALICE)));
  });
});

// ==================================================================
// leaderboard_total
// ==================================================================
describe('leaderboard_total', () => {
  it('アプリが実際に書く形は書き込める', async () => {
    const db = ctxFor(ALICE);
    await assertSucceeds(setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE)));
  });

  it('他人のドキュメントは書けない', async () => {
    const db = ctxFor(BOB);
    await assertFails(setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE)));
  });

  it('nickname の長さ・型を検証する', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE, { nickname: 'あ'.repeat(25) })),
    );
    await assertFails(
      setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE, { nickname: null })),
    );
  });

  it('想定外のフィールドを弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE, { blob: 'x'.repeat(50000) })),
    );
  });

  it('chapterScores が過大なら弾く', async () => {
    const db = ctxFor(ALICE);
    const huge: Record<string, number> = {};
    for (let i = 0; i < 400; i++) huge[`c${i}`] = 1;
    await assertFails(
      setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE, { chapterScores: huge })),
    );
  });

  it('合計スコアの範囲・型を検証する', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE, { totalScore: -1 })),
    );
    await assertFails(
      setDoc(doc(db, 'leaderboard_total', ALICE), totalPayload(ALICE, { totalScore: 1e12 })),
    );
  });

  it('誰でも読める（ランキング表示）', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'leaderboard_total', ALICE), totalPayload(ALICE));
    });
    await assertSucceeds(getDoc(doc(guestCtx(), 'leaderboard_total', ALICE)));
  });
});

// ==================================================================
// leaderboard_events
// ==================================================================
describe('leaderboard_events', () => {
  it('アプリが実際に書く形は追加できる', async () => {
    const db = ctxFor(ALICE);
    await assertSucceeds(addDoc(collection(db, 'leaderboard_events'), eventPayload(ALICE)));
  });

  it('他人の uid での追加は弾く', async () => {
    const db = ctxFor(BOB);
    await assertFails(addDoc(collection(db, 'leaderboard_events'), eventPayload(ALICE)));
  });

  it('nickname / photoURL の長さを検証する', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      addDoc(collection(db, 'leaderboard_events'), eventPayload(ALICE, { nickname: 'あ'.repeat(25) })),
    );
    await assertFails(
      addDoc(collection(db, 'leaderboard_events'), eventPayload(ALICE, { photoURL: 'h'.repeat(600) })),
    );
  });

  it('想定外のフィールドを弾く', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      addDoc(collection(db, 'leaderboard_events'), eventPayload(ALICE, { junk: 'x'.repeat(50000) })),
    );
  });

  it('スコアの範囲を検証する', async () => {
    const db = ctxFor(ALICE);
    await assertFails(
      addDoc(collection(db, 'leaderboard_events'), eventPayload(ALICE, { score: 99999999 })),
    );
  });

  it('更新・削除はできない（履歴の改ざん防止）', async () => {
    let id = '';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'leaderboard_events'), eventPayload(ALICE));
      id = ref.id;
    });
    const { updateDoc, deleteDoc } = await import('firebase/firestore');
    const db = ctxFor(ALICE);
    await assertFails(updateDoc(doc(db, 'leaderboard_events', id), { score: 1000000 }));
    await assertFails(deleteDoc(doc(db, 'leaderboard_events', id)));
  });
});
