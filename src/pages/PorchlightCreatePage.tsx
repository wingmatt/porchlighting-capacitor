import { FunctionComponent } from 'preact';
import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import { MapboxMap } from '../components/MapboxMap';
import { LocationCoordinates } from '../types';
import styles from './PorchlightCreatePage.module.css';

export const PorchlightCreatePage: FunctionComponent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState('default');
  const [description, setDescription] = useState('');
  const [addLocation, setAddLocation] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', postalCode: '' });
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (!user) {
    navigate('/login');
    return null;
  }

  const submit = async (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await apiClient.post('/porchlights/', {
        name,
        type,
        description,
        location: addLocation ? location : null,
      });
      navigate(`/porchlight/${response.data.id}`);
    } catch (requestError: any) {
      const data = requestError?.response?.data;
      setError(data?.name?.[0] || data?.detail || 'Unable to create porchlight.');
    } finally {
      setSaving(false);
    }
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
      setLocation(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'Unable to find that address.');
    } finally {
      setGeocoding(false);
    }
  };

  return <div className={styles.page}><div className={styles.card}>
    <h1>New porchlight</h1>
    {error && <p className={styles.error}>{error}</p>}
    <form onSubmit={submit}>
      <label>Name<input required value={name} onInput={(event) => setName(event.currentTarget.value)} /></label>
      <label>Description<textarea value={description} onInput={(event) => setDescription(event.currentTarget.value)} /></label>
      <label className={styles.toggle}><input type="checkbox" checked={addLocation} onChange={(event) => {
        setAddLocation(event.currentTarget.checked);
        if (!event.currentTarget.checked) setLocation(null);
      }} /> Add location</label>
      {addLocation && <div className={styles.locationFields}>
        <label>Street address<input value={address.street} onInput={(event) => setAddress({ ...address, street: event.currentTarget.value })} /></label>
        <div className={styles.addressRow}>
          <label>City<input value={address.city} onInput={(event) => setAddress({ ...address, city: event.currentTarget.value })} /></label>
          <label>State<input value={address.state} onInput={(event) => setAddress({ ...address, state: event.currentTarget.value })} /></label>
          <label>ZIP code<input value={address.postalCode} onInput={(event) => setAddress({ ...address, postalCode: event.currentTarget.value })} /></label>
        </div>
        <button type="button" onClick={useAddress} disabled={geocoding}>{geocoding ? 'Finding address...' : 'Use Address'}</button>
        <MapboxMap location={location} defaultLocation={[-98.5795, 39.8283]} name={name || 'Porchlight'} draggable onCoordinatesChange={setLocation} />
        {location && <p className={styles.coordinates}>Coordinates: {location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}</p>}
      </div>}
      <div className={styles.actions}><Link to="/profile">Cancel</Link><button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create porchlight'}</button></div>
    </form>
  </div></div>;
};