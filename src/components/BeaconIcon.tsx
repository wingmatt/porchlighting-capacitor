import { FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { BeaconGraphic } from './BeaconGraphic';
import styles from './BeaconIcon.module.css';

interface Props {
  beacon: Beacon;
  editable?: boolean;
  onUpdate?: (updated: Beacon) => void;
}

const editableRoles = new Set(['OWNER', 'ADMIN', 'EDIT', 'SHARE']);

export const canEditBeacon = (beacon: Beacon) => (
  Boolean(beacon.is_owner) || editableRoles.has(String(beacon.user_role || '').toUpperCase())
);

export const BeaconIcon: FunctionComponent<Props> = ({ beacon, editable, onUpdate }) => {
  const [currentBeacon, setCurrentBeacon] = useState(beacon);
  const [saving, setSaving] = useState(false);
  useEffect(() => setCurrentBeacon(beacon), [beacon]);

  const isActive = currentBeacon.is_on ?? Boolean(
    currentBeacon.active_until && new Date(currentBeacon.active_until) > new Date(),
  );

  const handleToggle = async (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      const response = await apiClient.post(`/porchlights/${beacon.sqid}/control/`, {
        action: 'toggle',
      });
      if (response.data?.porchlight) {
        setCurrentBeacon(response.data.porchlight);
        onUpdate?.(response.data.porchlight);
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
        {(currentBeacon.rsvp_count ?? 0) > 0 && (
          <span
            className={`${styles.rsvpBadge} ${currentBeacon.has_rsvp ? styles.rsvpBadgeSelected : ''}`}
            aria-label={`${currentBeacon.rsvp_count} RSVP${currentBeacon.rsvp_count === 1 ? '' : 's'}${currentBeacon.has_rsvp ? ', including you' : ''}`}
          >
            <span className={styles.rsvpIcon} aria-hidden="true" />
            <span>{currentBeacon.rsvp_count}</span>
          </span>
        )}
      </span>
    </button>
  );
};
