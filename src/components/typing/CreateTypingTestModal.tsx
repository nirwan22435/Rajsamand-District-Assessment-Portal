import React, { useState, useEffect, useMemo } from 'react';
import { TypingTest, TypingLanguage, DistrictBlock } from '../../types';
import { convertUnicodeToDevlys } from '../../utils/devlysConverter';
import { countWords } from '../../utils/typingUtils';
import { auditAndRefinePassage } from '../../utils/passageSanitizer';
import {
  FileText,
  X,
  Sparkles,
  Calendar,
  Send,
  Save,
  CheckCircle2,
  RefreshCw,
  Award,
  AlertTriangle,
  Wand2,
} from 'lucide-react';

interface CreateTypingTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (test: TypingTest) => void;
  initialTest?: TypingTest | null;
}

const DISTRICT_BLOCKS: DistrictBlock[] = [
  'District-Wide',
  'Nathdwara',
  'Kumbhalgarh',
  'Bhim',
  'Rajsamand',
  'Amet',
  'Deogarh',
  'Railmagra',
];

const ENGLISH_PRESET_PARAGRAPH =
  'The District Administration of Rajsamand is committed to ensuring prompt, transparent, and accountable delivery of public services to all citizens. Under the visionary governance model of the Government of Rajasthan, various administrative reforms and e-governance initiatives have been successfully implemented across all seven tehsils. The objective of this official speed assessment is to evaluate the computer typing proficiency, accuracy, and operational agility of ministerial candidates. Efficient document drafting and rapid data entry play a vital role in government offices, particularly in citizen-centric portals such as e-Mitra, Jan Soochna Portal, and Rajasthan Sampark grievance redressal portal. All participating candidates must maintain consistent rhythm and strict adherence to punctuation throughout the allotted duration of ten minutes.';

const HINDI_DEVLYS_PRESET_PARAGRAPH =
  'jktLFkku ljdkj ds ftyk iz\'kklu jktlean }kjk lHkh ukxfjdksa dks le;c) ,oa ikjn\'khZ lsok,a miyC/k djkus gsrq fujUrj iz;kl fd, tk jgs gSaA ftyk dysDVj dk;kZy; esa bZ&fe=] tu lwpuk iksVZy ,oa tu vHkko vfHk;ksx fujkdj.k gsrq fo\'ks"k O;oLFkk dh xbZ gSA ftyk iz\'kklu }kjk fofHkUu fodkl ;kstukvksa dk fØ;kUo;u xzkeh.k ,oa \'kgjh {ks=ksa esa izHkkoh <ax ls fd;k tk jgk gSA bl n{krk ewY;kadu ijh{kk esa lHkh vH;fFkZ;ksa dh xfr ,oa \'kq)rk dk ewY;kadu jkT; ljdkj ds ekudksa ds vuqlkj fd;k tk,xkA vH;FkhZ /;kuiwoZd Vkbi djsa rFkk le; lhek dk fo\'ks"k /;ku j[ksaA';

