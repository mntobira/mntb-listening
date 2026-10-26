/**
 * firestore.rules のクラス機能（classrooms / class_assignments / answer_reasons）のテスト。
 * 2026-10-26 塾向け：英文法の追加・先生の一覧クエリ・plan を先生が変えられないこと・
 * 課題と選んだ理由は plan == 'juku' のクラスだけ、を確かめる。
 *
 * 実行: npm run test:rules（内部で Firestore エミュレータを起動する）
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

const TEACHER = 'uid_teacher';
const OTHER_TEACHER = 'uid_other_teacher';
const STUDENT = 'uid_student';
const OUTSIDER = 'uid_outsider';
const FREE_CLASS = 'class_free';
const JUKU_CLASS = 'class_juku';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mntb-classroom-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

function room(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    teacherUid: TEACHER,
    schoolName: 'まなとび塾',
    className: '高2英語',
    joinCode: id === JUKU_CLASS ? 'ACDEFG' : 'HJKMNP',
    subject: 'english_listening',
    joinOpen: true,
    memberCount: 0,
    ...extra,
  };
}

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'classrooms', FREE_CLASS), room(FREE_CLASS));
    await setDoc(doc(db, 'classrooms', JUKU_CLASS), room(JUKU_CLASS, { plan: 'juku' }));
    for (const c of [FREE_CLASS, JUKU_CLASS]) {
      await setDoc(doc(db, 'class_members', `${c}_${STUDENT}`), { classId: c, uid: STUDENT, displayName: 'たろう' });
    }
  });
});

const as = (uid: string) => testEnv.authenticatedContext(uid).firestore();

describe('classrooms', () => {
  it('英文法のクラスを作れる', async () => {
    await assertSucceeds(setDoc(doc(as(TEACHER), 'classrooms', 'c_g'), room('c_g', { subject: 'english_grammar', joinCode: 'QRSTWX' })));
  });

  it('知らない教科は作れない', async () => {
    await assertFails(setDoc(doc(as(TEACHER), 'classrooms', 'c_x'), room('c_x', { subject: 'math', joinCode: 'QRSTWX' })));
  });

  it("plan: 'free' なら作れる／'juku' では作れない", async () => {
    await assertSucceeds(setDoc(doc(as(TEACHER), 'classrooms', 'c_f'), room('c_f', { plan: 'free', joinCode: 'QRSTWX' })));
    await assertFails(setDoc(doc(as(TEACHER), 'classrooms', 'c_j'), room('c_j', { plan: 'juku', joinCode: 'YZ2345' })));
  });

  it('先生は plan を変えられない（free→juku も juku→free も）', async () => {
    await assertFails(updateDoc(doc(as(TEACHER), 'classrooms', FREE_CLASS), { plan: 'juku' }));
    await assertFails(updateDoc(doc(as(TEACHER), 'classrooms', JUKU_CLASS), { plan: 'free' }));
  });

  it('plan を変えない更新（受付の開閉）は今までどおりできる', async () => {
    await assertSucceeds(updateDoc(doc(as(TEACHER), 'classrooms', JUKU_CLASS), { joinOpen: false }));
    await assertSucceeds(updateDoc(doc(as(TEACHER), 'classrooms', FREE_CLASS), { joinOpen: false }));
  });

  it('先生は自分のクラス一覧を where で取れる', async () => {
    await assertSucceeds(getDocs(query(collection(as(TEACHER), 'classrooms'), where('teacherUid', '==', TEACHER))));
  });

  it('他人の teacherUid での一覧・全件の一覧はできない', async () => {
    await assertFails(getDocs(query(collection(as(OTHER_TEACHER), 'classrooms'), where('teacherUid', '==', TEACHER))));
    await assertFails(getDocs(collection(as(OTHER_TEACHER), 'classrooms')));
  });
});

function assignment(classId: string, extra: Record<string, unknown> = {}) {
  return {
    classId,
    teacherUid: TEACHER,
    title: '第1問A 週末課題',
    chapterIds: ['el1_A'],
    dueAt: Date.now() + 7 * 86_400_000,
    createdAt: serverTimestamp(),
    ...extra,
  };
}

describe('class_assignments', () => {
  it('塾クラスの担任は課題を作れる', async () => {
    await assertSucceeds(setDoc(doc(as(TEACHER), 'class_assignments', 'a1'), assignment(JUKU_CLASS)));
  });

  it('無料クラスでは作れない', async () => {
    await assertFails(setDoc(doc(as(TEACHER), 'class_assignments', 'a1'), assignment(FREE_CLASS)));
  });

  it('担任でない先生・生徒は作れない', async () => {
    await assertFails(setDoc(doc(as(OTHER_TEACHER), 'class_assignments', 'a1'), assignment(JUKU_CLASS, { teacherUid: OTHER_TEACHER })));
    await assertFails(setDoc(doc(as(STUDENT), 'class_assignments', 'a1'), assignment(JUKU_CLASS, { teacherUid: STUDENT })));
  });

  it('形の悪い課題は作れない（単元0・11個・余計なキー）', async () => {
    await assertFails(setDoc(doc(as(TEACHER), 'class_assignments', 'a1'), assignment(JUKU_CLASS, { chapterIds: [] })));
    await assertFails(setDoc(doc(as(TEACHER), 'class_assignments', 'a2'), assignment(JUKU_CLASS, { chapterIds: Array.from({ length: 11 }, (_, i) => `c${i}`) })));
    await assertFails(setDoc(doc(as(TEACHER), 'class_assignments', 'a3'), assignment(JUKU_CLASS, { done: true })));
  });

  it('担任と在籍生徒は一覧を読める／部外者は読めない', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'class_assignments', 'a1'), { ...assignment(JUKU_CLASS), createdAt: 1 });
    });
    const q = (uid: string) => getDocs(query(collection(as(uid), 'class_assignments'), where('classId', '==', JUKU_CLASS)));
    await assertSucceeds(q(TEACHER));
    await assertSucceeds(q(STUDENT));
    await assertFails(q(OUTSIDER));
  });

  it('書き換えはできず、消せるのは担任だけ', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'class_assignments', 'a1'), { ...assignment(JUKU_CLASS), createdAt: 1 });
    });
    await assertFails(updateDoc(doc(as(TEACHER), 'class_assignments', 'a1'), { title: '変更' }));
    await assertFails(deleteDoc(doc(as(STUDENT), 'class_assignments', 'a1')));
    await assertSucceeds(deleteDoc(doc(as(TEACHER), 'class_assignments', 'a1')));
  });
});

function reason(classId: string, extra: Record<string, unknown> = {}) {
  return {
    classId,
    uid: STUDENT,
    teacherUid: TEACHER,
    chapterId: 'el1_A',
    questionId: 'q_el1_A_set1',
    reason: '2回目で not until と聞こえたので',
    correct: false,
    updatedAt: serverTimestamp(),
    ...extra,
  };
}
const rid = (classId: string, uid = STUDENT) => `${classId}_${uid}_el1_A__q_el1_A_set1`;

describe('answer_reasons', () => {
  it('塾クラスの生徒は自分の理由を送れて、書き直せる', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS)));
    await assertSucceeds(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS, { reason: '書き直し' })));
  });

  it('無料クラスでは送れない', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'answer_reasons', rid(FREE_CLASS)), reason(FREE_CLASS)));
  });

  it('在籍していない人・他人になりすました理由は送れない', async () => {
    await assertFails(setDoc(doc(as(OUTSIDER), 'answer_reasons', rid(JUKU_CLASS, OUTSIDER)), reason(JUKU_CLASS, { uid: OUTSIDER })));
    await assertFails(setDoc(doc(as(OUTSIDER), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS)));
  });

  it('Q番号つきで送れる／範囲外の Q番号は送れない', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS, { qNo: 3 })));
    await assertFails(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS, { qNo: 0 })));
    await assertFails(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS, { qNo: '3' })));
  });

  it('ID と中身が食い違う・担任が違う・長すぎる理由は送れない', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'answer_reasons', `${FREE_CLASS}_${STUDENT}_x`), reason(JUKU_CLASS)));
    await assertFails(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS, { teacherUid: OTHER_TEACHER })));
    await assertFails(setDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS)), reason(JUKU_CLASS, { reason: 'あ'.repeat(201) })));
  });

  it('担任は塾クラスの理由を一覧できる／他の先生・部外者はできない', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'answer_reasons', rid(JUKU_CLASS)), { ...reason(JUKU_CLASS), updatedAt: 1 });
    });
    const q = (uid: string) => getDocs(query(collection(as(uid), 'answer_reasons'), where('classId', '==', JUKU_CLASS)));
    await assertSucceeds(q(TEACHER));
    await assertFails(q(OTHER_TEACHER));
    await assertFails(q(OUTSIDER));
  });

  it('無料クラスに残った理由は担任でも読めない', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'answer_reasons', rid(FREE_CLASS)), { ...reason(FREE_CLASS), updatedAt: 1 });
    });
    await assertFails(getDoc(doc(as(TEACHER), 'answer_reasons', rid(FREE_CLASS))));
  });

  it('本人は自分の理由を読めて、取り消せる。担任は消せない', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'answer_reasons', rid(JUKU_CLASS)), { ...reason(JUKU_CLASS), updatedAt: 1 });
    });
    await assertSucceeds(getDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS))));
    await assertFails(deleteDoc(doc(as(TEACHER), 'answer_reasons', rid(JUKU_CLASS))));
    await assertSucceeds(deleteDoc(doc(as(STUDENT), 'answer_reasons', rid(JUKU_CLASS))));
  });
});
