import { redirect } from "next/navigation";
import { verifyGuestSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const guestId = await verifyGuestSession();
  if (guestId) {
    redirect("/home");
  }

  return (
    <div
      className="min-h-screen grid px-4 py-7 md:px-5 md:py-16 place-items-start md:place-items-center"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #FDF7EE 0%, #F6EADA 55%, #EFDFC9 100%)",
      }}
    >
      <div className="w-full max-w-[1080px] grid gap-8 md:gap-[clamp(32px,5vw,72px)] grid-cols-1 md:grid-cols-2 items-center">
        <div className="order-2 md:order-1 justify-self-center w-full max-w-[380px] md:max-w-[460px] nj-fade">
          <div
            className="overflow-hidden rounded-[3px]"
            style={{
              boxShadow: "0 24px 60px -18px rgba(90,20,30,.55), 0 2px 0 rgba(255,255,255,.6)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cards/cover-family.jpg"
              alt="Neha and Jay wedding invitation"
              className="w-full block"
            />
          </div>
        </div>

        <div className="order-1 md:order-2 justify-self-center w-full md:max-w-[420px] nj-fade" style={{ animationDelay: ".12s" }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
