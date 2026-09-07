import React, { useState } from 'react';
import { TypingTest, Candidate } from '../../types';
import { UserCheck, CheckSquare, Square, X, Search, Users, ShieldCheck, Ban } from 'lucide-react';

interface AssignTypingTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TypingTest;
  candidates: Candidate[];
  onSaveAssignment: (testId: string, assignedCandidateIds: string[]) => void;
}

export const AssignTypingTestModal: React.FC<AssignTypingTestModalProps> = ({
  isOpen,
  onClose,
  test,
  candidates,
  onSaveAssignment,
}) => {
  if (!isOpen || !test) return null;

  // Only candidates specifically registered for typing test module are eligible.
  // Candidates created in Candidate Directory module are excluded.
  const eligibleCandidates = candidates.filter((c) => {
    const isTypingCandidate =
      c.registeredModule === 'TYPING' || Boolean(c.typingMedium) || c.id.startsWith('cand-typ-');
    if (!isTypingCandidate) return false;
    return !c.typingMedium || c.typingMedium === test.language;
  });

  const initialAssigned = test.assignedCandidateIds || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialAssigned.length > 0 ? initialAssigned : eligibleCandidates.map((c) => c.id)
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = eligibleCandidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.registrationId || '').toLowerCase().includes(q) ||
      (c.designation || '').toLowerCase().includes(q) ||
      (c.officeName || '').toLowerCase().includes(q)
    );
  });

  const isAllSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((c) => selectedIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect filtered
      const filteredSet = new Set(filteredCandidates.map((c) => c.id));
      setSelectedIds(selectedIds.filter((id) => !filteredSet.has(id)));
    } else {
      // Select all filtered
      const newSet = new Set([...selectedIds, ...filteredCandidates.map((c) => c.id)]);
      setSelectedIds(Array.from(newSet));
    }
  };

  const handleToggleCandidate = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((candId) => candId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = () => {
    onSaveAssignment(test.id, selectedIds);
    onClose();
  };

  const isHindi = test.language === 'HINDI_DEVLYS_010';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                Candidate Assignment
              </div>
              <h2 className="text-base font-black tracking-tight">
                Assign Typing Paragraph to Candidates
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Test Paper Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Selected Assessment Paper
              </span>
              <h4 className={`text-sm font-black text-slate-900 dark:text-white ${isHindi ? 'font-devlys' : ''}`}>
                {test.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Medium: <strong className="text-amber-600">{isHindi ? 'Hindi (DevLys 010)' : 'English'}</strong> • Scheduled Date: {test.examDate || 'Today'} • {test.totalWords} words
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold whitespace-nowrap">
              {selectedIds.length} Assigned
            </span>
          </div>

          {/* Search & Bulk Select */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate by name, roll no, office..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Select All ({filteredCandidates.length})</span>
                </>
              )}
            </button>
          </div>

          {/* Candidates List */}
          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-500 space-y-1 text-xs">
              <p className="font-bold">No eligible candidates found matching search.</p>
              <p className="text-[11px] text-slate-400">
                Ensure candidates are registered with {isHindi ? 'Hindi' : 'English'} typing medium.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              {filteredCandidates.map((cand) => {
                const isSelected = selectedIds.includes(cand.id);
                return (
                  <div
                    key={cand.id}
                    onClick={() => handleToggleCandidate(cand.id)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-amber-600 flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{cand.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-normal">
                            ({cand.registrationId || cand.id})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {cand.designation || 'Candidate'} • {cand.officeName || 'Collectorate'}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      cand.typingMedium === 'HINDI_DEVLYS_010'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}>
                      {cand.typingMedium === 'HINDI_DEVLYS_010' ? 'Hindi' : 'English'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            <strong className="text-slate-900 dark:text-white">{selectedIds.length}</strong> candidates selected for access.
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={() => {
                // Revoke all: save empty array
                onSaveAssignment(test.id, []);
                onClose();
              }}
              title="Revoke assignment from all candidates (test won't be accessible by specific roll numbers)"
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Revoke All Assignments</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Save Assignment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
