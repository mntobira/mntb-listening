"""図鑑の道具が共通で使う場所。どこに置いても動くよう、すべてこのファイルの位置から決める。
  G    … docs/code_guide（成果物と材料の置き場）
  ROOT … 説明する対象のリポジトリ（既定はこのリポジトリ自身。CODE_GUIDE_SRC で別の作業ツリーも指定できる）
  WORK … 作業用の一時ファイル（Git に入れない）"""
import os, subprocess
TOOLS = os.path.dirname(os.path.abspath(__file__))
G = os.path.dirname(TOOLS)
ROOT = os.environ.get('CODE_GUIDE_SRC') or subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=G, capture_output=True, text=True).stdout.strip()
WORK = os.path.join(G, '.work'); os.makedirs(WORK, exist_ok=True)
DATA = os.path.join(G, 'data'); CARDS = os.path.join(G, 'cards'); SITE = os.path.join(G, 'site')
def sh(cmd, cwd=None):
    return subprocess.run(cmd, shell=True, cwd=cwd or ROOT, capture_output=True, text=True).stdout.strip()
def tracked():
    return [l for l in sh('git -c core.quotepath=false ls-files').split('\n') if l and not l.startswith('docs/code_guide/')]
def commit():
    """説明しているコードのコミット＝図鑑（docs/code_guide）以外が最後に変わったコミット。
    ブランチ名は、そのコミットを先頭に持つリモートのブランチがあればそれを使う"""
    h = sh("git log -1 --format=%h -- . ':(exclude)docs/code_guide'")
    date = sh(f'git log -1 --format=%cs {h}')
    rb = [b.strip().removeprefix('origin/') for b in sh(f'git branch -r --points-at {h}').split('\n') if b.strip() and '->' not in b]
    return h, date, (rb[0] if rb else sh('git rev-parse --abbrev-ref HEAD'))
