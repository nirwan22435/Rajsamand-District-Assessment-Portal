import React, { useState } from 'react';
import { Candidate, TestPaper, UserRole, EmailLog } from '../types';
import { ShieldCheck, User, CheckCircle2, AlertCircle, Lock, Mail, Eye, EyeOff, X, Building2 } from 'lucide-react';
import { getStoredAdminPassword } from '../services/firestoreService';
import { AdminForgotPasswordModal } from './AdminForgotPasswordModal';

interface LoginModalProps {
  candidates: Candidate[];
  tests?: TestPaper[];
  onAdminLogin: () => void;
  onCandidateLogin: (cand: Candidate) => void;
  onClose: () => void;
  onLogEmail?: (log: EmailLog) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  candidates,
  tests = [],
  onAdminLogin,
  onCandidateLogin,
  onClose,
  onLogEmail,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');

  // Admin login fields (no hardcoded email required)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Candidate login fields
  const [candidateIdentifier, setCandidateIdentifier] = useState<string>('');
  const [candidatePassword, setCandidatePassword] = useState<string>('');
  const [showCandidatePassword, setShowCandidatePassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const validPassword = getStoredAdminPassword();
    if (!adminEmail.trim()) {
      setLoginError('Please enter administrator email address.');
      return;
    }

    if (adminPassword.trim() === validPassword) {
      onAdminLogin();
      onClose();
    } else {
      setLoginError('Invalid administrator password. Click "Forgot Password?" below to recover your account via email verification.');
    }
  };

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = candidateIdentifier.trim().toLowerCase();
    if (!identifier) {
      setLoginError('Please enter your Registration ID or Email Address.');
      return;
    }

    if (!candidatePassword) {
      setLoginError('Please enter your candidate password.');
      return;
    }

    const found = candidates.find(
      (c) =>
        c.email.toLowerCase() === identifier ||
        c.registrationId.toLowerCase() === identifier ||
        c.id.toLowerCase() === identifier
    );

    if (!found) {
      setLoginError(`No registered candidate account found matching "${candidateIdentifier}".`);
      return;
    }

    if (!found.activeStatus) {
      setLoginError('This candidate account is disabled. Please contact Administrator.');
      return;
    }

    const expectedPassword = found.password || 'pass123';
    if (candidatePassword !== expectedPassword) {
      setLoginError('Invalid password. Please enter the correct password set during your registration.');
      return;
    }

    onCandidateLogin(found);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Tricolor Accent Line on Modal Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 grid grid-cols-3">
          <div className="bg-[#FF9933]"></div>
          <div className="bg-white dark:bg-slate-200"></div>
          <div className="bg-[#138808]"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Government Emblem */}
        <div className="text-center pt-2">
          <div className="relative inline-block mx-auto mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-600/80 p-1 flex items-center justify-center shadow-md">
              <svg
                className="w-10 h-10 text-amber-800 dark:text-amber-400"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" />
                <path d="M45 22C45 20 55 20 55 22V32C58 32 60 34 60 37V40H40V37C40 34 42 32 45 32V22Z" fill="currentColor" />
                <path d="M42 42H58V58C58 60 55 62 50 62C45 62 42 60 42 58V42Z" fill="currentColor" />
                <circle cx="50" cy="68" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M50 61V75M43 68H57M45 63L55 73M55 63L45 73" stroke="currentColor" strokeWidth="1" />
                <path d="M35 78H65V82H35V78Z" fill="currentColor" />
                <path d="M30 84H70V87H30V84Z" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-700 text-[8px] font-black text-amber-100 uppercase tracking-widest rounded shadow-sm whitespace-nowrap">
              सत्यमेव जयते
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1">
            राजसमंद जिला मूल्यांकन पोर्टल
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Portal Authentication
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            District Administration, Rajsamand (Rajasthan)
          </p>
        </div>

        {/* 1-Click Direct Access */}
        <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 rounded-2xl p-3 text-center">
          <button
            type="button"
            onClick={() => {
              onAdminLogin();
              onClose();
            }}
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Directly Open Portal (सीधे ऐप खोलें)</span>
          </button>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Instant direct access without Gmail login or password.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('ADMIN');
              setLoginError(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              selectedRole === 'ADMIN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Administrator
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('CANDIDATE');
              setLoginError(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              selectedRole === 'CANDIDATE'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Candidate Portal
          </button>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Forms */}
        {selectedRole === 'ADMIN' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Admin Email ID
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-[11px] font-bold text-amber-600 hover:underline"
                >
                  Forgot Password?
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
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Sign In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCandidateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registration ID or Email Address
              </label>
              <input
                type="text"
                required
                value={candidateIdentifier}
                onChange={(e) => setCandidateIdentifier(e.target.value)}
                placeholder="e.g. TYP-2026-001 or email@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showCandidatePassword ? 'text' : 'password'}
                  required
                  value={candidatePassword}
                  onChange={(e) => setCandidatePassword(e.target.value)}
                  placeholder="Enter candidate password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCandidatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>

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
