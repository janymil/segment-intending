# Building Segment Intending as Android APK

This guide explains how to convert the Segment Intending Progressive Web App (PWA) into an Android APK using Android Studio.

## Overview

The app uses **Trusted Web Activity (TWA)** technology to wrap the PWA in a native Android shell. This approach:
- ✅ Maintains all PWA features (offline mode, service worker, etc.)
- ✅ Provides a native Android app experience
- ✅ Enables distribution via Google Play Store
- ✅ No code duplication - uses the same web codebase

## Prerequisites

### 1. Android Studio
Download and install Android Studio: https://developer.android.com/studio

### 2. Web Hosting
Your PWA must be hosted on a live HTTPS domain (e.g., `https://yourdomain.com`)

**Why?** TWA apps load content from your web server. They cannot run from local files.

### 3. Digital Asset Links
You need to verify domain ownership by hosting an `assetlinks.json` file.

## Setup Steps

### Step 1: Host Your PWA

1. **Upload the PWA files** to your web server:
   ```
   index.html
   app.js
   smart-detect.js
   translations.js
   styles.css
   sw.js
   manifest.json
   icons/ (directory with all icon files)
   ```

2. **Ensure HTTPS** is enabled on your domain

3. **Test in browser** to verify everything works at `https://yourdomain.com`

### Step 2: Create App Icons

The Android app needs launcher icons in multiple resolutions:

1. **Generate icons** from your app logo using one of these methods:

   **Option A: Online Tool**
   - Use https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
   - Upload your logo/icon design
   - Download the generated icon set

   **Option B: ImageMagick** (if you have a source image)
   ```bash
   cd icons
   # If you have ImageMagick installed
   ./generate-icons.sh
   ```

2. **Copy icons** to Android project:
   ```
   android/app/src/main/res/mipmap-mdpi/ic_launcher.png (48x48)
   android/app/src/main/res/mipmap-hdpi/ic_launcher.png (72x72)
   android/app/src/main/res/mipmap-xhdpi/ic_launcher.png (96x96)
   android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png (144x144)
   android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png (192x192)
   ```

   Also create `ic_launcher_round.png` versions for each density.

### Step 3: Configure the Android Project

1. **Edit** `android/app/build.gradle`:
   ```gradle
   manifestPlaceholders = [
       hostName: "yourdomain.com",  // ← Change this
       defaultUrl: "https://yourdomain.com/",  // ← Change this
       launcherName: "Segment Intending",
       assetStatements: '[{ "relation": ["delegate_permission/common.handle_all_urls"], "target": { "namespace": "web", "site": "https://yourdomain.com"} }]'  // ← Change domain
   ]
   ```

2. **Generate SHA-256 fingerprint** of your app signing key:
   ```bash
   # For debug builds
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For release builds (use your keystore)
   keytool -list -v -keystore /path/to/your/release-keystore.jks -alias your-key-alias
   ```

   Copy the SHA-256 fingerprint (format: `14:6D:E9:...`)

### Step 4: Create Digital Asset Links File

1. **Create** `.well-known/assetlinks.json` on your web server:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.segmentintending.app",
       "sha256_cert_fingerprints": [
         "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
       ]
     }
   }]
   ```

   Replace the `sha256_cert_fingerprints` with YOUR fingerprint from Step 3.

2. **Host it at**: `https://yourdomain.com/.well-known/assetlinks.json`

3. **Verify** it's accessible:
   ```bash
   curl https://yourdomain.com/.well-known/assetlinks.json
   ```

4. **Test with Google's tool**:
   https://developers.google.com/digital-asset-links/tools/generator

### Step 5: Build the APK in Android Studio

1. **Open Android Studio**

2. **Import Project**:
   - Click "Open an Existing Project"
   - Navigate to the `android/` directory
   - Click "OK"

3. **Sync Gradle**:
   - Android Studio will automatically sync Gradle files
   - Wait for "Gradle sync successful"

4. **Connect Device or Emulator**:
   - Physical device: Enable USB debugging in Developer Options
   - Emulator: Create one via AVD Manager (API 24+)

5. **Build and Run**:
   - Click the green "Run" button (▶️) or press `Shift + F10`
   - Select your device/emulator
   - Wait for the app to install and launch

