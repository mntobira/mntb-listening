/**
 * ===================================================================
 * 科目選択画面（＝アプリのタイトル画面）
 * ===================================================================
 * ログイン（オンボーディング）直後に最初に表示される画面。
 *
 * 役割は2つ:
 *  1. アプリの「顔」＝タイトル画面（ロゴ・キャッチコピー・世界観の提示）
 *  2. 学習する科目の選択（化学基礎／化学／英語リスニング／数学／生物基礎）
 *
 * 設計方針
 *  - Home.tsx と同じ淡いピンク基調（#D9466E / #E8688E / #FBE0E9 / #FDFBF7）と
 *    ノート罫線＋桜の世界観をそのまま引き継ぎ、「別アプリ感」を出さない。
 *  - 科目カードは「今すぐ入れる科目」と「準備中の科目」を一目で区別できるよう、
 *    色・影・カーソル・バッジ・aria-disabled を明確に変える。
 *  - 準備中の科目を押しても行き止まりにせず、
 *    「公開されたら知りたい」意思をフィードバック機能に接続して回収する。
 *
 * 1画面グリッドにした理由（カルーセルからの変更）
 *  - 以前は横スクロールのカルーセルだったが、科目が5つに増えると
 *    「隠れている科目」が生まれ、スワイプしないと全体が見えなかった。
 *  - 全科目を一望して選べることが科目選択画面の本質なので、
 *    **すべての科目カードが1つの画面に並ぶグリッド**に変更した。
 *  - スマホ＝1カラム（縦スクロール）、md以上＝2カラム、lg以上＝3カラム。
 *    カードは従来より少しコンパクトにし、1画面あたりの情報量を保つ。
 *  - カードはボタンなので Tab で順に到達できる。全カードのタップ領域は
 *    44px 以上を確保。
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Lock,
  Sparkles,
  BookOpen,
  FlaskConical,
  Headphones,
  Calculator,
  Leaf,
  PenLine,
  Globe2,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Microscope,
} from 'lucide-react';
import { auth } from '../firebase';
import { subjectTheme } from '../data/subjectTheme';
import { SakuraPetals } from './SakuraPetals';
import { NotebookScenery } from './NotebookScenery';
import { FeedbackModal } from './FeedbackModal';
import { GoogleLinkBanner } from './GoogleLinkBanner';
/*
 * ★この画面は教科データ本体を読まない（軽い索引だけを読む）★
 *
 * -------------------------------------------------------------------
 * ■ 直す前に何が起きていたか（実測）
 * -------------------------------------------------------------------
 * ここはオンボーディング直後に必ず出る「タイトル画面」だが、
 * 教科データから取っていたのは
 *
 *     「全29単元・演習174問」「配点100点・マーク37個」
 *
 * のような★数字だけ★で、問題文は1文字も表示していない。
 * それにも関わらず chemistryData / englishListeningData / mathData /
 * biologyBasicData / englishGrammarData / chemistryAdvancedData を
 * すべて静的 import していたため、依存グラフを機械的に辿ると
 *
 *     SubjectSelection.tsx が引き込む src/data
 *       … 47 ファイル / 2,578,344 バイト
 *
 * が読み込まれていた。★問題を増やすとこの数字がそのまま増える。★
 *
 * -------------------------------------------------------------------
 * ■ なぜ「画面を後から読み込む（lazy 化）」では解決しないか
 * -------------------------------------------------------------------
 * この画面は起動直後に出るので、後回しにできる相手がいない。
 * 必要なのは「この画面が読む量そのものを減らす」ことである。
 * ホーム画面（Home.tsx）に対して行ったのと同じ考え方。
 *
 * -------------------------------------------------------------------
 * ■ 表示は1文字も変えない
 * -------------------------------------------------------------------
 * 索引の数字は生成時に★本物の集計関数をそのまま呼んで★埋め込んだもので、
 * tests/chapterIndex.test.ts が実行時にも本物と1フィールドずつ
 * 突き合わせている。したがってカードに出る文言は完全に同一である。
 *
 * -------------------------------------------------------------------
 * ■ ★型は必ず `import type` と書くこと★
 * -------------------------------------------------------------------
 * `import { type SubjectKey } from '../data/allChapters'` と書くと、
 * 型しか使っていなくてもモジュールの解決自体は行われ、
 * バンドラは allChapters →（6教科ぶんの教科データ）を
 * 起動時の読み込みに含めてしまう。
 * ホーム画面ではこの書き方のせいで、索引に切り替えたのに
 * 51ファイル・約2.66MB が読み込まれ続けていた（実測）。
 * 型だけの文（`import type { ... }`）にすれば完全に消える。
 */
