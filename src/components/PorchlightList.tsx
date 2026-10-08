import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link } from 'react-router-dom';
import { Beacon } from '../types';
import { BeaconGraphic } from './BeaconGraphic';
import { MapboxMap } from './MapboxMap';
import { PorchlightListItem } from './PorchlightListItem';
import { useAccessibilityPreferences } from '../contexts/AccessibilityPreferences';
import styles from './PorchlightList.module.css';

interface PorchlightListProps {
  porchlights: Beacon[];
  emptyMessage?: string;
  onUpdate?: (updated: Beacon) => void;
}

const hasLocation = (porchlight: Beacon) => porchlight.type === 'physical' && Boolean(porchlight.location);

const TabLabel: FunctionComponent<{ label: string; isOn: boolean }> = ({ label, isOn }) => (
  <span className={styles.tabLabel}>
    {label}
    <BeaconGraphic isOn={isOn} className={styles.statusIcon} label={isOn ? 'A porchlight is on' : 'No porchlights are on'} />
  </span>
);

export const PorchlightList: FunctionComponent<PorchlightListProps> = ({ porchlights, emptyMessage = 'No porchlights yet.', onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'map'>('all');
  const [displayPorchlights, setDisplayPorchlights] = useState(porchlights);
  const { reducedMotion } = useAccessibilityPreferences();
  useEffect(() => setDisplayPorchlights(porchlights), [porchlights]);
  const updatePorchlight = (updated: Beacon) => {
    setDisplayPorchlights((current) => current.map((porchlight) => porchlight.id === updated.id ? updated : porchlight));
    onUpdate?.(updated);
  };
  const locatedPorchlights = displayPorchlights.filter(hasLocation);
  const anyPorchlightOn = displayPorchlights.some((porchlight) => porchlight.is_on);
  const anyLocatedPorchlightOn = locatedPorchlights.some((porchlight) => porchlight.is_on);
  const refreshNote = reducedMotion && <p className={styles.refreshNote} role="status">Reduced-motion mode is active. Refresh this page manually to see updates.</p>;

  const selectTab = (tab: 'all' | 'map') => setActiveTab(tab);
  const handleTabKeyDown = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === 'ArrowLeft' || event.key === 'Home' ? 'all' : 'map';
    selectTab(nextTab);
    document.getElementById(`porchlight-tab-${nextTab}`)?.focus();
  };

  if (displayPorchlights.length === 0) return <>{refreshNote}<p>{emptyMessage}</p></>;

  if (locatedPorchlights.length === 0) {
    return <>{refreshNote}{displayPorchlights.map((porchlight) => <PorchlightListItem porchlight={porchlight} key={porchlight.id} onUpdate={updatePorchlight} />)}</>;
  }

  return (
    <div className={styles.container}>
      {refreshNote}
      <div className={styles.tabs} role="tablist" aria-label="Porchlight display">
        <button
          id="porchlight-tab-all"
          type="button"
          className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => selectTab('all')}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="porchlight-panel-all"
          tabIndex={activeTab === 'all' ? 0 : -1}
        >
          <TabLabel label="All" isOn={anyPorchlightOn} />
        </button>
        <button
          id="porchlight-tab-map"
          type="button"
          className={`${styles.tab} ${activeTab === 'map' ? styles.activeTab : ''}`}
          onClick={() => selectTab('map')}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeTab === 'map'}
          aria-controls="porchlight-panel-map"
          tabIndex={activeTab === 'map' ? 0 : -1}
        >
          <TabLabel label="Map" isOn={anyLocatedPorchlightOn} />
        </button>
      </div>

      {activeTab === 'all' ? (
        <div id="porchlight-panel-all" role="tabpanel" aria-labelledby="porchlight-tab-all" tabIndex={0}>
          {displayPorchlights.map((porchlight) => <PorchlightListItem porchlight={porchlight} key={porchlight.id} onUpdate={updatePorchlight} />)}
        </div>
      ) : (
        <div id="porchlight-panel-map" className={styles.mapList} role="tabpanel" aria-labelledby="porchlight-tab-map" tabIndex={0}>
          <MapboxMap
            markers={locatedPorchlights.map((porchlight) => ({
              location: porchlight.location!,
              name: porchlight.name,
              statusMessage: porchlight.status_message,
              description: porchlight.description,
              isOn: porchlight.is_on,
              color: porchlight.color,
              rsvpBeacon: porchlight,
            }))}
            className={styles.map}
          />
          <div className={styles.mapItems}>
            {locatedPorchlights.map((porchlight) => (
              <Link className={styles.mapTitle} to={`/porchlight/${porchlight.sqid}`} key={porchlight.id}>
                {porchlight.name || 'Unnamed porchlight'}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};