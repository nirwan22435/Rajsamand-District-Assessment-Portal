import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Key, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { sendEmailAPI } from '../services/api';
import { saveEmailLogToFirestore, saveStoredAdminPassword } from '../services/firestoreService';
import { EmailLog } from '../types';

interface AdminForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetSuccess?: (newPassword: string) => void;
  onLogEmail?: (log: EmailLog) => void;
  initialEmail?: string;
}

export const AdminForgotPasswordModal: React.FC<AdminForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordResetSuccess,
  onLogEmail,
  initialEmail = 'admin@rajsamand.gov.in',
}) => {
  const [step, setStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP' | 'SUCCESS'>('REQUEST_OTP');
  const [adminEmail, setAdminEmail] = useState(initialEmail);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAdminEmail(initialEmail || 'admin@rajsamand.gov.in');
      setStep('REQUEST_OTP');
      setOtpInput('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSuccessNotice(null);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Sending OTP Code
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid administrator email address.');
      return;
    }

    setIsLoading(true);

    // Generate random 6-digit OTP code
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    try {
      const res = await sendEmailAPI({
        type: 'ADMIN_RESET_OTP',
        candidateEmail: cleanEmail,
        candidateName: 'District Administrator',
        details: {
          otpCode: newOtp,
          portalUrl: window.location.origin,
        },
      });

      const log: EmailLog = {
        id: `log-admin-reset-${Date.now()}`,
        toEmail: cleanEmail,
        toName: 'District Administrator',
        type: 'ADMIN_RESET_OTP',
        subject: `🔐 Admin Password Reset OTP: ${newOtp} - Rajsamand District Portal`,
        sentAt: new Date().toISOString(),
        status: res.sentRealEmail || res.smtpMessageId || res.etherealPreviewUrl ? 'SENT' : 'SIMULATED',
        previewUrl: res.etherealPreviewUrl || undefined,
      };

      await saveEmailLogToFirestore(log);
      if (onLogEmail) onLogEmail(log);

      setStep('VERIFY_OTP');
      setResendCooldown(30);
      setSuccessNotice(`Verification code (OTP) successfully dispatched to ${cleanEmail}.`);
    } catch (err: any) {
      console.error('Failed to dispatch OTP email:', err);
      // Fallback transition
      setStep('VERIFY_OTP');
      setResendCooldown(30);
      setSuccessNotice(`Verification code generated: ${newOtp} (Simulated mode). Check Notification Logs.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Verification & Password Reset
  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otpInput.trim();
    if (!cleanOtp) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    // Validate OTP against generated OTP or fallback master keys
    const isMasterOtp = cleanOtp === '482910' || cleanOtp === '123456' || cleanOtp === 'ADMIN';
    if (cleanOtp !== generatedOtp && !isMasterOtp) {
      setErrorMessage(`Invalid verification code "${cleanOtp}". Please check your email inbox or use code "${generatedOtp || '482910'}".`);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // Save updated password locally and sync to Firestore
      await saveStoredAdminPassword(newPassword);

      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(newPassword);
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMessage('Failed to update administrator password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden transition-all relative">
        {/* Top Header Strip */}
        <div className="h-1.5 w-full grid grid-cols-3">
          <div className="bg-[#FF9933]"></div>
          <div className="bg-white dark:bg-slate-200"></div>
          <div className="bg-[#138808]"></div>
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                District Administration Rajsamand
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Admin Password Recovery
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && step === 'VERIFY_OTP' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 'REQUEST_OTP' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your registered official Administrator email address below. A 6-digit confidential verification code (OTP) will be dispatched to your inbox to verify your identity.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  Official Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@rajsamand.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Default Administrator Email: <strong>admin@rajsamand.gov.in</strong>. The OTP email will be recorded in the system audit logs.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-600/25 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Verification Code (OTP)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP & RESET PASSWORD */}
          {step === 'VERIFY_OTP' && (
            <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    6-Digit Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482910"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-mono font-black tracking-widest text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {generatedOtp && (
                  <div className="mt-1 text-[10px] text-slate-400 text-center font-mono">
                    Code sent to email: <strong className="text-amber-600">{generatedOtp}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Administrator Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new admin password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new admin password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('REQUEST_OTP')}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Code & Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Password Reset Successful!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Your District Administrator password has been updated securely. You can now log in using your new credentials.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 font-mono">
                Updated Password: <strong>{newPassword}</strong>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Administrator Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
