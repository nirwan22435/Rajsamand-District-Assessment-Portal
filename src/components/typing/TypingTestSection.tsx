import React, { useState } from 'react';
import {
  Candidate,
  TypingTest,
  TypingAttempt,
  UserRole,
} from '../../types';
import { AdminTypingReportView } from './AdminTypingReportView';
import { CreateTypingTestModal } from './CreateTypingTestModal';
import { CandidateTypingRunner } from './CandidateTypingRunner';
import { TypingResultModal } from './TypingResultModal';
import { RegisterTypingCandidateModal } from './RegisterTypingCandidateModal';
import { AdminTypingCandidatesView } from './AdminTypingCandidatesView';
import { AssignTypingTestModal } from './AssignTypingTestModal';
import { PassageSanitizerModal } from './PassageSanitizerModal';
import { isCandidateRegisteredForTyping } from '../../utils/candidateUtils';
import {
  Keyboard,
  Plus,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Trash2,
  Edit,
  Eye,
  ArrowRight,
  Globe,
  Sparkles,
  ShieldCheck,
  Building2,
  Play,
  FileText,
  UserPlus,
  Users,
  Briefcase,
  Calendar,
  UserCheck,
  Ban,
  RotateCcw,
  Check,
  AlertTriangle,
  Wand2,
} from 'lucide-react';

interface TypingTestSectionProps {
  role: UserRole;
  activeCandidate?: Candidate;
  candidates?: Candidate[];
  tests: TypingTest[];
  attempts: TypingAttempt[];
  onSaveTest: (test: TypingTest) => Promise<void> | void;
  onDeleteTest: (testId: string) => Promise<void> | void;
  onSaveAttempt: (attempt: TypingAttempt) => Promise<void> | void;
  onDeleteAttempt?: (attemptId: string) => Promise<void> | void;
  onSaveCandidate?: (candidate: Candidate) => Promise<void> | void;
  onDeleteCandidate?: (candidateId: string) => Promise<void> | void;
  onToggleCandidateStatus?: (candidateId: string) => Promise<void> | void;
}

