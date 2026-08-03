import React, { useState } from 'react';
import { TestPaper, TestAttempt, Candidate } from '../types';
import { BookOpen, Key, Copy, Check, Users, UserCheck, BarChart3, Edit3, Trash2, Download, Search, Filter } from 'lucide-react';
import { TestSummaryReportModal } from './TestSummaryReportModal';
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
    setModalAssignSuccessMsg(
      modalAssignScope === 'SELECTED'
        ? `Test paper assigned to ${modalAssignSelectedIds.length} candidate(s)! Emails dispatched.`
        : 'Test paper assigned to all candidates in block! Emails dispatched.'
    );

    setTimeout(() => {
      setAssigningTest(null);
    }, 1800);
  };

  const filteredTests = tests.filter((t) => {
    const matchesBlock = selectedBlockFilter === 'ALL' || t.targetBlock === selectedBlockFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.targetBlock.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.accessCode && t.accessCode.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBlock && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            District Evaluation Library & Reports
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Published Test Papers & Reports</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Access, manage, and download comprehensive PDF summary reports for all published district assessment papers.
          </p>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          <BookOpen className="w-4 h-4" />
          <span>+ Create New Test Paper</span>
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search test papers by title, subject, block, or access code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={selectedBlockFilter}
            onChange={(e) => setSelectedBlockFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All District Blocks</option>
            <option value="District-Wide">District-Wide</option>
            <option value="Nathdwara">Nathdwara</option>
            <option value="Kumbhalgarh">Kumbhalgarh</option>
            <option value="Bhim">Bhim</option>
            <option value="Rajsamand">Rajsamand</option>
            <option value="Amet">Amet</option>
            <option value="Deogarh">Deogarh</option>
            <option value="Railmagra">Railmagra</option>
          </select>
        </div>
      </div>

      {/* Test Papers Cards List */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const testAttempts = attempts.filter((a) => a.testId === test.id);
            const totalSubmissions = testAttempts.length;
            const passedCount = testAttempts.filter((a) => a.status === 'PASSED').length;
            const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
            const isDeleting = deletingTestId === test.id;

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
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {test.targetBlock}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">{test.title}</h3>

                  {/* Access Code */}
                  <div className="flex items-center justify-between mt-2.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                    <div className="flex items-center gap-1.5 font-mono font-extrabold">
                      <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Code: {test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const codeToCopy = test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`;
                        navigator.clipboard.writeText(codeToCopy);
                        setCopiedCodeTestId(test.id);
                        setTimeout(() => setCopiedCodeTestId(null), 2000);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold text-[10px] transition-all flex items-center gap-1"
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
                          : `Open to All (${test.targetBlock})`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(test)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 font-extrabold text-[10px] transition-all flex items-center gap-1"
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
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1"
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
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
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
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Summary Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => generateAndDownloadTestPaperSummaryPdf({ test, attempts, candidates })}
                        className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
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
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
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
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-800"
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
          attempts={attempts}
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
                    Open to All ({assigningTest.targetBlock})
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
    </div>
  );
};
