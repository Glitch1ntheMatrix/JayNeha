import { redirect } from "next/navigation";
import Link from "next/link";
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
      <div className="max-w-[1000px] mx-auto px-[22px] pt-6 md:pt-[clamp(24px,4vw,48px)] pb-16 relative">
        <Link
          href="/home"
          aria-label="Close style guide"
          className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 rounded-full bg-creamCard border border-border flex items-center justify-center text-inkSoft text-lg leading-none cursor-pointer hover:border-maroon hover:text-maroon z-10 no-underline"
        >
          ×
        </Link>
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
