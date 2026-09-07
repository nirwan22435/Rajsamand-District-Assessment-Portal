import React, { useState } from 'react';
import { Candidate, DistrictBlock, EmailLog } from '../types';
import { sendEmailAPI } from '../services/api';
import { CandidateSuccessModal } from './CandidateSuccessModal';
import { Users, UserPlus, Search, Filter, Mail, Shield, CheckCircle2, XCircle, Key, RefreshCw, Send, AlertCircle, Edit3, Eye, EyeOff, Trash2 } from 'lucide-react';

interface CandidateManagementProps {
  candidates: Candidate[];
  onAddCandidate: (newCand: Candidate) => void;
  onUpdateCandidate?: (updatedCand: Candidate) => void;
  onDeleteCandidate?: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSelectCandidateForReport: (cand: Candidate) => void;
  onLogEmailSent: (log: EmailLog) => void;
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({
  candidates,
  onAddCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  onToggleStatus,
  onSelectCandidateForReport,
  onLogEmailSent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);

  // New Candidate Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Pass@1234');
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);

  // Edit Candidate Form State
  const [editName, setEditName] = useState('');
  const [editRegId, setEditRegId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editActiveStatus, setEditActiveStatus] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [notifyCandidateOnUpdate, setNotifyCandidateOnUpdate] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [createdCandidateModalData, setCreatedCandidateModalData] = useState<{
    isOpen: boolean;
    candidate: Candidate | null;
    emailSent: boolean;
  }>({
    isOpen: false,
    candidate: null,
    emailSent: true,
  });

  // Open Edit Modal
  const handleOpenEditModal = (cand: Candidate) => {
    setEditingCandidate(cand);
    setEditName(cand.name);
    setEditRegId(cand.registrationId);
    setEditEmail(cand.email);
    setEditPhone(cand.phone || '');
    setEditPassword(cand.password || 'Pass@1234');
    setEditActiveStatus(cand.activeStatus);
    setShowEditPassword(false);
  };

