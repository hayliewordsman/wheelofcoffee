#!/usr/bin/env bash
# Builds dist/WheelOfCoffee.apk from www/ without Gradle.
#
# Needs: JDK 11+ and an Android SDK with build-tools and one platform installed, e.g.
#   sdkmanager "build-tools;34.0.0" "platforms;android-34"
# Usage:
#   ANDROID_HOME=/path/to/android-sdk android/build.sh
set -euo pipefail

: "${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK folder}"
BUILD_TOOLS="${BUILD_TOOLS:-$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -n 1)}"
ANDROID_JAR="${ANDROID_JAR:-$(ls -d "$ANDROID_HOME"/platforms/android-*/android.jar | sort -V | tail -n 1)}"

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
OUT="$HERE/build"
DIST="$ROOT/dist"
KEYSTORE="$HERE/wheelofcoffee.keystore"
KS_PASS="wheelofcoffee"
KEY_ALIAS="wheelofcoffee"

echo "build-tools: $BUILD_TOOLS"
echo "android.jar: $ANDROID_JAR"

rm -rf "$OUT"
mkdir -p "$OUT/assets" "$OUT/gen" "$OUT/classes" "$DIST"

# 1. Game files become assets/www inside the APK.
cp -R "$ROOT/www" "$OUT/assets/www"

# 2. Resources + manifest.
"$BUILD_TOOLS/aapt2" compile --dir "$HERE/res" -o "$OUT/res.zip"
"$BUILD_TOOLS/aapt2" link -o "$OUT/unsigned.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$HERE/AndroidManifest.xml" \
  -A "$OUT/assets" \
  --java "$OUT/gen" \
  --min-sdk-version 17 --target-sdk-version 28 \
  "$OUT/res.zip"

# 3. Java -> classes.dex (dex version 035, readable by Android 4.2).
javac -nowarn -Xlint:-options --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" \
  $(find "$HERE/src" "$OUT/gen" -name '*.java')
jar cf "$OUT/classes.jar" -C "$OUT/classes" .
"$BUILD_TOOLS/d8" --release --min-api 17 --lib "$ANDROID_JAR" --output "$OUT" "$OUT/classes.jar"
(cd "$OUT" && zip -q unsigned.apk classes.dex)

# 4. Align and sign (v1 JAR signature for Android 4.2, plus v2 for newer devices).
"$BUILD_TOOLS/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -sigalg SHA256withRSA -validity 10000 \
    -dname "CN=Wheel of Coffee, O=Wheel of Coffee"
fi
"$BUILD_TOOLS/apksigner" sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --ks-key-alias "$KEY_ALIAS" \
  --min-sdk-version 17 --v4-signing-enabled false --out "$DIST/WheelOfCoffee.apk" "$OUT/aligned.apk"
"$BUILD_TOOLS/apksigner" verify --min-sdk-version 17 "$DIST/WheelOfCoffee.apk"

echo "Built $DIST/WheelOfCoffee.apk"
