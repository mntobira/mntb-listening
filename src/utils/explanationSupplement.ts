/**
 * フローチャート（logic_thought JSON）問題の補足ステップ抽出・組み立て（#27: explanationFormat.ts から分離）
 * 循環参照を作らないよう、基本パーツ（ANS / KEY / LABEL / BOX / circledNumber）もここに保持する。
 */

export const ANS_STYLE =
  'background-image:linear-gradient(to top, rgba(233,104,142,0.85) 0%, rgba(244,169,196,0.75) 55%, rgba(244,169,196,0) 100%); background-repeat:no-repeat; background-size:100% 40%; background-position:0 100%; font-weight:bold; padding:0 3px 1px; border-radius:2px;';

export const ANS = (text: string): string =>
  `<span style="${ANS_STYLE}">${text}</span>`;

export const KEY_STYLE =
  'font-weight:bold; -webkit-text-decoration:underline wavy currentColor; text-decoration:underline wavy currentColor; text-decoration-thickness:1.5px; text-underline-offset:5px; text-decoration-skip-ink:none;';

export const KEY = (text: string): string =>
  `<span style="${KEY_STYLE}">${text}</span>`;

export const LABEL = (text: string): string =>
  `<span style="display:inline-block; border:1.5px solid #D9466E; color:#D9466E; background-color:#FFF1F5; font-weight:bold; font-size:max(12px, 0.86em); padding:1px 10px; border-radius:999px;">${text}</span>`;

export const BOX = (body: string): string =>
  `<div style="background-color:#FFF4E5; border:2px solid #FB8C00; border-left:9px solid #FB8C00; border-radius:10px; padding:10px 14px; margin-top:14px; color:#3E2723;">${body}</div>`;

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮'];

export function circledNumber(index: number): string {
  return CIRCLED[index] || `(${index + 1})`;
}

/** フローチャート（logic_thought）1ステップぶんの最小形 */
export interface FlowchartStepLike {
  step?: string;
  target?: string;
  purpose?: string;
  content?: string;
}

/** 「Step 3」「STEP3」「3」などの表記ゆれから番号だけを取り出す */
function flowchartStepLabel(raw: unknown, index: number): string {
  const text = String(raw ?? '').trim();
  const matched = text.match(/(\d+)/);
  return `STEP ${matched ? matched[1] : index + 1}`;
}

/** タグ混じりの短文を、丸数字の見出しに載せられる素の文にする */
function plainSentence(value: unknown): string {
  return String(value ?? '')
    .replace(/<\/?[a-z][a-z0-9]*[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildFlowchartSteps(steps: FlowchartStepLike[]): string {
  const rows = steps
    .map((step, index) => {
      const label = flowchartStepLabel(step?.step, index);
      const target = plainSentence(step?.target);
      const reason = plainSentence(step?.purpose) || plainSentence(step?.content);
      if (!target && !reason) return '';
      const head = target
        ? `フローチャートの ${label} にあるように、${target}を確認する`
        : `フローチャートの ${label} をたどる`;
      return `<b>${circledNumber(index)} ${head}</b>${reason ? `\n　└ ${reason}` : ''}`;
    })
    .filter(Boolean);

  if (rows.length === 0) return '';
  return `${LABEL('解法の思考手順')}\n上のフローチャートを ${flowchartStepLabel(steps[0]?.step, 0)} から順にたどると、次の順番で答えが決まります。\n${rows.join('\n')}`;
}

export function extractFlowchartSteps(explanation: string): FlowchartStepLike[] {
  try {
    const parsed = JSON.parse(explanation);
    const steps = parsed?.phase1?.steps;
    return Array.isArray(steps) ? steps : [];
  } catch {
    return [];
  }
}
