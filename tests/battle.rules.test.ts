/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ===================================================================
 * 対戦モード（battle_*）の Firestore ルールテスト
 * ===================================================================
 *
 * ■ なぜルールのテストが対戦モードで特別に重要なのか
 *
 * 対戦モードは Cloud Functions を使わない（Spark 無料枠のため）。
 * つまり ★サーバー側のコードが1行も無い★ 状態で、
 * 2人の端末が同じ Firestore ドキュメントを直接書き換え合う。
 *
 * この構成で不正を防いでいるのは
 *   ・Firestore ルール（このテストの対象）
 *   ・両者が同じ計算をして食い違いを検出する仕組み（attest）
 * の2つだけである。ルールに穴があれば、
 *
 *   ・相手の回答を書き換えて負けを勝ちにする
 *   ・questionIds を差し替えて自分だけ簡単な問題にする
 *   ・deadlineAt を10分後にして時間無制限で解く
 *   ・レートを1回の書き込みで3000にする
 *   ・同じ試合結果を何度も反映して勝ち数を盛る
 *
 * が全部できてしまう。しかもクライアント JS の中に正解が入っている
 * 設計なので、「アプリを改造した人」を前提に守る必要がある。
 *
 * ■ 検査するルールは「本体＋追記」を結合したもの
 *
 * 対戦モードは新規ファイルのみを渡す方式なので、
 * ルールの追記ぶんは firestore.rules.battle-append.txt に別置きしている。
 * テストが firestore.rules 単体を読むと対戦のルールが存在せず、
 * ★何を書き込んでも失敗するので assertFails が全部通る★
 * という最悪の偽の緑になる。
 * そのため tests/helpers/battleRules.ts の mergedRules() で
 * 本番と同じ1枚に結合してから読み込む。
 * （結合位置がずれたら例外を投げるようにしてある）
 *
 * 実行:
 *   npm run test:rules
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { mergedRules } from './helpers/battleRules';

const HOST = 'uid_host';
const GUEST = 'uid_guest'; // 相手プレイヤー（ログイン済み）
const OUTSIDER = 'uid_outsider'; // 部屋に関係ない第三者
const ROOM = 'room_test_1';
const CODE = 'AB2C';
const SUBJECT = 'chemistry_basic';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mntb-rules-test',
    firestore: {
      // ★本体＋対戦追記を結合したもの（本番と同じ形）★
      rules: mergedRules(),
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

/**
 * ★Firestore インスタンスは uid ごとに1つだけ作って使い回す★
 *
 * 最初は毎回 authenticatedContext(uid).firestore() を呼んでいたが、
 * このテストは it が80件以上あり、1件で2〜3個のインスタンスを作る。
 * インスタンスごとにエミュレータへ gRPC ストリームが張られ、
 * 誰も閉じないまま溜まっていくため、後半のテストが1件10秒近くかかり、
 * ★最後はエミュレータ自体が落ちた★。
 *
 * 認証情報はインスタンス生成時に決まるので、uid ごとに1つ持てば足りる。
 * clearFirestore() はデータだけを消すので、使い回しても
 * テスト間のデータ独立性は保たれる。
 */
const dbCache = new Map<string, ReturnType<RulesTestEnvironment['authenticatedContext']>>();

function ctxFor(uid: string) {
  let ctx = dbCache.get(uid);
  if (!ctx) {
    ctx = testEnv.authenticatedContext(uid);
    dbCache.set(uid, ctx);
  }
  return ctx.firestore();
}

let guestContext: ReturnType<RulesTestEnvironment['unauthenticatedContext']> | null = null;

function guestCtx() {
  if (!guestContext) guestContext = testEnv.unauthenticatedContext();
  return guestContext.firestore();
}

/** src/battle/data/battle.ts が実際に書いている部屋の形 */
function roomPayload(over: Record<string, unknown> = {}) {
  return {
    id: ROOM,
    status: 'waiting',
    mode: 'friend',
    subject: SUBJECT,
    joinCode: CODE,
    hostUid: HOST,
    players: [HOST],
    profiles: {
      [HOST]: { uid: HOST, nickname: 'ホスト', photoURL: '', rating: 1500 },
    },
    questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
    rules: {
      questionCount: 5,
      pointsCorrect: 100,
      pointsSpeedMax: 50,
      pointsStreak: 15,
    },
    currentIndex: 0,
    deadlineAt: null,
    answers: {},
    attest: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...over,
  };
}

/** ルール無効で下地を作る（テストの前提づくり用） */
async function seed(path: string[], data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    // @ts-expect-error パスの可変長は doc() の型で表現しづらい
    await setDoc(doc(ctx.firestore(), ...path), data);
  });
}

