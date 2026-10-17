"""cards.json に「しくみの図の箱（sys）」「ユーザーの流れ（flow）」を足し、数字（stats.json）を作る。
分類はパスとファイル名の規則だけで決める（推測で個別に振らない）。"""
import json, re, subprocess, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import G, ROOT, WORK, DATA as D, sh, tracked, commit
cards = json.load(open(f'{D}/cards.json'))

# しくみの図の箱：上から順に最初に当てはまったもの
SYS = [
 ('test',    r'^tests/|\.test\.mjs$|^scripts/android-range-check/|^scripts/verify_|^store-assets/_tools/peek'),
 ('server',  r'^functions/|^firestore\.|^firebase\.json$|^\.firebaserc$|^docs/deploy-firestore'),
 ('native',  r'^android/|^ios/|^capacitor\.config|^src/native/|^src/ads/|^src/utils/ad(Config|Service)|^APP_CAPACITOR'),
 ('boot',    r'^index\.html$|^message/|^src/(main|message|App)\.tsx$|^src/types\.d\.ts$|^src/config/|^src/contexts/'),
 ('net',     None),   # 下で tag=通信 かつ src/ のもの
 ('battle',  r'^src/battle/'),
 ('content', r'^src/data/|^src/types/|^public/data/|^listening_audio_ledger\.json$'),
 ('logic',   r'^src/(utils|hooks)/|^src/features/(safety|account)/.*\.ts$|^src/features/readAlong/readAlong\.ts$'),
 ('screen',  r'^src/(components|features|styles|motion)/|^src/index\.css$|^src/assets/'),
 ('assets',  r'^public/|^audio_sources/'),
 ('tools',   r'^scripts/|^store-assets/'),
 ('docs',    r'.'),
]
def sys_of(c):
    p = c['path']
    for k, rx in SYS:
        if k == 'net':
            if c['tag'] == '通信' and p.startswith('src/') and not p.startswith('src/battle/'): return 'net'
            continue
        if re.search(rx, p): return k
    return 'docs'

FLOW = {
 'solve':  r'(^|/)(Quiz|QuizHeader|QuizTimerBar|QuizScreens|ProblemPane|AnswerPane|MultipleChoiceControl|SortingControl|ChapterSelection|StudyCatalog|UnitCard|ListeningBriefing|ListeningAudioPlayer|ListeningMaterials|ListeningSubjectSelection|ModeSelection|VocabQuiz|ManaRush|FloatingScoreAnimation|CorrectBurst)\.tsx$|/(useQuestionDerived|useElimination|useStudyTimeTracker)\.ts$|/utils/(quiz\w*|answerJudge|answerEquivalence|scoring|listeningSteps|listeningOptions|listeningRounds|listeningSpeech|questionDisplay|mathExpression|stagePlay|stageRecords|audioElements)\.ts$|^src/data/(english\w+|eg\w+|allChapters|chapterCatalog|studyCatalog|vocabQuiz|vocabChapters|problemCount|subjects)\.ts$|(quiz-compact|unit-select|unit-card|study-catalog|correct-burst)\.css$|^public/listening_|^public/data/|^src/data/listeningSets/|generated\.ts$',
 'learn':  r'/(Explanation\w*|ExplanationScreen|QuestionFigure|ListeningCompactAnswers|SubQuestionCard|SharedExplanation|ProblemStatement|ResultSummary|ScoreHead|MobileResultChips|ReviewTopNav|BottomBars|ExtrasSection|ExplanationHeader|ScriptReading|ReadAlongStudio|AnnotatedScript|ListeningSupport|FoundationPage|FoundationWords|foundationShared)\.tsx$|/explanation/\w+\.ts$|/utils/(listeningExplanation|explanationFormat|textFormatter|mathTypeset|figureNumbering|sanitizeHtml)\.tsx?$|/data/(listeningPostProcess|listeningSupport|listeningPictureAspect)\.ts$|readAlong|(listening-explanation|step-explanation|foundation|read-along)\.css$',
 'review': r'/(StudyHub|NoteDetail|ForgettingCurveChart|StudyRecord)\.tsx$|/utils/(review\w+|forgettingCurveAxis|progress|studyLog|studySync|studySyncCore|unitStats|studyTime|achievementsSync)\.ts$|/types/studyNote\.ts$|(review-note|study-record)\.css$',
 'compete':r'^src/battle/|/(Leaderboard|ManaClan|FriendPanel|FriendCodeInput|OpponentCard)\.tsx$|/utils/(leaderboard|manaClan|friends|friendPresence|nicknamePrivacy|publicStudyProfile)\.ts$|^functions/|ranking\.css$|^public/(bgm|sfx)/|battle',
}
for c in cards:
    c['sys'] = sys_of(c)
    hay = c['path'] + ('' if c['kind'] == 'file' else ' ' + ' '.join(c.get('members', [])))
    c['flow'] = [k for k, rx in FLOW.items() if re.search(rx, hay)]
    if c['sys'] in ('test', 'tools', 'docs'): c['flow'] = []

