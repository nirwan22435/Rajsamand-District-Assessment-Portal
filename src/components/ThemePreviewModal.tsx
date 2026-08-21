import React, { useState } from 'react';
import {
  Check,
  Palette,
  Eye,
  Sun,
  Moon,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { APP_THEMES, ThemeConfig, applyThemeToDOM } from '../utils/themeManager';

export { APP_THEMES, type ThemeConfig };

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
  darkMode?: boolean;
}

export function ThemePreviewModal({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
  darkMode = false,
}: ThemePreviewModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig>(
    APP_THEMES.find((t) => t.id === currentThemeId) || APP_THEMES[0]
  );
  const [previewDarkMode, setPreviewDarkMode] = useState<boolean>(darkMode);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['ALL', 'Clean Minimalist', 'Modern SaaS', 'Official District', 'High Contrast'];

  const filteredThemes = APP_THEMES.filter((theme) => {
    if (selectedFilter === 'ALL') return true;
    return theme.category === selectedFilter;
  });

  const handleApply = (themeId: string) => {
    applyThemeToDOM(themeId, previewDarkMode);
    onSelectTheme(themeId);
    setAppliedNotification(themeId);
    setTimeout(() => {
      setAppliedNotification(null);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Choose Visual Theme & Style</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                  12 Curated Presets
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Select a modern, clean & minimalist design style for the Rajsamand Assessment Portal.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewDarkMode(!previewDarkMode)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {previewDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
              <span>{previewDarkMode ? 'Preview Dark' : 'Preview Light'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Body: Split view (Theme Gallery on Left, Live Interactive Preview on Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Theme Gallery */}
          <div className="lg:col-span-7 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800 max-h-[calc(92vh-140px)]">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid of 12 Themes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredThemes.map((theme) => {
                const isCurrent = currentThemeId === theme.id;
                const isSelectedForPreview = previewTheme.id === theme.id;

                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      setPreviewTheme(theme);
                    }}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      isSelectedForPreview
                        ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 dark:bg-sky-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Row: Palette Chips + Popular Tag */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: theme.accentHex }}
                            title={`Accent: ${theme.accentHex}`}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: theme.secondaryHex }}
                            title={`Secondary: ${theme.secondaryHex}`}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: theme.bgLightHex }}
                            title={`Background: ${theme.bgLightHex}`}
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          {theme.isPopular && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Popular
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Theme Title & Category */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {theme.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {theme.description}
                      </p>
                    </div>

                    {/* Footer Row: Action to apply or select */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {theme.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(theme.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                        }`}
                      >
                        {isCurrent ? 'Applied ✓' : 'Apply Theme'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Mock Preview of the Selected Theme */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between overflow-y-auto max-h-[calc(92vh-140px)]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Live Component Preview
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: previewTheme.accentHex }}
                >
                  {previewTheme.name.split('.')[1] || previewTheme.name}
                </span>
              </div>

              {/* Mock Application Surface Card */}
              <div
                className={`p-4 rounded-2xl border transition-all shadow-md ${
                  previewDarkMode ? 'text-slate-100' : 'text-slate-800'
                }`}
                style={{
                  backgroundColor: previewDarkMode ? previewTheme.cardDarkHex : previewTheme.cardLightHex,
                  borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex,
                }}
              >
                {/* Mock Header */}
                <div
                  className="flex items-center justify-between pb-3 border-b"
                  style={{ borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex }}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-black text-xs shadow-sm"
                      style={{ backgroundColor: previewTheme.accentHex }}
                    >
                      RJ
                    </div>
                    <div>
                      <p className="text-xs font-black leading-none">Evaluation Cell</p>
                      <p className="text-[10px] opacity-70 mt-0.5">Govt. of Rajasthan</p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${previewTheme.accentHex}18`,
                      color: previewTheme.accentHex,
                      border: `1px solid ${previewTheme.accentHex}40`,
                    }}
                  >
                    {previewTheme.sampleBadgeText}
                  </span>
                </div>

                {/* Mock Assessment Metric Stats */}
                <div className="grid grid-cols-3 gap-2 my-3.5">
                  <div
                    className="p-2.5 rounded-xl border text-center"
                    style={{
                      backgroundColor: previewDarkMode ? 'rgba(255,255,255,0.03)' : previewTheme.bgLightHex,
                      borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex,
                    }}
                  >
                    <p className="text-[10px] font-semibold opacity-70">Typing Speed</p>
                    <p className="text-base font-black mt-0.5" style={{ color: previewTheme.accentHex }}>
                      42.5 <span className="text-[10px] font-normal opacity-70">WPM</span>
                    </p>
                  </div>

                  <div
                    className="p-2.5 rounded-xl border text-center"
                    style={{
                      backgroundColor: previewDarkMode ? 'rgba(255,255,255,0.03)' : previewTheme.bgLightHex,
                      borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex,
                    }}
                  >
                    <p className="text-[10px] font-semibold opacity-70">Accuracy</p>
                    <p className="text-base font-black mt-0.5 text-emerald-600 dark:text-emerald-400">
                      97.8%
                    </p>
                  </div>

                  <div
                    className="p-2.5 rounded-xl border text-center"
                    style={{
                      backgroundColor: previewDarkMode ? 'rgba(255,255,255,0.03)' : previewTheme.bgLightHex,
                      borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex,
                    }}
                  >
                    <p className="text-[10px] font-semibold opacity-70">Pass Status</p>
                    <p className="text-xs font-black mt-1 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>QUALIFIED</span>
                    </p>
                  </div>
                </div>

                {/* Mock Test Passage Container */}
                <div
                  className="p-3 rounded-xl border text-xs font-mono mb-3"
                  style={{
                    backgroundColor: previewDarkMode ? 'rgba(0,0,0,0.3)' : previewTheme.bgLightHex,
                    borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex,
                  }}
                >
                  <p className="opacity-90 leading-relaxed font-sans text-xs">
                    "राजसमंद जिला प्रशासन द्वारा आयोजित कम्प्यूटर दक्षता एवं टंकण गति परीक्षा..."
                  </p>
                </div>

                {/* Mock Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-xl text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    style={{ backgroundColor: previewTheme.accentHex }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Start Official Test</span>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                    style={{
                      borderColor: previewDarkMode ? previewTheme.borderDarkHex : previewTheme.borderLightHex,
                      backgroundColor: previewDarkMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    }}
                  >
                    Scorecard PDF
                  </button>
                </div>
              </div>

              {/* Theme Key Highlights */}
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Key Visual Characteristics
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {previewTheme.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Apply Action */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleApply(previewTheme.id)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>
                  {appliedNotification === previewTheme.id
                    ? 'Theme Applied!'
                    : `Apply ${previewTheme.name.split('.')[1] || previewTheme.name} Theme`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
