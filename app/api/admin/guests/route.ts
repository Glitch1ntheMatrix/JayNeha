import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { djOn, invitedKeys } from "@/lib/guest";
import { EventKey, GuestRow, RsvpAnswer } from "@/lib/types";

const INVITED_COLUMN: Record<EventKey, string> = {
  kirtan: "invited_kirtan",
  bridalShower: "invited_bridal_shower",
  mehendi: "invited_mehendi",
  soiree: "invited_soiree",
  djNight: "invited_dj_night",
  haldi: "invited_haldi",
  pheras: "invited_pheras",
};

function randomCode(): string {
  // Avoids visually ambiguous characters (0/O, 1/I/L).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

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
      messageActioned: Boolean(g.message_actioned),
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

/**
 * Body: { name: string, code?: string, city?, group?, phone?, email?, relation?,
 *         invited?: Partial<Record<EventKey, boolean>> }
 * `code` is auto-generated (and retried on collision) if omitted.
 */
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { data: maxRow } = await supabaseAdmin
    .from("guests")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextId = (maxRow?.id || 0) + 1;

  const invited = (body.invited || {}) as Partial<Record<EventKey, boolean>>;
  const invitedColumns = Object.fromEntries(
    EVENT_KEYS.filter((k) => k !== "djNight").map((k) => [INVITED_COLUMN[k], Boolean(invited[k])])
  );

  const insert = {
    id: nextId,
    name: body.name.trim(),
    code: typeof body.code === "string" && body.code.trim() ? body.code.trim().toUpperCase() : randomCode(),
    city: body.city || null,
    group_name: body.group || null,
    phone: body.phone || null,
    email: body.email || null,
    relation: body.relation || null,
    ...invitedColumns,
    dj_night_override: invited.djNight ? true : null,
  };

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert(attempt === 0 ? insert : { ...insert, code: randomCode() })
      .select("id")
      .maybeSingle();
    if (!error) {
      return NextResponse.json({ ok: true, id: data?.id });
    }
    lastError = error.message;
    // Only retry on a code collision when the caller didn't ask for a specific code.
    if (typeof body.code === "string" && body.code.trim()) break;
  }

  return NextResponse.json({ error: lastError || "Could not add guest." }, { status: 500 });
}
