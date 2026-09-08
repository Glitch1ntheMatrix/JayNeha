import { redirect } from "next/navigation";
import { verifyGuestSession } from "@/lib/session";
import { buildGuestSession, fetchGuestById, fetchScheduleRevealed } from "@/lib/guest";
import { fetchSiteContent } from "@/lib/content";
import GuestApp from "@/components/GuestApp";

export default async function HomePage() {
  const guestId = await verifyGuestSession();
  if (!guestId) redirect("/");

  const guestRow = await fetchGuestById(guestId);
  if (!guestRow) redirect("/");

  const [guest, content, scheduleRevealed] = await Promise.all([
    buildGuestSession(guestRow),
    fetchSiteContent(),
    fetchScheduleRevealed(),
  ]);

  return <GuestApp initialGuest={guest} content={content} scheduleRevealed={scheduleRevealed} />;
}
