import React, { useState } from 'react';
import { TypingAttempt } from '../../types';
import { formatSecondsToTime, getDetailedWordAnalysis } from '../../utils/typingUtils';
import { downloadCandidateTypingScorecardPdf } from '../../utils/pdfGenerator';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  X,
  ShieldCheck,
  BarChart2,
  Calendar,
  Building2,
  AlertTriangle,
  Check,
  HelpCircle,
  Plus,
  Minus,
} from 'lucide-react';

const RESULT_FONT_SIZES = [
  { id: 'text-xs', label: '12px' },
  { id: 'text-sm', label: '14px' },
  { id: 'text-base', label: '16px' },
  { id: 'text-lg', label: '18px' },
  { id: 'text-xl', label: '20px' },
  { id: 'text-2xl', label: '24px' },
  { id: 'text-3xl', label: '30px' },
] as const;

interface TypingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: TypingAttempt;
  referencePassage?: string;
}

export const TypingResultModal: React.FC<TypingResultModalProps> = ({
  isOpen,
  onClose,
  attempt,
  referencePassage,
}) => {
  if (!isOpen || !attempt) return null;

  const [activeTab, setActiveTab] = useState<'paragraph' | 'correct' | 'incorrect' | 'skipped'>('paragraph');
  const [highlightMode, setHighlightMode] = useState<boolean>(true);
  const isHindi = attempt.language === 'HINDI_DEVLYS_010';
  const [passageFontSizeIndex, setPassageFontSizeIndex] = useState<number>(isHindi ? 2 : 1);

  const analysis = getDetailedWordAnalysis(attempt, referencePassage);

  const handleDownloadScorecard = () => {
    downloadCandidateTypingScorecardPdf(attempt, referencePassage || analysis.referencePassage);
  };

  const isQualified = attempt.status === 'QUALIFIED';

  const examDateFormatted = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                District Administration • Rajsamand
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Typing Assessment Scorecard
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Exam Date: {examDateFormatted}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Download Report Button */}
            <button
              onClick={handleDownloadScorecard}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download Official Scorecard PDF"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto typing-passage-scroll">
          {/* Candidate & Test Metadata Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Candidate Name</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{attempt.candidateName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Roll No / Reg ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {attempt.registrationId || attempt.candidateId}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Exam Date</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{examDateFormatted}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Language Medium</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {isHindi ? 'Hindi (DevLys 010)' : 'English Typing'}
              </span>
            </div>
          </div>

          {/* Core Result Highlight */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isQualified
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isQualified ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {isQualified ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <div className="text-xs uppercase font-black tracking-wider text-slate-500">
                  Official Merit Assessment
                </div>
                <h3
                  className={`text-xl font-black ${
                    isQualified ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {isQualified ? 'QUALIFIED IN TYPING ASSESSMENT' : 'NOT QUALIFIED (BELOW REQUIRED CORRECT WORDS)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assessed on total correctly typed words in 10 minutes
                </p>
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 font-bold uppercase">Net Typing Speed</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {attempt.netWpm}{' '}
                <span className="text-sm font-bold text-slate-500">WPM</span>
              </div>
            </div>
          </div>

          {/* Primary Metric Cards (Word Breakdown) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Words in Para</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {analysis.totalWordsInPara}
              </span>
              <span className="text-[10px] text-slate-400">Reference passage</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Correct Words</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {analysis.correctWordsCount}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Correctly typed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
              <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Incorrect Words</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {analysis.incorrectWordsCount}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400">Mistyped / Extra</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
              <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Skipped Words</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                {analysis.skippedWordsCount}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">Omitted from para</span>
            </div>
          </div>

          {/* Speed & Accuracy Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Gross Speed</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {attempt.grossWpm || 0} <span className="text-xs font-normal text-slate-400">WPM</span>
              </div>
              <span className="text-[10px] text-slate-400">Raw keystrokes speed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Calculated Accuracy</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {analysis.accuracyPercentage}%
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                total correctly typed words / total words in reference paragraph
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Time Utilized</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatSecondsToTime(attempt.timeTakenSeconds || 0)}{' '}
                <span className="text-xs font-normal text-slate-400">/ 10:00 max</span>
              </div>
              <span className="text-[10px] text-slate-400">Assessment duration</span>
            </div>
          </div>

          {/* Word Analysis Navigation Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveTab('paragraph')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'paragraph'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Reference Paragraph ({analysis.totalWordsInPara})</span>
                </button>

                <button
                  onClick={() => setActiveTab('correct')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'correct'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Correctly Typed ({analysis.correctWordsCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('incorrect')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'incorrect'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Incorrectly Typed ({analysis.incorrectWordsCount})</span>
                </button>

                <button
                  onClick={() => setActiveTab('skipped')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'skipped'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Skipped Words ({analysis.skippedWordsCount})</span>
                </button>
              </div>

              {/* Font Size Adjuster for Reference Passage / Attempt Viewer */}
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPassageFontSizeIndex((i) => Math.max(0, i - 1))}
                  disabled={passageFontSizeIndex <= 0}
                  title="Decrease font size"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400 min-w-[32px] text-center">
                  {RESULT_FONT_SIZES[passageFontSizeIndex].label}
                </span>
                <button
                  type="button"
                  onClick={() => setPassageFontSizeIndex((i) => Math.min(RESULT_FONT_SIZES.length - 1, i + 1))}
                  disabled={passageFontSizeIndex >= RESULT_FONT_SIZES.length - 1}
                  title="Increase font size"
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeTab === 'paragraph' && (
                <button
                  onClick={() => setHighlightMode(!highlightMode)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-colors border ${
                    highlightMode
                      ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-300'
                      : 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {highlightMode ? '✓ Highlights Active' : 'Plain Text'}
                </button>
              )}
            </div>

            {/* Tab 1: Reference Paragraph */}
            {activeTab === 'paragraph' && (
              <div className="space-y-2">
                <div
                  className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 leading-relaxed max-h-56 overflow-y-auto typing-passage-scroll ${
                    isHindi ? 'font-devlys' : 'font-sans'
                  } ${RESULT_FONT_SIZES[passageFontSizeIndex].id}`}
                >
                  {highlightMode && analysis.wordStatuses.length > 0 ? (
                    <div className="flex flex-wrap gap-x-1.5 gap-y-2">
                      {analysis.wordStatuses.map((item, idx) => {
                        let badgeClass = 'text-slate-700 dark:text-slate-300';
                        if (item.status === 'CORRECT') {
                          badgeClass =
                            'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800';
                        } else if (item.status === 'INCORRECT') {
                          badgeClass =
                            'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800';
                        } else if (item.status === 'SKIPPED' || item.status === 'UNTYPED') {
                          badgeClass =
                            'bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 line-through opacity-80 px-1.5 py-0.5 rounded border border-amber-300/60 dark:border-amber-800/60';
                        }
                        return (
                          <span key={idx} className={badgeClass} title={`#${idx + 1}: ${item.status}`}>
                            {item.refWord}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 select-text whitespace-pre-wrap">
                      {analysis.referencePassage || 'No reference passage available.'}
                    </p>
                  )}
                </div>
                {highlightMode && (
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Correctly Typed</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>Incorrectly Typed</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      <span>Skipped Word</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Correctly Typed Words */}
            {activeTab === 'correct' && (
              <div className="space-y-2">
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 max-h-56 overflow-y-auto typing-passage-scroll">
                  {analysis.correctWords.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No words correctly typed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.correctWords.map((word, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 text-xs ${
                            isHindi ? 'font-devlys' : ''
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  Total {analysis.correctWords.length} correctly typed words out of {analysis.totalWordsInPara} in reference paragraph.
                </div>
              </div>
            )}

            {/* Tab 3: Incorrectly Typed Words */}
            {activeTab === 'incorrect' && (
              <div className="space-y-2">
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 max-h-56 overflow-y-auto typing-passage-scroll">
                  {analysis.incorrectWords.length === 0 ? (
                    <div className="text-center py-6 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Zero Incorrect Words! 100% precision on typed words.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysis.incorrectWords.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected</span>
                            <span className={`font-bold text-slate-800 dark:text-slate-200 ${isHindi ? 'font-devlys' : ''}`}>
                              {item.refWord}
                            </span>
                          </div>
                          <span className="text-slate-400 text-xs">→</span>
                          <div className="text-right">
                            <span className="text-[10px] text-rose-500 uppercase font-bold block">Typed</span>
                            <span className={`font-bold text-rose-600 dark:text-rose-400 ${isHindi ? 'font-devlys' : ''}`}>
                              {item.typedWord || '(Missing)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  Total {analysis.incorrectWords.length} mistyped or extra words recorded during assessment.
                </div>
              </div>
            )}

            {/* Tab 4: Skipped Words */}
            {activeTab === 'skipped' && (
              <div className="space-y-2">
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 max-h-56 overflow-y-auto typing-passage-scroll">
                  {analysis.skippedWords.length === 0 ? (
                    <div className="text-center py-6 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>No words skipped! All reference words were attempted.</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skippedWords.map((word, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800 text-xs ${
                            isHindi ? 'font-devlys' : ''
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  Total {analysis.skippedWords.length} words omitted or not reached in reference paragraph.
                </div>
              </div>
            )}
          </div>

          {/* Official Verification Footer */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>District Evaluation & Assessment Cell, Rajsamand</span>
            </div>
            <div className="font-mono text-[11px]">
              Verified On: {examDateFormatted}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
