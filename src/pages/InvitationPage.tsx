import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Preferences } from '@capacitor/preferences';
import { Beacon, Invitation } from '../types';
import { MapboxMap } from '../components/MapboxMap';

export const InvitationPage: FunctionComponent = () => {
  const { sqid } = useParams<{ sqid: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ invitation: Invitation; beacon: Beacon; accepted: boolean } | null>(null);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    if (sqid) {
      apiClient.get(`/join/${sqid}/`).then((res) => setData(res.data));
    }
  }, [sqid]);

  const handleJoin = async (guestSignup = false) => {
    if (!data) return;

    const payload: Record<string, any> = {
      role: data.invitation.role_granted,
      from_invitation: data.invitation.id,
      beacon_id: data.invitation.beacon_id,
    };

    if (guestSignup) {
      const guestId = crypto.randomUUID();
      await Preferences.set({ key: 'guestToken', value: guestId });
      await Preferences.set({ key: 'guestName', value: guestName });
      payload.guest_id = guestId;
      payload.guest_name = guestName;
    }

    await apiClient.post(`/add/${sqid}/`, payload);
    navigate(`/porchlight/${data.beacon.id}`);
  };

  if (!data) return <div className="p-4 text-slate-500">Loading invitation...</div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          {data.accepted ? `You're part of ${data.beacon.name}` : `Welcome to ${data.beacon.name}`}
        </h2>
        {data.beacon.description && (
          <p className="text-sm text-slate-600 mt-2">{data.beacon.description}</p>
        )}

        {data.beacon.location && (
          <div className="mt-4">
            <MapboxMap
              location={data.beacon.location || data.beacon.coordinates}
              name={data.beacon.name}
              isOn={data.beacon.is_on}
              color={data.beacon.color}
              className="w-full h-48 rounded-lg overflow-hidden border border-slate-200"
            />
          </div>
        )}

        {!data.accepted && (
          <div className="mt-6 space-y-4 text-left">
            <input
              type="text"
              placeholder="Your Name (Guest)"
              value={guestName}
              onInput={(e) => setGuestName((e.target as HTMLInputElement).value)}
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleJoin(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-colors"
            >
              Join Beacon
            </button>
          </div>
        )}

        {data.accepted && (
          <button
            onClick={() => navigate(`/porchlight/${data.beacon.id}`)}
            className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold"
          >
            View Porchlight
          </button>
        )}
      </div>
    </div>
  );
};
