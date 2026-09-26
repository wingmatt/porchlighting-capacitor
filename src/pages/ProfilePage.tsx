import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import { Beacon, User } from '../types';
import styles from './ProfilePage.module.css';

export const ProfilePage: FunctionComponent = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(user);
  const [porchlights, setPorchlights] = useState<Beacon[]>([]);
  useEffect(() => { if (user) { apiClient.get('/auth/me/').then((res) => setProfile(res.data)); apiClient.get('/porchlights/').then((res) => setPorchlights(res.data)); } }, [user]);
  if (loading) return <p>Loading profile...</p>;
  if (!user) { navigate('/login'); return null; }
  return <div className={styles.page}><div className={styles.card}><h1>{profile?.first_name || profile?.email}</h1><p>{profile?.email}</p><button onClick={() => logout().then(() => navigate('/'))}>Log out</button></div><div className={styles.card}><h2>Your porchlights</h2>{porchlights.length === 0 ? <p>No porchlights yet.</p> : porchlights.map((porchlight) => <Link className={styles.item} to={`/porchlight/${porchlight.id}`} key={porchlight.id}>{porchlight.name || 'Unnamed porchlight'}</Link>)}</div></div>;
};