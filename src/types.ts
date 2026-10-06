export interface LocationCoordinates {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  lon?: number;
  coordinates?: [number, number];
  [key: string]: any;
}

export interface Beacon {
  id: string | number;
  sqid?: string;
  name?: string;
  type?: string;
  active_duration?: number;
  active_until?: string | null;
  is_active?: boolean;
  location?: string | LocationCoordinates | null;
  coordinates?: LocationCoordinates | null;
  description?: string;
  is_on?: boolean;
  brightness?: number;
  has_close_permission?: boolean;
  color?: string;
  status_message?: string;
  updated_at?: string;
  rsvp_count?: number;
  has_rsvp?: boolean;
  rsvp_id?: string | null;
  [key: string]: any;
}

export interface Invitation {
  id: string | number;
  code?: string;
  sqid?: string;
  role?: string;
  role_granted?: string;
  is_guest?: boolean;
  invited_email?: string | null;
  expires_at?: string | null;
  max_uses?: number;
  uses_count?: number;
  is_valid?: boolean;
  is_expired?: boolean;
  accepted_users_count?: number;
  accepted_guests_count?: number;
  accepted_count?: number;
  has_permission?: boolean;
  beacon_id?: string | number;
  porchlight_name?: string;
  [key: string]: any;
}

export interface InvitationParticipant {
  id: string;
  type: 'user' | 'guest';
  email?: string;
  name?: string;
  role?: string;
}

export interface PorchlightAccess {
  id: string;
  type: 'user' | 'guest';
  email?: string;
  name?: string;
  role: string;
  is_close: boolean;
  source?: string;
  created_at: string;
  from_invitation?: string | null;
  guest_name?: string | null;
  editable?: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}
