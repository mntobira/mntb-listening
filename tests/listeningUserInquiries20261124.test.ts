import { describe, it, expect, vi } from 'vitest';
import { AD_TOGGLES } from '../src/utils/adConfig';
import { showNativeBottomBanner, hideNativeBottomBanner } from '../src/utils/adService';
import { EL1_A_EXTRA_PROBLEMS } from '../src/data/englishListeningQ1ASets';

const admobMocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  getPlatform: vi.fn(() => 'web'),
  showBanner: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  hideBanner: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  removeBanner: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => admobMocks.isNativePlatform(),
    getPlatform: () => admobMocks.getPlatform(),
  },
}));

vi.mock('@capacitor-community/admob', () => ({
  AdMob: {
    showBanner: () => admobMocks.showBanner(),
    hideBanner: () => admobMocks.hideBanner(),
    removeBanner: () => admobMocks.removeBanner(),
  },
  BannerAdPosition: { BOTTOM_CENTER: 'BOTTOM_CENTER' },
  BannerAdSize: { BANNER: 'BANNER' },
  RewardAdPluginEvents: { Rewarded: 'Rewarded', Dismissed: 'Dismissed' },
}));
import { EL1_B_PROBLEMS } from '../src/data/englishListeningQ1BProblems';
import { EL2_PROBLEMS } from '../src/data/englishListeningQ2Problems';
import { EL3_PROBLEMS } from '../src/data/englishListeningQ3Problems';
import { EL4_A_PROBLEMS } from '../src/data/englishListeningQ4to6Problems';
import { applyReviewFocus } from '../src/utils/reviewFocus';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

