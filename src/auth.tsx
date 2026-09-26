import { createContext, FunctionComponent, ComponentChildren } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { Preferences } from '@capacitor/preferences';
import { apiClient } from './api/client';
import { User } from './types';

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
    Preferences.get({ key: 'auth_token' }).then(({ value }) => {
      if (!value) {
        setLoading(false);
        return;
      }
      apiClient.get('/auth/me/').then((response) => setUser(response.data)).catch(() => Preferences.remove({ key: 'auth_token' })).finally(() => setLoading(false));
    });
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login/', { email, password });
    await Preferences.set({ key: 'auth_token', value: response.data.token });
    setUser(response.data.user);
  };

  const loginWithToken = async (token: string, nextUser: User) => {
    await Preferences.set({ key: 'auth_token', value: token });
    setUser(nextUser);
  };

  const logout = async () => {
    try { await apiClient.post('/auth/logout/'); } finally {
      await Preferences.remove({ key: 'auth_token' });
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