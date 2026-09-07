import React, { useState } from 'react';
import { Candidate, TypingLanguage } from '../../types';
import {
  UserPlus,
  Search,
  Filter,
  Globe,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Key,
  ShieldCheck,
  UserCheck,
  Award,
} from 'lucide-react';

interface AdminTypingCandidatesViewProps {
  candidates: Candidate[];
  onOpenRegisterModal: () => void;
  onEditCandidate: (cand: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onToggleStatus: (cand: Candidate) => void;
}

export const AdminTypingCandidatesView: React.FC<AdminTypingCandidatesViewProps> = ({
  candidates,
  onOpenRegisterModal,
  onEditCandidate,
  onDeleteCandidate,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediumFilter, setMediumFilter] = useState<'ALL' | TypingLanguage>('ALL');
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);

  // Only candidates specifically registered for typing test are shown here.
  // Candidates created in Candidate Directory module MUST NOT be registered or visible for typing test.
  const typingCandidates = candidates.filter((c) => {
    return c.registeredModule === 'TYPING' || Boolean(c.typingMedium) || c.id.startsWith('cand-typ-');
  });

  // Filter candidates specifically registered or eligible for typing test
  const filteredCandidates = typingCandidates.filter((c) => {
    // Medium filter
    if (mediumFilter !== 'ALL' && c.typingMedium !== mediumFilter) {
      return false;
    }
    // Search query (name, email, regId, designation, office)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchReg = (c.registrationId || '').toLowerCase().includes(q);
      const matchDesig = (c.designation || '').toLowerCase().includes(q);
      const matchOffice = (c.officeName || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchReg || matchDesig || matchOffice;
    }
    return true;
  });

  const hindiCount = typingCandidates.filter((c) => c.typingMedium === 'HINDI_DEVLYS_010').length;
  const englishCount = typingCandidates.filter((c) => c.typingMedium === 'ENGLISH').length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Summary Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Typing Candidate Roll Management</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Registered Candidates for Typing Assessment
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
              Hindi (DevLys 010): <strong>{hindiCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/60 text-sky-800 dark:text-sky-300 text-xs font-bold">
              English Medium: <strong>{englishCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              Total: <strong>{candidates.length}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/25 active:scale-95 transition-all flex items-center justify-center space-x-2 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Candidate for Typing</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, Roll / Reg ID, designation, office name, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={mediumFilter}
            onChange={(e) => setMediumFilter(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">All Typing Mediums</option>
            <option value="HINDI_DEVLYS_010">Hindi (DevLys 010)</option>
            <option value="ENGLISH">English Medium</option>
          </select>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3">
          <UserCheck className="w-12 h-12 mx-auto text-slate-400" />
          <p className="font-bold text-sm">No typing test candidates found matching criteria</p>
          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
          >
            Register First Typing Candidate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((c) => {
            const isHindi = c.typingMedium === 'HINDI_DEVLYS_010' || (!c.typingMedium && false);
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Header: Medium Badge & Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.typingMedium === 'HINDI_DEVLYS_010'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          : 'bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300'
                      }`}
                    >
                      {c.typingMedium === 'HINDI_DEVLYS_010' ? 'Hindi (DevLys 010)' : 'English Medium'}
                    </span>

                    <button
                      onClick={() => onToggleStatus(c)}
                      title={c.activeStatus ? 'Click to disable' : 'Click to enable'}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        c.activeStatus
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {c.activeStatus ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Candidate Name & Roll ID */}
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {c.name}
                    </h4>
                    <p className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                      {c.registrationId || c.id}
                    </p>
                  </div>

                  {/* Designation & Office */}
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-semibold">{c.designation || 'Staff / Candidate'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.officeName || 'Rajsamand Administration'}</span>
                    </div>
                  </div>

                  {/* Email & Mobile Contact */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions or Delete Confirmation */}
                {deletingCandidateId === c.id ? (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 p-2.5 rounded-xl space-y-1.5 mt-2">
                    <p className="text-[11px] font-bold text-rose-800 dark:text-rose-300 text-center">
                      Delete "{c.name}"?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          onDeleteCandidate(c.id);
                          setDeletingCandidateId(null);
                        }}
                        className="flex-1 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCandidateId(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400">
                      Pass: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{c.password || 'Typing@123'}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditCandidate(c)}
                        title="Edit Candidate"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCandidateId(c.id)}
                        title="Delete Candidate"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
