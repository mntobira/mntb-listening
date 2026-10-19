/**
 * ===================================================================
 * 問題の版（バージョン）判定 — 「登録してない問題」が残るのを防ぐ
 * ===================================================================
 *
 * -------------------------------------------------------------------
 * ■ 何を防ぐための仕組みか
 * -------------------------------------------------------------------
 * 復習リストに入った1件は、登録時の問題文・正答を
 * ★そのときの内容のまま持っている（スナップショット）。★
 *
 * ここで、あとから同じIDのまま問題を差し替えると次が起きる。
 *
 *   ・ユーザーの復習リストには「古い問題文」が残り続ける
 *   ・そこを開いて解くと、正答は古い方なので噛み合わない
 *   ・ユーザーから見ると「こんな問題、登録してない」
 *
 * ★これは中身が消えるより悪い。★
 * 「自分が登録したものが信用できない」ので、
 * 復習リスト全体を使うのをやめてしまう。
 *
 * -------------------------------------------------------------------
 * ■ どう防ぐか（2段構え）
 * -------------------------------------------------------------------
 * 1. 問題IDに版数を付けられるようにする
 *      chem-mol-0007      → chem-mol-0007-v2
 *    IDが変われば別の問題として扱われるので、そもそも混ざらない。
 *    ★中身を変えるときに版数を上げるのが本筋の運用。★
 *
 * 2. 版数を上げ忘れても壊れないようにする（保険）
 *    登録時に問題本文の指紋（ハッシュ）を一緒に保存し、
 *    いま配信している問題の指紋と食い違ったら
 *    ★そのアイテムを自動で無効化する。★
 *
 * 1だけでは「上げ忘れ」を人の注意力で守ることになる。
 * 2だけでは「意図した改訂」と「タイプミスの修正」を区別できない。
 * 両方置くことで、運用のミスがユーザーに漏れないようにする。
 *
 * -------------------------------------------------------------------
 * ■ このファイルは何も import しない（純粋関数だけ）
 * -------------------------------------------------------------------
 * 採点・保存・画面のどこからでも同じ判定を使えるようにするため。
 */

// ============================================================
// 版数つきID
// ============================================================

/**
 * IDの末尾に付ける版数の書き方。
 *   chem-mol-0007-v2 → base='chem-mol-0007', version=2
 *   chem-mol-0007    → base='chem-mol-0007', version=1（版数なし＝初版）
 *
 * ★大文字 V は受け付けない。★
 * 「-V2」も許すと、同じ問題が2つのIDで存在できてしまい、
 * 進捗や復習リストのキーが分裂する。書き方は1通りに固定する。
 */
const VERSION_SUFFIX = /-v(\d+)$/;

export interface ParsedProblemId {
  /** 版数を取り除いた本体部分 */
  base: string;
  /** 版数（版数表記が無ければ 1） */
  version: number;
  /** 版数表記が実際に付いていたか */
  hasExplicitVersion: boolean;
}

/**
 * 問題IDを「本体」と「版数」に分ける。
 *
 * 版数が付いていないIDは初版（version=1）として扱う。
 * ★既存のIDを1つも書き換えずに版数の概念を導入できる★ ようにするため。
 * （既存IDを書き換えると、保存済みの進捗・復習リストが全部迷子になる）
 */
export function parseProblemId(id: string | null | undefined): ParsedProblemId {
  const raw = String(id ?? '');
  const m = raw.match(VERSION_SUFFIX);
  if (!m) return { base: raw, version: 1, hasExplicitVersion: false };
  const version = Number.parseInt(m[1], 10);
  // 数字が壊れている（-v0 / -v99999999999999）場合は版数として扱わない。
  if (!Number.isFinite(version) || version < 1) {
    return { base: raw, version: 1, hasExplicitVersion: false };
  }
  return {
    base: raw.slice(0, raw.length - m[0].length),
    version,
    hasExplicitVersion: true,
  };
}



// ============================================================
// 問題本文の指紋（ハッシュ）
// ============================================================

/**
 * 比較のための本文の正規化。
 *
 * ★空白・改行の違いだけで「別の問題」と判定してはいけない。★
 * 原稿を整形し直しただけでユーザーの復習リストが消えるのは、
 * 差し替えを検知できないのと同じくらい困る（むしろ頻度が高い）。
 *
 * 逆に、数値・語句が1文字でも変われば別の問題として検知される。
 */
function normalizeForFingerprint(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 文字列から短い指紋を作る（FNV-1a 32bit を2本取り、64bit相当にする）。
 *
 * ■ なぜ暗号ハッシュ（SHA-256）を使わないのか
 *   ・用途が「改訂の検知」であって、改ざん対策ではない
 *   ・SHA-256（Web Crypto）は非同期APIなので、
 *     同期で動いている採点・保存の流れに割り込ませると
 *     処理の順番が変わる。★挙動を変えないことを優先する。★
 *   ・localStorage に保存するので短いほうがよい
 *
 * ■ ぶつかる確率について
 *   32bit を1本だけだと現実的な問題数でも衝突しうるので2本取る。
 *   仮にぶつかっても被害は「差し替えを1件見逃す」だけで、
 *   ★間違ったデータを正解として出すことはない。★
 */
function fnv1a(input: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    // FNV prime 16777619 の乗算を 32bit で行う
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * 問題本文の指紋を作る。
 *
 * 対象に含めるのは「解答の正しさに関わる部分」だけにする。
 *   ・問題文
 *   ・正答
 *   ・設問ラベル（(1)(2) の対応が入れ替わると別物になるため）
 * 解説文は含めない。解説の言い回しを直しただけで
 * ユーザーの復習リストが消えるのは行き過ぎだからである。
 */
export function fingerprintProblem(parts: {
  questionText?: string | null;
  correctAnswer?: string | null;
  subLabel?: string | null;
}): string {
  const joined = [
    normalizeForFingerprint(parts.questionText),
    normalizeForFingerprint(parts.correctAnswer),
    normalizeForFingerprint(parts.subLabel),
  ].join('\u0000'); // 区切りに本文で使われない文字を挟む（結合の取り違え防止）

  const a = fnv1a(joined, 0x811c9dc5);
  const b = fnv1a(joined, 0x01000193);
  return `${a.toString(36)}${b.toString(36)}`;
}

// ============================================================
// 食い違いの判定
// ============================================================

/**
 * いま配信している問題の状態。
 *   string     … その問題は存在し、指紋はこれ
 *   'missing'  … その問題は今のデータに存在しない（削除された）
 *   'unknown'  … 調べていない（問題データを読み込んでいない画面など）
 */
export type CurrentProblemState = string | 'missing' | 'unknown';

export type StaleReason = 'replaced' | 'removed';

/**
 * 保存済みの1件が、いまの問題と食い違っているか。
 *
 * ★'unknown' のときは「食い違っていない」と答える。★
 * 調べていないものを「古い」と決めつけて消すのは、
 * ユーザーのデータを理由なく壊す行為になる。
 * 判定できないときは何もしない、が安全側である。
 *
 * ★指紋を持っていない古いアイテムも「食い違っていない」と答える。★
 * この仕組みを入れる前に登録された分には指紋が無い。
 * それを一括で消すと、導入した瞬間に全ユーザーの
 * 復習リストが空になる。次に出会ったときに指紋が入る。
 */
export function detectStale(
  savedFingerprint: string | null | undefined,
  current: CurrentProblemState,
): StaleReason | null {
  if (current === 'unknown') return null;
  if (current === 'missing') return 'removed';
  if (!savedFingerprint) return null;
  return savedFingerprint === current ? null : 'replaced';
}
