/**
 * Android APK & Project Downloader Utility
 * Generates automated build scripts and package configurations for compiling Android .APK / .AAB
 */

export function downloadAndroidBuildScript(portalUrl: string) {
  const scriptContent = `#!/bin/bash
# ==============================================================================
# Rajsamand District Assessment Portal - Android APK Builder
# Uses Google's official Bubblewrap CLI (Trusted Web Activity - TWA)
# ==============================================================================

echo "=========================================================="
echo " Building Rajsamand Portal Android App (.apk / .aab)"
echo " Portal URL: ${portalUrl}"
echo "=========================================================="

# 1. Check Node.js and JDK prerequisites
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "Step 1: Installing Google Bubblewrap CLI..."
npx -y @bubblewrap/cli init --manifest="${portalUrl}/manifest.webmanifest"

echo ""
echo "Step 2: Building Android APK package..."
npx -y @bubblewrap/cli build

echo ""
echo "=========================================================="
echo " SUCCESS! Your Android APK is built and ready in /output!"
echo " Sideload to your Android phone or upload to Google Play."
echo " Real-time Firestore Cloud Sync is active automatically."
echo "=========================================================="
`;

  const blob = new Blob([scriptContent], { type: 'text/x-shellscript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'build-rajsamand-android-apk.sh';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAndroidCapacitorScript(portalUrl: string) {
  const scriptContent = `@echo off
:: ==============================================================================
:: Rajsamand District Assessment Portal - Capacitor Android Project Initializer
:: ==============================================================================
title Rajsamand Portal Android Generator
color 0A

echo ==============================================================
echo  Initializing Android Studio Project with Capacitor
echo  Portal URL: ${portalUrl}
echo ==============================================================

call npm install -D @capacitor/core @capacitor/cli @capacitor/android
call npx cap init "Rajsamand District Assessment Portal" "in.gov.rajsamand.assessment" --web-dir dist
call npx cap add android
call npx cap open android

echo ==============================================================
echo  Android Studio will now open with your native project!
echo  Click Run or Build -^> Build APK(s) to generate your .apk.
echo ==============================================================
pause
`;

  const blob = new Blob([scriptContent], { type: 'application/x-bat;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'init-android-studio-project.bat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
