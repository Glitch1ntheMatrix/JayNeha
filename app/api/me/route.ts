import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/session";
import { buildGuestSession, fetchGuestById } from "@/lib/guest";

export async function GET() {
  const guestId = await verifyGuestSession();
  if (!guestId) {
    return NextResponse.json({ guest: null }, { status: 200 });
  }
  const guest = await fetchGuestById(guestId);
  if (!guest) {
    return NextResponse.json({ guest: null }, { status: 200 });
  }
  const session = await buildGuestSession(guest);
  return NextResponse.json({ guest: session });
}
