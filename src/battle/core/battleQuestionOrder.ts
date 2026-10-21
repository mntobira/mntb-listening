/**
 * 決定論的な乱数と出題順の組み立て（C-08: battleCore.ts から分離）。
 *   種（部屋ID）が同じなら誰の端末でも同じ並びになる。部屋に保存するのは種だけでよく、
 *   保存された並びが種から作られたものかを後から検算できる（問題差し替えの検知）。
 *   中身は分離前と1文字も変えていない。battleCore.ts から全て re-export している。
 */
// ============================================================
// 決定論的な乱数（出題の抽選に使う）
// ============================================================

/**
 * 文字列から32bitのハッシュを作る（FNV-1a）。
 *
 * ★何に使うのか★
 * 出題の抽選に Math.random() を使うと、部屋を作った端末しか
 * 「どの問題が選ばれたか」を再現できない。
 * ここでは「部屋ID（種）から決まる乱数」を使い、
 * 種が同じなら誰の端末でも同じ並びが得られるようにする。
 * こうすると、部屋に保存するのは種だけでよく、
 * さらに「保存された問題並びが種から作られたものか」を
 * 後から検算できる（＝問題差し替えの検知に使える）。
 */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * 種から擬似乱数を作る（mulberry32）。
 * 同じ種なら必ず同じ数列が出る。
 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function random(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 配列から重複なく n 件を選ぶ（Fisher-Yates の部分適用）。
 * 元の配列は変更しない。
 */
export function pickRandom<T>(items: readonly T[], count: number, random: () => number): T[] {
  const arr = items.slice();
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i += 1) {
    const j = i + Math.floor(random() * (arr.length - i));
    // 分割代入で入れ替える（添字アクセスの undefined 判定を避けるため）。
    // i, j はどちらも 0..arr.length-1 の範囲に必ず収まる。
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr.slice(0, n);
}

/**
 * buildQuestionOrder の追加指定（省略可）。
 *
 * ★なぜ引数を増やすのではなくまとめた形にしたのか★
 * 引数を並べていくと呼び出し側が
 *   buildQuestionOrder(ids, 10, seed, groupOf, isKana, 0.3)
 * のようになり、真ん中の値が何なのか読めなくなる。
 * また、あとで「かな入力以外の混ぜ方」を足したくなったときに
 * 既存の呼び出しを全部書き換えることになる。
 */
export interface QuestionOrderMix {
  /** その出題IDがかな入力（五十音キーボード）かどうか */
  isKana: (id: string) => boolean;
  /** かな入力にしたい問題の割合（0〜1）。0.3 なら10問中3問 */
  kanaShare: number;
}

/**
 * 出題IDの並びを「種」から決定論的に作る。
 *
 * ★同じ種・同じプールなら、誰の端末で計算しても同じ並びになる。★
 * これにより
 *   ・部屋を作るとき: 種から並びを作って保存する
 *   ・相手の端末   : 保存された並びが種から作られたものか検算できる
 * の両方が成立する（問題差し替えの検知）。
 *
 * @param poolIds 抽選対象の出題ID（教科・形式で絞り込んだ後のもの）
 * @param count   選ぶ数
 * @param seed    種（部屋IDなど）
 * @param groupOf 同じ小問から作られた問題をまとめるキー（省略可）
 * @param mix     かな入力を何割混ぜるか（省略可）
 */
export function buildQuestionOrder(
  poolIds: readonly string[],
  count: number,
  seed: string,
  groupOf?: (id: string) => string,
  mix?: QuestionOrderMix,
): string[] {
  const random = createRandom(hashString(seed));

  // 何の指定も無ければ単純に抽選する
  if (!groupOf && !mix) return pickRandom(poolIds, count, random);

  // ★同じ小問から作られた別形式を1試合に混ぜない★
  //
  // 生成プールには、1つの小問から「語句選択」と「文字パネル」の
  // 2問が作られているものがある（化学基礎763問のうち実質553小問）。
  // 単純に抽選すると、まったく同じ問いが
  //   3問目「次の語を選べ → 混合物」
  //   7問目「文字を並べよ → 混合物」
  // という形で1試合に2回出る。答えを知った状態の2回目は
  // ただの作業になり、対戦としても学習としても価値がない。
  //
  // そこで ★プール全体をシャッフルしてから、
  // 同じグループ（小問）の2問目以降を捨てる★ 方式にする。
  // 「先に絞ってから抽選」ではなく「シャッフル後に間引く」ので、
  // どの形式が採用されるかも種によって決まり、決定論性が保たれる。
  const shuffled = pickRandom(poolIds, poolIds.length, random);
  const usedGroups = new Set<string>();
  const unique: string[] = [];

  for (const id of shuffled) {
    const group = groupOf ? groupOf(id) : id;
    if (usedGroups.has(group)) continue;
    usedGroups.add(group);
    unique.push(id);
    // 混ぜる指定が無いときは、必要な数が揃った時点で打ち切ってよい。
    // 混ぜる指定があるときは、後ろの方にしか無い形式（かな入力）を
    // 拾う必要があるので ★最後まで見る★。
    if (!mix && unique.length >= count) break;
  }

  if (!mix) return unique;

  // ------------------------------------------------------------
  // ★選択式とかな入力を混ぜる★
  // ------------------------------------------------------------
  // 利用者の指定は「みんはや形式（1文字ずつ押す）をもっと入れてほしい。
  // ただし全部をそうしなくてよい。四択問題も含めて」だった。
  //
  // ■ なぜ「形式で絞ってから抽選」ではだめなのか
  //   形式で絞ると 0問か全問かにしかならない。
  //   「10問中3問だけかな入力」は、抽選のあとに
  //   ★形式ごとの取り分を決める★ことでしか作れない。
  //
  // ■ 足りないときは自動で振り替える
  //   例：地理はかな入力が0問なので、0.3 を指定しても
  //   かな入力の取り分が0になり、全問が選択式で埋まる。
  //   逆に生物基礎のようにかな入力が多い教科では、
  //   選択式が足りなければかな入力で埋める。
  //   ★どちらの場合も「問題数が足りない」で試合が短くなることはない。★
  const kanaIds: string[] = [];
  const otherIds: string[] = [];
  for (const id of unique) {
    if (mix.isKana(id)) kanaIds.push(id);
    else otherIds.push(id);
  }

  const share = Math.min(1, Math.max(0, mix.kanaShare));
  const total = Math.min(count, unique.length);
  // 四捨五入。0.3 × 10問 = 3問。0.3 × 5問 = 2問（1.5 → 2）。
  let wantKana = Math.min(Math.round(total * share), kanaIds.length);
  let wantOther = total - wantKana;

  // 選択式が足りなければ、その分をかな入力で埋める（逆も同じ）。
  if (wantOther > otherIds.length) {
    const short = wantOther - otherIds.length;
    wantOther = otherIds.length;
    wantKana = Math.min(kanaIds.length, wantKana + short);
  }

  const chosen = [...kanaIds.slice(0, wantKana), ...otherIds.slice(0, wantOther)];

  /**
   * ★取り分を決めたあと、もう一度並べ直す★
   *
   * ■ なぜ「unique の順で拾い直す」ではだめなのか（実測で判明）
   * 上で取っているのは「シャッフル列に先に現れたかな入力3問」と
   * 「先に現れた選択式7問」である。かな入力は30問中3問（上位10%）しか
   * 取らないので選ばれる3問は列のかなり前方に集まるが、
   * 選択式は30問中7問（上位23%）なので後ろまで取る。
   * その結果 ★かな入力が試合の前半に固まる★。
   * 30部屋で試したところ、8部屋で1〜3問目が全部かな入力になった
   * （前半だけ極端に難しい試合になる）。
   *
   * 取り分を決めてから並べ直すと、どの位置に来るかが形式と無関係になる。
   * 同じ種なら同じ並びになるので、両端末で同じ出題順という前提も保たれる
   * （random は上のシャッフルの続きなので、種だけで決まる）。
   */
  return pickRandom(chosen, chosen.length, random);
}
