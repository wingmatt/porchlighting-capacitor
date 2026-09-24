import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Check, HelpCircle } from 'lucide-preact';

interface Props {
  beacon: Beacon;
}

export const BeaconRsvpForm: FunctionComponent<Props> = ({ beacon }) => {
  const [hasRsvp, setHasRsvp] = useState<string | null>(beacon.has_rsvp || null);
  const [rsvpCount, setRsvpCount] = useState<number>(beacon.rsvp_count || 0);

  const submitRsvp = async (type: 'yes' | 'maybe' | null) => {
    const nextType = hasRsvp === type ? null : type;
    
    // Optimistic UI update
    setRsvpCount((prev) => (nextType === 'yes' ? prev + 1 : hasRsvp === 'yes' ? prev - 1 : prev));
    setHasRsvp(nextType);

    await apiClient.post('/rsvp/', {
      beacon_id: beacon.id,
      type: nextType,
    });
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => submitRsvp('yes')}
        className={`px-3 py-1 rounded-md flex items-center gap-1 ${
          hasRsvp === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Check className="w-4 h-4" /> I'm In ({rsvpCount})
      </button>
      <button
        onClick={() => submitRsvp('maybe')}
        className={`px-3 py-1 rounded-md flex items-center gap-1 ${
          hasRsvp === 'maybe' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <HelpCircle className="w-4 h-4" /> Maybe
      </button>
    </div>
  );
};
