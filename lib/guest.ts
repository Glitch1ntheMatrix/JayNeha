import "server-only";
import { supabaseAdmin } from "./supabase";
import { EventKey, GuestRow, GuestSession, RsvpAnswer, RsvpResponseRow } from "./types";
import { INVITED_COLUMN_BY_KEY } from "./events";

const EVENT_KEYS: EventKey[] = [
  "kirtan",
  "bridalShower",
  "mehendi",
  "soiree",
  "djNight",
  "haldi",
  "pheras",
];

export function djOn(guest: GuestRow): boolean {
  return guest.dj_night_override === null
    ? guest.invited_dj_night
    : guest.dj_night_override;
}

export function invitedKeys(guest: GuestRow): EventKey[] {
  const on = djOn(guest);
  return EVENT_KEYS.filter((key) => {
    if (key === "djNight") return on;
    return Boolean((guest as unknown as Record<string, boolean>)[INVITED_COLUMN_BY_KEY[key]]);
  });
}

export async function fetchGuestById(id: number): Promise<GuestRow | null> {
  const { data, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as GuestRow;
}

export async function fetchRsvpResponses(guestId: number): Promise<RsvpResponseRow[]> {
  const { data, error } = await supabaseAdmin
    .from("rsvp_responses")
    .select("*")
    .eq("guest_id", guestId);
  if (error || !data) return [];
  return data as RsvpResponseRow[];
}

export async function buildGuestSession(guest: GuestRow): Promise<GuestSession> {
  const responses = await fetchRsvpResponses(guest.id);
  const events: Partial<Record<EventKey, RsvpAnswer>> = {};
  responses.forEach((r) => {
    events[r.event_key] = r.answer;
  });

  return {
    id: guest.id,
    name: guest.name,
    code: guest.code,
    city: guest.city,
    group: guest.group_name,
    invitedEvents: invitedKeys(guest),
    djNightOn: djOn(guest),
    room: guest.room_number
      ? {
          number: guest.room_number,
          type: guest.room_type || "",
          checkIn: guest.room_check_in || "",
        }
      : null,
    rsvp: {
      events,
      meal: guest.meal_preference || "",
      arrival: guest.arrival || "",
      departure: guest.departure || "",
      transport: guest.transport || "",
      message: guest.message || "",
      submittedAt: guest.rsvp_submitted_at,
    },
  };
}
