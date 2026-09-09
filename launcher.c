#define _WIN32_WINNT 0x0601
#define COBJMACROS
#include <windows.h>
#include <shlwapi.h>
#include <shlobj.h>
#include <propkey.h>
#include <propvarutil.h>
#include <stdio.h>
#include <string.h>

#ifndef GCLP_HICON
#define GCLP_HICON (-14)
#endif
#ifndef GCLP_HICONSM
#define GCLP_HICONSM (-34)
#endif

#define APP_USER_MODEL_ID L"Rajsamand.District.Assessment.Portal"

typedef HRESULT (WINAPI *pfnSetCurrentProcessExplicitAppUserModelID)(PCWSTR);

// Helper to stamp PKEY_AppUserModel_ID onto a Windows .lnk shortcut file
static HRESULT StampShortcutAppId(LPCWSTR shortcutPath, LPCWSTR appId) {
    HRESULT hrCo = CoInitialize(NULL);
    IShellLinkW *psl = NULL;
    HRESULT hr = CoCreateInstance(&CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, &IID_IShellLinkW, (void **)&psl);
    if (SUCCEEDED(hr)) {
        IPersistFile *ppf = NULL;
        hr = IShellLinkW_QueryInterface(psl, &IID_IPersistFile, (void **)&ppf);
        if (SUCCEEDED(hr)) {
            hr = IPersistFile_Load(ppf, shortcutPath, STGM_READWRITE);
            if (SUCCEEDED(hr)) {
                IPropertyStore *pps = NULL;
                hr = IShellLinkW_QueryInterface(psl, &IID_IPropertyStore, (void **)&pps);
                if (SUCCEEDED(hr)) {
                    PROPVARIANT pv;
                    PropVariantInit(&pv);
                    pv.vt = VT_LPWSTR;
                    pv.pwszVal = (LPWSTR)appId;
                    IPropertyStore_SetValue(pps, &PKEY_AppUserModel_ID, &pv);
                    IPropertyStore_Commit(pps);
                    IPropertyStore_Release(pps);
                    IPersistFile_Save(ppf, NULL, TRUE);
                }
            }
            IPersistFile_Release(ppf);
        }
        IShellLinkW_Release(psl);
    }
    if (SUCCEEDED(hrCo)) {
        CoUninitialize();
    }
    return hr;
}

// Setup shortcuts when called with --setup-shortcuts flag during installation
static void SetupShortcutsHelper(void) {
    WCHAR desktopLnk[MAX_PATH];
    WCHAR startMenuLnk[MAX_PATH];
    
    // Desktop shortcut
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, desktopLnk))) {
        PathAppendW(desktopLnk, L"Rajsamand District Assessment Portal.lnk");
        StampShortcutAppId(desktopLnk, APP_USER_MODEL_ID);
    }
    
    // Start Menu shortcut
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_PROGRAMS, NULL, 0, startMenuLnk))) {
        PathAppendW(startMenuLnk, L"Rajsamand District Assessment Portal\\Rajsamand District Assessment Portal.lnk");
        StampShortcutAppId(startMenuLnk, APP_USER_MODEL_ID);
    }
    
    // Notify Windows Shell that icons/associations were updated
    SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, NULL, NULL);
}

// Window enumeration struct
struct EnumContext {
    DWORD targetPid;
    HWND hFoundWnd;
    HICON hBig;
    HICON hSmall;
};

