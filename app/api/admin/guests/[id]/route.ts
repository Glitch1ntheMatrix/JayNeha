import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchGuestById, invitedKeys } from "@/lib/guest";
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

/**
 * Body shapes:
 *   { type: "room", number?: string, roomType?: string, checkIn?: string }
 *     -- setting a non-empty `number` makes the room section appear
 *        automatically on that guest's home page.
 *   { type: "dj", on: boolean | null }
 *     -- null clears the override and falls back to the original invite list.
 *   { type: "message", actioned: boolean }
 *     -- marks a guest's message as actioned/resolved (or reopens it).
 *   { type: "event", eventKey: EventKey, answer: "yes" | "no" | null }
 *     -- lets a host record/clear a guest's RSVP for one event, for guests
 *        who replied outside the site (phone, WhatsApp, in person).
 *        null clears the answer back to pending.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const guestId = Number(params.id);
  if (!Number.isFinite(guestId)) {
    return NextResponse.json({ error: "Invalid guest id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.type === "room") {
    const update = {
      room_number: typeof body.number === "string" ? body.number : null,
      room_type: typeof body.roomType === "string" ? body.roomType : null,
      room_check_in: typeof body.checkIn === "string" ? body.checkIn : null,
    };
    const { error } = await supabaseAdmin.from("guests").update(update).eq("id", guestId);
    if (error) {
      return NextResponse.json({ error: "Could not update room details." }, { status: 500 });
    }
  } else if (body.type === "dj") {
    const on = body.on;
    if (on !== true && on !== false && on !== null) {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("guests")
      .update({ dj_night_override: on })
      .eq("id", guestId);
    if (error) {
      return NextResponse.json({ error: "Could not update DJ Night list." }, { status: 500 });
    }
  } else if (body.type === "message") {
    if (typeof body.actioned !== "boolean") {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("guests")
      .update({ message_actioned: body.actioned })
      .eq("id", guestId);
    if (error) {
      return NextResponse.json({ error: "Could not update message status." }, { status: 500 });
    }
  } else if (body.type === "event") {
    const eventKey = body.eventKey as EventKey;
    const answer = body.answer;
    if (!EVENT_KEYS.includes(eventKey) || (answer !== "yes" && answer !== "no" && answer !== null)) {
      return NextResponse.json({ error: "Invalid event or answer." }, { status: 400 });
    }
    const guest = await fetchGuestById(guestId);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }
    if (!invitedKeys(guest).includes(eventKey)) {
      return NextResponse.json(
        { error: "This guest is not invited to that event." },
        { status: 400 }
      );
    }
    if (answer === null) {
      const { error } = await supabaseAdmin
        .from("rsvp_responses")
        .delete()
        .eq("guest_id", guestId)
        .eq("event_key", eventKey);
      if (error) {
        return NextResponse.json({ error: "Could not clear the answer." }, { status: 500 });
      }
    } else {
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
        return NextResponse.json({ error: "Could not save the answer." }, { status: 500 });
      }
    }
  } else {
    return NextResponse.json({ error: "Unknown update type." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
