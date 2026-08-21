import React from 'react';
import { TypingAttempt } from '../../types';
import { formatSecondsToTime } from '../../utils/typingUtils';
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
} from 'lucide-react';

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

  const handleDownloadScorecard = () => {
    downloadCandidateTypingScorecardPdf(attempt, referencePassage);
  };

  const isHindi = attempt.language === 'HINDI_DEVLYS_010';
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
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                District Evaluation Cell • Rajsamand
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
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto typing-passage-scroll">
          {/* Candidate & Test Metadata Banner with Exam Date */}
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

          {/* Core Result Highlight: Net WPM & Qualified Status */}
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
                  Assessed on total correctly typed words in 10 minutes (Rajasthan Ministerial Guidelines)
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

          {/* Detailed Metric Cards (Word Breakdown) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Words</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {attempt.totalWordsInPara || 0}
              </span>
              <span className="text-[10px] text-slate-400">In reference para</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Correct Words</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {attempt.correctWordsCount || 0}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Accurately typed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
              <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Incorrect Words</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {attempt.incorrectWordsCount || 0}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400">Mistyped / Extra</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
              <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Untyped Words</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                {attempt.untypedWordsCount || 0}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">Remaining</span>
            </div>
          </div>

          {/* Speed & Accuracy Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Gross Speed</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {attempt.grossWpm || 0} <span className="text-xs font-normal text-slate-400">WPM</span>
              </div>
              <span className="text-[10px] text-slate-400">Raw typing keystrokes</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Calculated Accuracy</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {attempt.accuracyPercentage || 0}%
              </div>
              <span className="text-[10px] text-slate-400">Correct words / total typed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Time Utilized</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatSecondsToTime(attempt.timeTakenSeconds || 0)}{' '}
                <span className="text-xs font-normal text-slate-400">/ 10:00 max</span>
              </div>
              <span className="text-[10px] text-slate-400">Exam duration</span>
            </div>
          </div>

          {/* Reference Paragraph Preview */}
          {referencePassage && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reference Test Paragraph
              </span>
              <div
                className={`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-32 overflow-y-auto ${
                  isHindi ? 'font-devlys text-sm' : ''
                }`}
              >
                {referencePassage}
              </div>
            </div>
          )}

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
