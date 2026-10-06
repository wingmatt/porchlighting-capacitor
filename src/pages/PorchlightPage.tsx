import { FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Beacon, Invitation, PorchlightAccess } from '../types';
import { useFirebaseBeacon } from '../hooks/useFirebaseBeacon';
import { BeaconIcon } from '../components/BeaconIcon';
import { Rsvp } from '../components/Rsvp';
import { MapboxMap } from '../components/MapboxMap';
import styles from './PorchlightPage.module.css';

export const PorchlightPage: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const [initialBeacon, setInitialBeacon] = useState<Beacon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient
        .get(`/porchlights/${id}/`)
        .then((res) => {
          setInitialBeacon(res.data);
          setError(null);
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || 'Failed to load porchlight');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading porchlight details...</div>;
  }

  if (error || !initialBeacon) {
    return (
      <div className={styles.error}>
        {error || 'Porchlight not found'}
      </div>
    );
  }

  return <PorchlightLiveView initialBeacon={initialBeacon} />;
};

const PorchlightLiveView: FunctionComponent<{ initialBeacon: Beacon }> = ({ initialBeacon }) => {
  // Synchronized via Firebase Firestore broadcast from Postgres database
  const [beacon, setBeacon] = useFirebaseBeacon(initialBeacon);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationRole, setInvitationRole] = useState('view');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [isGuestInvitation, setIsGuestInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState('');
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [access, setAccess] = useState<PorchlightAccess[]>([]);
  const [accessError, setAccessError] = useState('');
  const [editingAccess, setEditingAccess] = useState<PorchlightAccess | null>(null);
  const [accessRole, setAccessRole] = useState('view');
  const [accessIsClose, setAccessIsClose] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [savingBrightness, setSavingBrightness] = useState(false);
  const canManageInvitations = beacon.is_owner || ['OWNER', 'EDIT'].includes(beacon.user_role || '');
  const canEdit = beacon.is_owner || ['OWNER', 'EDIT'].includes(beacon.user_role || '');
  const hasClosePermission = access.length > 0
    ? access.some((entry) => entry.is_close)
    : beacon.has_close_permission === true;
  const activeInvitations = invitations.filter((invitation) => invitation.is_valid);
  const expiredInvitations = invitations.filter((invitation) => invitation.is_expired);

  const updateBrightness = async (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    if (!canEdit || !beacon.sqid) return;
    setSavingBrightness(true);
    try {
      const response = await apiClient.post(`/porchlights/${beacon.sqid}/control/`, {
        brightness: Number(event.currentTarget.value),
      });
      if (response.data?.porchlight) {
        setBeacon((current) => ({ ...current, ...response.data.porchlight }));
      }
    } finally {
      setSavingBrightness(false);
    }
  };

  const renderInvitation = (invitation: Invitation) => (
    <li key={invitation.id} className={styles.invitationItem}>
      <div>
        <span>{invitation.role_granted || invitation.role || 'view'}{invitation.invited_email ? ` · ${invitation.invited_email}` : ''}</span>
        <span className={styles.acceptedCount}>
          {invitation.accepted_count ?? 0} accepted ({invitation.accepted_users_count ?? 0} users, {invitation.accepted_guests_count ?? 0} guests)
        </span>
      </div>
      <a href={`/join/${invitation.sqid || invitation.code}`}>/join/{invitation.sqid || invitation.code}</a>
    </li>
  );

  useEffect(() => {
    if (!canManageInvitations || !beacon.id) return;
    apiClient.get('/invitations/', { params: { porchlight: beacon.id } })
      .then((response) => setInvitations(response.data))
      .catch(() => setInvitationError('Unable to load invitations.'));
  }, [beacon.id, canManageInvitations]);

  useEffect(() => {
    if (!canManageInvitations || !beacon.sqid) return;
    apiClient.get(`/porchlights/${beacon.sqid}/access/`)
      .then((response) => {
        const nextAccess = response.data.access || [];
        setAccess(nextAccess);
        setBeacon((current) => ({ ...current, has_close_permission: nextAccess.some((entry: PorchlightAccess) => entry.is_close) }));
      })
      .catch(() => setAccessError('Unable to load porchlight access.'));
  }, [beacon.sqid, canManageInvitations]);

  const createInvitation = async (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInvitationError('');
    setCreatingInvitation(true);
    const role = ({ view: 'GUEST', edit: 'MEMBER', share: 'ADMIN' } as Record<string, string>)[invitationRole] || 'GUEST';
    try {
      const response = await apiClient.post('/invitations/', {
        porchlight: beacon.id,
        role,
        role_granted: invitationRole,
        is_guest: isGuestInvitation,
        invited_email: invitedEmail || null,
        max_uses: 0,
      });
      setInvitations((current) => [response.data, ...current]);
      setInvitedEmail('');
    } catch (requestError: any) {
      const data = requestError?.response?.data;
      setInvitationError(data?.porchlight?.[0] || data?.detail || 'Unable to create invitation.');
    } finally {
      setCreatingInvitation(false);
    }
  };

  const openAccessDialog = (entry: PorchlightAccess) => {
    setEditingAccess(entry);
    setAccessRole(['view', 'edit', 'share'].includes(entry.role) ? entry.role : 'view');
    setAccessIsClose(entry.is_close);
  };

  const saveAccess = async (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!beacon.sqid || !editingAccess) return;
    setSavingAccess(true);
    setAccessError('');
    try {
      const response = await apiClient.patch(`/porchlights/${beacon.sqid}/access/${editingAccess.id}/`, { role: accessRole, is_close: accessIsClose });
      setAccess((current) => {
        const nextAccess = current.map((entry) => entry.id === editingAccess.id ? response.data : entry);
        setBeacon((currentBeacon) => ({ ...currentBeacon, has_close_permission: nextAccess.some((entry) => entry.is_close) }));
        return nextAccess;
      });
      setEditingAccess(null);
    } catch (requestError: any) {
      setAccessError(requestError?.response?.data?.detail || 'Unable to update this permission.');
    } finally {
      setSavingAccess(false);
    }
  };

  const removeAccess = async () => {
    if (!beacon.sqid || !editingAccess || !window.confirm(`Remove ${editingAccess.name || editingAccess.email || 'this access'}?`)) return;
    setSavingAccess(true);
    setAccessError('');
    try {
      await apiClient.delete(`/porchlights/${beacon.sqid}/access/${editingAccess.id}/`);
      setAccess((current) => {
        const nextAccess = current.filter((entry) => entry.id !== editingAccess.id);
        setBeacon((currentBeacon) => ({ ...currentBeacon, has_close_permission: nextAccess.some((entry) => entry.is_close) }));
        return nextAccess;
      });
      setEditingAccess(null);
    } catch (requestError: any) {
      setAccessError(requestError?.response?.data?.detail || 'Unable to remove this permission.');
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div>
          <h2 className={styles.title}>{beacon.name || 'Porchlight'}</h2>
          {beacon.status_message && (
            <p className={styles.statusMessage}>{beacon.status_message}</p>
          )}
          {beacon.description && (
            <p className={styles.description}>{beacon.description}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          {canEdit && <Link to={`/porchlight/${beacon.sqid}/edit`} className={styles.editButton}>Edit</Link>}
          {canEdit && hasClosePermission && (
            <div className={styles.brightnessControl} aria-label="Brightness control">
              <span className={styles.brightnessLabel}>Bright</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beacon.brightness ?? 100}
                onInput={updateBrightness}
                disabled={savingBrightness}
                aria-label="Brightness"
                aria-valuetext={`${beacon.brightness ?? 100}%`}
                className={styles.brightnessSlider}
              />
              <span className={styles.brightnessLabel}>Dim</span>
            </div>
          )}
          <BeaconIcon
            beacon={beacon}
            editable={beacon.is_owner || beacon.user_role === 'OWNER' || beacon.user_role === 'ADMIN'}
            onUpdate={(updated) => setBeacon((prev) => ({ ...prev, ...updated }))}
          />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Location Map</h3>
        <MapboxMap
          location={beacon.location || beacon.coordinates}
          name={beacon.name}
          statusMessage={beacon.status_message}
          isOn={beacon.is_on}
          color={beacon.color || '#F59E0B'}
          className={styles.map}
        />
      </div>

      <div className={styles.rsvpCard}>
        <h3 className={styles.sectionTitle}>RSVP Status</h3>
        <Rsvp beacon={beacon} onUpdate={(updated) => setBeacon((prev) => ({ ...prev, ...updated }))} />
      </div>

      {canManageInvitations && (
        <div className={styles.invitationCard}>
          <h3 className={styles.sectionTitle}>Invitations</h3>
          {invitationError && <p className={styles.invitationError}>{invitationError}</p>}
          {activeInvitations.length > 0 ? (
            <ul className={styles.invitationList}>
              {activeInvitations.map(renderInvitation)}
            </ul>
          ) : <p className={styles.emptyInvitations}>No active invitations.</p>}
          {expiredInvitations.length > 0 && (
            <>
              <h4 className={styles.expiredTitle}>Expired Invitations</h4>
              <ul className={styles.invitationList}>{expiredInvitations.map(renderInvitation)}</ul>
            </>
          )}
          <form className={styles.invitationForm} onSubmit={createInvitation}>
            <label>Permission<select value={invitationRole} onChange={(event) => setInvitationRole(event.currentTarget.value)}>
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="share">Share</option>
            </select></label>
            <label>Email (optional)<input type="email" value={invitedEmail} onInput={(event) => setInvitedEmail(event.currentTarget.value)} /></label>
            <label className={styles.guestToggle}><input type="checkbox" checked={isGuestInvitation} onChange={(event) => setIsGuestInvitation(event.currentTarget.checked)} /> Guest invitation</label>
            <button type="submit" disabled={creatingInvitation}>{creatingInvitation ? 'Creating...' : 'Create invitation'}</button>
          </form>
          <div className={styles.accessSection}>
            <h4 className={styles.accessTitle}>People with access</h4>
            {accessError && <p className={styles.invitationError}>{accessError}</p>}
            {access.length > 0 ? (
              <ul className={styles.invitationList}>
                {access.map((entry) => (
                  <li key={`${entry.type}-${entry.id}`} className={styles.accessItem}>
                    <div>
                      <strong>{entry.name || entry.email || 'Guest'}</strong>
                      {entry.email && <span className={styles.acceptedCount}>{entry.email}</span>}
                      {entry.guest_name && <span className={styles.acceptedCount}>Guest name: {entry.guest_name}</span>}
                      <span className={styles.acceptedCount}>Permission: {entry.role}</span>
                      <span className={styles.acceptedCount}>Created: {new Date(entry.created_at).toLocaleString()}</span>
                      <span className={styles.acceptedCount}>From invitation: {entry.from_invitation || 'No'}</span>
                    </div>
                    {entry.editable && <button type="button" onClick={() => openAccessDialog(entry)}>Edit access</button>}
                  </li>
                ))}
              </ul>
            ) : <p className={styles.emptyInvitations}>No other users or guests have access.</p>}
          </div>
          <dialog open={Boolean(editingAccess)} className={styles.accessDialog}>
            {editingAccess && (
              <form onSubmit={saveAccess} className={styles.invitationForm}>
                <h4 className={styles.accessTitle}>Edit access</h4>
                <p className={styles.acceptedCount}>{editingAccess.name || editingAccess.email || 'Guest'}</p>
                <label>Permission<select value={accessRole} onChange={(event) => setAccessRole(event.currentTarget.value)}>
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                  <option value="share">Share</option>
                </select></label>
                <label className={styles.guestToggle}>
                  <input type="checkbox" checked={accessIsClose} onChange={(event) => setAccessIsClose(event.currentTarget.checked)} />
                  Close to porchlight
                </label>
                <div className={styles.dialogActions}>
                  <button type="button" onClick={() => setEditingAccess(null)} disabled={savingAccess}>Cancel</button>
                  <button type="button" onClick={removeAccess} disabled={savingAccess} className={styles.removeButton}>Remove access</button>
                  <button type="submit" disabled={savingAccess}>{savingAccess ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            )}
          </dialog>
        </div>
      )}
    </div>
  );
};
