# Add project specific ProGuard rules here.
# Keep React Native / Hermes entry points when minify is on.

-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Maps / Reanimated / MMKV often need their native bridge classes retained.
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.tencent.mmkv.** { *; }
-keep class com.rnmaps.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.swmansion.**
