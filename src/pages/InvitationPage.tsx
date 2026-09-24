import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Preferences } from '@capacitor/preferences';
import { Beacon, Invitation } from '../types';

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

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">
        {data.accepted ? `You're part of ${data.beacon.name}` : `Welcome to ${data.beacon.name}`}
      </h2>

      {!data.accepted && (
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Your Name (Guest)"
            value={guestName}
            onInput={(e) => setGuestName((e.target as HTMLInputElement).value)}
            className="w-full border p-2 rounded"
          />
          <button
            onClick={() => handleJoin(true)}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          >
            Join Beacon
          </button>
        </div>
      )}
    </div>
  );
};
