import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-preact';
import { Beacon } from '../types';
import { MapboxMap } from './MapboxMap';
import { PorchlightListItem } from './PorchlightListItem';
import styles from './PorchlightList.module.css';

interface PorchlightListProps {
  porchlights: Beacon[];
  emptyMessage?: string;
}

const hasLocation = (porchlight: Beacon) => Boolean(porchlight.location || porchlight.coordinates);

const TabLabel: FunctionComponent<{ label: string; isOn: boolean }> = ({ label, isOn }) => (
  <span className={styles.tabLabel}>
    {label}
    <Lightbulb className={`${styles.statusIcon} ${isOn ? styles.statusOn : styles.statusOff}`} aria-label={isOn ? 'A porchlight is on' : 'No porchlights are on'} />
  </span>
);

export const PorchlightList: FunctionComponent<PorchlightListProps> = ({ porchlights, emptyMessage = 'No porchlights yet.' }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'map'>('all');
  const locatedPorchlights = porchlights.filter(hasLocation);
  const anyPorchlightOn = porchlights.some((porchlight) => porchlight.is_on);
  const anyLocatedPorchlightOn = locatedPorchlights.some((porchlight) => porchlight.is_on);

  if (porchlights.length === 0) return <p>{emptyMessage}</p>;

  if (locatedPorchlights.length === 0) {
    return <>{porchlights.map((porchlight) => <PorchlightListItem porchlight={porchlight} key={porchlight.id} />)}</>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs} role="tablist" aria-label="Porchlight display">
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
          role="tab"
          aria-selected={activeTab === 'all'}
        >
          <TabLabel label="All" isOn={anyPorchlightOn} />
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'map' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('map')}
          role="tab"
          aria-selected={activeTab === 'map'}
        >
          <TabLabel label="Map" isOn={anyLocatedPorchlightOn} />
        </button>
      </div>

      {activeTab === 'all' ? (
        <div role="tabpanel">
          {porchlights.map((porchlight) => <PorchlightListItem porchlight={porchlight} key={porchlight.id} />)}
        </div>
      ) : (
        <div className={styles.mapList} role="tabpanel">
          {locatedPorchlights.map((porchlight) => (
            <div className={styles.mapItem} key={porchlight.id}>
              <Link className={styles.mapTitle} to={`/porchlight/${porchlight.sqid}`}>
                {porchlight.name || 'Unnamed porchlight'}
              </Link>
              <MapboxMap
                location={porchlight.location || porchlight.coordinates}
                name={porchlight.name}
                isOn={porchlight.is_on}
                color={porchlight.color}
                className={styles.map}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};