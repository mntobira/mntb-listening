"""使い方：python3 run.py kagawa 1 [2 3]  → out/ に問題・解答の HTML/PDF、public/prints/ に結合 PDF とサムネイル"""
import sys, importlib.util, json
from pathlib import Path
from cfg import CFGS
from common import build

slug = sys.argv[1]
led = Path(__file__).with_name('ledger.json')
data = json.loads(led.read_text()) if led.exists() else {}
for n in sys.argv[2:]:
    p = Path(__file__).parent / slug / f'r{n}.py'
    spec = importlib.util.spec_from_file_location(f'{slug}_r{n}', p); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    pages, kb = build(CFGS[slug], m.R)
    data[f'{slug}_{n}'] = [pages, kb]
led.write_text(json.dumps(data, indent=1, sort_keys=True))
