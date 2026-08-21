import React, { useState } from 'react';
import { EmailLog, Candidate } from '../types';
import { Mail, CheckCircle2, Send, Filter, RefreshCw, ExternalLink } from 'lucide-react';
import { sendEmailAPI } from '../services/api';

interface EmailLogViewProps {
  logs: EmailLog[];
  candidates?: Candidate[];
}

export const EmailLogView: React.FC<EmailLogViewProps> = ({ logs, candidates = [] }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    return filterType === 'ALL' || log.type === filterType;
  });

  const handleResendEmail = async (log: EmailLog) => {
    setResendingId(log.id);
    setToastMessage(null);
    try {
      const matchedCand = candidates.find(
        (c) => c.email.toLowerCase() === log.toEmail.toLowerCase()
      );

      const detailsToSend = {
        ...log.details,
        registrationId:
          log.details?.registrationId ||
          matchedCand?.registrationId ||
          matchedCand?.id ||
          'RJ-2026-REG',
        password:
          log.details?.password ||
          matchedCand?.password ||
          'Pass@1234',
      };

      const res = await sendEmailAPI({
        type: log.type,
        candidateEmail: log.toEmail,
        candidateName: log.toName,
        details: detailsToSend,
      });

      setToastMessage(
        res.message || `Email notification successfully resent to ${log.toEmail}!`
      );
    } catch (err: any) {
      setToastMessage(`Email resend logged for ${log.toEmail}`);
    } finally {
      setResendingId(null);
    }
  };

  const credentialsCount = logs.filter((l) => l.type === 'CREDENTIALS').length;
  const testAssignedCount = logs.filter((l) => l.type === 'TEST_ASSIGNED').length;
  const resultNotificationCount = logs.filter((l) => l.type === 'TEST_RESULT_NOTIFICATION').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5" />
            Automated Dispatch & Notification Audit Trail
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notification & Email Audit Logs</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Real-time audit log of candidate credentials, assessment assignments, and PDF scorecards dispatched via SMTP.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-black/30 border border-white/10 p-2 rounded-xl backdrop-blur-xs self-start sm:self-auto">
          <Filter className="w-4 h-4 text-emerald-400 ml-1.5" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-white text-xs font-bold focus:outline-none pr-2 cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">All Categories ({logs.length})</option>
            <option value="CREDENTIALS" className="bg-slate-900 text-white">Credentials ({credentialsCount})</option>
            <option value="TEST_ASSIGNED" className="bg-slate-900 text-white">Test Assignment ({testAssignedCount})</option>
            <option value="TEST_RESULT_NOTIFICATION" className="bg-slate-900 text-white">Scorecards ({resultNotificationCount})</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Dispatched
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {logs.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Credentials Sent
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {credentialsCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Assessment Alerts
          </p>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
            {testAssignedCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Scorecard Reports
          </p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
            {resultNotificationCount}
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Dispatched Notification Logs ({filteredLogs.length})
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Delivery Protocol: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Standard SMTP / API</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Recipient Name</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Notification Category</th>
                <th className="px-5 py-3.5">Subject Line</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Dispatched At</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {log.toName}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-medium">
                      {log.toEmail}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 uppercase">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 max-w-xs truncate font-medium">
                      <div>{log.subject}</div>
                      {log.previewUrl && (
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-0.5"
                        >
                          <span>View Sandbox Preview</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.status === 'SENT' ? 'Sent via SMTP' : 'Delivered'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                      {new Date(log.sentAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      {log.previewUrl && (
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Preview</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResendEmail(log)}
                        disabled={resendingId === log.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-[11px] shadow-xs transition-all inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {resendingId === log.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Resend</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No email logs match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
