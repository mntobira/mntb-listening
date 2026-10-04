/**
 * ===================================================================
 * 英語リスニング 第4問A・第4問B・第5問・第6問A・第6問B ― 類題集（各15セット）
 * ===================================================================
 *
 * ■ 出典
 *   配布 ZIP「listening_q4_q5_q6_all_2026-09-06_v2.zip」。
 *   問題データは `src/data/listeningSets/listening-q{4,5,6}.json`
 *   （配布側の単一データソース `reference/sets/*.json` から機械生成されたもの）
 *   をそのまま置き、このファイルが読み込み時にアプリの形（ListeningProblem）へ
 *   組み替える。★JSON 自体には手を入れない★
 *     ・配布側は「スクリプトに根拠表現が文字どおり存在するか」などを機械検査した
 *       上で配っている。ここで書き換えると検査済みの保証が消える。
 *     ・録り直し・差し替えが来たときに JSON を置き換えるだけで済む。
 *
 * ■ 音声・画像
 *   public/listening_q4/ ・ public/listening_q5/ ・ public/listening_q6/ に
 *   配布ファイルをファイル名そのままで置いている。
 *   例外は「複数の発話を1つの設問で聞く」2か所で、本番どおり1本に連結した：
 *     ・第4問B 問26 … set NN_4B_s1〜s4 → setNN_4B.mp3
 *     ・第5問 問32  … q5setNN_q32_A/B  → q5setNN_q32.mp3
 *   （scripts/concat_listening_audio.sh。元の個別ファイルは配布 ZIP 側に残る）
 *
 * ■ アプリの形への対応づけ（重要な設計判断）
 *
 *   共通テストの第4〜6問は「1本の音声に複数の小問がつく」構成なので、
 *   第1問〜第3問（1問＝1音源）とは単位が違う。
 *   そこで「音声1本 ＝ 1ステップ（1画面）」とし、そのステップの中に
 *   複数の解答欄を並べる（listeningSteps.ts の buildListeningSteps が
 *   audioTracks の subIds を見て小問をまとめる）。
 *
 *   | 大問 | ステップ（音源）        | 解答欄                    | 採点の単位                    |
 *   |------|------------------------|---------------------------|-------------------------------|
 *   | 4A   | 問18〜21（前半・1本）  | 4つ（⑤択 or ④択）        | 完答4点 → allOrNothingGroup   |
 *   |      | 問22〜25（後半・1本）  | 4つ（⑥択共有）           | 各1点                         |
 *   | 4B   | 問26（4人ぶん・1本）   | 1つ（④択）               | 4点                           |
 *   | 5    | 問27〜31（講義・1本）  | 5つ（④択＋⑥択共有×4）   | 問27=3点／28・29 完答／30・31 完答 |
 *   |      | 問32（A・B・1本）      | 1つ（④択）               | 4点                           |
 *   |      | 問33（会話・1本）      | 1つ（④択）               | 5点                           |
 *   | 6A   | 問34・35（対話・1本）  | 2つ（④択）               | 各3点                         |
 *   | 6B   | 問36・37（会話・1本）  | 2つ（④択・問37は図が選択肢）| 各4点                       |
 *
 *   「完答」の設問は subQuestion に `allOrNothingGroup` を付け、
 *   採点（scoring.ts）で「グループ全員が正解のときだけ正解数に数える」。
 *   本番の配点（12・16・14点）と、アプリの得点（正解1問100点）は別物なので、
 *   本番配点はブリーフィングと解説に文字で載せ、アプリの得点は
 *   「完答グループ＝1問扱い」で数える。
 *
 * ■ 選択肢本文の持たせ方
 *   既存の第1問Aは「options はマークだけ・本文は problem.text から抽出」だったが、
 *   第4問以降は6択共有・図が選択肢・英文条件つきなど形が多いので、
 *   小問に `optionTexts`（本文）と `optionImages`（図）を直接持たせる。
 *   listeningOptions.ts の buildListeningOptionTexts はこれを優先して使う。
 *
 * ■ 1回読み
 *   全大問 readCount: 1。さらに `playOnce: true` を問題に付け、
 *   本番モードでは再生を1回に制限する（ListeningAudioPlayer）。
 */

import type { ListeningAudioTrack, ListeningProblem } from './englishListeningQ1AProblems';
import q4Raw from './listeningSets/listening-q4.json';
import q5Raw from './listeningSets/listening-q5.json';
import q6Raw from './listeningSets/listening-q6.json';
import durationsRaw from './listeningSets/listening-q4-6-durations.json';

// ---------------------------------------------------------------------
// 共通の小さな道具
// ---------------------------------------------------------------------

const MARKS = ['①', '②', '③', '④', '⑤', '⑥'];
const mark = (n1: number): string => MARKS[n1 - 1] ?? `(${n1})`;
const marks = (count: number): string[] => MARKS.slice(0, count);

const Q4_DIR = '/listening_q4/';
const Q5_DIR = '/listening_q5/';
const Q6_DIR = '/listening_q6/';

