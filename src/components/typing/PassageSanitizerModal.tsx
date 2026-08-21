import React, { useState, useMemo } from 'react';
import { TypingTest } from '../../types';
import { auditAndRefinePassage, PassageAuditResult } from '../../utils/passageSanitizer';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface PassageSanitizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TypingTest;
  onApplyRefinedPassage: (refinedText: string) => void;
}

export const PassageSanitizerModal: React.FC<PassageSanitizerModalProps> = ({
  isOpen,
  onClose,
  test,
  onApplyRefinedPassage,
}) => {
  if (!isOpen) return null;

  const isHindi = test.language === 'HINDI_DEVLYS_010';
  const [currentText, setCurrentText] = useState<string>(test.passageText);
  const [applied, setApplied] = useState<boolean>(false);

  const audit: PassageAuditResult = useMemo(() => {
    return auditAndRefinePassage(currentText, isHindi);
  }, [currentText, isHindi]);

  const handleApplyFixes = () => {
    onApplyRefinedPassage(audit.refinedPassage);
    setCurrentText(audit.refinedPassage);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                Passage Quality & Refinement Engine
              </div>
              <h2 className="text-base font-black tracking-tight">
                Reference Passage Health & Anomaly Audit
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          {applied ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Passage Successfully Refined & Updated!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  All rogue characters, nuktas, attached periods, and formatting bugs have been cleaned.
                </p>
              </div>
            </div>
          ) : audit.hasIssues ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-amber-900 dark:text-amber-300">
                    {audit.totalIssues} Potential Passage Formatting Issue{audit.totalIssues > 1 ? 's' : ''} Detected
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Needs Refinement
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  Issues like rogue nuktas (e.g. <span className="font-bold">ह़</span>), attached dots (e.g. <span className="font-bold">पेड़.</span>), or unspaced dandas (e.g. <span className="font-bold">है।</span>) can cause false incorrect word evaluations for candidates.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Passage is 100% Clean & Verified</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  No rogue nuktas, invalid punctuation, or encoding glitches detected. Ready for typing assessment.
                </p>
              </div>
            </div>
          )}

          {/* List of Detected Word Anomalies */}
          {audit.anomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Detected Words Requiring Refinement ({audit.anomalies.length})</span>
              </h3>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {audit.anomalies.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                        {item.index}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 line-through">
                            {item.originalWord}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                            {item.refinedWord}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Current Passage</span>
              </label>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {currentText}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Refined & Sanitized Passage</span>
              </label>
              <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 text-xs text-slate-800 dark:text-slate-200 h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {audit.refinedPassage}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>

          {audit.hasIssues && !applied && (
            <button
              type="button"
              onClick={handleApplyFixes}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Refined Passage & Save ({audit.totalIssues} Fixes)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
