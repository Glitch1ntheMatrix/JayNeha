import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { djOn, invitedKeys } from "@/lib/guest";
import { GuestRow } from "@/lib/types";

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
    .select("guest_id");

  if (responsesError) {
    return NextResponse.json({ error: "Could not load RSVP responses." }, { status: 500 });
  }

  const answeredCountByGuest = new Map<number, number>();
  (responses || []).forEach((r: { guest_id: number }) => {
    answeredCountByGuest.set(r.guest_id, (answeredCountByGuest.get(r.guest_id) || 0) + 1);
  });

  const rows = (guests as GuestRow[]).map((g) => {
    const invited = invitedKeys(g);
    return {
      id: g.id,
      name: g.name,
      city: g.city,
      code: g.code,
      group: g.group_name,
      phone: g.phone,
      email: g.email,
      invited,
      answered: answeredCountByGuest.get(g.id) || 0,
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

  const stats = {
    guests: guests.length,
    kirtan: guests.filter((g: GuestRow) => g.invited_kirtan).length,
    mehendi: guests.filter((g: GuestRow) => g.invited_mehendi).length,
    soiree: guests.filter((g: GuestRow) => g.invited_soiree).length,
    haldi: guests.filter((g: GuestRow) => g.invited_haldi).length,
    pheras: guests.filter((g: GuestRow) => g.invited_pheras).length,
    djNight: (guests as GuestRow[]).filter((g) => djOn(g)).length,
    roomsHeld: guests.filter((g: GuestRow) => g.room_number).length,
  };

  return NextResponse.json({ rows, stats });
}
