/**
 * 設問から「表示用の派生値」を作るフック
 * ===================================================================
 *
 * なぜ切り出したか
 * ─────────────────────────────────────────────────────────
 * Quiz.tsx のロジック部が 1,491 行あり、そのうち約 300 行が
 * 「currentQuestion から表示に必要な値を計算するだけ」の useMemo で、
 * state も副作用も持っていなかった。読む側からすると、
 * 本当に状態を持っている部分（採点・遷移・タイマー）と混ざっていて
 * どこが副作用なのか見分けが付かない状態だった。
 *
 * ★ここは「純粋な派生値」だけを置く場所★
 * ─────────────────────────────────────────────────────────
 * このフックには useState / useEffect を置かない。
 * 中身は useMemo と useCallback だけで、呼ぶ順番が変わらない限り
 * Quiz.tsx にあったときと計算結果は完全に同じになる。
 * 逆に言えば、ここに useState を足したくなったら、それは
 * このフックの担当ではない（Quiz.tsx 側に置くべきもの）。
 *
 * ★フックの呼び出し順について★
 * ─────────────────────────────────────────────────────────
 * React はフックを「呼ばれた順番」で対応付ける。
 * 元の Quiz.tsx で L818〜L1125 にあった 17 個のフックを、
 * まとめてこのフックの中へ移し、Quiz.tsx では同じ位置で
 * useQuestionDerived() を1回呼ぶ形にした。
 * こうすると全体としての呼び出し順は元と一字一句変わらない。
 * 呼び出し位置を動かすと順番が変わって壊れるので、
 * Quiz.tsx 側で「もっと上で呼びたい」と思っても動かさないこと。
 *
 * ★中で完結している値（外に出していないもの）★
 * ─────────────────────────────────────────────────────────
 * groupedSubQuestions / visibleGroupedSubQuestions / shortAnswerSubs /
 * useInlineBlanks / questionNeedsChemPalette / focusHighlightVariants /
 * activeStepHasFigure は、実測（grep）でこの区間の外から
 * 参照されていないことを確認したので返していない。
 * 必要になったら戻り値に足すこと（勝手に消さない）。
 */
import { useMemo, useCallback } from 'react';
import { isShortAnswerType, extractBlankToken, blankHighlightVariants } from '../utils/quizBlanks';
import { requiresMathSymbols } from '../utils/quizPaletteRules';
import { buildListeningOptionTexts } from '../utils/listeningOptions';
import { cleanQuestionText, isSubQuestionListRedundant, extractInlineQuestionRows } from '../utils/questionDisplay';

export interface UseQuestionDerivedArgs {
  /** 表示中の設問オブジェクト。undefined のときは各値が空を返す。 */
  currentQuestion: any;
  /** リスニングで「小問ごとに音源が分かれている回」かどうか。 */
  perStep: boolean;
  /** 小問ごと形式のとき、いま出している小問（先頭）。 */
  activeStepSub: any;
  /**
   * いま出しているステップの小問全部（第4問以降は複数）。
   * 省略時は activeStepSub 1つだけとみなす（第1〜3問と同じ動き）。
   */
  activeStepSubs?: any[];
  /** いまフォーカスしている小問の id（ハイライトの出し分けに使う）。 */
  focusedSubId: string | null;
  /** 本文のハイライト指定（ユーザーの選択由来）。 */
  highlights: string[];
  /** PC 判定。スマホ専用の配り方を掛けるかどうかの分岐に使う。 */
  isDesktop: boolean;
  /** 問題文ペインを手で広げている状態か。 */
  isProblemExpanded: boolean;
  /** 問題文ペインを畳んでいる状態か。 */
  isProblemCollapsed: boolean;
  /** ソフトウェアキーボードが出ているか。 */
  keyboardVisible: boolean;
  /** スマホの解答カードのページ位置。 */
  mobileAnsIdx: number;
}

