import React, { useState } from 'react';
import { Candidate, TestPaper, UserRole, EmailLog } from '../types';
import {
  ShieldCheck,
  User,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Mail,
  Eye,
  EyeOff,
  Building2,
  PhoneCall,
  Palette,
  Monitor,
} from 'lucide-react';
import { getStoredAdminPassword } from '../services/firestoreService';
import { AdminForgotPasswordModal } from './AdminForgotPasswordModal';
import { PortalLogo } from './PortalLogo';

interface PortalLoginPageProps {
  candidates: Candidate[];
  tests: TestPaper[];
  onAdminLogin: () => void;
  onCandidateLogin: (cand: Candidate, accessCode?: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogEmail?: (log: EmailLog) => void;
  onOpenThemeModal?: () => void;
  onOpenDesktopModal?: () => void;
}

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({
  candidates,
  tests,
  onAdminLogin,
  onCandidateLogin,
  darkMode,
  setDarkMode,
  onLogEmail,
  onOpenThemeModal,
  onOpenDesktopModal,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');

  // Admin login credentials
  const [adminEmail, setAdminEmail] = useState('devkarannirwan01@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Candidate login credentials (Registration ID or Email + Password)
  const [candidateIdentifier, setCandidateIdentifier] = useState<string>('');
  const [candidatePassword, setCandidatePassword] = useState<string>('');
  const [showCandidatePassword, setShowCandidatePassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get('email');
    const regParam = searchParams.get('reg') || searchParams.get('registrationId');

    if (emailParam || regParam) {
      setSelectedRole('CANDIDATE');
      if (emailParam) {
        setCandidateIdentifier(emailParam);
      } else if (regParam) {
        setCandidateIdentifier(regParam);
      }
    }
  }, [candidates]);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validPassword = getStoredAdminPassword();
    if (!adminEmail.trim()) {
      setErrorMessage('Please provide administrator email address.');
      return;
    }

    if (adminPassword.trim() === validPassword) {
      onAdminLogin();
    } else {
      setErrorMessage('Invalid administrator password. Click "Forgot Password?" below to verify email and reset.');
    }
  };

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const identifier = candidateIdentifier.trim().toLowerCase();
    if (!identifier) {
      setErrorMessage('Please enter your Registration ID or Email Address.');
      return;
    }

    if (!candidatePassword) {
      setErrorMessage('Please enter your candidate password.');
      return;
    }

    // Find candidate by email or registrationId (case-insensitive)
    const found = candidates.find(
      (c) =>
        c.email.toLowerCase() === identifier ||
        c.registrationId.toLowerCase() === identifier ||
        c.id.toLowerCase() === identifier
    );

    if (!found) {
      setErrorMessage(
        `No registered candidate account found matching "${candidateIdentifier}". Please check your Registration ID or contact District Administrator.`
      );
      return;
    }

    if (!found.activeStatus) {
      setErrorMessage('This candidate account is currently disabled. Please contact District Administrator.');
      return;
    }

    // Verify candidate password
    const expectedPassword = found.password || 'pass123';
    if (candidatePassword !== expectedPassword) {
      setErrorMessage('Invalid password. Please enter the correct password set during your registration.');
      return;
    }

    onCandidateLogin(found);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors relative overflow-hidden font-sans">
      {/* 1. Official National Tricolor Top Accent Strip */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#FF9933]"></div> {/* Saffron */}
        <div className="bg-white dark:bg-slate-200"></div> {/* White */}
        <div className="bg-[#138808]"></div> {/* Green */}
      </div>

      {/* 2. Official Government Main Header */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            {/* Official Portal Logo Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-500/80 p-1 flex items-center justify-center shadow-md shadow-amber-900/10 hover:scale-105 transition-transform">
                <PortalLogo size={46} darkMode={darkMode} />
              </div>
            </div>

            {/* Title, Badge & Subtitles matching photo */}
            <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3.5">
              <div className="font-hindi text-[12px] font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                राजसमंद जिला मूल्यांकन पोर्टल
              </div>
              <div className="mt-0.5">
                <h1 className="font-display text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
                  Rajsamand District Assessment Portal
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                District Administration, Rajsamand
              </p>
            </div>
          </div>

          {/* Actions: Themes Button & Dark Mode Toggle on Header Bar */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {onOpenDesktopModal && (
              <button
                type="button"
                onClick={onOpenDesktopModal}
                title="Install / Download Windows Desktop Application & .EXE Setup"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-slate-950 dark:text-white border border-amber-400 dark:border-amber-500 transition-all flex items-center gap-1.5 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop App</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </button>
            )}

            {/* Light / Dark Mode Toggle on Header Bar */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <div className="w-full max-w-[500px] mx-auto px-4 py-8 relative z-10 flex-1 flex items-center justify-center">
        <div className="w-full sm:w-[500px] min-h-[500px] bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 flex flex-col justify-center">
          {/* Card Top Title */}
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Portal
            </h2>
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

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forms */}
          {selectedRole === 'ADMIN' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Forgot Password?</span>
                  </button>
                </div>
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
            </form>
          ) : (
            /* Candidate Login: Registration ID / Email + Password */
            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Registration ID / Email Address
                </label>
                <input
                  type="text"
                  required
                  value={candidateIdentifier}
                  onChange={(e) => setCandidateIdentifier(e.target.value)}
                  placeholder="e.g. TYP-2026-001 or email@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Candidate Password
                </label>
                <div className="relative">
                  <input
                    type={showCandidatePassword ? 'text' : 'password'}
                    required
                    value={candidatePassword}
                    onChange={(e) => setCandidatePassword(e.target.value)}
                    placeholder="Enter your candidate password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showCandidatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-600/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
              >
                <span>Access Candidate Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Official Government Footer */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400 relative z-10">
        <div className="font-semibold text-slate-700 dark:text-slate-300">
          District Administration, Rajsamand (Rajasthan)
        </div>
      </footer>

      {/* Admin Forgot Password Dialog */}
      {showForgotPasswordModal && (
        <AdminForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
          onLogEmail={onLogEmail}
        />
      )}
    </div>
  );
};
