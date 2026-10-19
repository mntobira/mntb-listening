import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmAction, notify, setDialogHandlers } from '../src/utils/dialog';

afterEach(() => vi.unstubAllGlobals());

describe('dialog：お知らせと確認の窓口（監査 #28）', () => {
  it('既定ではブラウザ標準の alert / confirm を使う（従来どおり）', () => {
    const alert = vi.fn();
    const confirm = vi.fn(() => false);
    vi.stubGlobal('window', { alert, confirm });
    notify('保存しました');
    expect(alert).toHaveBeenCalledWith('保存しました');
    expect(confirmAction('削除しますか？')).toBe(false);
    expect(confirm).toHaveBeenCalledWith('削除しますか？');
  });

  it('差し替えられ、戻り値の関数で元に戻せる', () => {
    const shown: string[] = [];
    const restore = setDialogHandlers({ notify: (m) => shown.push(m), confirm: () => true });
    notify('a');
    expect(confirmAction('b')).toBe(true);
    expect(shown).toEqual(['a']);
    restore();
    const confirm = vi.fn(() => false);
    vi.stubGlobal('window', { alert: vi.fn(), confirm });
    expect(confirmAction('c')).toBe(false);
  });

  it('画面のコードは window.alert / window.confirm を直接呼ばない（窓口を1か所に保つ）', () => {
    const root = join(__dirname, '..', 'src');
    const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
    const hits = walk(root)
      .filter((f) => !f.endsWith(join('utils', 'dialog.ts')))
      .flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => ({ f, l, i })))
      .filter(({ l }) => /(^|[^\w.])(window\.)?(alert|confirm)\(/.test(l) && !/^\s*(\*|\/\/)/.test(l))
      .map(({ f, i }) => `${f.slice(root.length + 1)}:${i + 1}`);
    expect(hits).toEqual([]);
  });
});
