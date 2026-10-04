/**
 * とびら君の「きもち」（2026-10-01）。
 *
 * 画面の状態（連続日数・復習待ち・久しぶり・対戦前・勝敗）から、
 * 表情（ポーズ画像）とひとこと（吹き出し）を決める。純粋関数なので画面に依存しない。
 *
 * ★口調の決まり★
 *   - やさしく励ます。ときどき少しだけ挑発（対戦前・惜敗）。
 *   - ゼロの数字には必ず「次の一手」を添える（「0問」で終わらせない）。
 *   - 責める言葉・急かしすぎる言葉は使わない。
 */
export type TobiraMood =
  | 'first'      // はじめて
  | 'away'       // 久しぶり（3日以上あいた）
  | 'review'     // 復習待ちあり
  | 'streak'     // 連続記録中（3日以上）
  | 'milestone'  // 通算ログインの節目（7・30・100日…）
  | 'fresh'      // ふつうの日（何も待っていない）
  | 'prebattle'  // 対戦前
  | 'win'
  | 'close'      // 惜敗
  | 'lose'
  | 'draw'
  | 'study'      // 学習の入口
  | 'gacha'
  | 'ranking';

export interface MoodInput {
  screen: 'home' | 'battle' | 'result' | 'study' | 'gacha' | 'ranking';
  streak?: number;
  dueCount?: number;
  solved?: number;
  daysAway?: number;
  firstVisit?: boolean;
  outcome?: 'win' | 'lose' | 'draw';
  /** 自分 − 相手 の点差（結果画面） */
  margin?: number;
  isGuest?: boolean;
  /** 通算ログイン日数（節目の日だけ特別なひとこと） */
  loginDays?: number;
  /** 同じ状態で言い方を少し変えるための種（日付など）。省略時は0 */
  seed?: number;
}

export interface MoodOut {
  mood: TobiraMood;
  pose: string;
  line: string;
  /** 吹き出しの色味 */
  tone: 'warm' | 'cheer' | 'calm' | 'fire';
}

const POSE: Record<TobiraMood, string> = {
  first: '/mascots/bowing.webp',
  away: '/mascots/walking.webp',
  review: '/mascots/studying.webp',
  streak: '/mascots/cheering.webp',
  milestone: '/mascots/trophy.webp',
  fresh: '/mascots/basic.webp',
  prebattle: '/mascots/good.webp',
  win: '/mascots/trophy.webp',
  close: '/mascots/thinking.webp',
  lose: '/mascots/thinking.webp',
  draw: '/mascots/good.webp',
  study: '/mascots/studying.webp',
  gacha: '/mascots/happy.webp',
  ranking: '/mascots/cheering.webp',
};

/** 惜敗とみなす点差（1問分の正解点ぐらい） */
export const CLOSE_MARGIN = 120;

/** 通算ログインの節目と、その日のひとこと */
export const LOGIN_MILESTONES: Readonly<Record<number, string>> = {
  7: '7日目だね！ 1週間いっしょに来てくれてありがとう',
  14: '14日目！ もう立派な習慣だね',
  30: '30日いっしょだね！ ここまで続けた自分をほめよう',
  50: '50日目！ 扉がたくさん開いてきたね',
  100: '100日目…！ きみは本物の努力家だよ',
  200: '200日目！ ずっととなりにいるよ',
  365: '1年いっしょだね！ 本当にありがとう',
};

const pick = (list: readonly string[], seed = 0) => list[Math.abs(Math.floor(seed)) % list.length];

export function tobiraMood(i: MoodInput): MoodOut {
  const s = i.seed ?? 0;
  const out = (mood: TobiraMood, line: string, tone: MoodOut['tone']): MoodOut => ({ mood, pose: POSE[mood], line, tone });
  switch (i.screen) {
    case 'result': {
      if (i.outcome === 'win') return out('win', pick(['やったね！ 学んだ力が勝ったよ', '勝利！ この調子でもう1戦？', '強い…！ 次はランクを上げにいこう'], s), 'cheer');
      if (i.outcome === 'draw') return out('draw', '引き分け！ 次の1問で差がつくよ', 'calm');
      if (i.margin !== undefined && i.margin > -CLOSE_MARGIN) return out('close', pick(['あと1問だった…！ 次は勝てる', '惜しい！ 速さで追いつけるよ'], s), 'fire');
      return out('lose', pick(['くやしいね。復習ノートで取り返そう', '負けた問題は、いちばん伸びる問題だよ'], s), 'warm');
    }
    case 'battle':
      return out('prebattle', i.isGuest
        ? pick(['まずはAIで腕だめし。ぼくも応援するよ', 'AIはゲストでもすぐ戦えるよ。いこう！'], s)
        : pick(['今日の相手、手強いかもよ？', '学んだ力、見せてやろう！', '速さで差をつけよう。準備はいい？'], s), 'fire');
    case 'study':
      return out('study', (i.dueCount ?? 0) > 0 ? `復習が${i.dueCount}問あるよ。先に片づける？` : pick(['今日はどれからやる？', 'ひとつ選べば、ぼくが案内するよ'], s), 'warm');
    case 'gacha':
      return out('gacha', pick(['何が出るかな…ドキドキ', '学習プリントが出たら当たりだよ'], s), 'cheer');
    case 'ranking':
      return out('ranking', pick(['上を見ると、やる気が出るね', 'ひとつ上の人まで、あと少しかも'], s), 'cheer');
    case 'home':
    default: {
      const due = i.dueCount ?? 0;
      const streak = i.streak ?? 0;
      if (i.firstVisit) return out('first', 'はじめまして！ ぼくと最初の1問、やってみよう', 'warm');
      if (i.loginDays && LOGIN_MILESTONES[i.loginDays]) return out('milestone', LOGIN_MILESTONES[i.loginDays], 'cheer');
      if ((i.daysAway ?? 0) >= 3) return out('away', `${i.daysAway}日ぶり！ 待ってたよ。軽く1問からいこう`, 'warm');
      if (due > 0) return out('review', `${due}問、ぼくと片づけよう`, 'calm');
      if (streak >= 3) return out('streak', `${streak}日連続！ 扉がまたひとつ開いたよ`, 'cheer');
      if ((i.solved ?? 0) === 0) return out('fresh', 'まずは第1問Aから。3分で終わるよ', 'warm');
      return out('fresh', pick(['復習はゼロ。新しい大問に進もう', '今日も、ひとつ先の扉へ', '対戦でウデだめしもできるよ'], s), 'warm');
    }
  }
}

/** 連続日数を「扉」で見せる（炎の代わり）。7枚まで描き、それ以上は数字で。 */
export function streakDoors(streak: number, max = 7): { doors: number; extra: number } {
  const n = Math.max(0, Math.floor(streak));
  return { doors: Math.min(n, max), extra: Math.max(0, n - max) };
}
