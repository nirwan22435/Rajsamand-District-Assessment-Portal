import React, { useState, useMemo } from 'react';
import { TypingAttempt, TypingTest, DistrictBlock } from '../../types';
import { exportTypingReportToCSV, formatSecondsToTime } from '../../utils/typingUtils';
import { downloadTypingMeritReportPdf, downloadCandidateTypingScorecardPdf } from '../../utils/pdfGenerator';
import { TypingResultModal } from './TypingResultModal';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Award,
  Layers,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Calendar,
  FileDown,
  X,
} from 'lucide-react';

interface AdminTypingReportViewProps {
  attempts: TypingAttempt[];
  tests: TypingTest[];
  onDeleteAttempt?: (attemptId: string) => void;
  onViewScorecard?: (attempt: TypingAttempt) => void;
}

const DISTRICT_BLOCKS: (DistrictBlock | 'ALL')[] = [
  'ALL',
  'District-Wide',
  'Nathdwara',
  'Kumbhalgarh',
  'Bhim',
  'Rajsamand',
  'Amet',
  'Deogarh',
  'Railmagra',
];

export const AdminTypingReportView: React.FC<AdminTypingReportViewProps> = ({
  attempts,
  tests,
  onDeleteAttempt,
  onViewScorecard,
}) => {
  const [selectedTestId, setSelectedTestId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'ENGLISH' | 'HINDI_DEVLYS_010'>('ALL');
  const [selectedBlock, setSelectedBlock] = useState<DistrictBlock | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'QUALIFIED' | 'DISQUALIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);

  // Selected attempt for detailed scorecard inspection modal
  const [viewingAttempt, setViewingAttempt] = useState<TypingAttempt | null>(null);

  // Extract distinct exam dates from tests and attempts for quick selector
  const distinctExamDates = useMemo(() => {
    const dates = new Set<string>();
    tests.forEach((t) => {
      if (t.examDate) dates.add(t.examDate);
    });
    attempts.forEach((a) => {
      if (a.submittedAt) {
        const d = new Date(a.submittedAt);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dates.add(ymd);
      }
    });
    return Array.from(dates).sort().reverse();
  }, [tests, attempts]);

  // Filter attempts
  const filteredAttempts = useMemo(() => {
    return attempts.filter((att) => {
      if (selectedTestId !== 'ALL' && att.typingTestId !== selectedTestId) return false;
      if (selectedLanguage !== 'ALL' && att.language !== selectedLanguage) return false;
      if (selectedBlock !== 'ALL' && att.block !== selectedBlock) return false;
      if (selectedStatus !== 'ALL' && att.status !== selectedStatus) return false;

      // Filter by Date of Typing Test
      if (selectedDate) {
        const attemptDate = att.submittedAt ? new Date(att.submittedAt) : null;
        const attemptDateStr = attemptDate
          ? `${attemptDate.getFullYear()}-${String(attemptDate.getMonth() + 1).padStart(2, '0')}-${String(attemptDate.getDate()).padStart(2, '0')}`
          : '';
        const attemptIsoDate = att.submittedAt ? att.submittedAt.slice(0, 10) : '';
        const testExamDate = tests.find((t) => t.id === att.typingTestId)?.examDate || '';

        const matchesDate =
          attemptDateStr === selectedDate ||
          attemptIsoDate === selectedDate ||
          testExamDate === selectedDate;

        if (!matchesDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = att.candidateName.toLowerCase().includes(q);
        const matchesEmail = att.candidateEmail.toLowerCase().includes(q);
        const matchesReg = (att.registrationId || '').toLowerCase().includes(q);
        const matchesTest = (att.testTitle || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesReg && !matchesTest) return false;
      }

      return true;
    });
  }, [attempts, tests, selectedTestId, selectedDate, selectedLanguage, selectedBlock, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const summaryStats = useMemo(() => {
    const totalAppeared = filteredAttempts.length;
    if (totalAppeared === 0) {
      return {
        totalAppeared: 0,
        totalQualified: 0,
        qualifiedPercentage: 0,
        avgNetWpm: 0,
        avgAccuracy: 0,
        highestNetWpm: 0,
      };
    }

    const qualifiedCount = filteredAttempts.filter((a) => a.status === 'QUALIFIED').length;
    const totalNetWpm = filteredAttempts.reduce((acc, a) => acc + (a.netWpm || 0), 0);
    const totalAcc = filteredAttempts.reduce((acc, a) => acc + (a.accuracyPercentage || 0), 0);
    const highestSpeed = Math.max(...filteredAttempts.map((a) => a.netWpm || 0));

    return {
      totalAppeared,
      totalQualified: qualifiedCount,
      qualifiedPercentage: Math.round((qualifiedCount / totalAppeared) * 100),
      avgNetWpm: Math.round((totalNetWpm / totalAppeared) * 10) / 10,
      avgAccuracy: Math.round((totalAcc / totalAppeared) * 10) / 10,
      highestNetWpm: highestSpeed,
    };
  }, [filteredAttempts]);

  // Determine current exam date for heading
  const currentExamDateFormatted = useMemo(() => {
    if (selectedDate) {
      try {
        const [year, month, day] = selectedDate.split('-').map(Number);
        if (year && month && day) {
          return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        }
      } catch {}
    }
    if (filteredAttempts.length > 0 && filteredAttempts[0].submittedAt) {
      return new Date(filteredAttempts[0].submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate, filteredAttempts]);

  const handleExportCSV = () => {
    const activeTest = tests.find((t) => t.id === selectedTestId);
    exportTypingReportToCSV(filteredAttempts, activeTest ? activeTest.title : 'All_Typing_Assessments');
  };

  const handleDownloadMeritReport = () => {
    const activeTest = tests.find((t) => t.id === selectedTestId);
    downloadTypingMeritReportPdf({
      attempts: filteredAttempts,
      testTitle: activeTest ? activeTest.title : 'Typing Speed Assessment Merit List',
      examDateStr: currentExamDateFormatted,
      filterBlock: selectedBlock !== 'ALL' ? selectedBlock : undefined,
      filterLanguage: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
    });
  };

  const handleDownloadSingleScorecard = (attempt: TypingAttempt) => {
    const foundTest = tests.find((t) => t.id === attempt.typingTestId);
    downloadCandidateTypingScorecardPdf(attempt, attempt.referencePassage || foundTest?.passageText);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          {/* Report Heading with Exam Date */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Typing Test Evaluation & Merit Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>Exam Date: {currentExamDateFormatted}</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Candidate speed performance audit, accuracy breakdown, and qualifying merit list.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredAttempts.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            title="Export Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Download Report Button (Replacing Print button) */}
          <button
            onClick={handleDownloadMeritReport}
            disabled={filteredAttempts.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            title="Download Official PDF Report"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
            Total Submissions
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {summaryStats.totalAppeared}
          </span>
          <span className="text-[10px] text-slate-400">Evaluated attempts</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
          <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Qualified
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {summaryStats.totalQualified}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {summaryStats.qualifiedPercentage}% Pass Rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 shadow-2xs">
          <span className="block text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
            Avg Net Speed
          </span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
            {summaryStats.avgNetWpm} <span className="text-xs">WPM</span>
          </span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400">Net words/min</span>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 shadow-2xs">
          <span className="block text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
            Highest Net Speed
          </span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {summaryStats.highestNetWpm} <span className="text-xs">WPM</span>
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400">Top candidate record</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 shadow-2xs">
          <span className="block text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Avg Accuracy
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {summaryStats.avgAccuracy}%
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Word precision</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
            Active Tests
          </span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">
            {tests.length}
          </span>
          <span className="text-[10px] text-slate-400">English & Hindi</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>Evaluation Filters & Search</span>
          </div>

          {(selectedDate || selectedTestId !== 'ALL' || selectedLanguage !== 'ALL' || selectedStatus !== 'ALL' || searchQuery.trim()) && (
            <div className="flex items-center gap-2 normal-case font-normal">
              {selectedDate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  <span>Date: {selectedDate}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    title="Clear date filter"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedTestId('ALL');
                  setSelectedLanguage('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, email, roll no..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Test Selector */}
          <div>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">All Test Papers</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Date of Typing Test */}
          <div className="relative">
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                title="Filter by Date of Typing Test"
                aria-label="Filter by Date of Typing Test"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  title="Clear Date Filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Language / Medium */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">All Mediums (Hindi & English)</option>
              <option value="ENGLISH">English Typing Only</option>
              <option value="HINDI_DEVLYS_010">Hindi (DevLys 010) Only</option>
            </select>
          </div>

          {/* Result Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="ALL">All Results (Pass & Fail)</option>
              <option value="QUALIFIED">Qualified Only</option>
              <option value="DISQUALIFIED">Disqualified Only</option>
            </select>
          </div>
        </div>

        {/* Quick Exam Date Pills (if available) */}
        {distinctExamDates.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1 mr-0.5">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>Exam Dates:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                !selectedDate
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Dates
            </button>
            {distinctExamDates.map((d) => {
              const isSelected = selectedDate === d;
              let label = d;
              try {
                const [y, m, day] = d.split('-').map(Number);
                label = new Date(y, m - 1, day).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
              } catch {}
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? '' : d)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate Submissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Header Details with Exam Date Banner */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Candidate Speed Audit & Official Breakdown ({filteredAttempts.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Exam Date: {currentExamDateFormatted}
          </span>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <BarChart3 className="w-10 h-10 mx-auto text-slate-400" />
            <p className="text-sm font-bold">No typing test attempts match the selected criteria</p>
            <p className="text-xs text-slate-400">
              Try changing the filter options or search for a different candidate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Roll / Candidate</th>
                  <th className="px-3 py-3">Medium</th>
                  <th className="px-3 py-3">Exam Date</th>
                  <th className="px-3 py-3 text-center">Total Words</th>
                  <th className="px-3 py-3 text-center text-emerald-600">Correct</th>
                  <th className="px-3 py-3 text-center text-rose-600">Incorrect</th>
                  <th className="px-3 py-3 text-center text-amber-600">Skipped</th>
                  <th className="px-3 py-3 text-center">Net WPM</th>
                  <th className="px-3 py-3 text-center">Accuracy</th>
                  <th className="px-3 py-3 text-center">Result</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAttempts.map((attempt) => {
                  const isHindi = attempt.language === 'HINDI_DEVLYS_010';
                  const isQualified = attempt.status === 'QUALIFIED';
                  const dateDisplay = attempt.submittedAt
                    ? new Date(attempt.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : currentExamDateFormatted;

                  return (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Candidate Column */}
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {attempt.candidateName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {attempt.registrationId || attempt.candidateId} • {attempt.block}
                        </div>
                      </td>

                      {/* Medium Column */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            isHindi
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                          }`}
                        >
                          {isHindi ? 'हिन्दी' : 'English'}
                        </span>
                      </td>

                      {/* Exam Date Column */}
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-medium">
                        {dateDisplay}
                      </td>

                      {/* Total Words */}
                      <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {attempt.totalWordsInPara || 0}
                      </td>

                      {/* Correct Words */}
                      <td className="px-3 py-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                        {attempt.correctWordsCount || 0}
                      </td>

                      {/* Incorrect Words */}
                      <td className="px-3 py-3 text-center font-black text-rose-600 dark:text-rose-400">
                        {attempt.incorrectWordsCount || 0}
                      </td>

                      {/* Skipped Words */}
                      <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {attempt.skippedWordsCount ?? attempt.untypedWordsCount ?? 0}
                      </td>

                      {/* Net WPM */}
                      <td className="px-3 py-3 text-center font-black text-sm text-slate-900 dark:text-white">
                        {attempt.netWpm || 0}{' '}
                        <span className="text-[10px] font-normal text-slate-400">WPM</span>
                      </td>

                      {/* Accuracy */}
                      <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {attempt.accuracyPercentage || 0}%
                      </td>

                      {/* Result */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isQualified
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isQualified ? 'QUALIFIED' : 'DISQUALIFIED'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {deletingAttemptId === attempt.id ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Delete?</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteAttempt) onDeleteAttempt(attempt.id);
                                setDeletingAttemptId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingAttemptId(null)}
                              className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                if (onViewScorecard) {
                                  onViewScorecard(attempt);
                                } else {
                                  setViewingAttempt(attempt);
                                }
                              }}
                              title="View Detailed Performance Scorecard"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDownloadSingleScorecard(attempt)}
                              title="Download Candidate Official Scorecard PDF"
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>

                            {onDeleteAttempt && (
                              <button
                                onClick={() => setDeletingAttemptId(attempt.id)}
                                title="Delete Submission"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Modal if triggered locally */}
      {viewingAttempt && (
        <TypingResultModal
          isOpen={!!viewingAttempt}
          onClose={() => setViewingAttempt(null)}
          attempt={viewingAttempt}
          referencePassage={
            viewingAttempt.referencePassage ||
            tests.find((t) => t.id === viewingAttempt.typingTestId)?.passageText
          }
        />
      )}
    </div>
  );
};
