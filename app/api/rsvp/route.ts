import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { buildGuestSession, fetchGuestById, invitedKeys } from "@/lib/guest";
import { EventKey } from "@/lib/types";

const EVENT_KEYS: EventKey[] = [
  "kirtan",
  "bridalShower",
  "mehendi",
  "soiree",
  "djNight",
  "haldi",
  "pheras",
];

const DETAIL_FIELDS = ["meal", "arrival", "departure", "transport", "phone", "email", "message"] as const;
type DetailField = (typeof DETAIL_FIELDS)[number];

const DETAIL_COLUMN: Record<DetailField, string> = {
  meal: "meal_preference",
  arrival: "arrival",
  departure: "departure",
  transport: "transport",
  phone: "phone",
  email: "email",
  message: "message",
};

/**
 * Body shapes:
 *  { type: "event", eventKey: "mehendi", answer: "yes" | "no" }
 *  { type: "details", meal?, arrival?, departure?, transport?, phone?, email?, message? }
 *  { type: "submit" }   -- marks rsvp_submitted_at, guest can still edit after
 */
export async function POST(req: NextRequest) {
  const guestId = await verifyGuestSession();
  if (!guestId) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const guest = await fetchGuestById(guestId);
  if (!guest) {
    return NextResponse.json({ error: "Guest not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.type === "event") {
    const eventKey = body.eventKey as EventKey;
    const answer = body.answer;
    if (!EVENT_KEYS.includes(eventKey) || (answer !== "yes" && answer !== "no")) {
      return NextResponse.json({ error: "Invalid event or answer." }, { status: 400 });
    }
    if (!invitedKeys(guest).includes(eventKey)) {
      return NextResponse.json(
        { error: "You are not invited to this event." },
        { status: 403 }
      );
    }
    const { error } = await supabaseAdmin.from("rsvp_responses").upsert(
      {
        guest_id: guestId,
        event_key: eventKey,
        answer,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "guest_id,event_key" }
    );
    if (error) {
      return NextResponse.json({ error: "Could not save your answer." }, { status: 500 });
    }
  } else if (body.type === "details") {
    const update: Record<string, string> = {};
    for (const field of DETAIL_FIELDS) {
      if (typeof body[field] === "string") {
        update[DETAIL_COLUMN[field]] = body[field];
      }
    }
    if (Object.keys(update).length) {
      const { error } = await supabaseAdmin.from("guests").update(update).eq("id", guestId);
      if (error) {
        return NextResponse.json({ error: "Could not save your details." }, { status: 500 });
      }
    }
  } else if (body.type === "submit") {
    const { error } = await supabaseAdmin
      .from("guests")
      .update({ rsvp_submitted_at: new Date().toISOString() })
      .eq("id", guestId);
    if (error) {
      return NextResponse.json({ error: "Could not submit your RSVP." }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Unknown update type." }, { status: 400 });
  }

  const refreshed = await fetchGuestById(guestId);
  const session = refreshed ? await buildGuestSession(refreshed) : null;
  return NextResponse.json({ guest: session });
}
