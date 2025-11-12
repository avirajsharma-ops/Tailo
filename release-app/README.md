# Talio HRMS - Android Release (app.talio.in)

## Build Information
- **Package Name**: sbs.zenova.twa
- **Domain**: app.talio.in
- **Version**: 1.0.1 (Build 2)
- **Build Date**: Wed Nov 12 15:29:25 IST 2025

## Files Included
1. **talio-hrms-app.apk** - Android APK file (for direct installation)
2. **talio-hrms-app.aab** - Android App Bundle (for Google Play Store)
3. **talio-release.keystore** - Signing keystore (KEEP THIS SECURE!)
4. **assetlinks.json** - Digital Asset Links file

## Installation Instructions

### APK Installation (Direct)
1. Enable "Install from Unknown Sources" on your Android device
2. Transfer `talio-hrms-app.apk` to your device
3. Open the APK file and follow installation prompts

### Play Store Deployment (AAB)
1. Go to Google Play Console
2. Create a new app or select existing app
3. Upload `talio-hrms-app.aab` to the release track
4. Complete the store listing and publish

## Digital Asset Links Setup

Upload `assetlinks.json` to your web server at:
```
https://app.talio.in/.well-known/assetlinks.json
```

This file is required for:
- App Links (deep linking)
- Trusted Web Activity features
- Seamless web-to-app transitions

## Keystore Information

**IMPORTANT**: Keep `talio-release.keystore` secure!

- **Keystore Password**: talio2024
- **Key Alias**: talio-key
- **Key Password**: talio2024

You'll need this keystore for all future app updates.

## Permissions

The app requests the following permissions:
- **Notifications**: For push notifications via Firebase
- **Location**: For attendance tracking and geofencing (REQUIRED)
- **Internet**: For web content and API calls
- **Camera**: For future features (profile photos, document scanning)
- **Storage**: For file uploads and downloads

## Features

- Full WebView-based app with native permissions
- Firebase Cloud Messaging for push notifications
- GPS location tracking for attendance (MANDATORY)
- Geofencing with office radius validation
- Real-time Socket.IO updates
- Offline support with caching
- Deep linking support
- Material Design UI

## Important Notes

### Location Permission
- Location access is **REQUIRED** for clock in/out
- Employees cannot clock in/out without enabling location
- Location is validated against office geofence radius
- Strict mode enforces geofence boundaries

### Domain Configuration
- Base URL: https://app.talio.in
- Make sure SSL certificate is valid
- Upload assetlinks.json to the domain

## Deployment Checklist

- [ ] Upload assetlinks.json to https://app.talio.in/.well-known/assetlinks.json
- [ ] Verify SSL certificate is valid for app.talio.in
- [ ] Test APK installation on Android device
- [ ] Verify location permission prompt appears
- [ ] Test clock in/out with location enabled
- [ ] Test clock in/out with location disabled (should fail)
- [ ] Verify geofence validation works
- [ ] Test push notifications
- [ ] Test deep links

## Support

For issues or questions, contact: aviraj.sharma@mushroomworldgroup.com
