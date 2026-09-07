import React from 'react';
import { TestPaper, TestAttempt, Candidate } from '../types';
import { FileText, Download, X, CheckCircle2, AlertTriangle, Users, Award, TrendingUp, BarChart3, Clock, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { generateAndDownloadSubmissionPdf, generateAndDownloadTestPaperSummaryPdf } from '../utils/pdfGenerator';

interface TestSummaryReportModalProps {
  test: TestPaper;
  attempts: TestAttempt[];
  candidates: Candidate[];
  onClose: () => void;
  onEditTest?: (test: TestPaper) => void;
}

export const TestSummaryReportModal: React.FC<TestSummaryReportModalProps> = ({
  test,
  attempts,
  candidates,
  onClose,
  onEditTest,
}) => {
  const validCandidateIds = new Set(candidates.map((c) => c.id));
  const validCandidateEmails = new Set(candidates.map((c) => c.email?.toLowerCase().trim()));
  const testAttempts = attempts.filter(
    (a) =>
      a.testId === test.id &&
      ((a.candidateId && validCandidateIds.has(a.candidateId)) ||
        (a.candidateEmail && validCandidateEmails.has(a.candidateEmail.toLowerCase().trim())))
  );
  const totalAttempts = testAttempts.length;

  const passedCount = testAttempts.filter((a) => a.status === 'PASSED').length;
  const failedCount = totalAttempts - passedCount;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  const avgScore =
    totalAttempts > 0
      ? Math.round(testAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / totalAttempts)
      : 0;

  const highestScore = totalAttempts > 0 ? Math.max(...testAttempts.map((a) => a.scorePercentage)) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...testAttempts.map((a) => a.scorePercentage)) : 0;

  const avgTimeTaken =
    totalAttempts > 0
      ? Math.round((testAttempts.reduce((sum, a) => sum + a.timeTakenMinutes, 0) / totalAttempts) * 10) / 10
      : 0;

  // Question-by-question performance accuracy analysis
  const questionAnalytics = test.questions.map((q, idx) => {
    let correctAttempts = 0;
    let wrongAttempts = 0;
    let unattempted = 0;

    testAttempts.forEach((att) => {
      const userAns = att.answers?.find((ans) => ans.questionId === q.id);
      if (userAns) {
        if (userAns.selectedOptionIndex === q.correctOptionIndex) {
          correctAttempts++;
        } else if (userAns.selectedOptionIndex === null || userAns.selectedOptionIndex === undefined) {
          unattempted++;
        } else {
          wrongAttempts++;
        }
      } else {
        unattempted++;
      }
    });

    const accuracyRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    return {
      qIndex: idx + 1,
      qId: q.id,
      questionText: q.questionText,
      correctAttempts,
      wrongAttempts,
      unattempted,
      accuracyRate,
    };
  });

  // Block performance for this test
  const blockStatsMap: Record<string, { count: number; sumScore: number; passed: number }> = {};
  testAttempts.forEach((att) => {
    const b = att.block || 'Unknown';
    if (!blockStatsMap[b]) blockStatsMap[b] = { count: 0, sumScore: 0, passed: 0 };
    blockStatsMap[b].count++;
    blockStatsMap[b].sumScore += att.scorePercentage;
    if (att.status === 'PASSED') blockStatsMap[b].passed++;
  });

  const blockChartData = Object.entries(blockStatsMap).map(([blockName, data]) => ({
    block: blockName,
    avgScore: Math.round(data.sumScore / data.count),
    candidatesCount: data.count,
    passRate: Math.round((data.passed / data.count) * 100),
  }));

  // Ranked candidates list for this test paper
  const rankedAttempts = [...testAttempts].sort((a, b) => {
    if (b.scorePercentage !== a.scorePercentage) {
      return b.scorePercentage - a.scorePercentage;
    }
    if (a.timeTakenMinutes !== b.timeTakenMinutes) {
      return a.timeTakenMinutes - b.timeTakenMinutes;
    }
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Official Test Paper Summary Report
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{test.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Subject: <strong>{test.subject}</strong></span>
              <span>• Target: <strong>{test.targetBlock}</strong></span>
              <span>• Total: <strong>{test.questions.length} MCQs</strong></span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-mono font-bold text-[11px] border border-amber-200 dark:border-amber-800">
                Access Code: {test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onEditTest && (
              <button
                onClick={() => {
                  onClose();
                  onEditTest(test);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
              >
                Edit Test Paper
              </button>
            )}
            <button
              onClick={() => generateAndDownloadTestPaperSummaryPdf({ test, attempts, candidates })}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs shadow transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              title="Download Full Test Paper Summary Report as PDF"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase block">Total Submissions</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalAttempts}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase block">Average Score</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{avgScore}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase block">Qualification Pass %</span>
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">{passRate}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase block">Avg Time Spent</span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{avgTimeTaken} Mins</span>
          </div>
        </div>

        {/* Graphical Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question Accuracy Chart */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Question-Wise Accuracy Rate %</h3>
            <div className="h-56 w-full">
              {totalAttempts > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionAnalytics} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="qIndex" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: any) => [`${val}% Correct`, 'Accuracy']} />
                    <Bar dataKey="accuracyRate" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No submissions recorded for this test yet.
                </div>
              )}
            </div>
          </div>

          {/* Block Level Performance Chart */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Block-Wise Average Score %</h3>
            <div className="h-56 w-full">
              {blockChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={blockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="block" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val: any) => [`${val}% Average`, 'Score']} />
                    <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No block data available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Merit Ranking Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Candidate Merit List & Rankings
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Ranked by Score %, Completion Time, and Submission Date
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {rankedAttempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-3 text-center">Rank</th>
                      <th className="px-4 py-3">Candidate Name</th>
                      <th className="px-4 py-3">Registration ID</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Percentage</th>
                      <th className="px-4 py-3 text-center">Time Spent</th>
                      <th className="px-4 py-3 text-center">Result</th>
                      <th className="px-4 py-3 text-center">PDF Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {rankedAttempts.map((att, index) => {
                      const rank = index + 1;
                      const matchedCandidate = candidates.find((c) => c.id === att.candidateId);
                      const regId = matchedCandidate?.registrationId || 'RJ-2026';

                      let rankBadge = (
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto text-[11px]">
                          #{rank}
                        </span>
                      );

                      if (rank === 1) {
                        rankBadge = (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center mx-auto text-xs ring-2 ring-amber-300 shadow-sm">
                            🥇 1
                          </span>
                        );
                      } else if (rank === 2) {
                        rankBadge = (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center mx-auto text-xs ring-2 ring-slate-200 shadow-sm">
                            🥈 2
                          </span>
                        );
                      } else if (rank === 3) {
                        rankBadge = (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center mx-auto text-xs ring-2 ring-amber-600 shadow-sm">
                            🥉 3
                          </span>
                        );
                      }

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 text-center font-extrabold">{rankBadge}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            {att.candidateName}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {regId}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                            {att.scoreObtained} / {att.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {att.scorePercentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                            {att.timeTakenMinutes} Mins
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'PASSED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                              }`}
                            >
                              {att.status === 'PASSED' ? 'PASSED' : 'NEEDS FOCUS'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                generateAndDownloadSubmissionPdf({
                                  candidateName: att.candidateName,
                                  candidateEmail: att.candidateEmail,
                                  registrationId: regId,
                                  testTitle: test.title,
                                  subject: test.subject,
                                  scoreObtained: att.scoreObtained,
                                  totalMarks: att.totalMarks,
                                  scorePercentage: att.scorePercentage,
                                  correctCount: att.correctCount,
                                  wrongCount: att.wrongCount,
                                  unattemptedCount: att.unattemptedCount,
                                  timeTakenMinutes: att.timeTakenMinutes,
                                  submittedAt: att.submittedAt,
                                  questions: test.questions,
                                  answers: att.answers,
                                });
                              }}
                              className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-colors"
                              title="Download Candidate PDF Report"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No candidates have taken or submitted this test yet.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Question Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Textual Question Breakdown & Answer Key</h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Question Text</th>
                  <th className="px-4 py-3">Correct Answer</th>
                  <th className="px-4 py-3 text-center">Correct %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {questionAnalytics.map((q) => {
                  const questionObj = test.questions[q.qIndex - 1];
                  const correctText = questionObj?.options[questionObj.correctOptionIndex] || 'N/A';

                  return (
                    <tr key={q.qId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Q{q.qIndex}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-sm truncate">
                        {q.questionText}
                      </td>
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-300 font-bold max-w-xs truncate">
                        {correctText}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{q.accuracyRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Report Generated by Rajsamand Education Evaluation System</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
