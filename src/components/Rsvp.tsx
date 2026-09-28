import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Check } from 'lucide-preact';
import styles from './Rsvp.module.css';

interface Props {
  beacon: Beacon;
}

export const Rsvp: FunctionComponent<Props> = ({ beacon }) => {
  const [hasRsvp, setHasRsvp] = useState(Boolean(beacon.has_rsvp));
  const [rsvpCount, setRsvpCount] = useState<number>(beacon.rsvp_count || 0);
  const [rsvpId, setRsvpId] = useState<string | null>(beacon.rsvp_id || null);

  const toggleRsvp = async () => {
    const nextHasRsvp = !hasRsvp;
    setHasRsvp(nextHasRsvp);
    setRsvpCount((prev) => prev + (nextHasRsvp ? 1 : -1));
    try {
      if (nextHasRsvp) {
        const response = await apiClient.post('/rsvps/', { porchlight: beacon.id });
        setRsvpId(response.data.id);
      } else if (rsvpId) {
        await apiClient.delete(`/rsvps/${rsvpId}/`);
        setRsvpId(null);
      }
    } catch (error) {
      setHasRsvp(!nextHasRsvp);
      setRsvpCount((prev) => prev - (nextHasRsvp ? 1 : -1));
    }
  };

  return (
    <div className={styles.form}>
      <button
        onClick={toggleRsvp}
        className={`${styles.button} ${hasRsvp ? styles.yesSelected : styles.unselected}`}
      >
        <Check className={styles.icon} /> I'm In ({rsvpCount})
      </button>
    </div>
  );
};
