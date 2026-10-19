/**
 * 全国ランダムマッチの待機列（入る・抜ける・マッチ成立の購読）。
 * 2026-10-15 のリファクタリングで battle.ts（1,420行）から機能ごとに切り出した。中身は元のまま。
 * 依存の向き: battleShared ← battleTransport / battleRuleOverrides ← battleFriendRoom / battleMatchmaking ← battleRoomActions
 * 呼び出し側は従来どおり './battle'（再公開）から import してよい。
 */
import { blockedUidSet } from '../../features/safety/userSafety';
import { auth, db } from '../../firebase';
import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, runTransaction, serverTimestamp, setDoc, where } from '../../utils/firestoreMetered';
import type { Timestamp, Unsubscribe } from '../../utils/firestoreMetered';
import { arenaRule, nationalRoomMatches } from '../core/arenaRules';
import { RATING_INITIAL } from '../core/battleCore';
import { normalizeRule } from '../core/battleRules';
import { isStaleQueueTicket } from '../core/matchFallback';
import { serverNow, toMillis } from '../core/serverClock';
import type { BattlePlayer } from '../core/types';
import { COL_QUEUE, COL_ROOMS, drawQuestionIds, fetchMyRating, friendlyError, myProfile, requireUid } from './battleShared';
import { loadRuleSync } from './battleRuleOverrides';
import { logRejection } from '../../utils/reportError';

// ============================================================
// 全国ランダムマッチ（副次的な入口）
// ============================================================

/**
 * ランダムマッチ。
 *
 * ★仕組み★
 *   1. 自分と同じ教科で待っている人を1人探す
 *   2. 見つかったら、その人の待機票を消して部屋を作る（トランザクション）
 *   3. 見つからなければ自分の待機票を置いて待つ
 *
 * ★待機票を「消してから部屋を作る」順にする理由★
 * 逆にすると、2人が同時に相手を見つけて部屋を2つ作り、
 * 片方が誰も来ない部屋で待ち続ける。
 * 待機票の削除をトランザクションの成立条件にすれば、
 * 先に消せた側だけが部屋を作れる。
 */
/**
 * 待機列を「古い順」で取り出す。
 *
 * ★複合索引が無い／構築中でも動くようにする★
 * まず索引を使う速い形で試し、索引が無いと言われたときだけ
 * 索引の要らない形（等式1つだけ）で引き直して手元で並べ替える。
 *
 * 索引不足を表す Firestore のエラーコードは 'failed-precondition'。
 * ★それ以外のエラー（権限など）は握り潰さずに投げ直す★
 * ここで全部飲み込むと、別の原因の不具合が
 * 「なぜかマッチしない」に化けて原因が追えなくなる。
 */
async function fetchWaitingQueue(subject: string) {
  // ★条件は「教科が一致」の1つだけ★
  //
  //   以前は where('subject') + orderBy('createdAt') と書いていた。
  //   これは「等式 + 並べ替え」の組み合わせなので複合索引が必須で、
  //   索引を宣言していなかったため本番で
  //   「The query requires an index.」が出て全国対戦が動かなかった。
  //
  //   Firestore は ★条件が1つだけの検索なら索引を自動で作る★
  //   （単一フィールド索引。`==` も `array-contains` も対象）。
  //   手で用意しないといけないのは組み合わせた検索だけである。
  //   参考: https://firebase.google.com/docs/firestore/query-data/index-overview
  //
  //   そこで組み合わせをやめ、並べ替えは手元で行う形にした。
  //   これなら ★索引を一切デプロイしなくても動く★。
  //
  // ★「まず索引つきで試して、失敗したら retry」にしなかった理由★
  //   索引を作らない運用だと毎回1回目が必ず失敗するので、
  //   通信が毎回2往復になり、待ち時間とエラーログが無駄に増える。
  //   最初から索引の要らない形で投げるほうが速く、確実。
  //
  // ★手元で並べ替えても問題にならない理由★
  //   ここで扱うのは「今この教科で待っている人」だけ。
  //   同時に待つ人数はごく少数（多くて数人）なので、
  //   20件取って手元で並べても負荷にならない。
  const snap = await getDocs(
    query(collection(db, COL_QUEUE), where('subject', '==', subject), limit(QUEUE_SCAN_LIMIT)),
  );

  // ★古い待機票（画面を閉じた・電池が切れた人）は先に外し、ついでに片付ける★
  //   以前は「古い順に5件」を切り出してから古い票を除いていたので、
  //   放置された票が5件たまるだけで、新しく来た人どうしが一生マッチしなかった。
  //   この検索は順番を指定していない（索引を要らなくするため）ので、
  //   放置票が増えると新しい票が検索結果に入らなくなる。
  //   見つけた放置票は消しておく（ルール上だれでも消せる・消されても並び直せるだけ）。
  const nowMs = serverNow();
  const stale = snap.docs.filter((d) => isStaleQueueTicket(toMillis(d.get('createdAt') as Timestamp | null), nowMs));
  for (const d of stale.slice(0, 10)) void deleteDoc(d.ref).catch(logRejection('battle.queue.deleteStale'));

  // ★「古い順」に並べ直す★
  //   長く待っている人から先にマッチさせるため。
  //   ここを崩すと、後から来た人が先に対戦できてしまい、
  //   混雑時に待ち続ける人が出る。
  return snap.docs
    .filter((d) => !stale.includes(d))
    .sort((a, b) => {
      const at = toMillis(a.get('createdAt') as Timestamp | null) || 0;
      const bt = toMillis(b.get('createdAt') as Timestamp | null) || 0;
      return at - bt; // 古い順（待っている人が先）
    })
    .slice(0, 8);
}