# 数字
# 数を数える（教科データは tsx で実際に読み込み、テストは vitest 自身に一覧を出させる）
COUNT_TS = os.path.join(WORK, 'count.mts')
open(COUNT_TS, 'w').write(f'''import {{ SUBJECTS }} from '{ROOT}/src/data/allChapters';
import {{ countChapterProblems }} from '{ROOT}/src/data/problemCount';
const out: Record<string, unknown> = {{}};
for (const s of SUBJECTS) {{
  const chapters = (s as any).data?.parts ? (s as any).data.parts.flatMap((p: any) => p.chapters) : [];
  let probs = 0, subs = 0;
  for (const c of chapters) {{ const ps = [...(c.miniTest ?? []), ...(c.practiceProblems ?? [])]; probs += ps.length;
    for (const p of ps) subs += Array.isArray(p.subQuestions) && p.subQuestions.length ? p.subQuestions.length : 1; }}
  out[s.id] = {{ label: s.label, chapters: chapters.length, problems: probs, subQuestions: subs, viaProblemCount: chapters.reduce((n: number, c: any) => n + countChapterProblems(c), 0) }};
}}
console.log(JSON.stringify(out));''')
cnt = json.loads(sh(f'npx tsx {COUNT_TS}'))
vjson = os.path.join(WORK, 'vlist.json')
if '--fast' not in sys.argv or not os.path.exists(vjson):
    subprocess.run(f'npx vitest list --json={vjson}', shell=True, cwd=ROOT, capture_output=True, text=True, timeout=600)
vl = json.load(open(vjson))
pool = sh("grep -o 'POOL_COUNTS[^;]*' src/battle/data/battlePool.ts | head -1")
pool = json.loads(re.search(r'\{.*\}', pool).group(0))
src_files = sh("git ls-files 'src/*.ts' 'src/*.tsx' 'src/*.css' | wc -l")
src_lines = sh("git ls-files 'src/*.ts' 'src/*.tsx' 'src/*.css' | xargs cat | wc -l")
stats = {
 'asOf': f"{int(commit()[1][:4])}年{int(commit()[1][5:7])}月時点", 'commit': commit()[0], 'commitDate': commit()[1],
 'branch': commit()[2],
 'tracked': len(tracked()),
 'srcFiles': int(src_files), 'srcLines': int(src_lines),
 'screens': len(re.findall(r"'(\w+)'", re.search(r'export type AppState = ([^;]+);', open(f'{ROOT}/src/App.tsx').read()).group(1))),
 'testCases': len(vl), 'testFiles': len({x['file'] for x in vl}),
 'listening': cnt['english_listening'], 'grammar': cnt['english_grammar'],
 'vocab': int(re.search(r'VOCABULARY_COUNT = (\d+)', open(f'{ROOT}/src/data/listeningVocabularyMeta.generated.ts').read()).group(1)),
 'battlePool': pool, 'battleTotal': sum(pool.values()),
 'audio': len(json.load(open(f'{ROOT}/listening_audio_ledger.json'))),
 'cardsFile': sum(1 for c in cards if c['kind'] == 'file'), 'cardsBundle': sum(1 for c in cards if c['kind'] == 'bundle'),
 'bundledFiles': sum(c.get('count', 0) for c in cards if c['kind'] == 'bundle'),
}
# フォルダ別（上位フォルダ単位、全追跡ファイル）
folders = {}
for p in tracked():
    top = p.split('/')[0] if '/' in p else '(ルート)'
    folders.setdefault(top, 0); folders[top] += 1
stats['folders'] = dict(sorted(folders.items(), key=lambda kv: -kv[1]))
stats['tags'] = {}
for c in cards: stats['tags'][c['tag']] = stats['tags'].get(c['tag'], 0) + (c.get('count', 1))
stats['conf'] = {}
for c in cards: stats['conf'][c['conf']] = stats['conf'].get(c['conf'], 0) + 1
stats['sys'] = {}
for c in cards: stats['sys'][c['sys']] = stats['sys'].get(c['sys'], 0) + c.get('count', 1)
stats['flow'] = {k: sum(1 for c in cards if k in c['flow']) for k in FLOW}
# 規則に当てはまらず「資料と全体の設定」に落ちたコード（新しいフォルダができたとき）→ update.sh が知らせる
stray = [c['path'] for c in cards if c['sys'] == 'docs' and re.search(r'^(src|functions|scripts|tests)/', c['path'])]
sp = f'{D}/sync.json'
if os.path.exists(sp):
    sj = json.load(open(sp)); sj['unsorted'] = stray; json.dump(sj, open(sp, 'w'), ensure_ascii=False, indent=1)
json.dump(cards, open(f'{D}/cards.json', 'w'), ensure_ascii=False, indent=0)
json.dump(stats, open(f'{D}/stats.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))