/** 2人が入っている「対戦中」の部屋を用意する */
async function seedPlayingRoom(over: Record<string, unknown> = {}) {
  await seed(['battle_rooms', ROOM], {
    ...roomPayload({
      status: 'playing',
      players: [HOST, GUEST],
      profiles: {
        [HOST]: { uid: HOST, nickname: 'ホスト', photoURL: '', rating: 1500 },
        [GUEST]: { uid: GUEST, nickname: 'ゲスト', photoURL: '', rating: 1500 },
      },
      currentIndex: 1,
      deadlineAt: new Date(Date.now() + 20000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...over,
  });
}

/**
 * 「決着済みで、両者の申告が入っている部屋」を用意する。
 *
 * ★これが必要になった理由★
 * battle_ranking / battle_history のルールは、
 * lastRoomId（またはドキュメントID）が指す部屋を get() で読み、
 *   ・実在する
 *   ・自分が参加者である
 *   ・2人部屋である
 *   ・decided（status == 'finished'）
 *   ・自分の申告が入っている
 * ことを要求する。
 * これが無かった頃は、架空の部屋IDを交互に書くだけで
 * ★1試合もせずにレートを上限まで上げられた★。
 *
 * 正常系のテストも、この「実在する試合」を先に置かないと通らない。
 * ＝テストの前提が本番の前提と同じになる。
 */
async function seedFinishedRoom(roomId: string = ROOM, over: Record<string, unknown> = {}) {
  await seed(['battle_rooms', roomId], {
    ...roomPayload({
      id: roomId,
      status: 'finished',
      players: [HOST, GUEST],
      profiles: {
        [HOST]: { uid: HOST, nickname: 'ホスト', photoURL: '', rating: 1500 },
        [GUEST]: { uid: GUEST, nickname: 'ゲスト', photoURL: '', rating: 1500 },
      },
      currentIndex: 4,
      deadlineAt: new Date(Date.now() - 1000),
      attest: {
        [HOST]: { myScore: 300, opponentScore: 200, outcome: 'win', at: new Date() },
        [GUEST]: { myScore: 200, opponentScore: 300, outcome: 'lose', at: new Date() },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...over,
  });
}

// ===================================================================
// battle_rules（運用者がコンソールから触る設定）
// ===================================================================
describe('battle_rules — 出題設定', () => {
  it('誰でも読める（未ログインでも教科カードを描けるようにするため）', async () => {
    await seed(['battle_rules', SUBJECT], { subject: SUBJECT, questionCount: 10 });
    await assertSucceeds(getDoc(doc(guestCtx(), 'battle_rules', SUBJECT)));
  });

  it('★誰も書けない（Firebase コンソール専用）★', async () => {
    // 設定を書けると「自分だけ制限時間300秒」にできてしまう。
    await assertFails(setDoc(doc(ctxFor(HOST), 'battle_rules', SUBJECT), { questionCount: 3 }));
  });
});

// ===================================================================
// ゲスト（未ログイン）の全面禁止
// ===================================================================
describe('未ログインは対戦に一切触れない', () => {
  it('★部屋を作れない★', async () => {
    await assertFails(setDoc(doc(guestCtx(), 'battle_rooms', ROOM), roomPayload()));
  });

  it('★部屋を読めない★', async () => {
    await seedPlayingRoom();
    await assertFails(getDoc(doc(guestCtx(), 'battle_rooms', ROOM)));
  });

  it('★マッチング待ち行列に並べない★', async () => {
    await assertFails(
      setDoc(doc(guestCtx(), 'battle_queue', 'anon'), {
        uid: 'anon',
        subject: SUBJECT,
        profile: { uid: 'anon', nickname: 'ゲスト', photoURL: '', rating: 1500 },
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('★レートを作れない★', async () => {
    await assertFails(
      setDoc(doc(guestCtx(), 'battle_ranking', 'anon'), {
        uid: 'anon',
        nickname: 'ゲスト',
        photoURL: '',
        rating: 1500,
        wins: 0,
        losses: 0,
        draws: 0,
        lastRoomId: '',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('ランキングは読める（一覧の閲覧は公開）', async () => {
    await seed(['battle_ranking', HOST], {
      uid: HOST,
      nickname: 'ホスト',
      photoURL: '',
      rating: 1500,
      wins: 0,
      losses: 0,
      draws: 0,
      lastRoomId: '',
      updatedAt: new Date(),
    });
    await assertSucceeds(getDoc(doc(guestCtx(), 'battle_ranking', HOST)));
  });
});

// ===================================================================
// battle_codes（合言葉 → 部屋ID）
// ===================================================================
describe('battle_codes — 合言葉', () => {
  function codePayload(over: Record<string, unknown> = {}) {
    return {
      roomId: ROOM,
      hostUid: HOST,
      subject: SUBJECT,
      createdAt: serverTimestamp(),
      ...over,
    };
  }

  it('ホストは自分の合言葉を作れる', async () => {
    await assertSucceeds(setDoc(doc(ctxFor(HOST), 'battle_codes', CODE), codePayload()));
  });

  it('★他人の名義（hostUid）では作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(GUEST), 'battle_codes', CODE), codePayload({ hostUid: HOST })),
    );
  });

  it('★合言葉の書式が違うと作れない（4桁の英大文字＋数字のみ）★', async () => {
    const db = ctxFor(HOST);
    await assertFails(setDoc(doc(db, 'battle_codes', 'ab2c'), codePayload())); // 小文字
    await assertFails(setDoc(doc(db, 'battle_codes', 'AB2'), codePayload())); // 3桁
    await assertFails(setDoc(doc(db, 'battle_codes', 'AB2CD'), codePayload())); // 5桁
    await assertFails(setDoc(doc(db, 'battle_codes', 'AB-C'), codePayload())); // 記号
  });

  it('★一覧取得はできない（全部屋の合言葉を吸い出せない）★', async () => {
    // list を許すと、総当たりせずに全部の合言葉が手に入る。
    await seed(['battle_codes', CODE], { ...codePayload(), createdAt: new Date() });
    await assertFails(getDocs(collection(ctxFor(GUEST), 'battle_codes')));
  });

  it('合言葉を知っていれば1件は読める（参加のため）', async () => {
    await seed(['battle_codes', CODE], { ...codePayload(), createdAt: new Date() });
    await assertSucceeds(getDoc(doc(ctxFor(GUEST), 'battle_codes', CODE)));
  });

  it('★書き換えはできない（合言葉の指す部屋をすり替えられない）★', async () => {
    await seed(['battle_codes', CODE], { ...codePayload(), createdAt: new Date() });
    await assertFails(updateDoc(doc(ctxFor(HOST), 'battle_codes', CODE), { roomId: 'other' }));
  });

  it('ホストは自分の合言葉を消せる（部屋を閉じたとき）', async () => {
    await seed(['battle_codes', CODE], { ...codePayload(), createdAt: new Date() });
    await assertFails(deleteDoc(doc(ctxFor(GUEST), 'battle_codes', CODE)));
    await assertSucceeds(deleteDoc(doc(ctxFor(HOST), 'battle_codes', CODE)));
  });
});

// ===================================================================
// battle_rooms — 作成
// ===================================================================
describe('battle_rooms — 部屋を作る', () => {
  it('自分をホストにした正しい部屋は作れる', async () => {
    await assertSucceeds(setDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), roomPayload()));
  });

  it('★他人をホストにした部屋は作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), roomPayload({ hostUid: HOST })),
    );
  });

  it('★ドキュメントIDと id フィールドが食い違う部屋は作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_rooms', 'other_id'), roomPayload({ id: ROOM })),
    );
  });

  it('★最初から status:"playing" では作れない（待機を飛ばせない）★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), roomPayload({ status: 'playing' })),
    );
  });

  it('★最初から currentIndex を進めた状態では作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), roomPayload({ currentIndex: 3 })),
    );
  });

  it('★出題数が上限（20問）を超える部屋は作れない★', async () => {
    const many = Array.from({ length: 21 }, (_, i) => `q${i}`);
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), roomPayload({ questionIds: many })),
    );
  });

  it('★出題が0問の部屋は作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), roomPayload({ questionIds: [] })),
    );
  });

  it('★点数設定を極端な値にした部屋は作れない★', async () => {
    // 1問1万点の部屋を作ってレートを稼ぐ経路を塞ぐ。
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_rooms', ROOM),
        roomPayload({
          rules: { questionCount: 5, pointsCorrect: 100000, pointsSpeedMax: 50, pointsStreak: 15 },
        }),
      ),
    );
  });

  it('★最初から回答が入った部屋は作れない（attest が空でない）★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_rooms', ROOM),
        roomPayload({ attest: { [HOST]: { score: 500 } } }),
      ),
    );
  });

  it('★想定外のフィールドを混ぜられない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), roomPayload({ junk: 'x'.repeat(10000) })),
    );
  });
});

