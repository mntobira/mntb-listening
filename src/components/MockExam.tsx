import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, X, ChevronRight, ChevronDown, BookOpen, RotateCcw, Trophy, Clock } from 'lucide-react';
import { mockExam, MockExamQuestion } from '../data/mockExamData';
import { formatText } from '../utils/textFormatter';
import { ExplanationBody } from './ExplanationBody';
import { buildUnitKataBlock } from '../utils/explanationFormat';
import { getUnitTeaching } from '../data/unitTeaching';
import { MOCK_EXAM_UNIT_MAP } from '../data/mockExamData';
import { FeedbackButton } from './FeedbackButton';
import { readJsonObject } from '../utils/safeLocalStorage';

// 共通テスト化学基礎 予想問題の目標時間（30分 = 1800秒）
const EXAM_DURATION_SEC = 30 * 60;

interface MockExamProps {
  onBack: () => void;
}

type ExamPhase = 'intro' | 'q1_solving' | 'q2_intro' | 'q2_solving' | 'result';

// 第1問の問番号リスト（bigQuestion: 1のもの）
const q1Questions = mockExam.questions.filter(q => q.bigQuestion === 1);
// 第2問の問番号リスト（bigQuestion: 2のもの）
const q2Questions = mockExam.questions.filter(q => q.bigQuestion === 2);

const MOCK_ANSWERS_KEY = 'mockexam_answers_v1';

