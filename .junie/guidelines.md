# Project Guidelines: Porchlight Capacitor (Preact + Django API)

These guidelines document the architecture, coding conventions, and backend integration patterns for the Porchlight Capacitor project.

---

## 1. Tech Stack Overview

- **Frontend Framework**: [Preact](https://preactjs.com/) with TypeScript (`@preact/preset-vite`).
- **Build Tool**: [Vite](https://vite.dev/) with `@tailwindcss/vite` (Tailwind CSS v4).
- **Mobile Container**: [Capacitor 8](https://capacitorjs.com/) (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/preferences`).
- **Maps & Geolocation**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (`mapbox-gl`, `@types/mapbox-gl`) for interactive map rendering and beacon geocoordinates display.
- **Backend**: Django REST Framework (DRF) API (`http://localhost:8000/api`) backed by PostgreSQL/PostGIS.
- **Real-time Synchronization**: Firebase Cloud Firestore document listeners (used strictly to broadcast backend state updates).
- **Routing & Navigation**: `react-router-dom`.
- **Icons**: `lucide-preact`.

---

## 2. Frontend & Component Conventions

### Preact & Hooks
- Import component types and hooks from `preact` and `preact/hooks`:
  ```typescript
  import { FunctionComponent, JSX } from 'preact';
  import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
  ```
- Avoid importing from `react` directly; prefer `preact` / `preact/hooks` to keep bundle size minimal.
- Use `lucide-preact` for UI icons.

### TypeScript & Typing
- Place shared domain interfaces and types in `src/types.ts` (e.g., `Beacon`, `Invitation`).
- Component props should be explicitly typed using interfaces (e.g., `interface Props { ... }`).
- Maintain strict typing: avoid `any` where possible, and properly type API responses and event handlers (`JSX.TargetedMouseEvent`, `JSX.TargetedEvent`).

### Styling & UI
- Use Tailwind CSS v4 utility classes.
- Use `clsx` or template literals for conditional styling.
- Maintain responsive, mobile-first layouts suitable for iOS and Android web views and safe-area insets.

---

## 3. Django Backend API Integration

### Client Configuration (`src/api/client.ts`)
- All backend REST communication must go through `apiClient` (`axios` instance).
- Base URL is configured via `import.meta.env.VITE_API_BASE_URL` (defaulting to `http://localhost:8000/api`).

### URL Trailing Slashes
- Django / DRF routes typically require trailing slashes by default. Ensure all endpoint requests end with a trailing slash (e.g., `/porchlight/${id}/update/`, `/guest/join/`).

### Authentication & Guest Interceptors
- Tokens and guest states are persisted using `@capacitor/preferences`.
- The `apiClient` request interceptor attaches:
  - `Authorization: Token <auth_token>` (for Django TokenAuthentication / DRF tokens).
  - `X-Guest-Token: <guestToken>` and `X-Guest-Name: <guestName>` for unauthenticated/guest users.

---

## 4. Real-time Firebase & Mobile Data Management

### Real-Time Firestore Hooks
- Use custom hooks (e.g., `src/hooks/useFirebaseBeacon.ts`) to listen to Firestore document snapshots via `onSnapshot`.
- Always return the `unsub()` cleanup function inside `useEffect` to prevent memory leaks and duplicate subscriptions.
- Merge snapshot updates defensively to preserve local state fields that might not be synced in the Firestore document payload.

### Local Storage & Preferences
- Use `@capacitor/preferences` for all persistent storage (auth tokens, guest sessions, device preferences) rather than `localStorage` to ensure consistent behavior across Android, iOS, and Web.

---

## 5. Capacitor & Native Workflow

- **Web Build**: `npm run build` outputs web assets to `dist/`.
- **Sync Native Platforms**: After updating frontend code, sync native assets:
  ```bash
  npm run build
  npx cap sync
  ```
- **Android / iOS Projects**:
  - `android/` and `ios/` folders contain native shell projects.
  - Native build artifacts, pods, gradle caches, and synced web asset copies are gitignored and managed via Capacitor CLI.

---

## 6. Development Scripts

- `npm run dev`: Start local Vite development server.
- `npm run build`: Type-check and build production distribution.
- `npm run preview`: Preview production build locally.
- `npx cap run android` / `npx cap run ios`: Run app on connected devices / emulators.
