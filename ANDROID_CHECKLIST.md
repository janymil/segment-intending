# Android Build Checklist

Use this checklist when building your Android APK. For detailed instructions, see `ANDROID_BUILD.md`.

---

## Pre-Build Checklist

### 1. Web Hosting ☐
- [ ] PWA is deployed to HTTPS domain (e.g., https://yourdomain.com)
- [ ] All files accessible (index.html, app.js, styles.css, etc.)
- [ ] Service worker working (test offline mode)
- [ ] Manifest.json accessible
- [ ] App works correctly in Chrome on Android

### 2. App Icons ☐
- [ ] Generated app icons (or run `icons/generate-icons.sh`)
- [ ] Copied icons to these folders:
  - [ ] `android/app/src/main/res/mipmap-mdpi/` (48x48)
  - [ ] `android/app/src/main/res/mipmap-hdpi/` (72x72)
  - [ ] `android/app/src/main/res/mipmap-xhdpi/` (96x96)
  - [ ] `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
  - [ ] `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)
- [ ] Created both `ic_launcher.png` and `ic_launcher_round.png` versions

### 3. Android Configuration ☐
- [ ] Edited `android/app/build.gradle`
- [ ] Updated `hostName` to your domain
- [ ] Updated `defaultUrl` to your full URL
- [ ] Updated `assetStatements` with your domain

---

## Build Checklist

### 4. Digital Asset Links ☐
- [ ] Generated SHA-256 fingerprint of signing key
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore \
    -alias androiddebugkey -storepass android -keypass android
  ```
- [ ] Created `.well-known/assetlinks.json` file
- [ ] Updated with correct package name: `com.segmentintending.app`
- [ ] Updated with your SHA-256 fingerprint
- [ ] Uploaded to web server at `https://yourdomain.com/.well-known/assetlinks.json`
- [ ] Verified file is accessible via curl/browser
- [ ] Tested with Google's validator tool

### 5. Android Studio ☐
- [ ] Installed Android Studio
- [ ] Opened `android/` directory as existing project
- [ ] Gradle sync completed successfully
- [ ] No build errors in Android Studio

### 6. Debug Build ☐
- [ ] Connected Android device OR started emulator
- [ ] Clicked Run button (▶️)
- [ ] App installed successfully
- [ ] App launches and loads your PWA
- [ ] Checked for URL bar (will show in debug build)

---

## Release Build Checklist

### 7. Create Keystore (First Time Only) ☐
- [ ] Generated release keystore:
  ```bash
  keytool -genkey -v -keystore segment-intending-release.jks \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias segment-intending-key
  ```
- [ ] Saved keystore file securely
- [ ] Noted password and alias
- [ ] Created backup of keystore file

### 8. Build Signed APK ☐
- [ ] In Android Studio: `Build` → `Generate Signed Bundle / APK`
- [ ] Selected "APK"
- [ ] Selected your keystore file
- [ ] Entered keystore password
- [ ] Selected key alias
- [ ] Entered key password
- [ ] Selected "release" build variant
- [ ] Build completed successfully
- [ ] Located APK at `android/app/release/app-release.apk`

### 9. Test Release APK ☐
- [ ] Installed release APK on device
- [ ] App launches without URL bar (full immersive)
- [ ] PWA loads correctly
- [ ] Smart detection features work (if permissions granted)
- [ ] Offline mode works
- [ ] Notifications work

---

## Post-Build Checklist

### 10. Final Verification ☐
- [ ] App icon shows correctly on home screen
- [ ] App name is "Segment Intending"
- [ ] No browser UI visible (full TWA experience)
- [ ] All PWA features functional
- [ ] App reconnects to internet after offline mode
- [ ] Sensors work (location, motion, microphone) after granting permissions

### 11. Optional: Play Store Preparation ☐
- [ ] Created Google Play Developer account ($25)
- [ ] Prepared app screenshots (at least 2)
- [ ] Created feature graphic (1024x500)
- [ ] Written app description
- [ ] Created privacy policy URL
- [ ] Prepared store listing content
- [ ] Uploaded APK to Play Console
- [ ] Filled all required fields
- [ ] Submitted for review

---

## Troubleshooting

### Common Issues:

**Problem:** URL bar shows in release build
- [ ] Verified `.well-known/assetlinks.json` is accessible
- [ ] Checked SHA-256 fingerprint matches
- [ ] Cleared app data and reinstalled
- [ ] Waited 24-48 hours for Google verification

**Problem:** Icons not showing
- [ ] Verified icon files exist in all mipmap folders
- [ ] Ran `Build` → `Clean Project`
- [ ] Ran `Build` → `Rebuild Project`
- [ ] Checked icon filenames are exactly `ic_launcher.png`

**Problem:** Blank screen when app opens
- [ ] Verified PWA URL is accessible in Chrome
- [ ] Checked for JavaScript errors in Chrome DevTools
- [ ] Verified service worker is registered
- [ ] Checked Android Logcat for errors

**Problem:** Sensors not working
- [ ] Granted all permissions in Android Settings
- [ ] Tested on physical device (not emulator)
- [ ] Verified HTTPS (required for getUserMedia)
- [ ] Checked browser compatibility

---

## Quick Reference

**Key Files to Configure:**
1. `android/app/build.gradle` - Your domain URLs
2. `.well-known/assetlinks.json` - Digital Asset Links
3. `android/app/src/main/res/mipmap-*/` - App icons

**Key Commands:**
```bash
# Generate debug APK
./gradlew assembleDebug

# Generate release APK
./gradlew assembleRelease

# Install to device
adb install -r app-debug.apk

# View logs
adb logcat
```

**Important URLs:**
- Digital Asset Links Tool: https://developers.google.com/digital-asset-links/tools/generator
- Android Icon Generator: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- Play Console: https://play.google.com/console

---

## Status Tracking

**Current Status:** ☐ Not Started

Progress:
- [ ] Pre-Build (Steps 1-3)
- [ ] Build Setup (Steps 4-6)
- [ ] Release Build (Steps 7-9)
- [ ] Verification (Steps 10-11)

**Estimated Time:**
- First build: 2-4 hours
- Subsequent builds: 30 minutes

---

## Notes

Write any issues or notes here:

```


```

---

**Need help?** See `ANDROID_BUILD.md` for detailed explanations of each step.

**Last updated:** February 19, 2026
