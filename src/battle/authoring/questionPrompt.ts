/** Display-only conversion for a single extracted question. Never changes scoring data. */
export const BATTLE_BLANK = '［　？　］';
export const BLANK_INSTRUCTION = '空欄に入るものを答えなさい。';

export interface PromptSub {
  id: string;
  label: string;
  correctAnswer?: string;
  type?: string;
  options?: string[];
}

// Only consume identifiers at the START of a label. A chemical symbol such as
// 炭素(C), a unit, or an inline cross-reference is not an exercise identifier.
const PREFIX = /^(?:問\s*[0-9０-９]+|第\s*[0-9０-９]+\s*問|【\s*(?:問)?[0-9０-９]+\s*】|[（(]\s*([0-9０-９]{1,2}|[ア-ンA-Za-z]|[①-⑳])\s*[)）]|([①-⑳]))\s*/u;

function labelParts(label: string): { keys: string[]; body: string } {
  let body = String(label || '').trim();
  const keys: string[] = [];
  let match: RegExpMatchArray | null;
  while ((match = body.match(PREFIX))) {
    if (match[1] || match[2]) keys.push(match[1] || match[2]);
    body = body.slice(match[0].length).trim();
  }
  if (/^[ア-ン]$/.test(body)) return { keys: [...keys, body], body: '' };
  return { keys, body };
}

export function singleQuestionLabel(label: string): string {
  return labelParts(label).body.replace(/\s+/g, ' ').trim();
}

export function sourceBlankKey(label: string): string | null {
  const parts = labelParts(label);
  const key = parts.keys[parts.keys.length - 1];
  // Circled/numeric identifiers with a body refer to items, not passage blanks.
  if (key && /^[①-⑳]$/.test(key) && parts.body) return null;
  return key && /^[ア-ンA-Za-z①-⑳]$/.test(key) ? key : null;
}

export function stripExerciseHeading(text: string): string {
  return text.replace(/^\s*(?:演習\s*[0-9０-９]+|問\s*[0-9０-９]+|【\s*(?:問)?[0-9０-９]+\s*】|[（(]\s*[0-9０-９]{1,2}\s*[)）](?=\s+\S))\s*/u, '').trim();
}

const TOKEN = /[（(]\s*([ア-ンA-Za-z①-⑳])\s*(?:[:：][^()（）]*)?[)）]/gu;
const UNRESOLVED_KANA = /[（(]\s*[ア-ン]\s*(?:[:：][^()（）]*)?[)）]/u;
const EMPTY_BLANK = /[（(][\s＿_]+[)）]|_{2,}/u;

/** Resolve ONLY verified answers from siblings of this very same source problem. */
function answersOf(subs: readonly PromptSub[]): Map<string, string | null> {
  const answers = new Map<string, string | null>();
  for (const sub of subs) {
    const key = sourceBlankKey(sub.label);
    if (!key) continue;
    let answer = String(sub.correctAnswer ?? '').trim();
    if (sub.type === 'multiple_choice' && sub.options?.length) {
      const exact = sub.options.find(o => o === answer);
      const index = '①②③④⑤⑥⑦⑧⑨⑩'.indexOf(answer);
      answer = exact ?? (answer.length === 1 && index >= 0 ? sub.options[index] ?? '' : '');
    }
    // A reference symbol is NOT the word to insert into a sentence.
    if (!answer || /^[ア-ン①-⑳]$/.test(answer)) continue;
    if (answers.has(key) && answers.get(key) !== answer) answers.set(key, null);
    else answers.set(key, answer);
  }
  return answers;
}

export interface BlankDisplay {
  prompt: string;
  label: string;
  answerable: boolean;
}

/**
 * Keep a complete sentence with ONE target blank and complete all other blanks.
 * Instructions mentioning a range (ア)〜(エ) are not question sentences.
 * Unknown or ambiguous answers are never guessed; such items require authoring.
 */
export function buildSingleBlankDisplay(
  text: string, sub: PromptSub, siblings: readonly PromptSub[],
): BlankDisplay | null {
  const target = sourceBlankKey(sub.label);
  if (!target) return null;
  const matches = [...String(text).matchAll(TOKEN)].filter(m => m[1] === target);
  if (!matches.length && singleQuestionLabel(sub.label).length >= 6) return null;
  const answers = answersOf(siblings);
  if (answers.has(target) && answers.get(target) === null) return { prompt: '', label: '', answerable: false };
  const parts = String(text || '').match(/[^。\n]+[。]?/gu) || [];
  for (let i = 0; i < parts.length; i++) {
    let sentence = parts[i].trim();
    const tokens = [...sentence.matchAll(TOKEN)];
    if (!tokens.some(m => m[1] === target)) continue;
    if (tokens[0]?.index === 0 && tokens[0][1] === target && singleQuestionLabel(sub.label)) continue;
    if (/空欄|当てはまる|あてはまる|それぞれ答え|記号で答え|[)）]\s*[〜～~－—]\s*[（(]/u.test(sentence)) continue;
    // Preserve the antecedent for “this/that” when it can be restored safely.
    if (/^(?:これ[はをが]|この|その|同じ)/u.test(sentence) && i > 0) {
      const previous = parts[i - 1].trim();
      if (!/空欄|答え[よな]|選びなさい/u.test(previous)) sentence = `${previous}${sentence}`;
    }
    let unresolved = false;
    let count = 0;
    const restored = sentence.replace(TOKEN, (original, key: string) => {
      if (key === target) { count++; return BATTLE_BLANK; }
      const answer = answers.get(key);
      if (answer) return answer;
      if (answers.has(key) || /^[ア-ン]$/.test(key)) unresolved = true;
      return original; // E.g. DNA bases (A)/(T)/(G)/(C), not answer slots.
    });
    if (unresolved || count !== 1 || UNRESOLVED_KANA.test(restored) || EMPTY_BLANK.test(restored)) continue;
    return {
      prompt: stripExerciseHeading(restored),
      label: BLANK_INSTRUCTION,
      answerable: true,
    };
  }
  return { prompt: '', label: '', answerable: false };
}

/** Detect leftover passage blanks without mistaking scientific (C) or (IV) for one. */
export function hasUnresolvedBlank(text: string): boolean {
  return UNRESOLVED_KANA.test(text) || EMPTY_BLANK.test(text);
}