### Step 6: Generate Signed APK for Release

1. **Create Keystore** (one-time setup):
   ```bash
   keytool -genkey -v -keystore segment-intending-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias segment-intending-key
   ```

2. **In Android Studio**:
   - Go to `Build` → `Generate Signed Bundle / APK`
   - Select "APK"
   - Choose your keystore file
   - Enter keystore password and key alias
   - Select "release" build variant
   - Click "Finish"

3. **Find APK**:
   The signed APK will be at:
   ```
   android/app/release/app-release.apk
   ```

## Testing the TWA

### Local Testing (Debug Build)

The debug build will work even without the `assetlinks.json` file, but:
- ❌ Will show URL bar at the top
- ❌ Won't feel fully "native"

### Production Testing (Release Build)

With proper `assetlinks.json` setup:
- ✅ No URL bar - fully immersive
- ✅ True native app experience
- ✅ PWA features work (offline, notifications)

## Troubleshooting

### Issue: "Digital Asset Links verification failed"

**Solution:**
1. Verify `assetlinks.json` is hosted at the correct URL
2. Check the SHA-256 fingerprint matches your signing key
3. Ensure `package_name` matches `applicationId` in `build.gradle`
4. Clear app data and reinstall

### Issue: Icons not showing

**Solution:**
1. Ensure icon files exist in all `mipmap-*` directories
2. Run `Build` → `Clean Project`
3. Run `Build` → `Rebuild Project`

### Issue: App shows blank screen

**Solution:**
1. Check your PWA is accessible at the `defaultUrl`
2. Open Chrome on your device and navigate to the URL manually
3. Check Chrome DevTools for JavaScript errors
4. Verify service worker is registered

### Issue: Sensors not working (motion, location, etc.)

**Solution:**
1. Ensure permissions are granted in Android Settings
2. On Android 13+, you may need runtime permission dialogs
3. Test on a physical device (emulators have limited sensor support)

## Distribution

### Google Play Store

1. **Create Developer Account**: https://play.google.com/console
2. **Prepare Store Listing**:
   - App screenshots (at least 2)
   - Feature graphic (1024x500)
   - App description
   - Privacy policy URL

3. **Upload APK**:
   - Go to "Release" → "Production"
   - Click "Create new release"
   - Upload your signed APK
   - Complete all required fields
   - Submit for review

### Alternative Distribution

You can also distribute the APK directly (outside Play Store):
- Email the APK to users
- Host it on your website
- Use third-party app stores

**Note:** Users must enable "Install from unknown sources" on Android.

## Updating the App

When you update your PWA:

1. **Update web files** on your server
2. **Service Worker** will cache the new version
3. **Users get updates** automatically when they open the app
4. **No APK rebuild needed** unless you change:
   - App icon
   - Package name
   - Permissions
   - Android-specific configuration

This is the beauty of TWA - your web updates propagate automatically!

## Advanced Configuration

### Custom Domain for PWA

You can use a subdomain for better organization:
```
https://app.yourdomain.com  (for the PWA)
```

Update `defaultUrl` in `build.gradle` accordingly.

### Multiple TWA Apps

To create different Android apps from the same PWA:
1. Change `applicationId` in `build.gradle`
2. Update `package_name` in `assetlinks.json`
3. Change `app_name` in `strings.xml`

### Offline-First Configuration

The PWA already has a service worker (`sw.js`). To enhance offline support:
1. Add more assets to the cache in `sw.js`
2. Implement background sync for data
3. Use IndexedDB for persistent storage

## Resources

- **TWA Official Guide**: https://developer.chrome.com/docs/android/trusted-web-activity/
- **Android Asset Links**: https://developers.google.com/digital-asset-links
- **PWA Best Practices**: https://web.dev/progressive-web-apps/
- **Play Store Publishing**: https://developer.android.com/distribute

## Support

If you encounter issues:
1. Check the Android Logcat in Android Studio for errors
2. Test your PWA in Chrome DevTools (F12)
3. Verify your `assetlinks.json` with Google's validator
4. Ensure all URLs use HTTPS

---

**Ready to build?** Start with Step 1 and work through each step carefully. Good luck! 🚀
