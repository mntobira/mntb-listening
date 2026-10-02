/**
 * =====================================================================
 * 選択式（単一選択・複数選択）設問の解答UI
 * =====================================================================
 * ■ なぜ Quiz.tsx から切り出したのか
 *   選択肢ボタン群だけで 359 行あり、Quiz.tsx の中で最も大きな
 *   「描画だけを担当するかたまり」だった。消去法（斜線）・長押し・
 *   リスニングの選択肢本文表示・丸数字の付け方など、判断が集中している
 *   ので独立したファイルにして読みやすくした。
 *
 * ■ 動きは 1 バイトも変えていない
 *   className / aria 属性 / 丸数字の条件 / 複数選択の区切り判定は
 *   すべて Quiz.tsx にあったときと同一。state の持ち主も動かしていない
 *   （消去法の state は問題切替時のリセットが Quiz 側 useEffect にあるため）。
 *   そのため 10 個の props で受け取る形にしている。
 */
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { formatText } from '../utils/textFormatter';
import { optionCircledMark } from '../utils/questionDisplay';
import './quiz-compact.css';

export interface MultipleChoiceControlProps {
  sq: any;
  answers: Record<string, string>;
  onSelect: (sqId: string, option: string) => void;
  /** その設問で消去（斜線）中の選択肢一覧。sq.id をキーに持つ。 */
  eliminated: Record<string, string[]>;
  isEliminated: (sqId: string, opt: string) => boolean;
  restoreOption: (sqId: string, opt: string) => void;
  strikeOptionAnimated: (sqId: string, opt: string) => void;
  beginLongPress: (sqId: string) => void;
  endLongPress: () => void;
  /** 消去法の使い方ヒントを開いているか。 */
  elimHintOpen: boolean;
  setElimHintOpen: (v: boolean) => void;
  dismissElimHint: () => void;
  /** リスニングで①〜④の本文を選択肢の下に出すための対応表。 */
  listeningOptionTexts: Map<string, string[]>;
  /** 英文（散文）として折り返すかどうか。 */
  isEnglishProse: boolean;
  /** 直前に斜線を引いた選択肢のキー（`sqId\u0000opt`）。アニメーション用。 */
  justStruck: string | null;
  /** 長押しが成立したので onClick を無視する、というフラグ。ref のまま受け取る。 */
  longPressFired: React.MutableRefObject<boolean>;
  /** リスニングのスマホ表示で図がない場合のレイアウト分岐。 */
  listeningMobileNoFigure: boolean;
  /**
   * リスニングのスマホ表示で「図がある」場合のレイアウト分岐。
   *
   * ★これを足した理由（ご指摘：第1問B・第2問の図が小さすぎる）★
   *   図つきの大問では、図と選択肢が縦に高さを取り合う。
   *   ①②③④ のようにマークだけの選択肢は2列×2行に並んでいて、
   *   実測（390x664・第2問）で 112px（52px×2行＋行間8px）を
   *   占めていた。マークだけなら4列×1行でも1つ 88x48px あって
   *   指で押せるので、1行にするだけで約 60px を図に回せる。
   *   図が無い大問（listeningMobileNoFigure）では逆に
   *   「背を伸ばして押しやすくする」のが正解なので、両者は別扱いにする。
   */
  listeningMobileWithFigure?: boolean;
  listeningMaterialsMobile?: boolean;
}

