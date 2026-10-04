import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, BookOpen, Eye, EyeOff, LayoutList, Printer, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  LEARNING_GLOBAL_CSS,
  LEARNING_PRINT_CSS,
  PRINT_MODE_CLASS,
  NO_PRINT_CLASS,
  type PrintMode,
  SECTION_1_1_HTML,
  SECTION_1_2_HTML,
  SECTION_1_3_HTML,
  SECTION_2_1_HTML,
  SECTION_2_2_HTML,
  SECTION_2_3_HTML,
  ADV_THERMO_HTML,
  ADV_THERMO_PARTS,
  ADV_ELECTRO_HTML,
  ADV_ELECTRO_PARTS,
  MATH_INTEGRAL_HTML,
  MATH_INTEGRAL_PARTS,
  MATH_VECTOR_HTML,
  MATH_VECTOR_PARTS,
  MATH_PROBABILITY_HTML,
  MATH_PROBABILITY_PARTS,
  MATH_INTEGER_HTML,
  MATH_INTEGER_PARTS,
  BIO_BASIC_HTML,
  BIO_BASIC_PARTS,
  type LearningPart,
} from '../data/learningContent';
import { MolBasicsSection } from './MolBasicsSection';
import { MATH_CURRICULUM_SECTIONS, MATH_CURRICULUM_HTML, MATH_CURRICULUM_PARTS } from '../data/learningContent/math_curriculum';
import {
  normalizeAnswerAccordions,
  countAnswerAccordions,
} from '../utils/learningAccordion';
import { typesetHtmlMath } from '../utils/mathTypeset';

/** まとめプリントを出す科目 */
export type LearningSubject = 'chemistry_basic' | 'chemistry' | 'math' | 'biology_basic';

interface LearningViewerProps {
  onBack: () => void;
  /** 初期表示するタブ（'mol-basics' で「物質量がわからない人へ」を直接開く） */
  initialTab?: string;
  /** 表示する科目。省略時は従来どおり化学基礎。 */
  subject?: LearningSubject;
}

// 「物質量がわからない人へ」タブのID（色分けの判定にも使う）
export const MOL_BASICS_TAB_ID = 'mol-basics';

// ===================================================================
// 科目ごとの目次・本文・印刷ラベル
// -------------------------------------------------------------------
// 化学基礎と化学（発展）で中身がまったく違うため、科目をキーにして
// 「タブ一覧 / 本文HTML / 印刷タイトル / 部の見出し」をまとめて切り替える。
// こうしておくと、化学側に節を足すときも下の表に1行足すだけで済む。
// ===================================================================

type SectionDef = { id: string; title: string };

const BASIC_SECTIONS: SectionDef[] = [
  { id: 'toc', title: '目次・使い方' },
  { id: '1-1', title: '1-1. 物質の構成' },
  { id: '1-2', title: '1-2. 物質の構成粒子' },
  { id: '1-3', title: '1-3. 化学結合' },
  { id: '2-1', title: '2-1. 物質量と化学反応式' },
  { id: MOL_BASICS_TAB_ID, title: '⭐ 物質量がわからない人へ' },
  { id: '2-2', title: '2-2. 酸と塩基' },
  { id: '2-3', title: '2-3. 酸化還元反応' },
];

/** 化学（発展）。理論化学3章（熱化学）・4章（電池と電気分解）を公開し、順次追加していく。 */
const ADVANCED_SECTIONS: SectionDef[] = [
  { id: 'toc', title: '目次・使い方' },
  { id: 'adv-3', title: '3. 化学反応とエネルギー' },
  { id: 'adv-4', title: '4. 電池と電気分解' },
];

// 各セクションのHTMLマップ（生成時に .learning-content スコープ済み）
const BASIC_SECTION_HTML: Record<string, string> = {
  '1-1': SECTION_1_1_HTML,
  '1-2': SECTION_1_2_HTML,
  '1-3': SECTION_1_3_HTML,
  '2-1': SECTION_2_1_HTML,
  '2-2': SECTION_2_2_HTML,
  '2-3': SECTION_2_3_HTML,
};

const ADVANCED_SECTION_HTML: Record<string, string> = {
  'adv-3': ADV_THERMO_HTML,
  'adv-4': ADV_ELECTRO_HTML,
};

/** 現行6科目の基礎・標準教材と、既存の専門演習を併設する。 */
const MATH_SECTIONS: SectionDef[] = [
  { id: 'toc', title: '目次・使い方' },
  ...MATH_CURRICULUM_SECTIONS,
  { id: 'math-integral', title: '数III 積分法（全パターン）' },
  { id: 'math-vector', title: 'ベクトル（全パターン）' },
  { id: 'math-probability', title: '場合の数・確率（全パターン）' },
  { id: 'math-integer', title: '整数（全パターン）' },
];

const MATH_SECTION_HTML: Record<string, string> = {
  ...MATH_CURRICULUM_HTML,
  'math-integral': MATH_INTEGRAL_HTML,
  'math-vector': MATH_VECTOR_HTML,
  'math-probability': MATH_PROBABILITY_HTML,
  'math-integer': MATH_INTEGER_HTML,
};

/** 生物基礎。共通テスト全範囲を1本のまとめプリントで提供する。 */
const BIOLOGY_SECTIONS: SectionDef[] = [
  { id: 'toc', title: '目次・使い方' },
  { id: 'bio-basic', title: '生物基礎（共通テスト完全対応）' },
];

const BIOLOGY_SECTION_HTML: Record<string, string> = {
  'bio-basic': BIO_BASIC_HTML,
};

