import { FunctionComponent } from 'preact';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InvitationPage } from './pages/InvitationPage';
import { BeaconIcon } from './components/BeaconIcon';
import { BeaconRsvpForm } from './components/BeaconRsvpForm';

export const App: FunctionComponent = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="p-4 bg-white border-b border-slate-200">
          <h1 className="text-xl font-bold">Porchlighting</h1>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/join/:sqid" element={<InvitationPage />} />
            <Route
              path="/"
              element={
                <div className="space-y-4">
                  <p>Welcome to Porchlighting Mobile</p>
                  <div className="flex items-center gap-4">
                    <BeaconIcon beacon={{ id: 1, name: 'Sample Beacon' }} editable />
                    <BeaconRsvpForm beacon={{ id: 1, name: 'Sample Beacon' }} />
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
