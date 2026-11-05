# 三重大学 前期 英語 予想問題 第2回（1・2・3）
import importlib.util, pathlib
_d = pathlib.Path(__file__).resolve().parent
def _load(name):
    spec = importlib.util.spec_from_file_location(name, _d / f'{name}.py'); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
R = {'no': 2, 'sections': [_load('r2_s1').S, _load('r2_s2').S, _load('r2_s3').S]}
