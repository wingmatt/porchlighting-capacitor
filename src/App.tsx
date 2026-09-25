import { FunctionComponent } from 'preact';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { InvitationPage } from './pages/InvitationPage';
import { PorchlightPage } from './pages/PorchlightPage';
import { BeaconIcon } from './components/BeaconIcon';
import { BeaconRsvpForm } from './components/BeaconRsvpForm';
import { MapboxMap } from './components/MapboxMap';
import styles from './App.module.css';

export const App: FunctionComponent = () => {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <header className={styles.header}>
          <Link to="/" className={styles.logo}>
            Porchlighting
          </Link>
        </header>
        <main className={styles.main}>
          <Routes>
            <Route path="/join/:sqid" element={<InvitationPage />} />
            <Route path="/porchlight/:id" element={<PorchlightPage />} />
            <Route
              path="/"
              element={
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
                      <BeaconRsvpForm beacon={{ id: 1, name: 'Front Porch' }} />
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
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
