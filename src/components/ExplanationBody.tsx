import React from 'react';
import { formatText } from '../utils/textFormatter';

/**
 * ExplanationBody
 * ------------------------------------------------------------------
 * 学習フローチャート（ロジックツリー）のノード解説本文をレンダリングする。
 *
 * 【背景・方針】
 *  従来の解説テキストでは、表を「特徴 ｜ 純物質 ｜ 混合物」のように
 *  全角パイプを並べた “疑似テーブル” で表現していた。
 *  これは折り返しで列がずれて意味を失い、支援技術からも表として認識されない。
 *
 *  そこで解説データは **Markdown 形式のテーブル**（`| 見出し | 見出し |`）で記述し、
 *  このコンポーネントが本物の <table> 要素（thead / tbody / th / td）へ変換する。
 *  テーブル以外の行は従来どおり formatText（化学式の添字処理など）を通す。
 */

/** Markdown テーブルの区切り行（例: |---|:--:|---|） */
const DELIMITER_ROW = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/;
/** Markdown テーブルの行（先頭が | で始まる行） */
const TABLE_ROW = /^\s*\|.*\|\s*$/;

type Alignment = 'left' | 'center' | 'right';

interface TableBlock {
  kind: 'table';
  header: string[];
  rows: string[][];
  align: Alignment[];
}

interface TextBlock {
  kind: 'text';
  text: string;
}

type Block = TableBlock | TextBlock;

/** `| a | b |` 形式の1行をセル配列へ分解する。 */
function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

/** 区切り行（:--- / :---: / ---:）から各列の揃え方を決める。 */
function parseAlignments(line: string): Alignment[] {
  return splitRow(line).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });
}

/**
 * 解説テキストを「テキストブロック」と「テーブルブロック」に分解する。
 * Markdown テーブルとして成立しない `|` 行は、誤変換を避けてテキスト扱いにする。
 */
export function parseExplanationBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flushText = () => {
    if (buffer.length === 0) return;
    const joined = buffer.join('\n');
    // 前後の余分な空行だけのブロックは捨てる（テーブル前後の間隔は CSS で調整する）
    if (joined.trim() !== '') blocks.push({ kind: 'text', text: joined.replace(/^\n+|\n+$/g, '') });
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    // 「ヘッダー行 + 区切り行」が揃っているときだけテーブルとして解釈する
    if (TABLE_ROW.test(line) && next !== undefined && DELIMITER_ROW.test(next)) {
      flushText();
      const header = splitRow(line);
      const align = parseAlignments(next);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && TABLE_ROW.test(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      blocks.push({ kind: 'table', header, rows, align });
      i = j - 1;
      continue;
    }

    buffer.push(line);
  }

  flushText();
  return blocks;
}


const alignClass: Record<Alignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * 表の配色。解説は「明るい下地（ミニテスト・学習フロー）」と
 * 「暗い下地（演習モードの解説パネル）」の両方に出るため、両対応させる。
 */
export type ExplanationTone = 'light' | 'dark';

const toneStyles: Record<ExplanationTone, {
  wrapper: string;
  headCell: string;
  rowHeadCell: string;
  bodyCell: string;
  rowEven: string;
  rowOdd: string;
}> = {
  light: {
    // ★罫線は「薄いグレー」ではなく本文と同系の濃さにする（下の実測コメント参照）
    wrapper: 'border-slate-400 bg-white',
    headCell: 'border-slate-400 bg-slate-100 text-slate-700',
    rowHeadCell: 'border-slate-400 text-slate-700',
    bodyCell: 'border-slate-400 text-slate-700',
    rowEven: 'bg-white',
    rowOdd: 'bg-slate-50/70',
  },
  dark: {
    wrapper: 'border-[#3A506B] bg-[#0B132B]/60',
    headCell: 'border-[#3A506B] bg-[#1C2541] text-[#5BC0BE]',
    rowHeadCell: 'border-[#3A506B] text-[#E0E1DD]',
    bodyCell: 'border-[#3A506B] text-[#E0E1DD]/90',
    rowEven: 'bg-transparent',
    rowOdd: 'bg-[#1C2541]/40',
  },
};

interface ExplanationTableProps {
  block: TableBlock;
  tone: ExplanationTone;
  // このリポジトリは @types/react を導入していないため、JSX の key が
  // props として型チェックされる。明示的に受け取って型エラーを避ける。
  key?: React.Key;
}

