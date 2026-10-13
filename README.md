# Soundless UPI
## Paperless Smartphone Payment Soundbox Web App & Companion

> Transform an ordinary Android smartphone into an instant, voice-enabled UPI payment announcement soundbox, eliminating the recurring ₹125/month rental fees for micro-merchants, street vendors, tea stalls, and kirana stores across India.

---

## 1. Problem & Product Overview

Small Indian merchants often spend **₹125/month (~₹1,500/year)** renting dedicated proprietary UPI soundbox hardware (such as Paytm or PhonePe physical soundboxes).

**Soundless UPI** is a zero-hardware, software-first alternative that:
- Uses the merchant's existing smartphone speakers to loudly announce incoming payments via Text-to-Speech (TTS).
- Plays an authentic two-tone UPI soundbox chime before speaking.
- Inspects system push notifications from **PhonePe, Google Pay, Paytm, BHIM**, and compatible banking apps using a modular pipeline.
- Enforces strict Trust & Safety: **Never** announces outgoing debits, pending bank clearance, failed payments, or promotional scratch cards as successful payments.
- Protects against duplicate announcements while preserving legitimate consecutive identical payments (e.g., two customers each paying ₹20 for chai).
- Works 100% locally on device with zero external cloud dependencies or raw notification telemetry.

---

## 2. Architecture & Pipeline

```
+-----------------------------------------------------------------------------------+
|                            ANDROID SMARTPHONE                                     |
|                                                                                   |
|  +-----------------------+         +-------------------------------------------+  |
|  | Payment Apps          |         | Android Companion (Kotlin)                |  |
|  | - PhonePe             |         | - SoundlessNotificationListenerService    |  |
|  | - Google Pay          |=======> | - Strict Package Allowlist                |  |
|  | - Paytm / BHIM        |  push   | - Native TextToSpeech Engine              |  |
|  +-----------------------+  notif  | - Local WebSocket Bridge (Port 8765)      |  |
|                                    +---------------------+---------------------+  |
|                                                          |                        |
|                                                          | Local WS JSON          |
|                                                          v                        |
|  +-----------------------------------------------------------------------------+  |
|  | Soundless Web Application (PWA - React 18, TypeScript, Tailwind, Zustand)   |  |
|  |                                                                             |  |
|  |   [1. Ingest Alert] -> [2. Normalize] -> [3. Modular Source Parsers]        |  |
|  |                                                 |                           |  |
|  |   [4. Trust & Safety Classifier] <--------------+                           |  |
|  |         |                                                                   |  |
|  |         +--> Outgoing / Failed / Pending / Spam? ===> [REJECT & SILENCE]    |  |
|  |         |                                                                   |  |
|  |         +--> Incoming Credit Alert (> ₹0)?                                  |  |
|  |                  |                                                          |  |
|  |   [5. Deduplication Engine] (UTR / Time Window)                             |  |
|  |         |                                                                   |  |
|  |         +--> Duplicate detected? ===> [SUPPRESS FROM SPEECH]                |  |
|  |         |                                                                   |  |
|  |   [6. Speech Manager Queue] (Web Speech API / Native Android TTS)          |  |
|  |         |                                                                   |  |
|  |   [7. Web Audio Chime] (587Hz -> 880Hz) -> [8. Spoken Announcement]         |  |
|  |                                                                             |  |
|  |   [9. IndexedDB Local Storage] (Sanitized Metadata Only, No Raw Dumps)      |  |
|  |                                                                             |  |
|  |   [10. Merchant Dashboard, CSV Export, Diagnostics & Hackathon Demo Hub]    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

### Web Application (PWA)
- **Framework**: React 18 + Vite
- **Language**: TypeScript 5.5 (strict mode)
- **Styling**: Tailwind CSS (Indian fintech aesthetic: Indigo `#4338ca`, Emerald `#10b981`, Amber `#f59e0b`, Red `#ef4444`)
- **State Management**: Zustand
- **Local Persistence**: IndexedDB via `idb`
- **Audio & Voice**: Web Speech API (`SpeechSynthesis`) + Web Audio API synthesized soundbox chime
- **Icons**: Lucide React
- **Unit Testing**: Vitest (37 automated tests passing)

