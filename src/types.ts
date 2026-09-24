export interface Beacon {
  id: string | number;
  name?: string;
  type?: string;
  active_until?: string | null;
  location?: string;
  rsvp_count?: number;
  has_rsvp?: string | null;
  [key: string]: any;
}

export interface Invitation {
  id: string | number;
  role_granted?: string;
  beacon_id: string | number;
  [key: string]: any;
}
