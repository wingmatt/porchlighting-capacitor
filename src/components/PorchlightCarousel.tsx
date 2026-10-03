import { FunctionComponent } from 'preact';
import { Link } from 'react-router-dom';
import { Beacon } from '../types';
import { BeaconIcon, canEditBeacon } from './BeaconIcon';
import styles from './PorchlightCarousel.module.css';

interface PorchlightCarouselProps {
  porchlights: Beacon[];
  emptyMessage?: string;
  onUpdate?: (updated: Beacon) => void;
}

export const PorchlightCarousel: FunctionComponent<PorchlightCarouselProps> = ({ porchlights, emptyMessage = 'No porchlights yet.', onUpdate }) => {
  if (porchlights.length === 0) return <p>{emptyMessage}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        {porchlights.map((porchlight) => (
          <article className={styles.card} key={porchlight.id}>
            <span className={styles.name}>{porchlight.name || 'Unnamed porchlight'}</span>
            <BeaconIcon beacon={porchlight} editable={canEditBeacon(porchlight)} onUpdate={onUpdate} />
            <Link className={styles.editButton} to={`/porchlight/${porchlight.sqid}/edit`}>Edit</Link>
          </article>
        ))}
      </div>
    </div>
  );
};