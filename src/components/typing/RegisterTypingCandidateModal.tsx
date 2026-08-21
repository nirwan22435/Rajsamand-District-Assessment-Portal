import React, { useState, useEffect } from 'react';
import { Candidate, DistrictBlock, TypingLanguage } from '../../types';
import { X, User, Briefcase, Building2, Globe, Mail, Phone, Lock, Hash, CheckCircle2, Shield } from 'lucide-react';

interface RegisterTypingCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCandidate: (candidate: Candidate) => Promise<void> | void;
  candidateToEdit?: Candidate | null;
  existingCount?: number;
}

const DISTRICT_BLOCKS: DistrictBlock[] = [
  'Rajsamand',
  'Nathdwara',
  'Kumbhalgarh',
  'Bhim',
  'Amet',
  'Deogarh',
  'Railmagra',
  'District-Wide',
];

const STANDARD_DESIGNATIONS = [
  'Junior Assistant (LDC / Clerk Gr-II)',
  'Informatics Assistant (IA)',
  'Stenographer / Personal Assistant',
  'Data Entry Operator (DEO)',
  'Assistant Section Officer (ASO)',
  'Patwari / Land Records Staff',
  'Computer Operator',
  'Contractual / Temporary Staff',
  'Other Official Designation',
];

const STANDARD_OFFICES = [
  'District Collectorate, Rajsamand',
  'SDM Office, Nathdwara',
  'SDM Office, Kumbhalgarh',
  'SDM Office, Bhim',
  'SDM Office, Amet',
  'SDM Office, Deogarh',
  'SDM Office, Railmagra',
  'Tehsil Office, Rajsamand',
  'District Treasury Office, Rajsamand',
  'Zila Parishad, Rajsamand',
  'Municipal Council (Nagar Parishad), Rajsamand',
  'Other Departmental Office',
];

export const RegisterTypingCandidateModal: React.FC<RegisterTypingCandidateModalProps> = ({
  isOpen,
  onClose,
  onSaveCandidate,
  candidateToEdit,
  existingCount = 0,
}) => {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Junior Assistant (LDC / Clerk Gr-II)');
  const [customDesignation, setCustomDesignation] = useState('');
  const [officeName, setOfficeName] = useState('District Collectorate, Rajsamand');
  const [customOffice, setCustomOffice] = useState('');
  const [typingMedium, setTypingMedium] = useState<TypingLanguage>('HINDI_DEVLYS_010');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [block, setBlock] = useState<DistrictBlock>('Rajsamand');
  const [registrationId, setRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [activeStatus, setActiveStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (candidateToEdit) {
      setName(candidateToEdit.name);
      setDesignation(candidateToEdit.designation || 'Junior Assistant (LDC / Clerk Gr-II)');
      setOfficeName(candidateToEdit.officeName || 'District Collectorate, Rajsamand');
      setTypingMedium(candidateToEdit.typingMedium || 'HINDI_DEVLYS_010');
      setEmail(candidateToEdit.email);
      setPhone(candidateToEdit.phone);
      setBlock(candidateToEdit.block);
      setRegistrationId(candidateToEdit.registrationId);
      setPassword(candidateToEdit.password || 'Typing@123');
      setActiveStatus(candidateToEdit.activeStatus);
    } else {
      const generatedId = `TYP-2026-${String(existingCount + 1).padStart(3, '0')}`;
      setName('');
      setDesignation('Junior Assistant (LDC / Clerk Gr-II)');
      setCustomDesignation('');
      setOfficeName('District Collectorate, Rajsamand');
      setCustomOffice('');
      setTypingMedium('HINDI_DEVLYS_010');
      setEmail('');
      setPhone('+91 98290 ');
      setBlock('Rajsamand');
      setRegistrationId(generatedId);
      setPassword('Typing@123');
      setActiveStatus(true);
    }
    setErrorMessage(null);
  }, [candidateToEdit, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter candidate name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter valid email address.');
      return;
    }

    if (!registrationId.trim()) {
      setErrorMessage('Please provide candidate registration/roll number.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please specify candidate login password.');
      return;
    }

    const finalDesignation =
      designation === 'Other Official Designation' && customDesignation.trim()
        ? customDesignation.trim()
        : designation;

    const finalOffice =
      officeName === 'Other Departmental Office' && customOffice.trim()
        ? customOffice.trim()
        : officeName;

    setIsSubmitting(true);
    try {
      const candData: Candidate = {
        id: candidateToEdit ? candidateToEdit.id : `cand-typ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: name.trim(),
        designation: finalDesignation,
        officeName: finalOffice,
        typingMedium,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        block,
        registrationId: registrationId.trim().toUpperCase(),
        password: password.trim(),
        activeStatus,
        createdAt: candidateToEdit ? candidateToEdit.createdAt : new Date().toISOString(),
      };

      await onSaveCandidate(candData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save typing candidate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                District Evaluation Cell • Rajsamand
              </div>
              <h2 className="text-lg font-black tracking-tight">
                {candidateToEdit ? 'Edit Typing Candidate Registration' : 'Register Candidate for Typing Test'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto typing-passage-scroll">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Row 1: Candidate Name & Medium of Typing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" />
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar Verma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                Medium of Typing (Hindi / English) *
              </label>
              <select
                value={typingMedium}
                onChange={(e) => setTypingMedium(e.target.value as TypingLanguage)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-300 text-xs font-extrabold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="HINDI_DEVLYS_010">Hindi (DevLys 010 Font - Remington)</option>
                <option value="ENGLISH">English Typing Test</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Candidate will strictly see passages matching this registered medium upon login.
              </p>
            </div>
          </div>

          {/* Row 2: Designation & Office Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                Candidate Designation *
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none mb-1.5"
              >
                {STANDARD_DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {designation === 'Other Official Designation' && (
                <input
                  type="text"
                  value={customDesignation}
                  onChange={(e) => setCustomDesignation(e.target.value)}
                  placeholder="Specify official designation"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Office / Department Name *
              </label>
              <select
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none mb-1.5"
              >
                {STANDARD_OFFICES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {officeName === 'Other Departmental Office' && (
                <input
                  type="text"
                  value={customOffice}
                  onChange={(e) => setCustomOffice(e.target.value)}
                  placeholder="Enter office / branch name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              )}
            </div>
          </div>

          {/* Row 3: Email & Mobile Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                Email Address (Login Username) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@rajsamand.gov.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                Mobile Contact Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98290 XXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Roll / Registration ID & Candidate Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
            <div>
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-600" />
                Roll / Registration ID *
              </label>
              <input
                type="text"
                required
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="TYP-2026-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Candidate Password *
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Typing@123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="activeStatusTyping"
              checked={activeStatus}
              onChange={(e) => setActiveStatus(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <label htmlFor="activeStatusTyping" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Candidate Account (Allowed to Log In and Take Typing Test)
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{candidateToEdit ? 'Update Candidate' : 'Register Candidate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
