import { FunctionComponent } from 'preact';
import { Link } from 'react-router-dom';
import { Beacon } from '../types';
import { BeaconIcon, canEditBeacon } from './BeaconIcon';
import styles from './PorchlightListItem.module.css';

interface PorchlightListItemProps {
  porchlight: Beacon;
  onUpdate?: (updated: Beacon) => void;
}

export const PorchlightListItem: FunctionComponent<PorchlightListItemProps> = ({ porchlight, onUpdate }) => (
  <Link className={styles.item} to={`/porchlight/${porchlight.sqid}`}>
    <span>{porchlight.name || 'Unnamed porchlight'}</span>
    <BeaconIcon beacon={porchlight} editable={canEditBeacon(porchlight)} onUpdate={onUpdate} />
  </Link>
);