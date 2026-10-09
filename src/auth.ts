import { computed, inject, onMounted, provide, ref, type InjectionKey, type Ref } from 'vue';
import { apiClient, clearAuthToken, getCredentials, hydrateCredentials, setAuthToken } from './api/client';
import { User } from './types';
import { signInToFirebase, signOutOfFirebase } from './firebase';

export interface AuthContextValue {
  user: Ref<User | null>;
  loading: Ref<boolean>;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, nextUser: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_KEY: InjectionKey<AuthContextValue> = Symbol('auth');

export function AuthProvider() {
  const user = ref<User | null>(null);
  const loading = ref(true);

  const synchronizeFirebaseAuth = async (customToken?: string | null) => {
    try {
      const token = customToken || (await apiClient.post('/auth/firebase-token/')).data.firebase_token;
      await signInToFirebase(token);
    } catch (error) {
      console.error('Firebase authentication is unavailable.', error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login/', { email, password });
    await setAuthToken(response.data.token);
    user.value = response.data.user;
    await synchronizeFirebaseAuth(response.data.firebase_token);
  };

  const loginWithToken = async (token: string, nextUser: User) => {
    await setAuthToken(token);
    user.value = nextUser;
    await synchronizeFirebaseAuth();
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      await clearAuthToken();
      await signOutOfFirebase();
      user.value = null;
    }
  };

  onMounted(async () => {
    await hydrateCredentials();
    const { authToken, guestToken } = getCredentials();
    try {
      if (authToken) {
        const response = await apiClient.get('/auth/me/');
        user.value = response.data;
        await synchronizeFirebaseAuth();
      } else if (guestToken) {
        await synchronizeFirebaseAuth();
      }
    } catch {
      if (authToken) await clearAuthToken();
    } finally {
      loading.value = false;
    }
  });

  provide(AUTH_KEY, { user, loading, login, loginWithToken, logout });
  return { user, loading, login, loginWithToken, logout };
}

export function useAuth(): AuthContextValue {
  const context = inject(AUTH_KEY);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export const authUser = (context: AuthContextValue) => computed(() => context.user.value);