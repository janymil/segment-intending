# Android Build Directory

This directory contains all the necessary configuration files to build the Segment Intending PWA as an Android APK using Android Studio.

## What is Trusted Web Activity (TWA)?

TWA is a technology that allows you to wrap a Progressive Web App (PWA) in a native Android shell. The benefits are:

- ✅ **No code duplication** - Uses your existing web app
- ✅ **Automatic updates** - Updates propagate when you update the web app
- ✅ **Native app feel** - Full-screen, no browser UI
- ✅ **Play Store distribution** - Can be published to Google Play
- ✅ **PWA features** - Offline mode, service workers, notifications all work

## Directory Structure

```
android/
├── build.gradle                 # Root Gradle configuration
├── settings.gradle              # Module settings
├── gradle.properties            # Gradle properties
├── gradle/wrapper/              # Gradle wrapper files
│   └── gradle-wrapper.properties
└── app/
    ├── build.gradle             # App module configuration
    ├── proguard-rules.pro       # ProGuard rules for release builds
    └── src/main/
        ├── AndroidManifest.xml  # App manifest with permissions
        └── res/                 # Android resources
            ├── values/          # Strings, colors, themes
            ├── xml/             # File paths configuration
            ├── drawable/        # Splash screen
            └── mipmap-*/        # App launcher icons (you need to add these)
```

## Quick Start

1. **Read the full guide:** See `../ANDROID_BUILD.md` for complete instructions
2. **Add launcher icons:** Generate and place icons in `app/src/main/res/mipmap-*/` directories
3. **Configure your domain:** Edit `app/build.gradle` and replace `yourdomain.com` with your actual domain
4. **Open in Android Studio:** Import this `android/` directory as an existing project
5. **Build:** Click the Run button or use `./gradlew assembleDebug`

## Important Configuration

Before building, you MUST update these values in `app/build.gradle`:

```gradle
manifestPlaceholders = [
    hostName: "yourdomain.com",              // ← CHANGE THIS
    defaultUrl: "https://yourdomain.com/",   // ← CHANGE THIS
    launcherName: "Segment Intending",
    assetStatements: '...'                   // ← CHANGE DOMAIN HERE TOO
]
```

## Requirements

- **Android Studio** Arctic Fox or later
- **JDK** 8 or later
- **Gradle** 8.2 (included via wrapper)
- **Min SDK** 24 (Android 7.0)
- **Target SDK** 34 (Android 14)

## Building the APK

### Debug Build (for testing)

```bash
cd android
./gradlew assembleDebug
```

APK location: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for distribution)

```bash
./gradlew assembleRelease
```

APK location: `app/build/outputs/apk/release/app-release.apk`

**Note:** Release builds require a signing key. See `../ANDROID_BUILD.md` for details.

## Troubleshooting

### "Digital Asset Links verification failed"
→ Ensure `.well-known/assetlinks.json` is properly configured on your web server

### "Package name already in use"
→ Change `applicationId` in `app/build.gradle` to something unique

### Icons not showing
→ Add launcher icon files to `app/src/main/res/mipmap-*` directories

### App shows blank screen
→ Verify your PWA is accessible at the `defaultUrl` in a browser

## Additional Resources

- Full build guide: `../ANDROID_BUILD.md`
- App audit: `../APP_AUDIT.md`
- Official TWA docs: https://developer.chrome.com/docs/android/trusted-web-activity/

## Support

For build issues:
1. Check Android Studio's Logcat for errors
2. Verify your web app works in Chrome on Android
3. Test the Digital Asset Links with Google's validator

---

**Ready to build?** Follow the complete instructions in `ANDROID_BUILD.md`
