# Plural Space — Setup, Testing & Play Store Submission Guide

This guide covers everything from zero to a live app on the Google Play Store, step by step, on Windows.

---

## PART 1 — ENVIRONMENT SETUP (do this once)

### 1.1 Install Node.js
- Download from https://nodejs.org — install the **LTS** version
- Verify: open Command Prompt, type `node --version` → should show v18 or higher

### 1.2 Install JDK 17
- Download **Adoptium Temurin JDK 17** from https://adoptium.net
- Run the installer — check the box to set JAVA_HOME automatically
- Verify: `java -version` in Command Prompt

### 1.3 Install Android Studio
- Download from https://developer.android.com/studio
- During setup, check: Android SDK, Android SDK Platform, Android Virtual Device
- Once installed, open Android Studio → SDK Manager (top right gear icon)
  - SDK Platforms tab: check **Android 14 (API 34)**
  - SDK Tools tab: check **Android SDK Build-Tools 34**, **Android Emulator**, **Android SDK Platform-Tools**
  - Click Apply and let it download

### 1.4 Set Environment Variables
In Windows Search, type "Edit the system environment variables" → Environment Variables button.

Add to **System Variables** (not User Variables):

| Variable | Value |
|---|---|
| ANDROID_HOME | C:\Users\[YourUsername]\AppData\Local\Android\Sdk |
| JAVA_HOME | C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot (check exact path) |

Edit the **Path** variable → New → add these two lines:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

Close and reopen Command Prompt after this. Verify with `adb --version`.

---

## PART 2 — INITIALIZE THE PROJECT

### 2.1 Scaffold with React Native CLI
Open Command Prompt in the folder where you want the project to live, then run:

```
npx react-native init PluralSpace --template react-native-template-typescript
cd PluralSpace
```

### 2.2 Replace generated files with Plural Space source
Copy everything from the Plural Space source package (this zip) into the PluralSpace folder, overwriting files where prompted. Specifically:
- `App.tsx` — replaces the generated one
- `index.js` — replaces the generated one
- `app.json` — replaces the generated one
- `package.json` — replaces the generated one
- `babel.config.js` — replaces the generated one
- `metro.config.js` — replaces the generated one
- `tsconfig.json` — replaces the generated one
- `src/` folder — copy in entirely

### 2.3 Install dependencies
```
npm install
```

### 2.4 Configure Android package name
Open `android/app/build.gradle` in a text editor. Find `defaultConfig` and set:
```gradle
applicationId "com.pluralspace.app"
minSdkVersion 24
targetSdkVersion 34
versionCode 1
versionName "1.0.0"
```

Find the top of the file and set:
```gradle
namespace "com.pluralspace.app"
```

### 2.5 Configure Android permissions
Open `android/app/src/main/AndroidManifest.xml`. Inside the `<manifest>` tag, add:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

Set the app label on the `<application>` tag:
```xml
android:label="Plural Space"
```

### 2.6 Set app name in strings.xml
Open `android/app/src/main/res/values/strings.xml`. Set:
```xml
<string name="app_name">Plural Space</string>
```

---

## PART 3 — RUNNING AND TESTING

### 3.1 Create an emulator
In Android Studio → Device Manager (right sidebar icon) → Create Device
- Select: Pixel 7 → Next
- System Image: select **API 34** (download if needed) → Next
- Name it "PluralSpace_Test" → Finish

### 3.2 Start the emulator
In Android Studio, click the ▶ play button next to your device in Device Manager. Wait for it to fully boot (home screen visible).

### 3.3 Run the app in development
In Command Prompt inside the PluralSpace folder:
```
npx react-native start
```
Open a **second** Command Prompt window (same folder):
```
npx react-native run-android
```

This will build and install the app on the emulator. First build takes 3–10 minutes. Subsequent builds are faster.

### 3.4 What to test before submission

Work through this checklist on the emulator:

**Setup**
- [ ] First launch shows setup screen
- [ ] Entering system name and saving proceeds to main app
- [ ] System name appears in header

**Front Tab**
- [ ] "Set Front" opens member selection modal
- [ ] Selecting members and saving shows them on the front card
- [ ] Duration timer updates after 30 seconds
- [ ] Front note can be added and edited
- [ ] Clearing front removes the card

**Members Tab**
- [ ] Add Member modal opens and saves correctly
- [ ] All fields save (name, pronouns, role, color, description)
- [ ] Color picker works
- [ ] Edit member pre-fills existing data
- [ ] Delete member with confirmation works
- [ ] Search filters the list

**History Tab**
- [ ] Changing the front creates a history entry
- [ ] Entries group by date
- [ ] Duration shows correctly
- [ ] Notes appear if set

**Journal Tab**
- [ ] New entry saves with title and body
- [ ] Member tagging works
- [ ] Edit and delete work
- [ ] Entries appear newest first

**Share Tab**
- [ ] JSON export triggers share sheet
- [ ] HTML export triggers share sheet
- [ ] Email button opens device mail app with content
- [ ] Import: pick a previously exported JSON file, toggle categories, restore works
- [ ] Share view toggles update preview

**Settings**
- [ ] Gear icon opens system settings modal
- [ ] Name and description update saves and reflects in header

### 3.5 Testing on a physical Android device
Enable Developer Options on the phone: Settings → About Phone → tap Build Number 7 times.
Enable USB Debugging: Settings → Developer Options → USB Debugging → On.
Connect via USB. Run `adb devices` — the device should appear.
Run `npx react-native run-android` — it will install on the physical device.

