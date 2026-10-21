/**
 * 解説本文の「表（Markdown の |..|）とテキストの切り分け」と「見出しごとのボックス分割」（C-20）。
 * ExplanationBody.tsx から移した。中身は1文字も変えていない（描画を持たない純粋な処理だけ）。
 * parseExplanationBlocks は ExplanationBody.tsx からも再エクスポートしている。
 */
/** 解説の地色（ExplanationBody.tsx からも再エクスポートしている） */
export type ExplanationTone = 'light' | 'dark';

/**
 * （以下は ExplanationBody.tsx の冒頭にあった説明をそのまま残している）
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

export type Alignment = 'left' | 'center' | 'right';

export interface TableBlock {
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

/**
 * 「行全体が【…】だけ」の見出し行。
 * 例：「【会話文】」「【資料2　米の生産量と輸出量（2023年・おおよその値）】」
 * 行内に【】が現れるだけのもの（本文中の強調）は対象にしない。
 */
const SECTION_HEADING = /^【[^】\n]+】\s*$/u;

/** 四角囲みの1区画。見出し＋その中身（地の文・表が混在しうる） */
export interface Section {
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
export function groupSections(blocks: Block[]): Section[] {
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

export const boxTone: Record<ExplanationTone, { box: string; heading: string }> = {
  light: {
    box: 'border-slate-400 bg-slate-50/60',
    heading: 'text-slate-700',
  },
  dark: {
    box: 'border-[#3A506B] bg-[#1C2541]/40',
    heading: 'text-[#5BC0BE]',
  },
};
