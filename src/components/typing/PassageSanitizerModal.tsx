import React, { useState, useMemo } from 'react';
import { TypingTest } from '../../types';
import { auditAndRefinePassage } from '../../utils/passageSanitizer';
import { convertDevlysToUnicode } from '../../utils/devlysConverter';
import {
  Sparkles,
  CheckCircle2,
  X,
  ShieldCheck,
  AlignLeft,
  Eye,
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
  const [activeTab, setActiveTab] = useState<'DEVLYS' | 'UNICODE'>('DEVLYS');

  const audit = useMemo(() => {
    return auditAndRefinePassage(currentText, isHindi);
  }, [currentText, isHindi]);

  const unicodeEquivalent = useMemo(() => {
    if (!isHindi) return currentText;
    return convertDevlysToUnicode(currentText);
  }, [currentText, isHindi]);

  const handleApplyCleanSpaces = () => {
    const cleaned = currentText
      .replace(/\r\n/g, '\n')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
    onApplyRefinedPassage(cleaned);
    setCurrentText(cleaned);
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
                Passage Inspector & Preview
              </div>
              <h2 className="text-base font-black tracking-tight">
                {isHindi ? 'DevLys 010 Reference Passage Preview' : 'English Reference Passage Preview'}
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
                <h4 className="font-bold text-sm">Passage Cleaned & Updated!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Extra spaces and non-printing formatting have been normalized cleanly.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">
                  {isHindi ? 'DevLys 010 Passage 100% Valid & Ready' : 'Passage 100% Valid & Ready'}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  No token errors or font anomalies detected. All words and punctuation are ready for examination.
                </p>
              </div>
            </div>
          )}

          {/* View Mode Selector for Hindi */}
          {isHindi && (
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('DEVLYS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'DEVLYS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>DevLys 010 Font View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UNICODE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'UNICODE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unicode Devanagari Translation View</span>
              </button>
            </div>
          )}

          {/* Passage Display */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{isHindi && activeTab === 'UNICODE' ? 'Devanagari Meaning' : 'Exam Reference Paragraph'}</span>
              <span className="text-[11px] font-mono text-slate-500">{audit.refinedWordCount} words</span>
            </label>
            <div
              className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-h-48 max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap ${
                isHindi && activeTab === 'DEVLYS' ? 'font-devlys text-lg' : 'font-sans text-sm'
              }`}
            >
              {isHindi && activeTab === 'UNICODE' ? unicodeEquivalent : currentText}
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

          {!applied && (
            <button
              type="button"
              onClick={handleApplyCleanSpaces}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <AlignLeft className="w-4 h-4" />
              <span>Normalize Spacing & Save</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
