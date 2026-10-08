import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { apiClient } from '../api/client';
import { GeoJSONPoint } from '../types';
import { MapboxMap } from './MapboxMap';
import { LocationToggle } from './LocationToggle';
import styles from './LocationEditor.module.css';

interface Props {
  location: GeoJSONPoint | null;
  name?: string;
  broadcastLocation: boolean;
  onChange: (location: GeoJSONPoint | null) => void;
  onBroadcastChange: (broadcast: boolean) => void;
}

export const LocationEditor: FunctionComponent<Props> = ({ location, name, broadcastLocation, onChange, onBroadcastChange }) => {
  const [enabled, setEnabled] = useState(Boolean(location));
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '' });
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');


  const useAddress = async () => {
    const formattedAddress = [address.street, address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(', ');
    if (!formattedAddress) {
      setError('Enter an address before using it.');
      return;
    }
    setError('');
    setGeocoding(true);
    try {
      const response = await apiClient.post('/porchlights/geocode/', { address: formattedAddress });
      onChange(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'Unable to find that address.');
    } finally {
      setGeocoding(false);
    }
  };

  return <>
    {!enabled && <button type="button" className={styles.addLocation} onClick={() => setEnabled(true)}>Add location</button>}
    {enabled && <div className={styles.locationFields}>
      <div className={styles.locationControls}>
        <LocationToggle label="Broadcast location" checked={broadcastLocation} onChange={onBroadcastChange} />
        {location && <button type="button" className={styles.removeLocation} onClick={() => {
          setEnabled(false);
          onChange(null);
          onBroadcastChange(false);
        }}>Remove location</button>}
      </div>
      {!location && <>
        {error && <p>{error}</p>}
        <label>Street address<input value={address.street} onInput={(event) => setAddress({ ...address, street: event.currentTarget.value })} /></label>
        <div className={styles.addressRow}>
          <label>City<input value={address.city} onInput={(event) => setAddress({ ...address, city: event.currentTarget.value })} /></label>
          <label>State<input value={address.state} onInput={(event) => setAddress({ ...address, state: event.currentTarget.value })} /></label>
          <label>ZIP code<input value={address.postalCode} onInput={(event) => setAddress({ ...address, postalCode: event.currentTarget.value })} /></label>
        </div>
        <button type="button" onClick={useAddress} disabled={geocoding}>{geocoding ? 'Finding address...' : 'Use Address'}</button>
      </>
      }
      {location && <MapboxMap location={location} defaultLocation={[-98.5795, 39.8283]} name={name || 'Porchlight'} draggable onCoordinatesChange={onChange} />}
      {location && <p className={styles.coordinates}>Coordinates: {location.coordinates[1].toFixed(5)}, {location.coordinates[0].toFixed(5)}</p>}
    </div>}
  </>;
};