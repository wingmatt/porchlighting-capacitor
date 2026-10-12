import { inject, onBeforeUnmount, onMounted, provide, ref, type InjectionKey, type Ref } from 'vue';

const THEME_KEY = 'theme_preference';
export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Ref<Theme>;
  toggleTheme: () => void;
}

const THEME_CONTEXT_KEY: InjectionKey<ThemeContextValue> = Symbol('theme');
const getSystemTheme = (): Theme => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem(THEME_KEY);
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : getSystemTheme();
};
const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
};

export function ThemeProvider() {
  const theme = ref<Theme>(getInitialTheme());
  let mediaQuery: MediaQueryList | null = null;
  let handleSystemThemeChange: (() => void) | null = null;
  const toggleTheme = () => {
    const nextTheme = theme.value === 'dark' ? 'light' : 'dark';
    theme.value = nextTheme;
    applyTheme(nextTheme);
    if (nextTheme === getSystemTheme()) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, nextTheme);
  };

  onMounted(() => {
    applyTheme(theme.value);
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handleSystemThemeChange = () => {
      if (localStorage.getItem(THEME_KEY) === null) {
        theme.value = getSystemTheme();
        applyTheme(theme.value);
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  });

  onBeforeUnmount(() => {
    if (mediaQuery && handleSystemThemeChange) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  });

  provide(THEME_CONTEXT_KEY, { theme, toggleTheme });
  return { theme, toggleTheme };
}

export function useTheme(): ThemeContextValue {
  const context = inject(THEME_CONTEXT_KEY);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}