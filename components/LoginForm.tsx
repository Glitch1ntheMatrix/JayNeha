"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-sm tracking-[.34em] uppercase text-brown font-medium">
        The Wedding Of
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo.png"
        alt="Neha and Jay"
        className="block mt-4"
        style={{ width: "min(300px,78%)", height: "auto" }}
      />
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#D8BE8C,rgba(216,190,140,0))" }} />
        <div className="w-[5px] h-[5px] bg-gold rotate-45" />
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg,#D8BE8C,rgba(216,190,140,0))" }} />
      </div>
      <p className="font-display text-[25px] tracking-[.18em] text-inkBody mb-8">12.12.26</p>

      <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
        Your name
      </label>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="w-full px-[14px] py-[13px] border border-borderInput rounded-[2px] bg-creamCard text-ink mb-[18px]"
      />

      <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
        Invite code
      </label>
      <input
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase());
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="5 characters"
        className="w-full px-[14px] py-[13px] border border-borderInput rounded-[2px] bg-creamCard text-ink tracking-[.34em] uppercase text-[19px]"
      />

      {error && (
        <div className="mt-[14px] px-[13px] py-[11px] bg-errorBg border-l-2 border-maroon text-[16px] text-errorText leading-relaxed">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full mt-6 py-[15px] bg-maroon text-cream border-none rounded-[2px] text-[15px] tracking-[.24em] uppercase font-medium cursor-pointer transition-colors hover:bg-maroonHover disabled:opacity-70"
      >
        {loading ? "Opening…" : "Open my invitation"}
      </button>

      <p className="text-[15.5px] text-inkMuted mt-5 leading-relaxed">
        Can&apos;t find your code? Message us!
      </p>
    </div>
  );
}