### Android Companion (`android-companion/`)
- **Language**: Kotlin 2.0 (JVM 17)
- **SDK Target**: Android SDK 34 (minSdk 26 - Android 8.0+)
- **Notification API**: `NotificationListenerService` with `BIND_NOTIFICATION_LISTENER_SERVICE`
- **Audio Engine**: Android `android.speech.tts.TextToSpeech` + `ToneGenerator`
- **Device Bridge**: Embedded lightweight WebSocket server (`Java-WebSocket`) on `127.0.0.1:8765` with token authentication

---

## 4. Payment Notification Processing Pipeline

The core pipeline executes 12 deterministic stages for every event:

1. **Ingest**: Receives push alert from Android system.
2. **Allowlist Verification**: Rejects any non-allowlisted package.
3. **Normalization**: Removes zero-width characters and standardizes currency symbols (`₹`, `Rs.`, `INR`).
4. **Modular Parser**: Routes to dedicated source parser:
   - `PhonePeParser`: Handles PhonePe notification formats and UTR extraction.
   - `GooglePayParser`: Handles GPay decimal credit alerts and VPA handles (`@oksbi`).
   - `PaytmParser`: Handles Paytm Business/wallet formats and balance alerts.
   - `BhimParser`: Handles NPCI BHIM credit notifications.
   - `GenericUpiParser`: Fallback for compliant bank credit alerts.
5. **Amount Extraction**:
   - Accurately parses amounts: `₹1`, `₹25.50`, `₹1,000`, `₹10,000`, `₹1,00,000.00`.
   - Distinguishes money amounts from account numbers (e.g. `A/c XX1234`) and UTR reference digits (`328910482910`).
6. **Classification & Trust/Safety**:
   - `INCOMING_PAYMENT`: Eligible for voice announcement.
   - `OUTGOING_PAYMENT`: **Strictly rejected.** Money sent by user cannot be announced as received.
   - `PENDING_PAYMENT`: **Strictly rejected.** Awaiting settlement.
   - `FAILED_PAYMENT`: **Strictly rejected.** Transaction failed.
   - `BALANCE_UPDATE`: Silenced as informational.
   - `REFUND_REVERSAL`: Eligible for custom refund announcement.
   - `AMBIGUOUS`: Promotional coupons and spam are discarded.
7. **Deduplication Check**:
   - Generates composite fingerprint: `SHA-256(package + amount + UTR_ref_id)`.
   - If UTR is missing, uses heuristic time-bucketed fingerprint with payer name.
   - Configurable window (default: 120s).
   - **Crucial Rule**: Two legitimate payments of the exact same amount (e.g. two separate ₹20 chai bills) with distinct references or distinct payers are **never** wrongly discarded.
8. **Speech Queue Manager**:
   - Enforces non-overlapping FIFO ordering.
   - Respects quiet mode hours (e.g. overnight 10 PM to 6 AM).
9. **Chime Synthesis**: Plays two-tone harmonic chime.
10. **Voice Playback**: Speaks announcement in chosen language (Hindi, English, Telugu, Tamil, Kannada, Marathi).
11. **Sanitized Storage**: Writes minimal transaction metadata to IndexedDB (scrubs raw notification text to protect privacy).
12. **Diagnostic Telemetry**: Records timestamped diagnostic logs.

---

## 5. Critical Trust & Safety Rules

> **An Android push notification is an alert posted by an app; it is NOT independent cryptographic proof of bank settlement.**

To protect merchants:
1. **Never announce from untrusted sources**: Unrecognized packages are strictly blocked.
2. **Never announce outgoing money**: Debit alerts (`"You paid ₹500"`) are immediately blocked.
3. **Never announce pending or failed transfers**: Prevents fraudsters from showing initiated/pending screens.
4. **Prominent UI Notice**: The dashboard displays a permanent Trust & Safety banner informing merchants to reconcile high-value payments directly with their bank passbook.
5. **No Credentials Requested**: The app never asks for UPI PIN, ATM PIN, passwords, or OTPs.

---

## 6. How to Run

### Running the Web Application

#### Prerequisites
- Node.js 18+ (Node.js 24 LTS installed in environment)

