import { FunctionComponent, JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { BeaconGraphic } from './BeaconGraphic';
import styles from './BeaconIcon.module.css';

interface Props {
  beacon: Beacon;
  editable?: boolean;
  onUpdate?: (updated: Beacon) => void;
}

export const BeaconIcon: FunctionComponent<Props> = ({ beacon, editable, onUpdate }) => {
  const isActive = beacon.is_on ?? Boolean(
    beacon.active_until && new Date(beacon.active_until) > new Date(),
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = async (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (!editable) return;
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.post(`/porchlights/${beacon.sqid}/control/`, {
        action: 'toggle',
      });
      if (onUpdate && response.data?.porchlight) {
        onUpdate(response.data.porchlight);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!editable || saving}
      aria-busy={saving}
      className={`${styles.button} ${isActive ? styles.active : styles.inactive}`}
      aria-label={isActive ? 'Turn off beacon' : 'Turn on beacon'}
    >
      <span className={styles.iconWrapper}>
        <BeaconGraphic isOn={isActive} className={styles.icon} label={isActive ? 'Lit porchlight' : 'Unlit porchlight'} />
        {(beacon.rsvp_count ?? 0) > 0 && (
          <span
            className={`${styles.rsvpBadge} ${beacon.has_rsvp ? styles.rsvpBadgeSelected : ''}`}
            aria-label={`${beacon.rsvp_count} RSVP${beacon.rsvp_count === 1 ? '' : 's'}${beacon.has_rsvp ? ', including you' : ''}`}
          >
            <span className={styles.rsvpIcon} aria-hidden="true" />
            <span>{beacon.rsvp_count}</span>
          </span>
        )}
      </span>
    </button>
  );
};
