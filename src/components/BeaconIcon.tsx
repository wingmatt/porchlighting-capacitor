import { FunctionComponent, JSX } from 'preact';
import { Beacon } from '../types';
import { apiClient } from '../api/client';
import { Lightbulb } from 'lucide-preact';

interface Props {
  beacon: Beacon;
  editable?: boolean;
  onUpdate?: (updated: Beacon) => void;
}

export const BeaconIcon: FunctionComponent<Props> = ({ beacon, editable, onUpdate }) => {
  const isActive = beacon.active_until && new Date(beacon.active_until) > new Date();

  const handleToggle = async (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (!editable) return;
    e.preventDefault();
    const response = await apiClient.patch(`/porchlight/${beacon.id}/update/`, {
      active: !isActive,
    });
    if (onUpdate && response.data) {
      onUpdate(response.data);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!editable}
      className={`p-3 rounded-full transition-colors ${
        isActive ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-300/50' : 'bg-slate-200 text-slate-400'
      }`}
      aria-label={isActive ? 'Turn off beacon' : 'Turn on beacon'}
    >
      <Lightbulb className="w-8 h-8" />
    </button>
  );
};
