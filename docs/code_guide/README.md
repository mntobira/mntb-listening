# コードの図鑑（docs/code_guide）

2026年10月時点（genspark_ai_developer @7c0b440）のリポジトリを、ファイルごとに「〜をする係」として説明した資料。

| ファイル | 中身 |
|---|---|
| `interactive.html` | ブラウザで開く図鑑（1ファイル・外部通信なし）。しくみの図／ユーザーの流れ／フォルダの木／検索／タグ／一般向け・エンジニア向け |
| `poster.png` | 全体の1枚絵（目的・規模の数字・しくみの図。1800px 幅） |
| `file-guide.pdf` | 全カードの手引き（A4・フォルダごとの章） |
| `research.md` | 数字の数え方・分類の方針・要確認の一覧・自己チェック |

## 作り直し方（材料と道具）
- `cards/*.txt` … 1行1枚のカード（パス｜タグ｜確信度｜ひとことで｜くわしく(任意)）。ここを直すのが基本
- `data/bundles.py` … まとめて1枚にするファイル群の規則
- `tools/` … `build_cards.py`（事実の取り出し）→ `enrich.py`（図の箱・数字）→ `build_site.py` / `build_poster.py` / `build_pdf.py` → `selfcheck.py`
- 道具はサンドボックスの作業場所（`/home/user/mntb-guide` と、対象コミットの worktree `/home/user/mntb-guide-src`）を前提にしたパスで書かれている。別の場所で使うときは各ファイル先頭の `G` / `ROOT` / `SRC` を書き換える
