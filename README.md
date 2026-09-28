# Porchlight Capacitor Mobile App

A cross-platform mobile application for Porchlight, built with **Preact**, **TypeScript**, **Tailwind CSS v4**, and **Capacitor 8**, interfacing with a **Django REST Framework (DRF)** backend and **Firebase Cloud Firestore** for real-time synchronization.

---

## 🛠 Tech Stack

- **Frontend**: [Preact](https://preactjs.com/) + TypeScript (`@preact/preset-vite`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- **Icons**: `lucide-preact`
- **Routing**: `react-router-dom`
- **Mobile Container**: [Capacitor 8](https://capacitorjs.com/) (iOS & Android)
- **Local Storage / Persistence**: `@capacitor/preferences`
- **Real-Time Data**: Firebase Cloud Firestore
- **Backend API**: Django REST Framework (`http://localhost:8000/api`)

---

## 📋 Prerequisites

Ensure the following tools are installed on your development machine:

- **Node.js**: `v18+` or `v20+` (LTS recommended)
- **npm**: `v9+`
- **Backend API**: Running instance of the Porchlight Django API (default: `http://localhost:8000`)
- **For Android Development**:
  - [Android Studio](https://developer.android.com/studio)
  - Android SDK & Platform Tools
  - Java Development Kit (JDK 17+)
- **For iOS Development** (macOS only):
  - [Xcode](https://developer.apple.com/xcode/)
  - CocoaPods or Xcode Command Line Tools

---

## 🚀 Getting Started & Local Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd porchlight-capacitor

# Install npm dependencies
npm install
```

### 2. Configure Environment Variables & Firebase

#### Backend API URL
By default, the API client connects to `http://localhost:8000/api`. To customize this, create a `.env` or `.env.local` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WEB_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
```

> **Note for Mobile Emulators & Devices**:
> - Android Emulator: use `http://10.0.2.2:8000/api` instead of `localhost`.
> - Physical Devices: use your machine's local LAN IP (e.g., `http://192.168.1.X:8000/api`).

#### Firebase Configuration
Copy `.env.example` to `.env.local` and set the Firebase Web SDK values for a
Firebase project dedicated to local or integration testing. Vite exposes only
variables prefixed with `VITE_`; do not put a service-account private key in
the frontend environment.

```env
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-web-app-id
```

---

## 💻 Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite local development server (with HMR) |
| `npm run build` | Type-checks and compiles web assets into the `dist/` directory |
| `npm run preview` | Locally previews the production build from `dist/` |

---

## 📱 Capacitor & Native Platforms

### Notifications

Use the **Enable** control in the app to opt into notifications for accessible
Porchlights. Browser builds use the service worker and VAPID key above; Safari
requires HTTPS and, on iOS/iPadOS, the site must be added to the Home Screen.
Native Android and iOS builds use `@capacitor/push-notifications` and FCM after
`npx cap sync`; configure Firebase and APNs credentials in the native shells.

### Syncing Web Assets to Native Platforms
Whenever you modify frontend code or dependencies and want to test on native platforms, build and sync:

```bash
# 1. Build web assets
npm run build

# 2. Sync web assets and plugins with native shells
npx cap sync
```

### Android Development

```bash
# Open project in Android Studio
npx cap open android

# Or build and launch directly on a connected device/emulator
npx cap run android
```

### iOS Development (macOS only)

```bash
# Open project in Xcode
npx cap open ios

# Or build and launch directly on a connected device/simulator
npx cap run ios
```

---

## 🏗 Project Architecture & Key Conventions

- **API Requests (`src/api/client.ts`)**:
  - Uses an Axios instance configured with request interceptors.
  - Automatically attaches `Authorization: Token <token>` for authenticated users and `X-Guest-Token` / `X-Guest-Name` headers for guest sessions using `@capacitor/preferences`.
  - Ensures endpoints use trailing slashes as expected by Django REST Framework.
- **Real-Time Data (`src/hooks/useFirebaseBeacon.ts`)**:
  - Subscribes to Firestore document snapshots with cleanup handlers to prevent duplicate listeners and memory leaks.
- **Type Definitions (`src/types.ts`)**:
  - Centralized domain TypeScript interfaces and types.
