import { redirect } from "next/navigation";
import { verifyGuestSession } from "@/lib/session";
import { buildGuestSession, fetchGuestById } from "@/lib/guest";
import { fetchSiteContent } from "@/lib/content";
import GuestApp from "@/components/GuestApp";

export default async function HomePage() {
  const guestId = await verifyGuestSession();
  if (!guestId) redirect("/");

  const guestRow = await fetchGuestById(guestId);
  if (!guestRow) redirect("/");

  const [guest, content] = await Promise.all([
    buildGuestSession(guestRow),
    fetchSiteContent(),
  ]);

  return <GuestApp initialGuest={guest} content={content} />;
}
