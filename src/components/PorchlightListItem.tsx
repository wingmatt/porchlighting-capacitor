import { FunctionComponent } from 'preact';
import { Link } from 'react-router-dom';
import { Beacon } from '../types';
import styles from './PorchlightListItem.module.css';

interface PorchlightListItemProps {
  porchlight: Beacon;
}

export const PorchlightListItem: FunctionComponent<PorchlightListItemProps> = ({ porchlight }) => (
  <Link className={styles.item} to={`/porchlight/${porchlight.id}`}>
    <span>{porchlight.name || 'Unnamed porchlight'}</span>
    <span className={porchlight.is_on ? styles.on : styles.off}>{porchlight.is_on ? 'On' : 'Off'}</span>
  </Link>
);