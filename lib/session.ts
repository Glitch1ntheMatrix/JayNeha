import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const GUEST_COOKIE = "nj_guest_session";
const ADMIN_COOKIE = "nj_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days — RSVP season is short but this keeps guests signed in

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a long random string in your environment variables."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createGuestSessionToken(guestId: number): Promise<string> {
  return new SignJWT({ guestId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecretKey());
}

export async function verifyGuestSession(): Promise<number | null> {
  const token = cookies().get(GUEST_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.guestId === "number" ? payload.guestId : null;
  } catch {
    return null;
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.admin === true;
  } catch {
    return false;
  }
}

export const SESSION_COOKIES = {
  guest: GUEST_COOKIE,
  admin: ADMIN_COOKIE,
  maxAge: MAX_AGE_SECONDS,
};
