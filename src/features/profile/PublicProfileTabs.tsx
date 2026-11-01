/**
 * D6（2026-10-30）公開プロフィール＝「その人のマイページ全体」のタブの中身。
 *   カレンダー（直近28日・教科ごとの合計）／きせかえ（持っているアイテム）／称号／マイPDF（表紙だけ。保存はできない）。
 *   どれも本人が「プロフィールを公開」にしているときだけ、公開文書（public_study_profiles）から読む。
 *   古い文書（D6 より前）には項目が無いので「まだ公開されていません」と出す。
 */
import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { GrowthAvatar } from '../../battle/ui/GrowthParts';
import { itemById, printOf, type GrowthProgress } from '../../battle/core/growth';
import { BADGES } from '../../battle/core/growthBadges';
import { formatStudyTime } from '../../utils/studyTime';
import { subjectLabel } from '../studylog/manualLogCore';
import type { PublicStudyProfile } from '../../utils/publicStudyProfile';
import { alignCal } from '../../utils/publicProfileCore';

const NOT_YET = '本人がアプリを開くと、ここに表示されます。';
const level = (sec: number) => (sec <= 0 ? 0 : sec < 1800 ? 1 : sec < 3600 ? 2 : sec < 7200 ? 3 : 4);
const WD = '日月火水木金土';

