import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  CheckCircle2,
  Copy,
  Check,
  X,
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
  Globe,
  ExternalLink,
  Zap,
  Compass,
} from 'lucide-react';
import { downloadWindowsSetupScript, downloadWindowsVbsInstaller } from '../utils/desktopAppDownloader';
import { PortalLogo } from './PortalLogo';

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
  const [activeTab, setActiveTab] = useState<'PWA_DIRECT' | 'FIREFOX_USERS' | 'CMD_INSTALL' | 'BROWSER_GUIDE'>('PWA_DIRECT');
  const [internalPrompt, setInternalPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [isFirefox, setIsFirefox] = useState<boolean>(false);

  const deferredPrompt = externalPrompt !== undefined ? externalPrompt : internalPrompt;
  const setPrompt = setExternalPrompt || setInternalPrompt;

  useEffect(() => {
    // Detect Firefox browser
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('firefox') > -1) {
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

  // 1-Click Native PWA Install
  const handleDirectPwaInstall = async () => {
    if (isFirefox) {
      setActiveTab('FIREFOX_USERS');
      setInstallStatus('Mozilla Firefox डेस्कटॉप PWA इंस्टॉलेशन का समर्थन नहीं करता है। कृपया नीचे दिए गए 1-Click Setup (.cmd) या Chrome/Edge का उपयोग करें।');
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setInstallStatus('✅ बधाई! राजसमंद जिला मूल्यांकन पोर्टल सफलतापूर्वक आपके Windows डेस्कटॉप पर इंस्टॉल हो गया है!');
        } else {
          setInstallStatus('इंस्टॉलेशन रद्द कर दिया गया। आप किसी भी समय पुनः इंस्टॉल कर सकते हैं।');
        }
      } catch (err) {
        console.error(err);
        setInstallStatus('ब्राउज़र एड्रेस बार के दाईं ओर मौजूद "Install" (🖥️) आइकन पर क्लिक करें।');
      }
    } else {
      setInstallStatus('यदि ब्राउज़र ने स्वतः प्रॉम्प्ट नहीं दिया है, तो नीचे दिए गए 1-Click Windows Setup (.cmd) डाउनलोड करें।');
      setActiveTab('BROWSER_GUIDE');
    }
  };

  const handleDownloadCmd = () => {
    downloadWindowsSetupScript(currentUrl);
    setInstallStatus('Windows इंस्टॉलर फ़ाइल (Rajsamand_Portal_Setup.cmd) डाउनलोड हो गई है। इसे ओपन करके रन करें!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-inner">
              <PortalLogo size={36} darkMode={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Windows Desktop Application Setup
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  All Browsers & Windows
                </span>
              </div>
              <p className="text-xs text-slate-300">
                राजसमंद जिला मूल्यांकन एवं टाइपिंग पोर्टल - डेस्कटॉप ऐप इंस्टॉलर
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('PWA_DIRECT')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'PWA_DIRECT'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1. डायरेक्ट PWA ऐप इंस्टॉल (Chrome/Edge)</span>
          </button>

          <button
            onClick={() => setActiveTab('FIREFOX_USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'FIREFOX_USERS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-orange-500" />
            <span className="text-orange-700 dark:text-orange-400 font-bold">2. Mozilla Firefox यूज़र्स के लिए</span>
          </button>

          <button
            onClick={() => setActiveTab('CMD_INSTALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'CMD_INSTALL'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>3. 1-Click Windows Setup (.CMD)</span>
          </button>

          <button
            onClick={() => setActiveTab('BROWSER_GUIDE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'BROWSER_GUIDE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>4. स्टेप-बाय-स्टेप गाइड</span>
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

          {/* Special Firefox Banner if detected */}
          {isFirefox && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-400 text-orange-900 dark:text-orange-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-orange-800 dark:text-orange-300">
                <Compass className="w-5 h-5 text-orange-600" />
                <span>आप Mozilla Firefox ब्राउज़र का उपयोग कर रहे हैं</span>
              </div>
              <p className="leading-relaxed">
                <b>ध्यान दें:</b> Mozilla Firefox ने डेस्कटॉप पर डायरेक्ट PWA इंस्टॉलेशन सपोर्ट हटा दिया है। अपने Windows PC पर डेस्कटॉप ऐप आइकन बनाने के लिए कृपया नीचे दिए गए <b>"Download Windows Setup (.cmd)"</b> बटन पर क्लिक करें।
              </p>
              <button
                onClick={handleDownloadCmd}
                className="mt-1 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Firefox यूज़र्स के लिए Windows Setup डाउनलोड करें</span>
              </button>
            </div>
          )}

          {/* TAB 1: 1-CLICK PWA DIRECT INSTALL (Chrome / Edge) */}
          {activeTab === 'PWA_DIRECT' && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-slate-100 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900/80 border-2 border-amber-500/40 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-600/30 shrink-0">
                      <Monitor className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Windows Desktop App Direct Install
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Google Chrome एवं Microsoft Edge में सीधे 1-क्लिक में डेस्कटॉप ऐप इंस्टॉल करें।
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDirectPwaInstall}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-900/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Install Desktop App Now</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Desktop & Start Menu</span>
                      <span className="text-[11px] text-slate-500">Windows में अलग सॉफ़्टवेयर की तरह जुड़ेगा</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Full Screen Kiosk</span>
                      <span className="text-[11px] text-slate-500">टाइपिंग टेस्ट के दौरान कोई डिस्टर्बेंस नहीं</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Fast & Secure</span>
                      <span className="text-[11px] text-slate-500">ऑफ़लाइन सेवा और सुरक्षित वातावरण</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FIREFOX USERS GUIDE & SOLUTION */}
          {activeTab === 'FIREFOX_USERS' && (
            <div className="space-y-6">
              
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Mozilla Firefox में ऐप इंस्टॉल क्यों नहीं होता?
                    </h3>
                    <p className="text-xs text-slate-500">
                      तकनीकी कारण और Firefox यूज़र्स के लिए तत्काल समाधान
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1.5">
                  <p className="font-bold">⚠️ Mozilla Firefox की आधिकारिक नीति (SSB Deprecation):</p>
                  <p>
                    Mozilla Firefox टीम ने वर्शन 85 के बाद से डेस्कटॉप PWA (Site Specific Browser / Install App) सुविधा को डिप्रिकेट कर दिया है। इसी कारण Firefox में "Install App" का पॉपअप नहीं आता है।
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Firefox यूज़र्स के लिए 2 सरल समाधान:
                  </h4>

                  {/* Option 1: 1-Click Setup Script */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">A</span>
                        <span>1-Click Windows Setup (.cmd) चलाएं</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        यह फ़ाइल डाउनलोड करके रन करने पर आपके Windows डेस्कटॉप पर पोर्टल का शॉर्टकट बन जाएगा।
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadCmd}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .cmd Setup</span>
                    </button>
                  </div>

                  {/* Option 2: Open in Chrome or Edge */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">B</div>
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Google Chrome या Microsoft Edge में लिंक खोलें
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        इस पोर्टल URL को Chrome या Edge में खोलें, जहाँ 1-क्लिक में डायरेक्ट डेस्कटॉप ऐप इंस्टॉल करने का विकल्प मिलता है।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CMD SETUP (Universal for all Windows) */}
          {activeTab === 'CMD_INSTALL' && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Download className="w-5 h-5 text-amber-500" />
                      <span>यूनिवर्सल Windows डेस्कटॉप इंस्टॉलर (.cmd)</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      सभी ब्राउज़रों (Firefox, Chrome, Edge, Brave, Opera) और सभी Windows 10/11 कंप्यूटरों पर 100% काम करता है।
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadCmd}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Windows Setup (.cmd)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">कैसे चलाएं:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>फ़ाइल डाउनलोड करें: <code className="text-amber-600 font-mono font-bold">Rajsamand_Portal_Setup.cmd</code></li>
                    <li>फ़ाइल पर डबल-क्लिक करें।</li>
                    <li>डेस्कटॉप पर तुरंत <b>"Rajsamand District Assessment Portal"</b> का ऐप शॉर्टकट बन जाएगा!</li>
                  </ol>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: BROWSER GUIDE */}
          {activeTab === 'BROWSER_GUIDE' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Edge Instructions */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                      E
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">Microsoft Edge</h4>
                      <p className="text-[11px] text-slate-500">Windows का डिफ़ॉल्ट ब्राउज़र</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                      <p>एड्रेस बार के दाईं ओर बने <b>"Install App"</b> (<Monitor className="inline w-3.5 h-3.5 text-blue-500" />) आइकन पर क्लिक करें।</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                      <p><b>"Install"</b> पर क्लिक करें।</p>
                    </div>
                  </div>
                </div>

                {/* Chrome Instructions */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm">
                      C
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">Google Chrome</h4>
                      <p className="text-[11px] text-slate-500">Chrome ब्राउज़र</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                      <p>एड्रेस बार के दाईं ओर <b>"Install"</b> (<Download className="inline w-3.5 h-3.5 text-amber-500" />) पर क्लिक करें।</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                      <p><b>"Install"</b> पर क्लिक करें।</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Rajsamand District Assessment Portal • Windows Desktop Setup
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
