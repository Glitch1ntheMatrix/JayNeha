import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchRoomsRevealed } from "@/lib/guest";

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const roomsRevealed = await fetchRoomsRevealed();
  return NextResponse.json({ roomsRevealed });
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.roomsRevealed !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("app_settings")
    .update({ rooms_revealed: body.roomsRevealed })
    .eq("id", true);
  if (error) {
    return NextResponse.json({ error: "Could not update setting." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
