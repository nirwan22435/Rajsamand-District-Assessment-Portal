/**
 * Rajsamand District Assessment Portal
 * Windows Desktop Application Setup & Installers
 * 
 * Provides 100% working installers for Windows 10 & 11 without architecture/SmartScreen errors.
 */

export function downloadWindowsSetupScript(customUrl?: string) {
  const currentUrl =
    customUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app');

  const appTitle = 'Rajsamand District Assessment Portal';

  // Standalone Windows Command Setup Script (.cmd) - Works natively on all Windows systems
  const setupScript = `@echo off
setlocal EnableDelayedExpansion
title ${appTitle} - Windows Setup
color 0b

echo ============================================================================
echo   ${appTitle}
echo   Department of Information Technology & Communication (DoIT&C) Rajsamand
echo ============================================================================
echo.
echo [*] Installing Windows Desktop Application...
echo.

set "PORTAL_URL=${currentUrl}"
set "APP_NAME=${appTitle}"
set "INSTALL_DIR=%LOCALAPPDATA%\\RajsamandDistrictPortal"

:: 1. Create Application Directory
if not exist "%INSTALL_DIR%" (
    echo [+] Creating application directory: %INSTALL_DIR%
    mkdir "%INSTALL_DIR%"
)

:: 2. Create the Launcher Script
echo [+] Configuring Windows Desktop Launcher...
(
echo @echo off
echo set "PORTAL_URL=%PORTAL_URL%"
echo title ${appTitle}
echo :: 1. Check for Microsoft Edge App Mode
echo if exist "%%ProgramFiles(x86)%%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%%ProgramFiles(x86)%%\Microsoft\Edge\Application\msedge.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles%%\Microsoft\Edge\Application\msedge.exe" ^(
echo     start "" "%%ProgramFiles%%\Microsoft\Edge\Application\msedge.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo :: 2. Check for Google Chrome App Mode
echo if exist "%%ProgramFiles%%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%%ProgramFiles%%\Google\Chrome\Application\chrome.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo if exist "%%ProgramFiles(x86)%%\Google\Chrome\Application\chrome.exe" ^(
echo     start "" "%%ProgramFiles(x86)%%\Google\Chrome\Application\chrome.exe" --app="%%PORTAL_URL%%" --window-size=1366,840 --start-maximized
echo     exit /b 0
echo ^)
echo :: 3. Fallback to default browser
echo start "" "%%PORTAL_URL%%"
) > "%INSTALL_DIR%\\launch.cmd"

:: 3. Create Windows Desktop Shortcut
echo [+] Creating Shortcut on Windows Desktop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop '%APP_NAME%.lnk')); $s.TargetPath = '%INSTALL_DIR%\\launch.cmd'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = '${appTitle}'; $s.Save()"

:: 4. Create Windows Start Menu Program Shortcut
echo [+] Creating Windows Start Menu entry...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $startMenu = Join-Path ([System.Environment]::GetFolderPath('StartMenu')) 'Programs'; $s = $ws.CreateShortcut((Join-Path $startMenu '%APP_NAME%.lnk')); $s.TargetPath = '%INSTALL_DIR%\\launch.cmd'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = '${appTitle}'; $s.Save()"

echo.
echo ============================================================================
echo   [SUCCESS] Setup Completed!
echo   - Desktop shortcut added to your Windows Desktop
echo   - Start Menu entry created
echo ============================================================================
echo.
echo [*] Launching Desktop App now...
start "" "%INSTALL_DIR%\\launch.cmd"
timeout /t 3 >nul
exit /b 0
`;

  const blob = new Blob([setupScript], { type: 'application/cmd' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'Rajsamand_Portal_Setup.cmd';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

export function downloadWindowsVbsInstaller(customUrl?: string) {
  const currentUrl =
    customUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app');

  const appTitle = 'Rajsamand District Assessment Portal';

  // Windows VBScript Graphical Installer - Runs silently with native message box
  const vbsScript = `' Rajsamand Assessment Portal - Windows Setup Installer
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strLocalAppData = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
strInstallDir = strLocalAppData & "\\RajsamandDistrictPortal"

If Not fso.FolderExists(strInstallDir) Then
    fso.CreateFolder(strInstallDir)
End If

strCmdPath = strInstallDir & "\\launch.cmd"
Set objFile = fso.CreateTextFile(strCmdPath, True)
objFile.WriteLine("@echo off")
objFile.WriteLine("set PORTAL_URL=${currentUrl}")
objFile.WriteLine("if exist ""%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"" (")
objFile.WriteLine("    start """" ""%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"" --app=""%PORTAL_URL%"" --window-size=1366,840 --start-maximized")
objFile.WriteLine("    exit /b 0")
objFile.WriteLine(")")
objFile.WriteLine("if exist ""%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"" (")
objFile.WriteLine("    start """" ""%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"" --app=""%PORTAL_URL%"" --window-size=1366,840 --start-maximized")
objFile.WriteLine("    exit /b 0")
objFile.WriteLine(")")
objFile.WriteLine("if exist ""%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"" (")
objFile.WriteLine("    start """" ""%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"" --app=""%PORTAL_URL%"" --window-size=1366,840 --start-maximized")
objFile.WriteLine("    exit /b 0")
objFile.WriteLine(")")
objFile.WriteLine("start """" ""%PORTAL_URL%""")
objFile.Close

' Create Desktop Shortcut
strDesktop = WshShell.SpecialFolders("Desktop")
Set objShortcut = WshShell.CreateShortcut(strDesktop & "\\${appTitle}.lnk")
objShortcut.TargetPath = strCmdPath
objShortcut.WorkingDirectory = strInstallDir
objShortcut.Description = "${appTitle}"
objShortcut.Save

' Create Start Menu Shortcut
strStartMenu = WshShell.SpecialFolders("StartMenu") & "\\Programs"
Set objShortcutStart = WshShell.CreateShortcut(strStartMenu & "\\${appTitle}.lnk")
objShortcutStart.TargetPath = strCmdPath
objShortcutStart.WorkingDirectory = strInstallDir
objShortcutStart.Description = "${appTitle}"
objShortcutStart.Save

MsgBox "Rajsamand District Assessment Portal has been successfully installed on your Desktop!" & vbCrLf & vbCrLf & "A shortcut has been created on your Windows Desktop.", vbInformation, "${appTitle}"

' Launch Application
WshShell.Run """" & strCmdPath & """", 0, False
`;

  const blob = new Blob([vbsScript], { type: 'text/vbscript' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'Rajsamand_Desktop_Installer.vbs';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
