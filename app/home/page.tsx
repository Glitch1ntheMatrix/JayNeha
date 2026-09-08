import { redirect } from "next/navigation";
import { verifyGuestSession } from "@/lib/session";
import { buildGuestSession, fetchGuestById } from "@/lib/guest";
import GuestApp from "@/components/GuestApp";

export default async function HomePage() {
  const guestId = await verifyGuestSession();
  if (!guestId) redirect("/");

  const guestRow = await fetchGuestById(guestId);
  if (!guestRow) redirect("/");

  const guest = await buildGuestSession(guestRow);

  return <GuestApp initialGuest={guest} />;
}
