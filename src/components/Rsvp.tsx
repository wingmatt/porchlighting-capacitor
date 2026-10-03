import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import styles from './Rsvp.module.css';

interface Props {
  beacon: Beacon;
}

export const Rsvp: FunctionComponent<Props> = ({ beacon }) => {
  const [hasRsvp, setHasRsvp] = useState(Boolean(beacon.has_rsvp));
  const [rsvpCount, setRsvpCount] = useState<number>(beacon.rsvp_count || 0);
  const [rsvpId, setRsvpId] = useState<string | null>(beacon.rsvp_id || null);
  const [saving, setSaving] = useState(false);

  const toggleRsvp = async () => {
    if (saving) return;
    const nextHasRsvp = !hasRsvp;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.form}>
      <button
        type="button"
        onClick={toggleRsvp}
        disabled={saving}
        aria-pressed={hasRsvp}
        aria-busy={saving}
        className={`${styles.button} ${hasRsvp ? styles.yesSelected : styles.unselected}`}
      >
        <span className={`${styles.icon} ${hasRsvp ? styles.activeIcon : ''}`} aria-hidden="true" /> I'm In ({rsvpCount})
      </button>
    </div>
  );
};
