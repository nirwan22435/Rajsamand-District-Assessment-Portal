#!/bin/bash
set -e

echo "=== Building Rajsamand District Assessment Portal Windows Setup (.exe) ==="

# 1. Generate multi-resolution icons
echo "[+] Generating multi-resolution icons..."
convert public/icon-512.png -define icon:auto-resize=256,128,64,48,32,24,16 public/favicon.ico
cp -f public/favicon.ico public/app.ico

# 2. Compile Windows Native GUI Launcher with icon and COM property store
echo "[+] Compiling Windows Native GUI Launcher (RajsamandPortal.exe)..."
cat << 'EOF' > icon.rc
1 ICON "public/app.ico"
EOF
x86_64-w64-mingw32-windres icon.rc -O coff -o icon.res
x86_64-w64-mingw32-gcc -mwindows -O2 launcher.c icon.res -o RajsamandPortal.exe -lshlwapi -lshell32 -lole32 -luuid -lpropsys
x86_64-w64-mingw32-strip RajsamandPortal.exe
rm -f icon.rc icon.res

# 3. Compile NSIS Setup Installer (.exe)
echo "[+] Compiling NSIS Setup Installer (Rajsamand_Portal_Setup.exe)..."
makensis setup.nsi
rm -f RajsamandPortal.exe

if [ -d "dist" ]; then
    cp -f public/Rajsamand_Portal_Setup.exe dist/
    cp -f public/favicon.ico dist/
    cp -f public/app.ico dist/
fi

echo "[SUCCESS] Built public/Rajsamand_Portal_Setup.exe successfully!"
ls -lh public/Rajsamand_Portal_Setup.exe
