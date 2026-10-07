import { FunctionComponent } from 'preact';
import { useTheme } from '../contexts/Theme';
import { AssetSvg } from './AssetSvg';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: FunctionComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return <button
    type="button"
    className={`${styles.button} ${nextTheme === 'light' ? styles.lightMode : styles.darkMode}`}
    data-theme={nextTheme}
    onClick={toggleTheme}
    aria-label={`Switch to ${nextTheme} mode`}
    aria-pressed={theme === 'dark'}
  >
    <AssetSvg
      asset={nextTheme === 'light' ? 'sun.svg' : 'moon.svg'}
      className={`${styles.icon} ${nextTheme === 'light' ? styles.sunIcon : styles.moonIcon}`}
    />
    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>;
};