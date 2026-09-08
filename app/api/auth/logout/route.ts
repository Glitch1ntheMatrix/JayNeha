import { NextResponse } from "next/server";
import { SESSION_COOKIES } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIES.guest, "", { path: "/", maxAge: 0 });
  return res;
}
