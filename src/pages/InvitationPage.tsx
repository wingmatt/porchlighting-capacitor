import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { apiClient, getCredentials, setGuestCredentials } from '../api/client';
import { Beacon, Invitation, InvitationParticipant } from '../types';
import { MapboxMap } from '../components/MapboxMap';
import { useAuth } from '../auth';
import { signInToFirebase } from '../firebase';
import styles from './InvitationPage.module.css';

export const InvitationPage: FunctionComponent = () => {
  const { sqid } = useParams<{ sqid: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<{
    invitation: Invitation;
    beacon: Beacon;
    has_permission: boolean;
    can_manage: boolean;
    can_share: boolean;
  } | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<InvitationParticipant[]>([]);
  const [participantError, setParticipantError] = useState('');
  const [participantAction, setParticipantAction] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    const credentials = getCredentials();
    setGuestToken(credentials.guestToken || '');
    setGuestName(credentials.guestName || '');
    if (sqid && !authLoading) {
      apiClient.get(`/invitations/validate/${sqid}/`)
        .then((res) => setData({ ...res.data, invitation: res.data, beacon: res.data.porchlight }))
        .catch(() => setError('This invitation could not be found.'));
    }
  }, [sqid, authLoading]);

  const invitationSqid = data?.invitation.sqid || sqid;
  const invitationLink = invitationSqid ? `${window.location.origin}/join/${invitationSqid}` : '';

  useEffect(() => {
    let cancelled = false;
    if (!invitationLink) {
      setQrCode('');
      return () => { cancelled = true; };
    }
    QRCode.toDataURL(invitationLink, { width: 220, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrCode(url);
      })
      .catch(() => {
        if (!cancelled) setQrCode('');
      });
    return () => { cancelled = true; };
  }, [invitationLink]);

  const loadParticipants = async () => {
    if (!sqid || !data?.can_manage) return;
    setParticipantError('');
    try {
      const response = await apiClient.get(`/invitations/manage/${sqid}/`);
      setParticipants(response.data.participants || []);
    } catch (requestError: any) {
      setParticipantError(requestError?.response?.data?.detail || 'Unable to load accepted participants.');
    }
  };

  const toggleParticipants = async () => {
    const nextValue = !showParticipants;
    setShowParticipants(nextValue);
    if (nextValue) await loadParticipants();
  };

  const revokeParticipant = async (participant: InvitationParticipant) => {
    if (!sqid || !window.confirm(`Revoke ${participant.name || participant.email || 'this participant'}'s permission?`)) return;
    setParticipantAction(true);
    setParticipantError('');
    try {
      await apiClient.delete(`/invitations/manage/${sqid}/`, { data: { permission_id: participant.id } });
      setParticipants((current) => current.filter((item) => item.id !== participant.id));
    } catch (requestError: any) {
      setParticipantError(requestError?.response?.data?.detail || 'Unable to revoke this permission.');
    } finally {
      setParticipantAction(false);
    }
  };

  const revokeAllParticipants = async () => {
    if (!sqid || !window.confirm('Revoke everyone\'s permission and refresh this invitation code?')) return;
    setParticipantAction(true);
    setParticipantError('');
    try {
      const response = await apiClient.post(`/invitations/manage/${sqid}/revoke-all/`);
      setParticipants([]);
      navigate(`/join/${response.data.sqid}`);
    } catch (requestError: any) {
      setParticipantError(requestError?.response?.data?.detail || 'Unable to revoke all permissions.');
    } finally {
      setParticipantAction(false);
    }
  };

  const copyInvitationLink = async () => {
    if (!invitationLink) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopyStatus('Invitation link copied.');
    } catch {
      setCopyStatus('Unable to copy the invitation link.');
    }
  };

  const handleJoin = async (guestSignup = false) => {
    if (!data) return;
    setError('');
    setSaving(true);

    try {
      if (guestSignup) {
        const response = await apiClient.post('/guest/access/', {
          invitation_code: sqid,
          guest_name: guestName,
        });
        await setGuestCredentials(response.data.guest_token, response.data.guest_name);
        await signInToFirebase(response.data.firebase_token);
      } else {
        await apiClient.post('/invitations/accept/', { code: sqid });
      }
      navigate(`/porchlight/${data.beacon.sqid}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || requestError?.response?.data?.error || 'Unable to accept this invitation.');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className={styles.loading}>Loading invitation...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {data.has_permission ? `You're part of ${data.beacon.name}` : `Invitation to ${data.beacon.name}`}
        </h2>
        {!user && guestToken && guestName && <p className={styles.greeting}>Welcome back, {guestName}!</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {data.beacon.description && (
          <p className={styles.description}>{data.beacon.description}</p>
        )}

        {data.beacon.location && (
          <div className={styles.mapContainer}>
            <MapboxMap
              location={data.beacon.location || data.beacon.coordinates}
              name={data.beacon.name}
              isOn={data.beacon.is_on}
              color={data.beacon.color}
              className={styles.map}
            />
          </div>
        )}

        {!authLoading && !data.has_permission && data.invitation.is_valid && !data.invitation.is_guest && user && (
          <form className={styles.joinForm} onSubmit={(event) => { event.preventDefault(); void handleJoin(); }}>
            <button
              type="submit"
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={saving}
            >
              {saving ? 'Accepting...' : `Accept invitation as ${user.email}`}
            </button>
          </form>
        )}

        {!authLoading && !data.has_permission && data.invitation.is_valid && !user && (
          <form className={styles.joinForm} onSubmit={(event) => { event.preventDefault(); void handleJoin(true); }}>
            {!guestToken && <label>Name (required)<input type="text" placeholder="Your Name (Guest)" required value={guestName}
              onInput={(e) => setGuestName((e.target as HTMLInputElement).value)} className={styles.input} /></label>}
            <button type="submit" className={`${styles.button} ${styles.primaryButton}`} disabled={saving}>
              {saving ? 'Joining...' : guestToken ? `Join as ${guestName}` : 'Join as a Guest'}
            </button>
          </form>
        )}

        {!authLoading && !data.has_permission && data.invitation.is_valid && data.invitation.is_guest && user && (
          <form className={styles.joinForm} onSubmit={(event) => { event.preventDefault(); void handleJoin(true); }}>
            <label>Name (required)<input type="text" placeholder="Your Name (Guest)" required value={guestName}
              onInput={(e) => setGuestName((e.target as HTMLInputElement).value)} className={styles.input} /></label>
            <button type="submit" className={`${styles.button} ${styles.primaryButton}`} disabled={saving}>
              {saving ? 'Joining...' : 'Join Beacon'}
            </button>
          </form>
        )}

        {data.has_permission && (
          <button
            onClick={() => navigate(`/porchlight/${data.beacon.sqid}`)}
            className={`${styles.button} ${styles.darkButton}`}
          >
            View Porchlight
          </button>
        )}

        {data.can_share && (
          <button onClick={copyInvitationLink} className={`${styles.button} ${styles.secondaryButton}`}>
            Copy invitation link
          </button>
        )}
        {copyStatus && <p className={styles.copyStatus}>{copyStatus}</p>}

        {data.can_manage && (
          <div className={styles.managementSection}>
            <button onClick={toggleParticipants} className={`${styles.button} ${styles.secondaryButton}`} disabled={participantAction}>
              {showParticipants ? 'Hide accepted participants' : 'Show accepted participants'}
            </button>
            {showParticipants && (
              <div className={styles.participantList}>
                <p className={styles.code}>Current Invitation Code: {invitationSqid}</p>
                {qrCode && (
                  <div className={styles.qrCode}>
                    <img src={qrCode} alt="QR code for the invitation link" />
                    <span>Scan to open the invitation</span>
                  </div>
                )}
                {participantError && <p className={styles.error}>{participantError}</p>}
                {participants.length === 0 ? (
                  <p className={styles.description}>No users or guests have accepted this invitation.</p>
                ) : participants.map((participant) => (
                  <div key={participant.id} className={styles.participantItem}>
                    <span>{participant.name || participant.email || 'Guest'}{participant.email ? ` · ${participant.email}` : ''}</span>
                    <button onClick={() => revokeParticipant(participant)} className={`${styles.button} ${styles.revokeButton}`} disabled={participantAction}>
                      Revoke
                    </button>
                  </div>
                ))}
                <button onClick={revokeAllParticipants} className={`${styles.button} ${styles.dangerButton}`} disabled={participantAction || participants.length === 0}>
                  Revoke everyone and refresh code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
