import React, { useState, useMemo } from 'react';
import { TypingTest, TypingAttempt, Candidate, DistrictBlock } from '../../types';
import { isCandidateRegisteredForTyping } from '../../utils/candidateUtils';
import { downloadCandidateTypingScorecardPdf } from '../../utils/pdfGenerator';
import { formatISTDateTime } from '../../utils/dateTimeUtils';
import {
  X,
  Search,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Filter,
  Eye,
  FileDown,
  Building2,
  TrendingUp,
  AlertCircle,
  Printer,
} from 'lucide-react';

export interface TypingTestCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ASSIGNED' | 'SUBMISSION';
  test: TypingTest;
  candidates: Candidate[];
  attempts: TypingAttempt[];
  onViewScorecard?: (attempt: TypingAttempt) => void;
}

export const TypingTestCandidatesModal: React.FC<TypingTestCandidatesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'ASSIGNED',
  test,
  candidates,
  attempts,
  onViewScorecard,
}) => {
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'SUBMISSION'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED'>('ALL');
  const [blockFilter, setBlockFilter] = useState<string>('ALL');

  // Reset tab if initialTab changes when opening
  React.useEffect(() => {
    setActiveTab(initialTab);
    setSearchQuery('');
    setStatusFilter('ALL');
    setBlockFilter('ALL');
  }, [initialTab, test.id]);

  if (!isOpen) return null;

  const isHindi = test.language === 'HINDI_DEVLYS_010';

  // 1. Calculate All Assigned Candidates for this specific test
  const assignedCandidates = useMemo(() => {
    const isUnassigned =
      test.assignedCandidateIds?.includes('__UNASSIGNED__') ||
      test.assignedCandidateIds?.includes('__NONE__') ||
      test.assignedCandidateIds?.length === 0;

    if (isUnassigned) {
      return [];
    }

    if (
      test.assignedCandidateIds &&
      test.assignedCandidateIds.length > 0 &&
      !test.assignedCandidateIds.includes('ALL')
    ) {
      const validIds = new Set(
        test.assignedCandidateIds.filter(
          (id) => id !== '__UNASSIGNED__' && id !== '__NONE__' && id !== 'ALL'
        )
      );
      return candidates.filter(
        (c) =>
          c.activeStatus !== false &&
          (validIds.has(c.id) || (c.registrationId && validIds.has(c.registrationId)))
      );
    }

    // Assigned to all eligible candidates for this typing paper
    const eligible = candidates.filter((c) => {
      if (c.activeStatus === false) return false;
      if (!isCandidateRegisteredForTyping(c)) return false;
      if (c.typingMedium && c.typingMedium !== test.language) return false;
      return true;
    });

    if (eligible.length > 0) return eligible;
    return candidates.filter((c) => c.activeStatus !== false);
  }, [test, candidates]);

  // 2. All Submissions for this specific typing test
  const testSubmissions = useMemo(() => {
    return attempts
      .filter((a) => a.typingTestId === test.id)
      .sort((a, b) => (b.netWpm || 0) - (a.netWpm || 0));
  }, [attempts, test.id]);

  // Map candidate IDs and emails to their submission attempt
  const submissionMap = useMemo(() => {
    const map = new Map<string, TypingAttempt>();
    testSubmissions.forEach((att) => {
      if (att.candidateId) {
        map.set(att.candidateId, att);
      }
      if (att.candidateEmail) {
        map.set(att.candidateEmail.toLowerCase().trim(), att);
      }
    });
    return map;
  }, [testSubmissions]);

  // Combined assigned candidate records with submission status
  const assignedRecords = useMemo(() => {
    return assignedCandidates.map((cand) => {
      const attempt =
        submissionMap.get(cand.id) ||
        (cand.email ? submissionMap.get(cand.email.toLowerCase().trim()) : undefined);

      return {
        candidate: cand,
        hasSubmitted: !!attempt,
        attempt,
      };
    });
  }, [assignedCandidates, submissionMap]);

  // Statistical calculations
  const totalAssigned = assignedCandidates.length;
  const totalSubmissions = testSubmissions.length;
  const totalAppeared = assignedRecords.filter((r) => r.hasSubmitted).length || totalSubmissions;
  const turnoutRate = totalAssigned > 0 ? Math.round((totalAppeared / totalAssigned) * 100) : (totalSubmissions > 0 ? 100 : 0);
  const pendingCount = Math.max(0, totalAssigned - totalAppeared);

  const qualifiedSubmissions = testSubmissions.filter((a) => a.status === 'QUALIFIED');
  const disqualifiedSubmissions = testSubmissions.filter((a) => a.status === 'DISQUALIFIED');
  const qualifiedCount = qualifiedSubmissions.length;
  const passRate = totalSubmissions > 0 ? Math.round((qualifiedCount / totalSubmissions) * 100) : 0;
  const avgNetWpm = totalSubmissions > 0 ? Math.round((testSubmissions.reduce((acc, a) => acc + (a.netWpm || 0), 0) / totalSubmissions) * 10) / 10 : 0;
  const highestNetWpm = totalSubmissions > 0 ? Math.max(...testSubmissions.map((a) => a.netWpm || 0)) : 0;

  // Filtered Assigned Records
  const filteredAssignedRecords = useMemo(() => {
    return assignedRecords.filter(({ candidate, hasSubmitted, attempt }) => {
      if (blockFilter !== 'ALL' && candidate.block !== blockFilter) return false;

      if (statusFilter === 'SUBMITTED' && !hasSubmitted) return false;
      if (statusFilter === 'PENDING' && hasSubmitted) return false;
      if (statusFilter === 'QUALIFIED' && (!attempt || attempt.status !== 'QUALIFIED')) return false;
      if (statusFilter === 'DISQUALIFIED' && (!attempt || attempt.status !== 'DISQUALIFIED')) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = candidate.name.toLowerCase().includes(query);
        const regMatch = candidate.registrationId?.toLowerCase().includes(query);
        const emailMatch = candidate.email.toLowerCase().includes(query);
        const blockMatch = candidate.block?.toLowerCase().includes(query);
        return nameMatch || regMatch || emailMatch || blockMatch;
      }

      return true;
    });
  }, [assignedRecords, searchQuery, statusFilter, blockFilter]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return testSubmissions.filter((att) => {
      if (blockFilter !== 'ALL' && att.block !== blockFilter) return false;

      if (statusFilter === 'QUALIFIED' && att.status !== 'QUALIFIED') return false;
      if (statusFilter === 'DISQUALIFIED' && att.status !== 'DISQUALIFIED') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = att.candidateName?.toLowerCase().includes(query);
        const regMatch = att.registrationId?.toLowerCase().includes(query);
        const emailMatch = att.candidateEmail?.toLowerCase().includes(query);
        const blockMatch = att.block?.toLowerCase().includes(query);
        return nameMatch || regMatch || emailMatch || blockMatch;
      }

      return true;
    });
  }, [testSubmissions, searchQuery, statusFilter, blockFilter]);

  // Distinct blocks for filtering
  const distinctBlocks = useMemo(() => {
    const blocks = new Set<string>();
    assignedCandidates.forEach((c) => {
      if (c.block) blocks.add(c.block);
    });
    testSubmissions.forEach((a) => {
      if (a.block) blocks.add(a.block);
    });
    return Array.from(blocks).sort();
  }, [assignedCandidates, testSubmissions]);

  // Export to CSV
  const handleExportCSV = () => {
    const cleanTitle = test.title.replace(/[^a-zA-Z0-9]/g, '_');
    if (activeTab === 'ASSIGNED') {
      const headers = ['S.No', 'Candidate Name', 'Registration ID', 'Email', 'District Block', 'Medium', 'Submission Status', 'Result', 'Net WPM', 'Gross WPM', 'Accuracy %', 'Submitted At (IST)'];
      const rows = filteredAssignedRecords.map(({ candidate, hasSubmitted, attempt }, idx) => [
        idx + 1,
        `"${candidate.name.replace(/"/g, '""')}"`,
        `"${candidate.registrationId || 'N/A'}"`,
        `"${candidate.email}"`,
        `"${candidate.block || 'Rajsamand'}"`,
        `"${candidate.typingMedium || test.language}"`,
        hasSubmitted ? 'SUBMITTED' : 'PENDING',
        attempt ? attempt.status : 'NOT_ATTEMPTED',
        attempt?.netWpm ?? 'N/A',
        attempt?.grossWpm ?? 'N/A',
        attempt ? `${attempt.accuracyPercentage}%` : 'N/A',
        attempt?.submittedAt ? `"${formatISTDateTime(attempt.submittedAt)}"` : 'N/A',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Assigned_Candidates_${cleanTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Rank', 'Candidate Name', 'Registration ID', 'Email', 'District Block', 'Language', 'Gross WPM', 'Net WPM', 'Accuracy %', 'Correct Words', 'Incorrect Words', 'Result Status', 'Submitted At (IST)'];
      const rows = filteredSubmissions.map((att, idx) => [
        idx + 1,
        `"${(att.candidateName || 'Candidate').replace(/"/g, '""')}"`,
        `"${att.registrationId || 'N/A'}"`,
        `"${att.candidateEmail || 'N/A'}"`,
        `"${att.block || 'Rajsamand'}"`,
        `"${att.language}"`,
        att.grossWpm || 0,
        att.netWpm || 0,
        `${att.accuracyPercentage || 0}%`,
        att.correctWordsCount || 0,
        att.incorrectWordsCount || 0,
        att.status,
        att.submittedAt ? `"${formatISTDateTime(att.submittedAt)}"` : 'N/A',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Submissions_Merit_${cleanTitle}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0">
            <div
              className={`p-2.5 rounded-2xl text-white shadow-xs shrink-0 ${
                activeTab === 'ASSIGNED'
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              }`}
            >
              {activeTab === 'ASSIGNED' ? <Users className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isHindi
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  {isHindi ? 'DevLys 010 (Hindi)' : 'English Typing'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {test.durationMinutes} Mins • Passing: ≥{test.minPassingWpm} WPM
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mt-1" title={test.title}>
                {test.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'ASSIGNED'
                  ? `Detailed audit of all candidates assigned to this typing test paper (${totalAssigned} assigned)`
                  : `Evaluation breakdown of all candidate submissions (${totalSubmissions} attempts)`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ASSIGNED');
                setStatusFilter('ALL');
              }}
              className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ASSIGNED'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assigned Candidates</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                {totalAssigned}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SUBMISSION');
                setStatusFilter('ALL');
              }}
              className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SUBMISSION'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Submitted Candidates</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                {totalSubmissions}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Export Current List to CSV"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="p-3 sm:p-4 bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-center">
          {activeTab === 'ASSIGNED' ? (
            <>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
                <span className="block text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">Total Assigned</span>
                <span className="text-lg font-black text-amber-900 dark:text-amber-200">{totalAssigned}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
                <span className="block text-[9px] font-black uppercase text-blue-700 dark:text-blue-400">Submitted</span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-200">{totalAppeared} ({turnoutRate}%)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="block text-[9px] font-black uppercase text-slate-500">Pending</span>
                <span className="text-lg font-black text-slate-700 dark:text-slate-300">{pendingCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="block text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">Qualified</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{qualifiedCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 col-span-2 sm:col-span-1">
                <span className="block text-[9px] font-black uppercase text-purple-700 dark:text-purple-400">Top Speed</span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400">{highestNetWpm} <span className="text-xs">WPM</span></span>
              </div>
            </>
          ) : (
            <>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
                <span className="block text-[9px] font-black uppercase text-blue-700 dark:text-blue-400">Total Submissions</span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-200">{totalSubmissions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="block text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">Qualified</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{qualifiedCount} ({passRate}%)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60">
                <span className="block text-[9px] font-black uppercase text-rose-700 dark:text-rose-400">Disqualified</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{disqualifiedSubmissions.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60">
                <span className="block text-[9px] font-black uppercase text-sky-700 dark:text-sky-400">Average Net Speed</span>
                <span className="text-lg font-black text-sky-600 dark:text-sky-400">{avgNetWpm} <span className="text-xs">WPM</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 col-span-2 sm:col-span-1">
                <span className="block text-[9px] font-black uppercase text-purple-700 dark:text-purple-400">Top Speed</span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400">{highestNetWpm} <span className="text-xs">WPM</span></span>
              </div>
            </>
          )}
        </div>

        {/* Toolbar: Search, Status Filter, Block Selector */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll no / registration ID, email, block..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Toggle Chips */}
            {activeTab === 'ASSIGNED' ? (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  All ({totalAssigned})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SUBMITTED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'SUBMITTED'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Submitted ({totalAppeared})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('QUALIFIED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'QUALIFIED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Qualified ({qualifiedCount})
                </button>
              </div>
            ) : (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  All ({totalSubmissions})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('QUALIFIED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'QUALIFIED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Qualified ({qualifiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('DISQUALIFIED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'DISQUALIFIED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Disqualified ({disqualifiedSubmissions.length})
                </button>
              </div>
            )}

            {/* Block Filter */}
            {distinctBlocks.length > 1 && (
              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Blocks</option>
                {distinctBlocks.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="sm:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Export CSV"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Data Table Container */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'ASSIGNED' ? (
            /* Assigned Candidates Table */
            filteredAssignedRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No assigned candidates found</p>
                <p className="text-xs text-slate-400">Try changing your search query or filter selection.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3.5 text-center w-12">#</th>
                    <th className="py-3 px-4">Candidate Information</th>
                    <th className="py-3 px-4">District Block</th>
                    <th className="py-3 px-4">Typing Medium</th>
                    <th className="py-3 px-4 text-center">Submission Status</th>
                    <th className="py-3 px-4 text-center">Speed & Result</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredAssignedRecords.map(({ candidate, hasSubmitted, attempt }, idx) => {
                    const initials = candidate.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr
                        key={candidate.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/60">
                              {initials || 'C'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                {candidate.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                                  {candidate.registrationId || 'NO-REG-ID'}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                  {candidate.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{candidate.block || 'Rajsamand'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              candidate.typingMedium === 'HINDI_DEVLYS_010' || test.language === 'HINDI_DEVLYS_010'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                            }`}
                          >
                            {candidate.typingMedium === 'HINDI_DEVLYS_010' || test.language === 'HINDI_DEVLYS_010'
                              ? 'Hindi (DevLys)'
                              : 'English'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                              <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              SUBMITTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <Clock className="w-3 h-3 text-amber-500" />
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {attempt ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="font-black text-slate-900 dark:text-white">
                                  {attempt.netWpm} WPM
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({attempt.accuracyPercentage}%)
                                </span>
                              </div>
                              <span
                                className={`inline-block text-[10px] font-black uppercase px-2 py-0.2 rounded-full ${
                                  attempt.status === 'QUALIFIED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {attempt.status === 'QUALIFIED' ? 'QUALIFIED ✅' : 'NOT QUALIFIED ❌'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Awaiting submission</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {attempt ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onViewScorecard && onViewScorecard(attempt)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="View candidate scorecard"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Scorecard</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadCandidateTypingScorecardPdf(attempt, test.passageText)}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Download Scorecard PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            /* Submissions Table */
            filteredSubmissions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Award className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No candidate submissions found</p>
                <p className="text-xs text-slate-400">Try changing your search query or filter selection.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3.5 text-center w-12">Rank</th>
                    <th className="py-3 px-4">Candidate Information</th>
                    <th className="py-3 px-4 text-center">Gross WPM</th>
                    <th className="py-3 px-4 text-center">Net WPM</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-center">Mistakes</th>
                    <th className="py-3 px-4 text-center">Result Status</th>
                    <th className="py-3 px-4">Submitted At (IST)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredSubmissions.map((attempt, idx) => {
                    const isQualified = attempt.status === 'QUALIFIED';
                    const initials = (attempt.candidateName || 'Candidate')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr
                        key={attempt.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3.5 text-center font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-900 font-bold'
                                : idx === 2
                                ? 'bg-amber-700/80 text-white font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0 border border-blue-300 dark:border-blue-700/60">
                              {initials || 'C'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                {attempt.candidateName || 'Candidate'}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                                  {attempt.registrationId || 'RJ-CAND'}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                  {attempt.candidateEmail}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">
                          {attempt.grossWpm || 0}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-black text-sm text-slate-900 dark:text-white px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono">
                            {attempt.netWpm || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              (attempt.accuracyPercentage || 0) >= 85
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {attempt.accuracyPercentage || 0}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                          {attempt.incorrectWordsCount || 0} Incorrect
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              isQualified
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {isQualified ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                            {isQualified ? 'QUALIFIED' : 'DISQUALIFIED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {attempt.submittedAt ? formatISTDateTime(attempt.submittedAt) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewScorecard && onViewScorecard(attempt)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="View scorecard"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Scorecard</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadCandidateTypingScorecardPdf(attempt, test.passageText)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Download Scorecard PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Showing{' '}
            <strong className="text-slate-900 dark:text-white">
              {activeTab === 'ASSIGNED' ? filteredAssignedRecords.length : filteredSubmissions.length}
            </strong>{' '}
            of{' '}
            <strong>
              {activeTab === 'ASSIGNED' ? totalAssigned : totalSubmissions}
            </strong>{' '}
            {activeTab === 'ASSIGNED' ? 'assigned candidates' : 'submissions'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {activeTab === 'ASSIGNED' ? 'Assigned List' : 'Merit List'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