// 索引から使うのは各教科の集計（章数・問題数）だけ。
// 以前は SUBJECT_INDEX も取り込んで、このファイルの中で
// 教科名の対応表を組み立てていたが、その組み立ては
// data/subjectLabels.ts へ移したのでもう要らない。
// 使っていない import を残すと「この画面は索引の一覧も見ている」と
// 読み違えられるため、消してある。
import { getSubjectStats } from '../data/chapterIndex.generated';
import type { SubjectKey } from '../data/allChapters';
// 教科名の対応表は data/subjectLabels.ts が唯一の出どころ。
// 下で再公開しているが、再エクスポート文は同じファイルの中から参照できないので、
// このファイル内の判定（isSubjectId）で使うぶんを値としても取り込む。
import { SUBJECT_LABELS as SUBJECT_LABELS_FOR_CHECK } from '../data/subjectLabels';
// ユーザーごとの localStorage キー名は utils/userStorageKeys.ts が唯一の定義
import { profileKey } from '../utils/userStorageKeys';
// 公開/非公開の判断は src/config/features.ts が唯一の出どころ。
// ★ここは「4箇所」のうちの2番目（トップのカード）★
// 残りはナビ／ルーティング／一覧で、すべて同じ関数を見る。
import { isSubjectEnabled } from '../config/features';
// 高校入試 理科（本体に教科データを持たない教科）の表示名・配色・単元一覧。
// ★何も import しない葉★なので、この画面の起動時の重さは増えない
// （tests/screenDataWeight.test.ts の予算内）。
import { externalSubjectOf } from '../data/externalSubjects';

/**
 * アプリが扱う科目の識別子。
 *
 * 実体は data/allChapters.ts の SubjectKey（アプリ全体で唯一の定義）。
 * ここでは今までどおり SubjectId という名前でも使えるように別名を置いている。
 */
export type SubjectId = SubjectKey;

/**
 * 科目ID → 画面に出す科目名（App 側のバッジ表示などでも使う）。
 *
 * ★実体は data/subjectLabels.ts。ここは再公開しているだけ。★
 *
 * 以前はこのファイルの中で
 *     Object.fromEntries(SUBJECT_INDEX.map((s) => [s.id, s.label]))
 * を組み立てていたが、まったく同じ3行が data/chapterCatalog.ts にもあり、
 * 「教科名の唯一の定義」が2つ存在する状態だった。
 * 今は値が一致するが、片方の組み立て方だけを将来変えたときに
 * 画面ごとに違う教科名が出て、しかもどちらが正しいか分からなくなる。
 * そこで組み立てを subjectLabels.ts 1本に寄せた。
 *
 * 出どころは変わっていない：索引の id / label は教科データの
 * SUBJECTS から自動生成したもので、一致は
 * tests/chapterIndex.test.ts が検査している。
 * （教科名を引くためだけに 2.5MB の教科データを読む必要はない、というのが理由）
 */
export { SUBJECT_LABELS } from '../data/subjectLabels';

/**
 * 未知の値が入っていても安全に科目名を引く。
 *
 * 中身は subjectLabels.ts の labelOfSubject と同一の処理だったので、
 * そちらへ寄せた（既定を化学基礎にする振る舞いも従来どおり）。
 * この名前（getSubjectLabel）は App.tsx などが使っているため残す。
 */
export { labelOfSubject as getSubjectLabel } from '../data/subjectLabels';

/**
 * 保存済みの科目ID が今の定義に存在するか。
 *
 * 判定に使う表は上で再公開しているものと同一の実体
 * （再エクスポート文は同じファイルの中からは参照できないため、
 *   ここでは値としても取り込んでいる）。
 */
export function isSubjectId(value: string | null | undefined): value is SubjectId {
  return Boolean(value && value in SUBJECT_LABELS_FOR_CHECK);
}

