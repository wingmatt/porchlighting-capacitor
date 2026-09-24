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
  role_granted?: string;
  beacon_id: string | number;
  porchlight_name?: string;
  [key: string]: any;
}
