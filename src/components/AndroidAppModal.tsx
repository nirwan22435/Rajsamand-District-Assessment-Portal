import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { PortalLogo } from './PortalLogo';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  setDeferredPrompt?: (prompt: any) => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirmDownload = () => {
    setIsDownloading(true);

    try {
      // Trigger download of RDAA.apk
      const link = document.createElement('a');
      link.href = '/api/download/RDAA.apk';
      link.setAttribute('download', 'RDAA.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    } catch {
      // Direct window location fallback
      window.location.href = '/RDAA.apk';
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div
      id="rdaa-apk-download-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-center p-6"
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

        {/* Exact Portal Logo */}
        <div className="flex justify-center mt-2 mb-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <PortalLogo size={68} />
          </div>
        </div>

        {/* App Title */}
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          RDAA
        </h3>
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Application Package (APK)</span>
        </p>

        {/* Confirmation Question */}
        <div className="mt-5 py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
          Do you want to download <strong className="text-slate-900 dark:text-white font-bold">RDAA.apk</strong>?
        </div>

        {/* Action Buttons: Cancel or Download APK */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDownload}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
          >
            {isDownloading ? (
              downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting...</span>
                </>
              )
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download APK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