describe('利用者お問い合わせ16件の回帰テスト（2026-11-24）', () => {
  it('第4問A 第2回（問22〜25）：Café Corner（8時の2時間前）の選択肢⑤が 6:00 p.m. である', () => {
    const set2 = EL4_A_PROBLEMS.find((p) => p.id === 'q_el4_A_set2');
    expect(set2).toBeDefined();
    expect(set2!.text).toContain('6:00 p.m.');
    expect(set2!.explanation).toContain('⑤6:00 p.m.');
    expect(set2!.explanation).not.toContain('⑤7:00 p.m.');
    const q25 = set2!.subQuestions.find((sq) => sq.id === 'q_el4_A_set2_25');
    expect(q25?.correctAnswer).toBe('⑤');
  });

  it('第3問 第1回 問4：男女話者（A=女子・B=男子）と「男子が絵の具セットを持参する」対話・設問・音声台帳が完全整合している', () => {
    const set1 = EL3_PROBLEMS.find((p) => p.id === 'q_el3_set1')!;
    const q4 = set1.subQuestions.find((sq) => sq.id === 'q_el3_set1_4')!;
    const track = set1.audioTracks.find((t) => t.subId === 'q_el3_set1_4')!;
    expect(q4.label).toBe('問4 What will the boy bring to school tomorrow?');
    expect(q4.correctAnswer).toBe('②');
    expect(set1.text).toContain('問4（話者：女性（高校生） / 男性（高校生））');
    expect(track.script).toContain("No, it's at home, so I'll bring my paint set tomorrow.");
  });

  it('第3問 第7回 問6：設問文の男女関係が正しく、下書きメモ「(※男女の発話を確認)」が残っていない', () => {
    for (const p of EL3_PROBLEMS) {
      expect(p.text).not.toContain('※男女の発話を確認');
      expect(p.explanation).not.toContain('※男女の発話を確認');
      for (const sq of p.subQuestions) {
        expect(sq.label).not.toContain('※男女の発話を確認');
      }
    }
    const set7 = EL3_PROBLEMS.find((p) => p.id === 'q_el3_set7')!;
    const q6 = set7.subQuestions.find((sq) => sq.id === 'q_el3_set7_6')!;
    expect(q6.label).toBe('問6 What will the girl help the boy with?');
    expect(q6.correctAnswer).toBe('④');
  });

  it('第2問 第10回 問3：店主の1,000円セット提案に女性が明確に合意する対話・和訳・音声台帳が完全整合している', () => {
    const set10 = EL2_PROBLEMS.find((p) => p.id === 'q_el2_set10')!;
    const q3 = set10.subQuestions.find((sq) => sq.id === 'q_el2_set10_3')!;
    const track = set10.audioTracks.find((t) => t.subId === 'q_el2_set10_3')!;
    expect(q3.label).toBe('問3 How much will the woman pay?');
    expect(q3.correctAnswer).toBe('③');
    expect(track.script).toContain("Oh, great! I'll take both, then.");
  });

  it('和訳データ（listeningTranslations.json）：女性話者の発話に「僕」が混入していない', () => {
    const tr = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public/data/listeningTranslations.json'), 'utf8'),
    ) as Record<string, string[]>;
    const femaleLinesChecked: [string, number][] = [
      ['/listening_audio/el3_set1_q5.mp3|q_el3_set1_5', 2],
      ['/listening_audio/el3_set2_q6.mp3|q_el3_set2_6', 4],
      ['/listening_audio/el3_set6_q3.mp3|q_el3_set6_3', 1],
      ['/listening_audio/el3_set7_q6.mp3|q_el3_set7_6', 3],
      ['/listening_audio/el3_set9_q5.mp3|q_el3_set9_5', 0],
      ['/listening_audio/el3_set9_q6.mp3|q_el3_set9_6', 4],
      ['/listening_audio/el3_set11_q3.mp3|q_el3_set11_3', 1],
      ['/listening_audio/el3_set11_q3.mp3|q_el3_set11_3', 3],
      ['/listening_audio/el3_set14_q5.mp3|q_el3_set14_5', 0],
      ['/listening_q4/set15_4B.mp3|q_el4_B_set15_26', 0],
      ['/listening_q4/set15_4B.mp3|q_el4_B_set15_26', 2],
    ];
    for (const [key, idx] of femaleLinesChecked) {
      expect(tr[key]?.[idx], `${key}[${idx}]`).toBeDefined();
      expect(tr[key][idx], `${key}[${idx}] に「僕」が残っている`).not.toContain('僕');
    }
  });

  it('やり直し（reviewFocus）でグループ音源の2問目以降だけが残っても音源トラックが保持・一致判定できる', () => {
    // 第4問A 第2回の問25だけを間違えてやり直すケース（track.subId は q_el4_A_set2_22 だが subIds に q_el4_A_set2_25 を含む）
    const focused = applyReviewFocus(EL4_A_PROBLEMS, 'el4_A', {
      chapterId: 'el4_A',
      targets: [{ questionId: 'q_el4_A_set2', subQuestionIds: ['q_el4_A_set2_25'] }],
    });
    expect(focused).toHaveLength(1);
    const prob = focused[0];
    expect(prob.subQuestions.map((s) => s.id)).toEqual(['q_el4_A_set2_25']);
    const matched = (prob.audioTracks ?? []).filter(
      (t) =>
        t.subId === 'q_el4_A_set2_25' ||
        (Array.isArray(t.subIds) && t.subIds.map(String).includes('q_el4_A_set2_25')),
    );
    expect(matched).toHaveLength(1);
    expect(matched[0].audioUrl).toBe('/listening_q4/set02_4A_back.mp3');
  });

  it('第1問A・Bの話者表記が修正済みデータと整合している', () => {
    const q1aSet10 = EL1_A_EXTRA_PROBLEMS.find((p) => p.id === 'q_el1_A_set10')!;
    expect(q1aSet10.text).toContain('問1（話者：女性（高校生））');
    expect(q1aSet10.text).toContain('① She wants to borrow a charger.');

    const q1bSet8 = EL1_B_PROBLEMS.find((p) => p.id === 'q_el1_B_set8')!;
    expect(q1bSet8.text).toContain('問2（話者：女性（高校生））');
  });

  it('第2問 第12回 問2（el2_set12_q2）：再収録した音源のタイムスタンプJSONが整合している', () => {
    const ra = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public/read_along/listening_audio/el2_set12_q2.json'), 'utf8'),
    );
    expect(ra.src).toBe('/listening_audio/el2_set12_q2.mp3');
    expect(ra.lines).toHaveLength(4);
    expect(ra.lines[1].who).toBe('W');
    expect(ra.lines[3].who).toBe('W');
    expect(ra.dur).toBeGreaterThan(10);
  });
});

describe('AdMob 下部バナーの非同期競合防止（adService）', () => {
  it('showBanner の完了前に hideNativeBottomBanner が呼ばれた場合、完了直後にバナーを確実に消去する', async () => {
    let resolveShow!: () => void;
    const showBannerPromise = new Promise<void>((res) => {
      resolveShow = res;
    });

    admobMocks.isNativePlatform.mockReturnValue(true);
    admobMocks.getPlatform.mockReturnValue('ios');
    admobMocks.showBanner.mockImplementation(() => showBannerPromise);
    admobMocks.hideBanner.mockClear();
    admobMocks.removeBanner.mockClear();
    const toggleSpy = vi.spyOn(AD_TOGGLES, 'enableBottomBanner', 'get').mockReturnValue(true);

    try {
      // 単元選択画面で showBanner が始まり、完了前に quiz / explanation へ遷移して hide が呼ばれるケース
      const pShow = showNativeBottomBanner(72);
      const pHide = hideNativeBottomBanner();

      resolveShow();
      await Promise.all([pShow, pHide]);

      expect(admobMocks.showBanner).toHaveBeenCalledTimes(1);
      expect(admobMocks.hideBanner).toHaveBeenCalled();
      expect(admobMocks.removeBanner).toHaveBeenCalled();
    } finally {
      toggleSpy.mockRestore();
      admobMocks.isNativePlatform.mockReturnValue(false);
    }
  });
});
