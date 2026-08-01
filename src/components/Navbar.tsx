import React from 'react';
import { UserRole, Candidate } from '../types';
import { Sun, Moon, ShieldCheck, User, LogOut, FileText, BarChart3, Users, Mail, Compass, Building2, PhoneCall } from 'lucide-react';

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
}) => {
  return (
    <header className="w-full z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* 1. Official National Tricolor Top Accent Strip */}
      <div className="h-1.5 w-full grid grid-cols-3">
        <div className="bg-[#FF9933]"></div> {/* Saffron */}
        <div className="bg-white dark:bg-slate-200"></div> {/* White */}
        <div className="bg-[#138808]"></div> {/* Green */}
      </div>

      {/* 2. Top Govt Utility Header */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 font-medium">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Building2 className="w-3.5 h-3.5" />
              <span>राजस्थान सरकार | Govt. of Rajasthan</span>
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400">
              District Administration, Rajsamand (Rajasthan)
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px]">
              <PhoneCall className="w-3 h-3 text-emerald-400" /> Helpline: 181 / 02952-220001
            </span>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Theme"
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Government Brand Header with State Emblem Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Official Emblem & Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab(role === 'ADMIN' ? 'analytics' : 'my-tests')}
          >
            {/* Government Emblem Icon Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-900 border-2 border-amber-600/80 p-1 flex items-center justify-center shadow-md shadow-amber-900/10">
                {/* SVG Ashoka Emblem / Government Seal Graphics */}
                <svg
                  className="w-10 h-10 text-amber-800 dark:text-amber-400"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer Seal Circle */}
                  <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" />
                  
                  {/* Ashoka Stambha Graphic Silhouette */}
                  <path
                    d="M45 22C45 20 55 20 55 22V32C58 32 60 34 60 37V40H40V37C40 34 42 32 45 32V22Z"
                    fill="currentColor"
                  />
                  <path
                    d="M42 42H58V58C58 60 55 62 50 62C45 62 42 60 42 58V42Z"
                    fill="currentColor"
                  />
                  {/* Chakra Base */}
                  <circle cx="50" cy="68" r="7" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="68" r="2" fill="currentColor" />
                  <path d="M50 61V75M43 68H57M45 63L55 73M55 63L45 73" stroke="currentColor" strokeWidth="1" />

                  {/* Base pedestal */}
                  <path d="M35 78H65V82H35V78Z" fill="currentColor" />
                  <path d="M30 84H70V87H30V84Z" fill="currentColor" />
                </svg>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-700 text-[8px] font-black text-amber-100 uppercase tracking-widest rounded shadow-sm whitespace-nowrap">
                सत्यमेव जयते
              </div>
            </div>

            {/* Title & Subtitles */}
            <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                राजसमंद जिला मूल्यांकन पोर्टल
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                Rajsamand District Assessment Portal
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <span>District Evaluation Cell</span>
                <span>•</span>
                <span className="text-slate-500">Office of District Collector, Rajsamand</span>
              </p>
            </div>
          </div>

          {/* User Profile & Account Action */}
          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-200 dark:border-slate-800 pt-2 md:pt-0">
            {role === 'ADMIN' ? (
              <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-emerald-900 dark:text-emerald-200">
                    District Administrator
                  </span>
                  <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                    admin@rajsamand.gov.in
                  </span>
                </div>
                <button
                  id="admin-logout-btn"
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors ml-1"
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
                    {candidate.registrationId} • {candidate.block} Tehsil
                  </span>
                </div>
                <button
                  id="candidate-logout-btn"
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="open-login-btn"
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
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
          <nav className="flex items-center space-x-1 overflow-x-auto py-1">
            {role === 'ADMIN' ? (
              <>
                <button
                  id="tab-analytics"
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>District Analytics</span>
                </button>

                <button
                  id="tab-upload-paper"
                  onClick={() => setActiveTab('upload-paper')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'upload-paper'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Create Assessment</span>
                </button>

                <button
                  id="tab-candidates"
                  onClick={() => setActiveTab('candidates')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'candidates'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Candidate Directory</span>
                </button>

                <button
                  id="tab-email-logs"
                  onClick={() => setActiveTab('email-logs')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'email-logs'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Notification Audit Logs</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="tab-my-tests"
                  onClick={() => setActiveTab('my-tests')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'my-tests'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Available Assessments</span>
                </button>

                <button
                  id="tab-my-performance"
                  onClick={() => setActiveTab('my-performance')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'my-performance'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>My Performance & Scorecard</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

