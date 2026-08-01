import React, { useState } from 'react';
import { Candidate, TestPaper, UserRole } from '../types';
import { ShieldCheck, User, ArrowRight, Lock, Sparkles, CheckCircle2, AlertCircle, Sun, Moon, Key, Mail } from 'lucide-react';

interface PortalLoginPageProps {
  candidates: Candidate[];
  tests: TestPaper[];
  onAdminLogin: () => void;
  onCandidateLogin: (cand: Candidate, accessCode?: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({
  candidates,
  tests,
  onAdminLogin,
  onCandidateLogin,
  darkMode,
  setDarkMode,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');

  // Admin login credentials
  const [adminEmail, setAdminEmail] = useState('admin@rajsamand.gov.in');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Candidate login credentials
  const [candidateEmailInput, setCandidateEmailInput] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [candidateAccessCode, setCandidateAccessCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMessage('Please provide administrator email and password.');
      return;
    }
    onAdminLogin();
  };

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Find candidate by email input OR selected profile
    let targetEmail = candidateEmailInput.trim().toLowerCase();
    let found = candidates.find((c) => c.email.toLowerCase() === targetEmail);

    if (!found && selectedCandidateId) {
      found = candidates.find((c) => c.id === selectedCandidateId);
    }

    if (!found) {
      setErrorMessage('No registered candidate account found with this Email ID. Please check your email or select a profile.');
      return;
    }

    if (!found.activeStatus) {
      setErrorMessage('This candidate account is currently disabled. Please contact District Administrator.');
      return;
    }

    // Verify Access Code
    const cleanCode = candidateAccessCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter the Test Access Code provided by District Administration.');
      return;
    }

    // Check against individual test access codes or candidate registration ID / master key
    const publishedTests = tests.filter((t) => t.status === 'PUBLISHED');
    const matchedTest = publishedTests.find(
      (t) =>
        (t.accessCode && t.accessCode.toUpperCase() === cleanCode) ||
        `RJ-${t.id.slice(-4).toUpperCase()}` === cleanCode
    );

    const isMasterCode =
      cleanCode === 'RAJ-2026-ALL' ||
      cleanCode === 'ALL' ||
      cleanCode === 'DEMO' ||
      cleanCode === found.registrationId.toUpperCase() ||
      cleanCode === (found.password ? found.password.toUpperCase() : 'PASS123');

    if (!matchedTest && !isMasterCode && publishedTests.length > 0) {
      setErrorMessage(
        `Invalid Access Code "${cleanCode}". Please enter a valid test access code (e.g. ${
          publishedTests[0]?.accessCode || 'RJ-8829'
        }) or Master Code (RAJ-2026-ALL).`
      );
      return;
    }

    onCandidateLogin(found, matchedTest ? matchedTest.accessCode : cleanCode);
  };

  // Helper quick select
  const handleQuickSelectCandidate = (cand: Candidate) => {
    setSelectedCandidateId(cand.id);
    setCandidateEmailInput(cand.email);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div className="flex items-center space-x-3">
          {/* Government Emblem Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-13 h-13 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-600/80 p-1 flex items-center justify-center shadow-md shadow-amber-900/10">
              <svg
                className="w-9 h-9 text-amber-800 dark:text-amber-400"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" />
                <path d="M45 22C45 20 55 20 55 22V32C58 32 60 34 60 37V40H40V37C40 34 42 32 45 32V22Z" fill="currentColor" />
                <path d="M42 42H58V58C58 60 55 62 50 62C45 62 42 60 42 58V42Z" fill="currentColor" />
                <circle cx="50" cy="68" r="7" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="68" r="2" fill="currentColor" />
                <path d="M50 61V75M43 68H57M45 63L55 73M55 63L45 73" stroke="currentColor" strokeWidth="1" />
                <path d="M35 78H65V82H35V78Z" fill="currentColor" />
                <path d="M30 84H70V87H30V84Z" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.2 bg-amber-700 text-[7px] font-black text-amber-100 uppercase tracking-widest rounded shadow-sm whitespace-nowrap">
              सत्यमेव जयते
            </div>
          </div>

          <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              राजसमंद जिला मूल्यांकन पोर्टल
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Rajsamand District Assessment Portal
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Govt. of Rajasthan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              District Administration • District Evaluation Cell, Rajsamand
            </p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all"
          title="Toggle Dark / Light Theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md relative overflow-hidden">
          {/* Card Top Seal Watermark / Header Icon */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-600/80 p-1 flex items-center justify-center shadow-lg shadow-amber-900/10 mb-1">
              <svg
                className="w-11 h-11 text-amber-800 dark:text-amber-400"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" />
                <path d="M45 22C45 20 55 20 55 22V32C58 32 60 34 60 37V40H40V37C40 34 42 32 45 32V22Z" fill="currentColor" />
                <path d="M42 42H58V58C58 60 55 62 50 62C45 62 42 60 42 58V42Z" fill="currentColor" />
                <circle cx="50" cy="68" r="7" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="68" r="2" fill="currentColor" />
                <path d="M50 61V75M43 68H57M45 63L55 73M55 63L45 73" stroke="currentColor" strokeWidth="1" />
                <path d="M35 78H65V82H35V78Z" fill="currentColor" />
                <path d="M30 84H70V87H30V84Z" fill="currentColor" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              राजसमंद जिला मूल्यांकन पोर्टल
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Continue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your authorization role below to access candidate assessments or evaluation metrics.
            </p>
          </div>

          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ADMIN');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                selectedRole === 'ADMIN'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administrator</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('CANDIDATE');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                selectedRole === 'CANDIDATE'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Candidate Portal</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Content */}
          {selectedRole === 'ADMIN' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@rajsamand.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin PIN / Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In as District Admin</span>
              </button>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Demo Credentials: <strong>admin@rajsamand.gov.in</strong> / <strong>admin123</strong>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Candidate Email ID
                </label>
                <input
                  type="email"
                  required
                  value={candidateEmailInput || (candidates.find((c) => c.id === selectedCandidateId)?.email || '')}
                  onChange={(e) => {
                    setCandidateEmailInput(e.target.value);
                    const matched = candidates.find((c) => c.email.toLowerCase() === e.target.value.toLowerCase());
                    if (matched) setSelectedCandidateId(matched.id);
                  }}
                  placeholder="e.g. pawan.verma@rajsamand.edu.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Or Select Registered Profile
                </label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => {
                    setSelectedCandidateId(e.target.value);
                    const c = candidates.find((cand) => cand.id === e.target.value);
                    if (c) setCandidateEmailInput(c.email);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) — {c.block}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Test Access Code
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Case-insensitive</span>
                </label>
                <input
                  type="text"
                  required
                  value={candidateAccessCode}
                  onChange={(e) => setCandidateAccessCode(e.target.value.toUpperCase())}
                  placeholder="Enter Access Code"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-600/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Verify Access Code & Begin Test</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 dark:text-slate-600 z-10">
        © 2026 District Administration Rajsamand, Rajasthan • Automated Evaluation System by DoIT&C Rajsamand
      </footer>
    </div>
  );
};
