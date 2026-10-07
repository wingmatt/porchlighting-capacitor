import { createContext, FunctionComponent, ComponentChildren } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { apiClient, clearAuthToken, getCredentials, hydrateCredentials, setAuthToken } from './api/client';
import { User } from './types';
import { signInToFirebase, signOutOfFirebase } from './firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, nextUser: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      await hydrateCredentials();
      const { authToken, guestToken } = getCredentials();
      try {
        if (authToken) {
          const response = await apiClient.get('/auth/me/');
          setUser(response.data);
          await synchronizeFirebaseAuth();
        } else if (guestToken) {
          await synchronizeFirebaseAuth();
        }
      } catch {
        if (authToken) await clearAuthToken();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

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
    setUser(response.data.user);
    await synchronizeFirebaseAuth(response.data.firebase_token);
  };

  const loginWithToken = async (token: string, nextUser: User) => {
    await setAuthToken(token);
    setUser(nextUser);
    await synchronizeFirebaseAuth();
  };

  const logout = async () => {
    try { await apiClient.post('/auth/logout/'); } finally {
      await clearAuthToken();
      await signOutOfFirebase();
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};