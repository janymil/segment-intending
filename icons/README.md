# App Icons

This directory should contain the following icon files for the Progressive Web App and Android builds:

## Required Icon Files

- **icon-72.png** - 72x72px (for notifications, badge)
- **icon-192.png** - 192x192px (Android home screen, PWA install)
- **icon-512.png** - 512x512px (PWA splash screen, Play Store)

## How to Generate Icons

You can create these icons from your app logo/design using:

1. Online tools like [Favicon Generator](https://realfavicongenerator.net/)
2. Image editing software (Photoshop, GIMP, Figma)
3. Command-line tools like ImageMagick:
   ```bash
   convert logo.png -resize 72x72 icon-72.png
   convert logo.png -resize 192x192 icon-192.png
   convert logo.png -resize 512x512 icon-512.png
   ```

## Icon Design Guidelines

- Use a square design with transparent background (PNG format)
- Ensure the icon looks good at all sizes
- Follow Android's [adaptive icon guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- Use the app's color scheme (#7c5cfc to #36d1dc gradient)
- The icon should represent the app's purpose (intention setting, mindfulness)

## Current Status

⚠️ **Icons need to be created** - Currently using placeholder references in manifest.json
