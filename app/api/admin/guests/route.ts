import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { djOn, invitedKeys } from "@/lib/guest";
import { EventKey, GuestRow, RsvpAnswer } from "@/lib/types";

const EVENT_KEYS: EventKey[] = [
  "kirtan",
  "bridalShower",
  "mehendi",
  "soiree",
  "djNight",
  "haldi",
  "pheras",
];

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: guests, error: guestsError } = await supabaseAdmin
    .from("guests")
    .select("*")
    .order("id", { ascending: true });

  if (guestsError || !guests) {
    return NextResponse.json({ error: "Could not load guests." }, { status: 500 });
  }

  const { data: responses, error: responsesError } = await supabaseAdmin
    .from("rsvp_responses")
    .select("guest_id, event_key, answer");

  if (responsesError) {
    return NextResponse.json({ error: "Could not load RSVP responses." }, { status: 500 });
  }

  type ResponseRow = { guest_id: number; event_key: EventKey; answer: RsvpAnswer };
  const eventsByGuest = new Map<number, Partial<Record<EventKey, RsvpAnswer>>>();
  const confirmedByEvent = new Map<EventKey, number>();
  (responses as ResponseRow[]).forEach((r) => {
    const bucket = eventsByGuest.get(r.guest_id) || {};
    bucket[r.event_key] = r.answer;
    eventsByGuest.set(r.guest_id, bucket);
    if (r.answer === "yes") {
      confirmedByEvent.set(r.event_key, (confirmedByEvent.get(r.event_key) || 0) + 1);
    }
  });

  const rows = (guests as GuestRow[]).map((g) => {
    const invited = invitedKeys(g);
    const events = eventsByGuest.get(g.id) || {};
    return {
      id: g.id,
      name: g.name,
      city: g.city,
      code: g.code,
      group: g.group_name,
      phone: g.phone,
      email: g.email,
      invited,
      events,
      answered: Object.keys(events).length,
      totalInvited: invited.length,
      room: g.room_number ? { number: g.room_number, type: g.room_type || "" } : null,
      djOn: djOn(g),
      meal: g.meal_preference,
      arrival: g.arrival,
      departure: g.departure,
      transport: g.transport,
      message: g.message,
      submittedAt: g.rsvp_submitted_at,
    };
  });

  const invitedByEvent: Record<EventKey, number> = {
    kirtan: guests.filter((g: GuestRow) => g.invited_kirtan).length,
    bridalShower: guests.filter((g: GuestRow) => g.invited_bridal_shower).length,
    mehendi: guests.filter((g: GuestRow) => g.invited_mehendi).length,
    soiree: guests.filter((g: GuestRow) => g.invited_soiree).length,
    djNight: (guests as GuestRow[]).filter((g) => djOn(g)).length,
    haldi: guests.filter((g: GuestRow) => g.invited_haldi).length,
    pheras: guests.filter((g: GuestRow) => g.invited_pheras).length,
  };

  const eventStats = Object.fromEntries(
    EVENT_KEYS.map((key) => [
      key,
      { invited: invitedByEvent[key], confirmed: confirmedByEvent.get(key) || 0 },
    ])
  ) as Record<EventKey, { invited: number; confirmed: number }>;

  const stats = {
    guests: guests.length,
    events: eventStats,
    roomsHeld: guests.filter((g: GuestRow) => g.room_number).length,
  };

  return NextResponse.json({ rows, stats });
}
