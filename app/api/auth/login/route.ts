import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createGuestSessionToken, SESSION_COOKIES } from "@/lib/session";
import { nameClose, norm } from "@/lib/nameMatch";
import { buildGuestSession } from "@/lib/guest";
import { GuestRow } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const code = typeof body?.code === "string" ? body.code.replace(/\s+/g, "").toUpperCase() : "";

  if (!code) {
    return NextResponse.json(
      { error: "Please enter your invite code." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .ilike("code", code);

  if (error) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const matches = (data || []) as GuestRow[];
  if (!matches.length) {
    return NextResponse.json(
      {
        error:
          "That invite code was not recognised. Please check the code in your invitation message.",
      },
      { status: 404 }
    );
  }

  // The code alone signs you in; the name only helps pick between a shared household code.
  const n = norm(name);
  const guest =
    (n &&
      (matches.find((x) => norm(x.name) === n) || matches.find((x) => nameClose(n, x.name)))) ||
    matches[0];

  const token = await createGuestSessionToken(guest.id);
  const session = await buildGuestSession(guest);

  const res = NextResponse.json({ guest: session });
  res.cookies.set(SESSION_COOKIES.guest, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIES.maxAge,
    path: "/",
  });
  return res;
}