// ===================================================================
// 「重要事項ごとに見る」ための分割データ
// -------------------------------------------------------------------
// 長い章を一気にスクロールさせると、どこを読んでいるのか分からなくなる。
// そこで章を重要事項①②③…に切り分け、ボタン（チップ）で
// 見たいところだけを出せるようにする。
//
// ・ここに登録が無いタブは従来どおり「1本の長い本文」を表示する
//   （化学基礎側は原稿がそのままなので、何も変わらない）
// ・「すべて」を選べば、これまでと同じ通し読みができる
// ===================================================================

/** 「すべて通して読む」を表す擬似パートID */
export const ALL_PARTS_ID = 'all';

const SECTION_PARTS: Record<string, LearningPart[]> = {
  ...MATH_CURRICULUM_PARTS,
  'adv-3': ADV_THERMO_PARTS,
  'adv-4': ADV_ELECTRO_PARTS,
  'math-integral': MATH_INTEGRAL_PARTS,
  'math-vector': MATH_VECTOR_PARTS,
  'math-probability': MATH_PROBABILITY_PARTS,
  'math-integer': MATH_INTEGER_PARTS,
  'bio-basic': BIO_BASIC_PARTS,
};

/** 印刷ダイアログのタイトル（＝PDFの既定ファイル名）に使うセクション名 */
const BASIC_PRINT_TITLE: Record<string, string> = {
  toc: '目次・使い方',
  '1-1': '1-1 物質の構成',
  '1-2': '1-2 物質の構成粒子',
  '1-3': '1-3 化学結合',
  '2-1': '2-1 物質量と化学反応式',
  [MOL_BASICS_TAB_ID]: '物質量がわからない人へ',
  '2-2': '2-2 酸と塩基',
  '2-3': '2-3 酸化還元反応',
};

const ADVANCED_PRINT_TITLE: Record<string, string> = {
  toc: '目次・使い方',
  'adv-3': '3 化学反応とエネルギー',
  'adv-4': '4 電池と電気分解',
};

const BASIC_PART_LABEL: Record<string, string> = {
  '1-1': '第1部 物質の構成',
  '1-2': '第1部 物質の構成',
  '1-3': '第1部 物質の構成',
  '2-1': '第2部 物質の変化',
  [MOL_BASICS_TAB_ID]: '第2部 物質の変化 / 物質量 補講',
  '2-2': '第2部 物質の変化',
  '2-3': '第2部 物質の変化',
};

const ADVANCED_PART_LABEL: Record<string, string> = {
  'adv-3': '理論化学 3章 化学反応とエネルギー',
  'adv-4': '理論化学 4章 電池と電気分解',
};

const MATH_PRINT_TITLE: Record<string, string> = {
  ...Object.fromEntries(MATH_CURRICULUM_SECTIONS.map(s => [s.id, s.title])),
  toc: '目次・使い方',
  'math-integral': '数III 積分法（全パターン演習）',
  'math-vector': 'ベクトル（全パターン演習）',
  'math-probability': '場合の数・確率（全パターン演習）',
  'math-integer': '整数（全パターン演習）',
};

const MATH_PART_LABEL: Record<string, string> = {
  ...Object.fromEntries(MATH_CURRICULUM_SECTIONS.map(s => [s.id, s.title])),
  'math-integral': '数学III 積分法',
  'math-vector': '数学C ベクトル',
  'math-probability': '数学A 場合の数・確率',
  'math-integer': '数学A 整数',
};

const BIOLOGY_PRINT_TITLE: Record<string, string> = {
  toc: '目次・使い方',
  'bio-basic': '生物基礎（共通テスト完全対応）',
};

const BIOLOGY_PART_LABEL: Record<string, string> = {
  'bio-basic': '生物基礎 全範囲（細胞・遺伝子・体内環境・植生・生態系）',
};

/** 科目ごとの設定をひとまとめにする（分岐をここ1か所に閉じ込める） */
const SUBJECT_CONFIG: Record<
  LearningSubject,
  {
    /** 画面ヘッダー・印刷ヘッダー・PDFファイル名に使う科目名 */
    label: string;
    sections: SectionDef[];
    html: Record<string, string>;
    printTitle: Record<string, string>;
    partLabel: Record<string, string>;
  }
> = {
  chemistry_basic: {
    label: '化学基礎',
    sections: BASIC_SECTIONS,
    html: BASIC_SECTION_HTML,
    printTitle: BASIC_PRINT_TITLE,
    partLabel: BASIC_PART_LABEL,
  },
  chemistry: {
    label: '化学',
    sections: ADVANCED_SECTIONS,
    html: ADVANCED_SECTION_HTML,
    printTitle: ADVANCED_PRINT_TITLE,
    partLabel: ADVANCED_PART_LABEL,
  },
  math: {
    label: '数学',
    sections: MATH_SECTIONS,
    html: MATH_SECTION_HTML,
    printTitle: MATH_PRINT_TITLE,
    partLabel: MATH_PART_LABEL,
  },
  biology_basic: {
    label: '生物基礎',
    sections: BIOLOGY_SECTIONS,
    html: BIOLOGY_SECTION_HTML,
    printTitle: BIOLOGY_PRINT_TITLE,
    partLabel: BIOLOGY_PART_LABEL,
  },
};

// Native details state belongs to the document. Do not replace its HTML when
// opening the print sheet or changing only the inherited reading font size.
const LearningArticle = memo(function LearningArticle({ html }: { html: string }) {
  return <article className="learning-content" dangerouslySetInnerHTML={{ __html: html }} />;
});

