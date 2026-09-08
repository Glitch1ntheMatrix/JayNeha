import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchRoomsRevealed, fetchScheduleRevealed } from "@/lib/guest";

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [roomsRevealed, scheduleRevealed] = await Promise.all([
    fetchRoomsRevealed(),
    fetchScheduleRevealed(),
  ]);
  return NextResponse.json({ roomsRevealed, scheduleRevealed });
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const update: Record<string, boolean> = {};
  if (body && typeof body.roomsRevealed === "boolean") update.rooms_revealed = body.roomsRevealed;
  if (body && typeof body.scheduleRevealed === "boolean") update.schedule_revealed = body.scheduleRevealed;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("app_settings").update(update).eq("id", true);
  if (error) {
    return NextResponse.json({ error: "Could not update setting." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