export const TypingTestSection: React.FC<TypingTestSectionProps> = ({
  role,
  activeCandidate,
  candidates = [],
  tests,
  attempts,
  onSaveTest,
  onDeleteTest,
  onSaveAttempt,
  onDeleteAttempt,
  onSaveCandidate,
  onDeleteCandidate,
  onToggleCandidateStatus,
}) => {
  // Admin View Sub-Tab: 'REPORTS' | 'MANAGE_TESTS' | 'TYPING_CANDIDATES'
  const [adminSubTab, setAdminSubTab] = useState<'REPORTS' | 'MANAGE_TESTS' | 'TYPING_CANDIDATES'>('REPORTS');

  // Modals & Runners State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTest, setEditingTest] = useState<TypingTest | null>(null);
  const [assigningTest, setAssigningTest] = useState<TypingTest | null>(null);
  const [sanitizingTest, setSanitizingTest] = useState<TypingTest | null>(null);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);

  // Candidate Registration Modal State
  const [isRegisterCandidateModalOpen, setIsRegisterCandidateModalOpen] = useState<boolean>(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // Active Runner State
  const [activeRunningTest, setActiveRunningTest] = useState<TypingTest | null>(null);
  const [previewTest, setPreviewTest] = useState<TypingTest | null>(null);

  // Completed result modal state
  const [lastFinishedAttempt, setLastFinishedAttempt] = useState<TypingAttempt | null>(null);

  // Candidate submission notification banner state (when performance modal is suppressed)
  const [candidateSubmissionNotice, setCandidateSubmissionNotice] = useState<{
    testTitle: string;
    submittedAt: string;
  } | null>(null);

  // Isolate candidates specifically registered for typing test module.
  const typingCandidates = candidates.filter(isCandidateRegisteredForTyping);

  // Strict check if candidate is registered for typing test module
  const isCandidateRegistered = role === 'ADMIN' || isCandidateRegisteredForTyping(activeCandidate);

  // Filter attempts for candidate
  const candidateAttempts = activeCandidate
    ? attempts.filter((a) => a.candidateId === activeCandidate.id || a.candidateEmail === activeCandidate.email)
    : attempts;

  // Filter available tests for candidate:
  // 1. Must be PUBLISHED (not REVOKED or DRAFT)
  // 2. Must match registered typing medium
  // 3. Must be assigned to this candidate.
  // CRITICAL: If candidate is not registered for typing test, list is strictly empty!
  const candidateTypingMedium = activeCandidate?.typingMedium;
  const candidateFilteredTests = !isCandidateRegistered
    ? []
    : tests.filter((t) => {
    if (t.status !== 'PUBLISHED') return false;
    if (candidateTypingMedium && t.language !== candidateTypingMedium) return false;
    if (activeCandidate) {
      const assigned = t.assignedCandidateIds;
      if (assigned !== undefined) {
        // If assignment was removed or has no assigned candidates, candidate CANNOT see this test!
        if (
          assigned.length === 0 ||
          assigned.includes('__UNASSIGNED__') ||
          assigned.includes('__NONE__')
        ) {
          return false;
        }
        // If candidates are specifically assigned, active candidate must be in the list or assigned to 'ALL'
        if (!assigned.includes('ALL') && !assigned.includes(activeCandidate.id)) {
          return false;
        }
      }
    }
    return true;
  });

  // Handle saving new / updated test
  const handleSaveTest = async (test: TypingTest) => {
    await onSaveTest(test);
    setIsCreateModalOpen(false);
    setEditingTest(null);
  };

  // Handle toggle status / revoke paragraph
  const handleToggleTestStatus = async (test: TypingTest) => {
    const updatedStatus: 'PUBLISHED' | 'REVOKED' = test.status === 'PUBLISHED' ? 'REVOKED' : 'PUBLISHED';
    await onSaveTest({
      ...test,
      status: updatedStatus,
    });
  };

  // Handle saving candidate assignments
  const handleSaveAssignment = async (testId: string, assignedCandidateIds: string[]) => {
    const targetTest = tests.find((t) => t.id === testId);
    if (targetTest) {
      await onSaveTest({
        ...targetTest,
        assignedCandidateIds,
      });
    }
    setAssigningTest(null);
  };

  // Handle candidate finishing test
  const handleFinishTest = async (attempt: TypingAttempt) => {
    await onSaveAttempt(attempt);
    setActiveRunningTest(null);

    // If candidate of typing module, do NOT show performance modal on submit / auto-submit
    if (role === 'CANDIDATE') {
      setLastFinishedAttempt(null);
      setCandidateSubmissionNotice({
        testTitle: attempt.testTitle,
        submittedAt: attempt.submittedAt || new Date().toISOString(),
      });
    } else {
      // In Admin preview mode, administrator can view the evaluated result modal
      setLastFinishedAttempt(attempt);
    }
  };

  // If a test is actively being taken, render the full screen test runner
  if (activeRunningTest) {
    const candidateProfile = activeCandidate || {
      id: 'cand-admin-preview',
      registrationId: 'RJ-ADM-TYP-01',
      name: 'District Administrator (Preview Mode)',
      designation: 'Officer-in-Charge',
      officeName: 'District Collectorate Rajsamand',
      typingMedium: activeRunningTest.language,
      email: 'admin@rajsamand.gov.in',
      phone: '+91 98290 00000',
      block: 'Rajsamand',
      activeStatus: true,
      password: 'pass',
      createdAt: new Date().toISOString(),
    };

    return (
      <CandidateTypingRunner
        test={activeRunningTest}
        candidate={candidateProfile}
        onFinishTest={handleFinishTest}
        onCancel={() => setActiveRunningTest(null)}
      />
    );
  }

  // Strict access guard: candidates not registered for typing test cannot view or access typing test section
  if (role === 'CANDIDATE' && activeCandidate && !isCandidateRegistered) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <Ban className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Typing Assessment Not Registered
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            Your candidate account (<strong>{activeCandidate.registrationId}</strong>) is not enrolled in the Computer Typing Assessment module. Access to typing passages, speed evaluations, and scorecards is restricted to candidates registered for this module.
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Candidate: <strong className="text-slate-800 dark:text-slate-200">{activeCandidate.name}</strong> • Registered Module:{' '}
          <span className="font-bold text-amber-600">{activeCandidate.registeredModule || 'ASSESSMENT ONLY'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Official Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/20 border border-rose-400/35 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-950/40 shrink-0">
            <Keyboard className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Typing Speed Assessment & Evaluation
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              Standardized 10-minute speed evaluation in <strong>English</strong> and{' '}
              <strong>Hindi (DevLys 010)</strong> with gross & net WPM, accuracy %, and official scorecards.
            </p>
          </div>
        </div>

        {role === 'ADMIN' ? (
          <div className="relative z-10 flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
            <button
              onClick={() => {
                setEditingCandidate(null);
                setIsRegisterCandidateModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Candidate</span>
            </button>
            <button
              onClick={() => {
                setEditingTest(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-white font-extrabold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create Test Para</span>
            </button>
          </div>
        ) : (
          /* Candidate Profile Badge in Header */
          activeCandidate && (
            <div className="relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1.5 max-w-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{activeCandidate.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-slate-900">
                  {activeCandidate.typingMedium === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010)' : 'English Medium'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                <Briefcase className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="truncate">
                  {activeCandidate.designation || 'Candidate'} • {activeCandidate.officeName || activeCandidate.block}
                </span>
              </div>
              <div className="text-[10px] text-amber-300 font-mono">
                Roll No: <strong>{activeCandidate.registrationId}</strong>
              </div>
            </div>
          )
        )}
      </div>

      {/* 2. Role-Based Navigation Sub-Tabs */}
      {role === 'ADMIN' ? (
        <div className="space-y-6">
          {/* Admin Navigation Sub-Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 gap-2 sm:gap-2.5 shadow-xs">
              <button
                type="button"
                onClick={() => setAdminSubTab('REPORTS')}
                className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl transition-all duration-200 flex items-center space-x-3 cursor-pointer text-sm sm:text-base font-extrabold select-none ${
                  adminSubTab === 'REPORTS'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02] ring-2 ring-emerald-400/50'
                    : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 hover:scale-[1.01] hover:shadow-sm active:scale-[0.98] border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <BarChart3 className={`w-5 h-5 transition-transform group-hover:scale-110 ${adminSubTab === 'REPORTS' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>Typing Reports</span>
                <span
                  className={`ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-black transition-colors ${
                    adminSubTab === 'REPORTS'
                      ? 'bg-white/25 text-white border border-white/30'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {attempts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminSubTab('TYPING_CANDIDATES')}
                className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl transition-all duration-200 flex items-center space-x-3 cursor-pointer text-sm sm:text-base font-extrabold select-none ${
                  adminSubTab === 'TYPING_CANDIDATES'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02] ring-2 ring-emerald-400/50'
                    : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 hover:scale-[1.01] hover:shadow-sm active:scale-[0.98] border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Users className={`w-5 h-5 transition-transform group-hover:scale-110 ${adminSubTab === 'TYPING_CANDIDATES' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>Registered Candidates</span>
                <span
                  className={`ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-black transition-colors ${
                    adminSubTab === 'TYPING_CANDIDATES'
                      ? 'bg-white/25 text-white border border-white/30'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {candidates.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdminSubTab('MANAGE_TESTS')}
                className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl transition-all duration-200 flex items-center space-x-3 cursor-pointer text-sm sm:text-base font-extrabold select-none ${
                  adminSubTab === 'MANAGE_TESTS'
                    ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02] ring-2 ring-emerald-400/50'
                    : 'bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 hover:scale-[1.01] hover:shadow-sm active:scale-[0.98] border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <BookOpen className={`w-5 h-5 transition-transform group-hover:scale-110 ${adminSubTab === 'MANAGE_TESTS' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>Typing Paragraph</span>
                <span
                  className={`ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-black transition-colors ${
                    adminSubTab === 'MANAGE_TESTS'
                      ? 'bg-white/25 text-white border border-white/30'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {tests.length}
                </span>
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Reports & Analytics */}
          {adminSubTab === 'REPORTS' && (
            <AdminTypingReportView
              attempts={attempts.filter((a) => {
                const validIds = new Set(candidates.filter((c) => c.activeStatus !== false).map((c) => c.id));
                const validEmails = new Set(
                  candidates
                    .filter((c) => c.activeStatus !== false)
                    .map((c) => c.email?.toLowerCase().trim())
                    .filter(Boolean) as string[]
                );
                return (
                  (a.candidateId && validIds.has(a.candidateId)) ||
                  (a.candidateEmail && validEmails.has(a.candidateEmail.toLowerCase().trim()))
                );
              })}
              tests={tests}
              onDeleteAttempt={onDeleteAttempt}
              onViewScorecard={(attempt) => {
                const foundTest = tests.find((t) => t.id === attempt.typingTestId);
                setLastFinishedAttempt(attempt);
                if (foundTest) setPreviewTest(foundTest);
              }}
            />
          )}

          {/* Sub-Tab 2: Typing Candidates Registration & Roll Management */}
          {adminSubTab === 'TYPING_CANDIDATES' && (
            <AdminTypingCandidatesView
              candidates={typingCandidates}
              onOpenRegisterModal={() => {
                setEditingCandidate(null);
                setIsRegisterCandidateModalOpen(true);
              }}
              onEditCandidate={(cand) => {
                setEditingCandidate(cand);
                setIsRegisterCandidateModalOpen(true);
              }}
              onDeleteCandidate={async (id) => {
                if (onDeleteCandidate) await onDeleteCandidate(id);
              }}
              onToggleStatus={async (cand) => {
                if (onToggleCandidateStatus) await onToggleCandidateStatus(cand.id);
              }}
            />
          )}

          {/* Sub-Tab 3: Manage Test Papers (Requirement 3: Edit, Save as Draft, Publish, Delete, Assign) */}
          {adminSubTab === 'MANAGE_TESTS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Created Typing Test Papers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paragraph passages in English and Hindi (DevLys 010) with 10-minute auto finish timer.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTest(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Test</span>
                </button>
              </div>

              {tests.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3">
                  <Keyboard className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold text-sm">No typing tests created yet</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Create First Test Paragraph
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tests.map((test) => {
                    const isHindi = test.language === 'HINDI_DEVLYS_010';
                    const attemptsForThisTest = attempts.filter((a) => a.typingTestId === test.id);
                    const isUnassigned =
                      test.assignedCandidateIds !== undefined &&
                      (test.assignedCandidateIds.length === 0 ||
                        test.assignedCandidateIds.includes('__UNASSIGNED__') ||
                        test.assignedCandidateIds.includes('__NONE__'));
                    const assignedCount = isUnassigned
                      ? 0
                      : test.assignedCandidateIds?.filter(
                          (id) => id !== 'ALL' && id !== '__UNASSIGNED__' && id !== '__NONE__'
                        ).length || 0;
                    const isDeleting = deletingTestId === test.id;
                    const isPublished = test.status === 'PUBLISHED';
                    const isRevoked = test.status === 'REVOKED';

                    return (
                      <div
                        key={test.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isHindi
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                              }`}>
                                {isHindi ? 'Hindi (DevLys 010)' : 'English Typing'}
                              </span>

                              {/* Status Badge with quick toggle */}
                              <button
                                onClick={() => handleToggleTestStatus(test)}
                                title={isPublished ? 'Click to Revoke Paragraph' : 'Click to Publish Paragraph'}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                                  isPublished
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                                    : isRevoked
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {isPublished ? '● Published' : isRevoked ? '✕ Revoked' : '○ Draft'}
                              </button>

                              {test.examDate && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-amber-600" />
                                  <span>{test.examDate}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              {/* Assign Candidates Button */}
                              <button
                                onClick={() => setAssigningTest(test)}
                                title="Assign / Revoke Candidates for this Paragraph"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              {/* Preview Paragraph Button */}
                              <button
                                onClick={() => setPreviewTest(test)}
                                title="Preview Paragraph Text"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setEditingTest(test);
                                  setIsCreateModalOpen(true);
                                }}
                                title="Edit Paragraph & Settings"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {/* Delete Button */}
                              <button
                                onClick={() => setDeletingTestId(test.id)}
                                title="Delete Test Paragraph"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            {test.heading && (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-0.5">
                                {test.heading}
                              </span>
                            )}
                            <h4 className={`text-base font-black text-slate-900 dark:text-white ${
                              isHindi ? 'font-devlys text-lg' : ''
                            }`}>
                              {test.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {test.durationMinutes || 10} Mins • Qualifying: {test.minCorrectWords || (test.minPassingWpm ? test.minPassingWpm * 10 : (isHindi ? 250 : 300))} Correct Words in 10 Mins
                            </p>
                          </div>

                          {/* Paragraph Snippet Preview */}
                          <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed ${
                            isHindi ? 'font-devlys text-sm' : 'font-mono text-[11px]'
                          }`}>
                            {test.passageText}
                          </div>
                        </div>

                        {/* Inline Delete Confirmation or Action Bar */}
                        {isDeleting ? (
                          <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 p-3 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-rose-800 dark:text-rose-300 text-center">
                              Permanently delete typing paragraph "{test.title}"?
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteTest(test.id);
                                  setDeletingTestId(null);
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Confirm Delete</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTestId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <span>
                                Total: <strong className="text-slate-800 dark:text-slate-200">{test.totalWords || test.passageText.split(/\s+/).filter(Boolean).length} words</strong>
                              </span>
                              <button
                                onClick={() => setAssigningTest(test)}
                                className="text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Users className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                {isUnassigned ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-extrabold">Assignment Removed</span>
                                ) : assignedCount > 0 ? (
                                  <span className="text-amber-600 dark:text-amber-400">{assignedCount} Assigned</span>
                                ) : (
                                  <span className="text-slate-600 dark:text-slate-300">Assigned to All</span>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {attemptsForThisTest.length} Submissions
                              </span>

                              {/* Remove Assignment Button: immediately removes paragraph from candidate's login */}
                              {!isUnassigned && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveAssignment(test.id, ['__UNASSIGNED__'])}
                                  title="Remove assignment so this paragraph is immediately removed from candidate's login"
                                  className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Remove Assignment</span>
                                </button>
                              )}

                              {/* Requirement: Revoke Para / Publish Function */}
                              {isPublished ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTestStatus(test)}
                                  title="Revoke paragraph so candidates cannot access or take this test"
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Revoke Para</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTestStatus(test)}
                                  title="Publish paragraph so candidates can access and take this test"
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Publish Para</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* CANDIDATE VIEW: Strictly show passages matching candidate's registered medium */
        <div className="space-y-6">
          {/* Candidate Medium Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Registered Medium: {candidateTypingMedium === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010 Font)' : 'English Medium'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  As per official registration, only typing passages assigned in your registered medium are displayed below.
                </span>
              </div>
            </div>
          </div>

          {/* Submission confirmation banner when performance modal is suppressed for typing module candidate */}
          {candidateSubmissionNotice && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100">
                    Typing Test Submitted Successfully
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Your examination attempt for <strong>{candidateSubmissionNotice.testTitle}</strong> has been securely submitted and recorded for official administrative evaluation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCandidateSubmissionNotice(null)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-200/70 hover:bg-emerald-200 dark:bg-emerald-900/70 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-xs font-bold transition-colors cursor-pointer self-end sm:self-auto"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {candidateFilteredTests.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3">
                <Keyboard className="w-10 h-10 mx-auto text-slate-400" />
                <p className="font-bold text-sm">
                  No active typing test published currently for your profile ({candidateTypingMedium === 'HINDI_DEVLYS_010' ? 'Hindi' : 'English'}).
                </p>
                <p className="text-xs text-slate-400">Please contact the district administration office.</p>
              </div>
            ) : (
              candidateFilteredTests.map((test) => {
                const isHindi = test.language === 'HINDI_DEVLYS_010';
                const priorAttempts = candidateAttempts.filter((a) => a.typingTestId === test.id);
                const hasCompletedTest = priorAttempts.length > 0;
                const bestAttempt = priorAttempts.sort((a, b) => b.netWpm - a.netWpm)[0];

                return (
                  <div
                    key={test.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            isHindi
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              : 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300'
                          }`}>
                            {isHindi ? 'Hindi Typing (DevLys 010)' : 'English Typing Test'}
                          </span>

                          {hasCompletedTest && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ● Completed & Submitted
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          {test.examDate && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{test.examDate}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{test.durationMinutes || 10} Mins</span>
                          </span>
                        </div>
                      </div>

                      <div>
                        {test.heading && (
                          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-0.5">
                            {test.heading}
                          </div>
                        )}
                        <h3 className={`text-xl font-black text-slate-900 dark:text-white ${
                          isHindi ? 'font-devlys text-2xl' : ''
                        }`}>
                          {test.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Qualifying Standard: Minimum <strong>{test.minCorrectWords || (test.minPassingWpm ? test.minPassingWpm * 10 : (isHindi ? 250 : 300))} Correct Words</strong> in 10 Mins
                        </p>
                      </div>

                      {/* Best Past Score (if attempted) */}
                      {bestAttempt && (
                        role === 'CANDIDATE' ? (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-xs">Test Submitted Successfully</span>
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Response recorded for official evaluation</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {new Date(bestAttempt.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">Your Evaluated Result</span>
                              <span className="text-base font-black text-amber-600">{bestAttempt.netWpm} Net WPM</span>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                bestAttempt.status === 'QUALIFIED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {bestAttempt.status}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{bestAttempt.accuracyPercentage}% Accuracy</span>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Action Bar (Requirement 8: Remove Retake Test option once candidate submit the test) */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Total Words: <strong>{test.totalWords || test.passageText.split(/\s+/).filter(Boolean).length}</strong>
                      </div>

                      {hasCompletedTest ? (
                        role === 'CANDIDATE' ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-4 py-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider border border-emerald-400/30 flex items-center space-x-1.5 shadow-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Test Completed</span>
                            </span>
                          </div>
                        ) : (
                          /* Once submitted, ONLY View Official Scorecard is shown for admin. Retake Test option is REMOVED */
                          <button
                            onClick={() => {
                              setLastFinishedAttempt(bestAttempt);
                              setPreviewTest(test);
                            }}
                            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Official Scorecard</span>
                          </button>
                        )
                      ) : (
                        /* Not yet submitted: Start Typing Test button */
                        <button
                          onClick={() => setActiveRunningTest(test)}
                          className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/25 transition-all flex items-center space-x-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Typing Test</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Admin Create / Edit Typing Test Modal */}
      {isCreateModalOpen && (
        <CreateTypingTestModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTest(null);
          }}
          onSave={handleSaveTest}
          initialTest={editingTest}
        />
      )}

      {/* Admin Assign Typing Test Modal */}
      {assigningTest && (
        <AssignTypingTestModal
          isOpen={!!assigningTest}
          onClose={() => setAssigningTest(null)}
          test={assigningTest}
          candidates={typingCandidates}
          onSaveAssignment={handleSaveAssignment}
        />
      )}

      {/* Admin Register / Edit Candidate Modal */}
      {isRegisterCandidateModalOpen && (
        <RegisterTypingCandidateModal
          isOpen={isRegisterCandidateModalOpen}
          onClose={() => {
            setIsRegisterCandidateModalOpen(false);
            setEditingCandidate(null);
          }}
          onSaveCandidate={async (cand) => {
            if (editingCandidate) {
              if (onSaveCandidate) await onSaveCandidate(cand);
            } else {
              if (onSaveCandidate) await onSaveCandidate(cand);
            }
          }}
          editingCandidate={editingCandidate}
        />
      )}

      {/* Passage Quality Audit & Refine Modal */}
      {sanitizingTest && (
        <PassageSanitizerModal
          isOpen={!!sanitizingTest}
          onClose={() => setSanitizingTest(null)}
          test={sanitizingTest}
          onApplyRefinedPassage={async (refinedText) => {
            const updatedTest = {
              ...sanitizingTest,
              passageText: refinedText,
            };
            await onSaveTest(updatedTest);
          }}
        />
      )}

      {/* Completed Test / View Scorecard Modal */}
      {lastFinishedAttempt && (
        <TypingResultModal
          isOpen={!!lastFinishedAttempt}
          onClose={() => setLastFinishedAttempt(null)}
          attempt={lastFinishedAttempt}
          referencePassage={lastFinishedAttempt.referencePassage || previewTest?.passageText || tests.find((t) => t.id === lastFinishedAttempt.typingTestId)?.passageText}
        />
      )}

      {/* Admin Preview Paragraph Modal */}
      {previewTest && !lastFinishedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-700 dark:text-amber-400">
                    Paragraph Preview
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{previewTest.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewTest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <span>Medium: <strong>{previewTest.language === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010)' : 'English'}</strong></span>
                <span>Scheduled Date: <strong>{previewTest.examDate || 'Today'}</strong></span>
                <span>Duration: <strong>10 Mins</strong></span>
                <span>Passing: <strong>{previewTest.minCorrectWords || previewTest.minPassingWpm * 10} words</strong></span>
              </div>
              <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm leading-relaxed ${
                previewTest.language === 'HINDI_DEVLYS_010' ? 'font-devlys text-base' : 'font-sans'
              }`}>
                {previewTest.passageText}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const testToAudit = previewTest;
                    setPreviewTest(null);
                    setSanitizingTest(testToAudit);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Audit & Refine Paragraph</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
