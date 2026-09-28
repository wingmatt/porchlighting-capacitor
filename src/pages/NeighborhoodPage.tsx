import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { apiClient } from '../api/client';
import { Beacon } from '../types';
import { PorchlightList } from '../components/PorchlightList';
import styles from './NeighborhoodPage.module.css';

export const NeighborhoodPage: FunctionComponent = () => {
  const [porchlights, setPorchlights] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/neighborhood/')
      .then((response) => setPorchlights(response.data))
      .catch(() => setError('Unable to load your neighborhood Porchlights.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Neighborhood</h1>
        <p>Porchlights you own or can access.</p>
        {loading && <p>Loading Porchlights...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && <PorchlightList porchlights={porchlights} emptyMessage="No accessible Porchlights yet." />}
      </div>
    </div>
  );
};