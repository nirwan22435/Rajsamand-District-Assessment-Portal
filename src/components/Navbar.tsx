import React from 'react';
import { UserRole, Candidate } from '../types';
import { Sun, Moon, ShieldCheck, User, LogOut, FileText, BarChart3, Users, Mail, Compass, Building2, PhoneCall, BookOpen, Keyboard, Palette, Monitor, Smartphone, Award } from 'lucide-react';
import { PortalLogo } from './PortalLogo';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  role: UserRole;
  candidate?: Candidate;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  resendStatus?: { hasKey: boolean };
  onOpenThemeModal?: () => void;
  onOpenDesktopModal?: () => void;
  onOpenAndroidModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  role,
  candidate,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenLogin,
  onOpenThemeModal,
  onOpenDesktopModal,
  onOpenAndroidModal,
}) => {
  return (
    <header className="w-full z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* 1. Official National Tricolor Top Accent Strip */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#FF9933]"></div> {/* Saffron */}
        <div className="bg-white dark:bg-slate-200"></div> {/* White */}
        <div className="bg-[#138808]"></div> {/* Green */}
      </div>

      {/* 2. Main Brand Header with State Emblem & Theme Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Official Emblem & Branding */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab(role === 'ADMIN' ? 'analytics' : candidate?.typingMedium ? 'typing-test' : 'my-tests')}
          >
            {/* Official Portal Logo Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 p-1.5 flex items-center justify-center shadow-xs group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                <PortalLogo size={42} darkMode={darkMode} />
              </div>
            </div>

            {/* Subtle Vertical Divider */}
            <div className="h-9 w-px bg-slate-200 dark:bg-slate-700/80 hidden sm:block shrink-0" aria-hidden="true" />

            {/* Title & Subtitles */}
            <div className="flex flex-col justify-center">
              <div className="font-hindi text-[12px] font-semibold text-sky-600 dark:text-sky-400 tracking-wide leading-tight">
                राजसमंद जिला मूल्यांकन पोर्टल
              </div>
              <div className="mt-0.5">
                <h1 className="font-display text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Rajsamand District Assessment Portal
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">
                District Administration, Rajsamand
              </p>
            </div>
          </div>

          {/* User Profile, Theme Switcher & Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 border-t md:border-t-0 border-slate-200 dark:border-slate-800 pt-2 md:pt-0 flex-wrap sm:flex-nowrap">
            {/* Desktop App / .EXE Setup Button */}
            {onOpenDesktopModal && (
              <button
                id="desktop-app-btn"
                type="button"
                onClick={onOpenDesktopModal}
                title="Install / Download Windows Desktop Application & .EXE Setup"
                className="px-4 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#38bdf8]/40 shadow-xs hover:shadow-md hover:shadow-sky-500/15 transition-all duration-150 flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Monitor className="w-3.5 h-3.5 text-white/95" />
                <span>Desktop App</span>
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              </button>
            )}

            {/* Android App (RDAA) Button */}
            {onOpenAndroidModal && (
              <button
                id="android-app-btn"
                type="button"
                onClick={onOpenAndroidModal}
                title="Download RDAA Android APK"
                className="px-4 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white border border-[#38bdf8]/40 shadow-xs hover:shadow-md hover:shadow-sky-500/15 transition-all duration-150 flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Smartphone className="w-3.5 h-3.5 text-white/95" />
                <span>Android App</span>
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              </button>
            )}

            {/* Light / Dark Mode Toggle on White Bar */}
            <button
              id="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-sm transition-all duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>

            {role === 'ADMIN' ? (
              <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-emerald-900 dark:text-emerald-200">
                    District Administrator
                  </span>
                </div>
                <button
                  id="admin-logout-btn"
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : candidate ? (
              <div className="flex items-center space-x-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 px-3 py-1.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-sky-900 dark:text-sky-200">
                    {candidate.name}
                  </span>
                  <span className="block text-[10px] text-sky-700 dark:text-sky-400 font-mono">
                    {candidate.registrationId}
                  </span>
                </div>
                <button
                  id="candidate-logout-btn"
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="open-login-btn"
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Candidate Portal Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Official Navigation Menu Bar */}
      <div className="bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1.5 overflow-x-auto py-1.5 scrollbar-thin">
            {role === 'ADMIN' ? (
              <>
                <button
                  id="tab-analytics"
                  onClick={() => setActiveTab('analytics')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'analytics'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:scale-110'
                    }`}
                  >
                    <BarChart3 className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Candidate performance Analytics</span>
                  {activeTab === 'analytics' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                <button
                  id="tab-published-tests"
                  onClick={() => setActiveTab('published-tests')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'published-tests'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'published-tests'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 group-hover:scale-110'
                    }`}
                  >
                    <BookOpen className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Published Test Papers & Reports</span>
                  {activeTab === 'published-tests' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                <button
                  id="tab-upload-paper"
                  onClick={() => setActiveTab('upload-paper')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'upload-paper'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'upload-paper'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-purple-500/15 dark:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/30 group-hover:scale-110'
                    }`}
                  >
                    <FileText className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Create Assessment</span>
                  {activeTab === 'upload-paper' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                <button
                  id="tab-candidates"
                  onClick={() => setActiveTab('candidates')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'candidates'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'candidates'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 group-hover:scale-110'
                    }`}
                  >
                    <Users className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Candidate Directory</span>
                  {activeTab === 'candidates' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                <button
                  id="tab-email-logs"
                  onClick={() => setActiveTab('email-logs')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'email-logs'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'email-logs'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 group-hover:scale-110'
                    }`}
                  >
                    <Mail className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Notification Audit Logs</span>
                  {activeTab === 'email-logs' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                <button
                  id="tab-typing-test"
                  onClick={() => setActiveTab('typing-test')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'typing-test'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'typing-test'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-rose-500/15 dark:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 group-hover:scale-110'
                    }`}
                  >
                    <Keyboard className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Typing Test</span>
                  {activeTab === 'typing-test' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              </>
            ) : (
              <>
                {/* For Typing Candidates: Show ONLY Typing Test and My Performance & Scorecard */}
                {!candidate?.typingMedium && (
                  <button
                    id="tab-my-tests"
                    onClick={() => setActiveTab('my-tests')}
                    className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      activeTab === 'my-tests'
                        ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                        activeTab === 'my-tests'
                          ? 'bg-white/20 text-white scale-105'
                          : 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:scale-110'
                      }`}
                    >
                      <Compass className="w-[18px] h-[18px]" strokeWidth={2.4} />
                    </span>
                    <span>Available Assessments</span>
                    {activeTab === 'my-tests' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </button>
                )}

                <button
                  id="tab-typing-test"
                  onClick={() => setActiveTab('typing-test')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'typing-test'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'typing-test'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-rose-500/15 dark:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 group-hover:scale-110'
                    }`}
                  >
                    <Keyboard className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>Typing Test</span>
                  {activeTab === 'typing-test' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>

                <button
                  id="tab-my-performance"
                  onClick={() => setActiveTab('my-performance')}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'my-performance'
                      ? 'tab-active-theme bg-emerald-600 hover:bg-emerald-600 text-white shadow-sm font-black dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 font-extrabold'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-transform shadow-xs ${
                      activeTab === 'my-performance'
                        ? 'bg-white/20 text-white scale-105'
                        : 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 group-hover:scale-110'
                    }`}
                  >
                    <Award className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                  <span>My Performance & Scorecard</span>
                  {activeTab === 'my-performance' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

