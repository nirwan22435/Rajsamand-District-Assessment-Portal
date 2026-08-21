import React, { useState, useMemo } from 'react';
import { TypingTest } from '../../types';
import {
  auditAndRefinePassage,
  PassageAuditResult,
  TokenHealthReport,
  verifyDevlysKeystrokeMatch,
} from '../../utils/passageSanitizer';
import {
  convertDevlysToUnicode,
  convertUnicodeToDevlys,
  DEVLYS_KEYBOARD_LAYOUT,
} from '../../utils/devlysConverter';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Stethoscope,
  Keyboard,
  Search,
  Filter,
  Layers,
  HelpCircle,
  Copy,
  Check,
  Sliders,
  Play,
  ArrowUpRight,
  Info,
  Bug,
  Wand2,
} from 'lucide-react';

interface DevlysTokenDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: TypingTest[];
  initialSelectedTestId?: string;
  onSaveTest: (test: TypingTest) => Promise<void> | void;
}

export const DevlysTokenDoctorModal: React.FC<DevlysTokenDoctorModalProps> = ({
  isOpen,
  onClose,
  tests,
  initialSelectedTestId,
  onSaveTest,
}) => {
  if (!isOpen) return null;

  // Active Tab: 'INSPECTOR' | 'SIMULATOR' | 'BATCH_AUDIT'
  const [activeTab, setActiveTab] = useState<'INSPECTOR' | 'SIMULATOR' | 'BATCH_AUDIT'>('INSPECTOR');

  // Selected Test or Custom Passage Mode
  const [selectedTestId, setSelectedTestId] = useState<string>(
    initialSelectedTestId || (tests.length > 0 ? tests[0].id : 'custom')
  );
  const [customText, setCustomText] = useState<string>('');
  const [customLanguage, setCustomLanguage] = useState<'HINDI_DEVLYS_010' | 'ENGLISH'>('HINDI_DEVLYS_010');

  // Selected Token for Inspector Panel
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);

  // Filter for Token Matrix: 'ALL' | 'ISSUES_ONLY' | 'NUKTA' | 'PUNCTUATION' | 'MATRA'
  const [tokenFilter, setTokenFilter] = useState<'ALL' | 'ISSUES_ONLY' | 'NUKTA' | 'PUNCTUATION'>('ALL');

  // Search query for tokens
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status feedback
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Simulator State
  const [simRefWord, setSimRefWord] = useState<string>('युग');
  const [simDevlysInput, setSimDevlysInput] = useState<string>(';qx');

  // Determine current active text and language
  const currentTest = tests.find((t) => t.id === selectedTestId);
  const activePassageText = selectedTestId === 'custom' ? customText : (currentTest?.passageText || '');
  const activeLanguage = selectedTestId === 'custom' ? customLanguage : (currentTest?.language || 'HINDI_DEVLYS_010');
  const isHindi = activeLanguage === 'HINDI_DEVLYS_010';

  // Perform full health audit
  const auditResult: PassageAuditResult = useMemo(() => {
    return auditAndRefinePassage(activePassageText, isHindi);
  }, [activePassageText, isHindi]);

  // Filtered tokens for display
  const filteredTokens = useMemo(() => {
    return auditResult.allTokens.filter((token) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrig = token.originalToken.toLowerCase().includes(q);
        const matchRef = token.refinedToken.toLowerCase().includes(q);
        const matchDevlys = token.devlysKeystrokes.toLowerCase().includes(q);
        if (!matchOrig && !matchRef && !matchDevlys) return false;
      }

      if (tokenFilter === 'ISSUES_ONLY') {
        return token.hasIssue;
      }
      if (tokenFilter === 'NUKTA') {
        return token.category === 'ROGUE_NUKTA';
      }
      if (tokenFilter === 'PUNCTUATION') {
        return token.category === 'TRAILING_PUNCTUATION' || token.category === 'DANDA_SPACING';
      }
      return true;
    });
  }, [auditResult.allTokens, tokenFilter, searchQuery]);

  // Selected Token details
  const selectedToken: TokenHealthReport | null = useMemo(() => {
    if (selectedTokenIndex === null) {
      // Default to first anomaly if available, otherwise first token
      if (auditResult.anomalies.length > 0) return auditResult.anomalies[0];
      if (auditResult.allTokens.length > 0) return auditResult.allTokens[0];
      return null;
    }
    return auditResult.allTokens.find((t) => t.index === selectedTokenIndex) || null;
  }, [selectedTokenIndex, auditResult]);

  // Handle 1-Click Auto-Fix & Save
  const handleApplyAndSave = async () => {
    if (selectedTestId === 'custom') {
      setCustomText(auditResult.refinedPassage);
      setSavingStatus('कस्टम पैसेज सफलतापूर्वक ठीक किया गया!');
      setTimeout(() => setSavingStatus(null), 3000);
      return;
    }

    if (!currentTest) return;

    setSavingStatus('सुधार सहेजा जा रहा है...');
    try {
      const updatedTest: TypingTest = {
        ...currentTest,
        passageText: auditResult.refinedPassage,
        totalWords: auditResult.refinedWordCount,
      };
      await onSaveTest(updatedTest);
      setSavingStatus('पैसेज के सभी टोकन ठीक किए गए और टेस्ट सफलतापूर्वक अपडेट हुआ!');
      setTimeout(() => setSavingStatus(null), 3500);
    } catch {
      setSavingStatus('त्रुटि: सहेजने में विफल');
      setTimeout(() => setSavingStatus(null), 3000);
    }
  };

  // Handle Batch Audit & Fix All Tests
  const handleBatchFixAll = async () => {
    setSavingStatus('सभी टेस्टों को एक साथ जांचा और ठीक किया जा रहा है...');
    let fixedCount = 0;
    try {
      for (const t of tests) {
        const testHindi = t.language === 'HINDI_DEVLYS_010';
        const res = auditAndRefinePassage(t.passageText, testHindi);
        if (res.hasIssues) {
          await onSaveTest({
            ...t,
            passageText: res.refinedPassage,
            totalWords: res.refinedWordCount,
          });
          fixedCount++;
        }
      }
      setSavingStatus(`सफल! ${fixedCount} टेस्टों के टोकन स्वतः ठीक किए गए।`);
      setTimeout(() => setSavingStatus(null), 4000);
    } catch {
      setSavingStatus('बैच सुधार में त्रुटि आई');
      setTimeout(() => setSavingStatus(null), 3000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulator live test evaluation
  const simConverted = useMemo(() => {
    return convertDevlysToUnicode(simDevlysInput);
  }, [simDevlysInput]);

  const simEvaluation = useMemo(() => {
    return verifyDevlysKeystrokeMatch(simRefWord, simConverted);
  }, [simRefWord, simConverted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-teal-400">
                  DevLys 010 & Unicode Token Doctor
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Auto-Healing v2.0
                </span>
              </div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                देवनागरी एवं DevLys 010 टोकन त्रुटि निवारण सुविधा
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('INSPECTOR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'INSPECTOR'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>पैसेज टोकन इंस्पेक्टर (Passage Token Inspector)</span>
              {auditResult.hasIssues && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {auditResult.totalIssues}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'SIMULATOR'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>DevLys 010 कीबोर्ड सिम्युलेटर (Remington Live Test)</span>
            </button>

            <button
              onClick={() => setActiveTab('BATCH_AUDIT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'BATCH_AUDIT'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>समस्त टेस्ट्स का स्वास्थ्य ऑडिट ({tests.length})</span>
            </button>
          </div>

          {/* Test Selector Dropdown */}
          {activeTab === 'INSPECTOR' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">टेस्ट चुनें:</label>
              <select
                value={selectedTestId}
                onChange={(e) => {
                  setSelectedTestId(e.target.value);
                  setSelectedTokenIndex(null);
                }}
                className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.language === 'HINDI_DEVLYS_010' ? 'Hindi DevLys' : 'English'}) - {t.totalWords} w
                  </option>
                ))}
                <option value="custom">✍️ कस्टम पैसेज पेस्ट करें (Custom Text Paste)</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Status Toast Banner */}
          {savingStatus && (
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 flex items-center gap-3 text-teal-800 dark:text-teal-300 animate-in fade-in">
              <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
              <p className="text-xs font-bold">{savingStatus}</p>
            </div>
          )}

          {/* TAB 1: PASSAGE TOKEN INSPECTOR */}
          {activeTab === 'INSPECTOR' && (
            <div className="space-y-6">
              
              {/* Custom Textarea if in custom mode */}
              {selectedTestId === 'custom' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                      जांच हेतु पैसेज पेस्ट करें (Paste Hindi DevLys / Unicode / English Text):
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCustomLanguage('HINDI_DEVLYS_010')}
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          customLanguage === 'HINDI_DEVLYS_010'
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Hindi DevLys 010
                      </button>
                      <button
                        onClick={() => setCustomLanguage('ENGLISH')}
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          customLanguage === 'ENGLISH'
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="यहाँ अपना हिंदी या अंग्रेजी पैसेज पेस्ट करें..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-hindi focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Health Score Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">स्वास्थ्य स्कोर (Health Score)</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-2xl font-black ${
                      auditResult.healthScore >= 95
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : auditResult.healthScore >= 75
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {auditResult.healthScore}%
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {auditResult.healthScore === 100 ? 'उत्कृष्ट (Clean)' : 'सुधार अपेक्षित'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">कुल शब्द / टोकन्स (Total Tokens)</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                      {auditResult.originalWordCount}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">शब्द</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50/70 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200 dark:border-rose-900/50">
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">त्रुटियां / नुक्ता (Errors / Nuktas)</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      {auditResult.errorCount}
                    </span>
                    <span className="text-xs text-rose-500 font-bold">गंभीर त्रुटियां</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-900/50">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">विराम चिन्ह / डंडा (Punctuation)</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {auditResult.warningCount}
                    </span>
                    <span className="text-xs text-amber-500 font-bold">चेतावनी</span>
                  </div>
                </div>
              </div>

              {/* Action Banner: 1-Click Auto-Fix */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-teal-700/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                      <span>1-क्लिक स्वतः सुधार (1-Click Auto-Fix & Token Healer)</span>
                      {auditResult.hasIssues && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500 text-white font-bold">
                          {auditResult.totalIssues} टोकन ठीक होने बाकी
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-teal-200/80 mt-0.5">
                      अनावश्यक नुक्ता (ह़), चिपके डॉट्स (पेड़.), डंडा स्पेसिंग, और Remington कीबोर्ड सिंबल्स को स्वचालित रूप से निष्पादित करें।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={handleApplyAndSave}
                    disabled={!auditResult.hasIssues}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                      auditResult.hasIssues
                        ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>सभी त्रुटियों को तुरंत ठीक करें (Auto-Fix All)</span>
                  </button>
                </div>
              </div>

              {/* Token Matrix and Detail Split Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Token Grid Matrix (7 Cols) */}
                <div className="lg:col-span-7 space-y-3.5">
                  
                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <button
                        onClick={() => setTokenFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                          tokenFilter === 'ALL'
                            ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        सभी शब्द ({auditResult.allTokens.length})
                      </button>
                      <button
                        onClick={() => setTokenFilter('ISSUES_ONLY')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                          tokenFilter === 'ISSUES_ONLY'
                            ? 'bg-rose-600 text-white'
                            : 'text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950'
                        }`}
                      >
                        <span>त्रुटि वाले टोकन</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-black">
                          {auditResult.anomalies.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setTokenFilter('NUKTA')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                          tokenFilter === 'NUKTA'
                            ? 'bg-amber-600 text-white'
                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950'
                        }`}
                      >
                        नुक्ता (ह़/म़)
                      </button>
                      <button
                        onClick={() => setTokenFilter('PUNCTUATION')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                          tokenFilter === 'PUNCTUATION'
                            ? 'bg-blue-600 text-white'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950'
                        }`}
                      >
                        विराम चिन्ह
                      </button>
                    </div>

                    <div className="relative w-full sm:w-36">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="खोजें (Search)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-[11px] pl-7 pr-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Token Interactive Grid */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[380px] overflow-y-auto space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between mb-2">
                      <span>टोकन पर क्लिक करके विवरण एवं सुधार देखें:</span>
                      <span className="text-[10px]">
                        दिखाए जा रहे टोकन: {filteredTokens.length} / {auditResult.allTokens.length}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 leading-loose">
                      {filteredTokens.map((token) => {
                        const isSelected = selectedToken?.index === token.index;
                        return (
                          <button
                            key={token.index}
                            onClick={() => setSelectedTokenIndex(token.index)}
                            className={`px-2 py-1 rounded-lg text-xs font-hindi transition-all text-left flex items-center gap-1.5 border ${
                              isSelected
                                ? 'ring-2 ring-teal-500 scale-105 z-10'
                                : ''
                            } ${
                              token.severity === 'ERROR'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-sm'
                                : token.severity === 'WARNING'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <span className="text-[9px] font-mono opacity-60">#{token.index}</span>
                            <span className="font-bold">{token.originalToken}</span>
                            {token.hasIssue && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {filteredTokens.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        कोई टोकन नहीं मिला
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Selected Token Diagnosis Card (5 Cols) */}
                <div className="lg:col-span-5 space-y-3.5">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold font-mono">
                          #{selectedToken?.index || '-'}
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                          टोकन डायग्नोस्टिक्स (Token Diagnostics)
                        </h4>
                      </div>
                      {selectedToken && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedToken.severity === 'ERROR'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : selectedToken.severity === 'WARNING'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {selectedToken.hasIssue ? selectedToken.categoryLabelHindi : 'शुद्ध एवं मान्य (Valid)'}
                        </span>
                      )}
                    </div>

                    {selectedToken ? (
                      <div className="space-y-3.5 text-xs">
                        {/* Before vs After Comparison */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              मूल टोकन (Original):
                            </span>
                            <span className={`text-base font-bold font-hindi ${
                              selectedToken.hasIssue ? 'text-rose-600 line-through' : 'text-slate-800 dark:text-slate-100'
                            }`}>
                              {selectedToken.originalToken}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              सुधारित टोकन (Refined):
                            </span>
                            <span className="text-base font-bold font-hindi text-emerald-700 dark:text-emerald-300">
                              {selectedToken.refinedToken}
                            </span>
                          </div>
                        </div>

                        {/* Remington Keystrokes & Unicode representation */}
                        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 space-y-1.5 font-mono text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">DevLys 010 कीस्ट्रोक्स:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                              {selectedToken.devlysKeystrokes || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Unicode कोडपॉइंट्स:</span>
                            <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                              {selectedToken.codepoints.join(' ')}
                            </span>
                          </div>
                        </div>

                        {/* Explanation description */}
                        <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
                          <div className="font-bold text-[11px] flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-600" />
                            <span>निदान (Diagnosis):</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {selectedToken.descriptionHindi}
                          </p>
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/70">
                            {selectedToken.descriptionEnglish}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        कृपया बाईं ओर किसी टोकन पर क्लिक करें
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVLYS 010 KEYBOARD SIMULATOR */}
          {activeTab === 'SIMULATOR' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-teal-500" />
                      <span>लाइव Remington / DevLys 010 टाइपिंग एवं टोकन परीक्षण</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      यहाँ टाइप करके देखें कि कैसे Remington ASCII कीस्ट्रोक्स (उदा. <code className="font-bold">;qx</code> = <code className="font-bold">युग</code>, <code className="font-bold">&#123;ks=</code> = <code className="font-bold">क्षेत्र</code>, <code className="font-bold">gekjs</code> = <code className="font-bold">हमारे</code>) रीयल-टाइम में सही जांचे जाते हैं।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reference Word Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      1. संदर्भ शब्द (Reference Word to Match):
                    </label>
                    <input
                      type="text"
                      value={simRefWord}
                      onChange={(e) => setSimRefWord(e.target.value)}
                      className="w-full text-base font-bold font-hindi p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      placeholder="उदा. युग, क्षेत्र, हमारे, शिक्षा, मुख्य"
                    />
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {['युग', 'क्षेत्र', 'हमारे', 'शिक्षा', 'मुख्य', 'नए', 'विद्यालय'].map((sample) => (
                        <button
                          key={sample}
                          onClick={() => {
                            setSimRefWord(sample);
                            setSimDevlysInput(convertUnicodeToDevlys(sample));
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-hindi bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-500 hover:text-white transition-colors"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DevLys ASCII Input Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      2. DevLys 010 कीस्ट्रोक्स टाइप करें (Type ASCII Keys):
                    </label>
                    <input
                      type="text"
                      value={simDevlysInput}
                      onChange={(e) => setSimDevlysInput(e.target.value)}
                      className="w-full text-base font-mono font-bold p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      placeholder="e.g. ;qx, {ks=, gekjs"
                    />
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>कन्वर्टेड देवनागरी:</span>
                      <span className="font-bold text-base font-hindi text-teal-600 dark:text-teal-400">
                        {simConverted || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Match Result Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  simEvaluation.isMatch
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {simEvaluation.isMatch ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {simEvaluation.isMatch
                          ? '100% सही मिलान (Match Successful - GREEN)'
                          : 'असंगत टोकन (Mismatch - RED)'}
                      </h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {simEvaluation.isMatch
                          ? `संदर्भ "${simRefWord}" और टाइप किया गया "${simConverted}" पूरी तरह से मेल खाते हैं।`
                          : `संदर्भ "${simRefWord}" और टाइप किया गया "${simConverted}" मेल नहीं खाते।`}
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                    simEvaluation.isMatch
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {simEvaluation.isMatch ? 'CORRECT' : 'INCORRECT'}
                  </span>
                </div>
              </div>

              {/* DevLys Keyboard Layout Map */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-slate-400" />
                  <span>DevLys 010 Remington कीबोर्ड रेफरेंस चार्ट:</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {DEVLYS_KEYBOARD_LAYOUT.map((k) => (
                    <div
                      key={k.key}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center"
                    >
                      <div className="text-[10px] font-mono font-bold text-slate-400">{k.key}</div>
                      <div className="text-xs font-bold font-hindi text-slate-800 dark:text-slate-200 my-0.5">
                        {k.normal}
                      </div>
                      <div className="text-[10px] font-hindi text-teal-600 dark:text-teal-400">
                        {k.shift}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATCH HEALTH AUDIT ACROSS ALL TESTS */}
          {activeTab === 'BATCH_AUDIT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-500" />
                    <span>सिस्टम के समस्त टाइपिंग टेस्ट्स का स्वास्थ्य ऑडिट ({tests.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    सभी पैसेज की एक साथ जांच करें और एक क्लिक में सभी में से अवांछित नुक्ता एवं विराम चिन्ह त्रुटियों को ठीक करें।
                  </p>
                </div>

                <button
                  onClick={handleBatchFixAll}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2 shadow-md transition-all shrink-0 active:scale-95"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>सभी टेस्ट्स को एक साथ ठीक करें (Batch Auto-Fix All)</span>
                </button>
              </div>

              {/* Tests Audit Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {tests.map((t) => {
                  const isHindiTest = t.language === 'HINDI_DEVLYS_010';
                  const audit = auditAndRefinePassage(t.passageText, isHindiTest);
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-[11px] ${
                          audit.healthScore === 100
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                        }`}>
                          {audit.healthScore}%
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {isHindiTest ? 'Hindi DevLys' : 'English'}
                            </span>
                            <span className="text-slate-400">({t.totalWords} words)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {audit.hasIssues
                              ? `${audit.totalIssues} टोकन विसंगतियां (${audit.errorCount} नुक्ता/त्रुटियां, ${audit.warningCount} विराम चिन्ह)`
                              : '✅ 100% शुद्ध एवं सत्यापित'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setSelectedTestId(t.id);
                            setActiveTab('INSPECTOR');
                          }}
                          className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>जांचें</span>
                        </button>
                        {audit.hasIssues && (
                          <button
                            onClick={async () => {
                              await onSaveTest({
                                ...t,
                                passageText: audit.refinedPassage,
                                totalWords: audit.refinedWordCount,
                              });
                              setSavingStatus(`"${t.title}" सफलतापूर्वक ठीक किया गया!`);
                              setTimeout(() => setSavingStatus(null), 3000);
                            }}
                            className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ठीक करें</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>DevLys 010 Remington & Unicode Resilient Evaluator Enabled</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => copyToClipboard(auditResult.refinedPassage)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'कॉपी हो गया!' : 'शुद्ध पैसेज कॉपी करें'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
