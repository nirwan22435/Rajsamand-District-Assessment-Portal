import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Laptop,
  Cpu,
  Lock,
  ArrowRight,
  HelpCircle,
  HardDrive,
  FileCode,
  Package,
} from 'lucide-react';

interface DesktopSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  setDeferredPrompt?: (prompt: any) => void;
}

export const DesktopSetupModal: React.FC<DesktopSetupModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt: externalPrompt,
  setDeferredPrompt: setExternalPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'PWA_INSTALL' | 'PORTABLE_BAT' | 'ELECTRON_EXE' | 'KIOSK_MODE'>('PWA_INSTALL');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [internalPrompt, setInternalPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  const [isFirefox, setIsFirefox] = useState<boolean>(false);

  const deferredPrompt = externalPrompt !== undefined ? externalPrompt : internalPrompt;
  const setPrompt = setExternalPrompt || setInternalPrompt;

  useEffect(() => {
    // Detect Firefox
    if (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox')) {
      setIsFirefox(true);
    }

    // Check if app is already running in standalone / PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app';

  // Windows Desktop Setup Script (creates Desktop shortcut .lnk and launches standalone)
  const batchSetupScript = `@echo off
setlocal EnableDelayedExpansion
:: ============================================================================
:: Rajsamand District Assessment Portal - Official Windows Desktop Installer
:: Department of Information Technology & Communication (DoIT&C) Rajsamand
:: ============================================================================
title Rajsamand District Assessment Portal - Windows Setup
color 0b

echo ============================================================================
echo   Rajsamand District Assessment & Typing Examination Portal
echo   Government of Rajasthan - DoIT&C Rajsamand
echo ============================================================================
echo.
echo [*] Initializing Windows Desktop Application Setup...
echo.

set "PORTAL_URL=${currentUrl}"
set "APP_NAME=Rajsamand District Assessment Portal"
set "INSTALL_DIR=%LOCALAPPDATA%\\RajsamandDistrictPortal"

:: 1. Create App Folder in Local AppData
if not exist "%INSTALL_DIR%" (
    echo [+] Creating application directory: %INSTALL_DIR%
    mkdir "%INSTALL_DIR%"
)

:: 2. Create the App Launcher Runner
echo [+] Configuring Desktop Application Launcher...
(
echo @echo off
echo set "PORTAL_URL=%PORTAL_URL%"
echo title Rajsamand District Assessment Portal
echo :: Check for Microsoft Edge App Mode
echo if exist "%%ProgramFiles(x86)%%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%%ProgramFiles(x86)%%\Microsoft\Edge\Application\msedge.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles%%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%%ProgramFiles%%\Microsoft\Edge\Application\msedge.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo :: Check for Google Chrome App Mode
echo if exist "%%ProgramFiles%%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%%ProgramFiles%%\Google\Chrome\Application\chrome.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles(x86)%%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%%ProgramFiles(x86)%%\Google\Chrome\Application\chrome.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo :: Check for Mozilla Firefox
echo if exist "%%ProgramFiles%%\Mozilla Firefox\firefox.exe" ^(
echo     start "" "%%ProgramFiles%%\Mozilla Firefox\firefox.exe" -new-window "%%PORTAL_URL%%"
echo     exit /b 0
echo ^)
echo :: Fallback default
echo start "" "%%PORTAL_URL%%"
) > "%INSTALL_DIR%\\launch.bat"

:: 3. Create Desktop Shortcut (.lnk)
echo [+] Creating Desktop Shortcut on Windows Desktop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop '%APP_NAME%.lnk')); $s.TargetPath = '%INSTALL_DIR%\\launch.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'Official Rajsamand District Assessment Portal'; $s.Save()"

:: 4. Create Windows Start Menu Shortcut
echo [+] Creating Windows Start Menu entry...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $startMenu = Join-Path ([System.Environment]::GetFolderPath('StartMenu')) 'Programs'; $s = $ws.CreateShortcut((Join-Path $startMenu '%APP_NAME%.lnk')); $s.TargetPath = '%INSTALL_DIR%\\launch.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'Official Rajsamand District Assessment Portal'; $s.Save()"

echo.
echo ============================================================================
echo   [SUCCESS] INSTALLATION COMPLETE!
echo   1. Desktop shortcut created: '%APP_NAME%' on your Windows Desktop.
echo   2. Start Menu program added.
echo ============================================================================
echo.
echo [*] Launching application now...
start "" "%INSTALL_DIR%\\launch.bat"
timeout /t 3 >nul
exit /b 0`;

  // Download 1-Click Windows Setup .BAT
  const downloadSetupBat = () => {
    const blob = new Blob([batchSetupScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rajsamand_Portal_Windows_Setup.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInstallStatus('Windows इंस्टॉलर सेटअप फ़ाइल (Rajsamand_Portal_Windows_Setup.bat) डाउनलोड हो गई है। डाउनलोड लिस्ट से इस पर क्लिक करें।');
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallStatus('डेस्कटॉप एप्लीकेशन सफलतापूर्वक स्थापित की गई!');
        setIsInstalled(true);
      }
      setPrompt(null);
    } else {
      // Direct 1-click Windows installer setup download for Firefox and other browsers
      downloadSetupBat();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  // Portable Windows Launcher Batch Script content
  const batchLauncherScript = `@echo off
:: ============================================================================
:: Rajsamand District Assessment Portal - Windows Desktop App Launcher
:: Department of Information Technology & Communication (DoIT&C) Rajsamand
:: ============================================================================
title Rajsamand District Assessment Portal
echo ============================================================================
echo  Rajsamand District Assessment & Typing Portal
echo  Launching Desktop Application Mode...
echo ============================================================================

set PORTAL_URL=${currentUrl}

:: 1. Launch with Microsoft Edge (Native on Windows 10 & 11)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

:: 2. Launch with Google Chrome
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

:: 3. Default fallback
start "" "%PORTAL_URL%"
exit /b 0`;

  // Download .bat launcher
  const downloadLauncherBat = () => {
    const blob = new Blob([batchLauncherScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rajsamand_Assessment_Portal_Desktop.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Build EXE script
  const buildExeScript = `:: 1. Install Electron packaging tools
npm install --save-dev electron electron-builder

:: 2. Build production assets
npm run build

:: 3. Package Windows standalone .EXE installer
npx electron-builder --win nsis --x64`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                  Windows Desktop Application Hub
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Setup Ready
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                डेस्कटॉप एप्लीकेशन एवं .EXE इंस्टॉलेशन केंद्र
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('PWA_INSTALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'PWA_INSTALL'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1. डायरेक्ट 1-क्लिक डेस्कटॉप इंस्टॉल (Direct Install)</span>
          </button>

          <button
            onClick={() => setActiveTab('PORTABLE_BAT')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'PORTABLE_BAT'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>2. पोर्टेबल Windows लॉन्चर (.BAT)</span>
          </button>

          <button
            onClick={() => setActiveTab('ELECTRON_EXE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ELECTRON_EXE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>3. Windows .EXE इंस्टॉलर पैकेज (Electron)</span>
          </button>

          <button
            onClick={() => setActiveTab('KIOSK_MODE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'KIOSK_MODE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>4. परीक्षा कियोस्क मोड (Kiosk Lockdown)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Status feedback */}
          {installStatus && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{installStatus}</span>
            </div>
          )}

          {/* TAB 1: PWA 1-CLICK INSTANT DESKTOP INSTALL */}
          {activeTab === 'PWA_INSTALL' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-slate-100 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900/80 border border-amber-300 dark:border-amber-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        1-क्लिक डेस्कटॉप एप्लीकेशन इंस्टॉलेशन (PWA Native App)
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        बिना किसी अतिरिक्त सॉफ़्टवेयर के अपने Windows PC पर सीधे एक स्टैंडअलोन डेस्कटॉप ऐप की तरह चलाएं।
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleInstallPWA}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalled ? 'डेस्कटॉप पर पहले से स्थापित है' : 'अभी डेस्कटॉप ऐप इंस्टॉल करें'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">डेस्कटॉप शॉर्टकट</span>
                      <span className="text-[11px] text-slate-500">Windows Desktop एवं Start Menu में अलग आइकन बनेगा</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">स्टैंडअलोन विंडो</span>
                      <span className="text-[11px] text-slate-500">ब्राउज़र एड्रेस बार व टैब के बिना पूर्ण स्क्रीन में चलेगा</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">ऑफलाइन एवं तेज गति</span>
                      <span className="text-[11px] text-slate-500">DevLys 010 फॉन्ट एवं एसेट्स तेजी से लोड होंगे</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step by Step Visual Guide */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>ब्राउज़र से मैन्युअल रूप से डेस्कटॉप ऐप इंस्टॉल करने की विधि:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Firefox Instructions */}
                  <div className={`p-4 rounded-xl border space-y-2 ${isFirefox ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">A</span>
                        <span>Mozilla Firefox में:</span>
                      </div>
                      {isFirefox && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black">Your Browser</span>
                      )}
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pl-1 text-[11px]">
                      <li><b>"अभी डेस्कटॉप ऐप इंस्टॉल करें"</b> बटन दबाते ही <code className="px-1 py-0.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] rounded font-bold">Rajsamand_Portal_Windows_Setup.bat</code> स्वतः डाउनलोड हो जाती है।</li>
                      <li>Firefox के डाउनलोड बार (<span className="font-bold">↓ आइकन</span>) से उस फ़ाइल पर क्लिक करें।</li>
                      <li>यह तुरंत आपके <b>Windows Desktop पर शॉर्टकट आइकन बनाकर</b> ऐप को पूर्ण स्क्रीन में शुरू कर देगा।</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">B</span>
                      <span>Google Chrome में:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 text-[11px]">
                      <li>एड्रेस बार के दाईं ओर स्थित <b>"Install" (प्लस/मॉनिटर आइकन)</b> पर क्लिक करें।</li>
                      <li>या शीर्ष दाएँ <b>तीन बिंदु (⋮)</b> $\rightarrow$ <b>"Cast, save and share"</b> $\rightarrow$ <b>"Install Rajsamand Portal"</b> चुनें।</li>
                      <li><b>"Install"</b> पर क्लिक करें। आपके डेस्कटॉप पर आइकन आ जाएगा।</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">C</span>
                      <span>Microsoft Edge में:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 text-[11px]">
                      <li>एड्रेस बार में <b>"App available" (वर्ग/प्लस आइकन)</b> पर क्लिक करें।</li>
                      <li>या शीर्ष दाएँ <b>तीन बिंदु (...)</b> $\rightarrow$ <b>"Apps"</b> $\rightarrow$ <b>"Install this site as an app"</b> चुनें।</li>
                      <li><b>"Install"</b> पुष्टि करें। यह Windows टास्कबार पर पिन हो जाएगा।</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTABLE WINDOWS RUNNER (.BAT) */}
          {activeTab === 'PORTABLE_BAT' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                        Windows पोर्टेबल डेस्कटॉप लॉन्चर (.BAT)
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        बिना किसी इंस्टॉलेशन के किसी भी Windows 10 / 11 कंप्यूटर पर डबल-क्लिक करके सीधे डेस्कटॉप ऐप मोड में चलाएं।
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={downloadLauncherBat}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .BAT Launcher</span>
                  </button>
                </div>
              </div>

              {/* Launcher Code & Manual Setup */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-500" />
                    <span>बैच फ़ाइल स्क्रिप्ट कोड (Rajsamand_Assessment_Portal.bat):</span>
                  </span>
                  <button
                    onClick={() => handleCopy(batchLauncherScript, 'bat-script')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript === 'bat-script' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-950 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {batchLauncherScript}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ELECTRON .EXE COMPILATION & SETUP */}
          {activeTab === 'ELECTRON_EXE' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Electron Windows Standalone Installer (.EXE) तैयार करने की विधि
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      पूर्ण नेटिव Windows सेटअप फ़ाइल (`Rajsamand-Assessment-Portal-Setup-1.0.0.exe`) जनरेट करने के चरण:
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Terminal Instructions */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      कदम 1: टर्मिनल में निम्न कमांड्स चलाएं:
                    </span>
                    <button
                      onClick={() => handleCopy(buildExeScript, 'exe-commands')}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedScript === 'exe-commands' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Commands</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-slate-950 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {buildExeScript}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    कदम 2: जनरेट हुई .EXE फ़ाइल प्राप्त करें:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    बिल्ड पूर्ण होने के बाद आपके प्रोजेक्ट डायरेक्टरी के <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-teal-600 dark:text-teal-400">./dist-electron/</code> फोल्डर में <code className="font-bold text-slate-900 dark:text-white">Rajsamand-Assessment-Portal-Setup-1.0.0.exe</code> इंस्टॉलर उपलब्ध हो जाएगा।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KIOSK EXAM LOCKDOWN MODE */}
          {activeTab === 'KIOSK_MODE' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-800/40 text-white space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      परीक्षा केंद्र कियोस्क एवं लॉक-डाउन मोड (Exam Center Kiosk Setup)
                    </h3>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      परीक्षा के दौरान छात्रों द्वारा अन्य एप्लिकेशन, गूगल सर्च या शॉर्टकट कुंजियों (Alt+Tab, F12) का उपयोग रोकने हेतु।
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Windows Assigned Access Kiosk:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Windows 10/11 Pro/Enterprise में <b>Settings $\rightarrow$ Accounts $\rightarrow$ Other users $\rightarrow$ Set up a kiosk</b> में जाकर इस पोर्टल को डिफ़ॉल्ट परीक्षा ऐप के रूप में सेट कर सकते हैं।
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span>सुरक्षित ब्राउज़र पर्यावरण:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    टाइपिंग टेस्ट एवं वस्तुनिष्ठ परीक्षाओं के दौरान राइट-क्लिक, कॉपी-पेस्ट तथा बाहरी विंडो स्विचिंग पर सिस्टम द्वारा स्वतः निगरानी रखी जाती है।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Windows 10, Windows 11 & Cross-Platform Desktop Support</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
