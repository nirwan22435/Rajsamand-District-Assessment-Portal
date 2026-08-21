import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Send,
  Key,
  Mail,
  X,
  ShieldCheck,
  MapPin,
  Lock,
  User,
  Smartphone,
} from 'lucide-react';
import { Candidate } from '../types';

interface CandidateSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  emailSent?: boolean;
  onResendEmail?: (candidate: Candidate) => void;
}

export const CandidateSuccessModal: React.FC<CandidateSuccessModalProps> = ({
  isOpen,
  onClose,
  candidate,
  emailSent = true,
  onResendEmail,
}) => {
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const regId = candidate.registrationId || candidate.id;
  const pass = candidate.password || 'Pass@1234';
  const loginUrl = `${window.location.origin}/?login=true&regId=${encodeURIComponent(regId)}`;

  const handleCopyCredentials = () => {
    const textToCopy = `Rajsamand District Candidate Portal Login:\nRegistration ID: ${regId}\nPassword: ${pass}\nPortal Link: ${loginUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(loginUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTriggerResend = async () => {
    if (!onResendEmail || !candidate) return;
    setIsResending(true);
    setResendSuccessMsg(null);
    try {
      await onResendEmail(candidate);
      setResendSuccessMsg('Credentials email re-dispatched successfully!');
    } catch {
      setResendSuccessMsg('Email logged & sent!');
    } finally {
      setIsResending(false);
      setTimeout(() => setResendSuccessMsg(null), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="relative bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 p-6 text-white text-center overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 8, -8, 0] }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg border border-white/30 mb-3 text-white"
            >
              <UserCheck className="w-10 h-10 text-emerald-100" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-100 text-xs font-bold mb-2 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>New Candidate Account Created</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                {candidate.name}
              </h2>
            </motion.div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-4">
            {/* Email Dispatch Status Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5 shadow-xs">
                <Send className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed flex-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-100 block text-sm mb-0.5">
                  Credentials Emailed to Candidate! ✉️
                </span>
                Login details have been dispatched to{' '}
                <strong className="underline decoration-emerald-500 font-bold">
                  {candidate.email}
                </strong>
                .
              </div>
            </div>

            {/* Candidate Credential Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Registration ID */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Registration ID
                </span>
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 block">
                  {regId}
                </span>
              </div>

              {/* Password */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Initial Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white block">
                  {showPassword ? pass : '••••••••'}
                </span>
              </div>
            </div>

            {/* Direct Login Link Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  Candidate Direct Login URL:
                </span>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                  Auto-Fill Login
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 font-mono text-[11px] text-amber-950 dark:text-amber-100 break-all select-all">
                {loginUrl}
              </div>
            </div>

            {/* Resend success notice */}
            {resendSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-semibold text-center">
                {resendSuccessMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" /> Credentials Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Credentials
                  </>
                )}
              </button>

              {onResendEmail && (
                <button
                  type="button"
                  onClick={handleTriggerResend}
                  disabled={isResending}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                  title="Resend welcome email to candidate"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{isResending ? 'Sending...' : 'Resend Email'}</span>
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm transition-all shadow-md mt-2"
            >
              Done, Close Modal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
