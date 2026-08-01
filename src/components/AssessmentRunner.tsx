import React, { useState, useEffect } from 'react';
import { TestPaper, Candidate, TestAttempt, QuestionAnswer } from '../types';
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, ShieldAlert, Flag } from 'lucide-react';

interface AssessmentRunnerProps {
  test: TestPaper;
  candidate: Candidate;
  onSubmitTest: (attempt: TestAttempt) => void;
  onCancel: () => void;
}

export const AssessmentRunner: React.FC<AssessmentRunnerProps> = ({
  test,
  candidate,
  onSubmitTest,
  onCancel,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Track selected options per question ID: { 'q1': 0, 'q2': 2 }
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  
  // Track marked for review per question ID: { 'q1': true }
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});

  // Countdown timer state in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(test.timeLimitMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const currentQ = test.questions[currentQuestionIndex];

  // Option select handler
  const handleSelectOption = (optIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex,
    }));
  };

  const handleClearAnswer = () => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: null,
    }));
  };

  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  // Compute stats
  const answeredCount = Object.values(userAnswers).filter((v) => v !== null && v !== undefined).length;
  const unansweredCount = test.questions.length - answeredCount;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  // Automated Grading & Final Submission Engine
  const handleFinalSubmit = () => {
    let scoreObtained = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    const answerDetails: QuestionAnswer[] = test.questions.map((q) => {
      const selected = userAnswers[q.id];
      if (selected === null || selected === undefined) {
        unattemptedCount += 1;
        return {
          questionId: q.id,
          selectedOptionIndex: null,
          isCorrect: false,
          marksObtained: 0,
        };
      } else if (selected === q.correctOptionIndex) {
        correctCount += 1;
        scoreObtained += q.marks;
        return {
          questionId: q.id,
          selectedOptionIndex: selected,
          isCorrect: true,
          marksObtained: q.marks,
        };
      } else {
        wrongCount += 1;
        return {
          questionId: q.id,
          selectedOptionIndex: selected,
          isCorrect: false,
          marksObtained: 0,
        };
      }
    });

    const scorePercentage = Math.round((scoreObtained / test.totalMarks) * 100);
    const timeTakenMinutes = Math.max(1, Math.round((test.timeLimitMinutes * 60 - secondsRemaining) / 60));
    const status = scoreObtained >= test.passingMarks ? 'PASSED' : 'FAILED';

    const newAttempt: TestAttempt = {
      id: `att-${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      block: candidate.block,
      scoreObtained,
      totalMarks: test.totalMarks,
      scorePercentage,
      correctCount,
      wrongCount,
      unattemptedCount,
      status,
      timeTakenMinutes,
      submittedAt: new Date().toISOString(),
      answers: answerDetails,
    };

    onSubmitTest(newAttempt);
  };

  // Format Time Remaining (MM:SS)
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeLow = secondsRemaining < 300; // less than 5 minutes

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            Official District Assessment
          </span>
          <h2 className="text-base sm:text-lg font-bold mt-1">{test.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Candidate: <strong>{candidate.name}</strong> ({candidate.registrationId})
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Countdown Timer */}
          <div
            className={`px-4 py-2 rounded-xl border flex items-center space-x-2 font-mono font-bold text-sm ${
              isTimeLow
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time Remaining: {formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Question + Palette Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Question Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            {/* Question Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentQ.marks} Marks
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed mb-6">
              {currentQ.questionText}
            </h3>

            {/* Option Buttons */}
            <div className="space-y-3">
              {currentQ.options.map((optionText, optIndex) => {
                const isSelected = userAnswers[currentQ.id] === optIndex;
                return (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => handleSelectOption(optIndex)}
                    className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center space-x-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-sm ring-2 ring-emerald-500/30'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span>{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleReview}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                  markedForReview[currentQ.id]
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAnswer}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Clear Choice
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={currentQuestionIndex === test.questions.length - 1}
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              Question Palette
            </h4>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== null && userAnswers[q.id] !== undefined;
                const isReview = markedForReview[q.id];
                const isCurrent = idx === currentQuestionIndex;

                let btnStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                if (isAnswered) btnStyle = 'bg-emerald-600 text-white font-bold';
                if (isReview) btnStyle = 'bg-amber-500 text-white font-bold';
                if (isCurrent) btnStyle += ' ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900';

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Legend */}
          <div className="space-y-2 text-[11px] pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-600" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Marked for Review ({reviewCount})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Unattempted ({unansweredCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You have answered <strong>{answeredCount}</strong> out of <strong>{test.questions.length}</strong> questions. Automated grading will evaluate your result instantly.
            </p>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
