export type EventKey =
  | "kirtan"
  | "bridalShower"
  | "mehendi"
  | "soiree"
  | "djNight"
  | "haldi"
  | "pheras";

export type RsvpAnswer = "yes" | "no";

export interface EventDef {
  key: EventKey;
  name: string;
  dateLabel: string;
  dateFull: string;
  time: string;
  timeShort?: string;
  venue: string;
  place: string;
  card: string;
  cards?: string[];
  thumb: string;
  accent: string;
  accentDark: string;
  dress: string;
}

export interface AttireColour {
  name: string;
  hex: string;
}

export interface AttireGuide {
  mood: string;
  avoid: string;
  wear: string;
  colours: AttireColour[];
}

// Row shape as stored in Supabase `guests` table
export interface GuestRow {
  id: number;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  relation: string | null;
  group_name: string | null;
  plus_one: string | null;
  kids: boolean;
  dietary: string | null;
  invited_kirtan: boolean;
  invited_bridal_shower: boolean;
  invited_mehendi: boolean;
  invited_soiree: boolean;
  invited_dj_night: boolean;
  invited_haldi: boolean;
  invited_pheras: boolean;
  dj_night_override: boolean | null; // null = use invited_dj_night, otherwise host override
  room_number: string | null;
  room_type: string | null;
  room_check_in: string | null;
  meal_preference: string | null;
  arrival: string | null;
  departure: string | null;
  transport: string | null;
  message: string | null;
  rsvp_submitted_at: string | null;
  created_at: string;
}

export interface RsvpResponseRow {
  guest_id: number;
  event_key: EventKey;
  answer: RsvpAnswer;
  updated_at: string;
}

// Guest-facing shape sent to the client (no PII beyond what the guest needs)
export interface GuestSession {
  id: number;
  name: string;
  code: string;
  city: string | null;
  group: string | null;
  invitedEvents: EventKey[];
  djNightOn: boolean;
  room: { number: string; type: string; checkIn: string } | null;
  roomsRevealed: boolean;
  rsvp: {
    events: Partial<Record<EventKey, RsvpAnswer>>;
    meal: string;
    arrival: string;
    departure: string;
    transport: string;
    phone: string;
    email: string;
    message: string;
    submittedAt: string | null;
  };
}

export interface AdminGuestRow {
  id: number;
  name: string;
  city: string | null;
  code: string;
  group: string | null;
  phone: string | null;
  email: string | null;
  invited: EventKey[];
  answered: number;
  totalInvited: number;
  room: { number: string; type: string } | null;
  djOn: boolean;
  meal: string | null;
  arrival: string | null;
  departure: string | null;
  transport: string | null;
  message: string | null;
  submittedAt: string | null;
}
