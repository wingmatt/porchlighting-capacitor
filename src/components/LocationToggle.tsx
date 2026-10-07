import { FunctionComponent } from 'preact';
import { AssetSvg } from './AssetSvg';
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
    <AssetSvg
      asset={checked ? 'checkmark.svg' : 'xmark.svg'}
      className={styles.icon}
    />
    {label}
  </label>
);