import React, { useState, useEffect } from 'react';
import { Candidate, TestPaper, TestAttempt, EmailLog, UserRole } from './types';
import {
  INITIAL_CANDIDATES,
  INITIAL_TESTS,
  INITIAL_ATTEMPTS,
  INITIAL_EMAIL_LOGS,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { TestUploadSection } from './components/TestUploadSection';
import { CandidateManagement } from './components/CandidateManagement';
import { CandidatePortal } from './components/CandidatePortal';
import { AssessmentRunner } from './components/AssessmentRunner';
import { TestResultView } from './components/TestResultView';
import { ProgressReportModal } from './components/ProgressReportModal';
import { LoginModal } from './components/LoginModal';
import { PortalLoginPage } from './components/PortalLoginPage';
import { EmailLogView } from './components/EmailLogView';
import { PublishedTestPapersView } from './components/PublishedTestPapersView';
import { sendEmailAPI } from './services/api';
import {
  subscribeCandidates,
  subscribeTests,
  subscribeAttempts,
  subscribeEmailLogs,
  saveCandidateToFirestore,
  toggleCandidateStatusInFirestore,
  saveTestToFirestore,
  deleteTestFromFirestore,
  saveAttemptToFirestore,
  saveEmailLogToFirestore,
  seedInitialDataIfEmpty,
} from './services/firestoreService';

export default function App() {
  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('rajsamand_dark_mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('rajsamand_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [activeCandidate, setActiveCandidate] = useState<Candidate | undefined>(undefined);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Active Navigation Tab & Editing State
  const [activeTab, setActiveTab] = useState<string>('analytics');
  const [editingTest, setEditingTest] = useState<TestPaper | null>(null);

  // Firestore Real-Time Application Data State
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [tests, setTests] = useState<TestPaper[]>(INITIAL_TESTS);
  const [attempts, setAttempts] = useState<TestAttempt[]>(INITIAL_ATTEMPTS);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(INITIAL_EMAIL_LOGS);

  // Firestore Real-time subscriptions & seed init
  useEffect(() => {
    seedInitialDataIfEmpty(INITIAL_CANDIDATES, INITIAL_TESTS, INITIAL_ATTEMPTS, INITIAL_EMAIL_LOGS);

    const unsubCand = subscribeCandidates((data) => {
      if (data.length > 0) setCandidates(data);
    });

    const unsubTests = subscribeTests((data) => {
      setTests(data);
    });

    const unsubAttempts = subscribeAttempts((data) => {
      if (data.length > 0) setAttempts(data);
    });

    const unsubLogs = subscribeEmailLogs((data) => {
      if (data.length > 0) setEmailLogs(data);
    });

    return () => {
      unsubCand();
      unsubTests();
      unsubAttempts();
      unsubLogs();
    };
  }, []);

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset local view state? Data is synchronized with Cloud Firestore.')) {
      setCandidates([]);
      setTests([]);
      setAttempts([]);
      setEmailLogs([]);
    }
  };

  // Active Flow Screens
  const [activeTakingTest, setActiveTakingTest] = useState<TestPaper | null>(null);
  const [activeViewingResult, setActiveViewingResult] = useState<{
    attempt: TestAttempt;
    test: TestPaper;
  } | null>(null);
  const [selectedReportCandidate, setSelectedReportCandidate] = useState<Candidate | null>(null);

  // Handlers for Candidate Actions
  const handleAddCandidate = async (newCand: Candidate) => {
    setCandidates((prev) => [newCand, ...prev]);
    await saveCandidateToFirestore(newCand);
  };

  const handleUpdateCandidate = async (updatedCand: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updatedCand.id ? updatedCand : c)));
    await saveCandidateToFirestore(updatedCand);
  };

  const handleToggleCandidateStatus = async (id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    if (candidate) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, activeStatus: !c.activeStatus } : c))
      );
      await toggleCandidateStatusInFirestore(id, candidate.activeStatus);
    }
  };

  const handlePublishTest = async (testToSave: TestPaper) => {
    setTests((prev) => {
      const exists = prev.some((t) => t.id === testToSave.id);
      if (exists) {
        return prev.map((t) => (t.id === testToSave.id ? testToSave : t));
      }
      return [testToSave, ...prev];
    });

    setEditingTest(null);
    await saveTestToFirestore(testToSave);

    // Determine target candidates to notify
    let candidatesToNotify: Candidate[] = [];
    if (
      testToSave.assignedCandidateIds &&
      testToSave.assignedCandidateIds.length > 0 &&
      !testToSave.assignedCandidateIds.includes('ALL')
    ) {
      // ONLY assigned candidates
      candidatesToNotify = candidates.filter(
        (cand) => cand.activeStatus && testToSave.assignedCandidateIds!.includes(cand.id)
      );
    } else {
      // All active candidates in target block
      candidatesToNotify = candidates.filter(
        (cand) =>
          cand.activeStatus &&
          (testToSave.targetBlock === 'District-Wide' || cand.block === testToSave.targetBlock)
      );
    }

    // Notify assigned candidates via Resend
    for (const cand of candidatesToNotify) {
      try {
        const res = await sendEmailAPI({
          type: 'TEST_ASSIGNED',
          candidateEmail: cand.email,
          candidateName: cand.name,
          details: {
            testTitle: testToSave.title,
            testId: testToSave.id,
            accessCode: testToSave.accessCode,
            subject: testToSave.subject,
            duration: testToSave.timeLimitMinutes,
            totalQuestions: testToSave.questions.length,
            portalUrl: window.location.origin,
            attemptUrl: `${window.location.origin}/?attempt=true&testId=${encodeURIComponent(testToSave.id)}&code=${encodeURIComponent(testToSave.accessCode)}&email=${encodeURIComponent(cand.email)}`,
          },
        });

        const log: EmailLog = {
          id: `log-${Date.now()}-${cand.id}`,
          toEmail: cand.email,
          toName: cand.name,
          type: 'TEST_ASSIGNED',
          subject: `📝 Assessment Assigned: ${testToSave.title}`,
          sentAt: new Date().toISOString(),
          status: (res.sentRealEmail || res.smtpMessageId || res.etherealPreviewUrl) ? 'SENT' : 'SIMULATED',
          previewUrl: res.etherealPreviewUrl || undefined,
        };
        setEmailLogs((prev) => [log, ...prev]);
        await saveEmailLogToFirestore(log);
      } catch (e) {
        console.warn('Email notice logged locally.');
      }
    }
  };

  const handleDeleteTest = async (testId: string) => {
    setTests((prev) => prev.filter((t) => t.id !== testId));
    if (editingTest?.id === testId) {
      setEditingTest(null);
    }
    await deleteTestFromFirestore(testId);
  };

  // Submit Test Handler
  const handleSubmitTestAttempt = async (newAttempt: TestAttempt) => {
    setAttempts((prev) => [newAttempt, ...prev]);
    setActiveTakingTest(null);
    await saveAttemptToFirestore(newAttempt);

    const testPaper = tests.find((t) => t.id === newAttempt.testId);
    if (testPaper) {
      setActiveViewingResult({
        attempt: newAttempt,
        test: testPaper,
      });
    }

    // Auto-send submission scorecard email with attached PDF
    try {
      const res = await sendEmailAPI({
        type: 'TEST_RESULT_NOTIFICATION',
        candidateEmail: newAttempt.candidateEmail,
        candidateName: newAttempt.candidateName,
        details: {
          testTitle: newAttempt.testTitle,
          subject: testPaper?.subject,
          scoreObtained: newAttempt.scoreObtained,
          totalMarks: newAttempt.totalMarks,
          scorePercentage: newAttempt.scorePercentage,
          correctCount: newAttempt.correctCount,
          wrongCount: newAttempt.wrongCount,
          unattemptedCount: newAttempt.unattemptedCount,
          timeTakenMinutes: newAttempt.timeTakenMinutes,
          block: newAttempt.block,
          submittedAt: newAttempt.submittedAt,
          registrationId: activeCandidate?.registrationId || 'RJ-CAND-2026',
          questions: testPaper?.questions,
          answers: newAttempt.answers,
        },
      });

      const log: EmailLog = {
        id: `log-${Date.now()}`,
        toEmail: newAttempt.candidateEmail,
        toName: newAttempt.candidateName,
        type: 'TEST_RESULT_NOTIFICATION',
        subject: `📊 Test Submission Report: ${newAttempt.testTitle} (${newAttempt.scorePercentage}%)`,
        sentAt: new Date().toISOString(),
        status: (res.sentRealEmail || res.smtpMessageId || res.etherealPreviewUrl) ? 'SENT' : 'SIMULATED',
        previewUrl: res.etherealPreviewUrl || undefined,
      };
      setEmailLogs((prev) => [log, ...prev]);
      await saveEmailLogToFirestore(log);
    } catch (e) {
      console.warn('Scorecard email logged.');
    }
  };

  // Login Handler
  const handleAdminLogin = () => {
    setRole('ADMIN');
    setActiveCandidate(undefined);
    setIsAuthenticated(true);
    setActiveTab('analytics');
    setActiveTakingTest(null);
    setActiveViewingResult(null);
  };

  const handleCandidateLogin = (cand: Candidate) => {
    setRole('CANDIDATE');
    setActiveCandidate(cand);
    setIsAuthenticated(true);
    setActiveTab('my-tests');
    setActiveTakingTest(null);
    setActiveViewingResult(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole('ADMIN');
    setActiveCandidate(undefined);
    setActiveTab('analytics');
    setActiveTakingTest(null);
    setActiveViewingResult(null);
  };

  // Review existing attempt
  const handleReviewAttempt = (attempt: TestAttempt) => {
    const testPaper = tests.find((t) => t.id === attempt.testId);
    if (testPaper) {
      setActiveViewingResult({
        attempt,
        test: testPaper,
      });
    }
  };

  // Request scorecard email manually
  const handleRequestEmailResult = async (attempt: TestAttempt) => {
    try {
      const res = await sendEmailAPI({
        type: 'TEST_RESULT_NOTIFICATION',
        candidateEmail: attempt.candidateEmail,
        candidateName: attempt.candidateName,
        details: {
          testTitle: attempt.testTitle,
          scoreObtained: attempt.scoreObtained,
          totalMarks: attempt.totalMarks,
          scorePercentage: attempt.scorePercentage,
          correctCount: attempt.correctCount,
          wrongCount: attempt.wrongCount,
          unattemptedCount: attempt.unattemptedCount,
          timeTakenMinutes: attempt.timeTakenMinutes,
          block: attempt.block,
        },
      });

      const log: EmailLog = {
        id: `log-${Date.now()}`,
        toEmail: attempt.candidateEmail,
        toName: attempt.candidateName,
        type: 'TEST_RESULT_NOTIFICATION',
        subject: `📊 Test Scorecard: ${attempt.testTitle}`,
        sentAt: new Date().toISOString(),
        status: res.sentRealEmail ? 'SENT' : 'SIMULATED',
        previewUrl: res.etherealPreviewUrl || undefined,
      };
      setEmailLogs((prev) => [log, ...prev]);
      await saveEmailLogToFirestore(log);
    } catch (e) {
      console.warn('Email dispatch logged.');
    }
  };

  if (!isAuthenticated) {
    return (
      <PortalLoginPage
        candidates={candidates}
        tests={tests}
        onAdminLogin={handleAdminLogin}
        onCandidateLogin={(cand) => handleCandidateLogin(cand)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        role={role}
        candidate={activeCandidate}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setActiveTakingTest(null);
          setActiveViewingResult(null);
        }}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Full-Screen Test Taking Mode */}
        {activeTakingTest && (role === 'CANDIDATE' || role === 'ADMIN') ? (
          <AssessmentRunner
            test={activeTakingTest}
            candidate={
              activeCandidate || {
                id: 'cand-admin-preview',
                registrationId: 'ADM-PREVIEW',
                name: 'Administrator Preview Candidate',
                email: 'admin@rajsamand.gov.in',
                phone: '+91 98000 00000',
                block: 'Rajsamand',
                category: 'General',
                activeStatus: true,
                password: 'pass',
                createdAt: new Date().toISOString(),
              }
            }
            onSubmitTest={handleSubmitTestAttempt}
            onCancel={() => setActiveTakingTest(null)}
          />
        ) : activeViewingResult ? (
          /* Result & Solution Review Screen */
          <TestResultView
            attempt={activeViewingResult.attempt}
            test={activeViewingResult.test}
            onReturnToDashboard={() => setActiveViewingResult(null)}
            onOpenReportModal={() => {
              const cand = candidates.find((c) => c.id === activeViewingResult.attempt.candidateId) || {
                id: activeViewingResult.attempt.candidateId,
                registrationId: 'RJ-2026-REG',
                name: activeViewingResult.attempt.candidateName,
                email: activeViewingResult.attempt.candidateEmail,
                phone: '+91 98290 00000',
                block: activeViewingResult.attempt.block,
                category: 'General',
                activeStatus: true,
                password: 'pass',
                createdAt: new Date().toISOString(),
              };
              setSelectedReportCandidate(cand);
            }}
          />
        ) : role === 'ADMIN' ? (
          /* Administrator Tab Views */
          <>
            {activeTab === 'analytics' && (
              <AdminDashboard
                candidates={candidates}
                tests={tests}
                attempts={attempts}
                onNavigateToUpload={() => {
                  setEditingTest(null);
                  setActiveTab('upload-paper');
                }}
                onNavigateToCandidates={() => setActiveTab('candidates')}
                onSelectCandidateForReport={(cand) => setSelectedReportCandidate(cand)}
                onEditTest={(testToEdit) => {
                  setEditingTest(testToEdit);
                  setActiveTab('upload-paper');
                }}
                onDeleteTest={handleDeleteTest}
                onResetData={handleResetData}
              />
            )}

            {activeTab === 'published-tests' && (
              <PublishedTestPapersView
                tests={tests}
                attempts={attempts}
                candidates={candidates}
                onNavigateToUpload={() => {
                  setEditingTest(null);
                  setActiveTab('upload-paper');
                }}
                onEditTest={(testToEdit) => {
                  setEditingTest(testToEdit);
                  setActiveTab('upload-paper');
                }}
                onDeleteTest={handleDeleteTest}
              />
            )}

            {activeTab === 'upload-paper' && (
              <TestUploadSection
                onPublishTest={handlePublishTest}
                candidateCount={candidates.length}
                candidates={candidates}
                editingTest={editingTest}
                onCancelEdit={() => setEditingTest(null)}
                onDeleteTest={handleDeleteTest}
              />
            )}

            {activeTab === 'candidates' && (
              <CandidateManagement
                candidates={candidates}
                onAddCandidate={handleAddCandidate}
                onUpdateCandidate={handleUpdateCandidate}
                onToggleStatus={handleToggleCandidateStatus}
                onSelectCandidateForReport={(cand) => setSelectedReportCandidate(cand)}
                onLogEmailSent={async (log) => {
                  setEmailLogs((prev) => [log, ...prev]);
                  await saveEmailLogToFirestore(log);
                }}
              />
            )}

            {activeTab === 'email-logs' && <EmailLogView logs={emailLogs} candidates={candidates} />}
          </>
        ) : (
          /* Candidate Portal View */
          activeCandidate && (
            <CandidatePortal
              candidate={activeCandidate}
              tests={tests}
              attempts={attempts}
              onStartTest={(test) => setActiveTakingTest(test)}
              onReviewAttempt={handleReviewAttempt}
              onRequestEmailResult={handleRequestEmailResult}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )
        )}
      </main>

      {/* Official Footer */}
      <footer className="w-full bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 District Administration Rajsamand, Rajasthan • Automated Evaluation System by DoIT&C Rajsamand
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            District Evaluation Cell • Government of Rajasthan
          </span>
        </div>
      </footer>

      {/* Progress Report Modal */}
      {selectedReportCandidate && (
        <ProgressReportModal
          candidate={selectedReportCandidate}
          attempts={attempts}
          onClose={() => setSelectedReportCandidate(null)}
        />
      )}

      {/* Portal Login Dialog */}
      {showLoginModal && (
        <PortalLoginPage
          candidates={candidates}
          tests={tests}
          onAdminLogin={() => {
            handleAdminLogin();
            setShowLoginModal(false);
          }}
          onCandidateLogin={(cand) => {
            handleCandidateLogin(cand);
            setShowLoginModal(false);
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}
    </div>
  );
}
