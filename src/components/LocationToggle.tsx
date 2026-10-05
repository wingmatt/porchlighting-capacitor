import { FunctionComponent } from 'preact';
import styles from './LocationToggle.module.css';

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const LocationToggle: FunctionComponent<Props> = ({ label, checked, onChange }) => (
  <label className={styles.toggle}>
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
    <img
      className={styles.icon}
      src={checked ? 'https://assets.porchlighting.net/checkmark.svg' : 'https://assets.porchlighting.net/xmark.svg'}
      alt=""
      aria-hidden="true"
    />
    {label}
  </label>
);