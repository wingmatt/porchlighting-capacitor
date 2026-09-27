import { FunctionComponent, JSX } from 'preact';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Lightbulb } from 'lucide-preact';
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

  const handleToggle = async (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (!editable) return;
    e.preventDefault();
    const response = await apiClient.post(`/porchlights/${beacon.sqid}/control/`, {
      action: 'toggle',
    });
    if (onUpdate && response.data?.porchlight) {
      onUpdate(response.data.porchlight);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!editable}
      className={`${styles.button} ${isActive ? styles.active : styles.inactive}`}
      aria-label={isActive ? 'Turn off beacon' : 'Turn on beacon'}
    >
      <Lightbulb className={styles.icon} />
    </button>
  );
};
