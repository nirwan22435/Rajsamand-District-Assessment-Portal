!include "MUI2.nsh"

Name "Rajsamand District Assessment Portal"
OutFile "public/Rajsamand_Portal_Setup.exe"
InstallDir "$LOCALAPPDATA\RajsamandDistrictPortal"
InstallDirRegKey HKCU "Software\RajsamandDistrictPortal" "Install_Dir"
RequestExecutionLevel user

VIProductVersion "2.5.0.0"
VIAddVersionKey "ProductName" "Rajsamand District Assessment Portal"
VIAddVersionKey "CompanyName" "Department of Information Technology & Communication (DoIT&C), District Administration Rajsamand"
VIAddVersionKey "LegalCopyright" "District Administration Rajsamand"
VIAddVersionKey "FileDescription" "Rajsamand District Assessment Portal Desktop Setup"
VIAddVersionKey "FileVersion" "2.5.0.0"
VIAddVersionKey "ProductVersion" "2.5.0.0"

!define MUI_ICON "public/app.ico"
!define MUI_UNICON "public/app.ico"
!define MUI_ABORTWARNING

; Welcome Page
!define MUI_WELCOMEPAGE_TITLE "Welcome to Rajsamand District Assessment Portal Setup"
!define MUI_WELCOMEPAGE_TEXT "This setup will install Rajsamand District Assessment Portal on your computer and create a desktop icon for 1-click launch.$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME

; Directory Selection
!insertmacro MUI_PAGE_DIRECTORY

; Installation
!insertmacro MUI_PAGE_INSTFILES

; Finish Page with Auto-Launch
!define MUI_FINISHPAGE_RUN "$INSTDIR\RajsamandPortal.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Rajsamand District Assessment Portal"
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install Application" SEC01
  SetOutPath "$INSTDIR"
  
  ; Write portal url config
  FileOpen $0 "$INSTDIR\portal_url.txt" w
  FileWrite $0 "https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app"
  FileClose $0

  ; Copy Application Binaries & Assets
  File RajsamandPortal.exe
  File "public/app.ico"

  ; Clear any previous stale web app icon cache
  RMDir /r "$INSTDIR\Profile\Default\Web Applications"

  ; Pre-create First Run file to bypass browser sign-in wizard
  CreateDirectory "$LOCALAPPDATA\RajsamandDistrictPortal\Profile"
  FileOpen $0 "$LOCALAPPDATA\RajsamandDistrictPortal\Profile\First Run" w
  FileClose $0

  ; Create Desktop Shortcut with Icon
  CreateShortcut "$DESKTOP\Rajsamand District Assessment Portal.lnk" "$INSTDIR\RajsamandPortal.exe" "" "$INSTDIR\app.ico" 0 "" "" "Rajsamand District Assessment Portal"

  ; Create Start Menu Shortcuts
  CreateDirectory "$SMPROGRAMS\Rajsamand District Assessment Portal"
  CreateShortcut "$SMPROGRAMS\Rajsamand District Assessment Portal\Rajsamand District Assessment Portal.lnk" "$INSTDIR\RajsamandPortal.exe" "" "$INSTDIR\app.ico" 0 "" "" "Rajsamand District Assessment Portal"
  CreateShortcut "$SMPROGRAMS\Rajsamand District Assessment Portal\Uninstall Rajsamand Portal.lnk" "$INSTDIR\Uninstall.exe" "" "" 0

  ; Stamp AppUserModelId onto both shortcuts so Windows taskbar accurately matches the app icon
  ExecWait '"$INSTDIR\RajsamandPortal.exe" --setup-shortcuts'
  System::Call 'shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'

  ; Write Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Windows Registry Configuration (Add / Remove Programs in Control Panel & Settings)
  WriteRegStr HKCU "Software\RajsamandDistrictPortal" "Install_Dir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "DisplayName" "Rajsamand District Assessment Portal"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "DisplayIcon" '"$INSTDIR\app.ico"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "DisplayVersion" "2.5.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "Publisher" "DoIT&C, District Administration Rajsamand"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "URLInfoAbout" "https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\Rajsamand District Assessment Portal.lnk"
  Delete "$SMPROGRAMS\Rajsamand District Assessment Portal\Rajsamand District Assessment Portal.lnk"
  Delete "$SMPROGRAMS\Rajsamand District Assessment Portal\Uninstall Rajsamand Portal.lnk"
  RMDir "$SMPROGRAMS\Rajsamand District Assessment Portal"

  Delete "$INSTDIR\RajsamandPortal.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\portal_url.txt"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\Profile"
  RMDir "$INSTDIR"

  System::Call 'shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\RajsamandDistrictPortal"
  DeleteRegKey HKCU "Software\RajsamandDistrictPortal"
SectionEnd
