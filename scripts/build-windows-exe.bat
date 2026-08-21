@echo off
:: ============================================================================
:: Build Script for Rajsamand Assessment Portal Windows .EXE Installer
:: Compiles standalone installer: Rajsamand-Assessment-Portal-Setup-1.0.0.exe
:: ============================================================================
title Build Rajsamand Portal .EXE Installer
echo ============================================================================
echo  Starting Windows Desktop .EXE Installer Compilation...
echo ============================================================================

echo 1. Checking Node.js and NPM environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js (v18 or higher) from https://nodejs.org
    pause
    exit /b 1
)

echo 2. Installing Electron & Electron-Builder packages...
call npm install --save-dev electron electron-builder

echo 3. Compiling Frontend Web Application Assets...
call npm run build

echo 4. Packaging Standalone Windows Installer (.EXE)...
call npx electron-builder --win nsis --x64

echo ============================================================================
echo  BUILD COMPLETE!
echo  Your installer is located in the: .\dist-electron\ folder
echo  File: Rajsamand-Assessment-Portal-Setup-1.0.0.exe
echo ============================================================================
pause
