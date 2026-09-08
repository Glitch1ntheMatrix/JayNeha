import { redirect } from "next/navigation";
import { verifyGuestSession } from "@/lib/session";
import { fetchGuestById } from "@/lib/guest";
import Header from "@/components/Header";

export default async function StyleGuidePage() {
  const guestId = await verifyGuestSession();
  if (!guestId) redirect("/");

  const guest = await fetchGuestById(guestId);
  if (!guest) redirect("/");

  return (
    <div className="min-h-screen bg-cream">
      <Header active="style" guestName={guest.name} />
      <div className="max-w-[1000px] mx-auto px-[22px] pt-6 md:pt-[clamp(24px,4vw,48px)] pb-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/style-guide.jpg"
          alt="Style guide: suggested colour palettes for the Mehndi, Musical Soiree, Haldi and Wedding"
          className="block w-full h-auto"
          style={{ boxShadow: "0 18px 44px rgba(90,60,30,.16)" }}
        />
      </div>
    </div>
  );
}