---

## PART 4 — BUILDING THE RELEASE AAB

Google Play requires an Android App Bundle (.aab), not an APK.

### 4.1 Generate a signing keystore (do this once — keep this file safe forever)
```
keytool -genkeypair -v -storetype PKCS12 -keystore plural-space-upload-key.keystore -alias plural-space-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
You'll be prompted for:
- A keystore password (create one, write it down — losing it means you can never update the app)
- Your name and organization details (can be minimal)

Move the generated `plural-space-upload-key.keystore` file into `android/app/`.

### 4.2 Add signing config to gradle.properties
Open `android/gradle.properties` and add at the bottom:
```
MYAPP_UPLOAD_STORE_FILE=plural-space-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=plural-space-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=yourKeystorePassword
MYAPP_UPLOAD_KEY_PASSWORD=yourKeystorePassword
```
Replace `yourKeystorePassword` with the password you created.

### 4.3 Add signing config to build.gradle
Open `android/app/build.gradle`. Add inside the `android { }` block:
```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}
```

In the `buildTypes { release { } }` block, add:
```gradle
signingConfig signingConfigs.release
```

### 4.4 Build the release AAB
```
cd android
./gradlew bundleRelease
```
On Windows use `gradlew.bat bundleRelease` if the above doesn't work.

The output file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## PART 5 — PLAY STORE SUBMISSION

### 5.1 Create a Google Play Developer account
- Go to https://play.google.com/console
- Sign in with a Google account
- Pay the one-time $25 USD registration fee
- Fill in developer profile — use "The Hanyou System" as the developer name
- Accept the Developer Distribution Agreement

### 5.2 Create a new app
- In the Play Console dashboard, click **Create app**
- App name: `Plural Space`
- Default language: English (United States)
- App or game: App
- Free or paid: Free
- Check both declaration boxes
- Click **Create app**

### 5.3 Complete the store listing
Go to **Store presence → Main store listing**:

- **App name:** Plural Space
- **Short description:** (copy from PLAY_STORE_LISTING.md)
- **Full description:** (copy from PLAY_STORE_LISTING.md)
- **App icon:** Upload 512×512px PNG
- **Feature graphic:** Upload 1024×500px PNG
- **Screenshots:** Upload at least 2 phone screenshots at the required sizes

### 5.4 Set up the app's content rating
Go to **Policy → App content → Content ratings**:
- Start questionnaire
- Category: **Utility / Productivity**
- Answer the questions per the guidance in PLAY_STORE_LISTING.md
- Submit for rating — expected result: Everyone or Teen

### 5.5 Privacy policy
Go to **Policy → App content → Privacy policy**:
- You need a URL to a hosted privacy policy
- Easiest free option: create a GitHub account → new repository → create a file named `privacy-policy.md` → paste contents of PRIVACY_POLICY.md → commit → use the raw file URL or set up GitHub Pages
- Paste the URL into the privacy policy field

### 5.6 Target audience and content
Go to **Policy → App content → Target audience**:
- Select: 18 and over (safest given mental health adjacent content)
- This avoids additional child safety review requirements

### 5.7 Upload the AAB
Go to **Release → Production → Create new release**:
- Click **Upload** → select `app-release.aab`
- Release name: `1.0.0`
- Release notes (what's new): 
  ```
  Initial release of Plural Space — a private, offline system tracking app for plural systems. Front tracking, member registry, journal, front history, and data export.
  ```
- Click **Save**

### 5.8 Complete data safety form
Go to **Policy → App content → Data safety**:
- Does your app collect or share user data? **No**
- Is all data encrypted in transit? **Yes** (even though there's no transit, this is the correct answer)
- Do you provide a way to delete data? **Yes** (users can uninstall or clear app data)
- Submit

### 5.9 Submit for review
Go to **Release → Production**:
- Review the release
- Click **Send for review**

Google's review typically takes **3–7 business days** for a first submission. You'll receive an email when approved or if there are issues.

---

## PART 6 — AFTER APPROVAL

### Updating the app
When you make changes and want to publish an update:
1. Increment `versionCode` by 1 (e.g. 2) and update `versionName` (e.g. "1.1.0") in `build.gradle`
2. Build a new AAB: `./gradlew bundleRelease`
3. In Play Console → Production → Create new release → upload the new AAB

### Keystore backup
**Back up your `.keystore` file and passwords immediately and keep them somewhere safe.** If you lose the keystore file, you cannot publish updates to the same app listing — you would have to create a new app from scratch and all existing installs would not receive updates. Store it in at least two places (e.g. Google Drive + an external drive).

---

## TROUBLESHOOTING

**`adb: command not found`**  
Check that `%ANDROID_HOME%\platform-tools` is in your Path variable and restart Command Prompt.

**`JAVA_HOME is not set`**  
Set JAVA_HOME in system environment variables pointing to your JDK 17 install directory.

**Build fails with `SDK location not found`**  
Create a file `android/local.properties` with:
```
sdk.dir=C:\\Users\\[YourUsername]\\AppData\\Local\\Android\\Sdk
```
(use double backslashes on Windows)

**App installs but crashes immediately**  
Run `npx react-native log-android` while the app is running to see the error log.

**Emulator is very slow**  
Enable virtualization in BIOS (Intel VT-x or AMD-V). In Android Studio → SDK Manager → SDK Tools → install **Intel x86 Emulator Accelerator (HAXM)**.

**Play Store rejects for missing privacy policy**  
Host the privacy policy at a public URL (GitHub Pages is free and sufficient).