export function LearningViewer({ onBack, initialTab, subject = 'chemistry_basic' }: LearningViewerProps) {
  const config = SUBJECT_CONFIG[subject] ?? SUBJECT_CONFIG.chemistry_basic;
  const SECTIONS = config.sections;
  const SECTION_HTML = config.html;
  const SECTION_PRINT_TITLE = config.printTitle;
  const SECTION_PART_LABEL = config.partLabel;
  const isAdvanced = subject === 'chemistry';

  // 科目に存在しないタブIDが来たら目次に落とす。
  // 化学基礎で '2-1' を開いたまま科目を切り替えた場合など、
  // そのままだと「本文も目次も出ない空白画面」になってしまうため。
  const requestedTab = initialTab || 'toc';
  const [activeTab, setActiveTab] = useState(
    SECTIONS.some(s => s.id === requestedTab) ? requestedTab : 'toc',
  );
  // ★図のタップ拡大（ライトボックス）は廃止した★
  //   ご要望「クリックしてズーム機能はいらない」に合わせて、演習画面
  //   （QuestionFigure）と同じく学習ページからも削除している。
  //   図が小さくならないことは CSS 側で担保している：
  //   .figrow-fig img / .figfull img は width:100% + max-width:100%!important
  //   なので、拡大表示に頼らず最初から列の幅いっぱいで表示される。
  //   さらに拡大したいときは端末標準のピンチ操作が使える。
  // 「解答をすべて表示」しているかどうか（タブを変えたらリセット）
  const [allAnswersOpen, setAllAnswersOpen] = useState(false);
  // 表示中の「重要事項」。ALL_PARTS_ID なら章を通して読む。
  const [activePart, setActivePart] = useState<string>(ALL_PARTS_ID);
  const readerTopRef = useRef<HTMLDivElement>(null);
  const printDialogRef = useRef<HTMLDialogElement>(null);
  const printButtonRef = useRef<HTMLButtonElement>(null);
  const [readingSize, setReadingSize] = useState<'normal' | 'large'>(() => {
    try { return localStorage.getItem('manatobi-reader-size') === 'large' ? 'large' : 'normal'; }
    catch { return 'normal'; }
  });
  useEffect(() => {
    try { localStorage.setItem('manatobi-reader-size', readingSize); } catch { /* Reading still works without storage. */ }
  }, [readingSize]);

  useEffect(() => {
    readerTopRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    setAllAnswersOpen(false);
    // タブを移ったら「すべて」に戻す（前の章の①が選ばれたままにならないように）
    setActivePart(ALL_PARTS_ID);
  }, [activeTab]);

  // 科目が変わったら、その科目に無いタブは目次へ戻す（空白画面の防止）
  useEffect(() => {
    if (!SECTIONS.some(s => s.id === activeTab)) setActiveTab('toc');
    // activeTab を依存に入れると「存在するタブ」でも毎回評価するだけなので安全
  }, [SECTIONS, activeTab]);

  // 図のクリックで拡大表示していた処理（Esc で閉じる effect と
  // イベント委譲のクリックハンドラ）はズーム廃止に伴って削除した。
  // 解答パネルの開閉は <details> のネイティブ挙動に任せているので、
  // 本文へのクリックハンドラ自体が不要になっている
  // （JS で open を書き換えると再レンダリングで消えるため元々触っていない）。

  // 原稿の <details>/<summary> を「解答パネル」に正規化する。
  // 文言のばらつき（解答を表示／解答と解説を表示…）をここで吸収するため、
  // section_*.ts 側は一切書き換えなくてよい。
  //
  // ここで allAnswersOpen を HTML に焼き込んでいるのが重要。
  // 「開いた状態」を DOM 側（d.open = true）に持たせると、React が
  // dangerouslySetInnerHTML を貼り直したときに開閉が消えてしまう。
  //
  // 重要事項ボタンで絞り込んでいるときは、その重要事項のHTMLだけを描く。
  // 「すべて」のときは章まるごと（＝従来と同じ本文）。
  const parts = SECTION_PARTS[activeTab];
  const currentPart = parts?.find(p => p.id === activePart) ?? null;
  const fullSectionHtml = SECTION_HTML[activeTab];
  const rawSectionHtml = currentPart ? currentPart.html : fullSectionHtml;
  // まとめプリント本文の数式を KaTeX で組み直す。
  //
  // まとめプリントは HTML 文字列で書かれており、指数が <sup>n</sup>、
  // 添字が <sub>2</sub>（＝本文の文字を小さくして上下に寄せただけ）だった。
  // これでは分数・∫・根号が混ざった式が崩れて読めないため、
  // 数式と判定できた範囲だけを TeX 品質の組版に差し替える。
  // 化学式（H<sub>2</sub>O・Fe<sup>2+</sup>）や英文は判定から外れるので無変更。
  const sectionHtml = useMemo(
    () => (rawSectionHtml
      ? typesetHtmlMath(normalizeAnswerAccordions(rawSectionHtml, allAnswersOpen))
      : rawSectionHtml),
    [rawSectionHtml, allAnswersOpen],
  );
  const answerCount = useMemo(() => countAnswerAccordions(rawSectionHtml || ''), [rawSectionHtml]);

  // 重要事項を切り替えたら、解答の一括表示はリセットして本文の先頭へ戻す
  const selectPart = useCallback((id: string) => {
    setActivePart(id);
    setAllAnswersOpen(false);
    readerTopRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);

  // 「前の重要事項 / 次の重要事項」用。読み進める動線を残しておく。
  const partIndex = parts && currentPart ? parts.findIndex(p => p.id === currentPart.id) : -1;
  const prevPart = partIndex > 0 ? parts![partIndex - 1] : null;
  const nextPart = parts && partIndex >= 0 && partIndex < parts.length - 1 ? parts[partIndex + 1] : null;

  // 解答の一括開閉。HTML を作り直すので、個別に開いていたものも
  // ボタンの状態にそろう（「すべて表示」なら全部開く／「すべて隠す」なら全部閉じる）。
  const toggleAllAnswers = () => setAllAnswersOpen(v => !v);

  // ============================================================
  // 印刷（PDF書き出し）
  // ------------------------------------------------------------
  // ブラウザの印刷機能をそのまま使う（= PDF に保存できる）。
  // 追加ライブラリを入れずに済み、生徒側の環境差にも強い。
  //
  // やっていること
  //   1. body に印刷モードのクラスを付ける
  //        lc-print-answers … 解答つき（答え合わせ・指導用）
  //        lc-print-blank   … 解答を伏せる（自習・配布用）
  //      解答は <details> なので、閉じていると中身が印刷されない。
  //      CSS 側で「開閉状態に関係なく」表示／非表示を決めている。
  //   2. document.title を差し替える
  //      「PDF に保存」したときの既定ファイル名になるため。
  //   3. window.print() を呼び、印刷後に元へ戻す
  //      afterprint が飛ばないブラウザもあるので、タイマーでも復帰させる。
  // ============================================================
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  useEffect(() => {
    const dialog = printDialogRef.current;
    if (!dialog) return;
    if (printMenuOpen && !dialog.open) dialog.showModal();
    if (!printMenuOpen && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [printMenuOpen]);

  const handlePrint = useCallback((mode: PrintMode) => {
    printDialogRef.current?.close();
    setPrintMenuOpen(false);
    if (typeof window === 'undefined') return;

    const body = document.body;
    // CSS alone cannot reveal the closed disclosure content in every browser.
    // Temporarily set the native open state, then restore the exact reading state.
    const disclosures = Array.from<HTMLDetailsElement>(readerTopRef.current?.querySelectorAll<HTMLDetailsElement>('.learning-content details, .mbs-details') || []);
    const disclosureState = disclosures.map(detail => detail.open);
    disclosures.forEach(detail => { detail.open = mode === 'answers'; });
    const modeClass = PRINT_MODE_CLASS[mode];
    const prevTitle = document.title;
    // 重要事項で絞り込んでいるときは、その名前もファイル名に入れる
    // （「熱化学のヘスの法則だけ刷った紙」が後から判別できるように）
    const baseTitle = SECTION_PRINT_TITLE[activeTab] || 'まとめプリント';
    const partTitle = currentPart ? `_${currentPart.no}${currentPart.title}` : '';
    const sectionTitle = `${baseTitle}${partTitle}`;
    const suffix = mode === 'answers' ? '解答つき' : '解答なし';

    // 印刷モードのクラスは常に片方だけ付く状態にする
    body.classList.remove(PRINT_MODE_CLASS.answers, PRINT_MODE_CLASS.blank);
    body.classList.add(modeClass);
    document.title = `${config.label}まとめプリント_${sectionTitle}_${suffix}`;

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      body.classList.remove(modeClass);
      disclosures.forEach((detail, index) => { detail.open = disclosureState[index]; });
      document.title = prevTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);

    try {
      window.print();
    } finally {
      // Safari など afterprint を発火しない環境向けの保険
      window.setTimeout(restore, 1500);
    }
  }, [activeTab, config.label, SECTION_PRINT_TITLE, currentPart]);

  // タブを切り替えたら印刷メニューは閉じる（別セクションを刷ってしまう事故を防ぐ）
  useEffect(() => setPrintMenuOpen(false), [activeTab]);

  return (
    <div ref={readerTopRef} data-reading-size={readingSize} className="learning-reader w-full min-h-screen bg-[#FDFBF7] font-modern pb-app-nav relative notebook-paper">
      {/* ===== グローバル学習プリント用 CSS（ビルド時に .learning-content スコープ済み）===== */}
      <style dangerouslySetInnerHTML={{ __html: LEARNING_GLOBAL_CSS }} />
      {/* ===== 印刷（PDF書き出し）用 CSS。@media print のみなので画面表示は変わらない ===== */}
      <style dangerouslySetInnerHTML={{ __html: LEARNING_PRINT_CSS }} />

      <div className="w-full px-0 py-0 relative">
        {/* Absolute Background Blur */}
        <div className={`absolute top-10 left-10 w-48 h-48 bg-[#A9CCE3]/10 rounded-full blur-3xl pointer-events-none ${NO_PRINT_CLASS}`}></div>
        <div className={`absolute bottom-20 right-10 w-64 h-64 bg-[#F9E79F]/10 rounded-full blur-3xl pointer-events-none ${NO_PRINT_CLASS}`}></div>

        <header className={`reader-header sticky top-0 z-30 ${NO_PRINT_CLASS}`}>
          <div className="reader-topbar">
            <button type="button" onClick={onBack} className="reader-icon-button" aria-label="学習メニューに戻る"><ArrowLeft size={20} /></button>
            <div className="reader-heading"><span>{config.label} ／ LEARNING NOTE</span><h1>まとめプリント</h1></div>
            <button ref={printButtonRef} type="button" onClick={() => setPrintMenuOpen(true)} aria-haspopup="dialog" aria-expanded={printMenuOpen} className="reader-print-button"><Printer size={17} /><span>印刷 / PDF</span></button>
          </div>
          <label className="reader-course-picker"><BookOpen size={16} aria-hidden="true" /><span className="sr-only">読む章を選ぶ</span>
            <select value={activeTab} onChange={event => setActiveTab(event.target.value)} aria-label="読む章を選ぶ">
              {SECTIONS.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
          </label>
        </header>

        {typeof document !== 'undefined' && createPortal(
          <dialog ref={printDialogRef} className={`reader-print-dialog ${NO_PRINT_CLASS}`} aria-labelledby="reader-print-title" aria-describedby="reader-print-description"
            onCancel={() => setPrintMenuOpen(false)}
            onKeyDown={(event: ReactKeyboardEvent<HTMLDialogElement>) => {
              if (event.key !== 'Tab') return;
              const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
              const first = buttons[0], last = buttons[buttons.length - 1];
              if (!first || !last) return;
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }}
            onClose={() => { setPrintMenuOpen(false); printButtonRef.current?.focus({ preventScroll: true }); }}
            onClick={event => { if (event.target === event.currentTarget) setPrintMenuOpen(false); }}>
            <div className="reader-print-panel">
              <div className="reader-print-heading"><div><span>PRINT YOUR NOTE</span><h2 id="reader-print-title">印刷・PDFに保存</h2></div>
                <button type="button" className="reader-icon-button" onClick={() => setPrintMenuOpen(false)} aria-label="印刷パネルを閉じる"><X size={20} /></button>
              </div>
              <p id="reader-print-description">{SECTION_PRINT_TITLE[activeTab]}{currentPart ? ` ／ ${currentPart.title}` : ''}</p>
              <p className="reader-print-help">いま表示している範囲を印刷します。PDF保存は、この後の端末の印刷画面で選べます。</p>
              <button type="button" onClick={() => handlePrint('answers')} className="reader-print-option"><Eye size={21} /><span><strong>解答つきで印刷</strong><small>解説も含めて、復習・答え合わせ用に</small></span><ChevronRight size={18} /></button>
              <button type="button" onClick={() => handlePrint('blank')} className="reader-print-option"><EyeOff size={21} /><span><strong>解答を伏せて印刷</strong><small>自分で解く、書き込み用プリントに</small></span><ChevronRight size={18} /></button>
              <p className="reader-print-help">A4縦で出力します。端末やブラウザにより印刷・保存の表示は異なります。</p>
              <button type="button" className="reader-print-cancel" onClick={() => setPrintMenuOpen(false)}>読んでいた場所に戻る</button>
            </div>
          </dialog>, document.body,
        )}

        {/* Responsive Topic Tab Scroll Container */}
        <div className={`reader-desktop-tabs flex gap-2 overflow-x-auto py-3 mb-0 px-4 md:px-8 scrollbar-none snap-x z-20 relative bg-[#FDFBF7]/80 backdrop-blur-sm border-b border-gray-150 ${NO_PRINT_CLASS}`}>
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm border snap-start cursor-pointer
                ${activeTab === sec.id
                  ? 'bg-[#5b21b6] border-[#5b21b6] text-white transform -translate-y-0.5 shadow-md'
                  : (sec.id === MOL_BASICS_TAB_ID
                      ? 'bg-[#f3ecff] border-[#c9bce6] text-[#5b21b6] hover:bg-[#e9dcff]'
                      : 'bg-white border-[#e3daf5] text-[#6b6280] hover:text-[#5b21b6] hover:bg-[#faf7ff]')}`}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* The Main Notebook-Styled Paper Page Container
            背景（罫線・ノート紙）は全幅のまま、読み取り用コンテンツは読みやすい最大幅に制限して中央寄せする。
            これにより、余白を消してもPCで画像や表が巨大化しない。 */}
        <div className="reader-paper w-full notebook-paper rounded-none p-4 sm:p-8 md:p-12 relative min-h-[calc(100vh-140px)] shadow-none border-0">
          {/* Vertical Red Binder Line */}
          <div className={`reader-margin-line absolute top-0 bottom-0 left-[14px] sm:left-[36px] w-[1.5px] bg-red-200/50 pointer-events-none ${NO_PRINT_CLASS}`}></div>

          <div className="reader-body pl-5 sm:pl-10 relative z-10 text-[#1B2631] max-w-4xl mx-auto learning-print-area">

            {/* ====== 印刷したときだけ出る紙のヘッダー ======
                配布プリントとして成立させるために、タイトル・セクション名と
                名前／日付の記入欄を紙の一番上に置く。画面では表示されない。 */}
            <div className="lc-print-only lc-print-head" aria-hidden="true">
              <div className="lc-print-title">{config.label} まとめプリント</div>
              <div className="lc-print-sub">
                {SECTION_PRINT_TITLE[activeTab] || ''}
                {/* 重要事項で絞り込んでいるときは、紙の見出しにもその名前を出す */}
                {currentPart ? `　${currentPart.no}${currentPart.title}` : ''}
                {SECTION_PART_LABEL[activeTab] ? `　（${SECTION_PART_LABEL[activeTab]}）` : ''}
              </div>
              <div className="lc-print-meta">
                <span>名前：<span className="lc-print-field" /></span>
                <span>日付：<span className="lc-print-field" /></span>
              </div>
            </div>

            {/* ====== TOC ====== */}
            {activeTab === 'toc' && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="text-center py-6 border-b-2 border-[#c9bce6] border-dotted">
                  <h2 className="text-3xl sm:text-4xl font-black text-[#5b21b6] font-modern tracking-wider mb-3">
                    {config.label} まとめプリント
                  </h2>
                  <p className="text-[#7c3aed] font-bold text-sm tracking-wide">
                    大学入学共通テスト対策 / 大学2次試験対策 / 定期テスト対策
                  </p>
                </div>

                {/* Important style representation guide */}
                <div className="bg-white border-2 border-[#c9bce6] border-l-8 border-l-[#7c3aed] p-5 rounded-xl shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-[#7c3aed] tracking-wider uppercase">📖 重要語の表記について</h4>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-around pt-2">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-[#7c3aed] rounded-full"></span>
                      <p className="text-sm">
                        <span className="border-b-2 border-[#3f3352] pb-0.5 inline-block font-bold">太下線表記</span>
                        <span className="text-xs text-[#8b81a3] font-bold ml-2">＝最重要（必ず覚える）</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-[#c9bce6] rounded-full"></span>
                      <p className="text-sm">
                        <span className="underline decoration-wavy decoration-[#7c3aed] underline-offset-4 inline-block font-bold">波線下線表記</span>
                        <span className="text-xs text-[#8b81a3] font-bold ml-2">＝重要（押さえておく）</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8b81a3] pt-1 border-t border-[#e3daf5] italic">
                    ※ 例題および演習問題の解答・解説部分には強調ラインを適用していません。
                  </p>
                </div>

                {/* Print Content Map / 目次 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#5b21b6] flex items-center gap-2 border-b-2 border-dotted border-[#c9bce6] pb-2">
                    <BookOpen size={18} className="text-[#7c3aed]" />
                    <span>プリント目次</span>
                  </h3>

                  {/* ---- 化学（発展）の目次。公開済みの章だけを載せ、準備中も明示する ---- */}
                  {isAdvanced && (
                    <div className="grid grid-cols-1 gap-6 pt-2">
                      <div className="bg-white p-4 rounded-xl border-2 border-[#c9bce6] border-l-[6px] border-l-[#7c3aed]">
                        <h4 className="font-bold text-[#5b21b6] border-b border-dotted border-[#c9bce6] pb-1.5 mb-2 text-sm">理論化学</h4>
                        <ul className="space-y-1.5 text-xs font-bold text-[#3f3352]">
                          <li>
                            <button
                              type="button"
                              onClick={() => setActiveTab('adv-3')}
                              className="w-full text-left flex items-start gap-1.5 rounded-lg border border-[#c9bce6] bg-[#f3ecff] px-2 py-1.5 text-[#5b21b6] hover:bg-[#e9dcff] transition-colors cursor-pointer"
                            >
                              <span className="text-[#7c3aed]">3.</span>
                              <span>化学反応とエネルギー (エンタルピー・熱化学反応式・ヘスの法則・結合エネルギー・光)</span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => setActiveTab('adv-4')}
                              className="w-full text-left flex items-start gap-1.5 rounded-lg border border-[#c9bce6] bg-[#f3ecff] px-2 py-1.5 text-[#5b21b6] hover:bg-[#e9dcff] transition-colors cursor-pointer"
                            >
                              <span className="text-[#7c3aed]">4.</span>
                              <span>電池と電気分解 (電池式・ボルタ・ダニエル・燃料電池・鉛蓄電池・ファラデーの法則・電気分解・工業的製法)</span>
                            </button>
                          </li>
                        </ul>
                        <p className="mt-3 border-t border-[#e3daf5] pt-2 text-[11px] font-bold text-[#8b81a3]">
                          ほかの章（物質の状態と平衡 / 溶液 / 反応速度 / 化学平衡）と、
                          無機化学・有機化学のまとめプリントは順次追加していきます。
                        </p>
                      </div>
                    </div>
                  )}

                  {subject === 'math' && (
                    <div className="space-y-4" data-math-curriculum-toc>
                      <p className="text-sm leading-relaxed">数学Ⅰ・A・Ⅱ・B・Ⅲ・Cの基礎から標準へ。要点と例題を読んだら「演習問題」の同名単元で練習できます。入試の全パターン・全難度を網羅したものではありません。</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {MATH_SECTIONS.filter(s => s.id !== 'toc').map(section => (
                          <button key={section.id} type="button" onClick={() => setActiveTab(section.id)} className="min-h-[44px] rounded-xl border border-[#c9bce6] bg-white p-4 text-left text-sm font-bold text-[#5b21b6]">
                            {section.title}
                            <span className="mt-2 block text-xs font-normal leading-relaxed text-slate-600">{SECTION_PARTS[section.id]?.map(p => p.short).join(' ／ ')}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">場合の数・確率と整数は数学A、ベクトルは数学Cとして既存教材を併用します。二次関数・軌跡と領域には河野玄斗さんの確認済み参考動画へのリンクがあります。問題・解説は独自作成で、監修・提携を示すものではありません。</p>
                    </div>
                  )}
                  {subject === 'chemistry_basic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="bg-white p-4 rounded-xl border-2 border-[#c9bce6] border-l-[6px] border-l-[#7c3aed]">
                      <h4 className="font-bold text-[#5b21b6] border-b border-dotted border-[#c9bce6] pb-1.5 mb-2 text-sm">第1部 物質の構成</h4>
                      <ul className="space-y-1.5 text-xs font-bold text-[#3f3352]">
                        <li className="flex items-center gap-1.5"><span className="text-[#7c3aed]">1.</span> 物質の構成 (純物質・混合物・分離法・同素体・炎色反応)</li>
                        <li className="flex items-center gap-1.5"><span className="text-[#7c3aed]">2.</span> 物質の構成粒子 (原子の構造・電子配置・周期表・放射線・イオン)</li>
                        <li className="flex items-center gap-1.5"><span className="text-[#7c3aed]">3.</span> 化学結合 (結合の種類・結晶・分子の極性・水素結合)</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-xl border-2 border-[#c9bce6] border-l-[6px] border-l-[#7c3aed]">
                      <h4 className="font-bold text-[#5b21b6] border-b border-dotted border-[#c9bce6] pb-1.5 mb-2 text-sm">第2部 物質の変化</h4>
                      <ul className="space-y-1.5 text-xs font-bold text-[#3f3352]">
                        <li className="flex items-center gap-1.5"><span className="text-[#7c3aed]">1.</span> 物質量と化学反応式 (mol計算・化学反応式・イオン反応式・濃度)</li>
                        <li>
                          <button
                            type="button"
                            onClick={() => setActiveTab(MOL_BASICS_TAB_ID)}
                            className="w-full text-left flex items-start gap-1.5 rounded-lg border border-[#c9bce6] bg-[#f3ecff] px-2 py-1.5 text-[#5b21b6] hover:bg-[#e9dcff] transition-colors cursor-pointer"
                          >
                            <span>⭐</span>
                            <span>物質量がわからない人へ (プリントの単位変換の図で全部解く)</span>
                          </button>
                        </li>
                        <li className="flex items-center gap-1.5"><span className="text-[#7c3aed]">2.</span> 酸と塩基 (定義・電離度・強さ・pH・中和・塩の分類・中和滴定)</li>
                        <li className="flex items-center gap-1.5"><span className="text-[#7c3aed]">3.</span> 酸化還元反応 (定義・酸化数・半反応式・滴定・イオン化傾向・電池)</li>
                      </ul>
                    </div>
                  </div>
                  )}
                </div>

                <div className="pt-6 border-t-2 border-[#c9bce6] border-dotted text-center">
                  <p className="text-xs text-[#8b81a3] font-bold">
                    💡 上部メニューから見たいセクションを選択して勉強を進めましょう。
                  </p>
                </div>
              </div>
            )}

            {/* ====== 化学（発展）3章の冒頭に、対応する演習問題への案内を出す ====== */}
            {isAdvanced && activeTab === 'adv-3' && (
              <div className={`mb-5 rounded-xl border-2 border-[#c9bce6] border-l-8 border-l-[#7c3aed] bg-[#f7f2ff] px-4 py-3 ${NO_PRINT_CLASS}`}>
                <span className="block text-[11px] font-extrabold tracking-widest text-[#7c3aed]">インプット → アウトプット</span>
                <span className="mt-0.5 block text-sm font-bold text-[#5b21b6]">
                  このプリントを読んだら「演習問題」の 理論化学 3章 で手を動かそう
                </span>
                <span className="mt-1 block text-[11px] font-bold leading-relaxed text-[#6b6280]">
                  演習1〜20（反応エンタルピー / ヘスの法則 / 結合エネルギー / 光とエネルギー）が、
                  ここで学んだ順番のまま並んでいます。
                </span>
              </div>
            )}

            {/* ====== 化学（発展）4章の冒頭に、この章の読み方を出す ====== */}
            {isAdvanced && activeTab === 'adv-4' && (
              <div className={`mb-5 rounded-xl border-2 border-[#c9bce6] border-l-8 border-l-[#7c3aed] bg-[#f7f2ff] px-4 py-3 ${NO_PRINT_CLASS}`}>
                <span className="block text-[11px] font-extrabold tracking-widest text-[#7c3aed]">この章の読み方</span>
                <span className="mt-0.5 block text-sm font-bold text-[#5b21b6]">
                  「電子はどこから出て、どこへ入るか」だけを追いかければ、この章はぐっと簡単になる
                </span>
                <span className="mt-1 block text-[11px] font-bold leading-relaxed text-[#6b6280]">
                  重要事項①（酸化還元の復習）→ ②（電池）→ ③（電気分解）→ ④（工業的製法）の順に読むのが最短ルート。
                  上のボタンで重要事項を 1 つずつ選べば、長さに圧倒されずに進められます。
                </span>
              </div>
            )}

            {/* ====== 2-1 の冒頭に「物質量がわからない人へ」への案内を出す ====== */}
            {activeTab === '2-1' && (
              <button
                type="button"
                onClick={() => setActiveTab(MOL_BASICS_TAB_ID)}
                className="mb-5 w-full text-left rounded-xl border-2 border-[#c9bce6] border-l-8 border-l-[#7c3aed] bg-[#f7f2ff] px-4 py-3 transition-colors hover:bg-[#f0e7ff] cursor-pointer"
              >
                <span className="block text-[11px] font-extrabold tracking-widest text-[#7c3aed]">物質量 補講</span>
                <span className="mt-0.5 block text-sm font-bold text-[#5b21b6]">
                  ⭐ mol の計算がどうしても苦手な人へ →「物質量がわからない人へ」を見る
                </span>
                <span className="mt-1 block text-[11px] font-bold leading-relaxed text-[#6b6280]">
                  配布プリントの「単位変換の図」をそのまま操作して、どんな問題も同じ途中式で解けるようになります。
                </span>
              </button>
            )}

            {/* ====== ⭐ 物質量がわからない人へ（プリント完全再現 + 操作できる図） ====== */}
            {activeTab === MOL_BASICS_TAB_ID && (
              <div className="animate-fade-in-up">
                <div className="mb-4">
                  <span className="text-xs font-extrabold text-[#7c3aed] tracking-widest uppercase block">
                    {SECTION_PART_LABEL[MOL_BASICS_TAB_ID]}
                  </span>
                </div>
                <MolBasicsSection showHeader />
              </div>
            )}

            {/* ====== 重要事項ごとに見るボタン ======
                長い章を一気にスクロールするのではなく、重要事項①②③…を
                チップで選んでピンポイントに読めるようにする。
                印刷は選んでいる重要事項だけを刷る（＝1テーマ1枚のプリントになる）。 */}
            {parts && parts.length > 0 && (
              <div className={`reader-topics mb-5 rounded-2xl border-2 border-[#c9bce6] bg-white/90 p-3 sm:p-4 ${NO_PRINT_CLASS}`}>
                <div className="mb-2 flex items-center gap-1.5">
                  <LayoutList size={14} className="text-[#7c3aed]" />
                  <span className="text-[11px] font-extrabold tracking-widest text-[#7c3aed]">
                    重要事項ごとに見る
                  </span>
                </div>
                <div className="reader-topic-select">
                  <label htmlFor="reader-topic">読むテーマ</label>
                  <select id="reader-topic" value={activePart} onChange={event => selectPart(event.target.value)}>
                    <option value={ALL_PARTS_ID}>章全体を読む</option>
                    {parts.map(part => <option key={part.id} value={part.id}>{part.no}. {part.title}</option>)}
                  </select>
                  <div className="reader-topic-arrows">
                    <button type="button" disabled={!prevPart} onClick={() => prevPart && selectPart(prevPart.id)} aria-label="前のテーマ"><ChevronLeft size={18} /></button>
                    <button type="button" disabled={!nextPart && activePart !== ALL_PARTS_ID} onClick={() => selectPart(nextPart?.id || parts[0].id)} aria-label={activePart === ALL_PARTS_ID ? '最初のテーマを読む' : '次のテーマ'}><ChevronRight size={18} /></button>
                  </div>
                </div>
                <div className="reader-topic-chips flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectPart(ALL_PARTS_ID)}
                    aria-pressed={activePart === ALL_PARTS_ID}
                    className={`rounded-xl border-2 px-3 py-2 text-[11px] font-extrabold transition-colors cursor-pointer
                      ${activePart === ALL_PARTS_ID
                        ? 'border-[#5b21b6] bg-[#5b21b6] text-white shadow-md'
                        : 'border-[#c9bce6] bg-white text-[#5b21b6] hover:bg-[#f3ecff]'}`}
                  >
                    すべて通して読む
                  </button>
                  {parts.map(part => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => selectPart(part.id)}
                      aria-pressed={activePart === part.id}
                      className={`rounded-xl border-2 px-3 py-2 text-[11px] font-extrabold transition-colors cursor-pointer
                        ${activePart === part.id
                          ? 'border-[#7c3aed] bg-[#7c3aed] text-white shadow-md'
                          : 'border-[#c9bce6] bg-[#faf7ff] text-[#5b21b6] hover:bg-[#f0e7ff]'}`}
                    >
                      {part.short}
                    </button>
                  ))}
                </div>
                <p className="mt-2 border-t border-[#e3daf5] pt-2 text-[10px] font-bold leading-relaxed text-[#8b81a3]">
                  {currentPart
                    ? `「${currentPart.no}${currentPart.title}」だけを表示中。印刷するとこの部分だけのプリントになります。`
                    : '章全体を表示中。重要事項を選べば、そこだけに絞り込んで読めます。'}
                </p>
              </div>
            )}

            {/* ====== 各章 (1-1 〜 2-3) — 元のフル HTML を忠実に表示 ====== */}
            {sectionHtml && (
              <div className="animate-fade-in-up">
                <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 ${NO_PRINT_CLASS}`}>
                  <span className="text-xs font-extrabold text-[#7c3aed] tracking-widest uppercase block">
                    {SECTION_PART_LABEL[activeTab]}
                  </span>

                  {/* このセクションの解答をまとめて開閉する。
                      「まず自力で解く」→「答え合わせで一気に開く」の流れを1タップで。 */}
                  {answerCount > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllAnswers}
                      aria-pressed={allAnswersOpen}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-[11px] font-extrabold shadow-sm transition-colors cursor-pointer
                        ${allAnswersOpen
                          ? 'border-[#7c3aed] bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
                          : 'border-[#c9bce6] bg-white text-[#5b21b6] hover:bg-[#f3ecff]'}`}
                    >
                      {allAnswersOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>
                        {allAnswersOpen
                          ? `解答をすべて隠す（${answerCount}）`
                          : `解答をすべて表示（${answerCount}）`}
                      </span>
                    </button>
                  )}
                </div>
                <div className={`reader-settings ${NO_PRINT_CLASS}`} role="group" aria-label="本文の文字サイズ">
                  <span>文字サイズ</span>
                  <button type="button" aria-pressed={readingSize === 'normal'} onClick={() => setReadingSize('normal')}>標準</button>
                  <button type="button" aria-pressed={readingSize === 'large'} onClick={() => setReadingSize('large')}>大きめ</button>
                </div>
                {/* key に開閉状態を含めることで、一括開閉のときだけ
                    本文を作り直す（＝全アコーディオンが確実に指定状態になる）。
                    key が同じ間は React が DOM を触らないので、
                    個別に開いた解答は勝手に閉じない。 */}
                <LearningArticle
                  key={`${activeTab}:${activePart}:${allAnswersOpen ? 'open' : 'closed'}`}
                  html={sectionHtml}
                />

                {/* ====== 重要事項の「前へ / 次へ」 ======
                    絞り込んで読んでいるときだけ出す。上まで戻らずに
                    そのまま次の重要事項へ進めるようにするため。 */}
                {currentPart && (
                  <div className={`mt-8 flex flex-wrap items-stretch justify-between gap-3 border-t-2 border-dotted border-[#c9bce6] pt-5 ${NO_PRINT_CLASS}`}>
                    {prevPart ? (
                      <button
                        type="button"
                        onClick={() => selectPart(prevPart.id)}
                        className="flex-1 min-w-[45%] rounded-xl border-2 border-[#c9bce6] bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#f3ecff] cursor-pointer"
                      >
                        <span className="block text-[10px] font-extrabold tracking-widest text-[#8b81a3]">← 前の重要事項</span>
                        <span className="mt-0.5 block text-xs font-extrabold text-[#5b21b6]">
                          {prevPart.no}{prevPart.title}
                        </span>
                      </button>
                    ) : (
                      <span className="flex-1 min-w-[45%]" />
                    )}
                    {nextPart ? (
                      <button
                        type="button"
                        onClick={() => selectPart(nextPart.id)}
                        className="flex-1 min-w-[45%] rounded-xl border-2 border-[#7c3aed] bg-[#f7f2ff] px-3 py-2.5 text-right transition-colors hover:bg-[#f0e7ff] cursor-pointer"
                      >
                        <span className="block text-[10px] font-extrabold tracking-widest text-[#7c3aed]">次の重要事項 →</span>
                        <span className="mt-0.5 block text-xs font-extrabold text-[#5b21b6]">
                          {nextPart.no}{nextPart.title}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectPart(ALL_PARTS_ID)}
                        className="flex-1 min-w-[45%] rounded-xl border-2 border-[#7c3aed] bg-[#f7f2ff] px-3 py-2.5 text-right transition-colors hover:bg-[#f0e7ff] cursor-pointer"
                      >
                        <span className="block text-[10px] font-extrabold tracking-widest text-[#7c3aed]">最後の重要事項です</span>
                        <span className="mt-0.5 block text-xs font-extrabold text-[#5b21b6]">
                          章全体を通して読む →
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 図の拡大表示（ライトボックス）はズーム廃止に伴って削除した。 */}
    </div>
  );
}
