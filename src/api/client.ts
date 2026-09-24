import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

apiClient.interceptors.request.use(async (config) => {
  const authToken = (await Preferences.get({ key: 'auth_token' })).value;
  const guestToken = (await Preferences.get({ key: 'guestToken' })).value;
  const guestName = (await Preferences.get({ key: 'guestName' })).value;

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
