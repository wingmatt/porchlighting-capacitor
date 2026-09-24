import { FunctionComponent } from 'preact';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { InvitationPage } from './pages/InvitationPage';
import { PorchlightPage } from './pages/PorchlightPage';
import { BeaconIcon } from './components/BeaconIcon';
import { BeaconRsvpForm } from './components/BeaconRsvpForm';
import { MapboxMap } from './components/MapboxMap';

export const App: FunctionComponent = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="p-4 bg-white border-b border-slate-200">
          <Link to="/" className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
            Porchlighting
          </Link>
        </header>
        <main className="p-4 max-w-2xl mx-auto">
          <Routes>
            <Route path="/join/:sqid" element={<InvitationPage />} />
            <Route path="/porchlight/:id" element={<PorchlightPage />} />
            <Route
              path="/"
              element={
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Welcome to Porchlighting Mobile</h2>
                    <p className="text-sm text-slate-600">
                      View and interact with real-time active porchlights and beacons in your neighborhood.
                    </p>
                    <div className="flex items-center gap-4 pt-2">
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

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="font-semibold text-slate-800 text-sm">Nearby Porchlight Location</h3>
                    <MapboxMap
                      location={{ latitude: 37.7749, longitude: -122.4194 }}
                      name="Sample Porchlight"
                      statusMessage="Open for neighborhood drinks"
                      isOn={true}
                      color="#F59E0B"
                      className="w-full h-64 rounded-lg overflow-hidden border border-slate-200 shadow-inner"
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
