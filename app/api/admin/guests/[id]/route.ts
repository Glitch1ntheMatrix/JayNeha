import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Body shapes:
 *   { type: "room", number?: string, roomType?: string, checkIn?: string }
 *     -- setting a non-empty `number` makes the room section appear
 *        automatically on that guest's home page.
 *   { type: "dj", on: boolean | null }
 *     -- null clears the override and falls back to the original invite list.
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
  } else {
    return NextResponse.json({ error: "Unknown update type." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