// ===================================================================
// battle_rooms — 読み取り
// ===================================================================
describe('battle_rooms — 読み取り', () => {
  it('参加者は自分の部屋を読める', async () => {
    await seedPlayingRoom();
    await assertSucceeds(getDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM)));
    await assertSucceeds(getDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM)));
  });

  it('★関係ない第三者は部屋を読めない★', async () => {
    // 読めると、対戦中の他人の部屋から questionIds を抜いて
    // 正解を先に調べることができてしまう。
    await seedPlayingRoom();
    await assertFails(getDoc(doc(ctxFor(OUTSIDER), 'battle_rooms', ROOM)));
  });

  it('参加者は「自分が入っている待機中・対戦中の部屋」を検索できる（全国マッチの待ち受け）', async () => {
    await seedPlayingRoom();
    await assertSucceeds(getDocs(query(collection(ctxFor(GUEST), 'battle_rooms'),
      where('players', 'array-contains', GUEST), where('status', 'in', ['waiting', 'playing']))));
    // 他人の uid では検索できない
    await assertFails(getDocs(query(collection(ctxFor(OUTSIDER), 'battle_rooms'),
      where('players', 'array-contains', GUEST), where('status', 'in', ['waiting', 'playing']))));
  });

  it('★部屋の一覧取得はできない（全部屋を覗けない）★', async () => {
    await seedPlayingRoom();
    await assertFails(getDocs(collection(ctxFor(OUTSIDER), 'battle_rooms')));
  });

  // -----------------------------------------------------------------
  // ★本番で出た不具合の再発防止★
  //
  // 症状:
  //   フレンド対戦で合言葉を入れると
  //   「この操作は許可されていません。部屋がすでに閉じている可能性があります。」
  //
  // 原因:
  //   joinRoomByCode() は入室の update より先に、
  //   トランザクションの中で ★部屋を読む★（tx.get）。
  //   ところが読み取りは「players に入っている人だけ」だったので、
  //   これから入る人は必ず読めず、update に到達する前に
  //   permission-denied になっていた。
  //
  // なぜ 157 件のテストが緑だったのか:
  //   参加のテストが updateDoc だけを試していて、
  //   ★その手前の読み取りを誰も試していなかった★。
  //   本番と同じ順番（読む→書く）を再現するテストが無かった。
  //
  // ここでは「待機中で1人しか居ない部屋」＝これから入れる部屋に限り
  // 読めることを確かめる。進行中・決着済み・満員の部屋は読めないままである
  // （そちらは相手の解答が入っているので覗けてはいけない）。
  // -----------------------------------------------------------------
  it('★これから入る人は「待機中で1人だけの部屋」を読める（合言葉入室の前提）★', async () => {
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({ createdAt: new Date(), updatedAt: new Date() }),
    });
    await assertSucceeds(getDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM)));
  });

  it('★満員の待機部屋・進行中の部屋は、参加者以外は読めない★', async () => {
    // 待機中を読めるようにした副作用で、
    // 「2人揃った部屋」まで読めるようになっていないことを確認する。
    await seedPlayingRoom();
    await assertFails(getDoc(doc(ctxFor(OUTSIDER), 'battle_rooms', ROOM)));

    await seed(['battle_rooms', 'room_waiting_full'], {
      ...roomPayload({
        id: 'room_waiting_full',
        players: [HOST, GUEST],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    await assertFails(getDoc(doc(ctxFor(OUTSIDER), 'battle_rooms', 'room_waiting_full')));
  });

  it('★待機中でも、一覧で開いている部屋を漁ることはできない★', async () => {
    // get を緩めても list は緩めない。
    // list が通ると、合言葉を知らない人が
    // 「今開いている部屋」を全部見つけて割り込めてしまう。
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({ createdAt: new Date(), updatedAt: new Date() }),
    });
    await assertFails(getDocs(collection(ctxFor(OUTSIDER), 'battle_rooms')));
  });

  it('★未ログインは待機中の部屋も読めない★', async () => {
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({ createdAt: new Date(), updatedAt: new Date() }),
    });
    await assertFails(getDoc(doc(guestCtx(), 'battle_rooms', ROOM)));
  });
});

