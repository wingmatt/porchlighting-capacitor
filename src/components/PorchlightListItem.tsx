import { FunctionComponent } from 'preact';
import { Link } from 'react-router-dom';
import { Beacon } from '../types';
import { BeaconIcon, canEditBeacon } from './BeaconIcon';
import { Rsvp } from './Rsvp';
import styles from './PorchlightListItem.module.css';

interface PorchlightListItemProps {
  porchlight: Beacon;
  onUpdate?: (updated: Beacon) => void;
}

export const PorchlightListItem: FunctionComponent<PorchlightListItemProps> = ({ porchlight, onUpdate }) => {
  const canEdit = canEditBeacon(porchlight);
  const handleRsvpUpdate = (updated: Partial<Beacon>) => onUpdate?.({ ...porchlight, ...updated });

  return (
    <div className={styles.item}>
      <BeaconIcon beacon={porchlight} editable={canEdit} onUpdate={onUpdate} />
      <Link className={styles.name} to={`/porchlight/${porchlight.sqid}`}>
        <span>{porchlight.name || 'Unnamed porchlight'}</span>
        {canEdit && <span className={styles.permissionIndicator} title="You can edit this porchlight" aria-label="You can edit this porchlight">✦</span>}
      </Link>
      <Rsvp beacon={porchlight} onUpdate={handleRsvpUpdate} />
    </div>
  );
};