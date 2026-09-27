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
  color?: string;
  status_message?: string;
  rsvp_count?: number;
  has_rsvp?: string | null;
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
  has_permission?: boolean;
  beacon_id?: string | number;
  porchlight_name?: string;
  [key: string]: any;
}

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}