// ===================================================================
// battle_rooms — 参加
// ===================================================================
describe('battle_rooms — 参加する', () => {
  async function seedWaitingRoom() {
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({ createdAt: new Date(), updatedAt: new Date() }),
    });
  }

  it('待機中の部屋に2人目として入れる', async () => {
    await seedWaitingRoom();
    await assertSucceeds(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        players: [HOST, GUEST],
        profiles: {
          [HOST]: { uid: HOST, nickname: 'ホスト', photoURL: '', rating: 1500 },
          [GUEST]: { uid: GUEST, nickname: 'ゲスト', photoURL: '', rating: 1500 },
        },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★参加時にホストを追い出せない★', async () => {
    await seedWaitingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        players: [GUEST],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★参加時に3人目を足せない★', async () => {
    await seedWaitingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        players: [HOST, GUEST, OUTSIDER],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★参加と同時に問題を差し替えられない★', async () => {
    await seedWaitingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        players: [HOST, GUEST],
        questionIds: ['easy1', 'easy2', 'easy3', 'easy4', 'easy5'],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // -----------------------------------------------------------------
  // ★本番と同じ順番を通すテスト★
  //
  // これまでの参加テストは updateDoc だけを試していた。
  // しかし本番の joinRoomByCode() は
  //   ① battle_codes を get して部屋IDを引く
  //   ② トランザクションの中で部屋を get する
  //   ③ players / profiles / answers に自分を足して update する
  // という3段階で、★①②のどこかで落ちると③には届かない★。
  // 実際に②で落ちて「フレンド対戦が一切できない」状態になっていたのに、
  // ③だけを試すテストは緑のままだった。
  //
  // ここではクライアントと同じ順番・同じ内容で3段階すべてを実行する。
  // 以後、途中のどの段で権限が足りなくなっても、このテストが赤くなる。
  // -----------------------------------------------------------------
  it('★合言葉入室の全経路（コード引き→部屋を読む→自分を足す）が通る★', async () => {
    await seedWaitingRoom();
    await seed(['battle_codes', CODE], {
      roomId: ROOM,
      hostUid: HOST,
      subject: SUBJECT,
      createdAt: new Date(),
    });

    const db = ctxFor(GUEST);

    // ① 合言葉 → 部屋ID
    const codeSnap = await assertSucceeds(getDoc(doc(db, 'battle_codes', CODE)));
    expect(codeSnap.get('roomId')).toBe(ROOM);

    // ② 部屋を読む（★ここが本番で落ちていた段★）
    const roomSnap = await assertSucceeds(getDoc(doc(db, 'battle_rooms', ROOM)));
    const players = (roomSnap.get('players') as string[]) || [];
    const profiles = (roomSnap.get('profiles') as Record<string, unknown>) || {};
    const answers = (roomSnap.get('answers') as Record<string, unknown>) || {};
    expect(players).toEqual([HOST]);

    // ③ 自分を足す（クライアントが送るものと同じ形）
    await assertSucceeds(
      updateDoc(doc(db, 'battle_rooms', ROOM), {
        players: [...players, GUEST],
        profiles: {
          ...profiles,
          [GUEST]: { uid: GUEST, nickname: 'ゲスト', photoURL: '', rating: 1500 },
        },
        answers: { ...answers, [GUEST]: {} },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★満員の部屋には、読むところから入れない（3人目の割り込み防止）★', async () => {
    // 2人揃った部屋は読めない＝クライアントの tx.get が失敗する。
    // 「読めないので入れない」という形で3人目が弾かれることを確認する。
    await seed(['battle_rooms', 'room_full'], {
      ...roomPayload({
        id: 'room_full',
        players: [HOST, GUEST],
        profiles: {
          [HOST]: { uid: HOST, nickname: 'ホスト', photoURL: '', rating: 1500 },
          [GUEST]: { uid: GUEST, nickname: 'ゲスト', photoURL: '', rating: 1500 },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    await assertFails(getDoc(doc(ctxFor(OUTSIDER), 'battle_rooms', 'room_full')));
    await assertFails(
      updateDoc(doc(ctxFor(OUTSIDER), 'battle_rooms', 'room_full'), {
        players: [HOST, GUEST, OUTSIDER],
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

// ===================================================================
// battle_rooms — 対戦中の書き込み（ここが本番）
// ===================================================================
describe('battle_rooms — 対戦中', () => {
  it('自分の回答は書ける', async () => {
    // ★キーは `q{問題番号}`、中身は index/choice/panel/answeredAt の4点セット★
    //   この形以外は通らない（詳しい理由は tests/battle.exploit.test.ts）。
    //   ★seedPlayingRoom() の currentIndex は 1★ なので q1 に書く。
    //   「今出ている問題」以外には書けないので、ここを q0 にすると
    //   （先回り/後出しの防止が働いて）正しく拒否される。
    await seedPlayingRoom();
    await assertSucceeds(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        [`answers.${GUEST}.q1`]: {
          index: 1,
          choice: 2,
          panel: [],
          answeredAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★相手の回答は書けない★', async () => {
    // ここが通ると、相手の答えを不正解に書き換えて勝てる。
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        [`answers.${HOST}.q1`]: {
          index: 1,
          choice: 0,
          panel: [],
          answeredAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★相手の既存の回答を消せない★', async () => {
    await seedPlayingRoom({
      answers: {
        [HOST]: { 1: { choice: 2, answeredAt: new Date() } },
      },
    });
    await assertFails(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        answers: { [GUEST]: { 1: { choice: 1, answeredAt: serverTimestamp() } } },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★出題（questionIds）は対戦中も変えられない★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        questionIds: ['x1', 'x2', 'x3', 'x4', 'x5'],
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★点数設定（rules）は対戦中も変えられない★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        rules: { questionCount: 5, pointsCorrect: 999, pointsSpeedMax: 50, pointsStreak: 15 },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★教科は変えられない★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        subject: 'geography',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★currentIndex を戻せない（前の問題をやり直せない）★', async () => {
    // 戻せると、答えを見てから同じ問題を解き直せる。
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        currentIndex: 0,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('currentIndex は次に進められる', async () => {
    await seedPlayingRoom();
    await assertSucceeds(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        currentIndex: 2,
        deadlineAt: new Date(Date.now() + 20000),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★出題数を超える currentIndex にはできない★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        currentIndex: 99,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★締切を60秒より先に置けない（時間無制限にできない）★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        currentIndex: 2,
        deadlineAt: new Date(Date.now() + 10 * 60 * 1000),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★締切を過去に置けない（相手の時間を奪えない）★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        currentIndex: 2,
        deadlineAt: new Date(Date.now() - 5000),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★第三者は対戦中の部屋を書き換えられない★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(OUTSIDER), 'battle_rooms', ROOM), {
        currentIndex: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★updatedAt を偽装できない（サーバー時刻でなければ通らない）★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        currentIndex: 2,
        updatedAt: new Date(2020, 0, 1),
      }),
    );
  });
});

// ===================================================================
// battle_rooms — 状態の進み方
// ===================================================================
describe('battle_rooms — 状態遷移', () => {
  it('waiting → playing は進める', async () => {
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({
        players: [HOST, GUEST],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    await assertSucceeds(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        status: 'playing',
        deadlineAt: new Date(Date.now() + 20000),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // 2026-09-23 リスニングのオンライン対戦が開始できなかった不具合の再現と修正の確認。
  // 1問目の締切 = 制限時間55秒 + カウントダウン7.6秒 + 通信猶予0.7秒。
  it('★リスニング開始：旧実装の締切（63.3秒後）は拒否される★', async () => {
    await seed(['battle_rooms', ROOM], { ...roomPayload({ subject: 'english_listening', players: [HOST, GUEST], createdAt: new Date(), updatedAt: new Date() }) });
    await assertFails(updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
      status: 'playing', deadlineAt: new Date(Date.now() + 63300), updatedAt: serverTimestamp(),
    }));
  });
  it('リスニング開始：firstDeadlineSec で丸めた締切（57.8+0.7秒後）は通る', async () => {
    const { firstDeadlineSec } = await import('../src/battle/core/battleLive');
    await seed(['battle_rooms', ROOM], { ...roomPayload({ subject: 'english_listening', players: [HOST, GUEST], createdAt: new Date(), updatedAt: new Date() }) });
    await assertSucceeds(updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
      status: 'playing', deadlineAt: new Date(Date.now() + firstDeadlineSec(55) * 1000 + 700), updatedAt: serverTimestamp(),
    }));
  });

  it('playing → finished は進める', async () => {
    await seedPlayingRoom();
    await assertSucceeds(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        status: 'finished',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★finished → playing に戻せない（決着後にやり直せない）★', async () => {
    await seedPlayingRoom({ status: 'finished' });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        status: 'playing',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★playing → waiting に戻せない★', async () => {
    await seedPlayingRoom();
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM), {
        status: 'waiting',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('対戦中の中断（aborted）はできる', async () => {
    await seedPlayingRoom();
    await assertSucceeds(
      updateDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM), {
        status: 'aborted',
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

// ===================================================================
// battle_rooms — 削除
// ===================================================================
describe('battle_rooms — 削除', () => {
  it('ホストは待機中の部屋を消せる', async () => {
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({ createdAt: new Date(), updatedAt: new Date() }),
    });
    await assertSucceeds(deleteDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM)));
  });

  it('★対戦中の部屋は消せない（負けそうなときに証拠を消せない）★', async () => {
    await seedPlayingRoom();
    await assertFails(deleteDoc(doc(ctxFor(HOST), 'battle_rooms', ROOM)));
  });

  it('★ホストでない参加者は部屋を消せない★', async () => {
    await seed(['battle_rooms', ROOM], {
      ...roomPayload({
        players: [HOST, GUEST],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    await assertFails(deleteDoc(doc(ctxFor(GUEST), 'battle_rooms', ROOM)));
  });
});

// ===================================================================
// battle_queue（マッチング待ち）
// ===================================================================
describe('battle_queue — マッチング待ち行列', () => {
  function queuePayload(uid: string, over: Record<string, unknown> = {}) {
    return {
      uid,
      subject: SUBJECT,
      profile: { uid, nickname: 'だれか', photoURL: '', rating: 1500 },
      createdAt: serverTimestamp(),
      ...over,
    };
  }

  it('自分の券を作れる', async () => {
    await assertSucceeds(setDoc(doc(ctxFor(HOST), 'battle_queue', HOST), queuePayload(HOST)));
  });

  it('★他人の券は作れない（ドキュメントIDが uid に固定）★', async () => {
    await assertFails(setDoc(doc(ctxFor(GUEST), 'battle_queue', HOST), queuePayload(HOST)));
  });

  it('★profile.uid を他人にできない★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_queue', HOST),
        queuePayload(HOST, { profile: { uid: GUEST, nickname: 'x', photoURL: '', rating: 1500 } }),
      ),
    );
  });

  it('★レートを詐称した券は作れない（範囲外）★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_queue', HOST),
        queuePayload(HOST, {
          profile: { uid: HOST, nickname: 'x', photoURL: '', rating: 999999 },
        }),
      ),
    );
  });

  it('★想定外のフィールドを混ぜられない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_queue', HOST), queuePayload(HOST, { junk: 'x' })),
    );
  });

  it('相手の券は消せる（マッチング成立時に取り合いを解決するため）', async () => {
    // ★ここだけ緩い理由★
    // 相手を見つけた側が「相手の券を消す」ことで
    // 二重マッチングを防いでいる。券には点数もレートの変更力も無く、
    // 消されても再度並び直せるだけなので、
    // 消せることによる被害は「マッチングし直し」に限られる。
    await seed(['battle_queue', GUEST], { ...queuePayload(GUEST), createdAt: new Date() });
    await assertSucceeds(deleteDoc(doc(ctxFor(HOST), 'battle_queue', GUEST)));
  });

  it('★未ログインは券を消せない★', async () => {
    await seed(['battle_queue', GUEST], { ...queuePayload(GUEST), createdAt: new Date() });
    await assertFails(deleteDoc(doc(guestCtx(), 'battle_queue', GUEST)));
  });
});

// ===================================================================
// battle_ranking（レート）— 最重要
// ===================================================================
describe('battle_ranking — レート', () => {
  function rankPayload(uid: string, over: Record<string, unknown> = {}) {
    return {
      uid,
      nickname: 'ホスト',
      photoURL: '',
      rating: 1500,
      wins: 0,
      losses: 0,
      draws: 0,
      lastRoomId: '',
      updatedAt: serverTimestamp(),
      ...over,
    };
  }

  it('初期レート1500で作れる', async () => {
    await assertSucceeds(setDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), rankPayload(HOST)));
  });

  it('★初期レートを盛って作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), rankPayload(HOST, { rating: 2500 })),
    );
  });

  it('★勝ち数を持った状態で作れない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), rankPayload(HOST, { wins: 50 })),
    );
  });

  it('★他人のレートは作れない★', async () => {
    await assertFails(setDoc(doc(ctxFor(GUEST), 'battle_ranking', HOST), rankPayload(HOST)));
  });

  it('1試合ぶんの変動は反映できる', async () => {
    // ★実在する決着済みの部屋が必要★（ルールが get() で確かめる）
    await seedFinishedRoom();
    await seed(['battle_ranking', HOST], { ...rankPayload(HOST), updatedAt: new Date() });
    await assertSucceeds(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 1512,
        wins: 1,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★1回の書き込みで上限（60）を超えて上げられない★', async () => {
    // ここが通ると、1試合で3000まで上げられる。
    await seed(['battle_ranking', HOST], { ...rankPayload(HOST), updatedAt: new Date() });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 1800,
        wins: 1,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★1回の書き込みで上限を超えて下げられない（他人を狙って下げる経路も塞ぐ）★', async () => {
    await seed(['battle_ranking', HOST], { ...rankPayload(HOST), updatedAt: new Date() });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 900,
        losses: 1,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★勝ち数を1試合で2以上増やせない★', async () => {
    await seed(['battle_ranking', HOST], { ...rankPayload(HOST), updatedAt: new Date() });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 1512,
        wins: 10,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★負け数を減らせない（負けを消せない）★', async () => {
    await seed(['battle_ranking', HOST], {
      ...rankPayload(HOST, { losses: 5 }),
      updatedAt: new Date(),
    });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 1512,
        losses: 0,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★同じ試合を2回反映できない（lastRoomId が同じだと弾く）★', async () => {
    // 同じ試合の結果を連打してレートを盛る経路を塞ぐ。
    await seed(['battle_ranking', HOST], {
      ...rankPayload(HOST, { lastRoomId: ROOM, rating: 1512, wins: 1 }),
      updatedAt: new Date(),
    });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 1524,
        wins: 2,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('別の試合なら続けて反映できる', async () => {
    // 2試合ぶんの部屋を両方実在させる
    await seedFinishedRoom();
    await seedFinishedRoom('room_test_2');
    await seed(['battle_ranking', HOST], {
      ...rankPayload(HOST, { lastRoomId: ROOM, rating: 1512, wins: 1 }),
      updatedAt: new Date(),
    });
    await assertSucceeds(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', HOST), {
        rating: 1524,
        wins: 2,
        lastRoomId: 'room_test_2',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★他人のレートは書き換えられない★', async () => {
    await seed(['battle_ranking', GUEST], { ...rankPayload(GUEST), updatedAt: new Date() });
    await assertFails(
      updateDoc(doc(ctxFor(HOST), 'battle_ranking', GUEST), {
        rating: 800,
        losses: 1,
        lastRoomId: ROOM,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('★消せない（レートをリセットして作り直せない）★', async () => {
    await seed(['battle_ranking', HOST], { ...rankPayload(HOST), updatedAt: new Date() });
    await assertFails(deleteDoc(doc(ctxFor(HOST), 'battle_ranking', HOST)));
  });

  it('★長すぎるニックネームは弾く（公開データなので表示を壊さない）★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_ranking', HOST),
        rankPayload(HOST, { nickname: 'あ'.repeat(200) }),
      ),
    );
  });

  it('★想定外のフィールドを公開データに置けない★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_ranking', HOST),
        rankPayload(HOST, { junk: 'x'.repeat(50000) }),
      ),
    );
  });
});

// ===================================================================
// battle_history（自分の対戦履歴）
// ===================================================================
describe('battle_history — 対戦履歴', () => {
  function histPayload(uid: string, roomId: string, over: Record<string, unknown> = {}) {
    return {
      uid,
      roomId,
      subject: SUBJECT,
      outcome: 'win',
      myScore: 520,
      opponentScore: 410,
      opponentNickname: 'ゲスト',
      ratingBefore: 1500,
      ratingAfter: 1512,
      playedAt: serverTimestamp(),
      ...over,
    };
  }

  it('自分の履歴は書ける', async () => {
    // ★履歴も実在する自分の試合ぶんだけ書ける★
    await seedFinishedRoom();
    await assertSucceeds(
      setDoc(doc(ctxFor(HOST), 'battle_history', HOST, 'items', ROOM), histPayload(HOST, ROOM)),
    );
  });

  it('★他人の履歴は書けない★', async () => {
    await assertFails(
      setDoc(doc(ctxFor(GUEST), 'battle_history', HOST, 'items', ROOM), histPayload(HOST, ROOM)),
    );
  });

  it('★他人の履歴は読めない（誰と何回やったかは私的情報）★', async () => {
    await seedFinishedRoom();
    await seed(['battle_history', HOST, 'items', ROOM], {
      ...histPayload(HOST, ROOM),
      playedAt: new Date(),
    });
    await assertFails(getDoc(doc(ctxFor(GUEST), 'battle_history', HOST, 'items', ROOM)));
    await assertSucceeds(getDoc(doc(ctxFor(HOST), 'battle_history', HOST, 'items', ROOM)));
  });

  it('★ドキュメントIDと roomId が食い違う履歴は書けない★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_history', HOST, 'items', ROOM),
        histPayload(HOST, 'other_room'),
      ),
    );
  });

  it('★知らない outcome は書けない★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_history', HOST, 'items', ROOM),
        histPayload(HOST, ROOM, { outcome: 'perfect' }),
      ),
    );
  });

  it('★点数が範囲外の履歴は書けない★', async () => {
    await assertFails(
      setDoc(
        doc(ctxFor(HOST), 'battle_history', HOST, 'items', ROOM),
        histPayload(HOST, ROOM, { myScore: 99999999 }),
      ),
    );
  });

  it('自分の履歴は消せる（消してもレートは残る）', async () => {
    await seedFinishedRoom();
    await seed(['battle_history', HOST, 'items', ROOM], {
      ...histPayload(HOST, ROOM),
      playedAt: new Date(),
    });
    await assertSucceeds(deleteDoc(doc(ctxFor(HOST), 'battle_history', HOST, 'items', ROOM)));
  });
});

// ===================================================================
// 既存機能への影響が無いこと（回帰）
// ===================================================================
describe('既存のランキング（leaderboard_*）に影響していない', () => {
  it('★対戦のルールを足しても、既存の章ランキングは今までどおり書ける★', async () => {
    // 追記の貼り付け位置を間違えて既存ブロックを壊すと、
    // 学習量ランキングが動かなくなる。ここで気づけるようにする。
    const db = ctxFor(HOST);
    await assertSucceeds(
      // ★形は tests/leaderboard.rules.test.ts の chapterPayload と同じ★
      // コレクション名は leaderboard_chapter（単数）、
      // ドキュメントIDは `{chapterId}_{uid}`。
      // ここを勘違いすると、ルールが健全でも落ちるだけで
      // 「既存が壊れた」と誤読することになる。
      setDoc(doc(db, 'leaderboard_chapter', `c1_1_${HOST}`), {
        uid: HOST,
        nickname: '名無しの化学者',
        photoURL: '',
        chapterId: 'c1_1',
        bestScore: 850,
        correctRate: 0.85,
        totalCorrect: 17,
        totalQuestions: 20,
        timeUsedSec: 240,
        playedAt: serverTimestamp(),
      }),
    );
  });

  it('★既存ランキングは今までどおり誰でも読める★', async () => {
    await assertSucceeds(getDocs(collection(guestCtx(), 'leaderboard_chapter')));
  });

  it('★既存のフレンド機能（friend_codes）も壊れていない★', async () => {
    // battle_codes は friend_codes と同じ「list を禁止する」形にしてある。
    // 追記で既存の friend_codes ブロックを上書きしていないかを確認する。
    await assertFails(getDocs(collection(ctxFor(HOST), 'friend_codes')));
  });
});
