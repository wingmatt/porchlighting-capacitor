import { FunctionComponent } from 'preact';
import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import styles from './PorchlightCreatePage.module.css';

export const PorchlightCreatePage: FunctionComponent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState('default');
  const [description, setDescription] = useState('');
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
      const response = await apiClient.post('/porchlights/', { name, type, description });
      navigate(`/porchlight/${response.data.id}`);
    } catch (requestError: any) {
      const data = requestError?.response?.data;
      setError(data?.name?.[0] || data?.detail || 'Unable to create porchlight.');
    } finally {
      setSaving(false);
    }
  };

  return <div className={styles.page}><div className={styles.card}>
    <h1>New porchlight</h1>
    {error && <p className={styles.error}>{error}</p>}
    <form onSubmit={submit}>
      <label>Name<input required value={name} onInput={(event) => setName(event.currentTarget.value)} /></label>
      <label>Type<input value={type} onInput={(event) => setType(event.currentTarget.value)} /></label>
      <label>Description<textarea value={description} onInput={(event) => setDescription(event.currentTarget.value)} /></label>
      <div className={styles.actions}><Link to="/profile">Cancel</Link><button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create porchlight'}</button></div>
    </form>
  </div></div>;
};