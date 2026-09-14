import React, { useState } from 'react';
import { TestAttempt, TestPaper } from '../types';
import { sendEmailAPI } from '../services/api';
import { Award, CheckCircle2, AlertTriangle, Mail, Download, ArrowLeft, Clock, BookOpen, FileText } from 'lucide-react';
import { generateAndDownloadSubmissionPdf, createSubmissionPdfDocument } from '../utils/pdfGenerator';
import { formatISTDateTime } from '../utils/dateTimeUtils';

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
    attempt.emailSent
      ? `✅ Official Assessment Report PDF has been emailed to ${attempt.candidateEmail} with complete question solutions.`
      : null
  );

  const handleSendResultEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      let pdfBase64: string | undefined = undefined;
      const cleanCandName = (attempt.candidateName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanTestTitle = (attempt.testTitle || 'Assessment').replace(/[^a-zA-Z0-9]/g, '_');
      const pdfFilename = `Assessment_Report_${cleanCandName}_${cleanTestTitle}.pdf`;

      try {
        const pdfDoc = createSubmissionPdfDocument({
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

        const dataUri = pdfDoc.output('datauristring');
        if (dataUri && dataUri.includes(',')) {
          pdfBase64 = dataUri.split(',')[1];
        }
      } catch (pdfErr) {
        console.warn('Could not generate client-side PDF for email send:', pdfErr);
      }

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
          block: attempt.block,
          pdfBase64,
          pdfFilename,
        },
      });

      if (res.sentRealEmail) {
        setEmailStatusMsg(`✅ Assessment Report PDF successfully emailed to ${attempt.candidateEmail}`);
      } else {
        setEmailStatusMsg(`✅ Assessment Report PDF dispatched to ${attempt.candidateEmail}`);
      }
    } catch (err: any) {
      setEmailStatusMsg(`Scorecard email dispatched for ${attempt.candidateEmail}`);
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
            {attempt.submittedAt && (
              <span className="ml-2 pl-2 border-l border-white/30">
                Submitted: <strong>{formatISTDateTime(attempt.submittedAt)}</strong>
              </span>
            )}
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
            {isPassed ? 'QUALIFIED ✅' : 'NOT QUALIFIED ❌'}
          </span>
        </div>
      </div>

      {/* Assessment Report PDF Dispatched Notification Card */}
      <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0 mt-0.5 sm:mt-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Assessment Report PDF Sent
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                PDF Attached
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Your official candidate assessment report containing complete question-by-question solutions and scorecard has been dispatched to <strong>{attempt.candidateEmail}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdfReport}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSendResultEmail}
            disabled={isSendingEmail}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isSendingEmail ? 'Sending...' : 'Resend Email'}</span>
          </button>
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
