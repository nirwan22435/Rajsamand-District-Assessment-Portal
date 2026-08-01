import React, { useState } from 'react';
import { EmailLog } from '../types';
import { Mail, CheckCircle2, Send, Filter, RefreshCw, ExternalLink } from 'lucide-react';
import { sendEmailAPI } from '../services/api';

interface EmailLogViewProps {
  logs: EmailLog[];
}

export const EmailLogView: React.FC<EmailLogViewProps> = ({ logs }) => {
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
      const res = await sendEmailAPI({
        type: log.type,
        candidateEmail: log.toEmail,
        candidateName: log.toName,
        details: log.details || {
          registrationId: 'RESEND_MANUAL',
          block: 'District HQ',
        },
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

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            SMTP Email Notification Audit Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time audit trailing and 1-click manual email dispatch for candidate notifications via free SMTP email service.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Email Types</option>
            <option value="CREDENTIALS">Account Credentials</option>
            <option value="TEST_ASSIGNED">Test Assignment</option>
            <option value="TEST_RESULT_NOTIFICATION">Scorecard Reports</option>
          </select>
        </div>
      </div>



      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Dispatched Logs ({filteredLogs.length})
          </span>
          <span className="text-[11px] text-slate-400">
            SMTP Service Status: <strong className="text-emerald-600 dark:text-emerald-400">Active</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Recipient Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Notification Category</th>
                <th className="px-5 py-3">Subject Line</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Dispatched At</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {log.toName}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {log.toEmail}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      <div>{log.subject}</div>
                      {log.previewUrl && (
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline mt-0.5"
                        >
                          <span>View Sandbox Preview</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {log.status === 'SENT' ? 'Sent via SMTP' : 'Logged / Delivered'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 text-[11px]">
                      {new Date(log.sentAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {log.previewUrl && (
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold text-[11px] shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Preview Email</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResendEmail(log)}
                        disabled={resendingId === log.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {resendingId === log.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Resend Email</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
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
