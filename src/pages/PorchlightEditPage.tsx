import { FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { LocationEditor } from '../components/LocationEditor';
import { Beacon, LocationCoordinates } from '../types';
import styles from './PorchlightCreatePage.module.css';

export const PorchlightEditPage: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [porchlight, setPorchlight] = useState<Beacon | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('default');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/porchlights/${id}/`)
      .then((response) => {
        const data = response.data as Beacon;
        setPorchlight(data);
        setName(data.name || '');
        setType(data.type || 'default');
        setDescription(data.description || '');
        setLocation(data.coordinates || (typeof data.location === 'object' ? data.location : null));
      })
      .catch((requestError: any) => setError(requestError?.response?.data?.detail || 'Unable to load porchlight.'));
  }, [id]);

  const submit = async (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    setError('');
    setSaving(true);
    try {
      const response = await apiClient.patch(`/porchlights/${id}/`, { name, type, description, location });
      navigate(`/porchlight/${response.data.sqid || id}`);
    } catch (requestError: any) {
      const data = requestError?.response?.data;
      setError(data?.name?.[0] || data?.detail || 'Unable to update porchlight.');
    } finally {
      setSaving(false);
    }
  };

  if (!porchlight && !error) return <p>Loading...</p>;

  return <div className={styles.page}><div className={styles.card}>
    <h1>Edit porchlight</h1>
    {error && <p className={styles.error}>{error}</p>}
    {porchlight && <form onSubmit={submit}>
      <label>Name<input required value={name} onInput={(event) => setName(event.currentTarget.value)} /></label>
      <label>Type<input value={type} onInput={(event) => setType(event.currentTarget.value)} /></label>
      <label>Description<textarea value={description} onInput={(event) => setDescription(event.currentTarget.value)} /></label>
      <LocationEditor location={location} name={name} onChange={setLocation} />
      <div className={styles.actions}><Link to={`/porchlight/${porchlight.sqid || id}`}>Cancel</Link><button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button></div>
    </form>}
  </div></div>;
};