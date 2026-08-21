import React from 'react';
import { Candidate, TestAttempt } from '../types';
import { Printer, Download, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ProgressReportModalProps {
  candidate: Candidate;
  attempts: TestAttempt[];
  onClose: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({ candidate, attempts, onClose }) => {
  const candidateAttempts = attempts.filter(
    (a) => a.candidateId === candidate.id || a.candidateEmail === candidate.email
  );

  const totalCompleted = candidateAttempts.length;
  const avgPercentage =
    totalCompleted > 0
      ? Math.round(candidateAttempts.reduce((sum, a) => sum + a.scorePercentage, 0) / totalCompleted)
      : 0;

  const passedCount = candidateAttempts.filter((a) => a.status === 'PASSED').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
        {/* Controls header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Official Candidate Progress Report
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Card Body */}
        <div id="printable-report" className="space-y-6">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-emerald-700 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-serif font-bold text-xl flex items-center justify-center mx-auto mb-2">
              RJ
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Rajsamand District Administration
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Government of Rajasthan • Candidate Performance & Progress Report Card
            </p>
          </div>

          {/* Particulars Grid */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Candidate Name:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{candidate.name}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Registration ID:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">{candidate.registrationId}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Contact Email:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{candidate.email}</span>
            </div>
          </div>

          {/* Assessment Summary Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Assessment Attempt Records
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2">Test Title</th>
                    <th className="px-3 py-2 text-center">Score</th>
                    <th className="px-3 py-2 text-center">Percentage</th>
                    <th className="px-3 py-2 text-center">Result Status</th>
                    <th className="px-3 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {candidateAttempts.length > 0 ? (
                    candidateAttempts.map((att) => (
                      <tr key={att.id}>
                        <td className="px-3 py-2 font-medium">{att.testTitle}</td>
                        <td className="px-3 py-2 text-center font-bold">
                          {att.scoreObtained} / {att.totalMarks}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-600">
                          {att.scorePercentage}%
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${att.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          {new Date(att.submittedAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        No official test attempts recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Verification */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between text-xs">
            <div>
              <p className="text-slate-400">Verified System Audit Log</p>
              <p className="font-mono text-[10px] text-slate-500">ID: RJ-DOC-{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>

            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-slate-200">District Assessment Officer</p>
              <p className="text-[10px] text-slate-500">Rajsamand, Rajasthan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
