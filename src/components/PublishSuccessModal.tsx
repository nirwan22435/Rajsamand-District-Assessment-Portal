import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Send,
  Key,
  X,
} from 'lucide-react';
import { TestPaper } from '../types';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestPaper | null;
  notifiedCount?: number | string;
  isEdit?: boolean;
}

export const PublishSuccessModal: React.FC<PublishSuccessModalProps> = ({
  isOpen,
  onClose,
  test,
  notifiedCount = 'All',
  isEdit = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !test) return null;

  const code = test.accessCode || `RJ-${test.id.slice(-4).toUpperCase()}`;
  const attemptUrl = `${window.location.origin}/?attempt=true&testId=${encodeURIComponent(
    test.id
  )}&code=${encodeURIComponent(code)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(attemptUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
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
          {/* Top Decorative Gradient & Glow */}
          <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg border border-white/30 mb-3 text-white"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-100" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-100 text-xs font-bold mb-2 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isEdit ? 'Assessment Updated & Resent' : 'Assessment Published Successfully'}</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                {test.title}
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 font-medium">
                Rajsamand District Education & Assessment Portal
              </p>
            </motion.div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {/* Email Dispatch Status Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5 shadow-xs">
                <Send className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                <span className="font-bold text-emerald-900 dark:text-emerald-100 block text-sm mb-0.5">
                  Email Notifications Dispatched! ✉️
                </span>
                Official notification emails containing the direct test attempt link have been sent to{' '}
                <strong className="underline decoration-emerald-500 font-bold">
                  {notifiedCount} assigned candidate(s)
                </strong>
                .
              </div>
            </div>

            {/* Access Code & Direct Attempt Link Box */}
            <div className="space-y-3">
              {/* Access Code */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                      Test Access Code
                    </span>
                    <span className="text-base font-black font-mono text-amber-950 dark:text-amber-100">
                      {code}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Code Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Direct Attempt Link */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    Direct Candidates Attempt Link:
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    Auto-Fill Enabled
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
                  {attemptUrl}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" /> Link Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Direct Attempt Link
                      </>
                    )}
                  </button>
                  <a
                    href={attemptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                    title="Open test link in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test Link
                  </a>
                </div>
              </div>
            </div>

            {/* Summary Metadata Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Questions</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {test.questions.length} MCQs
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Total Marks</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {test.totalMarks} Marks
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Time Limit</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {test.timeLimitMinutes} Mins
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm transition-all shadow-md"
            >
              Got it, Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

