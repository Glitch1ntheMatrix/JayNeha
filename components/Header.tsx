"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header({
  active,
  guestName,
}: {
  active: "home" | "style";
  guestName: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-border">
      <div className="max-w-[1160px] mx-auto flex items-center flex-wrap gap-2.5 md:gap-[18px] px-4 py-2.5 md:px-[22px] md:py-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.png" alt="Neha and Jay" className="w-auto h-[42px] md:h-[58px] block -my-1" />
        <div className="flex gap-2">
          <Link
            href="/home"
            className="px-3 py-2 md:px-4 md:py-[9px] border border-borderInput rounded-[2px] text-[13px] md:text-sm tracking-[.1em] md:tracking-[.16em] uppercase no-underline"
            style={{
              background: active === "home" ? "#7A0C22" : "transparent",
              color: active === "home" ? "#FBF4EA" : "#3B2B21",
            }}
          >
            Invitations
          </Link>
          <Link
            href="/style-guide"
            className="px-3 py-2 md:px-4 md:py-[9px] border border-borderInput rounded-[2px] text-[13px] md:text-sm tracking-[.1em] md:tracking-[.16em] uppercase no-underline"
            style={{
              background: active === "style" ? "#7A0C22" : "transparent",
              color: active === "style" ? "#FBF4EA" : "#3B2B21",
            }}
          >
            Style guide
          </Link>
        </div>
        <div className="flex-1" />
        <div className="hidden md:block text-[15.5px] text-inkMuted">{guestName}</div>
        <button
          onClick={logout}
          className="px-3.5 py-2 bg-transparent border border-borderInput rounded-[2px] text-inkSoft text-[13px] md:text-sm tracking-[.1em] md:tracking-[.16em] uppercase cursor-pointer hover:border-maroon hover:text-maroon"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