export function MockExam({ onBack }: MockExamProps) {
  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [currentQ1Index, setCurrentQ1Index] = useState(0);
  const [currentQ2Index, setCurrentQ2Index] = useState(0);
  // 解答は localStorage に保存し、誤って画面を離れても入力が消えないようにする
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return readJsonObject<Record<string, string>>(MOCK_ANSWERS_KEY);
    } catch {
      return {};
    }
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  // 採点結果の「1問ずつのアコーディオン」で、いま開いている問（要件④）
  const [openResultKey, setOpenResultKey] = useState<string | null>(null);
  // 「この模試で使う思考の型」の開閉（要件①：模試につき1回だけ、採点結果の直後）
  const [kataOpen, setKataOpen] = useState(false);

  // ===== 30分タイマー（スコアには影響しない、目標時間の目安表示）=====
  const [elapsedSec, setElapsedSec] = useState(0);
  const examStartedAtRef = useRef<number | null>(null);
  // 解答中の各フェーズ（第2問イントロ含む）でタイマーを動かす
  const isExamRunning = phase === 'q1_solving' || phase === 'q2_intro' || phase === 'q2_solving';

  useEffect(() => {
    if (!isExamRunning) return;
    if (examStartedAtRef.current == null) {
      examStartedAtRef.current = Date.now() - elapsedSec * 1000;
    }
    const id = window.setInterval(() => {
      if (examStartedAtRef.current != null) {
        setElapsedSec(Math.floor((Date.now() - examStartedAtRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamRunning]);

  const remainingSec = EXAM_DURATION_SEC - elapsedSec;
  const isTimeOver = remainingSec < 0;
  const formatClock = (totalSec: number) => {
    const s = Math.max(0, Math.floor(totalSec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  };

  // 解答内容を保存（誤って画面を離れても入力が消えないようにする）
  useEffect(() => {
    try {
      localStorage.setItem(MOCK_ANSWERS_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, currentQ1Index, currentQ2Index]);

  // 解答キー生成
  const getAnswerKey = (q: MockExamQuestion, subLabel?: string) => {
    if (subLabel) return `q${q.bigQuestion}_${q.questionNumber}_${subLabel}`;
    return `q${q.bigQuestion}_${q.questionNumber}`;
  };

  // 正解判定
  const isCorrect = (q: MockExamQuestion, subLabel?: string) => {
    const key = getAnswerKey(q, subLabel);
    const userAnswer = answers[key];
    if (!userAnswer) return null;
    if (subLabel && q.subQuestions) {
      const sub = q.subQuestions.find(s => s.label === subLabel);
      return sub ? userAnswer === sub.correctChoice : null;
    }
    return userAnswer === q.correctChoice;
  };

  // スコア計算
  const calculateScore = () => {
    let total = 0;
    let correct = 0;
    mockExam.questions.forEach(q => {
      if (q.subQuestions) {
        q.subQuestions.forEach(sub => {
          total += sub.points;
          if (isCorrect(q, sub.label) === true) correct += sub.points;
        });
      } else {
        total += q.points;
        if (isCorrect(q) === true) correct += q.points;
      }
    });
    return { correct, total };
  };

  const handleSelectAnswer = (q: MockExamQuestion, choice: string, subLabel?: string) => {
    if (showExplanation) return;
    const key = getAnswerKey(q, subLabel);
    setAnswers(prev => ({ ...prev, [key]: choice }));
  };

  // 第1問: 次の問へ
  const handleQ1Next = () => {
    setShowExplanation(false);
    setIsAnswered(false);
    if (currentQ1Index < q1Questions.length - 1) {
      setCurrentQ1Index(prev => prev + 1);
    } else {
      setPhase('q2_intro');
    }
  };

  // 第2問: 次の問へ
  const handleQ2Next = () => {
    setShowExplanation(false);
    setIsAnswered(false);
    if (currentQ2Index < q2Questions.length - 1) {
      setCurrentQ2Index(prev => prev + 1);
    } else {
      setPhase('result');
    }
  };

  const handleCheck = () => {
    setShowExplanation(true);
    setIsAnswered(true);
  };

  const handleReset = () => {
    setPhase('intro');
    setCurrentQ1Index(0);
    setCurrentQ2Index(0);
    setAnswers({});
    try { localStorage.removeItem(MOCK_ANSWERS_KEY); } catch {}
    setShowExplanation(false);
    setIsAnswered(false);
    // タイマーもリセット
    setElapsedSec(0);
    examStartedAtRef.current = null;
  };

  // 解答途中で戻ろうとしたときは確認ダイアログを表示（誤操作による離脱を防ぐ）
  const handleBackGuarded = () => {
    const inProgress = phase === 'q1_solving' || phase === 'q2_solving' || phase === 'q2_intro';
    if (inProgress && Object.keys(answers).length > 0) {
      const ok = window.confirm('予想問題を中断して戻りますか？\n（解答内容は保存され、次回続きから確認できます）');
      if (!ok) return;
    }
    onBack();
  };

  // ========== イントロ画面 ==========
  if (phase === 'intro') {
    return (
      <div className="w-full notebook-paper rounded-2xl p-6 md:p-12 pb-safe-lg md:pb-12 min-h-[60vh] flex flex-col items-center relative font-handwriting">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 text-gray-500 hover:text-[#2C3E50] transition-colors font-bold bg-white/80 px-4 py-2 rounded-full shadow-sm font-handwriting"
        >
          <ArrowLeft size={20} />
          <span>戻る</span>
        </button>

        <div className="mt-16 text-center space-y-4 max-w-2xl">
          <div className="bg-[#2C3E50] text-white text-xs font-bold px-4 py-1 rounded-full inline-block font-handwriting">
            令和9年度 大学入学共通テスト オリジナル予想問題
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-[#2C3E50] font-handwriting">2027年度 共通テスト</h1>
          <h2 className="text-xl md:text-3xl font-bold text-[#D9A0A0] font-handwriting">化学基礎 予想問題</h2>

          <div className="bg-white/70 border border-gray-200 rounded-2xl p-6 text-left space-y-3 mt-6">
            <h3 className="text-sm font-bold text-[#2C3E50] font-handwriting">注意事項</h3>
            {mockExam.notes.map((note, i) => (
              <p key={i} className="text-xs text-gray-700 font-handwriting leading-relaxed">{i + 1}. {note}</p>
            ))}
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <div className="bg-[#A9CCE3]/20 border border-[#A9CCE3] rounded-xl px-6 py-3 text-center">
              <div className="text-lg font-bold text-[#2C3E50] font-handwriting">50点</div>
              <div className="text-xs text-gray-600 font-handwriting">満点</div>
            </div>
            <div className="bg-[#D9A0A0]/20 border border-[#D9A0A0] rounded-xl px-6 py-3 text-center">
              <div className="text-lg font-bold text-[#2C3E50] font-handwriting">30分</div>
              <div className="text-xs text-gray-600 font-handwriting">目標時間</div>
            </div>
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-6 py-3 text-center">
              <div className="text-lg font-bold text-[#2C3E50] font-handwriting">17問</div>
              <div className="text-xs text-gray-600 font-handwriting">全問題数</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <p className="text-xs text-amber-800 font-handwriting leading-relaxed">
              ★ このオリジナル予想問題は、過去11年（2016〜2026年）の本試験データを徹底分析し、2027年共通テストへの出題可能性が高いテーマを厳選して作成しました。問ごとにページが変わり、解答後に詳しい解説を確認できます。
            </p>
          </div>

          <button
            onClick={() => setPhase('q1_solving')}
            className="mt-6 px-10 py-4 bg-[#2C3E50] text-white rounded-2xl font-bold font-handwriting text-lg shadow-lg hover:bg-[#1B2631] transition-colors"
          >
            第1問から始める
          </button>
        </div>
      </div>
    );
  }

  // ========== 第2問イントロ ==========
  if (phase === 'q2_intro') {
    return (
      <div className="w-full notebook-paper rounded-2xl p-6 md:p-10 pb-safe-lg md:pb-10 min-h-[60vh] flex flex-col items-center relative font-handwriting">
        {/* 30分タイマー（目標時間／スコアには影響しません） */}
        <div
          className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-handwriting tabular-nums transition-colors ${
            isTimeOver
              ? 'bg-red-50 border-red-300 text-red-600'
              : remainingSec < 300
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white/80 border-gray-300 text-[#2C3E50]'
          }`}
          title="共通テスト化学基礎の目標時間は30分です（スコアには影響しません）"
        >
          <Clock size={13} />
          {isTimeOver ? <span>超過 +{formatClock(-remainingSec)}</span> : <span>残り {formatClock(remainingSec)}</span>}
        </div>
        <div className="mt-8 text-center max-w-3xl w-full">
          <div className="bg-[#D9A0A0] text-white text-sm font-bold px-4 py-1 rounded-full inline-block font-handwriting mb-4">
            第１問 完了！ 次は第２問へ
          </div>
          <h2 className="text-xl font-bold text-[#2C3E50] font-handwriting mb-6">第２問 リード文を読んでください</h2>

          <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 text-left">
            <p className="text-sm font-bold text-[#2C3E50] font-handwriting mb-3">第２問 家庭で用いられる漂白剤および洗剤（配点 20）</p>
            <div className="text-xs md:text-sm text-gray-800 font-handwriting leading-relaxed space-y-3">
              {mockExam.bigQuestion2Context.split('\n\n').map((para, i) => (
                <p key={i} className={para.includes('NaClO') && para.includes('→') ? 'bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-center text-xs' : ''}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('q2_solving')}
            className="mt-6 px-10 py-4 bg-[#D9A0A0] text-white rounded-2xl font-bold font-handwriting text-lg shadow-lg hover:bg-[#C0847E] transition-colors flex items-center gap-2 mx-auto"
          >
            <span>問題を解く</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ========== 結果画面 ==========
  if (phase === 'result') {
    const { correct, total } = calculateScore();
    const percentage = Math.round((correct / total) * 100);
    const grade = percentage >= 90 ? '🏆 優秀！' : percentage >= 75 ? '✨ 合格圏内！' : percentage >= 60 ? '📚 もう少し！' : '🔥 要復習！';

    // 「この単元の思考の型」は模試全体で1回だけ出す（要件①）。
    // 模試は複数単元にまたがるので、出題数がいちばん多い単元の型を代表として使う。
    const unitCount = new Map<string, number>();
    mockExam.questions.forEach((q) => {
      const unit = MOCK_EXAM_UNIT_MAP[`${q.bigQuestion}-${q.questionNumber}`];
      if (unit) unitCount.set(unit, (unitCount.get(unit) || 0) + 1);
    });
    const mainUnit = [...unitCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const kataBlock = buildUnitKataBlock(getUnitTeaching(mainUnit));

    /**
     * 採点結果の1行＝1問のアコーディオン。
     *
     * 閉じているとき：  問N(a)　❌　正解：③
     * 開いたとき　　：  正解 → 解法の思考手順 → 詳しい解説（元データの解説をそのまま全文）
     *
     * ★解説文は enhanceExplanation で整形済みのものをそのまま渡している。
     *   このコンポーネントは1文字も削っていない★
     */
    const renderResultRow = (
      q: MockExamQuestion,
      subLabel: string | undefined,
      correctChoice: string | undefined,
      explanation: string,
      points: number,
    ) => {
      const rowKey = getAnswerKey(q, subLabel);
      const result = isCorrect(q, subLabel);
      const userAnswer = answers[rowKey];
      const isOpen = openResultKey === rowKey;
      const title = `問${q.questionNumber}${subLabel ? `(${subLabel})` : ''}`;

      const mark =
        result === true ? (
          <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-green-700" />
          </span>
        ) : result === false ? (
          <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-red-600" />
          </span>
        ) : (
          <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-500">
            −
          </span>
        );

      const border =
        result === true
          ? 'border-green-300 bg-green-50/40'
          : result === false
            ? 'border-red-300 bg-red-50/40'
            : 'border-gray-200 bg-gray-50/60';

      return (
        <div key={rowKey} className={`border-2 rounded-xl overflow-hidden ${border}`}>
          <button
            type="button"
            onClick={() => setOpenResultKey(isOpen ? null : rowKey)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
            aria-expanded={isOpen}
          >
            {mark}
            <span className="text-xs sm:text-sm font-bold text-[#2C3E50] font-handwriting shrink-0">
              {title}
            </span>
            {correctChoice && (
              <span className="text-[11px] sm:text-xs text-gray-600 font-handwriting">
                正解：<span className="font-bold text-[#B03A5B]">{correctChoice}</span>
              </span>
            )}
            {result === false && userAnswer && (
              <span className="text-[11px] text-gray-400 font-handwriting hidden sm:inline">
                （あなた：{userAnswer}）
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-500 font-handwriting shrink-0">
              <span className="hidden sm:inline">{points}点</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </button>

          {isOpen && (
            <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white/80">
              {/* 問題文（どの問の話かを見失わないように、開いたその場で再掲する） */}
              <p className="text-[11px] text-gray-500 font-handwriting leading-relaxed mb-2 whitespace-pre-line">
                {formatText(
                  subLabel
                    ? q.subQuestions?.find((x) => x.label === subLabel)?.questionText || q.questionText
                    : q.questionText,
                )}
              </p>
              <ExplanationBody
                text={explanation}
                tone="light"
                className="text-[11px] sm:text-xs text-gray-700 font-handwriting leading-relaxed"
              />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="w-full notebook-paper rounded-2xl p-6 md:p-12 pb-safe-lg md:pb-12 min-h-[60vh] flex flex-col items-center relative font-handwriting">
        <div className="mt-8 text-center max-w-3xl w-full">
          <div className="text-4xl mb-4">{grade.split(' ')[0]}</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] font-handwriting mb-2">採点結果</h2>
          <div className="text-5xl font-bold text-[#D9A0A0] font-handwriting my-4">
            {correct} / {total}点
          </div>
          <div className="text-xl text-gray-600 font-handwriting mb-2">正答率 {percentage}%</div>
          {/* 所要時間（30分の目標に対する目安・スコアには影響しません） */}
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 font-handwriting mb-6">
            <Clock size={15} />
            <span>所要時間 {formatClock(elapsedSec)}</span>
            <span className="text-gray-400">/ 目標 30:00</span>
            {isTimeOver && <span className="text-red-500 font-bold ml-1">（時間超過）</span>}
          </div>

          {/*
            ★要件④⑤ 採点結果は「1問ごとのアコーディオン」にする★

            従来は ◯× の丸が並ぶだけで、どこを間違えたかは分かっても
            「なぜ間違えたのか」を知るには問題を解き直す画面まで戻る必要があった。
            ここでは章の問題（Explanation.tsx）とまったく同じ考え方で、
            1問を開けば ［正解］→［解法の思考手順］→［詳しい解説］が
            その場で最後まで読める構成にする。
            ★表示している情報は元データそのままで、要約も省略もしていない★
          */}
          <div className="bg-white/80 border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 text-left">
            <h3 className="text-sm font-bold text-[#2C3E50] font-handwriting mb-1">各問の正誤と解説</h3>
            <p className="text-[11px] text-gray-500 font-handwriting mb-4">
              気になる問をタップすると、その問の正解と解説だけがその場で開きます。
            </p>

            {/* ★要件① この模試の思考の型は、採点結果の直後に1回だけ★ */}
            {kataBlock && (
              <div className="mb-4 border-2 border-[#E9688E]/35 rounded-xl overflow-hidden bg-[#FFF7FA]">
                <button
                  type="button"
                  onClick={() => setKataOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#B03A5B] font-handwriting">
                    この模試で使う思考の型
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#B03A5B] shrink-0 transition-transform ${kataOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {kataOpen && (
                  <div className="px-3 pb-3 border-t border-[#E9688E]/25 pt-2">
                    <ExplanationBody
                      text={kataBlock}
                      tone="light"
                      className="text-[11px] sm:text-xs text-gray-700 font-handwriting leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {([1, 2] as const).map((big) => {
                const list = big === 1 ? q1Questions : q2Questions;
                if (list.length === 0) return null;
                return (
                  <div key={big}>
                    <p className="text-xs font-bold text-gray-500 font-handwriting mb-2">
                      第{big}問
                    </p>
                    <div className="space-y-2">
                      {list.flatMap((q) =>
                        q.subQuestions && q.subQuestions.length > 0
                          ? q.subQuestions.map((sub) =>
                              renderResultRow(q, sub.label, sub.correctChoice, sub.explanation, sub.points),
                            )
                          : [renderResultRow(q, undefined, q.correctChoice, q.explanation, q.points)],
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-[#A9CCE3] text-white rounded-xl font-bold font-handwriting hover:bg-[#8AB8D3] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              もう一度解く
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-[#2C3E50] text-white rounded-xl font-bold font-handwriting hover:bg-[#1B2631] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              選択に戻る
            </button>
          </div>

          {/* ===== 模擬試験の結果についてのご意見（意見収集入口）=====
              難易度や設問の妥当性は解き終わった直後の感想が最も価値が高いため、
              得点・正答率・所要時間を自動で添付して送れるようにする。 */}
          <div className="mt-6 pt-5 border-t border-gray-200 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500 font-handwriting text-center leading-relaxed">
              難易度や設問の分かりにくさなど、この模擬試験へのご意見をお寄せください。
            </p>
            <FeedbackButton
              screen="mock_exam_result"
              variant="inline"
              label="模擬試験にご意見"
              description="共通テスト予想問題（化学基礎）の難易度・設問についてのご意見をお聞かせください"
              context={{
                correct,
                total,
                percentage,
                elapsedSec,
                isTimeOver,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ========== 問題解答画面（第1問・第2問共通） ==========
  const isQ1 = phase === 'q1_solving';
  const currentQuestion = isQ1 ? q1Questions[currentQ1Index] : q2Questions[currentQ2Index];
  const currentIndex = isQ1 ? currentQ1Index : currentQ2Index;
  const totalQuestions = isQ1 ? q1Questions.length : q2Questions.length;
  const handleNext = isQ1 ? handleQ1Next : handleQ2Next;
  const bgColor = isQ1 ? 'from-[#A9CCE3]/20 to-white' : 'from-[#D9A0A0]/20 to-white';
  const accentColor = isQ1 ? '#A9CCE3' : '#D9A0A0';

  // 現在の問に全部回答したか確認
  const hasAnsweredAll = () => {
    if (!currentQuestion.subQuestions) {
      return !!answers[getAnswerKey(currentQuestion)];
    }
    return currentQuestion.subQuestions.every(sub => !!answers[getAnswerKey(currentQuestion, sub.label)]);
  };

  return (
    <div className="w-full notebook-paper rounded-2xl overflow-hidden font-handwriting">
      {/* ヘッダー */}
      <div className={`bg-gradient-to-r ${bgColor} p-4 border-b border-gray-200`}>
        <div className="flex items-center justify-between mb-2 gap-2">
          <button
            onClick={handleBackGuarded}
            className="flex items-center gap-1 text-gray-500 hover:text-[#2C3E50] text-xs font-bold font-handwriting shrink-0"
          >
            <ArrowLeft size={16} />
            戻る
          </button>

          {/* 30分タイマー（目標時間／スコアには影響しません） */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-handwriting tabular-nums shrink-0 transition-colors ${
              isTimeOver
                ? 'bg-red-50 border-red-300 text-red-600'
                : remainingSec < 300
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white/80 border-gray-300 text-[#2C3E50]'
            }`}
            title="共通テスト化学基礎の目標時間は30分です（スコアには影響しません）"
          >
            <Clock size={13} />
            {isTimeOver ? (
              <span>超過 +{formatClock(-remainingSec)}</span>
            ) : (
              <span>残り {formatClock(remainingSec)}</span>
            )}
          </div>

          <div className="text-xs font-bold text-gray-600 font-handwriting shrink-0">
            第{isQ1 ? '1' : '2'}問 {currentIndex + 1} / {totalQuestions}
          </div>
        </div>
        {/* 進捗バー */}
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>

      <div className="p-4 md:p-8 pb-safe-lg md:pb-8 space-y-6">
        {/* 問題ヘッダー */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold font-handwriting px-3 py-1 rounded-full text-white" style={{ backgroundColor: accentColor }}>
              {isQ1 ? `第１問 問${currentQuestion.questionNumber}` : `第２問 問${currentQuestion.questionNumber}`}
            </span>
            <span className="text-xs text-gray-500 font-handwriting">（{currentQuestion.subQuestions ? currentQuestion.points : currentQuestion.points}点）</span>
          </div>

          {/* 問題文 */}
          <div className="text-sm leading-[1.85] md:leading-relaxed text-gray-800 font-handwriting whitespace-pre-line break-words [overflow-wrap:anywhere] mb-4">
            {formatText(currentQuestion.questionText)}
          </div>

          {/* 表データ */}
          {currentQuestion.tableData && (
            <div className="overflow-x-auto mb-4">
              <table className="text-xs font-handwriting border-collapse border border-gray-300 mx-auto">
                <thead>
                  <tr>
                    {currentQuestion.tableData.headers.map((h, i) => (
                      <th key={i} className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentQuestion.tableData.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className={`border border-gray-300 px-3 py-2 text-center ${j === 0 ? 'font-bold bg-gray-50' : ''}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 小設問がある場合（第2問） */}
        {currentQuestion.subQuestions ? (
          <div className="space-y-6">
            {currentQuestion.subQuestions.map((sub) => {
              const subKey = getAnswerKey(currentQuestion, sub.label);
              const userAnswer = answers[subKey];
              return (
                <div key={sub.label} className="bg-white/60 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-600 font-handwriting mb-1">問{currentQuestion.questionNumber}({sub.label})（{sub.points}点）</p>
                  <p className="text-sm leading-[1.85] md:leading-relaxed text-gray-800 font-handwriting mb-3 whitespace-pre-line break-words [overflow-wrap:anywhere]">{formatText(sub.questionText)}</p>
                  <div className="space-y-2">
                    {sub.choices.map((choice) => {
                      const isSelected = userAnswer === choice.id;
                      let btnClass = 'w-full text-left p-3 rounded-xl border-2 text-xs font-handwriting transition-all cursor-pointer flex items-start gap-2';
                      if (showExplanation) {
                        if (choice.id === sub.correctChoice) {
                          btnClass += ' bg-green-50 border-green-400 text-green-800 font-bold';
                        } else if (isSelected && choice.id !== sub.correctChoice) {
                          btnClass += ' bg-red-50 border-red-300 text-red-700';
                        } else {
                          btnClass += ' bg-gray-50 border-gray-200 text-gray-500';
                        }
                      } else {
                        btnClass += isSelected
                          ? ' bg-[#A9CCE3]/30 border-[#A9CCE3] font-bold text-[#2C3E50]'
                          : ' bg-white border-gray-200 hover:border-gray-300 text-gray-700';
                      }
                      return (
                        <button
                          key={choice.id}
                          className={btnClass}
                          onClick={() => handleSelectAnswer(currentQuestion, choice.id, sub.label)}
                          disabled={showExplanation}
                        >
                          <span className="font-bold shrink-0">{choice.id}</span>
                          <span>{formatText(choice.text)}</span>
                          {showExplanation && choice.id === sub.correctChoice && <Check className="w-4 h-4 text-green-600 ml-auto shrink-0" />}
                          {showExplanation && isSelected && choice.id !== sub.correctChoice && <X className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {showExplanation && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-amber-800 font-handwriting mb-1">解説</p>
                      <p className="text-xs text-gray-700 font-handwriting leading-relaxed whitespace-pre-line">{formatText(sub.explanation)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* 単純な1択問題（第1問） */
          <div className="space-y-2">
            {currentQuestion.choices?.map((choice) => {
              const key = getAnswerKey(currentQuestion);
              const userAnswer = answers[key];
              const isSelected = userAnswer === choice.id;
              let btnClass = 'w-full text-left p-3 rounded-xl border-2 text-sm font-handwriting transition-all cursor-pointer flex items-start gap-2';
              if (showExplanation) {
                if (choice.id === currentQuestion.correctChoice) {
                  btnClass += ' bg-green-50 border-green-400 text-green-800 font-bold';
                } else if (isSelected && choice.id !== currentQuestion.correctChoice) {
                  btnClass += ' bg-red-50 border-red-300 text-red-700';
                } else {
                  btnClass += ' bg-gray-50 border-gray-200 text-gray-500';
                }
              } else {
                btnClass += isSelected
                  ? ' bg-[#A9CCE3]/30 border-[#A9CCE3] font-bold text-[#2C3E50]'
                  : ' bg-white border-gray-200 hover:border-gray-300 text-gray-700';
              }
              return (
                <button
                  key={choice.id}
                  className={btnClass}
                  onClick={() => handleSelectAnswer(currentQuestion, choice.id)}
                  disabled={showExplanation}
                >
                  <span className="font-bold shrink-0">{choice.id}</span>
                  <span className="flex-1">{formatText(choice.text)}</span>
                  {showExplanation && choice.id === currentQuestion.correctChoice && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                  {showExplanation && isSelected && choice.id !== currentQuestion.correctChoice && <X className="w-4 h-4 text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* 解説（単純な問題） */}
        {showExplanation && !currentQuestion.subQuestions && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <p className="text-sm font-bold text-amber-800 font-handwriting">解説</p>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full font-handwriting ${isCorrect(currentQuestion) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isCorrect(currentQuestion) ? '正解！' : `不正解（正解: ${currentQuestion.correctChoice}）`}
              </span>
            </div>
            <p className="text-xs text-gray-700 font-handwriting leading-relaxed whitespace-pre-line">{formatText(currentQuestion.explanation)}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 justify-center pt-4">
          {!showExplanation ? (
            <button
              onClick={handleCheck}
              disabled={!hasAnsweredAll()}
              className={`px-8 py-3 rounded-xl font-bold font-handwriting text-sm transition-colors ${hasAnsweredAll() ? 'bg-[#2C3E50] text-white hover:bg-[#1B2631]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              解答を確認する
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-[#D9A0A0] text-white rounded-xl font-bold font-handwriting text-sm hover:bg-[#C0847E] transition-colors"
            >
              {(isQ1 && currentQ1Index < q1Questions.length - 1) || (!isQ1 && currentQ2Index < q2Questions.length - 1)
                ? <>次の問へ <ArrowRight className="w-4 h-4" /></>
                : isQ1
                  ? <>第２問へ <ChevronRight className="w-4 h-4" /></>
                  : <>結果を見る <Trophy className="w-4 h-4" /></>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
