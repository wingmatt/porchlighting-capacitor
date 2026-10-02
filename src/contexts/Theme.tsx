import { createContext, FunctionComponent, ComponentChildren } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

const THEME_KEY = 'theme_preference';
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getSystemTheme = (): Theme => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem(THEME_KEY);
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : getSystemTheme();
};

export const ThemeProvider: FunctionComponent<{ children: ComponentChildren }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (localStorage.getItem(THEME_KEY) === null) setTheme(getSystemTheme());
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === getSystemTheme()) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, nextTheme);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};