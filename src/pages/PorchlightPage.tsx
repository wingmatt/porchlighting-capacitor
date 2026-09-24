import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Beacon } from '../types';
import { useFirebaseBeacon } from '../hooks/useFirebaseBeacon';
import { BeaconIcon } from '../components/BeaconIcon';
import { BeaconRsvpForm } from '../components/BeaconRsvpForm';
import { MapboxMap } from '../components/MapboxMap';

export const PorchlightPage: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const [initialBeacon, setInitialBeacon] = useState<Beacon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient
        .get(`/porchlight/${id}/`)
        .then((res) => {
          setInitialBeacon(res.data);
          setError(null);
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || 'Failed to load porchlight');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div className="p-4 text-slate-500">Loading porchlight details...</div>;
  }

  if (error || !initialBeacon) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error || 'Porchlight not found'}
      </div>
    );
  }

  return <PorchlightLiveView initialBeacon={initialBeacon} />;
};

const PorchlightLiveView: FunctionComponent<{ initialBeacon: Beacon }> = ({ initialBeacon }) => {
  // Synchronized via Firebase Firestore broadcast from Postgres database
  const [beacon, setBeacon] = useFirebaseBeacon(initialBeacon);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{beacon.name || 'Porchlight'}</h2>
          {beacon.status_message && (
            <p className="text-sm text-slate-600 mt-1">{beacon.status_message}</p>
          )}
          {beacon.description && (
            <p className="text-xs text-slate-400 mt-0.5">{beacon.description}</p>
          )}
        </div>
        <BeaconIcon
          beacon={beacon}
          editable={beacon.is_owner || beacon.user_role === 'OWNER' || beacon.user_role === 'ADMIN'}
          onUpdate={(updated) => setBeacon((prev) => ({ ...prev, ...updated }))}
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm">Location Map</h3>
        <MapboxMap
          location={beacon.location || beacon.coordinates}
          name={beacon.name}
          statusMessage={beacon.status_message}
          isOn={beacon.is_on}
          color={beacon.color || '#F59E0B'}
          className="w-full h-72 rounded-lg overflow-hidden shadow-inner border border-slate-200"
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 text-sm mb-2">RSVP Status</h3>
        <BeaconRsvpForm beacon={beacon} />
      </div>
    </div>
  );
};
