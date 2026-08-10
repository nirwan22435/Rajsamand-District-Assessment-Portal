import React, { useState } from 'react';
import { Candidate, TestPaper, UserRole, EmailLog } from '../types';
import { ShieldCheck, User, Key, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
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

  // Admin login fields
  const [adminEmail, setAdminEmail] = useState('devkarannirwan01@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Candidate login fields
  const [candidateSelectId, setCandidateSelectId] = useState<string>(candidates[0]?.id || '');
  const [modalAccessCode, setModalAccessCode] = useState<string>('');
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
    const cand = candidates.find((c) => c.id === candidateSelectId);
    if (!cand) {
      setLoginError('Candidate account not found.');
      return;
    }

    if (!cand.activeStatus) {
      setLoginError('This candidate account is disabled. Please contact Administrator.');
      return;
    }

    const cleanCode = modalAccessCode.trim().toUpperCase();
    if (cleanCode && tests.length > 0) {
      const matched = tests.find(
        (t) =>
          (t.accessCode && t.accessCode.toUpperCase() === cleanCode) ||
          `RJ-${t.id.slice(-4).toUpperCase()}` === cleanCode
      );
      const isMaster =
        cleanCode === 'RAJ-2026-ALL' ||
        cleanCode === 'ALL' ||
        cleanCode === cand.registrationId.toUpperCase();

      if (!matched && !isMaster) {
        setLoginError(`Invalid Access Code "${cleanCode}". Please check your test access code.`);
        return;
      }
    }

    onCandidateLogin(cand);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            RJ
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Portal Authentication
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rajsamand District Assessment & Evaluation Portal
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('ADMIN');
              setLoginError(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              selectedRole === 'ADMIN'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Administrator</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('CANDIDATE');
              setLoginError(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              selectedRole === 'CANDIDATE'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <User className="w-4 h-4 text-sky-600" />
            <span>Candidate Portal</span>
          </button>
        </div>

        {loginError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Form Body */}
        {selectedRole === 'ADMIN' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Username / Official Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Forgot Password?</span>
                </button>
              </div>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all mt-2"
            >
              Sign In as Administrator
            </button>
          </form>
        ) : (
          <form onSubmit={handleCandidateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Candidate Account
              </label>
              <select
                value={candidateSelectId}
                onChange={(e) => setCandidateSelectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) - {c.block}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Test Access Code</span>
                <span className="text-[10px] text-slate-400 font-normal">Case-insensitive</span>
              </label>
              <input
                type="text"
                value={modalAccessCode}
                onChange={(e) => setModalAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter Access Code..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all mt-2"
            >
              Access Candidate Portal
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
          >
            Cancel and Return
          </button>
        </div>
      </div>

      {/* Admin Forgot Password Modal */}
      <AdminForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        initialEmail={adminEmail}
        onLogEmail={onLogEmail}
        onPasswordResetSuccess={(newPass) => {
          setAdminPassword(newPass);
          setLoginError(null);
        }}
      />
    </div>
  );
};
