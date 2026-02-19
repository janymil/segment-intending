# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# Keep AndroidX Browser Helper classes
-keep class com.google.androidbrowserhelper.** { *; }
-keep interface com.google.androidbrowserhelper.** { *; }

# Keep Custom Tabs
-keep class androidx.browser.customtabs.** { *; }

# Standard Android optimizations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