export const CreateTypingTestModal: React.FC<CreateTypingTestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTest,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(initialTest?.title || '');
  const [heading, setHeading] = useState(initialTest?.heading || '');
  const [examDate, setExamDate] = useState<string>(initialTest?.examDate || todayStr);
  const [language, setLanguage] = useState<TypingLanguage>(initialTest?.language || 'ENGLISH');
  const [durationMinutes, setDurationMinutes] = useState<number>(initialTest?.durationMinutes || 10);
  const [targetBlock, setTargetBlock] = useState<DistrictBlock>(initialTest?.targetBlock || 'District-Wide');
  const [minPassingWpm, setMinPassingWpm] = useState<number>(
    initialTest?.minPassingWpm || (initialTest?.language === 'HINDI_DEVLYS_010' ? 25 : 30)
  );
  const [minCorrectWords, setMinCorrectWords] = useState<number>(
    initialTest?.minCorrectWords ||
      (initialTest?.minPassingWpm ? initialTest.minPassingWpm * 10 : initialTest?.language === 'HINDI_DEVLYS_010' ? 250 : 300)
  );
  const [passageText, setPassageText] = useState<string>(initialTest?.passageText || '');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>(initialTest?.status || 'PUBLISHED');
  const [instructions, setInstructions] = useState<string>(
    initialTest?.instructions ||
      'Type the paragraph accurately within the 10-minute time limit. Backspace is allowed.'
  );
  const [unicodeInput, setUnicodeInput] = useState<string>('');
  const [showConverter, setShowConverter] = useState<boolean>(false);

  const wordCount = countWords(passageText);

  // Sync minCorrectWords when minPassingWpm or duration changes
  const handleWpmChange = (newWpm: number) => {
    setMinPassingWpm(newWpm);
    setMinCorrectWords(newWpm * (durationMinutes || 10));
  };

  const handleMinCorrectWordsChange = (newWords: number) => {
    setMinCorrectWords(newWords);
    const calculatedWpm = Math.max(1, Math.round(newWords / (durationMinutes || 10)));
    setMinPassingWpm(calculatedWpm);
  };

  // Handle language switch
  const handleLanguageChange = (newLang: TypingLanguage) => {
    setLanguage(newLang);
    if (!initialTest) {
      if (newLang === 'HINDI_DEVLYS_010') {
        handleWpmChange(25);
        if (!passageText || passageText === ENGLISH_PRESET_PARAGRAPH) {
          setPassageText(HINDI_DEVLYS_PRESET_PARAGRAPH);
        }
        if (!title || title.includes('English')) {
          setTitle('राजस्थान जिला प्रशासन हिन्दी गति मूल्यांकन - DevLys 010 (Set 1)');
        }
        if (!heading) {
          setHeading('हिन्दी टाइपिंग दक्षता परीक्षा 2026');
        }
      } else {
        handleWpmChange(30);
        if (!passageText || passageText === HINDI_DEVLYS_PRESET_PARAGRAPH) {
          setPassageText(ENGLISH_PRESET_PARAGRAPH);
        }
        if (!title || title.includes('हिन्दी') || title.includes('fgUnh')) {
          setTitle('Rajasthan Administrative Services Speed Assessment (English)');
        }
        if (!heading || heading.includes('हिन्दी') || heading.includes('fgUnh')) {
          setHeading('English Computer Typing Assessment 2026');
        }
      }
    }
  };

  const handleConvertUnicode = () => {
    if (!unicodeInput.trim()) return;
    const converted = convertUnicodeToDevlys(unicodeInput);
    setPassageText(converted);
    setShowConverter(false);
  };

  const handleLoadPreset = () => {
    if (language === 'HINDI_DEVLYS_010') {
      setPassageText(HINDI_DEVLYS_PRESET_PARAGRAPH);
      if (!title) setTitle('राजस्थान जिला प्रशासन हिन्दी गति मूल्यांकन - DevLys 010');
      if (!heading) setHeading('हिन्दी टाइपिंग दक्षता परीक्षा 2026');
    } else {
      setPassageText(ENGLISH_PRESET_PARAGRAPH);
      if (!title) setTitle('Rajasthan Administrative Services Speed Assessment (English)');
      if (!heading) setHeading('English Computer Typing Assessment 2026');
    }
  };

  const handleSaveWithStatus = (submitStatus: 'PUBLISHED' | 'DRAFT') => {
    if (!title.trim()) {
      alert('Please enter a test title.');
      return;
    }
    if (!passageText.trim()) {
      alert('Please provide the typing test paragraph.');
      return;
    }

    const newTest: TypingTest = {
      id: initialTest?.id || `tt-${Date.now()}`,
      title: title.trim(),
      heading: heading.trim() || undefined,
      examDate: examDate || todayStr,
      language,
      durationMinutes: Number(durationMinutes) || 10,
      targetBlock,
      minPassingWpm: Number(minPassingWpm) || (language === 'HINDI_DEVLYS_010' ? 25 : 30),
      minCorrectWords: Number(minCorrectWords) || (minPassingWpm * 10),
      assignedCandidateIds: initialTest?.assignedCandidateIds || [],
      passageText: passageText.trim(),
      instructions: instructions.trim(),
      status: submitStatus,
      createdBy: 'District Evaluation Cell',
      createdAt: initialTest?.createdAt || new Date().toISOString(),
      totalWords: wordCount,
    };

    onSave(newTest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-lg">
              {language === 'HINDI_DEVLYS_010' ? 'अ' : 'A'}
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                Evaluation Test Creator
              </div>
              <h2 className="text-base font-black tracking-tight">
                {initialTest ? 'Edit Typing Test Paper' : 'Create & Publish Typing Test Paragraph'}
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveWithStatus(status);
          }}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {/* Requirement 5: Language Selection with ONLY "A" English and "अ" हिंदी cards (no other text) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Medium of Test
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* English Card */}
              <button
                type="button"
                onClick={() => handleLanguageChange('ENGLISH')}
                className={`py-4 px-6 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all cursor-pointer ${
                  language === 'ENGLISH'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  A
                </span>
                <span className="text-base font-black">English</span>
              </button>

              {/* Hindi Card */}
              <button
                type="button"
                onClick={() => handleLanguageChange('HINDI_DEVLYS_010')}
                className={`py-4 px-6 rounded-2xl border-2 flex items-center justify-center space-x-3 transition-all cursor-pointer ${
                  language === 'HINDI_DEVLYS_010'
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-lg flex items-center justify-center shadow-xs font-devlys">
                  v
                </span>
                <span className="text-base font-black">हिंदी</span>
              </button>
            </div>
          </div>

          {/* Requirement 4: Heading input field & Test Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Paragraph Heading
              </label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="e.g., Computer Proficiency Speed Assessment 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Title / Paper Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  language === 'HINDI_DEVLYS_010'
                    ? 'jktLFkku ftyk iz\'kklu fgUnh xfr ewY;kadu & DevLys 010'
                    : 'e.g., District Ministerial Speed Assessment (Set 1)'
                }
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  language === 'HINDI_DEVLYS_010' ? 'font-devlys text-sm' : ''
                }`}
              />
            </div>
          </div>

          {/* Requirement 2 & 7: Date of Typing Test (Calendar selection) + Min Correct Words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Requirement 2: Date of typing test option through calendar date selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Date of Typing Test</span>
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Scheduled Exam Date</span>
            </div>

            {/* Requirement 7: Minimum correctly typed words in 10 mins for qualification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Min Correct Words in 10 Mins</span>
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                value={minCorrectWords}
                onChange={(e) => handleMinCorrectWordsChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Pass: {minCorrectWords} correct words ({minPassingWpm} Net WPM • Duration: 10 mins)
              </span>
            </div>
          </div>

          {/* Hindi Unicode Converter Utility */}
          {language === 'HINDI_DEVLYS_010' && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Unicode Hindi to DevLys 010 Converter</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowConverter(!showConverter)}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {showConverter ? 'Hide Converter' : 'Paste Unicode Hindi Text (मंगल/यूनिकोड)'}
                </button>
              </div>

              {showConverter && (
                <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Paste regular Mangal / Unicode Hindi text here. We will instantly convert it to DevLys 010 format:
                  </p>
                  <textarea
                    rows={3}
                    value={unicodeInput}
                    onChange={(e) => setUnicodeInput(e.target.value)}
                    placeholder="यहाँ सामान्य हिंदी टेक्स्ट (यूनिकोड) पेस्ट करें..."
                    className="w-full p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleConvertUnicode}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Convert & Insert in Passage</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reference Paragraph Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Typing Test Paragraph Passage</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {wordCount} words
                </span>
                <button
                  type="button"
                  onClick={handleLoadPreset}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Load Official Sample Passage
                </button>
              </div>
            </div>

            <textarea
              required
              rows={8}
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
              placeholder={
                language === 'HINDI_DEVLYS_010'
                  ? 'DevLys 010 QWERTY encoded text paste here (e.g. jktLFkku ljdkj...)'
                  : 'Enter the official examination paragraph text here...'
              }
              className={`w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                language === 'HINDI_DEVLYS_010' ? 'font-devlys text-base' : 'font-sans'
              }`}
            />

            {/* Passage Health & Refine Assistant */}
            {passageText.trim().length > 10 && (
              <div className="mt-2">
                {auditAndRefinePassage(passageText, language === 'HINDI_DEVLYS_010').hasIssues ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>
                          {auditAndRefinePassage(passageText, language === 'HINDI_DEVLYS_010').totalIssues} Passage Issue(s) Detected (e.g. rogue nukta, attached dot/period, or danda spacing)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = auditAndRefinePassage(passageText, language === 'HINDI_DEVLYS_010');
                          setPassageText(res.refinedPassage);
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Auto-Refine Passage</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {auditAndRefinePassage(passageText, language === 'HINDI_DEVLYS_010').anomalies.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-[11px] font-mono border border-amber-200 dark:border-amber-900 text-slate-700 dark:text-slate-300"
                        >
                          <span className="text-rose-600 line-through">{a.originalWord}</span>
                          <span>→</span>
                          <span className="text-emerald-600 font-bold">{a.refinedWord}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Passage Quality Clean & Validated (No rogue nuktas or punctuation bugs)</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Publishing Status Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                Publication Status
              </span>
              <span className="text-[11px] text-slate-500">
                {status === 'PUBLISHED'
                  ? 'Published: Visible and accessible to registered candidates matching medium.'
                  : 'Draft: Saved for administrator review only; candidates cannot view or take test.'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setStatus('DRAFT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  status === 'DRAFT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('PUBLISHED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveWithStatus('DRAFT')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveWithStatus('PUBLISHED')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Publish Paragraph</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