interface SubjectDefinition {
  id: SubjectId;
  /** カードの主タイトル */
  title: string;
  /** 主タイトルの下に出す英字（デザイン用の添え字） */
  latin: string;
  /** 1行の説明 */
  description: string;
  /** カード内に並べる収録内容のハイライト */
  highlights: string[];
  /**
   * ★スマホのカードで科目名の真下に出す「収録ボリュームの短い表記」★
   *
   * highlights[0] を流用してはいけない。
   * highlights[0] は「第1問A〜第6問Bの全9単元を本試験順で収録（問題は順次追加中）」
   * のような説明文で、スマホの狭い1行（truncate）に入れると
   * 実測で 320〜430px の全幅で文字が切れてしまい、
   * 肝心の数字が読めなくなっていた（＝情報が消える）。
   * そこで科目ごとに「切れない長さ」を手で決めて持たせる。
   * ★科目ごとに手で書く★のがポイントで、
   * 機械的に文字数で切ると意味の途中で切れて逆に読めなくなる。
   */
  volume: string;
  /** 選択できるか（false なら「準備中」表示） */
  available: boolean;
  /** カードのアイコン */
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

interface SubjectSelectionProps {
  /** 科目を選んだとき */
  onSelectSubject: (subject: SubjectId) => void;
  currentSubject?: SubjectId;
  backLabel?: string;
  /** ゲスト利用中かどうか（挨拶の出し分けに使う） */
  isGuest: boolean;
  /**
   * ホームから「学習を始める」で来たときだけ渡される。
   * オンボーディング直後（＝戻る先が無い）ときは undefined のままにして、
   * 行き止まりにならないよう戻るボタン自体を出さない。
   */
  onBack?: () => void;
  /**
   * 高校入試 理科（演習・まとめ・出題傾向）を開く。
   *
   * ★スマホ（md 未満）でだけカードを出す★
   * 利用者の指示：「高校入試理科（これここじゃなくて科目に追加して）」
   * （スマホ版のホームを 1 画面に収める依頼の一部。PC 版は除く）。
   *
   * 理科は本体の章→大問→小問の形を持たないので onSelectSubject には
   * 乗せられない（SubjectId ではない）。押したら理科の画面へ直接飛ぶ。
   * PC（md 以上）では従来どおりホームのカードから入るので、
   * ここでは描かない。FEATURES.rika が false のときは渡されない
   * （渡されなければカード自体を描かない）。
   */
  onRika?: () => void;
}

export function SubjectSelection({ onSelectSubject, isGuest, onBack, onRika, currentSubject, backLabel = 'ホームに戻る' }: SubjectSelectionProps) {
  /** 高校入試 理科の表示名・単元一覧（登録簿から。無ければカードを出さない） */
  const rika = useMemo(() => externalSubjectOf('rika'), []);
  /**
   * 「公開されたら知らせて」モーダルで、どの科目が押されたかを覚えておく。
   * 以前は文面が「化学」固定だったため、科目が増えると誤った案内になってしまう。
   */
  const [notifySubject, setNotifySubject] = useState<SubjectDefinition | null>(null);

  /** 表示名（プロフィール → Firebase 表示名 → ゲスト の順で解決） */
  const displayName = useMemo(() => {
    try {
      const uid = auth.currentUser?.uid || 'guest';
      const raw = localStorage.getItem(profileKey(uid));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.name) return String(parsed.name);
      }
    } catch {
      /* localStorage が使えない環境は表示名なしで続行 */
    }
    return auth.currentUser?.displayName || (isGuest ? 'ゲスト' : 'ユーザー');
  }, [isGuest]);

  /*
   * 各教科の収録ボリューム（カードに出す数字）。
   *
   * ★数字は今までと同一★
   *   もとはここで教科データ本体を読み、その場で数え直していた
   *   （chemistryData.parts.flatMap(...) → countProblemsInChapters、
   *     getListeningStats() など）。
   *   いまは同じ計算を★生成時に済ませた索引★から読む。
   *   索引は本物の集計関数を呼んで作っており、
   *   tests/chapterIndex.test.ts が実行時にも本物と突き合わせるので、
   *   表示される数字は完全に同じである。
   *
   * useMemo を外していないのは、呼び出し側（subjects の useMemo）の
   * 依存配列をそのまま保つため。ここを素の定数にすると
   * 依存配列の中身が変わり、無関係な差分が増える。
   */
  /** 化学基礎の収録ボリューム */
  const basicStats = useMemo(() => getSubjectStats('chemistry_basic'), []);

  /** 化学（発展）の収録ボリューム。問題は順次追加するため、単元数だけ先に表示する。 */
  const advancedStats = useMemo(() => getSubjectStats('chemistry'), []);

  /**
   * 英語リスニングの収録ボリューム。
   * 化学（発展）と同じやり方で、まずは大問（単元）だけを公開し、
   * 問題は順次追加していく。
   */
  const listeningStats = useMemo(() => getSubjectStats('english_listening'), []);

  /** 数学の収録ボリューム。まずは数III積分（全パターン演習）から公開する。 */
  const mathStats = useMemo(() => getSubjectStats('math'), []);

  /** 生物基礎の収録ボリューム。共通テスト全範囲を 5 章で網羅する。 */
  const biologyStats = useMemo(() => getSubjectStats('biology_basic'), []);

  /** 英文法の収録ボリューム。単元別に 4 択演習を置いている。 */
  const grammarStats = useMemo(() => getSubjectStats('english_grammar'), []);

  /**
   * 地理総合・地理探究の収録ボリューム。
   * リスニングと同じく「大問（第1問）→ 回」の2階層で、
   * 1単元＝1回（大問1つ）を抱える。
   *
   * ★表示に使うのは marks（設問数）★
   *   この科目の questions は「大問の数＝回数」なので、
   *   生徒が実際に解く問数としては marks（subQuestions の合計）を見る。
   *   chapters * 5 のような掛け算はしない（設問数が5問でない回を
   *   足した瞬間に表示が嘘になる）。
   */
  const geographyStats = useMemo(() => getSubjectStats('geography'), []);

  const subjects: SubjectDefinition[] = useMemo(() => [
    {
      id: 'chemistry_basic',
      title: '化学基礎',
      latin: 'Basic Chemistry',
      description: '共通テスト「化学基礎」を、教科書の順番どおりに完全網羅。',
      highlights: [
        `全${basicStats.chapters}単元・演習${basicStats.questions}問を収録`,
        '出題傾向データ（2016〜2026年）に完全対応',
        'ロジックツリー・模擬試験・復習リスト対応',
      ],
      // 「全29単元・演習174問」＝数字が2つ入る最も短い形
      volume: `全${basicStats.chapters}単元・演習${basicStats.questions}問`,
      available: true,
      icon: BookOpen,
    },
    {
      id: 'chemistry',
      title: '化学',
      latin: 'Chemistry',
      description: '理論・無機・有機を、教科書の順番どおりに配置。単元から選んで学習できます。',
      highlights: [
        `全${advancedStats.chapters}単元を教科書順で収録（問題は順次追加中）`,
        '理論化学・無機化学・有機化学を分野別に選択',
        '化学基礎と同じ単元画面・同じ演習の進め方',
      ],
      // 化学は問題を順次追加中なので問題数は出さず、単元数＋状態だけにする
      volume: `全${advancedStats.chapters}単元・問題は追加中`,
      available: true,
      icon: FlaskConical,
    },
    {
      id: 'english_listening',
      title: '英語リスニング',
      latin: 'English Listening',
      description: '共通テスト「英語リスニング」を、本試験と同じ大問の並びで配置。',
      highlights: [
        `第1問A〜第6問Bの全${listeningStats.units}単元を本試験順で収録（問題は順次追加中）`,
        `配点${listeningStats.points}点・マーク${listeningStats.marks}個の大問構成に対応`,
        '化学と同じ単元画面・同じ演習の進め方',
      ],
      // 「第1問A〜第6問Bの…本試験順で収録（問題は順次追加中）」は長すぎて切れるため、
      // 単元数とマーク数という「選ぶ判断に効く数字」だけを残す
      volume: `全${listeningStats.units}単元・マーク${listeningStats.marks}個`,
      available: true,
      icon: Headphones,
    },
    {
      id: 'math',
      title: '数学',
      latin: 'Mathematics',
      description: '積分・ベクトル・確率・整数の4単元を全パターン網羅。見た瞬間に解法が浮かぶ状態を作ります。',
      highlights: [
        `全${mathStats.chapters}章・演習${mathStats.questions}問を収録（順次追加中）`,
        '単元ごとの判断フロー＋型の早見表つきまとめプリント',
        '数学記号パレットで ∫・√・π もワンタップ入力',
      ],
      volume: `全${mathStats.chapters}章・演習${mathStats.questions}問`,
      available: true,
      icon: Calculator,
    },
    {
      id: 'biology_basic',
      title: '生物基礎',
      latin: 'Basic Biology',
      description: '共通テスト「生物基礎」の全範囲を5章で網羅。まとめプリント＋演習で仕上げます。',
      highlights: [
        `全${biologyStats.chapters}章・演習${biologyStats.questions}問を収録（順次追加中）`,
        '細胞・遺伝子・体内環境・植生・生態系を完全カバー',
        '化学基礎と同じ単元画面・同じ演習の進め方',
      ],
      volume: `全${biologyStats.chapters}章・演習${biologyStats.questions}問`,
      available: true,
      icon: Leaf,
    },
    {
      id: 'english_grammar',
      title: '英文法',
      latin: 'English Grammar',
      description: '文型から会話表現までを単元別に網羅。ネクステージ型の4択演習で固めます。',
      highlights: [
        `全${grammarStats.chapters}単元・4択${grammarStats.marks}問を収録`,
        '文法の幹→語法→会話表現の順で積み上げ',
        '全問に完成文の音源・和訳・語句・誤答肢の理由つき',
      ],
      volume: `全${grammarStats.chapters}単元・4択${grammarStats.marks}問`,
      available: true,
      icon: PenLine,
    },
    {
      id: 'geography',
      title: '地理総合・地理探究',
      latin: 'Geography',
      description: '会話文と資料を行き来して考える、共通テスト型の大問を単元ごとに演習します。',
      highlights: [
        // ★「第1問全○回」と書いてはいけない★
        //   模擬問題（第1回〜第6回＋予想問題）を入れて第1問・第2問・第3問が
        //   揃ったので、第1問だけの科目ではなくなった。また chapters は
        //   「回数」ではなく「単元数（= 大問の数）」なので、
        //   「全26回」と書くと回数を26回だと誤解させてしまう。
        `第1問〜第3問・全${geographyStats.chapters}単元／設問${geographyStats.marks}問を収録（順次追加中）`,
        '気候グラフ・人口ピラミッド・地形図・統計表の読み取り',
        '全問に「誤答肢のなぜ違うか」まで入った詳しい解説つき',
      ],
      volume: `全${geographyStats.chapters}単元・設問${geographyStats.marks}問`,
      available: true,
      icon: Globe2,
    },
  ], [basicStats, advancedStats, listeningStats, mathStats, biologyStats, grammarStats, geographyStats]);

  /**
   * ★実際に画面へ出す科目（非公開のものはカードごと作らない）★
   *
   * ■ なぜ「グレーで出す」ではなく「消す」なのか
   *   この画面には元々 available:false 用の見せ方（グレー＋
   *   「公開のお知らせを受け取る」）がある。準備中を予告したい科目には
   *   それが適している。
   *   一方 features.ts で false にしたものは
   *   ★「作りかけを見せたくない」ものなので、存在自体を出さない。★
   *   予告として出すと「いつ出るの」という期待だけが残り、
   *   採点が直るまで答えられない。
   *
   * ■ ここで絞るだけでは不十分
   *   カードを消しても、保存済みの選択が復元されれば中に入れてしまう。
   *   その穴はルーティング側（App.tsx）で塞いでいる。
   *   ★片方だけでは意味がない。★
   */
  const visibleSubjects = useMemo(
    () => subjects.filter((subject) => isSubjectEnabled(subject.id)),
    [subjects],
  );

  return (
    /* Home と同じ理由で min-h-[100dvh] → h-full。
       App 側で確定した 100dvh を受け取り、子のスクロール領域に上限を渡す。 */
    <div className="mtb-page subject-library w-full h-full min-h-0 flex flex-col relative overflow-hidden rounded-none sm:rounded-[32px] bg-gradient-to-b from-[#FFF1F5] via-[#FDFBF7] to-[#F8E7EE]">

      {/* ===== 背景（Home と同じ世界観：ノート罫線＋風景＋桜） ===== */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: 'linear-gradient(transparent calc(2.5rem - 1px), #F0C7D2 calc(2.5rem - 1px))',
          backgroundSize: '100% 2.5rem',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 pointer-events-none opacity-5 fabric-texture" aria-hidden="true" />
      <NotebookScenery />
      <SakuraPetals count={18} />

      {/* ===== ホームへ戻る（ホームの「学習を始める」から来たときだけ） =====
          オンボーディング直後は戻る先が無いので表示しない。 */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 z-30 flex items-center gap-1.5 rounded-full border border-[#F4A9C4]/70 bg-white/95 px-3.5 py-2 text-[12px] font-bold text-[#D9466E] shadow-[0_8px_20px_-10px_rgba(217,70,110,0.5)] backdrop-blur-sm transition-all hover:bg-white hover:border-[#E8688E] active:scale-95 min-h-[44px] cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="font-modern">{backLabel}</span>
        </button>
      )}

      {/* ★min-h-0 が今回の修正の要★
          これが無いと flex-1 が効かず（flex の子は既定で min-height:auto）、
          中身 1780px ぶんに伸びてスクロールしない箱になっていた。
          結果ページ全体がスクロールし、最後の「この科目ではじめる」が
          ブラウザ下部ツールバーの裏に潜り込んでいた（ご指摘の症状）。

          この画面には下部ナビが出ない（App 側で除外）ので、
          末尾の余白はナビぶんではなく端末の安全領域だけで足りる。
          pb-32（128px）は過剰だったため pb-safe に置き換える。

          上パディングも詰める（pt-10→pt-5）。ロゴの上の空白は
          1画面に収める上で最も削りやすい場所。 */}
      <div className="subject-library-scroll flex-1 min-h-0 overflow-y-auto no-scrollbar pb-safe px-5 sm:px-8 md:px-12 pt-3 sm:pt-10 md:pt-14 relative z-10 flex flex-col">

        <header className="subject-library-heading">
          <p className="mtb-kicker">MY BOOKSHELF</p>
          <h1>学びの本棚</h1>
          <p>{currentSubject ? `現在の科目：${SUBJECT_LABELS_FOR_CHECK[currentSubject]}。変更する科目を選んでください。` : '科目を選んで、学びのつづきへ。'}</p>
          <span className="subject-library-note"><BookOpen size={14} aria-hidden="true" /> 演習・まとめで、対戦の力をつけよう</span>
        </header>

        {/* ===== Googleアカウント連携のおすすめ（ゲスト利用中のみ） =====

            ★スマホではこの画面には出さない★
            バナーは本体 34px＋下余白 28px で合計 62px を使う。
            同じバナーはホーム画面（Home.tsx）にも置いてあり、
            スマホの利用者は必ずホームを経由してここに来るので
            情報が届かなくなることはない。
            一方この画面では「6 科目を一望できる」ことが目的なので、
            62px をカードに回す方が利用者の得になる。
            sm 以上では従来どおり表示する（PC の見た目は不変）。

            ★★実装上の重要な注意★★
            当初は <div className="hidden sm:block"> でバナーを「包んで」隠したが、
            それは PC の見た目を壊した。理由は、この pane が `flex flex-col` であり、
            バナー本体（motion.section）が pane の【直接の子】として
            flex アイテムになって縮んでいた（実測 34px）ことによる。
            div で包むと flex アイテムが div に変わり、中の section は
            通常のブロックとして本来の高さ（実測 187px）に伸びてしまう。
            → 結果として PC でグリッドが 124px 下へずれた。
            そこで包まずに className を直接渡す。こうすれば DOM 構造は
            main と完全に同一のまま、スマホでだけ display:none になる。 */}
        {isGuest && <GoogleLinkBanner className="hidden sm:block" />}

        {/* ===== 科目カード（1画面グリッド：全科目を一望して選ぶ） =====
            スマホ＝1カラム／md＝2カラム／lg＝3カラム。
            カルーセルと違い、隠れている科目が無い。 */}
        <div className="relative max-w-6xl w-full mx-auto">
          <div
            role="group"
            aria-label="学習する科目を選択"
            /* スマホのカード間隔を詰める（gap-4=16px → gap-1=4px）。
               ★科目が6枚になったので 8px → 4px にさらに詰めている★
               5つの隙間で 20px の節約。カードは白背景＋枠線で区切られており、
               4px でも隣接カードとの境目は視覚的に十分わかる。
               なお sm 以上は従来と同じ gap-2 に戻してあるので、
               タブレット・PC の見た目は一切変わらない。 */
            className="subject-bookshelf grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 md:gap-5"
          >
          {visibleSubjects.map((subject, index) => {
            const Icon = subject.icon;
            const isCurrent = subject.id === currentSubject;
            const handleClick = () => {
              if (subject.available) onSelectSubject(subject.id);
              else setNotifySubject(subject);
            };

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + index * 0.07 }}
                data-subject-card
                data-subject-id={subject.id}
                className="w-full"
              >
                <button
                  onClick={handleClick}
                  data-subject-book
                  style={{ '--subject-accent': subjectTheme(subject.id).accent, '--subject-soft': subjectTheme(subject.id).accentSoft } as React.CSSProperties}
                  aria-current={isCurrent ? 'true' : undefined}
                  aria-label={
                    subject.available
                      ? (isCurrent ? `${subject.title}（現在の科目）で続ける` : `${subject.title}を学習する`)
                      : `${subject.title}は準備中です。公開のお知らせを希望する`
                  }
                  /*
                    ★スマホだけ「1行カード」に圧縮する（PC は一切変更なし）★

                    科目カードは5枚ある。従来の縦積みカード（min-h 210px）だと
                    カードだけで実測 1396px、画面全体で 1780px あり、
                    見える高さ（約664px）にはどう詰めても収まらない。

                    そこでスマホでは
                      [アイコン][科目名／収録ボリューム] … [→]
                    の横1行に圧縮する。説明文と収録ハイライトの2〜3行目は
                    sm 以上でのみ表示（下の sm:block 参照）。
                    min-h は sm 以上でだけ 210px を復活させるので、
                    タブレット・PC の見た目は従来と同一。
                  */
                  className={`group relative w-full h-full text-left rounded-[22px] p-2 sm:p-5 md:p-6 border transition-all duration-200 overflow-hidden sm:min-h-[210px] flex flex-col ${
                    subject.available
                      ? 'bg-white/92 backdrop-blur-sm border-[#F4A9C4]/55 shadow-[0_16px_38px_-18px_rgba(217,70,110,0.55)] hover:border-[#E8688E] hover:shadow-[0_22px_46px_-18px_rgba(217,70,110,0.62)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.995]'
                      : 'bg-[#F7F5F3]/85 backdrop-blur-sm border-[#D7DDE3]/70 shadow-none hover:border-[#B8C4CE] hover:bg-[#F2F0EE]/90'
                  } ${isCurrent ? 'ring-2 ring-[#D9466E]/70 ring-offset-1 ring-offset-white' : ''}`}
                >
                  {/* 利用可能カードだけ、上端にアクセントの帯を引く */}
                  {subject.available && (
                    <span
                      className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#E8688E] via-[#D9466E] to-[#E89AAF]"
                      aria-hidden="true"
                    />
                  )}

                  {/* 右上のステータスバッジ */}
                  <span
                    /* スマホでは非表示。1行カードでは絶対配置のバッジが
                       科目名に重なってしまうため。全科目が「公開中」の今、
                       スマホでこのバッジが伝える情報量は小さい。 */
                    className={`hidden sm:inline-flex absolute top-4 right-4 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold font-modern tracking-wider ${
                      subject.available
                        ? 'bg-[#FBE0E9] text-[#D9466E]'
                        : 'bg-[#E4E8EC] text-[#8895A0]'
                    }`}
                  >
                    {subject.available
                      ? (<><Sparkles className="w-3 h-3" aria-hidden="true" />公開中</>)
                      : (<><Lock className="w-3 h-3" aria-hidden="true" />準備中</>)}
                  </span>

                  {/* アイコン＋タイトル（横並びにして縦方向を節約する）
                      スマホでは下の余白(mb)を詰め、右端に矢印を出して
                      「このカードを押すと進める」ことを1行のまま伝える。 */}
                  <div className="subject-book-title flex items-center gap-3 mb-0 sm:mb-3 mt-0 sm:mt-1">
                    <div
                      className={`subject-book-icon w-9 h-9 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                        subject.available
                          ? 'bg-[#FBE0E9] text-[#D9466E] group-hover:scale-105'
                          : 'bg-[#E4E8EC] text-[#8895A0]'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2
                        className={`font-handwriting font-bold text-[19px] sm:text-[22px] md:text-[24px] leading-tight flex items-center gap-2 flex-wrap ${
                          subject.available ? 'text-[#1B2631]' : 'text-[#8895A0]'
                        }`}
                      >
                        {subject.title}
                        {/* 現在の科目。文言（上部）だけでなくカード自体でも分かるようにする。 */}
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-full bg-[#D9466E] px-2 py-0.5 text-[10px] font-modern font-bold tracking-wider text-white">
                            選択中
                          </span>
                        )}
                      </h2>
                      {/* ローマ字の副題。
                          ★スマホでは隠す★——ここは「飾り」であり、
                          同じ位置に入れるなら収録ボリューム（下）の方が
                          科目を選ぶ判断に直接役立つ。 */}
                      <p
                        className={`hidden sm:block text-[10px] font-modern tracking-[0.2em] mt-0.5 ${
                          subject.available ? 'text-[#E8688E]' : 'text-[#B8C4CE]'
                        }`}
                      >
                        {subject.latin.toUpperCase()}
                      </p>

                      {/* ★スマホ専用：収録ボリュームを科目名の真下に置く★

                          科目が6枚になり、従来の「アイコン行の下にリストを 1 行」
                          という作りでは 1 枚あたり 92px×6＝グリッド 607px になり、
                          見える高さ（実測 664px）に入りきらなかった（実測 183px 超過）。

                          そこで収録ボリュームの行を、アイコン行の「下」ではなく
                          「アイコンの横」に移した。アイコン（36px）の高さに
                          科目名＋収録行がちょうど収まるので、行を 1 つ減らしても
                          情報量は落ちない。★「何単元・何問あるか」は消してはいけない★
                          （消すと科目を選ぶ判断ができなくなる）ので、位置を変えるだけにとどめている。

                          ★文言は highlights[0] ではなく subject.volume を使う★
                          highlights[0] は説明文なので長く、実測で 320〜430px の
                          全幅で末尾が切れていた（英語リスニング・化学・数学）。
                          切れると肝心の数字が読めず「情報を消した」のと同じになる。
                          そこで科目ごとに手で短く決めた volume を出し、
                          truncate も外して「切れない」ことを保証する。 */}
                      <p
                        className={`sm:hidden text-[10px] font-modern leading-snug mt-0.5 ${
                          subject.available ? 'text-[#5D6D7E]' : 'text-[#A3AEB8]'
                        }`}
                      >
                        {subject.volume}
                      </p>
                    </div>
                    {/* スマホ用の「進める」矢印。
                        1行カードではフッターのCTA行を隠すため、
                        代わりにここで押せることを示す。 */}
                    {subject.available && (
                      <ArrowRight
                        className="sm:hidden w-5 h-5 text-[#E8688E] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* 説明（スマホでは隠す。1行カードに収めるため） */}
                  <p
                    className={`hidden sm:block text-xs font-modern leading-relaxed mb-3 ${
                      subject.available ? 'text-[#5D6D7E]' : 'text-[#8895A0]'
                    }`}
                  >
                    {subject.description}
                  </p>

                  {/* 収録ハイライト
                      ★スマホではこのリスト自体を隠す★
                      1行目（収録ボリューム）は上の科目名の真下に移したので、
                      ここに同じ文言を出すと二重になる（かつ行が増えて
                      6科目が1画面に入らなくなる）。
                      sm 以上では従来どおり全行を縦に並べる。 */}
                  <ul className="hidden sm:block space-y-1.5 mb-0 sm:mb-4">
                    {subject.highlights.map((item, hi) => (
                      <li
                        key={item}
                        className={`${hi === 0 ? 'flex' : 'hidden sm:flex'} items-start gap-2 text-[11px] font-modern leading-snug ${
                          subject.available ? 'text-[#5D6D7E]' : 'text-[#A3AEB8]'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mt-[1px] shrink-0 ${
                            subject.available ? 'text-[#E8688E]' : 'text-[#C6CFD6]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* フッター行（CTA）
                      スマホでは非表示。上の1行に矢印を出しているので
                      「この科目ではじめる」の文字は無くても迷わない。
                      ★この行こそが、ご指摘の「ブラウザのツールバーに
                        隠れて見えない」当該要素★でもある。 */}
                  <div className="hidden sm:flex mt-auto pt-3 border-t border-dashed border-[#E4E8EC] items-center justify-between">
                    <span
                      className={`text-[13px] font-bold font-modern tracking-wide ${
                        subject.available ? 'text-[#D9466E]' : 'text-[#8895A0]'
                      }`}
                    >
                      {subject.available ? 'この科目ではじめる' : '公開のお知らせを受け取る'}
                    </span>
                    {subject.available ? (
                      <ArrowRight
                        className="w-5 h-5 text-[#E8688E] group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      />
                    ) : (
                      <Bell className="w-4 h-4 text-[#8895A0]" aria-hidden="true" />
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}

          {/* ===== 高校入試 理科（スマホのみ・科目カードの最後） =====
              ★スマホ（md 未満）でだけ出す★
              利用者の指示：「高校入試理科（これここじゃなくて科目に追加して）」。
              スマホのホームからは理科のカードを外し（Home.tsx 参照）、
              代わりにここへ並べる。md 以上ではホームに従来どおり出るので、
              ここでは描かない（PC の見た目は不変。入口は常にどこか 1 か所にある）。

              ★他の科目と同じ「1 行カード」の形にそろえる★
              ただし色は理科のバイオレット（externalSubjects.ts）にする。
              押した先は本体の単元選択ではなく理科の専用画面なので、
              同じローズ色だと「化学基礎の続き」に見えてしまう。
              対戦の教科選択・結果でも理科は同じ色で出るので、
              入口から中まで色でつながる。 */}
          {onRika && rika && (
            <motion.div
              key="rika"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 + visibleSubjects.length * 0.07 }}
              data-subject-card
              data-external-subject="rika"
              className="w-full md:hidden"
            >
              <button
                onClick={onRika}
                data-subject-book
                style={{ '--subject-accent': '#7B4FA8', '--subject-soft': '#D6C4E7' } as React.CSSProperties}
                aria-label="高校入試 理科を学習する"
                className="group relative w-full h-full text-left rounded-[22px] p-2 border transition-all duration-200 overflow-hidden flex flex-col bg-white/92 backdrop-blur-sm border-[#D6C4E7]/80 shadow-[0_16px_38px_-18px_rgba(123,79,168,0.55)] hover:border-[#7B4FA8] active:scale-[0.995]"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#9A76C0] via-[#7B4FA8] to-[#C5AEE0]"
                  aria-hidden="true"
                />
                <div className="subject-book-title flex items-center gap-3">
                  <div className="subject-book-icon w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-[#D6C4E7]/45 text-[#7B4FA8]">
                    <Microscope className="w-4.5 h-4.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-handwriting font-bold text-[19px] leading-tight text-[#1B2631]">
                      {rika.label}
                    </h2>
                    {/* 収録ボリューム。単元数は登録簿の章一覧から数える
                        （出題のある単元だけが載っている）。 */}
                    <p className="text-[10px] font-modern leading-snug mt-0.5 text-[#5D6D7E]">
                      全{rika.chapters.length}単元・演習／まとめ／出題傾向
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#7B4FA8] shrink-0" aria-hidden="true" />
                </div>
              </button>
            </motion.div>
          )}
          </div>
        </div>

        {/* ===== 補足 ===== */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          /* ★スマホでは隠す★
             上余白 12px ＋ 本体 36px で 48px を使っていたが、
             内容は「あとで切り替えられる」という安心情報で、
             この画面での選択行動には必要ない。
             ★審査で消してよいと判断したのはこの一文と連携バナーの 2 つだけ★で、
             科目名・収録ボリュームなど「選ぶための情報」は一つも削っていない。 */
          className="hidden sm:block text-center text-[11px] text-[#8895A0] font-modern mt-3 sm:mt-7 leading-relaxed"
        >
          科目はあとから画面下の「ホーム」からいつでも切り替えられます。
        </motion.p>
      </div>

      {/* 準備中の科目を押したときの受け皿（フィードバックとして回収する）
          文面は押された科目名に合わせる（以前は「化学」固定だった）。 */}
      {notifySubject && (
        <FeedbackModal
          screen="title"
          category="request"
          initialMessage={`「${notifySubject.title}」の公開を希望します。`}
          description={`「${notifySubject.title}」は現在準備中です。公開のお知らせ希望や、優先してほしい分野をお聞かせください`}
          context={{ requestedSubject: notifySubject.id, isGuest }}
          onClose={() => setNotifySubject(null)}
        />
      )}
    </div>
  );
}