export function MultipleChoiceControl({
  sq,
  answers,
  onSelect,
  eliminated,
  isEliminated,
  restoreOption,
  strikeOptionAnimated,
  beginLongPress,
  endLongPress,
  elimHintOpen,
  setElimHintOpen,
  dismissElimHint,
  listeningOptionTexts,
  isEnglishProse,
  justStruck,
  longPressFired,
  listeningMobileNoFigure,
  listeningMobileWithFigure = false,
  listeningMaterialsMobile = false,
}: MultipleChoiceControlProps) {
  // Quiz.tsx にあったときの呼び名をそのまま残す（下の JSX を書き換えないため）
  const handleOptionSelect = onSelect;

  function renderMultipleChoiceControl(sq: any) {
    const isLongOptionList = sq.options.some((opt: string) => opt.length > 5);
    // 複数選択かどうかの判定：
    //   correctAnswer を区切り文字で分割した「すべてのトークン」が選択肢に存在する場合のみ複数選択とみなす。
    const optionSet = new Set(sq.options.map((o: string) => o.trim()));
    const detectMulti = (sep: string) => {
      if (!sq.correctAnswer || !sq.correctAnswer.includes(sep)) return false;
      const toks = sq.correctAnswer.split(sep).map((t: string) => t.trim()).filter(Boolean);
      return toks.length >= 2 && toks.every((t: string) => optionSet.has(t));
    };
    const multiSep = detectMulti('・') ? '・' : (detectMulti('、') ? '、' : (detectMulti(',') ? ',' : null));
    const isMultiple = multiSep !== null;

    /*
      ★英語リスニング：選択肢の本文を「解答欄のボタンそのもの」に載せる（ご要望）
      ------------------------------------------------------------------
      第1問A のデータは options が ['①','②','③','④'] のマークだけで、
      英文本体は problem.text 側にあった。そのため
      「左ペインで英文を読む → 右ペインで①〜④を押す」という往復が必要だった。
      listeningOptionTexts は problem.text から①〜④の本文を取り出した対応表で、
      ここに本文があれば、マークと本文を1つのボタンに同居させる。
      これで「問題文（選択肢）と解答欄が同期する」＝分離が無くなる。
      第1問B（イラスト選択）には本文が無いので、従来どおりマークのみになる。
    */
    // Graphs are shown full-size in the shared material pane on mobile.
    const graphMarksOnly = listeningMaterialsMobile && Array.isArray(sq.optionImages);
    const optionTexts: string[] | undefined = graphMarksOnly ? undefined : listeningOptionTexts.get(sq.id);
    /*
      ★図が選択肢そのもの（英語リスニング 第6問 問37）★
      ------------------------------------------------------------------
      問37 は「①〜④のグラフのうちどれが根拠か」を選ぶ。文字の選択肢は無く、
      4枚のグラフが選択肢そのもの。配布側の指示どおり 2×2 に並べて
      見比べられるようにする（縦 1 列にすると比較できず本番より難しくなる）。
      optionImages は options と同じ長さのときだけ使う。
    */
    const optionImages: string[] | undefined =
      !graphMarksOnly && Array.isArray(sq.optionImages) && sq.optionImages.length === sq.options.length
        ? sq.optionImages
        : undefined;
    /*
      ★選択肢が5つ・6つで本文が短い（第4問の並べ替え・6択共有）★
      縦1列では高さを食うので 2 列にする。
    */
    const twoCol =
      !!optionTexts &&
      !optionImages &&
      sq.options.length >= (listeningMaterialsMobile ? 4 : 5) &&
      optionTexts.every((t) => t.length <= 28);
    // 本文つきの選択肢は必ず縦1列（英文は長いので横並びにすると読めない）。
    const stacked = (isLongOptionList || !!optionTexts) && !optionImages;

    return (
      // ★スマホでは「選択肢が先・説明が後」にする（ご指摘：(ア)(イ) が欠けている）★
      //   flex-col なので CSS order で並べ替えられる。高さを削る方式と違い、
      //   説明文の長さや選択肢の数が変わっても選択肢が先頭に来ることは保証される。
      //   md 以上は order を付けないので PC の並び（説明→選択肢）は元のまま。
      <div data-listening-compact-options={listeningMaterialsMobile || undefined} className="flex w-full flex-col gap-2">
      {/*
        消去法の操作説明。
        ボタン（モード切替）を置かず、選択肢を続けてタップするだけで
        「選ぶ → 消す → 戻す」が回ることを一行で伝える。
      */}
      {/*
        操作説明は「文字だけ」だと読み飛ばされるため、
        各状態の見た目そのものを小さな見本として並べて示す。
        初見のユーザーが「斜線という段階がある」ことに気づけるようにするのが目的。
      */}
      {/* 操作説明は初回のみ展開し、以降は「?」アイコンで呼び出す（ご要望：
          毎問同じ説明が常時表示され選択肢の邪魔になる、への対応）。 */}
      {elimHintOpen ? (
        /*
          ★ご指摘「(ア)(イ)とかのボタンが欠けてる」の真因はここだった★

          この操作説明は初見ユーザーには既定で開いている。
          PC では横1行に収まるが、スマホ幅（360〜390px）では
          「タップで選択 → もう一度で斜線 → さらにタップで元に戻る
            ／長押しでこの設問の斜線をまとめて消す」が4行に折り返し、
          実測で約150px を占有していた。

          解答ペインの高さは端末と問題文の長さで決まる有限値なので、
          その150px はそのまま選択肢の取り分から引かれる。
          結果 (ア)(イ)(ウ)(エ) が下部ナビの下に押し出され、
          初見ユーザーの画面には選択肢が1つも映らない状態になっていた
          （実測：c5_7[0] 390x664 で 見えている選択肢 0/4）。

          ★直し方の方針★
            説明を消すのではなく、スマホだけ「見本＋2文字」に圧縮する。
            見本チップ（白／青／斜線）は残すので
            「斜線という段階がある」という肝心の気づきは失われない。
            md 以上は一切変更しない（PC の見た目は元のまま）。
        */
        <div className="order-2 md:order-none flex flex-wrap items-center gap-x-1.5 md:gap-x-2 gap-y-1 text-xs font-bold leading-snug text-gray-500 rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1 md:px-2.5 md:py-2">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block rounded-md border-2 border-gray-200 bg-white px-1.5 py-0.5 text-gray-600">ア</span>
            <span className="hidden md:inline">タップで選択</span>
            <span className="md:hidden">選ぶ</span>
          </span>
          <span aria-hidden="true" className="text-gray-300">→</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block rounded-md border-2 border-[#A9CCE3] bg-[#A9CCE3] px-1.5 py-0.5 text-white">ア</span>
            <span className="hidden md:inline">もう一度で斜線</span>
            <span className="md:hidden">斜線</span>
          </span>
          <span aria-hidden="true" className="text-gray-300">→</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block rounded-md border-2 border-gray-200 bg-gray-100 px-1.5 py-0.5 text-gray-400 line-through decoration-2 decoration-[#E8A87C]">ア</span>
            <span className="hidden md:inline">さらにタップで元に戻る</span>
            <span className="md:hidden">戻す</span>
          </span>
          {/* 長押しの補足はスマホでは省く（「?」から開いた PC 幅でだけ出す）。
              肝心の3段階はチップの見本で伝わっている。 */}
          <span className="hidden md:inline text-gray-400">／長押しでこの設問の斜線をまとめて消す</span>
          <button
            type="button"
            onClick={dismissElimHint}
            className="ml-auto -my-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-xs font-bold text-gray-600 underline underline-offset-2 hover:bg-gray-100"
            aria-label="操作説明を閉じる（以降は ? ボタンで表示）"
          >
            閉じる
          </button>
        </div>
      ) : (
        // 折りたたみ状態（「?操作説明」だけ）もスマホでは選択肢の後ろへ。
        <div className="order-2 md:order-none flex justify-end">
          <button
            type="button"
            onClick={() => setElimHintOpen(true)}
            className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-bold text-gray-500 hover:text-gray-700"
            aria-label="選択肢の操作説明を表示"
            title="タップで選択→もう一度で斜線（消去法）の説明を見る"
          >
            <HelpCircle size={13} />
            操作説明
          </button>
        </div>
      )}

      {/*
        ★図が無い大問（第1問A・第3問・第2問）は選択肢の背を伸ばす★
        余った高さを空白として捨てず、タップ領域に変える。
          ・auto-rows-fr    … 4つの行が等分に高さを分け合う
          ・overflow-y-auto … 端末が極端に低いときはここだけスクロール
                              （カードが下部ナビに潜り込むのを防ぐ）
        伸ばしすぎると1問が画面を占領して読みにくいので、
        個々のボタン側に max-h の上限を付けている（下記 className 参照）。
      */}
      {/* order-1：スマホでは操作説明（order-2）より前に出す。
          これで説明文が何行に折り返しても選択肢が先頭に残る。 */}
      <div className={`order-1 md:order-none ${optionImages
        // 図が選択肢：必ず 2×2（見比べて選ぶ問題なので縦1列にしない）
        ? 'grid grid-cols-2 gap-2 w-full'
        : stacked
        ? `grid ${twoCol ? 'grid-cols-2 gap-2' : listeningMaterialsMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 gap-2.5'} w-full ${
            listeningMobileNoFigure && !twoCol ? 'mc-fill-stack min-h-0 flex-1 auto-rows-fr overflow-y-auto' : ''
          }`
        // 注：以前ここに xs:grid-cols-3 があったが、Tailwind v4 の @theme に
        // xs ブレークポイントは未定義で「効かないクラス」だった。スマホで列数を
        // 増やすと1つあたりのタップ幅が狭くなり本要件（タップしづらい）に逆行する
        // ため、ブレークポイントを追加せずクラスを削除している。
        /*
          ★図つきのスマホだけ、マークだけの選択肢を1行に並べる★
          ご指摘（手書きの指示書）：図を「大きめに」。

          ■ 実測（390x664・第2問・①②③④）
              grid-cols-2 → 52px × 2行 ＋ 行間 8px ＝ 112px
              grid-cols-4 → 48px × 1行              ＝  48px
            差の 64px がそのまま図の高さに変わる
            （左ペインは flex-1 で「解答ペインが取らなかった分」を全部もらう）。

          ■ 押しやすさは落とさない
              4列にしても 1つあたり 390px ÷ 4 − 余白 ≒ 88px 幅。
              高さは min-h-[3rem]（48px）が生きるので 88x48px。
              指で押す下限（44x44px）を上下とも超えている。

          ■ 本文つき（英文）の選択肢は対象外
              stacked（本文つき・長い選択肢）はこの分岐に入らないので、
              英文が4列に潰れることはない。
        */
        : `grid gap-2 md:gap-3 w-full sm:flex sm:flex-wrap ${
            listeningMobileWithFigure ? 'grid-cols-4 md:grid-cols-2' : 'grid-cols-2'
          }`
      }`}>
        {sq.options.map((opt: string, optIdx: number) => {
          const isSelected = isMultiple
            ? (answers[sq.id] || '').split(multiSep as string).map(s => s.trim()).includes(opt.trim())
            : (answers[sq.id] || '') === opt;
          const struck = isEliminated(sq.id, opt);
          // 斜線を引いた直後だけアニメーションを流す（状態変化を動きで知らせる）
          const strikeAnimating = struck && justStruck === `${sq.id}\u0000${opt}`;
          const body = optionTexts?.[optIdx];
          // 丸文字（①②③…）。既に丸数字を持つ選択肢には付けない（実測 321件）。
          const optionMark = body ? '' : optionCircledMark(opt, optIdx);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={isSelected}
              // 消去済みは支援技術にも「候補から外した」と伝える
              aria-disabled={struck}
              // 見た目（斜線・グレー）に頼らず、状態を言葉でも伝える。
              // 「今どの状態か視覚情報だけで判断させない」ためのラベル。
              aria-label={`${opt}${body ? ` ${body}` : ''}／${
                struck ? '消去済み。タップで元に戻します' : isSelected ? '選択中。タップで斜線を引きます' : '未選択'
              }`}
              title={struck ? '消去済み（タップで元に戻す／長押しでまとめて戻す）' : undefined}
              // 長押しで、その設問の斜線をまとめて消す。
              // タッチ・マウスの両方を拾うため Pointer Events を使う。
              onPointerDown={() => beginLongPress(sq.id)}
              onPointerUp={endLongPress}
              onPointerLeave={endLongPress}
              onPointerCancel={endLongPress}
              onContextMenu={(e) => {
                // 長押しが成立した直後にモバイルの長押しメニューが出ると
                // 操作の邪魔になるため抑制する。
                if (longPressFired.current) e.preventDefault();
              }}
              onClick={() => {
                // 長押しでまとめて消した直後は、指を離したときの
                // 通常タップを実行しない（意図しない選択を防ぐ）。
                if (longPressFired.current) {
                  longPressFired.current = false;
                  return;
                }
                // ────────────────────────────────────────────────
                // 選択肢の直接タップだけで消去法まで行う（モード無し）
                //   未選択 → 選択 → 斜線（消去）→ 未選択 → …
                // ────────────────────────────────────────────────
                //
                // ① 斜線が引かれている選択肢をタップ → 斜線を消して未選択に戻す。
                //    「間違って消した」をその場のタップ1回で取り消せる。
                if (struck) {
                  restoreOption(sq.id, opt);
                  return;
                }
                if (isMultiple) {
                  // 複数選択：選択中のものをタップ＝選択解除（従来どおり）。
                  // 複数選択で斜線まで回すと「解除したのか消したのか」が
                  // 分からなくなるため、複数選択では斜線を使わない。
                  const separator = multiSep as string;
                  const current = (answers[sq.id] || '').split(separator).map(s => s.trim()).filter(Boolean);
                  const nextUnordered = isSelected
                    ? current.filter(a => a !== opt)
                    : [...current, opt];
                  const ordered = sq.options.filter((o: string) => nextUnordered.includes(o));
                  handleOptionSelect(sq.id, ordered.join(separator));
                  return;
                }
                // ② 単一選択で「いま選んでいる」ものをタップ
                //    → 解答を外し、そのまま斜線を引く（＝これは違うと判断した）。
                if (isSelected) {
                  handleOptionSelect(sq.id, '');
                  strikeOptionAnimated(sq.id, opt);
                  return;
                }
                // ③ それ以外（未選択）をタップ → 解答として選ぶ。
                handleOptionSelect(sq.id, opt);
              }}
              // スマホは 48px 以上の高さ・幅を確保してタップしやすくする（PC は従来寸法）。
              className={optionImages ? `relative flex flex-col items-stretch gap-1 rounded-xl border-2 p-1.5 shadow-sm cursor-pointer transition-all ${
                struck
                  ? 'bg-gray-100 border-gray-300 border-dashed opacity-60'
                  : isSelected
                    ? 'bg-[#F4D03F]/25 border-[#E5B93C] ring-2 ring-[#E5B93C]/30'
                    : 'bg-white border-[#E6DCC6] hover:border-[#E5B93C]/60'
              }` : `relative ${
                /* ★B-1：本文つき選択肢（英文）はスマホで左右余白を詰める★
                   px-4（16px×2）→ px-2.5（10px×2）で 12px を英文に回す。
                   md 以上では md:px-4 で元に戻すので PC の見た目は不変。
                   マークだけの選択肢（①②③④）は幅が余っているので対象外。 */
                stacked ? 'px-2.5 md:px-4' : 'px-4'
              } ${
                /* 資料つきリスニング（スマホ）は上下余白を 12px→8px にして
                   4択で約 32px を選択肢・資料の表示に回す。
                   min-h-[3rem]（48px）は残すのでタップ領域は縮まない。 */
                listeningMaterialsMobile ? 'py-2' : 'py-3'
              } md:py-2.5 min-h-[3rem] md:min-h-0 rounded-2xl font-bold text-[16px] md:text-sm transition-all duration-200 border-2 flex ${
                /* ★丸文字つき／本文つきは items-start にする★
                   items-center だと本文が2行になったとき丸数字が
                   行の中央に浮き、ぶら下げインデントが成立しない。
                   丸数字の無い短い選択肢（「4月」など）は従来どおり中央。 */
                optionMark || body ? 'items-start' : 'items-center'
              } ${stacked ? 'justify-start text-left w-full' : 'justify-center text-center w-full sm:w-auto sm:flex-none'} ${
                /* 本文つきは w-full なので min-w は不要。
                   min-w-[3.25rem] を残すと狭い端末で横あふれの原因になる。 */
                stacked ? '' : 'min-w-[3.25rem] md:min-w-[3rem]'
              } shadow-sm cursor-pointer ${
                /*
                  図が無い大問では余り高さのぶんだけ背が伸びる（押しやすくする）。
                  ★上限（5rem）を必ず付ける★
                    付けないと4択が画面を縦に埋め尽くし、1つのボタンが
                    巨大な余白の塊になる。それでは「空白が無駄」を
                    別の形で作り直すだけになってしまう。
                */
                /*
                  ★B-1：本文つき選択肢では高さ上限を外す★
                  ─────────────────────────────────────────────
                  max-h-[5rem]（80px）は「4択が画面を縦に埋め尽くすのを防ぐ」
                  ために付けたもので、マークだけの選択肢（①②③④）には今も有効。

                  しかし本文つき（英文）の選択肢では話が逆で、
                  英文が3行になると 3行 × 24px + 上下余白 = 約88px 必要なのに
                  80px で打ち切られ、本文の最後の行が隠れていた。
                  さらに overflow-y-auto の親の中で全4つが 80px を主張するため
                  合計が枠を超え、④ が下にはみ出して切れていた。
                  （ご指摘「④も見えるようにしたい」の上下方向の原因）

                  本文つきは stacked のときだけなので、そこだけ上限を外す。
                  マークだけの選択肢は従来どおり 80px 上限のまま
                  ＝「巨大な空白の塊」への逆戻りは起きない。
                */
                listeningMobileNoFigure && !stacked ? 'max-h-[5rem]' : ''
              }
                ${struck
                  // 消去済み：斜線＋グレーに加え、枠線を破線にして
                  // 「候補から外した（もう枠として生きていない）」ことを形でも示す。
                  // 色や透明度だけでは段階の違いが伝わりにくい、というご指摘への対応。
                  // 紙の冊子で選択肢に線を引いた状態の再現。
                  ? `bg-gray-100 text-gray-400 border-gray-300 border-dashed line-through decoration-2 decoration-[#E8A87C] opacity-70 shadow-none ${strikeAnimating ? 'animate-strike-out' : ''}`
                  // 2026-10-02 D2：選択中の見た目を対戦の4択と同じ「金枠・薄い金」に統一（操作が同じに見えるように）
                  : isSelected
                    ? 'bg-[#F4D03F]/25 text-[#2C3E50] border-[#E5B93C] ring-2 ring-[#E5B93C]/25 scale-[1.01]'
                    : 'bg-white text-[#2C3E50] border-[#E6DCC6] hover:border-[#E5B93C]/60 hover:bg-[#FFFCF3]'
                }`}
            >
              {optionImages ? (
                // 図が選択肢：左上にマーク、下に図。図はセルの幅いっぱいに広げる。
                <>
                  <span className={`self-start rounded-md px-1.5 text-[14px] font-bold leading-6 ${
                    struck ? 'text-gray-400' : isSelected ? 'bg-[#E5B93C] text-white' : 'text-[#2C3E50]'
                  }`}>
                    {opt}
                  </span>
                  <img
                    src={optionImages[optIdx]}
                    alt={body ? `${opt} ${body}` : `選択肢${opt}の図`}
                    loading="lazy"
                    className={`w-full rounded-md bg-white object-contain ${struck ? 'grayscale' : ''}`}
                  />
                </>
              ) : body ? (
                // マークは丸バッジで固定幅にし、英文は折り返して全文を読ませる。
                // 「読む場所」と「押す場所」を1つにするのがこの表示の目的。
                <span className="flex w-full items-start gap-2.5">
                  <span
                    className={`shrink-0 text-[15px] md:text-base ${listeningMaterialsMobile ? 'leading-[1.4]' : 'leading-6'} ${
                      struck ? 'text-gray-400' : isSelected ? 'text-white' : 'text-[#2C3E50]'
                    }`}
                  >
                    {opt}
                  </span>
                  {/* 資料つきリスニング（スマホ）は行間を 24px→21px にして、2行の選択肢で 6px 稼ぐ。 */}
                  <span className={`min-w-0 flex-1 text-[15px] md:text-sm font-medium ${listeningMaterialsMobile ? 'leading-[1.4]' : 'leading-6'} break-words [overflow-wrap:anywhere] font-modern`}>
                    {/* 英語の選択肢は散文として組む（化学式扱いのセリフ体を避ける） */}
                    {formatText(body, [], { prose: isEnglishProse })}
                  </span>
                </span>
              ) : optionMark ? (
                /*
                  ★ご要望「解答入力のところにも丸文字を。」＋
                    「問題文の改行ができていない。見にくい。特に選択肢問題。」★

                  ■ 実測した変更前の状態（Playwright・390x664・地理 第1回 問1）
                      選択肢6つが1列（left=69 / 252x52px）に並び、中身は
                      formatText(opt) だけ＝「4月 ― 7月」のような素のテキスト。
                      ・丸数字が無いので、設問文の「次の①〜⑥のうちから一つ選べ」と
                        画面上の選択肢が対応せず、どれが①なのか分からない。
                      ・ボタンが flex items-center なので、テキストが2行以上に
                        なると ★2行目が1行目の真下（左端）から始まる★。
                        実物の冊子は「① 」の幅ぶん下げた ぶら下げインデント で、
                        番号と本文が視覚的に分離している。

                  ■ 直し方
                      本文つき選択肢（英語）で既に使っている
                      「丸バッジ＋本文」の2カラム構造をそのまま流用する。
                      ・左：丸数字（shrink-0 で固定幅）
                      ・右：本文（min-w-0 flex-1 で折り返し、2行目以降は
                            自動的に丸数字の右端に揃う＝ぶら下げインデント）
                      items-start にすることで、本文が2行になっても
                      丸数字は1行目に留まる（items-center だと中央に浮く）。

                  ■ 丸数字を出す条件は実測に基づく（optionCircledMark）
                      選択肢文字列が既に丸数字で始まる英語リスニング（221問）・
                      英文法（100問）には付けない＝「① ①」の二重表示を防ぐ。
                      個数の不一致は全教科0件なので、設問文の「①〜⑥」と
                      画面の番号は必ず一致する。
                */
                <span className="flex w-full items-start gap-2">
                  <span
                    className={`shrink-0 ${listeningMaterialsMobile ? 'leading-[1.4]' : 'leading-6'} ${
                      struck ? 'text-gray-400' : isSelected ? 'text-[#8A5A00]' : 'text-[#2C3E50]'
                    }`}
                    aria-hidden="true"
                  >
                    {optionMark}
                  </span>
                  <span className={`min-w-0 flex-1 text-left ${listeningMaterialsMobile ? 'leading-[1.4]' : 'leading-6'} break-words [overflow-wrap:anywhere]`}>
                    {formatText(opt)}
                  </span>
                </span>
              ) : (
                formatText(opt)
              )}
              {/*
                消去済みを示すアイコン。
                「取り消し線＋グレー」だけでは通常表示との差に気づきにくいため、
                ✕ のバッジを重ねて、色が見分けにくい環境でも
                形で「消してある」と分かるようにする。
              */}
              {struck && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8A87C] text-xs font-bold leading-none text-white shadow-sm ${
                    strikeAnimating ? 'animate-draw-strike' : ''
                  }`}
                >
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/*
        いま何個消したかを読み上げ・表示の両方で伝える。
        「今どの状態か」を見た目だけで覚えなくて済むようにするのが目的。
      */}
      {(eliminated[sq.id] || []).length > 0 && (
        <p className="text-xs font-bold text-gray-500" aria-live="polite">
          {(eliminated[sq.id] || []).length}個を消去中（長押しでまとめて元に戻す）
        </p>
      )}
      </div>
    );
  }

  return renderMultipleChoiceControl(sq);
}