/** カレンダー：直近28日の色の濃さ（勉強した時間）と、教科ごとの合計の棒 */
export function PublicCalendar({ profile }: { profile: PublicStudyProfile }) {
  const [pick, setPick] = useState<number | null>(null);
  // E4（2026-10-30）：本人がしばらく開いていなくても、最後の日＝今日にそろえる（マイページのタブと同じ数字）
  const cal = useMemo(() => alignCal(profile.cal, profile.calEnd), [profile.cal, profile.calEnd]);
  const days = useMemo(() => Array.from({ length: 28 }, (_, i) => new Date(Date.now() - (27 - i) * 86_400_000)), []);
  if (!cal) return <p className="pp-empty" data-pp-empty="calendar">カレンダーはまだ公開されていません。{NOT_YET}</p>;
  const total = cal.reduce((a, b) => a + b, 0);
  const active = cal.filter((s) => s >= 60).length;
  const maxSec = Math.max(...cal);
  const best = maxSec > 0 ? cal.indexOf(maxSec) : -1;
  const subjMax = Math.max(1, ...profile.subjects.map((s) => s.sec));
  const shown = pick ?? best;
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return (
    <div className="ppc" data-public-calendar>
      <dl className="ppc-sum">
        <div><dt>この4週間</dt><dd>{formatStudyTime(total)}</dd></div>
        <div><dt>勉強した日</dt><dd>{active}<small>日</small></dd></div>
        <div><dt>1日平均</dt><dd>{formatStudyTime(Math.round(total / 28))}</dd></div>
      </dl>
      <ol className="ppc-wd" aria-hidden="true">{days.slice(0, 7).map((d, i) => <li key={i}>{WD[d.getDay()]}</li>)}</ol>
      <ol className="ppc-grid" aria-label="直近28日の勉強時間（色が濃いほど長い）">
        {cal.map((sec, i) => (
          <li key={i}>
            <button type="button" data-lv={level(sec) || undefined} data-best={i === best || undefined} aria-pressed={shown === i}
              data-today={i === 27 || undefined} onClick={() => setPick(i)} aria-label={`${md(days[i])} ${sec > 0 ? formatStudyTime(sec) : '記録なし'}`}>
              {days[i].getDate() === 1 || i === 0 ? <small>{days[i].getMonth() + 1}月</small> : null}{days[i].getDate()}
            </button>
          </li>
        ))}
      </ol>
      <p className="ppc-pick" aria-live="polite">
        {shown >= 0 ? <><b>{md(days[shown])}（{WD[days[shown].getDay()]}）</b>{cal[shown] > 0 ? formatStudyTime(cal[shown]) : '記録なし'}{shown === best && pick == null ? <span>いちばん長い日</span> : null}</> : 'この4週間の記録はまだありません。'}
      </p>
      {profile.subjects.length > 0 && (
        <section className="ppc-subj" aria-label="教科ごとの勉強時間（この4週間）">
          <h4>何をどれだけ</h4>
          <ul>
            {profile.subjects.map((s, i) => (
              <li key={s.id} data-i={i % 8}>
                <span className="ppc-subj-name">{s.id === 'app' ? 'マナトビ（演習・解説）' : subjectLabel(s.id)}</span>
                <svg className="ppc-subj-bar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                  <rect className="ppc-subj-track" width="100" height="10" rx="5" />
                  <rect className="ppc-subj-fill" width={Math.max(3, Math.round((s.sec / subjMax) * 100))} height="10" rx="5" />
                </svg>
                <b>{formatStudyTime(s.sec)}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const KIND_ORDER = ['pose', 'frame', 'hat', 'glasses', 'cheek', 'aura', 'wallpaper', 'stage'] as const;
const KIND_LABEL: Record<string, string> = { pose: 'ポーズ', frame: 'フレーム', hat: '帽子', glasses: 'メガネ', cheek: 'ほっぺ', aura: 'オーラ', wallpaper: '壁紙', stage: 'ホーム背景' };

/** きせかえ：持っているアイテムを、その子のとびら君に着せた姿で並べる */
export function PublicOutfit({ profile, base }: { profile: PublicStudyProfile; base: GrowthProgress }) {
  const [kind, setKind] = useState<string>('all');
  const items = useMemo(() => profile.owned.map((id) => itemById(id)).filter((it): it is NonNullable<typeof it> => !!it && it.kind !== 'print')
    .sort((a, b) => KIND_ORDER.indexOf(a.kind as typeof KIND_ORDER[number]) - KIND_ORDER.indexOf(b.kind as typeof KIND_ORDER[number])), [profile.owned]);
  if (items.length === 0) return <p className="pp-empty" data-pp-empty="outfit">きせかえはまだ公開されていません。{NOT_YET}</p>;
  const kinds = KIND_ORDER.filter((k) => items.some((it) => it.kind === k));
  const shown = kind === 'all' ? items : items.filter((it) => it.kind === kind);
  const isOn = (id: string, k: string) => (base.equipped as Record<string, string>)[k] === id;
  return (
    <div className="ppo" data-public-outfit>
      <div className="ppo-chips" role="group" aria-label="種類でしぼる">
        <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>すべて<span>{items.length}</span></button>
        {kinds.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{KIND_LABEL[k]}<span>{items.filter((it) => it.kind === k).length}</span></button>)}
      </div>
      <ul className="ppo-grid">
        {shown.map((it) => (
          <li key={it.id} data-on={isOn(it.id, it.kind) || undefined} data-rarity={it.rarity || undefined}>
            <GrowthAvatar progress={{ ...base, owned: [...base.owned, it.id], equipped: { ...base.equipped, [it.kind]: it.id } }} size={56} showLevel={false} />
            <span>{it.label}</span>
            {isOn(it.id, it.kind) && <em>つけている</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 称号：取った称号を上に、まだのものは鍵つきで薄く */
export function PublicBadges({ profile }: { profile: PublicStudyProfile }) {
  const got = useMemo(() => new Set(profile.badgeIds), [profile.badgeIds]);
  if (profile.badgeIds.length === 0 && profile.badges == null) return <p className="pp-empty" data-pp-empty="badges">称号はまだ公開されていません。{NOT_YET}</p>;
  const list = [...BADGES].sort((a, b) => Number(got.has(b.id)) - Number(got.has(a.id)) || b.tier - a.tier);
  const n = BADGES.filter((b) => got.has(b.id)).length;
  return (
    <div className="ppb" data-public-badges>
      <p className="ppb-head"><b>{n}</b> / {BADGES.length} 取得
        <svg className="ppb-meter" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="8" rx="4" className="ppb-track" /><rect width={Math.round((n / BADGES.length) * 100)} height="8" rx="4" className="ppb-fill" /></svg>
      </p>
      <ul className="ppb-grid">
        {list.map((b) => (
          <li key={b.id} data-got={got.has(b.id) || undefined} data-tier={b.tier} data-title={profile.title === b.id || undefined}>
            <span className="ppb-emoji" aria-hidden="true">{got.has(b.id) ? b.emoji : <Lock size={16} />}</span>
            <span className="ppb-text"><b>{b.label}</b><small>{b.desc}</small></span>
            {profile.title === b.id && <em>つけている</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** マイPDF：持っているPDFの表紙（見るだけ。ほかの人のPDFは保存できない） */
export function PublicPrints({ profile }: { profile: PublicStudyProfile }) {
  const prints = useMemo(() => profile.owned.map((id) => printOf(id)).filter((p): p is NonNullable<typeof p> => !!p), [profile.owned]);
  if (prints.length === 0) return <p className="pp-empty" data-pp-empty="prints">{profile.owned.length === 0 ? `マイPDFはまだ公開されていません。${NOT_YET}` : 'まだPDFを持っていません。'}</p>;
  return (
    <div className="ppp" data-public-prints>
      <p className="ppp-head"><b>{prints.length}</b>冊のPDFを持っています（表紙だけ見られます）</p>
      <ul className="ppp-grid">
        {prints.map((p) => (
          <li key={p.id}>
            <img src={p.thumb} alt={`${p.label}の表紙`} loading="lazy" />
            <span>{p.label}</span>
            <small>{p.category}・{p.pages}ページ</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
