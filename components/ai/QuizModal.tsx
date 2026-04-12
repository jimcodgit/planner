'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils/cn';
import type { QuizQuestion } from '@/app/api/ai/quiz/route';

interface QuizModalProps {
  topicName: string;
  subjectName: string;
  difficulty: number;
  topicNotes: string | null;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
}

type Phase = 'loading' | 'error' | 'question' | 'result';

export function QuizModal({
  topicName,
  subjectName,
  difficulty,
  topicNotes,
  onClose,
  onComplete,
}: QuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);

  // Fetch quiz on mount
  useState(() => {
    fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicName, subjectName, difficulty, topicNotes }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setErrorMsg(data.error); setPhase('error'); return; }
        setQuestions(data.questions);
        setPhase('question');
      })
      .catch((e) => { setErrorMsg(e.message); setPhase('error'); });
  });

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setScores((s) => [...s, idx === questions[current].correct]);
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setPhase('result');
      const finalScores = [...scores];
      onComplete?.(finalScores.filter(Boolean).length, finalScores.length);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  const q = questions[current];
  const correctCount = scores.filter(Boolean).length;

  return (
    <Modal open onClose={onClose} title={`Quiz: ${topicName}`}>
      {phase === 'loading' && (
        <div className="py-10 flex flex-col items-center gap-3 text-gray-500">
          <LoadingRing />
          <p className="text-sm">Generating questions…</p>
          <p className="text-xs text-gray-400">Powered by Llama 3.3 via Groq</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="py-6 text-center space-y-3">
          <p className="text-red-600 text-sm">{errorMsg}</p>
          {errorMsg.includes('GROQ_API_KEY') && (
            <p className="text-xs text-gray-500">
              Add <code className="bg-gray-100 px-1 rounded">GROQ_API_KEY</code> to your Vercel environment variables.
            </p>
          )}
          <button onClick={onClose} className="text-sm text-indigo-600 hover:underline">Close</button>
        </div>
      )}

      {phase === 'question' && q && (
        <div className="space-y-5">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{correctCount} correct so far</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${((current) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <p className="text-base font-medium text-gray-900 leading-snug">{q.question}</p>

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isCorrect = idx === q.correct;
              const isSelected = idx === selected;
              let style = 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50';
              if (answered) {
                if (isCorrect) style = 'border-green-400 bg-green-50 text-green-900';
                else if (isSelected) style = 'border-red-300 bg-red-50 text-red-800';
                else style = 'border-gray-200 bg-white text-gray-400';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                    style
                  )}
                >
                  <span className="mr-2 font-semibold text-gray-400">
                    {['A', 'B', 'C', 'D'][idx]}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div className={cn(
              'rounded-xl px-4 py-3 text-sm',
              selected === q.correct
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            )}>
              <span className="font-semibold mr-1">
                {selected === q.correct ? 'Correct!' : 'Incorrect.'}
              </span>
              {q.explanation}
            </div>
          )}

          {answered && (
            <button
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              {current + 1 >= questions.length ? 'See results' : 'Next question →'}
            </button>
          )}
        </div>
      )}

      {phase === 'result' && (
        <ResultScreen
          correct={correctCount}
          total={questions.length}
          topicName={topicName}
          onClose={onClose}
          onRetry={() => {
            setCurrent(0);
            setSelected(null);
            setAnswered(false);
            setScores([]);
            setPhase('loading');
            fetch('/api/ai/quiz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topicName, subjectName, difficulty, topicNotes }),
            })
              .then((r) => r.json())
              .then((data) => { setQuestions(data.questions); setPhase('question'); })
              .catch((e) => { setErrorMsg(e.message); setPhase('error'); });
          }}
        />
      )}
    </Modal>
  );
}

function ResultScreen({
  correct, total, topicName, onClose, onRetry,
}: {
  correct: number; total: number; topicName: string; onClose: () => void; onRetry: () => void;
}) {
  const pct = Math.round((correct / total) * 100);
  const { label, color, bg } =
    pct === 100 ? { label: 'Perfect score!', color: 'text-green-700', bg: 'bg-green-50' } :
    pct >= 60   ? { label: 'Good work', color: 'text-indigo-700', bg: 'bg-indigo-50' } :
                  { label: 'Keep practising', color: 'text-amber-700', bg: 'bg-amber-50' };

  return (
    <div className="text-center space-y-5 py-4">
      <div className={cn('inline-flex rounded-2xl px-6 py-4 flex-col items-center gap-1', bg)}>
        <span className={cn('text-4xl font-bold', color)}>{pct}%</span>
        <span className={cn('text-sm font-medium', color)}>{label}</span>
      </div>
      <p className="text-gray-600 text-sm">
        {correct} / {total} correct on <span className="font-medium">{topicName}</span>
      </p>
      {pct < 60 && (
        <p className="text-xs text-gray-400">
          Under 60% — consider reviewing this topic before your next session.
        </p>
      )}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          Try again
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function LoadingRing() {
  return (
    <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke="#e0e7ff" strokeWidth="3" />
      <path d="M16 4a12 12 0 0112 12" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
