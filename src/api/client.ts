import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

interface Credentials {
  authToken: string | null;
  guestToken: string | null;
  guestName: string | null;
}

let credentials: Credentials = { authToken: null, guestToken: null, guestName: null };
let credentialsReady: Promise<void> | null = null;
const pendingGets = new Map<string, AbortController>();

export const hydrateCredentials = async (): Promise<void> => {
  if (!credentialsReady) {
    credentialsReady = Promise.all([
      Preferences.get({ key: 'auth_token' }),
      Preferences.get({ key: 'guestToken' }),
      Preferences.get({ key: 'guestName' }),
    ]).then(([auth, guest, name]) => {
      credentials = { authToken: auth.value, guestToken: guest.value, guestName: name.value };
    });
  }
  await credentialsReady;
};

export const getCredentials = (): Readonly<Credentials> => credentials;

export const setAuthToken = async (authToken: string): Promise<void> => {
  credentials.authToken = authToken;
  await Preferences.set({ key: 'auth_token', value: authToken });
};

export const clearAuthToken = async (): Promise<void> => {
  credentials.authToken = null;
  await Preferences.remove({ key: 'auth_token' });
};

export const setGuestCredentials = async (guestToken: string, guestName: string): Promise<void> => {
  credentials.guestToken = guestToken;
  credentials.guestName = guestName;
  await Promise.all([
    Preferences.set({ key: 'guestToken', value: guestToken }),
    Preferences.set({ key: 'guestName', value: guestName }),
  ]);
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

apiClient.interceptors.request.use(async (config) => {
  await hydrateCredentials();
  const authToken = credentials.authToken;
  const guestToken = credentials.guestToken;
  const guestName = credentials.guestName;

  if (config.method?.toLowerCase() === 'get') {
    const key = `${config.method}:${config.baseURL || ''}${config.url || ''}:${JSON.stringify(config.params || {})}`;
    pendingGets.get(key)?.abort();
    const controller = new AbortController();
    pendingGets.set(key, controller);
    config.signal = config.signal || controller.signal;
    (config as typeof config & { __dedupeKey?: string }).__dedupeKey = key;
  }

  if (authToken) {
    config.headers.Authorization = `Token ${authToken}`;
  }
  if (guestToken) {
    config.headers['X-Guest-Token'] = guestToken;
  }
  if (guestName) {
    config.headers['X-Guest-Name'] = guestName;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const key = (response.config as typeof response.config & { __dedupeKey?: string }).__dedupeKey;
    if (key) pendingGets.delete(key);
    return response;
  },
  (error) => {
    const config = error.config as (typeof error.config & { __dedupeKey?: string }) | undefined;
    if (config?.__dedupeKey) pendingGets.delete(config.__dedupeKey);
    return Promise.reject(error);
  },
);
