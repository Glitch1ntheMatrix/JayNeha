"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LockState = "checking" | "locked" | "open";
type Tab = "guests" | "dashboard" | "content";

const TABS: { key: Tab; href: string; label: string }[] = [
  { key: "guests", href: "/admin", label: "Guests" },
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard" },
  { key: "content", href: "/admin/content", label: "Footer & intro" },
];

export default function AdminGate({
  active,
  children,
}: {
  active: Tab;
  children: React.ReactNode;
}) {
  const [lock, setLock] = useState<LockState>("checking");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  async function checkAuth() {
    const res = await fetch("/api/admin/settings");
    setLock(res.status === 401 ? "locked" : "open");
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function submitPassword() {
    setPwError("");
    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwInput }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPwError(data.error || "That password is not right.");
      return;
    }
    setPwInput("");
    checkAuth();
  }

  if (lock === "checking") {
    return <div className="min-h-screen bg-cream" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[1400px] mx-auto px-[22px] pt-6 md:pt-[clamp(24px,4vw,52px)] pb-20">
        <div className="flex items-baseline gap-4 flex-wrap mb-7">
          <h1 className="font-display text-[30px] text-maroon font-normal m-0">Hosts&apos; view</h1>
          {lock === "open" && (
            <div className="flex gap-2 flex-wrap">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className="px-3.5 py-[9px] border border-borderInput rounded-[2px] text-sm tracking-[.14em] uppercase no-underline"
                  style={{
                    background: active === tab.key ? "#7A0C22" : "transparent",
                    color: active === tab.key ? "#FBF4EA" : "#3B2B21",
                  }}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          )}
          <div className="flex-1" />
          <Link
            href="/home"
            className="px-4 py-[9px] border border-borderInput bg-transparent rounded-[2px] text-inkSoft text-sm tracking-[.16em] uppercase no-underline"
          >
            Back to the site
          </Link>
        </div>

        {lock === "locked" && (
          <div className="max-w-[360px] bg-creamCard border border-border rounded p-7">
            <div className="text-sm tracking-[.2em] uppercase text-inkSoft mb-2">Password</div>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => {
                setPwInput(e.target.value);
                setPwError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
            />
            {pwError && <div className="mt-3 text-[15.5px] text-maroonHover">{pwError}</div>}
            <button
              onClick={submitPassword}
              className="w-full mt-[18px] p-[13px] bg-maroon text-cream border-none rounded-[2px] text-[14.5px] tracking-[.2em] uppercase cursor-pointer"
            >
              Unlock
            </button>
          </div>
        )}

        {lock === "open" && children}
      </div>
    </div>
  );
}