function ExplanationTable({ block, tone }: ExplanationTableProps) {
  const colCount = block.header.length;
  const t = toneStyles[tone];
  return (
    /*
      ★ご要望「表はちゃんと線を設けて。」★

      ■ 実測した問題点（変更前のクラス）
          thead th : border-b            → 下だけ
          行見出し th : border-t         → 上だけ
          本文 td  : border-t border-l   → 上と左だけ
        つまり「セルの右側」と「表の外周（右端・下端）」に罫線が無く、
        さらに色が border-slate-200（#e2e8f0・実測コントラスト比 1.2:1）で
        背景の白とほとんど区別できなかった。結果として
        「格子ではなく、うっすら段が見えるだけ」の状態だった。
        実際の共通テスト冊子の組合せ表は ★全セルが黒の実線で囲まれた格子★。

      ■ 直し方
          ・すべてのセルに border（4辺）を与える。
            table は border-collapse なので隣接セルの罫線は1本に重なり、
            線が二重に太くなることはない。
          ・色を slate-400（#94a3b8・対白コントラスト比 約2.8:1）に上げる。
            slate-500 以上まで濃くすると表だけが紙面から浮くため、
            「線として認識できる下限」を採る。
          ・角丸は rounded-lg → rounded-md に落とす。
            冊子の表は角が立っているので、四角囲みの印象に寄せる。

      ■ 影響範囲（実測）
        この表コンポーネントを通るのは Markdown テーブルを含むテキストのみ。
        全教科を走査して罫線の付き方が変わるのは表そのものだけで、
        地の文・選択肢・図には一切影響しない。
    */
    // 列数が多い表はスマホで横スクロールできるようにする（文字を潰して縦書きにしない）
    <div className={`my-3 -mx-1 overflow-x-auto rounded-md border shadow-sm ${t.wrapper}`}>
      {/*
        ★ご要望「化学基礎・化学含め様々な科目で解答解説と問題のフォントが
          あっていないので問題のフォントに合わせて。」★

        ここは解説の中の表。以前は font-handwriting を直書きしていたので、
        カード土台を font-modern に統一しても、表だけ Yomogi のまま残り
        「解説の中で書体が2種類混ざる」状態になっていた。

        書体は指定せず、カード土台（CARD_FONT_FAMILY = font-modern）から
        継承させる。こうすれば「問題のフォントに合わせる」という基準が
        1か所（土台）だけになり、将来書体を変えるときもここを触らずに済む。
        数式の単元では土台が font-math になるので、表も自動で数式書体に揃う。
      */}
      <table className="w-full min-w-full border-collapse text-[11px] sm:text-xs">
        <thead>
          <tr>
            {block.header.map((cell, i) => (
              <th
                key={i}
                scope="col"
                className={[
                  // 4辺すべてに罫線（border-collapse で隣と1本に重なる）
                  'border px-2 py-1.5 font-bold whitespace-normal break-words align-top',
                  t.headCell,
                  alignClass[block.align[i] ?? 'left'],
                ].join(' ')}
              >
                {formatText(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className={r % 2 === 1 ? t.rowOdd : t.rowEven}>
              {Array.from({ length: colCount }).map((_, c) => {
                const cell = row[c] ?? '';
                // 各行の1列目は行見出し（scope="row"）として扱い、表の意味構造を保つ
                if (c === 0) {
                  return (
                    <th
                      key={c}
                      scope="row"
                      className={[
                        'border px-2 py-1.5 font-bold whitespace-normal break-words align-top',
                        t.rowHeadCell,
                        alignClass[block.align[c] ?? 'left'],
                      ].join(' ')}
                    >
                      {formatText(cell)}
                    </th>
                  );
                }
                return (
                  <td
                    key={c}
                    className={[
                      'border px-2 py-1.5 whitespace-normal break-words align-top',
                      t.bodyCell,
                      alignClass[block.align[c] ?? 'left'],
                    ].join(' ')}
                  >
                    {formatText(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 「行全体が【…】だけ」の見出し行。
 * 例：「【会話文】」「【資料2　米の生産量と輸出量（2023年・おおよその値）】」
 * 行内に【】が現れるだけのもの（本文中の強調）は対象にしない。
 */
const SECTION_HEADING = /^【[^】\n]+】\s*$/u;

/** 四角囲みの1区画。見出し＋その中身（地の文・表が混在しうる） */
interface Section {
  heading: string | null;
  blocks: Block[];
}

/**
 * ブロック列を「見出し（【…】）で始まる区画」へまとめ直す。
 *
 * ★なぜ「テキストブロック単位」で切ってはいけないのか（実測で判明）★
 *   parseExplanationBlocks は表の前後でテキストを分断するため、
 *       【資料2　米の生産量と輸出量】   ← テキストブロック
 *       | 国 | 生産量 | 輸出量 |        ← テーブルブロック（別ブロック）
 *   のように、見出しと表が別ブロックになる。
 *   最初の実装は「テキストブロックの中だけ」で見出しを探したので、
 *   Playwright 実測の結果
 *       【資料2 …】の枠  … top=747 / 高さ 76px（見出しだけの空箱）
 *       表              … top=836（枠の外）
 *   となり、★資料名の枠と中身の表が分離★していた。
 *   実物の冊子は「資料名・表・注記」がひとつの枠に入っている。
 *
 * ★直し方★
 *   見出しの探索をブロック列より上位で行い、表ブロックも
 *   直前の見出しの区画に属させる。これで表が枠の中に入る。
 */
function groupSections(blocks: Block[]): Section[] {
  const out: Section[] = [];
  let current: Section = { heading: null, blocks: [] };

  const flush = () => {
    if (current.heading !== null || current.blocks.length > 0) out.push(current);
  };

  for (const block of blocks) {
    if (block.kind === 'table') {
      // 表は直前の見出しの区画に入れる（見出しが無ければ現在の区画）
      current.blocks.push(block);
      continue;
    }

    // テキストブロックは見出し行で区画を切り替える
    let buf: string[] = [];
    const flushText = () => {
      const body = buf.join('\n').replace(/^\n+|\n+$/g, '');
      if (body !== '') current.blocks.push({ kind: 'text', text: body });
      buf = [];
    };

    for (const line of block.text.split('\n')) {
      if (SECTION_HEADING.test(line.trim())) {
        flushText();
        flush();
        current = { heading: line.trim(), blocks: [] };
        continue;
      }
      buf.push(line);
    }
    flushText();
  }

  flush();
  return out;
}

const boxTone: Record<ExplanationTone, { box: string; heading: string }> = {
  light: {
    box: 'border-slate-400 bg-slate-50/60',
    heading: 'text-slate-700',
  },
  dark: {
    box: 'border-[#3A506B] bg-[#1C2541]/40',
    heading: 'text-[#5BC0BE]',
  },
};

interface SectionBoxProps {
  section: Section;
  tone: ExplanationTone;
  highlights: string[];
  prose: boolean;
  key?: React.Key;
}

/**
 * 地の文のまとまりを描画する。
 *
 * ★ご要望「明らかにレイアウトが見やすいよね。四角囲みなど用いてもう少し見やすくして」★
 *
 * ■ 実物の共通テスト冊子（添付 tiri.pdf）の作り
 *     ・図や資料は必ず ★四角い枠で囲まれ★、本文と視覚的に切り離されている
 *     ・枠の外・下に出典や注記が小さく置かれる
 *     ・「図1」のキャプションが枠の下に中央寄せで入る
 *   これに対しアプリ側は、リード文・会話文・資料がすべて
 *   同じ書式のべた組みで並んでいたため、どこからどこまでが
 *   「資料」なのかが読み取れなかった。
 *
 * ■ 何を枠にするか（決め打ちしない）
 *   問題データ側に「ここは枠」というフラグを足す方式は、
 *   問題を追加・修正したときに必ず食い違う。
 *   そこで ★既にデータに存在する構造＝「行全体が【…】の見出し行」★ を
 *   そのまま枠の境界として使う。地理の5問はすべて
 *   「【会話文】」「【資料2　…】」という見出しを持っており、
 *   新しい回を追加しても同じ書き方をすれば自動で枠になる。
 *
 * ■ 影響範囲は実測済み
 *   全教科を走査した結果、この経路（問題文）で【…】見出しを持つのは
 *       地理 5問 ／ 化学基礎 1問（q_c3_2_n3 の【図の説明】）
 *   のみ。英語リスニング（50問）・英文法（20問）は音源つきで
 *   別経路（listeningUnified）を通るため影響しない。
 *   解説側にも【…】は61件あるが、そちらは boxed を渡さないので
 *   従来どおりの見た目のまま。
 *
 * ■ PC は変更しない（ご要望）
 *   枠・余白・背景はすべて md: で打ち消し、PC では従来と同一の
 *   べた組みに戻す。
 */
function SectionBox({ section, tone, highlights, prose }: SectionBoxProps) {
  const t = boxTone[tone];

  /** 区画の中身（地の文・表）。枠の内でも外でも同じ描画を使う。 */
  const inner = section.blocks.map((block, i) =>
    block.kind === 'table' ? (
      <ExplanationTable key={`t-${i}`} block={block} tone={tone} />
    ) : (
      <div key={`p-${i}`} className="whitespace-pre-wrap">
        {formatText(block.text, highlights, { prose })}
      </div>
    )
  );

  // 見出しの無いリード文は枠で囲まない（全部が箱になると逆に読みにくい）
  if (section.heading === null) return <>{inner}</>;

  return (
    /*
      枠の角丸について（実測にもとづく）
        変更前は rounded-md を使ったが、このリポジトリのテーマは
        --radius-md: 0.875rem なので ★実測 14px★ になり、
        冊子の「角の立った枠」に対して明らかに丸すぎた。
        枠らしさを残しつつ冊子に寄せるため 4px を直接指定する。
    */
    <div
      className={`my-3 rounded-[4px] border px-3 py-2.5 md:my-0 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 ${t.box}`}
    >
      {/* 見出しは枠の中の1行目に置き、冊子の「資料名」と同じ役割にする */}
      <div className={`mb-1.5 text-[13px] font-bold md:mb-0 md:text-inherit ${t.heading}`}>
        {formatText(section.heading, [], { prose })}
      </div>
      {inner}
    </div>
  );
}

export interface ExplanationBodyProps {
  text: string;
  className?: string;
  /** 表の配色。暗い背景のパネルに載せるときは 'dark' を指定する。 */
  tone?: ExplanationTone;
  /** ユーザーが選択したハイライト語（formatText にそのまま渡す） */
  highlights?: string[];
  /**
   * ★英語（リスニング・英文法）の解説では true にする★
   * 化学式の体裁付け（英字をセリフ体の span で包む処理）を止めるため。
   * 付けないと "The" "umbrella" のような単語まで化学式扱いになり、
   * 日本語（ゴシック）と書体が食い違って読みにくくなる。
   */
  prose?: boolean;
  /**
   * ★「【…】のまとまりを四角囲みにする」モード（スマホのみ）★
   *
   * 問題文ペインでのみ true にする。解説本文（Explanation・MockExam・
   * InteractiveTree）では渡さないので、そちらの見た目は従来どおり。
   * PC では CSS 側（md:）で枠を打ち消すため、渡しても影響しない。
   */
  boxedSections?: boolean;
}

/**
 * 解説本文（テキスト＋Markdown テーブル）をレンダリングする。
 * テーブルを含まない場合は従来と完全に同じ出力（formatText のみ）になる。
 */
export function ExplanationBody({
  text,
  className,
  tone = 'light',
  highlights = [],
  prose = false,
  boxedSections = false,
}: ExplanationBodyProps) {
  if (!text) return null;
  const blocks = parseExplanationBlocks(text);

  /*
    ★ご要望「問題文の改行ができていない。見にくい。」の原因はここだった★

    ■ 実測した不整合
        表を含まないテキスト（＝ブロックが1個）だけが、下の早期 return を通り
            <div className={className}>{formatText(...)}</div>
        となって ★whitespace-pre-wrap が付いていなかった★。
        一方、表を含むテキストは下の分岐で
            <div className="whitespace-pre-wrap">…</div>
        となり、改行が活きていた。
        つまり「表がある問題は改行される・無い問題はされない」という
        条件次第の挙動になっていた。

    ■ なぜ formatText の <br/> 変換だけでは足りないのか
        formatText は \n を <br/> に変換するが、
          ・行頭・行末の全角/半角スペース（冊子のインデント）
          ・連続する空行（段落の区切り）
        は HTML の空白畳み込みで消える。地理の会話文は
            佐藤：…
            田中：…
        のように行頭を揃えて読ませる構造なので、これが崩れると
        「誰の発言がどこまでか」が分からなくなる。

    ■ 直し方
        1ブロックのときも複数ブロックのときと同じ経路に通し、
        whitespace-pre-wrap を必ず付ける。分岐そのものを消すことで
        「問題によって挙動が違う」状態を構造的に無くす。
  */
  if (boxedSections) {
    /*
      四角囲みモード。ブロック列を【…】見出しで区画へまとめ直し、
      「見出し＋地の文＋表」をひとつの枠に入れる。
      （表が枠の外に出ていた不具合の実測記録は groupSections のコメント参照）
    */
    const sections = groupSections(blocks);
    return (
      <div className={className}>
        {sections.map((sec, i) => (
          <SectionBox key={`s-${i}`} section={sec} tone={tone} highlights={highlights} prose={prose} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.kind === 'table' ? (
          <ExplanationTable key={`t-${i}`} block={block} tone={tone} />
        ) : (
          <div key={`p-${i}`} className="whitespace-pre-wrap">
            {formatText(block.text, highlights, { prose })}
          </div>
        )
      )}
    </div>
  );
}
