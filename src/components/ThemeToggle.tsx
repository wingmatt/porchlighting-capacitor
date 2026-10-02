import { FunctionComponent } from 'preact';
import { Moon, Sun } from 'lucide-preact';
import { useTheme } from '../contexts/Theme';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: FunctionComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return <button
    type="button"
    className={styles.button}
    onClick={toggleTheme}
    aria-label={`Switch to ${nextTheme} mode`}
    aria-pressed={theme === 'dark'}
  >
    {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>;
};