<<<<<<< HEAD
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
=======
<h1 align="center">Plural Space</h1>

<p align="center">
  <img src="https://raw.githubusercontent.com/TheHanyou/Plural-Space/main/docs/icon.png" width="120" alt="Plural Space icon" />
</p>

<p align="center">
  <strong>Front tracking, system journal & history for plural systems.</strong><br>
  Private. Offline-first. No accounts. No servers.
</p>

<p align="center">
  <a href="https://thehanyou.github.io/Plural-Space/">Privacy Policy</a>
</p>

---

Simply Plural is being discontinued. Plural Space is the replacement you own entirely — your data stays on your device.

## Features

**◈ Front Tracking**  
Know who's fronting at a glance. Set the front with a tap and track mood and location alongside each session. Add or update notes in real time without changing the front. A persistent notification keeps the current fronter visible from your notification shade, updated automatically.

**◇ Member Profiles**  
Build out your system roster with names, pronouns, roles, colors, and bios. Each member gets their own color identity used throughout the app.

**◷ History & Insights**  
Front History gives you a complete timestamped log of every switch, organized by day. Member History shows everything about a specific headmate — every front session, mood change, location change, note update, and journal entry they authored — alongside a summary of total time fronted, sessions, top mood, and top location.

**◉ System Journal**  
Write journal entries as a system. Tag entries with authors (specific headmates), add topic hashtags, and optionally lock individual entries or the entire journal behind passwords. Filter entries by author or tag. Export individual entries or the full journal in `.txt`, `.md`, or `.json`.

**↑ Import & Export**  
Migrating from Simply Plural or PluralKit? Import your full system data — members, history, and system info — with a single API token. Octocon users can use the PluralKit import path.

Export your full system data as JSON (reimportable), HTML (opens in Google Docs), or send a formatted summary to any email address. Import `.txt`, `.md`, or `.json` files directly as journal entries.

**Other Features**
- Obsidian Blue dark theme and Steel light theme
- Mood picker with preset and custom mood support
- Location tagging with optional GPS auto-fill (resolves to neighbourhood or city — raw coordinates are never stored)
- Password protection per journal entry and for the full journal
- Hashtag tagging system for journal topics
- Author filter and tag filter in journal
- Per-member history with full event log
- Simply Plural and PluralKit token import
- Full data export and restore

---

## Privacy

Everything lives on your device. No accounts, no cloud sync, no tracking, no ads.

The only outbound requests are:
- **GPS location** (optional, off by default) — coordinates are sent to [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org) to resolve a neighbourhood or city name. Raw coordinates are never stored.
- **Simply Plural / PluralKit import** (optional) — your token is used for a single one-time request and never stored.

Full privacy policy: [https://thehanyou.github.io/Plural-Space/](https://thehanyou.github.io/Plural-Space/)

---

## Installation

**Direct APK (sideload)**  
Download the latest APK from [Releases](https://github.com/TheHanyou/Plural-Space/releases). Enable "Install from unknown sources" on your device and install.

---

## Build from Source

```bash
# Requirements: Node 22+, JDK 17, Android SDK
git clone https://github.com/TheHanyou/Plural-Space.git
cd Plural-Space
npm install --legacy-peer-deps
cd android && gradlew.bat assembleRelease
```

---

## License

[GNU General Public License v3.0](LICENSE)

This software is free and open source. You are free to use, modify, and distribute it under the terms of the GPL-3.0 license. Any distributed modifications must also be released under GPL-3.0.

---

## Contact

**The Hanyou System**  
[the1hanyou@gmail.com](mailto:the1hanyou@gmail.com)

---

<p align="center">Built by a plural system, for plural systems.</p>
>>>>>>> 37e5c4cbfcf3b6c2e0d052ea02bc31dba9e1687d