#### Steps:
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Build production bundle
npm run build

# 4. Start development server
npm run dev
```

Open your browser at:
```
http://127.0.0.1:5173/
```

### Running the Hackathon Demo Hub

You don't need real Android hardware or real bank transactions to test:
1. Open the web app at `http://127.0.0.1:5173/`.
2. Complete or skip the setup wizard.
3. Click the **Demo** button in the top navigation bar.
4. Click **Run Full 5-Step Tour** or trigger individual scenarios:
   - **PhonePe ₹50**: Plays chime and announces ₹50 received.
   - **Google Pay ₹1,250.50**: Decimal amount announcement.
   - **Outgoing Payment ₹500**: Blocked with red status; no speech produced.
   - **Failed Payment ₹250**: Blocked; no speech produced.
   - **Duplicate Test**: Triggers ₹50, then re-delivers the identical notification 1.2s later. The second event is suppressed with a yellow badge!
   - **2 Legitimate Payments Test**: Two distinct customers each pay ₹20 for chai; both are announced.

---

## 7. Android Companion Build & Installation

The Android native companion app code is fully implemented in `android-companion/`.

### Android Project Structure:
```
android-companion/
  build.gradle.kts
  settings.gradle.kts
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/in/soundless/companion/
        SoundlessApp.kt
        MainActivity.kt
        notification/SoundlessNotificationListenerService.kt
        parser/AppParsers.kt
        parser/AmountExtractor.kt
        classifier/PaymentClassifier.kt
        dedup/EventDeduplicator.kt
        announcement/SoundboxTtsManager.kt
        bridge/CompanionLocalServer.kt
      res/
        layout/activity_main.xml
        values/strings.xml
        values/colors.xml
        values/themes.xml
```

### To Build in Android Studio:
1. Open Android Studio (Hedgehog or newer).
2. Select **Open** and choose the `android-companion` directory.
3. Allow Gradle to sync dependencies (`androidx.core`, `org.java-websocket`, `gson`).
4. Connect an Android phone via USB debugging (Android 8.0 to Android 14+).
5. Click **Run 'app'** (`Shift + F10`) to deploy `SoundlessCompanion.apk`.
6. On your phone:
   - Tap **Open Android Notification Settings**.
   - Enable the toggle for **Soundless UPI Soundbox Listener**.
   - In battery settings, disable battery optimization for Soundless UPI.
7. The companion service will listen for real payments in the background and relay them to `ws://127.0.0.1:8765/soundless-bridge`.

---

## 8. Automated Test Summary

The test suite validates parsing, safety enforcement, and deduplication:
```
 ✓ src/tests/classifier.test.ts (6 tests)
 ✓ src/tests/deduplicator.test.ts (3 tests)
 ✓ src/tests/announcement.test.ts (9 tests)
 ✓ src/tests/parser.test.ts (19 tests)

 Test Files  4 passed (4)
      Tests  37 passed (37)
```

Key test cases covered:
- Extraction of amounts: `₹1`, `₹25.50`, `₹1,000`, `₹10,000`, `₹1,00,000.50`.
- Prevention of false positives on account numbers (`A/c 4589`) and UTR IDs.
- Outgoing debit rejection.
- Failed payment rejection.
- Pending payment rejection.
- Deduplication of identical UTR within 120s window.
- Preservation of legitimate equal-amount consecutive payments.
- Regional language speech formatting (Hindi, English, Telugu, Tamil, Marathi, Kannada).

---

## 9. Current Limitations & Future Work

| Area | Current MVP State | Future Roadmap |
| :--- | :--- | :--- |
| **Data Source** | Android push notifications via `NotificationListenerService` | Direct Open Banking / Account Aggregator API integration for cryptographic settlement verification |
| **Notification Formats** | Parsers tuned for PhonePe, GPay, Paytm, BHIM | Machine learning on-device NER model to dynamically adapt to unexpected notification changes |
| **Languages** | Built-in support for Hindi, English, Telugu, Tamil, Kannada, Marathi | Additional regional dialects and custom merchant voice cloning |
| **Hardware** | Smartphone speaker | Bluetooth speaker broadcast mode for louder street environments |
