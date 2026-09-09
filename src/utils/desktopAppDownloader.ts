/**
 * Rajsamand District Assessment Portal
 * Windows Desktop Application Setup (.EXE)
 * 
 * Provides official Windows .EXE Installer setup (Rajsamand_Portal_Setup.exe).
 * Installs directly into system memory (%LOCALAPPDATA%\RajsamandDistrictPortal)
 * and creates the desktop icon and Start Menu entry.
 */

export function downloadWindowsExeInstaller() {
  const downloadUrl = '/Rajsamand_Portal_Setup.exe';
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'Rajsamand_Portal_Setup.exe';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

// Legacy alias ensuring any existing references download the .exe installer
export function downloadWindowsSetupScript() {
  downloadWindowsExeInstaller();
}

export function downloadWindowsVbsInstaller() {
  downloadWindowsExeInstaller();
}
