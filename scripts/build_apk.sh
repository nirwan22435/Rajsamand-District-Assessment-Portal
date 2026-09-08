#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APK_SRC="$DIR/apk_src"
OUTPUT_APK="$DIR/../public/RDAA.apk"
DIST_APK="$DIR/../dist/RDAA.apk"

echo "Building RDAA Android APK..."

# 1. Compile resources and generate R.java
aapt package -f -m -J "$APK_SRC/src" -M "$APK_SRC/AndroidManifest.xml" -S "$APK_SRC/res" -I /usr/lib/android-sdk/platforms/android-23/android.jar

# 2. Compile Java sources
mkdir -p "$APK_SRC/classes"
javac -source 1.8 -target 1.8 -bootclasspath /usr/lib/android-sdk/platforms/android-23/android.jar -d "$APK_SRC/classes" "$APK_SRC"/src/in/gov/rajsamand/assessment/*.java

# 3. Convert to DEX
dalvik-exchange --dex --output="$APK_SRC/classes.dex" "$APK_SRC/classes"

# 4. Package APK
rm -f "$APK_SRC/unaligned.apk" "$APK_SRC/aligned.apk" "$APK_SRC/RDAA.apk"
aapt package -f -M "$APK_SRC/AndroidManifest.xml" -S "$APK_SRC/res" -A "$APK_SRC/assets" -I /usr/lib/android-sdk/platforms/android-23/android.jar -F "$APK_SRC/unaligned.apk"
(cd "$APK_SRC" && aapt add unaligned.apk classes.dex)

# 5. Zipalign
zipalign -f -p 4 "$APK_SRC/unaligned.apk" "$APK_SRC/aligned.apk"

# 6. Ensure keystore exists
if [ ! -f "$APK_SRC/release.jks" ]; then
  keytool -genkeypair -v -keystore "$APK_SRC/release.jks" -alias rdaa -keyalg RSA -keysize 2048 -validity 10000 -storepass rdaa2026 -keypass rdaa2026 -dname "CN=RDAA, OU=Assessment Portal, O=Rajsamand District, L=Rajsamand, ST=Rajasthan, C=IN"
fi

# 7. Sign APK with v1, v2, and v3 scheme
apksigner sign --ks "$APK_SRC/release.jks" --ks-key-alias rdaa --ks-pass pass:rdaa2026 --key-pass pass:rdaa2026 --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out "$OUTPUT_APK" "$APK_SRC/aligned.apk"

# Copy to dist if dist exists
if [ -d "$DIR/../dist" ]; then
  cp "$OUTPUT_APK" "$DIST_APK"
fi

echo "Verifying APK..."
aapt dump badging "$OUTPUT_APK" | head -n 8
apksigner verify --verbose "$OUTPUT_APK"

echo "RDAA.apk built successfully!"
