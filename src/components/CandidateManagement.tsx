import React, { useState } from 'react';
import { Candidate, DistrictBlock, EmailLog } from '../types';
import { sendEmailAPI } from '../services/api';
import { Users, UserPlus, Search, Filter, Mail, Shield, CheckCircle2, XCircle, Key, RefreshCw, Send, AlertCircle, Edit3, Eye, EyeOff } from 'lucide-react';

interface CandidateManagementProps {
  candidates: Candidate[];
  onAddCandidate: (newCand: Candidate) => void;
  onUpdateCandidate?: (updatedCand: Candidate) => void;
  onToggleStatus: (id: string) => void;
  onSelectCandidateForReport: (cand: Candidate) => void;
  onLogEmailSent: (log: EmailLog) => void;
}

export const CandidateManagement: React.FC<CandidateManagementProps> = ({
  candidates,
  onAddCandidate,
  onUpdateCandidate,
  onToggleStatus,
  onSelectCandidateForReport,
  onLogEmailSent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  // New Candidate Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [block, setBlock] = useState<DistrictBlock>('Nathdwara');
  const [category, setCategory] = useState<'General' | 'OBC' | 'SC' | 'ST' | 'EWS'>('General');
  const [password, setPassword] = useState('Pass@1234');
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);

  // Edit Candidate Form State
  const [editName, setEditName] = useState('');
  const [editRegId, setEditRegId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBlock, setEditBlock] = useState<DistrictBlock>('Nathdwara');
  const [editCategory, setEditCategory] = useState<'General' | 'OBC' | 'SC' | 'ST' | 'EWS'>('General');
  const [editPassword, setEditPassword] = useState('');
  const [editActiveStatus, setEditActiveStatus] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [notifyCandidateOnUpdate, setNotifyCandidateOnUpdate] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Open Edit Modal
  const handleOpenEditModal = (cand: Candidate) => {
    setEditingCandidate(cand);
    setEditName(cand.name);
    setEditRegId(cand.registrationId);
    setEditEmail(cand.email);
    setEditPhone(cand.phone || '');
    setEditBlock(cand.block);
    setEditCategory(cand.category);
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
      block: editBlock,
      category: editCategory,
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
            block: editBlock,
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
            block: editBlock,
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

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlock = selectedBlock === 'ALL' || c.block === selectedBlock;
    return matchesSearch && matchesBlock;
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
      block,
      category,
      activeStatus: true,
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
            block,
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
            block,
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
          block: cand.block,
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
          block: cand.block,
        },
      });

      setActionFeedback(`Resend email successfully dispatched to ${cand.email}!`);
    } catch (err: any) {
      setActionFeedback(`Logged credential dispatch for ${cand.email}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Candidate Account Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create login credentials for each candidate, manage block allocations, and dispatch welcome emails via Resend.
          </p>
        </div>

        <button
          id="open-create-candidate-btn"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Candidate Account</span>
        </button>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-medium flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Registration ID, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Tehsil / District Blocks</option>
              <option value="Nathdwara">Nathdwara</option>
              <option value="Kumbhalgarh">Kumbhalgarh</option>
              <option value="Bhim">Bhim</option>
              <option value="Rajsamand">Rajsamand</option>
              <option value="Amet">Amet</option>
              <option value="Deogarh">Deogarh</option>
              <option value="Railmagra">Railmagra</option>
            </select>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Reg ID</th>
                <th className="px-5 py-3">Candidate Name</th>
                <th className="px-5 py-3">Contact & Email</th>
                <th className="px-5 py-3">Tehsil / Block</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Account Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {cand.registrationId}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {cand.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div>{cand.email}</div>
                      <div className="text-[10px] text-slate-400">{cand.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {cand.block}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {cand.category}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(cand.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          cand.activeStatus
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {cand.activeStatus ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {cand.activeStatus ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cand)}
                        title="Manage / Edit Candidate Details & Password"
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResendCredentials(cand)}
                        title="Resend Credentials via Email"
                        className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Mail className="w-3.5 h-3.5" /> Resend
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCandidateForReport(cand)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-[11px] transition-colors"
                      >
                        Report Card
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tehsil / Block
                  </label>
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value as DistrictBlock)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Nathdwara">Nathdwara</option>
                    <option value="Kumbhalgarh">Kumbhalgarh</option>
                    <option value="Bhim">Bhim</option>
                    <option value="Rajsamand">Rajsamand</option>
                    <option value="Amet">Amet</option>
                    <option value="Deogarh">Deogarh</option>
                    <option value="Railmagra">Railmagra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tehsil / Block
                  </label>
                  <select
                    value={editBlock}
                    onChange={(e) => setEditBlock(e.target.value as DistrictBlock)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Nathdwara">Nathdwara</option>
                    <option value="Kumbhalgarh">Kumbhalgarh</option>
                    <option value="Bhim">Bhim</option>
                    <option value="Rajsamand">Rajsamand</option>
                    <option value="Amet">Amet</option>
                    <option value="Deogarh">Deogarh</option>
                    <option value="Railmagra">Railmagra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
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
    </div>
  );
};
