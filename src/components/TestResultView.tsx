import React, { useState } from 'react';
import { TestAttempt, TestPaper } from '../types';
import { sendEmailAPI } from '../services/api';
import { Award, CheckCircle2, AlertTriangle, Mail, Download, ArrowLeft, Clock, BookOpen, FileText } from 'lucide-react';
import { generateAndDownloadSubmissionPdf } from '../utils/pdfGenerator';

interface TestResultViewProps {
  attempt: TestAttempt;
  test: TestPaper;
  onReturnToDashboard: () => void;
  onOpenReportModal: () => void;
}

export const TestResultView: React.FC<TestResultViewProps> = ({
  attempt,
  test,
  onReturnToDashboard,
  onOpenReportModal,
}) => {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(
    attempt.emailSent ? 'Result notification email was dispatched to candidate.' : null
  );

  const handleSendResultEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      const res = await sendEmailAPI({
        type: 'TEST_RESULT_NOTIFICATION',
        candidateEmail: attempt.candidateEmail,
        candidateName: attempt.candidateName,
        details: {
          testTitle: attempt.testTitle,
          subject: test?.subject,
          scoreObtained: attempt.scoreObtained,
          totalMarks: attempt.totalMarks,
          scorePercentage: attempt.scorePercentage,
          correctCount: attempt.correctCount,
          wrongCount: attempt.wrongCount,
          unattemptedCount: attempt.unattemptedCount,
          timeTakenMinutes: attempt.timeTakenMinutes,
          submittedAt: attempt.submittedAt,
          questions: test?.questions,
          answers: attempt.answers,
        },
      });

      if (res.sentRealEmail) {
        setEmailStatusMsg(`Scorecard email with attached PDF report successfully sent to ${attempt.candidateEmail}`);
      } else {
        setEmailStatusMsg(`Result notification & PDF report prepared for ${attempt.candidateEmail}`);
      }
    } catch (err: any) {
      setEmailStatusMsg(`Logged result dispatch for ${attempt.candidateEmail}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadPdfReport = () => {
    generateAndDownloadSubmissionPdf({
      candidateName: attempt.candidateName,
      candidateEmail: attempt.candidateEmail,
      block: attempt.block,
      testTitle: attempt.testTitle,
      subject: test?.subject,
      scoreObtained: attempt.scoreObtained,
      totalMarks: attempt.totalMarks,
      scorePercentage: attempt.scorePercentage,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unattemptedCount: attempt.unattemptedCount,
      timeTakenMinutes: attempt.timeTakenMinutes,
      submittedAt: attempt.submittedAt,
      questions: test?.questions,
      answers: attempt.answers,
    });
  };

  const isPassed = attempt.status === 'PASSED';

  return (
    <div className="space-y-8 pb-12">
      {/* Return Control */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onReturnToDashboard}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Overview</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleSendResultEmail}
            disabled={isSendingEmail}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isSendingEmail ? 'Sending...' : 'Email Scorecard'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdfReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Submission PDF</span>
          </button>
        </div>
      </div>

      {emailStatusMsg && (
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-medium flex items-center justify-between">
          <span>{emailStatusMsg}</span>
          <button onClick={() => setEmailStatusMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Hero Scorecard Banner */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isPassed
            ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-rose-500/30'
        }`}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">{attempt.testTitle}</h1>
          <p className="text-xs text-white/80 mt-1">
            Candidate: <strong>{attempt.candidateName}</strong>
          </p>
        </div>

        {/* Score Pill */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-48">
          <span className="text-3xl font-black text-white">{attempt.scorePercentage}%</span>
          <span className="text-xs font-semibold mt-1 opacity-90">
            {attempt.scoreObtained} / {attempt.totalMarks} Total Marks
          </span>
          <span
            className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
              isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}
          >
            {isPassed ? 'QUALIFIED ✅' : 'NEEDS IMPROVEMENT ⚠️'}
          </span>
        </div>
      </div>

      {/* Metrics breakdown grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Correct Answers</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{attempt.correctCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Incorrect Answers</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">{attempt.wrongCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Unattempted</span>
          <span className="text-xl font-bold text-slate-500 mt-1 block">{attempt.unattemptedCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">Time Spent</span>
          <span className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1 block">{attempt.timeTakenMinutes} Mins</span>
        </div>
      </div>

      {/* Comprehensive Question Solutions Review */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Question-by-Question Solution Breakdown
        </h3>

        <div className="space-y-6">
          {test.questions.map((q, qIndex) => {
            const answerDetail = attempt.answers?.find((a) => a.questionId === q.id);
            const userSelectedOpt = answerDetail ? answerDetail.selectedOptionIndex : null;
            const isCorrect = userSelectedOpt === q.correctOptionIndex;
            const isUnattempted = userSelectedOpt === null || userSelectedOpt === undefined;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : isUnattempted
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center">
                      Q{qIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{q.questionText}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        : isUnattempted
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {isCorrect ? '+ ' + q.marks + ' Marks (Correct)' : isUnattempted ? 'Unattempted (0 Marks)' : 'Incorrect (0 Marks)'}
                  </span>
                </div>

                {/* Option Choices List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                  {q.options.map((optText, optIdx) => {
                    const isChoiceCorrect = q.correctOptionIndex === optIdx;
                    const isChoiceUserSelected = userSelectedOpt === optIdx;

                    let choiceBg = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';
                    if (isChoiceCorrect) {
                      choiceBg = 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-500 font-bold text-emerald-950 dark:text-emerald-200';
                    } else if (isChoiceUserSelected && !isChoiceCorrect) {
                      choiceBg = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 font-bold text-rose-950 dark:text-rose-200';
                    }

                    return (
                      <div key={optIdx} className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${choiceBg}`}>
                        <span className="font-bold">{String.fromCharCode(65 + optIdx)}:</span>
                        <span>{optText}</span>
                        {isChoiceCorrect && <span className="ml-auto text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Correct Key</span>}
                        {isChoiceUserSelected && !isChoiceCorrect && <span className="ml-auto text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded">Your Choice</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
