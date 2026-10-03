import { FunctionComponent } from 'preact';
import { Link } from 'react-router-dom';
import { Beacon } from '../types';
import { BeaconIcon } from './BeaconIcon';
import styles from './PorchlightListItem.module.css';

interface PorchlightListItemProps {
  porchlight: Beacon;
}

export const PorchlightListItem: FunctionComponent<PorchlightListItemProps> = ({ porchlight }) => (
  <Link className={styles.item} to={`/porchlight/${porchlight.sqid}`}>
    <span>{porchlight.name || 'Unnamed porchlight'}</span>
    <BeaconIcon beacon={porchlight} />
  </Link>
);