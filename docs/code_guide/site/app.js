/* コードの図鑑 — 操作（外部への通信なし。データは window.__DATA__ に埋め込み済み） */
(() => {
const D = window.__DATA__;
const ICON = D.icons;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ico = (k, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`;
const TAGS = D.tags; // [{id,label,icon,bg}]
const TAG = Object.fromEntries(TAGS.map(t => [t.label, t]));
const SYS = Object.fromEntries(D.sys.map(s => [s.id, s]));
const FLOW = D.flowSteps;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Kinetic Typography（見える文字は ::before、読み上げは sr-only） ── */
function kinetic(el, { step = 28, delay = 0, variant = '' } = {}) {
  const text = el.textContent;
  const seg = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text)].map(s => s.segment) : [...text];
  const STICK = /[、。，．・：；！？」』）】〕\)\]]/; const out = [];
  for (const g of seg) { if (out.length && STICK.test(g)) out[out.length - 1] += g; else if (out.length && /[A-Za-z0-9]/.test(g) && /[A-Za-z0-9]$/.test(out[out.length - 1])) out[out.length - 1] += g; else out.push(g); }
  el.innerHTML = `<span class="sr-only">${esc(text)}</span><span aria-hidden="true">${out.map((c, i) => c === ' ' ? ' ' : `<span class="kt-ch" data-ch="${esc(c)}" style="--i:${i}"></span>`).join('')}</span>`;
  el.classList.add('kt'); if (variant) el.classList.add('kt-' + variant);
  el.style.setProperty('--kt-step', step + 'ms'); el.style.setProperty('--kt-delay', delay + 's');
}
document.querySelectorAll('[data-kt]').forEach(el => kinetic(el, { delay: +(el.dataset.ktDelay || 0), step: +(el.dataset.ktStep || 28), variant: el.dataset.kt }));

/* ── 数字のカウントアップ（幅は最初から確保） ── */
function countUp(host) { let el = host;
  const to = +host.dataset.to; const fmt = n => n.toLocaleString('ja-JP');
  const out = document.createElement('span'); out.setAttribute('aria-hidden', 'true'); host.setAttribute('aria-label', fmt(to)); host.setAttribute('role','text'); host.textContent = ''; host.appendChild(out); el = out;
  if (reduce) { el.textContent = fmt(to); return; }
  const t0 = performance.now(); const dur = 1200 + Math.min(900, Math.log10(to + 1) * 220);
  const tick = t => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); if (e.target.dataset.to) countUp(e.target); e.target.classList.add('in'); } }), { threshold: .3 }) : null;
document.querySelectorAll('[data-to]').forEach(el => io ? io.observe(el) : countUp(el));

/* ── 状態 ── */
const S = { q: '', tag: '', sys: '', flow: '', folder: '', open: null, limit: 60, audience: localStorage.getItem('zukan.aud') || 'gen' };
const cards = D.cards;
const byId = Object.fromEntries(cards.map(c => [c.id, c]));
const byPath = Object.fromEntries(cards.filter(c => c.kind === 'file').map(c => [c.path, c]));
const bundleOf = {}; cards.filter(c => c.kind === 'bundle').forEach(b => (b.members || []).forEach(m => bundleOf[m] = b));
const norm = s => s.normalize('NFKC').toLowerCase();
const hay = Object.fromEntries(cards.map(c => [c.id, norm([c.path, c.name, ...(c.members || []), c.one, c.detail, c.tag, (c.exports || []).join(' '), (D.sysLabel[c.sys] || '')].join(' '))]));

function setAudience(a) {
  S.audience = a; localStorage.setItem('zukan.aud', a);
  document.body.classList.toggle('eng', a === 'eng');
  document.querySelectorAll('.audience button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.aud === a)));
  render(); if (S.open) openCard(S.open, false);
}
document.querySelectorAll('.audience button').forEach(b => b.addEventListener('click', () => setAudience(b.dataset.aud)));

function match(c) {
  if (S.tag && c.tag !== S.tag) return false;
  if (S.sys && c.sys !== S.sys) return false;
  if (S.flow && !c.flow.includes(S.flow)) return false;
  if (S.folder) { const p = c.kind === 'bundle' ? c.tree : c.path; if (!(S.folder === '(ルート)' ? (c.kind === 'bundle' ? c.tree === '(ルート)' : !c.path.includes('/')) : (p === S.folder || p.startsWith(S.folder + '/')))) return false; }
  if (S.q) { const words = norm(S.q).split(/\s+/).filter(Boolean); const expanded = words.map(w => [w, ...(D.synonyms[w] || [])]); if (!expanded.every(alts => alts.some(a => hay[c.id].includes(norm(a))))) return false; }
  return true;
}
const confRank = { '低': 0, '中': 1, '高': 2 };
const head = Object.fromEntries(cards.map(c => [c.id, norm(c.name + ' ' + c.one)]));
function score(c) {
  if (!S.q) return 0; let sc = 0;
  for (const w of norm(S.q).split(/\s+/).filter(Boolean)) { if (head[c.id].includes(w)) sc += 10; else if (hay[c.id].includes(w)) sc += 4; else sc += 1; }
  return sc;
}
function sorted(list) {
  const sc = Object.fromEntries(list.map(c => [c.id, score(c)]));
  return list.sort((a, b) => sc[b.id] - sc[a.id] || (b.kind === 'file') - (a.kind === 'file') || a.path.localeCompare(b.path, 'ja'));
}

/* ── 一覧 ── */
const listEl = $('#list'), statusEl = $('#status');
function item(c, k) {
  const t = TAG[c.tag];
  const name = S.audience === 'eng' ? `<span class="mono">${esc(c.path)}</span>` : esc(c.kind === 'bundle' ? c.name : c.name);
  const sub = S.audience === 'eng' ? (c.kind === 'bundle' ? esc(c.name) + ' — ' : '') + esc(c.one) : esc(c.one);
  return `<button class="item${S.flow && c.flow.includes(S.flow) ? ' hl' : ''}" data-id="${esc(c.id)}" style="--k:${k}" ${S.open === c.id ? 'aria-current="true"' : ''}>
    <span class="row"><span class="tag" style="--bg:${t.bg}">${ico(t.icon)}${esc(c.tag)}</span>
    ${c.kind === 'bundle' ? `<span class="bundle-mark">${ico('layers')}${c.count.toLocaleString()}件をまとめて</span>` : ''}
    <span class="conf${c.conf === '低' ? ' low' : ''}">${c.conf === '低' ? ico('alert') + '要確認' : '確信度 ' + c.conf}</span></span>
    <span class="nm">${name}</span><span class="one">${sub}</span>
    <span class="meta"><span>${c.lines.toLocaleString()} 行</span>${c.kind === 'file' && S.audience === 'gen' ? `<span>${esc(c.folder)}</span>` : ''}${S.audience === 'eng' && c.kind === 'file' ? `<span>in ${c.nImports} / by ${c.nBy}</span>` : ''}</span></button>`;
}
function render() {
  const hits = sorted(cards.filter(match));
  const shown = hits.slice(0, S.limit);
  listEl.innerHTML = shown.length ? shown.map(item).join('') : `<div class="empty">当てはまるファイルがありません。言葉を変えるか、絞り込みを外してください。</div>`;
  const files = hits.reduce((n, c) => n + (c.count || 1), 0);
  const filters = [S.q && `「${esc(S.q)}」`, S.tag && esc(S.tag), S.sys && esc(D.sysLabel[S.sys]), S.flow && esc(FLOW.find(f => f.id === S.flow).label), S.folder && esc(S.folder)].filter(Boolean);
  statusEl.innerHTML = `<span><b>${hits.length.toLocaleString()}</b> 枚（ファイル ${files.toLocaleString()} 件ぶん）</span>${filters.length ? filters.map(f => `<mark>${f}</mark>`).join('') + '<button class="clear" id="clear">絞り込みを外す</button>' : ''}`;
  $('#more').hidden = hits.length <= S.limit;
  $('#more button').textContent = `さらに表示（残り ${(hits.length - S.limit).toLocaleString()} 枚）`;
  document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tag === S.tag)));
  document.querySelectorAll('.node').forEach(n => { n.classList.toggle('on', n.dataset.sys === S.sys); n.setAttribute('aria-pressed', String(n.dataset.sys === S.sys)); });
  document.querySelectorAll('.step').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.flow === S.flow)));
  const ok = new Set(hits.map(c => c.id));
  document.querySelectorAll('.tree li>button').forEach(b => { b.classList.toggle('dim', !ok.has(b.dataset.id)); b.toggleAttribute('aria-current', b.dataset.id === S.open); });
  const clr = $('#clear'); if (clr) clr.addEventListener('click', () => { Object.assign(S, { q: '', tag: '', sys: '', flow: '', folder: '', limit: 60 }); $('#q').value = ''; render(); });
  document.querySelectorAll('.edge').forEach(e => e.classList.toggle('hot', !!S.sys && (e.dataset.a === S.sys || e.dataset.b === S.sys)));
}
listEl.addEventListener('click', e => { const b = e.target.closest('.item'); if (b) openCard(b.dataset.id); });
$('#more button').addEventListener('click', () => { S.limit += 120; render(); });
let qt; $('#q').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { S.q = e.target.value.trim(); S.limit = 60; render(); }, 120); });

/* タグ */
$('#chips').innerHTML = TAGS.map(t => `<button class="chip" data-tag="${esc(t.label)}" style="--bg:${t.bg}" aria-pressed="false">${ico(t.icon)}${esc(t.label)}<span class="c">${(D.stats.tags[t.label] || 0).toLocaleString()}</span></button>`).join('');
$('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; S.tag = S.tag === b.dataset.tag ? '' : b.dataset.tag; S.limit = 60; render(); });

/* しくみの図 */
document.querySelectorAll('.node').forEach(n => {
  const go = () => { S.sys = S.sys === n.dataset.sys ? '' : n.dataset.sys; S.limit = 60; render(); if (S.sys) $('#atlas').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  n.addEventListener('click', go); n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
});
document.querySelectorAll('.edge').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (_) {} });

/* ユーザーの流れ */
document.querySelectorAll('.step').forEach(b => b.addEventListener('click', () => { S.flow = S.flow === b.dataset.flow ? '' : b.dataset.flow; S.limit = 200; render(); if (S.flow) $('#atlas').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }));

/* 木 */
function buildTree() {
  const root = {};
  for (const c of cards) {
    let node = root;
    const dirs = c.kind === 'bundle' ? c.tree.split('/') : c.path.split('/').slice(0, -1);
    if (!dirs.length || dirs[0] === '(ルート)') { (root['(ルート)'] ??= { __files: [] }).__files.push(c); continue; }
    for (const d of dirs) node = (node[d] ??= { __files: [] });
    node.__files.push(c);
  }
  const count = n => n.__files.reduce((s, c) => s + (c.count || 1), 0) + Object.keys(n).filter(k => k !== '__files').reduce((s, k) => s + count(n[k]), 0);
  const walk = (n, path, depth) => Object.keys(n).filter(k => k !== '__files').sort((a, b) => (a === '(ルート)') - (b === '(ルート)') || a.localeCompare(b)).map(k => {
    const p = path ? path + '/' + k : k; const ch = n[k];
    return `<li><details${depth === 0 && k === 'src' ? ' open' : ''}><summary data-folder="${esc(p)}">${ico('chevron', 'ico chev')}${ico('folder')}<span>${esc(k === '(ルート)' ? 'リポジトリ直下' : k)}</span><span class="cnt">${count(ch).toLocaleString()}</span></summary><ul>${walk(ch, p, depth + 1)}${ch.__files.sort((a, b) => a.path.localeCompare(b.path)).map(c => `<li><button data-id="${esc(c.id)}">${ico(c.kind === 'bundle' ? 'layers' : 'file')}<span class="nm">${esc(c.kind === 'bundle' ? c.name : c.name)}</span></button></li>`).join('')}</ul></details></li>`;
  }).join('');
  $('#tree').innerHTML = `<ul>${walk(root, '', 0)}</ul>`;
}
buildTree();
$('#tree').addEventListener('click', e => {
  const b = e.target.closest('li>button'); if (b) { openCard(b.dataset.id); return; }
  const s = e.target.closest('summary');
  if (s && e.target.closest('span:not(.cnt)') && !e.target.closest('.chev')) { S.folder = S.folder === s.dataset.folder ? '' : s.dataset.folder; S.limit = 60; setTimeout(render); }
});

/* カード（詳細） */
const sheet = $('#sheet'), back = $('#sheet-back');
let lastFocus = null;
function linkBtn(l) {
  const t = byPath[l.path] || bundleOf[l.path];
  const lab = { from: '呼ばれる', to: '呼ぶ', ref: '名前が出る' }[l.dir];
  const ic = { from: 'arrowIn', to: 'arrowOut', ref: 'link' }[l.dir];
  const nm = S.audience === 'eng' || !t ? `<span class="mono">${esc(l.path)}</span>` : `<span><b>${esc(t.name)}</b> — ${esc(t.one)}</span>`;
  return `<button ${t ? `data-id="${esc(t.id)}"` : 'disabled'}>${ico(ic)}<span class="dir">${lab}</span>${nm}</button>`;
}
function openCard(id, focus = true) {
  const c = byId[id]; if (!c) return; S.open = id;
  const t = TAG[c.tag]; const maxL = D.maxLines;
  const w = Math.max(2, Math.round(Math.log10(c.lines + 1) / Math.log10(maxL + 1) * 100));
  let f = 0; const F = (icon, title, html) => `<section class="field" style="--f:${f++}"><h4>${ico(icon)}${title}</h4>${html}</section>`;
  sheet.innerHTML = `<header><div class="row"><span class="tag" style="--bg:${t.bg}">${ico(t.icon)}${esc(c.tag)}</span><span class="conf${c.conf === '低' ? ' low' : ''}">${c.conf === '低' ? ico('alert') + '確信度 低（要確認）' : ico('check') + '確信度 ' + c.conf}</span><button class="x" id="x" aria-label="カードを閉じる">${ico('close')}</button></div>
    <h3 id="sheet-title">${esc(c.kind === 'bundle' ? c.name : c.name)}</h3><div class="path">${esc(c.path)}</div></header>
    <div class="body">
    ${F('door', 'ひとことで', `<p class="one">${esc(c.one)}</p>`)}
    ${F('lines', 'くわしく', `<p>${esc(c.detail)}</p>`)}
    ${c.conf === '低' ? `<div class="warn">${ico('alert')}<span>このファイルは使われている場所をコードから確かめられませんでした。消してよいかどうかは、作った人に確認が必要です。</span></div>` : ''}
    ${c.kind === 'file' ? F('link', 'つながり（主なもの最大3つ）', c.links.length ? `<div class="links">${c.links.map(linkBtn).join('')}</div>` : '<p>import でのつながりも、名前の出てくる他ファイルも見つかりませんでした。</p>') : F('layers', 'まとめた中身', `<p>${c.count.toLocaleString()} 件（${Object.entries(c.exts).map(([e, n]) => `${esc(e)} ${n}`).join(' / ')}）。例：</p><ul class="members">${c.members.slice(0, 5).map(m => `<li>${esc(m)}</li>`).join('')}</ul>`)}
    ${F('lines', '規模', `<div class="scale"><b>${c.lines.toLocaleString()} 行</b><span class="meter" aria-hidden="true"><i style="width:${w}%"></i></span></div><p style="font-size:13px;color:var(--ink-3);margin-top:4px">${c.kind === 'bundle' ? `テキストのファイルだけの改行数の合計。容量は ${(c.bytes / 1048576).toFixed(1)} MB。` : '改行の数（wc -l と同じ数え方）。棒はいちばん大きいファイルとの比較（対数）。'}</p>`)}
    ${F('map', 'しくみの図での場所', `<p>${ico(SYS[c.sys].icon)} ${esc(D.sysLabel[c.sys])}${c.flow.length ? ' ／ ユーザーの流れ：' + c.flow.map(x => esc(FLOW.find(s => s.id === x).label)).join('・') : ''}</p>`)}
    ${c.exports && c.exports.length ? `<section class="field eng-only" style="--f:${f++}"><h4>${ico('eng')}公開している名前（export）</h4><div class="exports">${c.exports.map(x => `<code>${esc(x)}</code>`).join('')}</div></section>` : ''}
    </div>`;
  if (!sheet.open) { lastFocus = document.activeElement; }
  sheet.hidden = false; back.hidden = false; sheet.open = true;
  $('#x').addEventListener('click', closeCard);
  sheet.querySelectorAll('.links button[data-id]').forEach(b => b.addEventListener('click', () => openCard(b.dataset.id)));
  if (focus) $('#x').focus();
  document.querySelectorAll('.item').forEach(b => b.toggleAttribute('aria-current', b.dataset.id === id));
  document.querySelectorAll('.tree li>button').forEach(b => b.toggleAttribute('aria-current', b.dataset.id === id));
  history.replaceState(null, '', '#' + encodeURIComponent(id));
}
function closeCard() { sheet.hidden = true; back.hidden = true; sheet.open = false; S.open = null; history.replaceState(null, '', location.pathname); document.querySelectorAll('[aria-current]').forEach(b => b.removeAttribute('aria-current')); if (lastFocus) lastFocus.focus(); }
back.addEventListener('click', closeCard);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.open) closeCard(); if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#q').focus(); } });
sheet.addEventListener('keydown', e => { if (e.key !== 'Tab') return; const f = [...sheet.querySelectorAll('button:not([disabled])')]; if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } });

setAudience(S.audience);
const h = decodeURIComponent(location.hash.slice(1)); if (h && byId[h]) openCard(h, false);
window.__zukan = { S, render, openCard, closeCard };
})();