static BOOL CALLBACK ApplyIconsToAppWindow(HWND hwnd, LPARAM lParam) {
    struct EnumContext *ctx = (struct EnumContext *)lParam;
    DWORD pid = 0;
    GetWindowThreadProcessId(hwnd, &pid);
    
    if (IsWindowVisible(hwnd)) {
        char title[512] = {0};
        char className[256] = {0};
        GetWindowTextA(hwnd, title, sizeof(title) - 1);
        GetClassNameA(hwnd, className, sizeof(className) - 1);
        
        // Check for Chromium top-level app window
        BOOL isMatch = FALSE;
        if (pid == ctx->targetPid) {
            isMatch = TRUE;
        } else if (strstr(className, "Chrome_WidgetWin") != NULL) {
            if (strstr(title, "Rajsamand") != NULL || strstr(title, "RDAA") != NULL || strstr(title, "Assessment") != NULL) {
                isMatch = TRUE;
            }
        }
        
        if (isMatch) {
            LONG style = GetWindowLong(hwnd, GWL_STYLE);
            if ((style & WS_VISIBLE) && !(style & WS_CHILD)) {
                ctx->hFoundWnd = hwnd;
                if (ctx->hBig) {
                    SendMessageTimeoutA(hwnd, WM_SETICON, ICON_BIG, (LPARAM)ctx->hBig, SMTO_ABORTIFHUNG, 200, NULL);
                    SetClassLongPtrA(hwnd, GCLP_HICON, (LONG_PTR)ctx->hBig);
                }
                if (ctx->hSmall) {
                    SendMessageTimeoutA(hwnd, WM_SETICON, ICON_SMALL, (LPARAM)ctx->hSmall, SMTO_ABORTIFHUNG, 200, NULL);
                    SetClassLongPtrA(hwnd, GCLP_HICONSM, (LONG_PTR)ctx->hSmall);
                }
            }
        }
    }
    return TRUE; // Continue scanning in case of multiple related windows
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Check if invoked by installer to stamp AppUserModelID
    if (lpCmdLine && strstr(lpCmdLine, "--setup-shortcuts") != NULL) {
        SetupShortcutsHelper();
        return 0;
    }

    // 2. Set AppUserModelId for the current process
    HMODULE hShell32 = LoadLibraryA("shell32.dll");
    if (hShell32) {
        pfnSetCurrentProcessExplicitAppUserModelID pfnSetAUMID = 
            (pfnSetCurrentProcessExplicitAppUserModelID)GetProcAddress(hShell32, "SetCurrentProcessExplicitAppUserModelID");
        if (pfnSetAUMID) {
            pfnSetAUMID(APP_USER_MODEL_ID);
        }
    }

    // 3. Resolve execution directory & URL
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char exeDir[MAX_PATH];
    strncpy(exeDir, exePath, MAX_PATH - 1);
    exeDir[MAX_PATH - 1] = '\0';
    char *lastSlash = strrchr(exeDir, '\\');
    if (lastSlash) {
        *lastSlash = '\0';
    }

    char url[1024] = "https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app";
    char configPath[MAX_PATH];
    snprintf(configPath, sizeof(configPath), "%s\\portal_url.txt", exeDir);
    FILE *f = fopen(configPath, "r");
    if (f) {
        char buffer[1024];
        if (fgets(buffer, sizeof(buffer), f)) {
            char *p = buffer;
            while (*p == ' ' || *p == '\t' || *p == '\r' || *p == '\n') p++;
            char *end = p + strlen(p) - 1;
            while (end > p && (*end == ' ' || *end == '\t' || *end == '\r' || *end == '\n')) {
                *end = '\0';
                end--;
            }
            if (strlen(p) > 5) {
                strncpy(url, p, sizeof(url) - 1);
                url[sizeof(url) - 1] = '\0';
            }
        }
        fclose(f);
    }

    // 4. Load application icon from app.ico
    char icoPath[MAX_PATH];
    snprintf(icoPath, sizeof(icoPath), "%s\\app.ico", exeDir);
    HICON hIconBig = (HICON)LoadImageA(NULL, icoPath, IMAGE_ICON, 48, 48, LR_LOADFROMFILE);
    if (!hIconBig) {
        hIconBig = (HICON)LoadImageA(NULL, icoPath, IMAGE_ICON, 32, 32, LR_LOADFROMFILE);
    }
    HICON hIconSmall = (HICON)LoadImageA(NULL, icoPath, IMAGE_ICON, 16, 16, LR_LOADFROMFILE);

    // 5. Locate Microsoft Edge or Google Chrome executable
    char browserPath[MAX_PATH] = {0};
    char testPath[MAX_PATH];

    // Priority 1: Edge 64-bit
    ExpandEnvironmentStringsA("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe", testPath, MAX_PATH);
    if (GetFileAttributesA(testPath) != INVALID_FILE_ATTRIBUTES) {
        strncpy(browserPath, testPath, MAX_PATH - 1);
    }
    // Priority 2: Edge 32-bit
    if (!browserPath[0]) {
        ExpandEnvironmentStringsA("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe", testPath, MAX_PATH);
        if (GetFileAttributesA(testPath) != INVALID_FILE_ATTRIBUTES) {
            strncpy(browserPath, testPath, MAX_PATH - 1);
        }
    }
    // Priority 3: Chrome 64-bit
    if (!browserPath[0]) {
        ExpandEnvironmentStringsA("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe", testPath, MAX_PATH);
        if (GetFileAttributesA(testPath) != INVALID_FILE_ATTRIBUTES) {
            strncpy(browserPath, testPath, MAX_PATH - 1);
        }
    }
    // Priority 4: Chrome 32-bit
    if (!browserPath[0]) {
        ExpandEnvironmentStringsA("%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe", testPath, MAX_PATH);
        if (GetFileAttributesA(testPath) != INVALID_FILE_ATTRIBUTES) {
            strncpy(browserPath, testPath, MAX_PATH - 1);
        }
    }

    // Fallback if no Chromium browser found
    if (!browserPath[0]) {
        ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL);
        return 0;
    }

    // 6. Build profile directory & suppress any browser First-Run or Sign-In prompts
    char localAppData[MAX_PATH];
    ExpandEnvironmentStringsA("%LOCALAPPDATA%", localAppData, MAX_PATH);

    char appBaseDir[MAX_PATH];
    snprintf(appBaseDir, sizeof(appBaseDir), "%s\\RajsamandDistrictPortal", localAppData);
    CreateDirectoryA(appBaseDir, NULL);

    char profileDir[MAX_PATH];
    snprintf(profileDir, sizeof(profileDir), "%s\\Profile", appBaseDir);
    CreateDirectoryA(profileDir, NULL);

    // Create sentinel "First Run" file to inform Chrome/Edge that first run setup is complete
    char firstRunFile[MAX_PATH];
    snprintf(firstRunFile, sizeof(firstRunFile), "%s\\First Run", profileDir);
    FILE *fr = fopen(firstRunFile, "w");
    if (fr) {
        fclose(fr);
    }

    // Create Default folder and Preferences to disable signin prompts and sync prompts
    char defaultDir[MAX_PATH];
    snprintf(defaultDir, sizeof(defaultDir), "%s\\Default", profileDir);
    CreateDirectoryA(defaultDir, NULL);

    char prefFile[MAX_PATH];
    snprintf(prefFile, sizeof(prefFile), "%s\\Preferences", defaultDir);
    FILE *fp = fopen(prefFile, "w");
    if (fp) {
        fputs("{\"signin\":{\"allowed\":false},\"sync\":{\"has_setup_completed\":false}}", fp);
        fclose(fp);
    }

    char cmdLine[4096];
    snprintf(cmdLine, sizeof(cmdLine),
        "\"%s\" --app=\"%s\" --user-data-dir=\"%s\" --no-first-run --no-default-browser-check --disable-sync --disable-signin-promo --bwsi --disable-features=Translate,SignIn,WelcomePage,ChromeWhatsNewUI,PrivacySandboxSettings4 --suppress-message-center-popups --disable-background-mode --app-id=RajsamandDistrictPortal --class=RajsamandDistrictPortal --window-size=1366,840 --start-maximized",
        browserPath, url, profileDir);

    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    if (!CreateProcessA(NULL, cmdLine, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        // Fallback to ShellExecute if CreateProcess failed
        ShellExecuteA(NULL, "open", browserPath, cmdLine, NULL, SW_SHOWNORMAL);
        return 0;
    }

    // 7. Actively attach and set the taskbar / window icon as the browser window opens
    struct EnumContext ctx;
    ctx.targetPid = pi.dwProcessId;
    ctx.hFoundWnd = NULL;
    ctx.hBig = hIconBig;
    ctx.hSmall = hIconSmall;

    // Monitor for up to 8 seconds (40 iterations * 200ms)
    for (int i = 0; i < 40; i++) {
        Sleep(200);
        EnumWindows(ApplyIconsToAppWindow, (LPARAM)&ctx);
        if (ctx.hFoundWnd != NULL) {
            // Once found, reinforce icon for another 1 second to ensure page-load finishes
            for (int k = 0; k < 5; k++) {
                Sleep(200);
                EnumWindows(ApplyIconsToAppWindow, (LPARAM)&ctx);
            }
            break;
        }
    }

    // Close process handles
    if (pi.hThread) CloseHandle(pi.hThread);
    if (pi.hProcess) CloseHandle(pi.hProcess);

    return 0;
}
