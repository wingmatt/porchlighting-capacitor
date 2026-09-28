import { FunctionComponent } from 'preact';
import { BeaconIcon } from '../components/BeaconIcon';
import { MapboxMap } from '../components/MapboxMap';
import { Rsvp } from '../components/Rsvp';
import styles from '../App.module.css';

export const HomePage: FunctionComponent = () => (
  <div className={styles.homeStack}>
    <div className={styles.cardWide}>
      <h2 className={styles.cardTitle}>Welcome to Porchlighting Mobile</h2>
      <p className={styles.cardDescription}>
        View and interact with real-time active porchlights and beacons in your neighborhood.
      </p>
      <div className={styles.beaconActions}>
        <BeaconIcon
          beacon={{
            id: 1,
            name: 'Front Porch',
            is_on: true,
            active_until: new Date(Date.now() + 3600000 * 4).toISOString(),
          }}
          editable
        />
        <Rsvp beacon={{ id: 1, name: 'Front Porch' }} />
      </div>
    </div>

    <div className={styles.cardWideCompact}>
      <h3 className={styles.sectionTitle}>Nearby Porchlight Location</h3>
      <MapboxMap
        location={{ latitude: 37.7749, longitude: -122.4194 }}
        name="Sample Porchlight"
        statusMessage="Open for neighborhood drinks"
        isOn={true}
        color="#F59E0B"
        className={styles.homeMap}
      />
    </div>
  </div>
);