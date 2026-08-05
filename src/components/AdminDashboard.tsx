import React, { useState } from 'react';
import { Candidate, TestPaper, TestAttempt, DistrictBlock } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { Users, FileCheck, Award, TrendingUp, Download, Search, CheckCircle2, AlertTriangle, UserCheck, RefreshCw, FileSpreadsheet, ExternalLink, Mail, Send, Edit3, BarChart3, BookOpen, Key, Copy, Check, Trash2, Globe } from 'lucide-react';
import { sendEmailAPI } from '../services/api';
import { TestSummaryReportModal } from './TestSummaryReportModal';
import { PublishSuccessModal } from './PublishSuccessModal';

interface AdminDashboardProps {
  candidates: Candidate[];
  tests: TestPaper[];
  attempts: TestAttempt[];
  onNavigateToUpload: () => void;
  onNavigateToCandidates: () => void;
  onSelectCandidateForReport?: (candidate: Candidate) => void;
  onEditTest?: (test: TestPaper) => void;
  onDeleteTest?: (testId: string) => void;
  onResetData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  candidates,
  tests,
  attempts,
  onNavigateToUpload,
  onNavigateToCandidates,
  onSelectCandidateForReport,
  onEditTest,
  onDeleteTest,
  onResetData,
}) => {
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');
  const [selectedTestFilter, setSelectedTestFilter] = useState<string>('ALL');
  const [copiedCodeTestId, setCopiedCodeTestId] = useState<string | null>(null);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resendingAttemptId, setResendingAttemptId] = useState<string | null>(null);
  const [resendAttemptToast, setResendAttemptToast] = useState<string | null>(null);
  const [reportTest, setReportTest] = useState<TestPaper | null>(null);

  // Quick Candidate Assignment Modal State
  const [assigningTest, setAssigningTest] = useState<TestPaper | null>(null);
  const [modalAssignSelectedIds, setModalAssignSelectedIds] = useState<string[]>([]);
  const [modalAssignSearchTerm, setModalAssignSearchTerm] = useState<string>('');
  const [modalAssignScope, setModalAssignScope] = useState<'ALL' | 'SELECTED'>('ALL');
  const [modalAssignSuccessMsg, setModalAssignSuccessMsg] = useState<string | null>(null);
  const [isDispatchingAssign, setIsDispatchingAssign] = useState<boolean>(false);
  const [publishedModalData, setPublishedModalData] = useState<{
    isOpen: boolean;
    test: TestPaper | null;
    notifiedCount: number | string;
  }>({
    isOpen: false,
    test: null,
    notifiedCount: 0,
  });

  const handleOpenAssignModal = (testPaper: TestPaper) => {
    setAssigningTest(testPaper);
    const isSpecific =
      testPaper.assignedCandidateIds &&
      testPaper.assignedCandidateIds.length > 0 &&
      !testPaper.assignedCandidateIds.includes('ALL');
    setModalAssignScope(isSpecific ? 'SELECTED' : 'ALL');
    setModalAssignSelectedIds(
      isSpecific ? testPaper.assignedCandidateIds! : []
    );
    setModalAssignSuccessMsg(null);
  };

  const handleSaveModalAssignment = async () => {
    if (!assigningTest) return;
    setIsDispatchingAssign(true);

    const updatedTest: TestPaper = {
      ...assigningTest,
      assignedCandidateIds: modalAssignScope === 'SELECTED' ? modalAssignSelectedIds : ['ALL'],
    };

    if (onEditTest) {
      onEditTest(updatedTest);
    }

    // Determine targeted candidates
    let newlyAssigned: Candidate[] = [];
    if (modalAssignScope === 'SELECTED') {
      newlyAssigned = candidates.filter(
        (c) => c.activeStatus && modalAssignSelectedIds.includes(c.id)
      );
    } else {
      newlyAssigned = candidates.filter(
        (c) =>
          c.activeStatus &&
          (assigningTest.targetBlock === 'District-Wide' || c.block === assigningTest.targetBlock)
      );
    }

    // Dispatch emails to assigned candidates
    for (const cand of newlyAssigned) {
      try {
        await sendEmailAPI({
          type: 'TEST_ASSIGNED',
          candidateEmail: cand.email,
          candidateName: cand.name,
          details: {
            testTitle: assigningTest.title,
            testId: assigningTest.id,
            accessCode: assigningTest.accessCode,
            subject: assigningTest.subject,
            duration: assigningTest.timeLimitMinutes,
            totalQuestions: assigningTest.questions.length,
            totalMarks: assigningTest.totalMarks,
          },
        });
      } catch (e) {
        console.warn('Assignment email dispatch logged');
      }
    }

    setIsDispatchingAssign(false);
    const assignedTestRef = assigningTest;
    const assignedCount = newlyAssigned.length;

    setAssigningTest(null);
    setPublishedModalData({
      isOpen: true,
      test: assignedTestRef,
      notifiedCount: assignedCount,
    });
  };

  const handleResendAttemptEmail = async (att: TestAttempt) => {
    setResendingAttemptId(att.id);
    setResendAttemptToast(null);
    try {
      const res = await sendEmailAPI({
        type: 'TEST_RESULT_NOTIFICATION',
        candidateEmail: att.candidateEmail,
        candidateName: att.candidateName,
        details: {
          testTitle: att.testTitle,
          scoreObtained: att.scoreObtained,
          totalMarks: att.totalMarks,
          scorePercentage: att.scorePercentage,
          correctCount: att.correctCount,
          wrongCount: att.wrongCount,
          unattemptedCount: att.unattemptedCount,
          timeTakenMinutes: att.timeTakenMinutes,
          block: att.block,
        },
      });

      setResendAttemptToast(
        res.message || `Scorecard email successfully resent to ${att.candidateEmail}`
      );
    } catch (e: any) {
      setResendAttemptToast(`Scorecard email logged for ${att.candidateEmail}`);
    } finally {
      setResendingAttemptId(null);
    }
  };

  // 1. High-level Summary Metrics (Candidate Focused)
  const totalCandidates = candidates.length;
  const publishedTestsCount = tests.filter((t) => t.status === 'PUBLISHED').length;
  const totalAttemptsCount = attempts.length;

  // Assessed candidates (unique candidate IDs with at least 1 attempt)
  const assessedCandidateIds = new Set(attempts.map((a) => a.candidateId));
  const assessedCandidatesCount = assessedCandidateIds.size;

  const passedAttemptsCount = attempts.filter((a) => a.status === 'PASSED').length;
  const overallPassRate = totalAttemptsCount > 0 ? Math.round((passedAttemptsCount / totalAttemptsCount) * 100) : 0;

  const candidateMeanScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercentage, 0) / attempts.length)
      : 0;

  // 2. Candidate Performance Score Brackets (For Candidate Bar Chart)
  // Brackets: 90-100%, 75-89%, 50-74%, 40-49%, <40%
  const scoreDistribution = [
    { bracket: '90-100% (Outstanding)', count: 0, color: '#059669' },
    { bracket: '75-89% (Distinction)', count: 0, color: '#2563eb' },
    { bracket: '50-74% (Satisfactory)', count: 0, color: '#7c3aed' },
    { bracket: '40-49% (Pass)', count: 0, color: '#d97706' },
    { bracket: '<40% (Needs Focus)', count: 0, color: '#e11d48' },
  ];

  attempts.forEach((att) => {
    const s = att.scorePercentage;
    if (s >= 90) scoreDistribution[0].count++;
    else if (s >= 75) scoreDistribution[1].count++;
    else if (s >= 50) scoreDistribution[2].count++;
    else if (s >= 40) scoreDistribution[3].count++;
    else scoreDistribution[4].count++;
  });

  // 3. Donut Chart Data: Candidate Qualification
  const passedCandidatesCount = Array.from(assessedCandidateIds).filter((candId) => {
    const candAttempts = attempts.filter((a) => a.candidateId === candId);
    return candAttempts.some((a) => a.status === 'PASSED');
  }).length;

  const needsImprovementCandidatesCount = assessedCandidatesCount - passedCandidatesCount;
  const unassessedCandidatesCount = Math.max(0, totalCandidates - assessedCandidatesCount);

  const pieData = [
    { name: 'Qualified Candidates', value: passedCandidatesCount, color: '#10b981' },
    { name: 'Needs Focus', value: needsImprovementCandidatesCount, color: '#f43f5e' },
    { name: 'Unassessed Candidates', value: unassessedCandidatesCount, color: '#64748b' },
  ];

  // 4. Filtered Candidate Records for Individual Analytics Table
  const filteredCandidates = candidates.filter((c) => {
    const matchesBlock = selectedBlockFilter === 'ALL' || c.block === selectedBlockFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.block.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBlock && matchesSearch;
  });

  // 5. Filtered Individual Test Attempts
  const filteredAttempts = attempts.filter((att) => {
    const matchesBlock = selectedBlockFilter === 'ALL' || att.block === selectedBlockFilter;
    const matchesSearch =
      att.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.testTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.block.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBlock && matchesSearch;
  });

  // CSV Export helper for Candidate Analytics Reports
  const handleExportCSV = () => {
    const headers = [
      'Registration ID',
      'Candidate Name',
      'Email',
      'Tehsil/Block',
      'Category',
      'Total Tests Taken',
      'Highest Score %',
      'Average Score %',
      'Qualification Status',
    ];

    const rows = candidates.map((c) => {
      const candAttempts = attempts.filter((a) => a.candidateId === c.id);
      const attemptsCount = candAttempts.length;
      const highestScore = attemptsCount > 0 ? Math.max(...candAttempts.map((a) => a.scorePercentage)) : 0;
      const avgScore =
        attemptsCount > 0
          ? Math.round(candAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / attemptsCount)
          : 0;
      const hasPassed = candAttempts.some((a) => a.status === 'PASSED');
      const status = attemptsCount === 0 ? 'UNASSESSED' : hasPassed ? 'PASSED' : 'NEEDS_FOCUS';

      return [
        c.registrationId,
        `"${c.name}"`,
        c.email,
        c.block,
        c.category,
        attemptsCount,
        `${highestScore}%`,
        `${avgScore}%`,
        status,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rajsamand_Candidate_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            District Evaluation Authority • Candidate Analytics Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Candidate Performance Dashboard</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Real-time tracking of individual candidate assessment scores, qualification status, and automated progress report card generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {totalCandidates > 0 && (
            <button
              id="admin-export-csv-btn"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Candidate CSV</span>
            </button>
          )}

          <button
            onClick={onNavigateToUpload}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Upload New Test Paper</span>
          </button>

          {onResetData && (
            <button
              onClick={onResetData}
              title="Clear all stored candidates and test data"
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all text-xs font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden lg:inline">Reset System Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Candidates</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCandidates}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> {assessedCandidatesCount} candidates assessed
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Test Submissions</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalAttemptsCount}</h3>
              <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Across {publishedTestsCount} active tests
              </p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Candidate Mean Score</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{candidateMeanScore}%</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Overall score average
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pass Rate %</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{overallPassRate}%</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {passedAttemptsCount} passed test submissions
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytical Charts Row (Candidate Analytics Only) */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Candidate Score Performance Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Candidate Score Range Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Categorization of candidate assessment performance into score brackets</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {totalAttemptsCount} Attempt Records
            </span>
          </div>

          <div className="h-72 w-full">
            {totalAttemptsCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-10} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val} Candidate Attempts`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400">
                <FileSpreadsheet className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Assessment Data Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Once candidates log in and submit tests, performance bracket distribution will render automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: Candidate Qualification Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Candidate Qualification Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ratio of Qualified vs Needs Focus vs Unassessed Candidates</p>

            <div className="h-56 w-full">
              {totalCandidates > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                  <Users className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No Candidates Registered</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Pass Cutoff: ≥40% Score</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{passedCandidatesCount} / {totalCandidates} Qualified</span>
          </div>
        </div>
      </div>

      {/* Candidate Individual Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Individual Candidate Performance Metrics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed breakdown of scores, test attempts, and progress reports for each candidate
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Block Filter Dropdown */}
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Tehsil / District Blocks</option>
              <option value="Nathdwara">Nathdwara</option>
              <option value="Kumbhalgarh">Kumbhalgarh</option>
              <option value="Bhim">Bhim</option>
              <option value="Rajsamand">Rajsamand</option>
              <option value="Amet">Amet</option>
              <option value="Deogarh">Deogarh</option>
              <option value="Railmagra">Railmagra</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name / email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Reg ID</th>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Tehsil / Block</th>
                <th className="px-5 py-3 text-center">Tests Taken</th>
                <th className="px-5 py-3 text-center">Best Score</th>
                <th className="px-5 py-3 text-center">Avg Score</th>
                <th className="px-5 py-3 text-center">Qualification</th>
                <th className="px-5 py-3 text-right">Progress Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => {
                  const candAttempts = attempts.filter((a) => a.candidateId === cand.id);
                  const attemptsCount = candAttempts.length;
                  const highestScore = attemptsCount > 0 ? Math.max(...candAttempts.map((a) => a.scorePercentage)) : 0;
                  const avgScore =
                    attemptsCount > 0
                      ? Math.round(candAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / attemptsCount)
                      : 0;
                  const hasPassed = candAttempts.some((a) => a.status === 'PASSED');

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {cand.registrationId}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="font-bold">{cand.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{cand.email}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cand.block}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-900 dark:text-white">
                        {attemptsCount}
                      </td>
                      <td className="px-5 py-4 text-center font-bold">
                        {attemptsCount > 0 ? (
                          <span className={`inline-block px-2 py-0.5 rounded ${
                            highestScore >= 75
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : highestScore >= 40
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}>
                            {highestScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {attemptsCount > 0 ? `${avgScore}%` : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {attemptsCount === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Unassessed
                          </span>
                        ) : hasPassed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Needs Focus
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {onSelectCandidateForReport ? (
                          <button
                            type="button"
                            onClick={() => onSelectCandidateForReport(cand)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Report Card
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        No candidates found in portal database
                      </p>
                      <p className="text-xs text-slate-400">
                        Click "Candidate Accounts" in navigation to register candidate credentials and assign test papers.
                      </p>
                      <button
                        onClick={onNavigateToCandidates}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Register Candidates Now</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submissions Audit Log */}
      {attempts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Individual Test Submissions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time candidate score logs and 1-click Resend email notification buttons</p>
            </div>
            {resendAttemptToast && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{resendAttemptToast}</span>
                <button onClick={() => setResendAttemptToast(null)} className="ml-1 text-slate-400 hover:text-slate-600">✕</button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Candidate Name</th>
                  <th className="px-5 py-3">Tehsil / Block</th>
                  <th className="px-5 py-3">Assessment Title</th>
                  <th className="px-5 py-3 text-center">Score</th>
                  <th className="px-5 py-3 text-center">Percentage</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Submitted At</th>
                  <th className="px-5 py-3 text-right">Resend Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      <div>{att.candidateName}</div>
                      <div className="text-[10px] text-slate-400">{att.candidateEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {att.block}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {att.testTitle}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900 dark:text-white">
                      {att.scoreObtained} / {att.totalMarks}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded ${
                        att.scorePercentage >= 75
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : att.scorePercentage >= 40
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}>
                        {att.scorePercentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {att.status === 'PASSED' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Passed</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">Needs Focus</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(att.submittedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleResendAttemptEmail(att)}
                        disabled={resendingAttemptId === att.id}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-sm transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {resendingAttemptId === att.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Resend Scorecard</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Test Summary Report Modal */}
      {reportTest && (
        <TestSummaryReportModal
          test={reportTest}
          attempts={attempts}
          candidates={candidates}
          onClose={() => setReportTest(null)}
          onEditTest={onEditTest}
        />
      )}

      {/* Assign Candidates Modal */}
      {assigningTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Assign Test to Candidates
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {assigningTest.title} ({assigningTest.subject})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTest(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {modalAssignSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{modalAssignSuccessMsg}</span>
                </div>
              )}

              {/* Assignment Scope Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModalAssignScope('ALL')}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    modalAssignScope === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>All Candidates ({assigningTest.targetBlock})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalAssignScope('SELECTED')}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    modalAssignScope === 'SELECTED'
                      ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Selected Candidates Only ({modalAssignSelectedIds.length})</span>
                </button>
              </div>

              {modalAssignScope === 'ALL' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                  <p className="font-extrabold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Open Access Mode
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    This test paper will be accessible to <strong>all registered active candidates</strong> in Tehsil <em>"{assigningTest.targetBlock}"</em>. Clicking Save will send test invitation notification emails to all matching candidates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Search className="w-4 h-4 text-slate-400 ml-1" />
                    <input
                      type="text"
                      placeholder="Search candidate by name, email, or registration ID..."
                      value={modalAssignSearchTerm}
                      onChange={(e) => setModalAssignSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = candidates.filter(
                          (c) =>
                            c.name.toLowerCase().includes(modalAssignSearchTerm.toLowerCase()) ||
                            c.email.toLowerCase().includes(modalAssignSearchTerm.toLowerCase()) ||
                            c.registrationId.toLowerCase().includes(modalAssignSearchTerm.toLowerCase())
                        );
                        setModalAssignSelectedIds((prev) =>
                          Array.from(new Set([...prev, ...filtered.map((c) => c.id)]))
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs whitespace-nowrap"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalAssignSelectedIds([])}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Candidate List with Checkboxes */}
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {candidates
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(modalAssignSearchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(modalAssignSearchTerm.toLowerCase()) ||
                          c.registrationId.toLowerCase().includes(modalAssignSearchTerm.toLowerCase())
                      )
                      .map((cand) => {
                        const isChecked = modalAssignSelectedIds.includes(cand.id);
                        return (
                          <label
                            key={cand.id}
                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              isChecked ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setModalAssignSelectedIds((prev) =>
                                    prev.includes(cand.id)
                                      ? prev.filter((id) => id !== cand.id)
                                      : [...prev, cand.id]
                                  );
                                }}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {cand.name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400">
                                    {cand.registrationId}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {cand.email} • {cand.block} Tehsil
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                cand.activeStatus
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {cand.activeStatus ? 'Active' : 'Disabled'}
                            </span>
                          </label>
                        );
                      })}
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <span>
                      <strong>Strict Notification:</strong> Only the <strong>{modalAssignSelectedIds.length} checked candidate(s)</strong> will receive notification emails and see this test paper.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAssigningTest(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveModalAssignment}
                disabled={isDispatchingAssign || (modalAssignScope === 'SELECTED' && modalAssignSelectedIds.length === 0)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDispatchingAssign ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving & Sending Emails...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save & Notify Assigned Candidates ({modalAssignScope === 'SELECTED' ? modalAssignSelectedIds.length : 'All'})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creative Success Popup Modal */}
      <PublishSuccessModal
        isOpen={publishedModalData.isOpen}
        onClose={() => setPublishedModalData((prev) => ({ ...prev, isOpen: false }))}
        test={publishedModalData.test}
        notifiedCount={publishedModalData.notifiedCount}
      />
    </div>
  );
};
