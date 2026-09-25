import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Check, HelpCircle } from 'lucide-preact';
import styles from './BeaconRsvpForm.module.css';

interface Props {
  beacon: Beacon;
}

export const BeaconRsvpForm: FunctionComponent<Props> = ({ beacon }) => {
  const [hasRsvp, setHasRsvp] = useState<string | null>(beacon.has_rsvp || null);
  const [rsvpCount, setRsvpCount] = useState<number>(beacon.rsvp_count || 0);

  const submitRsvp = async (type: 'yes' | 'maybe' | null) => {
    const nextType = hasRsvp === type ? null : type;
    
    // Optimistic UI update
    setRsvpCount((prev) => (nextType === 'yes' ? prev + 1 : hasRsvp === 'yes' ? prev - 1 : prev));
    setHasRsvp(nextType);

    await apiClient.post('/rsvp/', {
      beacon_id: beacon.id,
      type: nextType,
    });
  };

  return (
    <div className={styles.form}>
      <button
        onClick={() => submitRsvp('yes')}
        className={`${styles.button} ${hasRsvp === 'yes' ? styles.yesSelected : styles.unselected}`}
      >
        <Check className={styles.icon} /> I'm In ({rsvpCount})
      </button>
      <button
        onClick={() => submitRsvp('maybe')}
        className={`${styles.button} ${hasRsvp === 'maybe' ? styles.maybeSelected : styles.unselected}`}
      >
        <HelpCircle className={styles.icon} /> Maybe
      </button>
    </div>
  );
};
