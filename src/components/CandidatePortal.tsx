import React, { useState } from 'react';
import { Candidate, TestPaper, TestAttempt, TypingTest, TypingAttempt } from '../types';
import { Compass, BarChart3, Clock, FileCheck, Award, ArrowRight, CheckCircle2, AlertTriangle, Mail, ShieldCheck, Play, Key, Download, Keyboard, FileText } from 'lucide-react';
import { generateAndDownloadSubmissionPdf, downloadCandidateTypingScorecardPdf } from '../utils/pdfGenerator';
import { TypingResultModal } from './typing/TypingResultModal';

interface CandidatePortalProps {
  candidate: Candidate;
  tests: TestPaper[];
  attempts: TestAttempt[];
  typingTests?: TypingTest[];
  typingAttempts?: TypingAttempt[];
  onStartTest: (test: TestPaper) => void;
  onReviewAttempt: (attempt: TestAttempt) => void;
  onRequestEmailResult: (attempt: TestAttempt) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  candidate,
  tests,
  attempts,
  typingTests = [],
  typingAttempts = [],
  onStartTest,
  onReviewAttempt,
  onRequestEmailResult,
  activeTab,
  setActiveTab,
}) => {
  const [viewingTypingAttempt, setViewingTypingAttempt] = useState<TypingAttempt | null>(null);

  // Filter candidate's MCQ attempts
  const myAttempts = attempts.filter((a) => a.candidateId === candidate.id || a.candidateEmail === candidate.email);

  // Filter candidate's Typing attempts
  const myTypingAttempts = typingAttempts.filter(
    (a) => a.candidateId === candidate.id || a.candidateEmail === candidate.email
  );

  const completedCount = myAttempts.length + myTypingAttempts.length;
  const avgScore =
    myAttempts.length > 0
      ? Math.round(myAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / myAttempts.length)
      : 0;

  const passedCount =
    myAttempts.filter((a) => a.status === 'PASSED').length +
    myTypingAttempts.filter((a) => a.status === 'QUALIFIED').length;

  // Filter available tests for candidate
  const isTypingCandidate = !!candidate.typingMedium;
  const availableTests = isTypingCandidate
    ? []
    : tests.filter((t) => {
        if (t.status !== 'PUBLISHED') return false;

        // Check targeted candidate assignment match
        if (t.assignedCandidateIds && t.assignedCandidateIds.length > 0 && !t.assignedCandidateIds.includes('ALL')) {
          return t.assignedCandidateIds.includes(candidate.id);
        }

        return true;
      });

  return (
    <div className="space-y-8 pb-12">
      {/* Candidate Profile Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-amber-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-xl sm:text-2xl font-black">{candidate.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                {candidate.registrationId}
              </span>
              {candidate.typingMedium && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-400/30">
                  {candidate.typingMedium === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010)' : 'English Medium'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {candidate.designation && <span>{candidate.designation}</span>}
              {candidate.designation && candidate.officeName && <span> • </span>}
              {candidate.officeName && <span>{candidate.officeName}</span>}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Evaluations</span>
            <span className="text-lg font-bold text-white">{completedCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">
              {isTypingCandidate ? 'Top Speed' : 'Avg Score'}
            </span>
            <span className="text-lg font-bold text-amber-400">
              {isTypingCandidate
                ? myTypingAttempts.length > 0
                  ? `${Math.max(...myTypingAttempts.map((a) => a.netWpm))} WPM`
                  : '0 WPM'
                : `${avgScore}%`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Qualified</span>
            <span className="text-lg font-bold text-emerald-400">{passedCount}</span>
          </div>
        </div>
      </div>

      {/* Navigation Switch */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {!isTypingCandidate && (
          <button
            onClick={() => setActiveTab('my-tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'my-tests'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" /> Available Assessments ({availableTests.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('typing-test')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'typing-test'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Keyboard className="w-4 h-4 text-amber-500" /> Typing Test (10 Min)
        </button>
        <button
          onClick={() => setActiveTab('my-performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my-performance'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> My Performance & Scorecard ({completedCount})
        </button>
      </div>

      {/* TAB 1: Available Assessments List (for General Candidates) */}
      {activeTab === 'my-tests' && !isTypingCandidate && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active District Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableTests.map((test) => {
              const existingAttempt = myAttempts.find((a) => a.testId === test.id);
              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        {test.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {test.timeLimitMinutes} Mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {test.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-mono font-bold">
                        <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Access Code: {test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`}</span>
                      </div>

                      {test.assignedCandidateIds && test.assignedCandidateIds.includes(candidate.id) && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Directly Assigned to You</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {test.instructions}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span>• {test.questions.length} MCQs</span>
                      <span>• {test.totalMarks} Total Marks</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {existingAttempt ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Attempted ({existingAttempt.scorePercentage}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => onReviewAttempt(existingAttempt)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Review Answers
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStartTest(test)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Online Assessment</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Performance Metrics & History */}
      {activeTab === 'my-performance' && (
        <div className="space-y-6">
          {/* Section A: Typing Test Evaluations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-amber-600" />
                  <span>Typing Speed Assessments & Scorecards</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Official 10-minute speed evaluation records in Hindi (DevLys 010) and English.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('typing-test')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
              >
                Take Typing Test
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Typing Test Paper</th>
                    <th className="px-5 py-3 text-center">Medium</th>
                    <th className="px-5 py-3 text-center text-emerald-600">Correct Words</th>
                    <th className="px-5 py-3 text-center">Gross WPM</th>
                    <th className="px-5 py-3 text-center">Net WPM</th>
                    <th className="px-5 py-3 text-center">Accuracy</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Scorecard & Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {myTypingAttempts.length > 0 ? (
                    myTypingAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {att.testTitle}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            att.language === 'HINDI_DEVLYS_010'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}>
                            {att.language === 'HINDI_DEVLYS_010' ? 'Hindi' : 'English'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {att.correctWordsCount ?? 0}
                        </td>
                        <td className="px-5 py-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {att.grossWpm} WPM
                        </td>
                        <td className="px-5 py-4 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                          {att.netWpm} WPM
                        </td>
                        <td className="px-5 py-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {att.accuracyPercentage}%
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              att.status === 'QUALIFIED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {att.status === 'QUALIFIED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {att.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const foundTest = typingTests.find((t) => t.id === att.typingTestId);
                              downloadCandidateTypingScorecardPdf(att, foundTest?.passageText);
                            }}
                            className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Download Official Typing Report PDF"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Report
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingTypingAttempt(att)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> Scorecard
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                        No typing tests submitted yet. Go to <strong className="text-amber-600">Typing Test</strong> tab to attempt your assigned paragraph.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: MCQ Assessments History (if any) */}
          {!isTypingCandidate && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">My MCQ Assessment History</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3">Assessment Title</th>
                      <th className="px-5 py-3 text-center">Score Obtained</th>
                      <th className="px-5 py-3 text-center">Percentage</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Time Taken</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {myAttempts.length > 0 ? (
                      myAttempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {att.testTitle}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-slate-900 dark:text-white">
                            {att.scoreObtained} / {att.totalMarks}
                          </td>
                          <td className="px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {att.scorePercentage}%
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                att.status === 'PASSED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {att.status === 'PASSED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {att.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center text-slate-500">
                            {att.timeTakenMinutes} mins
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const testPaper = tests.find((t) => t.id === att.testId);
                                generateAndDownloadSubmissionPdf({
                                  candidateName: att.candidateName,
                                  candidateEmail: att.candidateEmail,
                                  block: att.block,
                                  testTitle: att.testTitle,
                                  subject: testPaper?.subject,
                                  scoreObtained: att.scoreObtained,
                                  totalMarks: att.totalMarks,
                                  scorePercentage: att.scorePercentage,
                                  correctCount: att.correctCount,
                                  wrongCount: att.wrongCount,
                                  unattemptedCount: att.unattemptedCount,
                                  timeTakenMinutes: att.timeTakenMinutes,
                                  submittedAt: att.submittedAt,
                                  questions: testPaper?.questions,
                                  answers: att.answers,
                                });
                              }}
                              className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                              title="Download Official Submission PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF Report
                            </button>
                            <button
                              type="button"
                              onClick={() => onRequestEmailResult(att)}
                              className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5" /> Email Result
                            </button>
                            <button
                              type="button"
                              onClick={() => onReviewAttempt(att)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                          You have not completed any assessments yet. Click "Available Assessments" above to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scorecard Modal */}
      {viewingTypingAttempt && (
        <TypingResultModal
          isOpen={!!viewingTypingAttempt}
          onClose={() => setViewingTypingAttempt(null)}
          attempt={viewingTypingAttempt}
          referencePassage={typingTests.find((t) => t.id === viewingTypingAttempt.typingTestId)?.passageText}
        />
      )}
    </div>
  );
};
