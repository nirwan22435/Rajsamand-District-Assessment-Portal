@echo off
:: ============================================================================
:: Rajsamand District Assessment Portal - Windows Desktop App Launcher
:: Department of Information Technology & Communication (DoIT&C) Rajsamand
:: ============================================================================
title Rajsamand District Assessment Portal
echo ============================================================================
echo  Rajsamand District Assessment & Typing Portal
echo  Launching Desktop Application Mode...
echo ============================================================================

set PORTAL_URL=https://ais-dev-ipslj2ssag6j65tfrompqs-957343451703.asia-east1.run.app

:: Check if Microsoft Edge is available (Windows 10 / 11 native)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    echo Launching with Microsoft Edge App Runtime...
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    echo Launching with Microsoft Edge App Runtime...
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

:: Check if Google Chrome is available
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    echo Launching with Google Chrome App Runtime...
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    echo Launching with Google Chrome App Runtime...
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%PORTAL_URL%" --window-size=1366,820 --start-maximized
    exit /b 0
)

:: Fallback to standard default browser
echo Launching in default web browser...
start "" "%PORTAL_URL%"
exit /b 0