  // Submit Edit Candidate Handler
  const handleSaveEditedCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate || !editName || !editEmail) return;

    setIsSubmitting(true);
    setActionFeedback(null);

    const updatedCand: Candidate = {
      ...editingCandidate,
      name: editName,
      registrationId: editRegId || editingCandidate.registrationId,
      email: editEmail,
      phone: editPhone,
      password: editPassword,
      activeStatus: editActiveStatus,
    };

    if (onUpdateCandidate) {
      onUpdateCandidate(updatedCand);
    }

    if (notifyCandidateOnUpdate) {
      try {
        const res = await sendEmailAPI({
          type: 'CREDENTIALS',
          candidateEmail: editEmail,
          candidateName: editName,
          details: {
            registrationId: editRegId || editingCandidate.registrationId,
            password: editPassword,
          },
        });

        onLogEmailSent({
          id: `log-${Date.now()}`,
          toEmail: editEmail,
          toName: editName,
          type: 'CREDENTIALS',
          subject: '🔐 Updated Account Credentials - Rajsamand Assessment Portal',
          sentAt: new Date().toISOString(),
          status: (res.sentRealEmail || res.smtpMessageId || res.etherealPreviewUrl) ? 'SENT' : 'SIMULATED',
          previewUrl: res.etherealPreviewUrl || undefined,
          details: {
            registrationId: editRegId || editingCandidate.registrationId,
            password: editPassword,
          },
        });

        setActionFeedback(`Candidate account updated & login details emailed to ${editEmail}`);
      } catch (err) {
        setActionFeedback(`Candidate account updated successfully!`);
      }
    } else {
      setActionFeedback(`Candidate details and password for ${editName} updated successfully!`);
    }

    setIsSubmitting(false);
    setEditingCandidate(null);
  };

  // Only candidates registered for General/District Assessment belong to Candidate Directory.
  // Candidates registered on Typing Test module are strictly visible only on Typing Test module.
  const directoryCandidates = candidates.filter(
    (c) => c.registeredModule !== 'TYPING' && !c.typingMedium && !c.id.startsWith('cand-typ-')
  );

  // Filter candidates for display table
  const filteredCandidates = directoryCandidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Create New Candidate Handler
  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    setActionFeedback(null);

    const newRegistrationId = `RJ-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      registrationId: newRegistrationId,
      name,
      email,
      phone: phone || '+91 98000 00000',
      activeStatus: true,
      registeredModule: 'ASSESSMENT',
      password,
      createdAt: new Date().toISOString(),
    };

    onAddCandidate(newCand);

    // Send Resend Email Credentials if toggled
    if (sendCredentialsEmail) {
      try {
        const emailRes = await sendEmailAPI({
          type: 'CREDENTIALS',
          candidateEmail: email,
          candidateName: name,
          details: {
            registrationId: newRegistrationId,
            password,
            portalUrl: window.location.origin,
            portalLoginUrl: `${window.location.origin}/?login=true&regId=${encodeURIComponent(newRegistrationId)}`,
          },
        });

        onLogEmailSent({
          id: `log-${Date.now()}`,
          toEmail: email,
          toName: name,
          type: 'CREDENTIALS',
          subject: '🔐 Account Login Credentials - Rajsamand District Assessment Portal',
          sentAt: new Date().toISOString(),
          status: (emailRes.sentRealEmail || emailRes.smtpMessageId || emailRes.etherealPreviewUrl) ? 'SENT' : 'SIMULATED',
          previewUrl: emailRes.etherealPreviewUrl || undefined,
          details: {
            registrationId: newRegistrationId,
            password,
          },
        });

        setActionFeedback(`Candidate account created! Login email dispatched to ${email}`);
      } catch (err) {
        console.error('Error sending credential email:', err);
        setActionFeedback(`Candidate account created! Note: Email delivery was logged locally.`);
      }
    } else {
      setActionFeedback(`Candidate account created successfully!`);
    }

    setIsSubmitting(false);
    setShowCreateModal(false);
    setCreatedCandidateModalData({
      isOpen: true,
      candidate: newCand,
      emailSent: sendCredentialsEmail,
    });
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
  };

  // Dispatch Credential Email Manual Trigger
  const handleResendCredentials = async (cand: Candidate) => {
    setActionFeedback(`Sending credential email to ${cand.email}...`);
    try {
      const res = await sendEmailAPI({
        type: 'CREDENTIALS',
        candidateEmail: cand.email,
        candidateName: cand.name,
        details: {
          registrationId: cand.registrationId || cand.id,
          password: cand.password,
          portalUrl: window.location.origin,
          portalLoginUrl: `${window.location.origin}/?login=true&regId=${encodeURIComponent(cand.registrationId || cand.id)}`,
        },
      });

      onLogEmailSent({
        id: `log-${Date.now()}`,
        toEmail: cand.email,
        toName: cand.name,
        type: 'CREDENTIALS',
        subject: '🔐 Resent Login Credentials - Rajsamand District Assessment Portal',
        sentAt: new Date().toISOString(),
        status: (res.sentRealEmail || res.smtpMessageId || res.etherealPreviewUrl) ? 'SENT' : 'SIMULATED',
        previewUrl: res.etherealPreviewUrl || undefined,
        details: {
          registrationId: cand.registrationId || cand.id,
          password: cand.password,
        },
      });

      setActionFeedback(`Resend email successfully dispatched to ${cand.email}!`);
    } catch (err: any) {
      setActionFeedback(`Logged credential dispatch for ${cand.email}`);
    }
  };

  // Statistics for Candidate Directory
  const totalDirectoryCandidates = directoryCandidates.length;
  const activeCount = directoryCandidates.filter((c) => c.activeStatus).length;
  const disabledCount = directoryCandidates.filter((c) => !c.activeStatus).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-950/40 shrink-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Candidate Directory & Access Control</h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Create login credentials, manage candidate accounts, and dispatch notification emails.
            </p>
          </div>
        </div>

        <button
          id="open-create-candidate-btn"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Register New Candidate</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Candidates
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalDirectoryCandidates}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Active Accounts
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {activeCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Disabled Accounts
          </p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 tabular-nums">
            {disabledCount}
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl bg-sky-50/90 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Registration ID, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Reg ID</th>
                <th className="px-5 py-3.5">Candidate Name</th>
                <th className="px-5 py-3.5">Contact & Email</th>
                <th className="px-5 py-3.5 text-center">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {cand.registrationId}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {cand.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{cand.email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cand.phone || 'No phone added'}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(cand.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${
                          cand.activeStatus
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {cand.activeStatus ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{cand.activeStatus ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {deletingCandidateId === cand.id ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Delete?</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteCandidate) onDeleteCandidate(cand.id);
                              setDeletingCandidateId(null);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCandidateId(null)}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] cursor-pointer"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cand)}
                            title="Manage / Edit Candidate Details & Password"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors inline-flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResendCredentials(cand)}
                            title="Resend Credentials via Email"
                            className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors inline-flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" /> <span>Resend</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectCandidateForReport(cand)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                          >
                            Report
                          </button>
                          {onDeleteCandidate && (
                            <button
                              type="button"
                              onClick={() => setDeletingCandidateId(cand.id)}
                              title="Delete Candidate"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors inline-flex items-center font-semibold text-[11px] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No candidates found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Candidate Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Create Candidate Credentials
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address * (For Resend Email Delivery)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmail('devkarannirwan01@gmail.com')}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Use devkarannirwan01@gmail.com
                  </button>
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. devkarannirwan01@gmail.com or candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  💡 <strong>Direct Email Delivery:</strong> Notifications and test scorecards are dispatched directly to the candidate's specified email address with admin reply-to set to <code>devkarannirwan01@gmail.com</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="sendEmailCheck"
                  checked={sendCredentialsEmail}
                  onChange={(e) => setSendCredentialsEmail(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="sendEmailCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Dispatch Credentials Notification via Resend Email
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage & Edit Candidate Details Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                Edit Candidate Profile & Password
              </h3>
              <button
                type="button"
                onClick={() => setEditingCandidate(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedCandidate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRegId}
                    onChange={(e) => setEditRegId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditActiveStatus(!editActiveStatus)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      editActiveStatus
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {editActiveStatus ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {editActiveStatus ? 'Active Account' : 'Account Disabled'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile / Contact Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Password Management */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" /> Candidate Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Update candidate login password. The candidate will use this updated password to sign in.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyUpdateCheck"
                  checked={notifyCandidateOnUpdate}
                  onChange={(e) => setNotifyCandidateOnUpdate(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="notifyUpdateCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Send updated credentials notification email to candidate
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving Changes...' : 'Save Candidate Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creative Candidate Success Modal */}
      <CandidateSuccessModal
        isOpen={createdCandidateModalData.isOpen}
        onClose={() => setCreatedCandidateModalData((prev) => ({ ...prev, isOpen: false }))}
        candidate={createdCandidateModalData.candidate}
        emailSent={createdCandidateModalData.emailSent}
        onResendEmail={handleResendCredentials}
      />
    </div>
  );
};
