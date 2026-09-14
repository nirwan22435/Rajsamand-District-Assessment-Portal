import React, { useState, useMemo } from 'react';
import { TestPaper, TestAttempt, Candidate } from '../types';
import { BookOpen, Key, Copy, Check, Users, UserCheck, BarChart3, Edit3, Trash2, Download, Search, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { TestSummaryReportModal } from './TestSummaryReportModal';
import { PublishSuccessModal } from './PublishSuccessModal';
import { generateAndDownloadTestPaperSummaryPdf } from '../utils/pdfGenerator';
import { sendEmailAPI } from '../services/api';

interface PublishedTestPapersViewProps {
  tests: TestPaper[];
  attempts: TestAttempt[];
  candidates: Candidate[];
  onNavigateToUpload: () => void;
  onEditTest?: (test: TestPaper) => void;
  onDeleteTest?: (testId: string) => void;
}

export const PublishedTestPapersView: React.FC<PublishedTestPapersViewProps> = ({
  tests,
  attempts,
  candidates,
  onNavigateToUpload,
  onEditTest,
  onDeleteTest,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');
  const [copiedCodeTestId, setCopiedCodeTestId] = useState<string | null>(null);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
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
    setModalAssignSelectedIds(isSpecific ? testPaper.assignedCandidateIds! : []);
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
      newlyAssigned = candidates.filter((c) => c.activeStatus && modalAssignSelectedIds.includes(c.id));
    } else {
      newlyAssigned = candidates.filter((c) => c.activeStatus);
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

  const validCandidateIds = useMemo(() => new Set(candidates.map((c) => c.id)), [candidates]);
  const validCandidateEmails = useMemo(() => new Set(candidates.map((c) => c.email?.toLowerCase().trim())), [candidates]);
  const validAttempts = useMemo(
    () =>
      attempts.filter(
        (a) =>
          (a.candidateId && validCandidateIds.has(a.candidateId)) ||
          (a.candidateEmail && validCandidateEmails.has(a.candidateEmail.toLowerCase().trim()))
      ),
    [attempts, validCandidateIds, validCandidateEmails]
  );

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.accessCode && t.accessCode.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/20 border border-blue-400/35 flex items-center justify-center text-blue-300 shadow-lg shadow-blue-950/40 shrink-0">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Published Test Papers & Reports</h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Access, manage, and download evaluation summary reports for all published assessment papers.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>+ Create New Test Paper</span>
        </button>
      </div>

      {/* Filters & View Mode Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            id="published-tests-search-input"
            type="text"
            placeholder="Search test papers by title, subject, or access code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            {filteredTests.length} {filteredTests.length === 1 ? 'Test Paper' : 'Test Papers'}
          </span>

          {/* View Mode Toggle: List (Default) vs Grid */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              id="published-tests-view-list-btn"
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List View (Default)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              id="published-tests-view-grid-btn"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Papers Display */}
      {filteredTests.length > 0 ? (
        viewMode === 'list' ? (
          /* List View (Default) */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[860px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Assessment Paper</th>
                    <th className="px-4 py-3.5">Target Audience</th>
                    <th className="px-4 py-3.5 text-center">Questions & Duration</th>
                    <th className="px-4 py-3.5 text-center">Submissions</th>
                    <th className="px-4 py-3.5 text-center">Pass Rate</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredTests.map((test) => {
                    const testAttempts = validAttempts.filter((a) => a.testId === test.id);
                    const totalSubmissions = testAttempts.length;
                    const passedCount = testAttempts.filter((a) => a.status === 'PASSED').length;
                    const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
                    const isDeleting = deletingTestId === test.id;
                    const isTargeted =
                      test.assignedCandidateIds &&
                      test.assignedCandidateIds.length > 0 &&
                      !test.assignedCandidateIds.includes('ALL');

                    if (isDeleting) {
                      return (
                        <tr key={test.id} className="bg-rose-50/80 dark:bg-rose-950/40">
                          <td colSpan={6} className="px-5 py-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
                                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>
                                  Permanently delete <span className="underline">{test.title}</span>? All questions will be removed.
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onDeleteTest) onDeleteTest(test.id);
                                    setDeletingTestId(null);
                                  }}
                                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingTestId(null)}
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const accessCode = test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`;

                    return (
                      <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Assessment Paper */}
                        <td className="px-5 py-4 min-w-[260px] max-w-[420px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                {test.subject}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white break-words leading-snug">
                              {test.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="inline-flex items-center gap-1.5 font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
                                <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Code: {accessCode}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(accessCode);
                                  setCopiedCodeTestId(test.id);
                                  setTimeout(() => setCopiedCodeTestId(null), 2000);
                                }}
                                className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Copy Access Code"
                              >
                                {copiedCodeTestId === test.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Target Audience */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>
                                {isTargeted
                                  ? `Targeted: ${test.assignedCandidateIds!.length} Candidate${test.assignedCandidateIds!.length === 1 ? '' : 's'}`
                                  : 'Open to All Candidates'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(test)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Assign candidates to this test"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          </div>
                        </td>

                        {/* Questions & Duration */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {test.questions.length} MCQs
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {test.totalMarks} Marks • {test.timeLimitMinutes} min
                          </div>
                        </td>

                        {/* Submissions */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {totalSubmissions}
                          </span>
                          <span className="text-[10px] text-slate-400 block">attempts</span>
                        </td>

                        {/* Pass Rate */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full font-extrabold text-xs ${
                              passRate >= 70
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : passRate >= 40
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : totalSubmissions === 0
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {passRate}%
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setReportTest(test)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="View Summary Report"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>Report</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => generateAndDownloadTestPaperSummaryPdf({ test, attempts, candidates })}
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Download PDF Summary Report"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            {onEditTest && (
                              <button
                                type="button"
                                onClick={() => onEditTest(test)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Edit Test Paper"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {onDeleteTest && (
                              <button
                                type="button"
                                onClick={() => setDeletingTestId(test.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Remove Test Paper"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTests.map((test) => {
              const testAttempts = validAttempts.filter((a) => a.testId === test.id);
              const totalSubmissions = testAttempts.length;
              const passedCount = testAttempts.filter((a) => a.status === 'PASSED').length;
              const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
              const isDeleting = deletingTestId === test.id;
              const accessCode = test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`;

              return (
                <div
                  key={test.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {test.subject}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white break-words leading-snug">{test.title}</h3>

                    {/* Access Code */}
                    <div className="flex items-center justify-between mt-2.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                      <div className="flex items-center gap-1.5 font-mono font-extrabold">
                        <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Code: {accessCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(accessCode);
                          setCopiedCodeTestId(test.id);
                          setTimeout(() => setCopiedCodeTestId(null), 2000);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodeTestId === test.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Candidate Assignment Badge */}
                    <div className="flex items-center justify-between mt-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {test.assignedCandidateIds && test.assignedCandidateIds.length > 0 && !test.assignedCandidateIds.includes('ALL')
                            ? `Targeted: ${test.assignedCandidateIds.length} Candidate(s)`
                            : `Open to All Candidates`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(test)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 font-extrabold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>

                    {/* Metrics Box */}
                    <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-center">
                      <div>
                        <span className="text-slate-400 block">Questions</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{test.questions.length} MCQs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Submissions</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{totalSubmissions}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Pass Rate</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{passRate}%</span>
                      </div>
                    </div>
                  </div>

                  {isDeleting ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 space-y-2">
                      <p className="text-[11px] font-extrabold text-rose-800 dark:text-rose-200 text-center">
                        Permanently delete test paper?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onDeleteTest) onDeleteTest(test.id);
                            setDeletingTestId(null);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setDeletingTestId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReportTest(test)}
                          className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>View Summary Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => generateAndDownloadTestPaperSummaryPdf({ test, attempts, candidates })}
                          className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Download Test Summary Report PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {onEditTest && (
                          <button
                            type="button"
                            onClick={() => onEditTest(test)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Paper</span>
                          </button>
                        )}

                        {onDeleteTest && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setDeletingTestId(test.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-800 cursor-pointer"
                            title="Remove Test Paper"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-xs space-y-3 bg-white dark:bg-slate-900">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No published test papers found.</p>
          <p className="text-slate-400">Upload or generate new question papers using the assessment creator tool.</p>
          <button
            onClick={onNavigateToUpload}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition-all inline-flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>+ Create New Test Paper</span>
          </button>
        </div>
      )}

      {/* Test Summary Modal */}
      {reportTest && (
        <TestSummaryReportModal
          test={reportTest}
          attempts={attempts.filter((a) => {
            const validCandidateIds = new Set(candidates.map((c) => c.id));
            const validCandidateEmails = new Set(candidates.map((c) => c.email?.toLowerCase().trim()));
            return (
              (a.candidateId && validCandidateIds.has(a.candidateId)) ||
              (a.candidateEmail && validCandidateEmails.has(a.candidateEmail.toLowerCase().trim()))
            );
          })}
          candidates={candidates}
          onClose={() => setReportTest(null)}
          onEditTest={onEditTest}
        />
      )}

      {/* Quick Candidate Assignment Modal */}
      {assigningTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Assign Test to Candidates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                  {assigningTest.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTest(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalAssignSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center">
                {modalAssignSuccessMsg}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setModalAssignScope('ALL')}
                    className={`py-2 rounded-lg transition-all ${
                      modalAssignScope === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Open to All Candidates
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAssignScope('SELECTED')}
                    className={`py-2 rounded-lg transition-all ${
                      modalAssignScope === 'SELECTED'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Select Specific Candidates ({modalAssignSelectedIds.length})
                  </button>
                </div>

                {modalAssignScope === 'SELECTED' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search candidates by name or registration ID..."
                      value={modalAssignSearchTerm}
                      onChange={(e) => setModalAssignSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                    />

                    <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                      {candidates
                        .filter(
                          (c) =>
                            c.activeStatus &&
                            (c.name.toLowerCase().includes(modalAssignSearchTerm.toLowerCase()) ||
                              c.registrationId.toLowerCase().includes(modalAssignSearchTerm.toLowerCase()))
                        )
                        .map((c) => {
                          const isSelected = modalAssignSelectedIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setModalAssignSelectedIds([...modalAssignSelectedIds, c.id]);
                                    } else {
                                      setModalAssignSelectedIds(modalAssignSelectedIds.filter((id) => id !== c.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">({c.registrationId})</span>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {c.block}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAssigningTest(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDispatchingAssign}
                    onClick={handleSaveModalAssignment}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
                  >
                    {isDispatchingAssign ? 'Dispatching Notifications...' : 'Save & Notify Candidates'}
                  </button>
                </div>
              </div>
            )}
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
