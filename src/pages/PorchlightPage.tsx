import { FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Beacon, Invitation } from '../types';
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
  const canManageInvitations = beacon.is_owner || ['OWNER', 'EDIT'].includes(beacon.user_role || '');
  const canEdit = beacon.is_owner || ['OWNER', 'EDIT'].includes(beacon.user_role || '');
  const activeInvitations = invitations.filter((invitation) => invitation.is_valid);
  const expiredInvitations = invitations.filter((invitation) => invitation.is_expired);

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
        <Rsvp beacon={beacon} />
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
        </div>
      )}
    </div>
  );
};
