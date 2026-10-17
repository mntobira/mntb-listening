// lucide-react（アプリと同じ線アイコン・ISC）から必要なものの SVG 要素だけを取り出す
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url)); const ROOT = process.env.CODE_GUIDE_SRC || join(HERE, '../../..');
const D = join(ROOT, 'node_modules/lucide-react/dist/esm/icons/') + '/';
const NAMES = {screen:'monitor-smartphone',part:'puzzle',data:'database',net:'cloud',config:'settings-2',test:'flask-conical',
 media:'image-play',doc:'file-text',search:'search',folder:'folder',folderOpen:'folder-open',file:'file',chevron:'chevron-right',
 close:'x',solve:'pencil-line',learn:'lightbulb',review:'rotate-ccw',compete:'swords',boot:'power',battle:'swords',content:'library',
 logic:'cpu',assets:'archive',tools:'wrench',docs:'book-open',server:'server',native:'smartphone',users:'users',eng:'code-xml',
 gen:'sparkles',arrowIn:'arrow-down-left',arrowOut:'arrow-up-right',link:'link-2',layers:'layers',alert:'circle-alert',
 check:'circle-check',lines:'text-align-start',audio:'headphones',book:'book-marked',door:'door-open',filter:'list-filter',map:'map',print:'printer'};
const out = {};
for (const [k, n] of Object.entries(NAMES)) {
  const { __iconNode } = await import(D + n + '.js');
  out[k] = __iconNode.map(([t, a]) => '<' + t + Object.entries(a).filter(([x]) => x !== 'key').map(([x, v]) => ` ${x}="${v}"`).join('') + '/>').join('');
}
writeFileSync(join(HERE, '../data/icons.json'), JSON.stringify(out));
console.log(Object.keys(out).length);
