import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { djOn } from "@/lib/guest";
import { EventKey, GuestRow, RsvpResponseRow } from "@/lib/types";
import { INVITED_COLUMN_BY_KEY } from "@/lib/events";

const EVENT_KEYS: EventKey[] = [
  "kirtan",
  "bridalShower",
  "mehendi",
  "soiree",
  "djNight",
  "haldi",
  "pheras",
];

function csvQuote(value: unknown): string {
  return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
}

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
    .select("*");
  if (responsesError) {
    return NextResponse.json({ error: "Could not load RSVP responses." }, { status: 500 });
  }

  const responsesByGuest = new Map<number, Record<string, string>>();
  (responses as RsvpResponseRow[]).forEach((r) => {
    const bucket = responsesByGuest.get(r.guest_id) || {};
    bucket[r.event_key] = r.answer;
    responsesByGuest.set(r.guest_id, bucket);
  });

  const cols = ["id", "name", "code", "phone", "email", "city", "group_name", "relation", "dietary"];
  const head = cols
    .concat(EVENT_KEYS.map((k) => "invited_" + k))
    .concat(EVENT_KEYS.map((k) => "rsvp_" + k))
    .concat([
      "meal",
      "arrival",
      "departure",
      "transport",
      "message",
      "room",
      "room_type",
      "check_in",
    ]);

  const lines = [head.join(",")];

  (guests as GuestRow[]).forEach((g) => {
    const ev = responsesByGuest.get(g.id) || {};
    const row = cols
      .map((c) => (g as unknown as Record<string, unknown>)[c])
      .concat(
        EVENT_KEYS.map((k) =>
          k === "djNight"
            ? djOn(g)
              ? "Yes"
              : "No"
            : (g as unknown as Record<string, boolean>)[INVITED_COLUMN_BY_KEY[k]]
            ? "Yes"
            : "No"
        )
      )
      .concat(EVENT_KEYS.map((k) => ev[k] || ""))
      .concat([
        g.meal_preference || "",
        g.arrival || "",
        g.departure || "",
        g.transport || "",
        g.message || "",
        g.room_number || "",
        g.room_type || "",
        g.room_check_in || "",
      ]);
    lines.push(row.map(csvQuote).join(","));
  });

  const csv = "\ufeff" + lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="neha-jay-rsvp.csv"',
    },
  });
}