/** 待機票を一度に見る件数（放置票が混ざっても新しい票が見えるだけの余裕） */
const QUEUE_SCAN_LIMIT = 50;
/** 1回の検索で拾いに行く相手の数（同時に大勢が同じ相手を取り合ったときの次善） */
const MATCH_ATTEMPTS = 3;

export async function findOrEnqueue(
  subject: string,
  sessionId = '',
  signal?: AbortSignal,
): Promise<{ roomId: string | null }> {
  const uid = requireUid();
  const rules = arenaRule(normalizeRule(subject, loadRuleSync(subject)));
  const queueSubject = `${subject}:speed2`;
  const rating = await fetchMyRating();
  signal?.throwIfAborted();

  // ===================================================================
  // ★手順：「先に自分の待機票を置く → 探す → 双方の票を1つの
  //   トランザクションで確認して消す → 部屋を作る」★
  // ===================================================================
  //
  // ■ 以前の手順（探す → いなければ置く）で起きていた不具合
  //   2人がほぼ同時に「相手をさがす」を押すと、
  //     A が探す（誰もいない）→ B が探す（誰もいない）
  //     → A が票を置く → B が票を置く
  //   となり、★両方が「拾われるのを待つ側」になって永遠に待つ★。
  //   独立検証（同時待機×5回）で再現した。
  //
  // ■ 今の手順で解決する理由
  //   先に票を置いてから探すので、上の順序でも
  //   B が探す時点で A の票が必ず見える。
  //   さらに部屋を作る側は「自分の票」と「相手の票」の★両方★を
  //   同じトランザクションで確認して消す。
  //   A と B が互いを同時に拾おうとしても、
  //   片方のトランザクションが先に票を消すので、もう片方は
  //   「票が無い」で失敗し、部屋は★ちょうど1つ★しかできない。
  //
  // ■ 索引について
  //   検索条件は「教科が一致」の1つだけ（fetchWaitingQueue）。
  //   等式1つなら Firestore が索引を自動で作るので、
  //   複合索引のデプロイは要らない。並べ替えは手元で行う。
  //
  // ■ 代償
  //   すぐ相手が見つかる場合にも、待機票の書き込みが1回発生する。
  //   （書き込み1回 ＝ 1試合あたりの書き込み約35回に対して無視できる）

  const roomRef = doc(collection(db, COL_ROOMS));
  const questionIds = await drawQuestionIds(subject, rules, roomRef.id);
  if (questionIds.length === 0) {
    throw new Error('この教科は対戦できる問題がまだ足りません。');
  }

  const ownRef = doc(db, COL_QUEUE, uid);
  signal?.throwIfAborted();
  if (auth.currentUser?.uid !== uid) throw new Error("ログイン状態が変わりました。");

  // 1. 先に自分の待機票を置く
  try {
    await setDoc(ownRef, {
      uid,
      subject: queueSubject,
      profile: { ...myProfile(rating), matchSessionId: sessionId },
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw friendlyError(error, '待機列に入れませんでした。');
  }

  if (signal?.aborted) { await leaveQueue(sessionId, uid); signal.throwIfAborted(); }

  // 2. 待っている人を探す（自分以外・同じ教科・古い順）
  let waitingDocs;
  try {
    waitingDocs = await fetchWaitingQueue(queueSubject);
  } catch (error) {
    // 探せなかったときは票だけ残さない（次に来た人が幽霊とマッチする）
    void leaveQueue(sessionId, uid);
    throw friendlyError(error, 'マッチングに失敗しました。');
  }
  // ブロックした相手とは組まない（App Store 1.2。端末のブロック一覧で判定）
  const blocked = blockedUidSet();
  // ★古い待機票（3分以上前）は相手にしない★
  //   画面を閉じた・電池が切れた人の票が残っていると、その人と部屋ができて試合が始まらない。
  //   相手の時刻はサーバー時刻なので、端末の時計ではなく serverNow() と比べる。
  const candidates = waitingDocs.filter((d) => d.id !== uid && !blocked.has(d.id));
  if (candidates.length === 0) {
    // 誰もいない。票を置いたまま、拾われるのを待つ（watchMatched）
    return { roomId: null };
  }

  // 3. 双方の票を同じトランザクションで確認・消費し、部屋を作る
  //   ★大勢が同時に探すと、全員がいちばん古い1人を取り合う★
  //   負けた人は「拾われるのを待つ」に回るが、相手が多いときは
  //   2番目・3番目の人を続けて試したほうが早く成立する。
  //   先頭の数人の中から順番をずらして試し、取り合いを分散させる。
  const head = candidates.slice(0, MATCH_ATTEMPTS);
  const offset = head.length > 1 ? Math.floor(Math.random() * Math.min(2, head.length)) : 0;
  const order = [...head.slice(offset), ...head.slice(0, offset)];
  for (const candidate of order) {
    signal?.throwIfAborted();
    const result = await tryMatchWith(candidate.id);
    if (result !== 'retry') return { roomId: result };
  }
  return { roomId: null };

  /** 1人の相手と部屋を作る。'retry' は「相手が先に取られた」なので次の人を試す */
  async function tryMatchWith(otherId: string): Promise<string | null | 'retry'> {
  const otherRef = doc(db, COL_QUEUE, otherId);
  try {
    let otherGone = false;
    const matched = await runTransaction(db, async (tx) => {
      otherGone = false;
      const mine = await tx.get(ownRef);
      const other = await tx.get(otherRef);
      // 自分の票が無い … 相手が先に自分を拾った（相手が部屋を作る）
      // 相手の票が無い … 別の誰かが先に相手を拾った
      // 教科が違う    … 票が差し替わっていた
      if (!mine.exists()) return false;
      if (!other.exists()) { otherGone = true; return false; }
      if (signal?.aborted || auth.currentUser?.uid !== uid) return false;
      if (mine.get('profile')?.matchSessionId !== sessionId) return false;
      if (mine.get('subject') !== queueSubject || other.get('subject') !== queueSubject) return false;

      const opponentUid = other.id;
      const opponentProfile = other.get('profile') as BattlePlayer | undefined;

      tx.delete(ownRef);
      tx.delete(otherRef);
      tx.set(roomRef, {
        id: roomRef.id,
        status: 'waiting',
        mode: 'random',
        subject,
        joinCode: '',
        hostUid: uid,
        players: [uid, opponentUid],
        profiles: {
          [uid]: { ...myProfile(rating), matchSessionId: sessionId },
          [opponentUid]: opponentProfile || {
            uid: opponentUid,
            nickname: '対戦相手',
            photoURL: '',
            rating: RATING_INITIAL,
          },
        },
        questionIds,
        rules,
        currentIndex: 0,
        deadlineAt: null,
        answers: { [uid]: {}, [opponentUid]: {} },
        attest: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    });

    // 拾えなかった場合、自分の票は（相手に拾われていなければ）残っているので
    // そのまま拾われるのを待つ。相手に拾われていれば watchMatched が部屋を見つける。
    if (matched) return roomRef.id;
    return otherGone ? 'retry' : null;
  } catch (error) {
    throw friendlyError(error, 'マッチングに失敗しました。');
  }
  }
}

/** 待機をやめる（画面を離れるときは必ず呼ぶ） */
export async function leaveQueue(sessionId?: string, uid = auth.currentUser?.uid): Promise<void> {
  if (!uid) return;
  try {
    const ref = doc(db, COL_QUEUE, uid);
    if (sessionId) await runTransaction(db, async tx => {
      const row = await tx.get(ref);
      if (row.exists() && row.get("profile")?.matchSessionId === sessionId) tx.delete(ref);
    });
    else await deleteDoc(ref);
  } catch {
    // 消せなくても致命的ではない（相手が拾った時に消える）
  }
}

/**
 * 待機中に「誰かが自分を拾って作った部屋」を待ち受ける。
 *
 * ★players に自分が入っている部屋を購読する★
 * 相手が部屋を作る側なので、自分は部屋IDを知らない。
 * array-contains で自分が含まれる待機中の部屋を購読する。
 *
 * ===================================================================
 * ★以前この関数が原因で「全国対戦が永遠にマッチしない」状態になった★
 * ===================================================================
 *
 * 元の実装は
 *     where('players','array-contains', uid)
 *   + where('status','==','waiting')
 *   + orderBy('createdAt','desc')
 * という組み合わせだった。これは Firestore の複合索引が必須で、
 * firestore.indexes.json が空だったため索引が存在せず、
 * 購読が failed-precondition で即座に落ちていた。
 *
 * さらに悪いことに、エラー側のコールバックが空
 *     () => { /* 待機画面を壊さない *\/ }
 * だったので、★画面には何も出ないまま黙って壊れた★。
 * 「エラーを出さない」ことが「不具合を隠す」ことになっていた。
 *
 * ■ 今回の直し方（2段構え）
 *
 *   1. 索引を firestore.indexes.json に宣言した（本筋の修正）
 *
 *   2. ★それでも索引に頼らない形に変えた★
 *      理由: 索引はデプロイして構築が終わるまで数分効かない。
 *            また将来ルールやクエリを触った人が索引の追加を
 *            忘れると、また同じ「黙って壊れる」に戻る。
 *      具体的には orderBy を外し、status の絞り込みも
 *      クライアント側で行う。array-contains の1条件だけなら
 *      ★単一フィールド索引（自動作成）で動く★ので、
 *      複合索引が無くても、構築中でも機能する。
 *      待機中の自分の部屋は多くて1〜2件なので、
 *      並べ替えと絞り込みを手元でやっても負荷にならない。
 *
 *   3. エラーを握り潰すのをやめ、呼び出し側に伝えられるようにした。
 *      画面を壊さない配慮は残しつつ、原因が分かるようにする。
 */
export function watchMatched(
  onMatched: (roomId: string) => void,
  onError?: (error: unknown) => void,
  expected?: { subject: string; sessionId: string },
): Unsubscribe {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  /**
   * ★まず「待機中・対戦中の部屋だけ」を購読し、索引が無いときだけ全件に落とす★
   *   array-contains だけだと、その人が今までに遊んだ ★すべての部屋★ を
   *   待機のたびに読み込む。100戦した人なら100件、1000戦なら1000件で、
   *   人が増えるほど読み取り回数と端末のメモリが膨らむ。
   *   status in [waiting, playing] を足すと複合索引（firestore.indexes.json に宣言済み）が要るので、
   *   索引が使えない（failed-precondition）ときだけ従来の購読に切り替える。
   *   購読は長く続くので、切り替えの1回分の失敗は負担にならない。
   */
  let current: Unsubscribe = () => {};
  let stopped = false;
  const subscribe = (narrow: boolean) => {
    current = onSnapshot(
    query(
      collection(db, COL_ROOMS),
      where('players', 'array-contains', uid),
      ...(narrow ? [where('status', 'in', ['waiting', 'playing'])] : []),
    ),
    (snap) => {
      // status と作成時刻の判定は手元で行う。
      const rooms = snap.docs
        .filter((d) => expected && nationalRoomMatches(d.data(), uid, expected.subject, expected.sessionId))
        .sort((a, b) => {
          const at = toMillis(a.get('createdAt') as Timestamp | null) || 0;
          const bt = toMillis(b.get('createdAt') as Timestamp | null) || 0;
          return bt - at; // 新しい順
        });
      const first = rooms[0];
      if (first) onMatched(first.id);
    },
    (error) => {
      if (narrow && (error as { code?: string })?.code === 'failed-precondition' && !stopped) {
        console.warn('[battle] 待機部屋の索引が使えないため、全件の購読に切り替えます');
        subscribe(false);
        return;
      }
      // 待機画面自体は壊さないが、★黙って捨てない★。
      // 以前ここが空だったため、索引不足に気付けなかった。
      console.error('[battle] 待機中の購読に失敗しました', error);
      onError?.(error);
    },
  );
  };
  subscribe(true);
  return () => { stopped = true; current(); };
}
