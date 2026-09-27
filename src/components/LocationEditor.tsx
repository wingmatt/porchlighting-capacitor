import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { apiClient } from '../api/client';
import { LocationCoordinates } from '../types';
import { MapboxMap } from './MapboxMap';
import styles from './LocationEditor.module.css';

interface Props {
  location: LocationCoordinates | null;
  name?: string;
  onChange: (location: LocationCoordinates | null) => void;
}

export const LocationEditor: FunctionComponent<Props> = ({ location, name, onChange }) => {
  const [enabled, setEnabled] = useState(Boolean(location));
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '' });
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');

  const toggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) onChange(null);
  };

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
    <label className={styles.toggle}><input type="checkbox" checked={enabled} onChange={(event) => toggle(event.currentTarget.checked)} /> Add location</label>
    {enabled && <div className={styles.locationFields}>
      {error && <p>{error}</p>}
      <label>Street address<input value={address.street} onInput={(event) => setAddress({ ...address, street: event.currentTarget.value })} /></label>
      <div className={styles.addressRow}>
        <label>City<input value={address.city} onInput={(event) => setAddress({ ...address, city: event.currentTarget.value })} /></label>
        <label>State<input value={address.state} onInput={(event) => setAddress({ ...address, state: event.currentTarget.value })} /></label>
        <label>ZIP code<input value={address.postalCode} onInput={(event) => setAddress({ ...address, postalCode: event.currentTarget.value })} /></label>
      </div>
      <button type="button" onClick={useAddress} disabled={geocoding}>{geocoding ? 'Finding address...' : 'Use Address'}</button>
      <MapboxMap location={location} defaultLocation={[-98.5795, 39.8283]} name={name || 'Porchlight'} draggable onCoordinatesChange={onChange} />
      {location && <p className={styles.coordinates}>Coordinates: {location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}</p>}
    </div>}
  </>;
};