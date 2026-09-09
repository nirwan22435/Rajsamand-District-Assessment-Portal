import React, { useState } from 'react';
import {
  Monitor,
  Download,
  CheckCircle2,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { downloadWindowsExeInstaller } from '../utils/desktopAppDownloader';
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
  deferredPrompt,
  setDeferredPrompt,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadUrl = '/Rajsamand_Portal_Setup.exe';

  const handleConfirmDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      // 1. Fetch binary blob to ensure reliable download
      const res = await fetch(downloadUrl, { cache: 'no-store' });
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 500) {
          const blobUrl = window.URL.createObjectURL(
            new Blob([blob], { type: 'application/x-msdownload' })
          );
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = 'Rajsamand_Portal_Setup.exe';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 3000);

          setDownloadSuccess(true);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadSuccess(false);
            onClose();
          }, 1800);
          return;
        }
      }

      // 2. Direct fallback
      downloadWindowsExeInstaller();
      setDownloadSuccess(true);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Desktop installer download failed:', err);
      // Fallback via helper
      try {
        downloadWindowsExeInstaller();
        setDownloadSuccess(true);
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadSuccess(false);
          onClose();
        }, 1800);
      } catch {
        setDownloadError(
          'Download was blocked by browser. Please try again.'
        );
        setIsDownloading(false);
      }
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted' && setDeferredPrompt) {
        setDeferredPrompt(null);
      }
      onClose();
    }
  };

  return (
    <div
      id="rdaa-desktop-download-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Portal Logo */}
        <div className="flex justify-center mt-1 mb-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <PortalLogo size={58} />
          </div>
        </div>

        {/* App Title & Badges */}
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          RDA Desktop App
        </h3>
        <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5 flex items-center justify-center gap-1">
          <Monitor className="w-3.5 h-3.5" />
          <span>Rajsamand District Assessment Application</span>
        </p>

        {/* Technical Specs Pill Bar */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
            v1.0.0
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            ~468 KB .EXE
          </span>
          <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1 border border-sky-300 dark:border-sky-800">
            <ShieldCheck className="w-3 h-3" />
            Windows Setup
          </span>
        </div>

        {/* Confirmation Question */}
        <div className="mt-4 py-3 px-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium text-left">
          <p>
            Download <strong className="text-slate-900 dark:text-white font-bold">Rajsamand_Portal_Setup.exe</strong> to install on your Windows computer or laptop.
          </p>
        </div>

        {/* Error Notice if any */}
        {downloadError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <p className="font-semibold">{downloadError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons: Cancel or Download .EXE */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDownload}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
          >
            {isDownloading ? (
              downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-sky-200" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Setup...</span>
                </>
              )
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download .EXE</span>
              </>
            )}
          </button>
        </div>

        {/* Optional PWA Install if supported */}
        {deferredPrompt && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleInstallPWA}
              className="w-full py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Or Install Desktop App Directly via Browser</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