export function useQuestionDerived({
  currentQuestion,
  perStep,
  activeStepSub,
  activeStepSubs,
  focusedSubId,
  highlights,
  isDesktop,
  isProblemExpanded,
  isProblemCollapsed,
  keyboardVisible,
  mobileAnsIdx,
}: UseQuestionDerivedArgs) {
  // Group subQuestions if they have a group property
  const groupedSubQuestions = useMemo(() => {
    if (!currentQuestion) return [];
    const list: { type: 'single' | 'group'; groupName?: string; items: any[] }[] = [];
    let lastGroup: any = null;

    (currentQuestion.subQuestions || []).forEach((sq: any) => {
      if (sq.group) {
        if (lastGroup && lastGroup.groupName === sq.group) {
          lastGroup.items.push(sq);
        } else {
          lastGroup = { type: 'group', groupName: sq.group, items: [sq] };
          list.push(lastGroup);
        }
      } else {
        lastGroup = null;
        list.push({ type: 'single', items: [sq] });
      }
    });
    return list;
  }, [currentQuestion]);

  /**
   * 解答欄に実際に描画するグループ一覧。
   *
   * ご要望「問1で1つの進捗、問2で1つの進捗みたいな感じにしてほしい」に対応し、
   * 1問ずつモード（perStep）では、いま解いている問だけを解答欄に出す。
   * 以前は問1〜問4のカードが4枚縦に並んでいたため、
   * 「今どれを解いているのか」が分からず、スマホでは選択肢まで
   * スクロールが必要だった。
   *
   * 化学など従来の問題（perStep=false）は groupedSubQuestions をそのまま使う。
   */
  const visibleGroupedSubQuestions = useMemo(() => {
    if (!perStep || !activeStepSub) return groupedSubQuestions;
    // 第4問以降は「音声1本に複数の解答欄」なので、ステップに属する
    // 小問を全部出す。第1〜3問は从来どおり1つだけ。
    const ids = new Set(
      (activeStepSubs && activeStepSubs.length > 0 ? activeStepSubs : [activeStepSub]).map(
        (sq: any) => sq?.id,
      ),
    );
    return groupedSubQuestions.filter((g: any) =>
      (g.items || []).some((sq: any) => ids.has(sq?.id)),
    );
  }, [groupedSubQuestions, perStep, activeStepSub, activeStepSubs]);

  // ────────────────────────────────────────────────────────────────
  // スマホ：解答欄の「1設問ずつページ送り」表示（ご指摘対応）
  // ────────────────────────────────────────────────────────────────
  //
  // ご指摘：「上下スクロールして(1)、(2)っていう入力欄を押して入力してく
  //          じゃん？それやめよう。(1)の入力欄を下半分に最初固定した状態に
  //          して。解答欄の右と左に黒の小さな矢印を置いて、固定する解答欄を
  //          変えるようにして。解答欄のスクロールがすごいうざい」
  //
  // 全設問のカードを縦に並べる（＝スクロールさせる）のをやめ、
  // 「いま答える1設問の解答欄」だけを下半分に固定表示する。
  // 移動は左右の黒矢印（と、キーボード表示中は下部バーの前へ/次へ）のみ。
  //
  // mobileAnswerSubs はページ送りの単位となる設問のフラットな一覧。
  // グループ（(ア)(イ)…の空欄グリッド）も1空欄＝1ページに分解し、
  // 「どのページでも解答欄は常に1つ」を保証する。
  const mobileAnswerSubs = useMemo(() => {
    const list: { sq: any; groupName?: string; gType: 'single' | 'group' }[] = [];
    visibleGroupedSubQuestions.forEach((g: any) => {
      (g.items || []).forEach((sq: any) => {
        list.push({ sq, groupName: g.type === 'group' ? g.groupName : undefined, gType: g.type });
      });
    });
    return list;
  }, [visibleGroupedSubQuestions]);

  // データ変化でインデックスが範囲外になっても落ちないよう必ず丸める。
  const safeMobileAnsIdx = Math.min(
    Math.max(0, mobileAnsIdx),
    Math.max(0, mobileAnswerSubs.length - 1),
  );

  // 実際に描画するグループ一覧。PC は従来どおり全設問を縦に並べ、
  // スマホは「現在ページの1設問」だけを含む1グループに絞る。
  const renderedAnswerGroups = useMemo(() => {
    if (isDesktop) return visibleGroupedSubQuestions;
    const cur = mobileAnswerSubs[safeMobileAnsIdx];
    if (!cur) return visibleGroupedSubQuestions;
    return [{ type: cur.gType, groupName: cur.groupName, items: [cur.sq] }] as any[];
  }, [isDesktop, visibleGroupedSubQuestions, mobileAnswerSubs, safeMobileAnsIdx]);

  // ────────────────────────────────────────────────────────────────
  // 要件1（解答入力方式）／要件4（化学記号パレットの出し分け）用の派生値
  // ────────────────────────────────────────────────────────────────

  // この問題に数学記号パレットが必要か。
  // データ側の明示 opt-in（requiresMathPalette）のみで判定する。
  const questionNeedsMathPalette = useMemo(() => {
    if (!currentQuestion) return false;
    if ((currentQuestion as any).requiresMathPalette) return true;
    const subs = currentQuestion.subQuestions || [];
    return subs.some((sq: any) => requiresMathSymbols(sq));
  }, [currentQuestion]);

  /**
   * ★ご要望11「あと解説と問題でフォント違うの何？」★
   *
   * 英語（リスニング・英文法）の問題文・選択肢は「英語の散文」なので、
   * 化学式の体裁付け（英字をセリフ体の span で包む処理）を通してはいけない。
   * 通すと "The" "umbrella" のような単語まで化学式扱いになり、
   *   font-family: 'Cambria Math','Times New Roman', serif
   * がインライン style で当たって、日本語（ゴシック）と書体が食い違う。
   * これが「問題と解説でフォントが違う」とご指摘いただいた現象そのもの。
   *
   * ★科目名で分岐しない★
   *   'english_listening' などの科目名で切り替えると、
   *   将来ほかの科目に英文を入れたときに取り残される。
   *   英文を読み上げる音源（audioTracks）を持つのは英語の問題だけなので、
   *   「その問題自身が英文の音源を持っているか」という
   *   問題ごとの事実で判断する（ご指摘「コードで形式的に作ると
   *   問題によっておかしくなる」を避けるため）。
   */
  const isEnglishProse = useMemo(() => {
    const tracks = (currentQuestion as any)?.audioTracks;
    return Array.isArray(tracks) && tracks.length > 0;
  }, [currentQuestion]);

  // 現在フォーカス中の穴埋め設問に対応する、問題文中のハイライト候補文字列。
  const focusHighlightVariants = useMemo(() => {
    if (!focusedSubId || !currentQuestion) return [] as string[];
    const sub = (currentQuestion.subQuestions || []).find((sq: any) => sq.id === focusedSubId);
    if (!sub) return [] as string[];
    const token = extractBlankToken(sub.label || '');
    if (!token) return [] as string[];
    return blankHighlightVariants(token);
  }, [focusedSubId, currentQuestion]);

  // ユーザー選択のハイライトと、フォーカス穴埋めのハイライトを結合。
  const combinedHighlights = useMemo(
    () => Array.from(new Set([...highlights, ...focusHighlightVariants])),
    [highlights, focusHighlightVariants]
  );

  /*
    スマホ：小問行を横並びにできる問題かどうか（ご要望8）
    ─────────────────────────────────────────────
    「(1)から4問縦書きになってるけど、横書きにしたら1画面に収まるくない？」

    ★科目で決め打ちしない（ご注意9）
      全 262 問を実測すると、行頭マーカー行の本文は
        数学     … 10〜22 文字
        化学基礎 … 最大 157 文字
      と問題ごとにまったく違う。「数学だから横」にすると化学基礎の
      長い小問まで横に並べて崩れるので、判定は
      extractInlineQuestionRows() に任せ「その問題自身が短いか」で決める。
      条件を満たさない問題は null が返り、従来の縦積みにフォールバックする。

    PC（isDesktop）では常に null にして、これまでの表示を一切変えない。
  */
  const inlineQuestionRows = useMemo(
    () => (isDesktop ? null : extractInlineQuestionRows(cleanQuestionText(currentQuestion?.text || ''))),
    [isDesktop, currentQuestion?.text]
  );

  /*
    スマホ：設問一覧が問題文の丸写しなら出さない（ご要望8）
    ─────────────────────────────────────────────
    「設問一覧と問題が同じなので、同じやつはもう設問一覧いらない」

    こちらも科目では決めず、「一覧の全項目が問題文に含まれるか」を
    問題ごとに判定する（1 項目でも欠ければ一覧を残す＝情報を消さない）。
  */
  const hideRedundantSubQuestionList = useMemo(
    () => !isDesktop && isSubQuestionListRedundant(currentQuestion),
    [isDesktop, currentQuestion]
  );

  // 下部ナビバー（前へ/次へ）の対象となる設問。
  //
  // ★テキスト入力（短答穴埋め・記述/計算）だけに絞る（ご指摘対応）
  // ─────────────────────────────────────────────
  // ご指摘：「タップしたらなんで重複して解答欄が出てくるかわからん。
  //          普通に入力できるようにしてよ。」
  // 以前は選択式・並べ替えも含めて「カードをタップ→下部の固定パネルに
  // もう1つ解答UIを出す」方式だったため、同じ設問の解答欄が
  // 画面に2つ並んで見えていた。いまは全形式ともカード内で直接解答する
  // 方式に統一したので、下部バーの役割は
  //   「ソフトキーボード表示中の空欄移動（前へ/次へ）＋記号パレット」
  // だけになった。キーボードを使うのはテキスト入力の設問だけなので、
  // ナビ対象もテキスト入力の設問だけにする。
  const inputNavSubs = useMemo(() => {
    if (!currentQuestion) return [] as any[];
    return (currentQuestion.subQuestions || []).filter(
      (sq: any) => isShortAnswerType(sq) || sq.type === 'descriptive',
    );
  }, [currentQuestion]);

  // ────────────────────────────────────────────────────────────────
  // 英語リスニング：問ごとの音源トラック
  // ────────────────────────────────────────────────────────────────
  //
  // ご要望「1問題とそれに該当する再生ボタンを横に配置して」に対応するため、
  // 「この設問(subId)に対応するトラックがあるか」を O(1) で引けるようにする。
  // 解答カード側は subId で引いて、そのカードの横に再生ボタンを描く。
  const listeningTracks: any[] = useMemo(() => {
    const t = (currentQuestion as any)?.audioTracks;
    return Array.isArray(t) ? t : [];
  }, [currentQuestion]);

  /** 設問IDに対応する音源トラックがあるか（無ければ再生ボタンを出さない）。 */
  const hasTrackFor = useCallback(
    (sqId: string) => listeningTracks.some((t) => t?.subId === sqId),
    [listeningTracks],
  );

  // ────────────────────────────────────────────────────────────────
  // 英語リスニング：選択肢の本文（問題文と解答欄を分離しないための対応表）
  // ────────────────────────────────────────────────────────────────
  //
  // ご要望「問題文と解答欄を分離しないで／問題文(選択肢)と解答欄が同期するように」
  // に対応するため、problem.text に書かれている ①〜④ の英文を
  // 「設問ID → 選択肢本文の配列」に組み替える。
  // 解答欄の選択肢ボタンがこの本文を表示するので、
  // 読む場所と押す場所が一致し、左右のペインを往復する必要が無くなる。
  //
  // 元データは書き換えない（解説側では従来どおり問題文全文を見せたいため）。
  const listeningOptionTexts = useMemo(
    () => buildListeningOptionTexts(currentQuestion),
    [currentQuestion],
  );

  /**
   * 「問題文と解答欄を1つにまとめる」表示にするか（ご要望：分離しないで）。
   *
   * 音源つきの問題（＝英語リスニング）が対象。
   *   ・第1問A … 選択肢の英文を解答カードのボタンに載せる
   *   ・第1問B … 判断材料のイラストを解答カードに載せる（既にそうなっている）
   * どちらも「設問文・選択肢・解答」を1枚のカードに揃え、
   * 左ペインには共通のリード文（指示文・解き方のコツ）だけを残す。
   *
   * 化学など音源が無い教科では false のままなので、従来表示に影響しない。
   */
  // 英文法（stepwise）も、音源は無いが同じ「設問＋選択肢を1枚のカード」表示にする
  const listeningUnified = listeningTracks.length > 0 || (currentQuestion as any)?.stepwise === true;

  /**
   * スマホのリスニングで「高さの配り方を逆にする」レイアウトを使うか。
   *
   * ご指摘（第1問B のスマホ画面）：
   *   「選択肢のところが固定されてるけど、選択肢の下に空白合って無駄だから、
   *     まず固定するならもっと下にもってきて、図が隠れてるのを防いでほしい」
   *
   * true のとき
   *   ・解答ペイン（①〜④）… 中身の高さだけ取り、画面下部（下部ナビの真上）へ
   *   ・問題文ペイン       … 残りの高さを全部もらう ＝ 図が大きく出る
   * となる。
   *
   * ★PC・キーボード表示中・問題文の全画面表示中は使わない★
   *   ・PC は左右分割なので高さの取り合いが起きない
   *   ・キーボード表示中は入力欄をキーボードの上に見せる従来ロジックを優先
   *   ・全画面表示中は問題文ペインが absolute inset-0 になり無関係
   */
  const listeningMobileSplit =
    !isDesktop && listeningUnified && !isProblemExpanded && !isProblemCollapsed && !keyboardVisible;

  /**
   * いま解いている問に「図」があるか。
   *
   * ★余った高さを誰にあげるかを、これで切り替える★
   *   第1問B（イラスト選択）… 図がある。余りは図にあげる（大きく見せたい）
   *   第1問A・第3問・第2問  … 図が無い。余りを問題文ペインにあげても
   *                            「再生ボタンの下に巨大な空白」になるだけ。
   *
   * ご要望「他の大問のUIも変えてくれない？第1問Aも第3問もこれから入る予定の
   * 第2問とその他も」への対応の要。第1問B 用に入れた
   * 「問題文ペイン＝flex-1」をそのまま他の大問に適用すると、
   * 図が無いぶんの高さが丸ごと死んだ空白になってしまう
   *（＝ご指摘いただいた「下に空白があって無駄」が場所を変えて再発する）。
   */
  const activeStepHasFigure =
    !!activeStepSub?.imageUrl ||
    (Array.isArray(activeStepSubs) && activeStepSubs.some((sq: any) => sq?.imageUrl || sq?.optionImages));

  /**
   * リスニング（スマホ）で「図が無い大問」のレイアウトを使うか。
   *
   * true のとき
   *   ・問題文ペイン … 中身の高さだけ（設問文＋再生ボタンで十分足りる）
   *   ・解答ペイン   … 残りの高さをもらい、選択肢を下端（下部ナビの真上）へ寄せる
   *   ・選択肢       … 余った高さのぶんだけ背を伸ばして押しやすくする
   *                    （ただし伸ばしすぎない上限つき）
   *
   * 図がある第1問B は従来どおり listeningMobileSplit の配り方
   *（問題文ペイン＝flex-1）を使う。
   */
  const listeningMaterial = listeningTracks.find(t => t.subId === activeStepSub?.id)?.material;
  const listeningMaterialsMobile = listeningMobileSplit && !!listeningMaterial;
  const listeningMobileNoFigure = listeningMobileSplit && !listeningMaterial && !activeStepHasFigure;
  // ★戻り値★
  // 実測（grep）で「区間の外から参照されている」ことを確認した 14 個だけを返す。
  // 名前は Quiz.tsx にあったときと同一にして、呼び出し側の JSX や
  // 他のロジックを一行も書き換えずに済むようにしている。
  return {
    mobileAnswerSubs,
    safeMobileAnsIdx,
    renderedAnswerGroups,
    questionNeedsMathPalette,
    isEnglishProse,
    combinedHighlights,
    inlineQuestionRows,
    hideRedundantSubQuestionList,
    inputNavSubs,
    listeningTracks,
    hasTrackFor,
    listeningOptionTexts,
    listeningUnified,
    listeningMobileSplit,
    listeningMobileNoFigure,
    listeningMaterialsMobile,
  };
}
