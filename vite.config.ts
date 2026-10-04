import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * ★本番ビルドだけ CSP を <meta> でも入れる（2026-10-04）★
 *   _headers / vercel.json の CSP は「Webで配信したとき」しか効かない。
 *   ZIP にまとめてアプリとして包む・別ホスティングに置く場合でも、
 *   スクリプト注入（XSS）や外部への送信を止められるよう HTML 自体に書く。
 *   値は public/_headers と同じものを使う（片方だけ直して食い違う事故を防ぐ）。
 *   frame-ancestors / upgrade-insecure-requests は <meta> では無視・警告になるので外す。
 *   ローカル（エミュレータ・デモ）では 127.0.0.1 へ通信するので入れない。
 */
function releaseCsp(enabled: boolean): Plugin {
  return {
    name: 'release-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      if (!enabled) return html;
      const headers = fs.readFileSync(path.resolve(__dirname, 'public/_headers'), 'utf8');
      const line = headers.split('\n').find(l => l.trim().startsWith('Content-Security-Policy:'));
      if (!line) throw new Error('public/_headers に Content-Security-Policy がありません');
      const csp = line.split('Content-Security-Policy:')[1]
        .split(';').map(d => d.trim())
        .filter(d => d && !/^(frame-ancestors|upgrade-insecure-requests|report-uri|sandbox)\b/.test(d))
        .join('; ');
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`);
    },
  };
}

/**
 * 宣伝用ページ（/message）の OGP は絶対URLが要るので、公開URLを VITE_SITE_URL で渡す（2026-10-05）。
 * 未設定のときは Vercel が自動で入れる本番URL（VERCEL_PROJECT_PRODUCTION_URL）→ それも無ければ相対パス。
 */
function siteUrl(env: Record<string, string>): Plugin {
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
  const url = (env.VITE_SITE_URL || fromVercel).replace(/\/$/, '');
  return { name: 'site-url', transformIndexHtml: html => html.replaceAll('%SITE_URL%', url) };
}

export default defineConfig(({mode}) => {
 const env = loadEnv(mode, process.cwd(), 'VITE_');
 const release = Boolean(env.VITE_FIREBASE_API_KEY) && env.VITE_USE_EMULATORS !== 'true';
 return {
  plugins: [react(), tailwindcss(), releaseCsp(release), siteUrl(env)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    // Inline assets smaller than 2MB (including our 1.1MB BGM), but never inline
    // webfonts. KaTeX ships woff2/woff/ttf for every math face; base64-inlining
    // them would add ~1.5MB to the render-blocking CSS even though the browser
    // only ever downloads the woff2 it needs.
    assetsInlineLimit: (filePath: string, content: Buffer) => {
      if (/\.(woff2?|ttf|otf|eot)$/i.test(filePath)) return false;
      return content.length < 2000000;
    },
    /*
     * ★ビルド設定（すべて実測に基づく。詳細は docs/BUILD.md）★
     *
     * ■ 前提: OOM の原因は環境であって、アプリの構造ではない
     *   GenSpark のサンドボックスは「メモリ 985MB / swap 0」。
     *   ここでは素の vite build が
     *     ✓ 2250 modules transformed → Killed（終了コード 137 = SIGKILL）
     *   となる。swap を 4GB 足すと、コードも設定も一切変えずに成功する。
     *   → 本番（Vercel 等）は十分なメモリがあるため元から問題は起きない。
     *
     * ■ 実測（swap 有効下でピーク RSS を比較。985MB に収まるかの判定に使う）
     *     素の設定                    : peak 809MB / 17s
     *     + manualChunks              : peak 805MB / 15s  ← メモリ効果なし（誤差）
     *     + maxParallelFileOps: 2     : peak 776MB / 16s  ← -33MB の実効果
     *   ★manualChunks はメモリ対策としては効かない★ ので、
     *   「メモリのために入れている」とは書かない。残す理由は下に書いた配信面の利点。
     *   なお sourcemap: false は Vite の既定値と同じなので、明示せず削除した。
     */
    reportCompressedSize: false,
    rollupOptions: {
      // ★入口は2つ★ アプリ本体（/）と、宣伝用の理念ページ（/message・アプリ本体を読み込まない軽いページ）
      input: { main: path.resolve(__dirname, 'index.html'), message: path.resolve(__dirname, 'message/index.html') },
      // A successful build with a circular chunk can still crash before React mounts.
      // Reject that artifact instead of shipping another blank startup screen.
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_CHUNK' || warning.code === 'CYCLIC_CROSS_CHUNK_REEXPORT') {
          throw new Error(`Unsafe production chunk graph: ${warning.message}`);
        }
        warn(warning);
      },
      // Rollup が同時に開くファイル数を絞る。既定は CPU 数に応じて増えるため、
      // 並列数がそのままメモリのピークに乗る。実測で -33MB。
      // 出力内容は並列数に影響されないので、成果物は同一。
      maxParallelFileOps: 2,
      output: {
        /*
         * ■ manualChunks を残す理由（メモリではなく「配信とキャッシュ」）
         *   分割前は index.js が単一チャンクで 5,243.21 kB。
         *   これを vendor 系 + data + index に分けると、
         *   ・ライブラリ（firebase / katex / react 等）は変更頻度が低いので、
         *     アプリを更新してもブラウザのキャッシュが効き続ける
         *   ・教科データを追加したとき、再ダウンロードされるのは data だけ
         *   今後アプリが大きくなるほど効く設定なので残す。
         *
         * ■ UI に影響しない理由
         *   manualChunks は「同じモジュール群をどのファイルに出力するか」だけを
         *   決める設定で、import される内容・実行順序・副作用は変えない。
         *   静的 import は従来どおり全部読み込まれ（dist/index.html で
         *   全チャンクが modulepreload される）、
         *   画面・デザイン・フォント・遷移・アニメーションは変化しない。
         *   （lazy 化＝読み込み「時期」を変える対応とは別物。今回は変えていない）
         */
        manualChunks: (id: string) => {
          // node_modules は変更頻度が低いので、用途ごとに固定チャンクへ。
          if (id.includes('node_modules')) {
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
            if (id.includes('/katex/')) return 'vendor-katex';
            if (id.includes('/motion') || id.includes('/framer-motion')) return 'vendor-motion';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/'))
              return 'vendor-react';
            return 'vendor';
          }

          /*
           * ★教科データは1つのチャンクにまとめる（分割してはいけない）★
           *
           * ■ 最初は教科ごとに分けたが、それは動かなかった
           *   data-chemistry / data-english-listening / data-biology … と
           *   教科別に分けたところ、ビルドは成功するのに本番の画面が
           *   真っ白になった。ブラウザのエラーは
           *     Cannot access 'D' before initialization
           *   で、Rollup も明確に警告を出していた:
           *     Circular chunk: data-chemistry -> data-english-listening -> data-chemistry
           *     Circular chunk: data-english-grammar -> data-chemistry -> data-english-grammar
           *
           * ■ なぜ起きるか（依存グラフを機械的に解析して特定した）
           *   ★ファイル単位の循環依存は 0 件★ である（164ファイル / 383辺を
           *   Tarjan の SCC で検査。相互 import も 0 件）。
           *   つまり「教科データ同士が循環している」わけではない。
           *   原因は src/data/chapterCatalog.ts が
           *     chemistryData / chemistryAdvancedData / englishListeningData /
           *     mathData / biologyBasicData / englishGrammarData
           *   の全教科をまとめて import している「ハブ」だからである。
           *   このハブを教科別チャンクのどれか1つに入れると、
           *   そのチャンクが他の全教科チャンクに依存し、
           *   さらに他教科がハブ側の共有物を参照して戻るため、
           *   ファイル単位では循環していないのに
           *   ★チャンク単位でだけ循環が生まれる★。
           *   ESM はチャンク間の初期化順を決められず
           *   「Cannot access 'D' before initialization」で真っ白になる。
           *
           * ■ したがって src/data はまとめて 1 チャンクにする
           *   これで「巨大な単一 index.js」を割る目的は達成できる
           *   （index / data / vendor 系に分かれる）。
           *   将来 data チャンクを教科別に割りたい場合は、
           *   先に chapterCatalog のような「全教科を集めるハブ」を
           *   解消する（章の定義を各教科側から登録する形にする）ことが前提。
           *   ハブを残したままチャンクだけ割ると必ず真っ白になる。
           */
          /*
           * ★例外: 章の「軽い索引」だけは data チャンクに入れない★
           *
           * ■ なぜ例外が必要か（実測で分かった穴）
           *   src/data/chapterIndex.generated.ts は
           *   「章ID・章名・大問数」だけを持つ 24,972 バイトの軽いファイルで、
           *   ホーム画面が教科データ本体（約2.6MB）を読まずに
           *   進捗の分母を出せるようにするために作った。
           *
           *   ところが上の `id.includes('/src/data/')` は
           *   src/data 配下を無条件に data チャンクへ送るので、
           *   この索引も 3,055,906 バイトの data チャンクの中に
           *   埋め込まれてしまっていた（ビルド結果を grep して確認。
           *   data チャンク側に problemCount が 162 個、
           *   index チャンク側には 3 個しか無かった）。
           *
           *   つまり「ホームは索引だけ読む」ようにコードを直しても、
           *   ★配信の単位が 3MB のままなので効果が出ない★。
           *   索引を作った意味そのものが消えていた。
           *
           * ■ なぜこの例外は安全か（真っ白問題を再発させない根拠）
           *   上に書いたとおり、data チャンクを分割してはいけない理由は
           *   「全教科を集めるハブがあるとチャンク単位の循環が生まれる」
           *   ことだった。
           *   一方この索引は ★他のモジュールを一切 import しない葉★ である
           *   （自動生成の時点で import 文を出さない設計にしてあり、
           *   tests/chapterIndex.test.ts が import 文の存在を禁止している）。
           *   出ていく辺が 0 本のモジュールは、
           *   どのチャンクに置いてもチャンク間の循環に加われない。
           *   よって Cannot access 'D' before initialization は起こり得ない。
           *
           * ■ undefined を返す（＝専用チャンクを作らない）理由
           *   索引を使うのはホーム画面で、ホームはアプリ本体（index チャンク）に
           *   含まれている。専用チャンクにすると
           *   起動時に HTTP リクエストが1本増えるだけで得がない。
           *   undefined を返してアプリ本体と同じチャンクに載せるのが最小構成。
           */
          if (id.includes('/src/data/chapterIndex.generated')) return undefined;

          /*
           * ★例外2: 章カタログも data チャンクに入れない★
           *
           * ■ 何が起きていたか（実測）
           *   src/data/chapterCatalog.ts は先生ダッシュボードのために
           *   「章ID・章名・大問数」を返すだけのファイルで、
           *   もう教科データ本体を一切 import していない
           *   （実行時 import は chapterIndex.generated の1本だけ。
           *     allChapters と studySummary は import type なので実行時に消える）。
           *
           *   ところが上の `id.includes('/src/data/')` は src/data 配下を
           *   無条件に data チャンクへ送るため、軽くしたこのファイルも
           *   3MB の data チャンクに入れられていた。
           *   さらに悪いことに、★このファイルが data チャンクに居ると
           *   索引まで data チャンク側へ引き寄せられた★。
           *   ビルド結果を grep すると
           *     直前のビルド : index に problemCount 165 個 / data に   0 個
           *     このビルド   : index に problemCount   3 個 / data に 164 個
           *   と逆転していた。索引を index 側へ置く例外1が、
           *   ★実質的に無効化されていた★ ということである。
           *
           *   これは前にも踏んだ落とし穴と同じで、
           *   「ソースの依存を軽くしても、配信の単位（チャンク）が
           *   3MB のままなら効果は出ない」。依存グラフだけを見て
           *   満足せず、必ず dist を grep して確かめる必要がある。
           *
           * ■ なぜこの例外は安全か（真っ白問題の再発根拠がない）
           *   data チャンクを割ってはいけない理由は
           *   「全教科を集めるハブがチャンク間の循環を作る」ことだった。
           *   chapterCatalog.ts の実行時の行き先は
           *   chapterIndex.generated（＝何も import しない葉）だけなので、
           *   このファイルから data チャンクへ向かう辺は1本も無い。
           *   辺が無ければチャンク間の循環に加われないので、
           *   Cannot access 'D' before initialization は起こり得ない。
           *
           *   ★この前提は思い込みではなく機械検査してある★
           *   tests/screenDataWeight.test.ts が chapterCatalog.ts の
           *   到達先（実行時 import のみを辿る）を測っており、
           *   教科データ本体へ届いた時点で必ず落ちる。
           *   落ちたときは、この例外行も一緒に見直すこと。
           */
          if (id.includes('/src/data/chapterCatalog')) return undefined;

          /*
           * ★例外3: 教科名の対応表も data チャンクに入れない★
           *
           * ■ 何が起きていたか（実測。★この例外を書き忘れて実際に後退させた★）
           *   教科名の対応表を1か所に集約するため
           *   src/data/subjectLabels.ts を新しく作った。
           *   このファイルの実コードはたった 443 バイトで、
           *   実行時に読むのは chapterIndex.generated（＝何も import しない葉）
           *   1本だけである。
           *
           *   ところが例外を書かなかったので、上の
           *   `id.includes('/src/data/')` に拾われて 3MB の data チャンクへ入り、
           *   ★起動画面（SubjectSelection）が data チャンクを参照する形★
           *   になった。その結果、例外1で index 側に置いていた索引まで
           *   data チャンク側へ引き寄せられた。ビルド結果を grep すると
           *     この例外を書く前 : index の problemCount   5 個 / data に 162 個
           *     例外を書いたあと : index の problemCount 167 個 / data に   0 個
           *   と逆転していた。チャンクの大きさも
           *     index 1,052.63 → 1,033.63 kB（-19.00）
           *     data  3,041.81 → 3,060.79 kB（+18.98）
           *   とほぼ同量が移動しており、「減った」のではなく
           *   ★索引が重い側へ移っただけ★だった。
           *
           *   つまり例外2のコメントに書いてある落とし穴を、
           *   まったく同じ形でもう一度踏んだということである。
           *   ★軽くした data 層のファイルを新設したら、必ずこの例外も足す。★
           *   忘れても気づけるように、
           *   tests/chapterIndex.test.ts に「軽い data ファイルには
           *   例外が必要」を自動判定する検査を追加した（順序だけでなく
           *   ★例外の書き忘れそのもの★ を検出する）。
           *
           * ■ なぜこの例外は安全か（真っ白問題の再発根拠がない）
           *   data チャンクを割ってはいけない理由は
           *   「チャンク間に循環ができる」ことだった。実測すると
           *     subjectLabels へ入ってくる辺:
           *       SubjectSelection.tsx（index 側）
           *       chapterCatalog.ts（例外2で index 側）
           *       → data チャンクから来る辺は1本も無い
           *     subjectLabels から出ていく辺:
           *       chapterIndex.generated（例外1で index 側）
           *       → data チャンクへ向かう辺も1本も無い
           *   どちら向きにも辺が無いので、チャンク間の循環に加われない。
           *
           * ■ ★なぜ advancedFields.ts には同じ例外を付けないのか★
           *   同じく軽い葉（実コード 600 バイト）だが、こちらは
           *   chemistryAdvancedData.ts（＝data チャンク側）から
           *   再公開のために import されている。
           *   例外にすると「data チャンク → index チャンク」の辺ができ、
           *   index → data の辺と合わせて循環になる恐れがある。
           *   （前に per-subject 分割で出した
           *     Cannot access 'D' before initialization がこれ。）
           *   実際に例外を追加して測ったが、ビルド結果のハッシュは
           *   1バイトも変わらず効果が無かったので、その設定は取り消した。
           *   軽い葉なら何でも例外にしていい、という話ではない。
           *   ★入ってくる辺・出ていく辺の両方を数えて判断すること。★
           */
          if (id.includes('/src/data/subjectLabels')) return undefined;
          // 理念の文章は宣伝用ページ（/message）からも読むので、1MB の data チャンクに入れない（2026-10-05）
          if (id.includes('/src/data/philosophy')) return undefined;

          /*
           * ★まとめプリントのデータは data チャンクから切り離す★
           *
           * ■ この行は「LearningViewer を遅延読み込みにした後」で初めて効く
           *
           * 先に分割だけを試したときは効果がなかった（実測）:
           *   data 3,041.75 → 2,367.58 kB / data-learning 674.06 kB（循環 0）
           *   でも起動時に必ず落ちる JS は 5,253,265 → 5,253,186 B（−79 B だけ）
           *   遅延で落ちる JS は 0 B のまま
           * 理由は LearningViewer が静的 import されていたから。
           * チャンクを分けても、静的に繋がっていれば両方ダウンロードされる。
           * ★分割は削減ではない。静的 import を切るのが先。★
           * この実験はいったん取り消し、順序を入れ替えてやり直した。
           *
           * いま App.tsx 側で LearningViewer を React.lazy にしたので、
           * この 710,921 バイト / 16 ファイルの塊は
           * 「まとめプリントを開いたときに初めて読む」ものになる。
           *
           * ■ 安全性（両方向の辺を数えて確認した）
           *   - learningContent/* を読むのは LearningViewer だけ（他に 0 件・実測）
           *   - learningContent/* から src/data の他のファイルへの辺は無い
           *   → data チャンクとの間に循環はできない
           * 循環が出ていないことはビルドの Circular 警告 0 で確認する。
           */
          if (id.includes('/src/data/learningContent/')) return 'data-learning';

          /*
           * ============================================================
           * ★ここから: data チャンクを教科ごとに割る★
           * ============================================================
           *
           * ■ なぜ割る必要があるのか（実測にもとづく）
           *
           * 遅延読み込み（React.lazy）で
           *   App.tsx → allChapters / chemistryData
           *   ChapterSelection → allChapters
           * の3本の静的な線を切った。ソースの依存で測ると
           * 起動時に静的到達する src/data は
           *   59ファイル 2,971,031 B → 16ファイル 854,132 B
           * まで落ちた。
           *
           * ところが dist で測ると data チャンクは
           * ★まだ 2,368,092 B のまま起動時に落ちてきた。★
           *   起動時 JS 4,554,851 → 4,324,446 B（−230,405 B だけ）
           *
           * 理由は単純で、src/data 全部を1つの data チャンクに
           * まとめていたからである。起動時に必要な 854,132 B の部分が
           * data チャンクの中にある限り、同じチャンクに同居している
           * 残り 1.5 MB も一緒にダウンロードされる。
           * ★チャンクは「まとめてダウンロードされる単位」なので、
           *   1バイトでも必要なら全部落ちてくる。★
           *
           * つまり順序としては
           *   1. 静的 import を切る（済）
           *   2. そのうえでチャンクを割る（ここ）
           * の2段が必要で、どちらか片方だけでは減らない。
           * （逆順でやって −79 B しか減らなかった実験は
           *   上の data-learning のコメントに記録してある。）
           *
           * ■ ★過去に同じ分割で真っ白にした。その再発を防ぐ根拠★
           *
           * 以前 per-subject 分割をしたときは
           *   Cannot access 'D' before initialization
           * で画面が真っ白になった。原因は
           * 「チャンクAがチャンクBを待ち、BもAを待つ」＝
           * ★チャンク間の循環★ である。
           *
           * 今回は設定を書く前に、実際の依存グラフ（import type を除いた
           * 実行時の辺だけ）でグループ間の辺を全部数え、
           * 循環が0本であることを確認してから書いている。
           * 確認した辺の向きは次のとおりで、きれいに一方向である:
           *
           *   data-hub ─→ data-chem-basic ─┐
           *            ─→ data-chem-adv   ─┤
           *            ─→ data-english-l  ─┼─→ data-shared
           *            ─→ data-english-g  ─┤    （problemCount など）
           *            ─→ data-math       ─┤
           *            ─→ data-biology    ─┘
           *   data-chem-adv   ─→ data-leaf  (advancedFields)
           *   data-chem-basic ─→ data-tree  (chemistryTreeData)
           *
           * 逆向きの辺は1本も無い（＝有向非巡回グラフ）。
           * 循環が無いことはビルドの Circular 警告 0 でも確認する。
           *
           * ■ ★なぜ「教科名で振り分ける」書き方をしなかったか★
           *
           * 最初はファイル名のパターン（chem/english/math…）で
           * 振り分けようとしたが、実測すると循環が5本出た。
           *   data → data-chem-basic → data
           * 原因は problemCount.ts のような
           * ★複数の教科が共有している小さなファイル★ が
           * 「教科グループ」と「その他」の両方に引っ張られること。
           *
           * そこで振り分け方を変えて
           *   「その教科の入口からしか到達できないファイル」＝その教科
           *   「2つ以上の教科から到達されるファイル」    ＝data-shared
           * とした。これで循環が0になった。
           * ★見た目の分類ではなく、到達可能性で分けるのが正しい。★
           *
           * ■ 教科を追加する人へ
           *
           * 新しい教科を足したときは、その教科の問題データも
           * 下の一覧に1行足すこと。足し忘れても壊れはしない
           * （既定の 'data' チャンクに入るだけ）が、
           * その教科を開いていない人にもデータが届いてしまう。
           * 忘れても気づけるように tests/screenDataWeight.test.ts が
           * 起動時の重さを監視している。
           */

          /*
           * 全教科を集めるハブ。ここだけ単独チャンクにする。
           * 循環の元になり得るのはこのファイルだけなので、隔離しておくと
           * あとで教科を足すときも安全側に倒れる。
           */
          if (id.includes('/src/data/allChapters')) return 'data-hub';

          /*
           * ★共通の土台（data-core）★
           *
           * ■ ここでも一度失敗した。その記録を残す。
           *
           * 最初は下の4本（problemCount / explanationPostProcess /
           * listeningPostProcess / unitTeaching）だけをまとめて
           * 「循環なし」と判断した。ところがビルドすると
           *   Circular chunk: data-shared -> data -> data-shared
           * が出た。
           *
           * 原因は自作の計測スクリプトが★src/data の中の辺しか見ていなかった★
           * こと。実際の回り道はこうなっていた:
           *   explanationPostProcess → src/utils/explanationFormat（index 側）
           *                          → src/data/teachingTypes（data 側）
           *   mockExamData（data 側） → unitTeaching
           * つまり src/utils を経由して index を通り、戻ってきていた。
           *
           * ★依存の一部だけを見た「安全です」は信用してはいけない。★
           * これは今回の作業で自分が実際にやってしまった誤りである。
           * 対策として「src 配下ぜんぶを対象に、vite と同じ振り分け規則で
           * チャンク名を決めてから循環を探す」検査を
           * tests/chunkGraph.test.ts に常設した。
           *
           * ■ いまの解き方
           *
           * 「解説の整形」「HTMLの無害化」「単元解説」「問題数の数え上げ」は
           * どの教科からも呼ばれる★一番下の土台★である。
           * これらを1つのチャンク（data-core）にまとめると、
           * このチャンクから外へ出ていく辺が0本になる（＝葉になる）。
           * 出ていく辺が0本のチャンクは、どこから呼ばれても循環に加われない。
           *
           * src/utils のファイルが混ざっているのは一見ちぐはぐだが、
           * ★チャンクは「置き場所」ではなく「一緒にダウンロードする単位」★
           * なので、層が同じものを同じチャンクに置くのが正しい。
           * ファイルの所在（data/ か utils/ か）は一切変えていない。
           */
          if (
            id.includes('/src/data/problemCount') ||
            id.includes('/src/data/explanationPostProcess') ||
            id.includes('/src/data/listeningPostProcess') ||
            id.includes('/src/data/unitTeaching') ||
            id.includes('/src/data/teachingTypes') ||
            id.includes('/src/utils/explanationFormat') ||
            id.includes('/src/utils/listeningExplanation') ||
            id.includes('/src/utils/sanitizeHtml')
          ) {
            return 'data-core';
          }

          /* 分野の見出しだけの軽い葉（App.tsx が起動時に使う） */
          if (id.includes('/src/data/advancedFields')) return 'data-leaf';

          /* 図（ロジックツリー・フローチャート）のデータ */
          if (
            id.includes('/src/data/chemistryTreeData') ||
            id.includes('/src/data/chapterTreeMap')
          ) {
            return 'data-tree';
          }

          /* 出題傾向のグラフ（モード選択画面で開く） */
          if (
            id.includes('/src/data/chemistryAdvancedTrendData') ||
            id.includes('/src/data/trendData')
          ) {
            return 'data-trend';
          }

          /* 化学基礎の問題データ */
          if (
            id.includes('/src/data/chemistryData') ||
            id.includes('/src/data/chemProblemsC') ||
            id.includes('/src/data/acidBaseProblems') ||
            id.includes('/src/data/crystalProblems') ||
            id.includes('/src/data/molUnitConversions') ||
            id.includes('/src/data/redoxProblems')
          ) {
            return 'data-chem-basic';
          }

          /* 化学（発展）の問題データ */
          if (
            id.includes('/src/data/chemistryAdvancedData') ||
            id.includes('/src/data/advancedThermoProblems')
          ) {
            return 'data-chem-adv';
          }

          /* 英語リスニングの問題データ */
          if (id.includes('/src/data/englishListening')) return 'data-english-l';

          /* 英文法の問題データ */
          if (
            id.includes('/src/data/englishGrammar') ||
            id.includes('/src/data/egProblems') ||
            id.includes('/src/data/egV3')
          ) {
            return 'data-english-g';
          }

          /* 数学の問題データ */
          if (
            id.includes('/src/data/mathData') ||
            // mathData reads these constants during module initialization. Keeping
            // curriculum in the catch-all data chunk creates data-math -> data -> data-math.
            id.includes('/src/data/mathCurriculum') ||
            id.includes('/src/data/mathProblemKit') ||
            id.includes('/src/data/mathIntegerProblems') ||
            id.includes('/src/data/mathIntegralProblems') ||
            id.includes('/src/data/mathProbabilityProblems') ||
            id.includes('/src/data/mathVectorProblems') ||
            id.includes('/src/data/mathPlusProblems') ||
            id.includes('/src/data/mathIAProblems')
          ) {
            return 'data-math';
          }

          /* 生物基礎の問題データ */
          if (id.includes('/src/data/biologyBasic')) return 'data-biology';

          if (id.includes('/src/data/')) return 'data';

          return undefined;
        },
      },
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Local npm caches and generated output can contain tens of thousands of files.
    // Watching them exhausts Linux inotify limits and crashes the dev preview.
    watch: { ignored: ['**/.npm-cache/**', '**/dist/**', '**/.delivery/**', '**/.tmpwork/**', '**/.tmp_ui/**', '**/functions/node_modules/**', '**/shots/**'] },
  },
};
});
