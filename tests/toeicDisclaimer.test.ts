import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOEIC_DISCLAIMER } from '../src/utils/toeicDisclaimer';

const launchScreen = readFileSync('src/components/LaunchScreen.tsx', 'utf8');
const chapterSelection = readFileSync('src/components/ChapterSelection.tsx', 'utf8');
const launchCss = readFileSync('src/components/launch-screen.css', 'utf8');
const storeCopy = readFileSync('docs/APP_STORE_WHATS_NEW_2026-11.md', 'utf8');
const etsNotice = 'TOEIC® is a registered trademark of ETS. This product is not endorsed or approved by ETS.';

it('TOEIC disclaimer is shared and displayed on the opening screen legibly', () => {
  expect(TOEIC_DISCLAIMER).toContain('TOEIC®はETSの登録商標です');
  expect(TOEIC_DISCLAIMER).toContain('ETSの承認・推奨を受けたものではありません');
  expect(launchScreen).toContain("from '../utils/toeicDisclaimer'");
  expect(launchScreen).toContain('className="launch-emblem-disclaimer">{TOEIC_DISCLAIMER}</p>');
  expect(launchScreen).toContain('className="launch-trademark-disclaimer" data-toeic-disclaimer>{TOEIC_DISCLAIMER}</p>');
  expect(chapterSelection).toContain("from '../utils/toeicDisclaimer'");
  expect(chapterSelection).toContain('data-toeic-disclaimer>{TOEIC_DISCLAIMER}</p>');
  expect(launchCss).toMatch(/\.launch-emblem-disclaimer\s*\{[^}]*font-size:\s*12px/);
});

it('long and short App Store copy explicitly names TOEIC and includes the ETS notice', () => {
  expect(storeCopy).toContain('TOEIC® L&R TEST対策のPart 5〜7');
  expect(storeCopy.split(etsNotice)).toHaveLength(3);
});