/** 配布データのパス（`audio/xxx.mp3` や `xxx.mp3`）を public 配下の絶対パスにする */
function asset(dir: string, file: string): string {
  return dir + String(file).replace(/^(audio|images)\//u, '');
}

/** 難易度表記 → detailedExplanation.difficulty */
function difficultyOf(levelJa: string): number {
  if (levelJa.includes('易')) return 2;
  if (levelJa.includes('難')) return 4;
  return 3;
}

/** 正答率の目安（実データが無いので難易度から機械的に置く・表示用） */
function rateOf(levelJa: string, idx: number): number {
  const base = { 2: 62, 3: 52, 4: 40 }[difficultyOf(levelJa)] ?? 52;
  return base - (idx % 3) * 3;
}

/** 配布データの keyPhrases（英語のみ）を track の形（意味つき）にする */
function phrases(list: unknown): { phrase: string; meaning: string }[] {
  if (!Array.isArray(list)) return [];
  return list.map((p) => ({ phrase: String(p), meaning: '' }));
}

/** 話者名つき会話を 'Who: text' の行にまとめる */
function conversationScript(conv: { who: string; text: string }[]): string {
  return conv.map((c) => `${c.who}: ${c.text}`).join('\n');
}

/** 表（headers/rows）を Markdown テーブルにする。空所は「( 22 )」の形で出す */
function tableMarkdown(table: { headers: string[]; rows: (string | { blank: number })[][] }): string {
  const cell = (c: string | { blank: number }) =>
    typeof c === 'string' ? c : `( ${c.blank} )`;
  const head = `| ${table.headers.join(' | ')} |`;
  const sep = `| ${table.headers.map(() => '---').join(' | ')} |`;
  const body = table.rows.map((r) => `| ${r.map(cell).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

const SEP = '────────────────────';

/**
 * 第4問以降の小問に付ける、リスニング固有の任意フィールド。
 * 既存の subQuestion（id/label/type/options/correctAnswer …）に足すだけなので
 * 化学など他教科の処理は一切影響を受けない。
 */
export interface ListeningSubExtras {
  /** 選択肢の本文（options と同じ並び）。マークだけの options に添える */
  optionTexts?: string[];
  /** 選択肢が図そのもの（第6問 問37）。options と同じ並びの画像パス */
  optionImages?: string[];
  /** 完答グループ。同じ値の小問が全部正解のときだけ正解として数える */
  allOrNothingGroup?: string;
  /** 本番の配点（表示用） */
  examPoints?: number;
  /** 解答欄の見出し（例：'1st step' / 'Monday'）。無ければ label から作る */
  blankHint?: string;
  /** 解説（この小問だけの一言） */
  explainJa?: string;
  /** 誤答の切り方（配布データの distractors） */
  distractors?: { no: number; why: string; type?: string }[];
}

// ---------------------------------------------------------------------
// 第4問A（問18〜25）・第4問B（問26）
// ---------------------------------------------------------------------

type Q4Set = (typeof q4Raw)['sets'][number];

function buildQ4A(set: Q4Set): ListeningProblem {
  const no = set.no;
  const front = set.partA.front;
  const back = set.partA.back;
  const frontId = `q_el4_A_set${no}_front`;
  const frontSubIds = front.blanks.map((b) => `q_el4_A_set${no}_${b.no}`);
  const backSubIds = back.blanks.map((b) => `q_el4_A_set${no}_${b.no}`);

  const tracks: (ListeningAudioTrack & { subIds?: string[] })[] = [
    {
      subId: frontSubIds[0],
      subIds: frontSubIds,
      label: '問18〜21',
      hint: front.situation,
      material: {
        title: front.worksheetTitle,
        instruction: front.type === 'sequence'
          ? '①〜⑤から4つを順に選びます。1枚は使いません。'
          : 'グラフの各空欄に当てはまる系列を選びます。',
        images: [{ src: asset(Q4_DIR, front.image), caption: front.worksheetTitle,
          minWidth: front.type === 'sequence' ? 640 : 600 }],
        sections: [{ rows: front.blanks.map(b => `(${b.no}) ${b.label}`) }],
      },
      audioUrl: asset(Q4_DIR, front.audio),
      script: front.script,
      translation: '',
      keyPhrases: phrases(front.keyPhrases),
    },
    {
      subId: backSubIds[0],
      subIds: backSubIds,
      label: '問22〜25',
      hint: back.situation,
      material: {
        title: back.worksheetTitle,
        instruction: '①〜⑥から各空欄に1つ選びます。2つは使いません。',
        table: {
          headers: back.table.headers,
          rows: back.table.rows.map(row => row.map(cell =>
            typeof cell === 'string' ? cell : `(${cell.blank})`)),
        },
      },
      audioUrl: asset(Q4_DIR, back.audio),
      script: back.script,
      translation: '',
      keyPhrases: phrases(back.keyPhrases),
    },
  ];

  const frontChoiceLines = front.choices.map((c, i) => `${mark(i + 1)} ${c}`).join('\n');
  const backChoiceLines = back.choices.map((c, i) => `${mark(i + 1)} ${c}`).join('\n');

  const frontKind =
    front.type === 'sequence'
      ? 'イラストの並べ替え（①〜⑤のうち4つを順に選ぶ。1枚は使わない）'
      : 'グラフの完成（①〜④の系列名を各空欄に1つずつ）';

  const text = [
    `第${no}回　第4問 A（問18〜25・1回読み）　【難易度：${set.levelJa}】`,
    '',
    '第4問 A は問18から問25までの8問です。話を聞き、それぞれの問いの答えとして最も適切なものを、選択肢から選びなさい。問題文と図表を読む時間が与えられた後、音声が流れます。',
    '',
    '【本番の配点】問18〜21 は完答で4点（部分点なし）／問22〜25 は各1点（合計8点）',
    '',
    SEP,
    `■ 問18〜21　${front.worksheetTitle}`,
    `状況：${front.situation}`,
    `形式：${frontKind}`,
    frontChoiceLines,
    '',
    SEP,
    `■ 問22〜25　${back.worksheetTitle}`,
    `状況：${back.situation}`,
    '形式：表の空欄を埋める（①〜⑥の6つから各空欄に1つ。2つは使わない）',
    tableMarkdown(back.table as any),
    backChoiceLines,
  ].join('\n');

  const frontSubs = front.blanks.map((b, i) => ({
    id: frontSubIds[i],
    label: `問${b.no} ${b.label}`,
    type: 'multiple_choice',
    options: marks(front.choices.length),
    correctAnswer: mark(b.answer),
    correctAnswerRate: rateOf(set.levelJa, i),
    imageUrl: asset(Q4_DIR, front.image),
    imageCaption: `問18〜21 のワークシート（${front.worksheetTitle}）`,
    optionTexts: front.choices,
    allOrNothingGroup: `${frontId}`,
    examPoints: i === 0 ? front.points : 0,
    blankHint: b.label,
    explainJa: front.explain,
    detailedExplanation: {
      theme: front.type === 'sequence' ? '順序標識（First / Next / Then / Finally）を追って並べる' : '数値の推移・増減の表現をグラフの線と対応させる',
      type: front.type === 'sequence' ? 'イラスト並べ替え型' : 'グラフ完成型',
      difficulty: difficultyOf(set.levelJa),
      steps: [
        '① 音声の前にワークシートの見出しと選択肢を読み、何を並べる／埋めるのかを決める',
        '② 順序・増減を表す語（first / next / finally / rise / drop）だけを狙って聞く',
        '③ 4つ全部が合っていて初めて得点（完答）。1つでも迷ったら消去法で確定させる',
        '④ 並べ替え型は「使わない1枚」が音声で明確に否定される。その一言を逃さない',
      ],
    },
  }));

  const backSubs = back.blanks.map((b, i) => {
    const row = (back.table.rows as any[]).find((r) =>
      r.some((c: any) => typeof c === 'object' && c && c.blank === b.no),
    );
    const rowHead = row ? String(row[0]) : '';
    return {
      id: backSubIds[i],
      label: `問${b.no} ${rowHead}`,
      type: 'multiple_choice',
      options: marks(back.choices.length),
      correctAnswer: mark(b.answer),
      correctAnswerRate: rateOf(set.levelJa, i + 1),
      imageUrl: asset(Q4_DIR, back.image),
      imageCaption: `問22〜25 の表（${back.worksheetTitle}）`,
      optionTexts: back.choices,
      examPoints: back.pointsEach,
      blankHint: rowHead,
      explainJa: back.explain,
      detailedExplanation: {
        theme: '料理名・場所などを直接言わず内容で説明する言い換えを表に戻す',
        type: '表完成型（6択共有）',
        difficulty: difficultyOf(set.levelJa),
        steps: [
          '① 表の見出し（曜日・場所など）を先に読み、音声がその順に進むと予想する',
          '② 選択肢6つを意味で2〜3グループに分けておく（肉／魚／野菜 など）',
          '③ 言い換え（fried cod → Fish and chips）を聞いた瞬間に埋める',
          '④ 使わない2つは「別の日に」「今回は無い」と否定される。否定語の直後を聞く',
        ],
      },
    };
  });

  const explanation = [
    `第${no}回（難易度：${set.levelJa}）第4問 A の解説です。`,
    '',
    `問18　正解は ${mark(front.blanks[0].answer)}`,
    `問18〜21 の正解：${front.blanks.map((b) => `(${b.no}) ${mark(b.answer)}`).join('　')}${front.type === 'sequence' ? `　※使わない選択肢：${mark((front as any).dummy)}` : ''}`,
    `スクリプト：${front.script}`,
    front.explain,
    ...front.blanks.slice(1).map((b) => `\n問${b.no}　正解は ${mark(b.answer)}\n上の問18の解説を参照（4問完答で4点）。`),
    '',
    ...back.blanks.map((b, i) =>
      [
        `問${b.no}　正解は ${mark(b.answer)}`,
        i === 0 ? `スクリプト：${back.script}` : '',
        i === 0 ? back.explain : '上の問22の解説を参照。',
        i === 0 && back.unused?.length
          ? `使わない選択肢：${back.unused.map((u: number) => `${mark(u)} ${back.choices[u - 1]}`).join('、')}`
          : '',
        '',
      ]
        .filter((l) => l !== '')
        .join('\n'),
    ),
  ].join('\n');

  return {
    id: `q_el4_A_set${no}`,
    category: `第${no}回 ${front.type === 'sequence' ? 'イラスト並べ替え' : 'グラフ完成'}＋表の完成（${set.levelJa}）`,
    readCount: 1,
    audioTracks: tracks as ListeningAudioTrack[],
    text,
    subQuestions: [...frontSubs, ...backSubs],
    explanation,
    surroundingKnowledge: [
      '第4問 A は1回読み。ワークシート（図・表）を先に読み、音声が流れる順番を予想してから聞く。',
      '問18〜21 は完答で4点。並べ替え型は「使わない1枚」が音声で否定される。',
      '問22〜25 は6つの選択肢を共有し、2つは使わない。料理名・場所名は直接言われず、内容で言い換えられる。',
      '順序標識：To start off / First / Next / After that / When … / Finally。',
      '増減の表現：rise / go up / increase ／ drop / fall / decrease ／ stay flat / remain the same。',
    ],
    deepDiveTopics: [
      '本番はワークシートを読む時間が事前に与えられる。その時間で「選択肢を分類する」練習を単独で行う。',
      '4問完答の設問は、1つでも自信が無ければ残りの消去法で確定させる。',
    ],
    playOnce: true,
  } as ListeningProblem;
}

function buildQ4B(set: Q4Set): ListeningProblem {
  const no = set.no;
  const pb = set.partB;
  const subId = `q_el4_B_set${no}_26`;
  const speakerScripts = pb.scripts.map((s: string, i: number) => `話者${i + 1}: ${s}`).join('\n');

  const track: ListeningAudioTrack & { subIds?: string[] } = {
    subId,
    subIds: [subId],
    label: '問26',
    hint: pb.situation,
    material: {
      title: 'Conditions',
      sections: [{ rows: pb.conditionsEn }],
      table: { headers: ['Speaker', 'A', 'B', 'C'],
        rows: pb.choices.map((choice, i) => [`${mark(i + 1)} ${choice}`, '', '', '']) },
    },
    audioUrl: asset(Q4_DIR, `set${String(no).padStart(2, '0')}_4B.mp3`),
    script: speakerScripts,
    turns: pb.scripts.map((s: string, i: number) => ({ who: `${i + 1}`, text: s })),
    translation: '',
    keyPhrases: phrases(pb.keyPhrases),
  };

  const text = [
    `第${no}回　第4問 B（問26・1回読み）　【難易度：${set.levelJa}】`,
    '',
    '第4問 B は問26の1問です。四人の説明を聞き、問いの答えとして最も適切なものを、四つの選択肢（①〜④）のうちから一つ選びなさい。メモを取ってもかまいません。状況と条件を読む時間が与えられた後、音声が流れます。',
    '',
    '【本番の配点】4点',
    '',
    SEP,
    '■ 問26',
    `状況：${pb.situation}`,
    'Conditions:',
    ...pb.conditionsEn,
    '',
    pb.question,
    ...pb.choices.map((c: string, i: number) => `${mark(i + 1)} ${c}`),
  ].join('\n');

  const explanation = [
    `第${no}回（難易度：${set.levelJa}）第4問 B の解説です。`,
    '',
    `問26　正解は ${mark(pb.answer)}`,
    `スクリプト：${speakerScripts}`,
    `条件（和訳）：${pb.conditionsJa.join('　')}`,
    '条件表：',
    '| 選択肢 | A | B | C |',
    '| --- | --- | --- | --- |',
    ...pb.choices.map(
      (c: string, i: number) =>
        `| ${mark(i + 1)} ${c}（${pb.choicesJa[i]}） | ${pb.matrix[i].map((ok: boolean) => (ok ? '○' : '×')).join(' | ')} |`,
    ),
    pb.explain,
  ].join('\n');

  return {
    id: `q_el4_B_set${no}`,
    category: `第${no}回 条件に合う選択肢を選ぶ（${set.levelJa}）`,
    readCount: 1,
    audioTracks: [track as ListeningAudioTrack],
    text,
    subQuestions: [
      {
        id: subId,
        label: `問26 ${pb.question}`,
        type: 'multiple_choice',
        options: marks(4),
        correctAnswer: mark(pb.answer),
        correctAnswerRate: rateOf(set.levelJa, 0),
        imageUrl: asset(Q4_DIR, pb.image),
        imageCaption: '問26 の条件メモ表',
        optionTexts: pb.choices,
        examPoints: pb.points,
        explainJa: pb.explain,
        detailedExplanation: {
          theme: '3つの条件をすべて満たす選択肢は1つだけ。各話者の発話で×が付く条件を1つ見つければ切れる',
          type: '条件照合型（4人の発話）',
          difficulty: difficultyOf(set.levelJa),
          steps: [
            '① 音声の前に条件 A・B・C を読み、それぞれ「数字」「有無」など何を聞くかを決める',
            '② 話者ごとに A/B/C の欄へ ○×をメモする。1つ×が付いたらその話者は候補から外れる',
            '③ but / though / the one problem is の後ろに×の根拠が来る',
            '④ 最後まで○が3つ残った1人が答え。全部聞き終えてから選ぶ',
          ],
        },
      },
    ],
    explanation,
    surroundingKnowledge: [
      '第4問 B は4人の発話を1回だけ聞き、条件をすべて満たす1つを選ぶ。条件は英語で印刷される。',
      '本番では条件表（A/B/C）にメモを取れる。○×だけを書く練習をする。',
      '「安心させる一言」の後に but が来て条件を外す形が定番（we could bring tea bags … but we\'d still have to buy）。',
    ],
    deepDiveTopics: [
      '条件表の A/B/C は「費用」「人数」「時間」のような数値条件が多い。数字と単位（yen / people / minutes）を聞き分ける。',
    ],
    playOnce: true,
  } as ListeningProblem;
}

// ---------------------------------------------------------------------
// 第5問（問27〜33）
// ---------------------------------------------------------------------

type Q5Set = (typeof q5Raw)['sets'][number];

function worksheetText(ws: Q5Set['worksheet']): string {
  const lines: string[] = [`【${ws.title}】`, ws.lead.text, ''];
  for (const block of ws.blocks) {
    lines.push(`■ ${block.heading}`);
    for (const row of block.rows) {
      const label = (row as any).label ? `${(row as any).label} ` : '';
      lines.push(`　・${label}${row.text}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function buildQ5(set: Q5Set): ListeningProblem {
  const no = set.no;
  const pad = String(no).padStart(2, '0');
  const idOf = (q: number) => `q_el5_set${no}_${q}`;
  const lectureIds = [27, 28, 29, 30, 31].map(idOf);

  const tracks: (ListeningAudioTrack & { subIds?: string[] })[] = [
    {
      subId: idOf(27),
      subIds: lectureIds,
      label: '講義（問27〜31）',
      hint: set.situation,
      material: {
        title: set.worksheet.title,
        instruction: '問28〜31は同じ選択肢を2回以上使ってもかまいません。',
        sections: [
          { rows: [set.worksheet.lead.text] },
          ...set.worksheet.blocks.map(block => ({ heading: block.heading,
            rows: block.rows.map(row => `${'label' in row ? row.label + ' ' : ''}${row.text}`) })),
        ],
      },
      audioUrl: asset(Q5_DIR, set.lecture.audio),
      script: set.lecture.script,
      translation: '',
      keyPhrases: phrases([...(set.q27.keyPhrases || []), ...(set.q2831.keyPhrases || [])]),
    },
    {
      subId: idOf(32),
      subIds: [idOf(32)],
      label: '問32',
      hint: 'グループのメンバー A・B の発言',
      material: { title: '問32　発言と講義の内容', sections: [{ rows: [
        'A・Bの発言を聞き、それぞれが講義の内容と一致するか判断してください。',
      ] }] },
      audioUrl: asset(Q5_DIR, `q5set${pad}_q32.mp3`),
      script: `A: ${set.q32.statements[0]}\nB: ${set.q32.statements[1]}`,
      turns: [
        { who: 'A', text: set.q32.statements[0] },
        { who: 'B', text: set.q32.statements[1] },
      ],
      translation: '',
      keyPhrases: phrases(set.q32.keyPhrases),
    },
    {
      subId: idOf(33),
      subIds: [idOf(33)],
      label: '問33',
      hint: '追加の会話と図表',
      material: { title: set.q33.graph.title,
        images: [{ src: asset(Q5_DIR, set.q33.image), caption: set.q33.graph.title, minWidth: 600 }] },
      audioUrl: asset(Q5_DIR, set.q33.audio),
      script: conversationScript(set.q33.conversation),
      turns: set.q33.conversation,
      translation: '',
      keyPhrases: phrases(set.q33.keyPhrases),
    },
  ];

  const q27ChoiceLines = set.q27.choices.map((c, i) => `${mark(i + 1)} ${c}`).join('\n');
  const q2831ChoiceLines = set.q2831.choices.map((c, i) => `${mark(i + 1)} ${c}`).join('\n');
  const q33ChoiceLines = set.q33.choices.map((c, i) => `${mark(i + 1)} ${c}`).join('\n');

  const text = [
    `第${no}回　第5問（問27〜33・1回読み）　【難易度：${set.levelJa}】`,
    '',
    '第5問は問27から問33までの7問です。最初に講義を聞き、問27から問32に答えなさい。次に続きを聞き、問33に答えなさい。状況・ワークシート・図表を読む時間が与えられた後、音声が流れます。',
    '',
    '【本番の配点】問27 3点／問28・29 完答2点／問30・31 完答2点／問32 4点／問33 5点（合計16点）',
    '',
    `状況：${set.situation}`,
    set.activities.act1,
    set.activities.act2,
    set.activities.act3,
    '',
    SEP,
    '■ 問27〜31　ワークシート',
    worksheetText(set.worksheet),
    '',
    '■ 問27 の選択肢（4つから1つ）：',
    q27ChoiceLines,
    '',
    '■ 問28〜31 の選択肢（六つの選択肢のうちから一つずつ選びなさい。同じ選択肢を2回以上使ってもかまいません。）：',
    q2831ChoiceLines,
    '',
    SEP,
    '■ 問32　グループのメンバー A・B の発言が講義の内容と一致するかを判定する',
    ...set.q32.choicesJa.map((c, i) => `${mark(i + 1)} ${c}`),
    '',
    SEP,
    '■ 問33　講義・追加の会話・図表を踏まえ、講義全体から言えることを選ぶ',
    `図表：${set.q33.graph.title}`,
    q33ChoiceLines,
  ].join('\n');

  const wsImage = asset(Q5_DIR, set.worksheet.image);
  const diff = difficultyOf(set.levelJa);

  const q27Sub = {
    id: idOf(27),
    label: `問27 ${set.worksheet.lead.text}`,
    type: 'multiple_choice',
    options: marks(4),
    correctAnswer: mark(set.q27.answer),
    correctAnswerRate: rateOf(set.levelJa, 0),
    imageUrl: wsImage,
    imageCaption: `ワークシート（${set.worksheet.title}）`,
    optionTexts: set.q27.choices,
    examPoints: set.q27.points,
    blankHint: '(27) 講義の大意',
    explainJa: set.q27.explain,
    distractors: set.q27.distractors,
    detailedExplanation: {
      theme: '冒頭の定義文＝講義の大意。導入の1〜2文を聞き逃さない',
      type: '大意把握型',
      difficulty: diff,
      steps: [
        '① ワークシートの冒頭文（(27) の入る文）を先に読み、「何の定義か」を意識する',
        '② 講義の冒頭 Today we look at … の直後に答えが来る',
        '③ 誤答は「年数」「地域」「条件」を1か所だけずらしている。数字と限定語を聞く',
      ],
    },
  };

  const blankRow = (no2: number) => {
    for (const block of set.worksheet.blocks) {
      for (const row of block.rows) {
        if ((row as any).blank === no2) return { heading: block.heading, row };
      }
    }
    return null;
  };

  const q2831Subs = set.q2831.blanks.map((b, i) => {
    const found = blankRow(b.no);
    const rowText = found ? `${(found.row as any).label ? `${(found.row as any).label} ` : ''}${found.row.text}` : '';
    const pairIdx = set.q2831.pairs.findIndex((p) => p.includes(b.no));
    return {
      id: idOf(b.no),
      label: `問${b.no} ${rowText}`,
      type: 'multiple_choice',
      options: marks(6),
      correctAnswer: mark(b.answer),
      correctAnswerRate: rateOf(set.levelJa, i + 1),
      imageUrl: wsImage,
      imageCaption: `ワークシート（${set.worksheet.title}）`,
      optionTexts: set.q2831.choices,
      allOrNothingGroup: `q_el5_set${no}_pair${pairIdx}`,
      examPoints: pairIdx >= 0 && set.q2831.pairs[pairIdx][0] === b.no ? set.q2831.pointsPerPair : 0,
      blankHint: rowText,
      explainJa: `${set.q2831.explain}\n（${b.no}）音声では「${b.heard}」。${b.collocationNote}`,
      detailedExplanation: {
        theme: `言い換えを1段はさむ：音声の「${b.heard}」→ ワークシートの語`,
        type: 'ワークシート完成型（6択共有・2問完答）',
        difficulty: diff,
        steps: [
          '① 空所の前後の語（highly / is / be）から、入る語の品詞と形を先に決める',
          '② 聞こえた語がそのまま選択肢にあっても飛びつかない（講義に出た語の直訳はダミー）',
          '③ 「同じ選択肢を2回以上使ってもかまいません」＝個数で消去法をしない',
          `④ 問${set.q2831.pairs[pairIdx]?.join('・')} は2問セットで完答2点。片方だけ合っても0点`,
        ],
      },
    };
  });

  const q32Sub = {
    id: idOf(32),
    label: '問32 A・B の発言は講義の内容と一致するか',
    type: 'multiple_choice',
    options: marks(4),
    correctAnswer: mark(set.q32.answer),
    correctAnswerRate: rateOf(set.levelJa, 2),
    optionTexts: set.q32.choicesJa,
    examPoints: set.q32.points,
    explainJa: set.q32.explain,
    detailedExplanation: {
      theme: '結論が正しくても「理由」がすり替わっていれば不一致',
      type: '内容一致判定型（A・B の2発言）',
      difficulty: diff,
      steps: [
        '① 発言は各1文・9〜13語。「主張＋理由」の形で聞き、理由が講義と同じかを見る',
        '② A・B それぞれに ○× を付け、○○=③ ○×=① ×○=② ××=④ に変換する',
        '③ 講義に無い因果関係（because / mainly）を作った発言は×',
      ],
    },
  };

  const q33Sub = {
    id: idOf(33),
    label: `問33 講義と会話、図表から言えること`,
    type: 'multiple_choice',
    options: marks(4),
    correctAnswer: mark(set.q33.answer),
    correctAnswerRate: rateOf(set.levelJa, 3),
    imageUrl: asset(Q5_DIR, set.q33.image),
    imageCaption: `問33 の図表（${set.q33.graph.title}）`,
    optionTexts: set.q33.choices,
    examPoints: set.q33.points,
    explainJa: set.q33.explain,
    distractors: set.q33.distractors,
    detailedExplanation: {
      theme: '講義＋会話＋図表の3点を統合。図表の最大・最小に飛びつく選択肢がダミー',
      type: '統合推論型（図表あり）',
      difficulty: diff,
      steps: [
        '① 音声の前に図表のタイトル・軸・最大最小を読んでおく',
        '② 会話の最後の1文（So … / Exactly …）が結論になりやすい',
        '③ 選択肢は「因果の捏造」「逆」「極端な一般化」で切る',
      ],
    },
  };

  const explanation = [
    `第${no}回（難易度：${set.levelJa}）第5問の解説です。講義テーマ：${set.topic}`,
    '',
    `問27　正解は ${mark(set.q27.answer)}`,
    `スクリプト：${set.lecture.script}`,
    set.q27.explain,
    ...set.q27.distractors.map((d) => `${mark(d.no)}：${d.why}`),
    '',
    ...set.q2831.blanks.map((b, i) =>
      [
        `問${b.no}　正解は ${mark(b.answer)}`,
        `音声では「${b.heard}」→ ワークシートでは「${set.q2831.choices[b.answer - 1]}」。${b.collocationNote}`,
        i === 0 ? set.q2831.explain : '',
        i === 0
          ? `結果的に使わない選択肢：${set.q2831.unused.length ? set.q2831.unused.map((u) => `${mark(u)} ${set.q2831.choices[u - 1]}`).join('、') : '（なし）'}`
          : '',
        '',
      ]
        .filter((l) => l !== '')
        .join('\n'),
    ),
    `問32　正解は ${mark(set.q32.answer)}`,
    `スクリプト：A: ${set.q32.statements[0]}\nB: ${set.q32.statements[1]}`,
    `A：${set.q32.matches[0] ? '一致' : '不一致'}／B：${set.q32.matches[1] ? '一致' : '不一致'}`,
    set.q32.explain,
    '',
    `問33　正解は ${mark(set.q33.answer)}`,
    `スクリプト：${conversationScript(set.q33.conversation)}`,
    `図表「${set.q33.graph.title}」：${set.q33.graph.series.map((s) => `${s.name} ${s.value}`).join('／')}`,
    set.q33.explain,
    ...set.q33.distractors.map((d) => `${mark(d.no)}：${d.why}`),
  ].join('\n');

  return {
    id: `q_el5_set${no}`,
    category: `第${no}回 ${set.topic}（${set.levelJa}）`,
    readCount: 1,
    audioTracks: tracks as ListeningAudioTrack[],
    text,
    subQuestions: [q27Sub, ...q2831Subs, q32Sub, q33Sub],
    explanation,
    surroundingKnowledge: [
      '第5問は講義（約270〜280語・約2分）を1回だけ聞き、ワークシートを完成させる。',
      '問28〜31 は「聞こえた語がそのまま入ることはほぼ無い」。必ず言い換えを1段はさむ（common → widespread など）。',
      '問28・29 と 問30・31 はそれぞれ2問セットで完答2点。片方だけ合っていても0点。',
      '問32 は A・B の発言が講義と一致するかを4通り（Aのみ／Bのみ／両方／どちらも）で判定する。',
      '問33 は講義・追加の会話・図表の3つを統合して初めて解ける。図表の最大・最小に飛びつかない。',
    ],
    deepDiveTopics: [
      '空所の前後の語（highly ___ / is ___ / be ___ for）から品詞と語形を決める習慣をつける。',
      '講義に出た語の直訳（experimenting → experimental）は典型的なダミー。',
    ],
    playOnce: true,
  } as ListeningProblem;
}

// ---------------------------------------------------------------------
// 第6問A（問34・35）・第6問B（問36・37）
// ---------------------------------------------------------------------

type Q6Set = (typeof q6Raw)['sets'][number];

function buildQ6A(set: Q6Set): ListeningProblem {
  const no = set.no;
  const pa = set.partA;
  const id34 = `q_el6_A_set${no}_34`;
  const id35 = `q_el6_A_set${no}_35`;
  const script = conversationScript(pa.conversation);

  const track: ListeningAudioTrack & { subIds?: string[] } = {
    subId: id34,
    subIds: [id34, id35],
    label: '問34・35',
    hint: pa.situation,
    material: { title: '問34・35　状況と問い', sections: [
      { rows: [pa.situation] },
      { heading: '問34', rows: [pa.q34.prompt] },
      { heading: '問35', rows: [pa.q35.prompt] },
    ] },
    audioUrl: asset(Q6_DIR, pa.audio),
    script,
    turns: pa.conversation,
    translation: '',
    keyPhrases: phrases(pa.q34.keyPhrases),
  };

  const text = [
    `第${no}回　第6問 A（問34・35・1回読み）　【難易度：${set.levelJa}】`,
    '',
    '第6問 A は問34・問35の2問です。二人の対話を聞き、それぞれの問いの答えとして最も適切なものを、四つの選択肢（①〜④）のうちから一つずつ選びなさい。状況と問いを読む時間が与えられた後、音声が流れます。',
    '',
    '【本番の配点】問34 3点／問35 3点',
    '',
    `状況：${pa.situation}`,
    '',
    SEP,
    `■ 問34　${pa.q34.prompt}`,
    ...pa.q34.choices.map((c, i) => `${mark(i + 1)} ${c}`),
    '',
    SEP,
    `■ 問35　${pa.q35.prompt}`,
    ...pa.q35.choices.map((c, i) => `${mark(i + 1)} ${c}`),
  ].join('\n');

  const diff = difficultyOf(set.levelJa);

  const explanation = [
    `第${no}回（難易度：${set.levelJa}）第6問 A の解説です。`,
    '',
    `問34　正解は ${mark(pa.q34.answer)}`,
    `スクリプト：${script}`,
    `音声では「${pa.q34.heard}」と言われ、選択肢では言い換えられています。`,
    pa.q34.explain,
    ...pa.q34.distractors.map((d) => `${mark(d.no)}：${d.why}`),
    '',
    `問35　正解は ${mark(pa.q35.answer)}`,
    ...pa.q35.requires.map((r) => `・${r.cond}　←「${r.line}」`),
    pa.q35.explain,
    ...pa.q35.distractors.map((d) => `${mark(d.no)}：${d.why}`),
  ].join('\n');

  return {
    id: `q_el6_A_set${no}`,
    category: `第${no}回 ${set.topic.split('／')[0]}（${set.levelJa}）`,
    readCount: 1,
    audioTracks: [track as ListeningAudioTrack],
    text,
    subQuestions: [
      {
        id: id34,
        label: `問34 ${pa.q34.prompt}`,
        blankHint: pa.q34.prompt,
        type: 'multiple_choice',
        options: marks(4),
        correctAnswer: mark(pa.q34.answer),
        correctAnswerRate: rateOf(set.levelJa, 0),
        optionTexts: pa.q34.choices,
        examPoints: pa.q34.points,
        explainJa: pa.q34.explain,
        distractors: pa.q34.distractors,
        detailedExplanation: {
          theme: `「${pa.q34.target}」の意見だけを追う。相手の意見が誤答に混ざる`,
          type: '話者の意見把握型',
          difficulty: diff,
          steps: [
            '① 設問の主語（誰の意見か）を音声の前に確認し、その人の発話だけをメモする',
            '② 正解は必ず言い換え（fun → enjoyable）。同じ語がそのまま入る選択肢は疑う',
            '③ 相手が重視した話（otherSpeaker）が最も多い誤答の型',
          ],
        },
      },
      {
        id: id35,
        label: `問35 ${pa.q35.prompt}`,
        blankHint: pa.q35.prompt,
        type: 'multiple_choice',
        options: marks(4),
        correctAnswer: mark(pa.q35.answer),
        correctAnswerRate: rateOf(set.levelJa, 1),
        optionTexts: pa.q35.choices,
        examPoints: pa.q35.points,
        explainJa: pa.q35.explain,
        distractors: pa.q35.distractors,
        detailedExplanation: {
          theme: '最後に決めたものは「2つの条件を両方満たす選択肢」。どの1発話にも答えは無い',
          type: '最終決定推論型',
          difficulty: diff,
          steps: [
            '① 対話の前半で挙がる希望は覆されることが多い（earlyView）',
            '② 最後の3発話で「〜も欲しい」「でも〜もしたい」の2条件を拾う',
            '③ 相手の確認（So you\'re joining …?）への No / Yes を聞き違えない',
          ],
        },
      },
    ],
    explanation,
    surroundingKnowledge: [
      '第6問 A は2人の対話（約200語）を1回だけ聞く。問34は一方の意見、問35はもう一方の最終決定。',
      '本番の選択肢はアルファベット順に並ぶ。番号に意味は無い。',
      '正解は必ず言い換え。音声の語がそのまま入った選択肢はダミーであることが多い。',
    ],
    deepDiveTopics: ['対話は「提案 → 難点 → 修正案 → 合意」の型。合意した内容が問35の答えになる。'],
    playOnce: true,
  } as ListeningProblem;
}

function buildQ6B(set: Q6Set): ListeningProblem {
  const no = set.no;
  const pb = set.partB;
  const id36 = `q_el6_B_set${no}_36`;
  const id37 = `q_el6_B_set${no}_37`;
  const script = conversationScript(pb.conversation);

  const track: ListeningAudioTrack & { subIds?: string[] } = {
    subId: id36,
    subIds: [id36, id37],
    label: '問36・37',
    hint: pb.situation,
    material: {
      title: '問36・37　メモ・図表',
      instruction: pb.memoTable.lead,
      table: { headers: ['Speaker', 'Memo'], rows: pb.memoTable.rows.map(row => [row.who, row.note]) },
      images: pb.q37.graphs.map(g => ({ src: asset(Q6_DIR, g.image),
        caption: `${mark(g.no)} ${g.title}`, minWidth: 360 })),
    },
    audioUrl: asset(Q6_DIR, pb.audio),
    script,
    turns: pb.conversation,
    translation: '',
    keyPhrases: phrases(pb.q36.stances.map((s) => s.evidence).concat([pb.q37.basis.utterance])),
  };

  const graphImages = pb.q37.graphs.map((g) => asset(Q6_DIR, g.image));

  const text = [
    `第${no}回　第6問 B（問36・37・1回読み）　【難易度：${set.levelJa}】`,
    '',
    `第6問 B は問36・問37の2問です。会話を聞き、それぞれの問いの答えとして最も適切なものを、選択肢のうちから一つずつ選びなさい。${pb.memoTable.lead}状況と問いを読む時間が与えられた後、音声が流れます。`,
    '',
    '【本番の配点】問36 4点／問37 4点',
    '',
    `状況：${pb.situation}`,
    `メモ欄：${pb.memoTable.rows.map((r) => r.who).join('　／　')}`,
    '',
    SEP,
    `■ 問36　${pb.q36.questionJa}`,
    ...pb.q36.choicesJa.map((c, i) => `${mark(i + 1)} ${c}`),
    '',
    SEP,
    `■ 問37　${pb.q37.prompt}`,
    ...pb.q37.graphs.map((g) => `${mark(g.no)} ${g.title}`),
  ].join('\n');

  const diff = difficultyOf(set.levelJa);

  const explanation = [
    `第${no}回（難易度：${set.levelJa}）第6問 B の解説です。`,
    '',
    `問36　正解は ${mark(pb.q36.answer)}`,
    `スクリプト：${script}`,
    '| 話者 | 数える | 根拠の発話 | なぜ |',
    '| --- | --- | --- | --- |',
    ...pb.q36.stances.map(
      (s) => `| ${s.who} | ${s.shifted ? '○' : '×'} | ${s.evidence} | ${s.why} |`,
    ),
    pb.q36.explain,
    '',
    `問37　正解は ${mark(pb.q37.answer)}`,
    `根拠の発言（${pb.q37.basis.who}）：「${pb.q37.basis.utterance}」`,
    `数字＝${pb.q37.basis.number}／対象＝${pb.q37.basis.target}／出来事＝${pb.q37.basis.event}`,
    ...pb.q37.graphs.map(
      (g) =>
        `${mark(g.no)} ${g.title}（${g.measures}）：${g.no === pb.q37.answer ? '3点すべて一致' : (g as any).whyWrong || ''}`,
    ),
    pb.q37.explain,
  ].join('\n');

  return {
    id: `q_el6_B_set${no}`,
    category: `第${no}回 ${set.topic.split('／')[1] || set.topic}（${set.levelJa}）`,
    readCount: 1,
    audioTracks: [track as ListeningAudioTrack],
    text,
    subQuestions: [
      {
        id: id36,
        label: `問36 ${pb.q36.questionJa}`,
        blankHint: pb.q36.questionJa,
        type: 'multiple_choice',
        options: marks(4),
        correctAnswer: mark(pb.q36.answer),
        correctAnswerRate: rateOf(set.levelJa, 0),
        optionTexts: pb.q36.choicesJa,
        examPoints: pb.q36.points,
        explainJa: pb.q36.explain,
        detailedExplanation: {
          theme: '「以前よりも」がポイント。もともとそうしている人は数えない',
          type: '人数判定型（3人の会話）',
          difficulty: diff,
          steps: [
            '① 3人の名前をメモ欄に書き、発話ごとに「動いた／動かない／もともと」を記す',
            '② 渋る言い方でも最後に動けば数える。同意しても自分は動かない人は数えない',
            '③ 「毎日そうしている」「もう低くしている」人は「以前より」に当たらない',
            '④ ④が「0人」。順番は 1人→2人→3人→0人 で固定',
          ],
        },
      },
      {
        id: id37,
        label: `問37 ${pb.q37.prompt}`,
        blankHint: pb.q37.prompt,
        type: 'multiple_choice',
        options: marks(4),
        correctAnswer: mark(pb.q37.answer),
        correctAnswerRate: rateOf(set.levelJa, 1),
        optionTexts: pb.q37.graphs.map((g) => g.title),
        optionImages: graphImages,
        examPoints: pb.q37.points,
        explainJa: pb.q37.explain,
        detailedExplanation: {
          theme: '数字・対象・出来事の3点がそろう図だけが根拠。数字だけ一致する図がダミー',
          type: '図表選択型（4つのグラフ）',
          difficulty: diff,
          steps: [
            '① 音声の前に4つのグラフのタイトルと軸を読み、「何を数えているか」を1語で言う',
            '② 該当話者の発言から 数字／対象／出来事 をメモする',
            '③ 数字が同じでも「数えているもの」が違う図は切る',
          ],
        },
      },
    ],
    explanation,
    surroundingKnowledge: [
      '第6問 B は3人の会話（約260語）を1回だけ聞く。問36は「以前よりも〜しようと思っている人数」、問37は発言の根拠となる図表。',
      '問36 の選択肢は ①1人 ②2人 ③3人 ④0人。④が0人であることに注意。',
      '「もともとそうしている人」は数えない。これが本番の引っかけの核。',
      '問37 は4枚のグラフが選択肢そのもの。数字・対象・出来事の3点一致で選ぶ。',
    ],
    deepDiveTopics: ['本番の冊子には話者名入りの3行メモ表が印刷される。○×だけを書き込む練習をする。'],
    playOnce: true,
  } as ListeningProblem;
}

// ---------------------------------------------------------------------
// 公開
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// 制限時間（timeLimitSec）
// ---------------------------------------------------------------------
//
// 既定のタイマーは「選択肢を読む時間」だけで決まるため、第4問B（約65秒）や
// 第5問の講義（約2分）では音声が終わる前にタイマーが切れてしまう。
// そこで、この大問群だけは
//   音声の合計秒数 ＋ 事前に問題文・図表を読む時間 ＋ 1空欄あたりの解答時間
// を制限時間にする。音声の秒数は scripts/concat_listening_audio.sh が
// ffprobe で書き出した listening-q4-6-durations.json から取る。

const AUDIO_DURATIONS: Record<string, number> = durationsRaw as Record<string, number>;
/** 音声が始まる前に状況・図表を読む時間（本番でも与えられる） */
const PREVIEW_SEC = 25;
/** 空欄1つあたりの解答時間 */
const PER_BLANK_SEC = 12;

function audioSeconds(url: string): number {
  const file = url.split('/').pop() ?? '';
  return AUDIO_DURATIONS[file] ?? 60;
}

function withTimeLimit(problem: ListeningProblem): ListeningProblem {
  const audio = problem.audioTracks.reduce((sum, t) => sum + audioSeconds(t.audioUrl), 0);
  const blanks = problem.subQuestions.length;
  const timeLimitSec = Math.round(audio + PREVIEW_SEC + blanks * PER_BLANK_SEC);
  return { ...problem, timeLimitSec };
}

export const EL4_A_PROBLEMS: ListeningProblem[] = q4Raw.sets.map((s) => withTimeLimit(buildQ4A(s)));
export const EL4_B_PROBLEMS: ListeningProblem[] = q4Raw.sets.map((s) => withTimeLimit(buildQ4B(s)));
export const EL5_PROBLEMS: ListeningProblem[] = q5Raw.sets.map((s) => withTimeLimit(buildQ5(s)));
export const EL6_A_PROBLEMS: ListeningProblem[] = q6Raw.sets.map((s) => withTimeLimit(buildQ6A(s)));
export const EL6_B_PROBLEMS: ListeningProblem[] = q6Raw.sets.map((s) => withTimeLimit(buildQ6B(s)));
