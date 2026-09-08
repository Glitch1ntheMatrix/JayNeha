"use client";

import { useEffect, useMemo, useState } from "react";
import { EVENT_MAP, ATTIRE, WEDDING_DATE_ISO } from "@/lib/events";
import { EventKey, GuestSession, RsvpAnswer } from "@/lib/types";
import { SiteContent } from "@/lib/content";
import Header from "./Header";
import Footer from "./Footer";

type OpenState = Partial<Record<EventKey, 0 | 1>>;

function daysUntilWedding(): number {
  const ms = new Date(WEDDING_DATE_ISO).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export default function GuestApp({
  initialGuest,
  content,
  scheduleRevealed,
}: {
  initialGuest: GuestSession;
  content: SiteContent;
  scheduleRevealed: boolean;
}) {
  const [guest, setGuest] = useState<GuestSession>(initialGuest);
  const [open, setOpen] = useState<OpenState>({});
  const [selected, setSelected] = useState<EventKey | null>(null);
  const [cardPage, setCardPage] = useState(0);
  const [cdDays, setCdDays] = useState<number>(daysUntilWedding());
  const [details, setDetails] = useState({
    meal: initialGuest.rsvp.meal,
    arrival: initialGuest.rsvp.arrival,
    departure: initialGuest.rsvp.departure,
    transport: initialGuest.rsvp.transport,
    phone: initialGuest.rsvp.phone,
    email: initialGuest.rsvp.email,
    message: initialGuest.rsvp.message,
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\+[1-9]\d{6,14}$/;

  function validateEmail(value: string) {
    const v = value.trim();
    if (!v) return "";
    return EMAIL_RE.test(v) ? "" : "Enter a valid email address.";
  }

  function validatePhone(value: string) {
    const v = value.trim();
    if (!v) return "";
    const compact = v.replace(/[\s-]/g, "");
    return PHONE_RE.test(compact)
      ? ""
      : "Include the country code, e.g. +91 98765 43210.";
  }

  function blurEmail() {
    const error = validateEmail(details.email);
    setFieldErrors((e) => ({ ...e, email: error }));
    if (!error) saveDetails();
  }

  function blurPhone() {
    const error = validatePhone(details.phone);
    setFieldErrors((e) => ({ ...e, phone: error }));
    if (!error) saveDetails();
  }

  useEffect(() => {
    const t = setInterval(() => setCdDays(daysUntilWedding()), 60_000);
    return () => clearInterval(t);
  }, []);

  const myEvents = useMemo(
    () => guest.invitedEvents.map((key) => EVENT_MAP[key]),
    [guest.invitedEvents]
  );

  const confirmedEvents = myEvents.filter((ev) => guest.rsvp.events[ev.key] === "yes");
  const answeredCount = guest.invitedEvents.filter((k) => guest.rsvp.events[k]).length;
  const firstName = guest.name.split(" ")[0];

  function openEnvelope(key: EventKey) {
    setCardPage(0);
    if ((open[key] || 0) >= 1) {
      setSelected(key);
      return;
    }
    setOpen((s) => ({ ...s, [key]: 1 }));
    setTimeout(() => setSelected(key), 600);
  }

  function closeModal() {
    setOpen((s) => (selected ? { ...s, [selected]: 0 } : s));
    setSelected(null);
  }

  async function answer(key: EventKey, value: RsvpAnswer) {
    // optimistic update
    setGuest((g) => ({ ...g, rsvp: { ...g.rsvp, events: { ...g.rsvp.events, [key]: value } } }));
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "event", eventKey: key, answer: value }),
    });
    const data = await res.json();
    if (data.guest) setGuest(data.guest);
  }

  async function saveDetails() {
    setSavingDetails(true);
    setSavedDetails(false);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "details", ...details }),
    });
    const data = await res.json();
    if (data.guest) setGuest(data.guest);
    setSavingDetails(false);
    setSavedDetails(true);
    setTimeout(() => setSavedDetails(false), 2500);
  }

  const selEv = selected ? EVENT_MAP[selected] : null;
  const selAnswer = selected ? guest.rsvp.events[selected] : undefined;
  const attire = selected ? ATTIRE[selected] : undefined;
  const cardPages = selEv ? (selEv.cards && selEv.cards.length ? selEv.cards : [selEv.card]) : [];

  function goCardPage(i: number) {
    setCardPage((p) => Math.max(0, Math.min(cardPages.length - 1, i)));
  }

  return (
    <div>
      <Header active="home" guestName={guest.name} />

      <div className="max-w-[1160px] mx-auto px-[22px] pt-9 md:pt-[clamp(38px,6vw,76px)] pb-10">
        <div className="text-sm tracking-[.34em] uppercase text-brown font-medium">Namaste</div>
        <h1 className="font-display text-[clamp(35px,5.6vw,54px)] leading-[1.05] my-3.5 text-maroon font-normal">
          {firstName}
        </h1>
        <p className="font-body text-[22px] leading-relaxed text-inkBody max-w-none m-0">
          It would mean the world to have you with us. Your invitations are below. Open each
          one, see where we will be, and tell us if you can come.
        </p>

        <div className="flex gap-6 md:gap-[clamp(18px,4vw,44px)] flex-wrap mt-9 pt-7 border-t border-border">
          <div>
            <div className="font-display text-[34px] text-maroon leading-none">{cdDays}</div>
            <div className="text-sm tracking-[.2em] uppercase text-inkMuted mt-1.5">
              Days to the wedding
            </div>
          </div>
          <div>
            <div className="font-display text-[34px] text-maroon leading-none">{answeredCount}</div>
            <div className="text-sm tracking-[.2em] uppercase text-inkMuted mt-1.5">
              Invitations answered
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-[22px] pb-5">
        <h2 className="font-display text-[clamp(27px,3.6vw,38px)] text-maroon font-normal mb-6 mt-3">
          Your invitations
        </h2>
        <div className="grid gap-6 md:gap-[clamp(22px,3vw,38px)]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(268px,1fr))" }}>
          {myEvents.map((ev) => {
            const isOpen = (open[ev.key] || 0) >= 1;
            const ans = guest.rsvp.events[ev.key];
            const statusLabel =
              ans === "yes" ? "You said yes" : ans === "no" ? "You cannot make it" : "Awaiting your reply";
            const statusColor = ans === "yes" ? "#4E7A3A" : ans === "no" ? "#372A20" : "#6B3D08";
            return (
              <div key={ev.key} className="nj-fade">
                <button
                  onClick={() => openEnvelope(ev.key)}
                  className="relative w-full block text-left cursor-pointer p-0 border-0 bg-transparent"
                  style={{ aspectRatio: "1.52", perspective: "1200px", zIndex: isOpen ? 10 : 1 }}
                >
                  <div
                    className="absolute inset-0 rounded"
                    style={{
                      background: "linear-gradient(180deg,#F5E9D1,#EAD8B7)",
                      border: "1px solid rgba(122,12,34,.16)",
                      boxShadow: "0 14px 30px -12px rgba(90,40,20,.34)",
                      zIndex: 1,
                    }}
                  />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded" style={{ zIndex: 2 }}>
                    <div
                      className="nj-envelope-card absolute rounded-t-sm"
                      style={{
                        left: "12%",
                        width: "76%",
                        height: "86%",
                        bottom: "-62%",
                        background: "linear-gradient(180deg,#FFFBF2,#F6EAD3)",
                        boxShadow: "0 -6px 20px rgba(50,20,10,.22)",
                        transform: isOpen ? "translateY(-62%)" : "translateY(0%)",
                      }}
                    >
                      <div
                        className="absolute h-px opacity-50"
                        style={{ left: "14%", right: "14%", top: "14%", background: ev.accent }}
                      />
                      <div className="absolute h-px" style={{ left: "22%", right: "22%", top: "24%", background: "#D9C6A4" }} />
                      <div className="absolute h-px" style={{ left: "30%", right: "30%", top: "31%", background: "#E2D3B6" }} />
                    </div>
                  </div>
                  <div
                    className="absolute left-0 right-0 bottom-0 rounded-b"
                    style={{
                      height: "64%",
                      zIndex: 3,
                      background: "linear-gradient(180deg,#F0E1C4,#E1CBA2)",
                      boxShadow: "0 -1px 0 rgba(122,12,34,.12)",
                    }}
                  />
                  <div className="absolute text-center pointer-events-none" style={{ left: "8%", right: "8%", bottom: "6%", zIndex: 7 }}>
                    <div className="font-display text-[18px] tracking-[.05em] text-maroon leading-tight">{ev.name}</div>
                    <div className="mt-1.5 text-[16px] tracking-[.1em] uppercase text-inkSoft font-medium">
                      {ev.dateLabel}
                    </div>
                  </div>
                  <div
                    className="nj-envelope-flap absolute top-0 left-0 right-0"
                    style={{
                      height: "56%",
                      zIndex: 5,
                      transform: isOpen ? "rotateX(-172deg)" : "rotateX(0deg)",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        clipPath: "polygon(0 0,100% 0,50% 100%)",
                        background: `linear-gradient(180deg,${ev.accent} 0%,${ev.accentDark} 100%)`,
                      }}
                    />
                    <div className="absolute left-0 right-0 top-0 h-px" style={{ background: "rgba(255,255,255,.35)" }} />
                  </div>
                  <div
                    className={isOpen ? "" : "nj-seal-pop-hidden"}
                    style={{
                      position: "absolute",
                      top: "47%",
                      left: "50%",
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 34% 30%,#E7BA5C,#B4801F 62%,#8A5C11)",
                      boxShadow: "0 3px 8px rgba(60,30,0,.4), 0 0 0 1px rgba(255,255,255,.25) inset",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "Marcellus, serif",
                      fontSize: 15.5,
                      color: "#4A2E06",
                      transform: "translate(-50%,-50%)",
                      zIndex: 6,
                      opacity: isOpen ? 0 : 1,
                      transition: isOpen ? undefined : "none",
                    }}
                  >
                    N&amp;J
                  </div>
                </button>
                <div className="mt-4 flex items-baseline gap-2.5">
                  <div className="font-body text-[19px] text-inkBody">{ev.timeShort || ev.time}</div>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="mt-1 text-[15.5px] text-inkSoft">
                  {ev.venue}, {ev.place}
                </div>
                <div className="mt-2.5 text-sm tracking-[.16em] uppercase" style={{ color: statusColor }}>
                  {statusLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-[22px] mt-14">
        <div
          className="rounded p-6 md:p-[clamp(26px,4vw,42px)] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#7A0C22,#5C0A1B)", color: "#F6E9D3" }}
        >
          <div
            className="absolute rounded-full"
            style={{ right: -40, top: -40, width: 200, height: 200, border: "1px solid rgba(240,210,150,.18)" }}
          />
          <div className="text-sm tracking-[.3em] uppercase" style={{ color: "#E1B45E" }}>
            Your stay at Ikshana Resort, Lonavala
          </div>
          {guest.roomsRevealed && guest.room ? (
            <div
              className="grid gap-6 mt-6 relative items-start"
              style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
            >
              <div>
                <div className="font-display text-[36px] leading-none">
                  Room {guest.room.number}
                </div>
                <div className="text-sm tracking-[.2em] uppercase mt-1.5" style={{ color: "rgba(252,245,232,.95)" }}>
                  {guest.room.type || "Room"}
                  {guest.room.checkIn ? ` · Check in ${guest.room.checkIn}` : ""}
                </div>
              </div>
              <div>
                <div className="font-body text-[23px] leading-snug" style={{ maxWidth: "34ch" }}>
                  We can&apos;t wait to have you stay with us. See you soon!
                </div>
              </div>
            </div>
          ) : (
            <div
              className="grid gap-6 mt-6 relative items-start"
              style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
            >
              <div>
                <div className="font-display text-[36px] leading-none">11 December</div>
                <div className="text-sm tracking-[.2em] uppercase mt-1.5" style={{ color: "rgba(252,245,232,.95)" }}>
                  Check in
                </div>
              </div>
              <div>
                <div className="font-body text-[23px] leading-snug" style={{ maxWidth: "34ch" }}>
                  We&apos;ll share room details in the first week of December. Do check this space again.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-[22px] mt-16">
        <h2 className="font-display text-[clamp(27px,3.6vw,38px)] text-maroon font-normal mb-6 mt-3">
          A few details for us
        </h2>
        <div className="bg-creamCard border border-border rounded p-6 md:p-[clamp(22px,3vw,36px)]">
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            <div>
              <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
                Meal preference
              </label>
              <select
                value={details.meal}
                onChange={(e) => setDetails((d) => ({ ...d, meal: e.target.value }))}
                onBlur={saveDetails}
                className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
              >
                <option value="">Select</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Jain">Jain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
                Arrival date
              </label>
              <input
                type="date"
                value={details.arrival}
                onChange={(e) => setDetails((d) => ({ ...d, arrival: e.target.value }))}
                onBlur={saveDetails}
                className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
              />
            </div>
            <div>
              <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
                Departure date
              </label>
              <input
                type="date"
                value={details.departure}
                onChange={(e) => setDetails((d) => ({ ...d, departure: e.target.value }))}
                onBlur={saveDetails}
                className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
              />
            </div>
            <div>
              <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
                Travel help needed?
              </label>
              <select
                value={details.transport}
                onChange={(e) => setDetails((d) => ({ ...d, transport: e.target.value }))}
                onBlur={saveDetails}
                className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
              >
                <option value="">Select</option>
                <option value="Yes, please arrange">Yes, please arrange</option>
                <option value="No, driving myself">No, driving myself</option>
              </select>
            </div>
            <div>
              <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
                Phone number
              </label>
              <input
                value={details.phone}
                onChange={(e) => {
                  setDetails((d) => ({ ...d, phone: e.target.value }));
                  setFieldErrors((er) => ({ ...er, phone: undefined }));
                }}
                onBlur={blurPhone}
                placeholder="e.g. +91 98765 43210"
                className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
                style={{ borderColor: fieldErrors.phone ? "#B23A3A" : undefined }}
              />
              {fieldErrors.phone && (
                <div className="mt-1.5 text-[13.5px] text-errorText">{fieldErrors.phone}</div>
              )}
            </div>
            <div>
              <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
                Email
              </label>
              <input
                value={details.email}
                onChange={(e) => {
                  setDetails((d) => ({ ...d, email: e.target.value }));
                  setFieldErrors((er) => ({ ...er, email: undefined }));
                }}
                onBlur={blurEmail}
                placeholder="e.g. you@example.com"
                className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
                style={{ borderColor: fieldErrors.email ? "#B23A3A" : undefined }}
              />
              {fieldErrors.email && (
                <div className="mt-1.5 text-[13.5px] text-errorText">{fieldErrors.email}</div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm tracking-[.2em] uppercase text-inkSoft mb-2">
              A message for us (optional)
            </label>
            <textarea
              value={details.message}
              onChange={(e) => setDetails((d) => ({ ...d, message: e.target.value }))}
              onBlur={saveDetails}
              rows={3}
              className="w-full p-3 border border-borderInput rounded-[2px] bg-white text-ink"
            />
          </div>
          <div className="mt-4 text-[14.5px] text-inkMuted min-h-[1.2em]">
            {savingDetails ? "Saving…" : savedDetails ? "Saved." : "Your answers are saved automatically as you go."}
          </div>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-[22px] mt-16 pb-5">
        <div className="text-sm tracking-[.34em] uppercase text-brown font-medium">
          Your schedule
        </div>
        <h2 className="font-display text-[clamp(27px,3.6vw,38px)] text-maroon font-normal mt-2 mb-4">
          Where to be, and when
        </h2>
        {!scheduleRevealed ? (
          <div className="pt-5 border-t border-border text-[15.5px] text-inkMuted">
            We&apos;ll share the schedule post RSVP due date. Do check this space again.
          </div>
        ) : confirmedEvents.length ? (
          <div className="border-t border-border">
            {confirmedEvents.map((ev) => (
              <div
                key={ev.key}
                className="grid gap-2 py-5 border-b border-border"
                style={{ gridTemplateColumns: "150px 1fr" }}
              >
                <div className="text-sm tracking-[.08em] uppercase text-maroon font-semibold">
                  {ev.dateLabel}
                </div>
                <div>
                  <div className="font-display text-[20px] text-maroon">{ev.name}</div>
                  <div className="mt-1 text-[15.5px] text-inkSoft">{ev.time}</div>
                  <div className="text-[15.5px] text-inkMuted">
                    {ev.venue}, {ev.place}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-5 border-t border-border text-[15.5px] text-inkMuted">
            Say yes to an invitation above and it will appear here.
          </div>
        )}
      </div>

      <Footer content={content} />

      {selEv && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto bg-black/40 p-3.5 md:p-[clamp(16px,4vw,48px)]"
          onClick={closeModal}
        >
          <div
            className="nj-panel relative bg-cream rounded max-w-[880px] w-full grid gap-5 md:gap-[clamp(20px,3vw,40px)] p-4 md:p-[clamp(20px,3vw,36px)] grid-cols-1 md:grid-cols-2 my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 rounded-full bg-creamCard border border-border flex items-center justify-center text-inkSoft text-lg leading-none cursor-pointer hover:border-maroon hover:text-maroon z-10"
            >
              ×
            </button>
            <div>
              <div
                className="relative rounded shadow-lg overflow-hidden"
                style={{ perspective: 1400 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={cardPage}
                  src={cardPages[cardPage]}
                  alt={`${selEv.name}${cardPages.length > 1 ? ` — page ${cardPage + 1}` : ""}`}
                  className="nj-card-page w-full block rounded"
                />
                {cardPages.length > 1 && (
                  <>
                    {cardPage > 0 && (
                      <button
                        onClick={() => goCardPage(cardPage - 1)}
                        aria-label="Previous page"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-cream/90 border border-border flex items-center justify-center text-maroon text-lg leading-none cursor-pointer shadow hover:bg-cream"
                      >
                        ‹
                      </button>
                    )}
                    {cardPage < cardPages.length - 1 && (
                      <button
                        onClick={() => goCardPage(cardPage + 1)}
                        aria-label="Next page"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-cream/90 border border-border flex items-center justify-center text-maroon text-lg leading-none cursor-pointer shadow hover:bg-cream"
                      >
                        ›
                      </button>
                    )}
                    <div className="absolute left-0 right-0 bottom-3 flex items-center justify-center gap-2">
                      {cardPages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goCardPage(i)}
                          aria-label={`Go to page ${i + 1}`}
                          className="rounded-full cursor-pointer border-0 p-0"
                          style={{
                            width: i === cardPage ? 18 : 7,
                            height: 7,
                            background: i === cardPage ? "#7A0C22" : "rgba(122,12,34,.35)",
                            transition: "width .25s ease, background .25s ease",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {cardPages.length > 1 && (
                <div className="mt-2.5 text-center text-[13px] tracking-[.14em] uppercase text-inkMuted">
                  Page {cardPage + 1} of {cardPages.length}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm tracking-[.3em] uppercase text-brown font-medium">
                {selEv.dateLabel}
              </div>
              <h3 className="font-display text-[30px] text-maroon my-2.5">{selEv.name}</h3>

              <div className="mt-5">
                <div className="text-sm tracking-[.2em] uppercase text-inkSoft mb-1.5">When</div>
                <div className="text-[15.5px] text-inkBody leading-relaxed">{selEv.dateFull}</div>
                <div className="text-[15.5px] text-inkBody leading-relaxed">{selEv.time}</div>
              </div>

              <div className="mt-4">
                <div className="text-sm tracking-[.2em] uppercase text-inkSoft mb-1.5">Where</div>
                <div className="text-[15.5px] text-inkBody leading-relaxed">{selEv.venue}</div>
                <div className="text-[15.5px] text-inkBody leading-relaxed">{selEv.place}</div>
              </div>

              {attire && (
                <div className="mt-6 pt-5 border-t border-border">
                  <div className="text-sm tracking-[.2em] uppercase text-inkSoft mb-1.5">Dress</div>
                  <div className="text-[15.5px] text-inkBody leading-relaxed">{attire.mood}</div>
                  {attire.colours.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3.5">
                      {attire.colours.map((c) => (
                        <span
                          key={c.name}
                          title={c.name}
                          className="inline-block w-5 h-5 rounded-full border border-black/10"
                          style={{
                            background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.55), rgba(255,255,255,0) 58%), ${c.hex}`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {attire.avoid && (
                    <div className="mt-2.5 text-[15px] text-errorText font-semibold">{attire.avoid}</div>
                  )}
                  {attire.colours.length > 0 && (
                    <a
                      href="/style-guide"
                      className="inline-block mt-2.5 text-[14.5px] tracking-[.14em] uppercase text-maroon cursor-pointer"
                    >
                      For more, refer to the style guide
                    </a>
                  )}
                </div>
              )}

              <div className="mt-7 pt-6 border-t border-border">
                <div className="text-sm tracking-[.2em] uppercase text-inkSoft mb-3">
                  Will you be joining us?
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-2.5">
                  <button
                    onClick={() => selected && answer(selected, "yes")}
                    className="flex-1 basis-full md:basis-0 p-3.5 rounded-[2px] border cursor-pointer text-[14.5px] tracking-[.18em] uppercase"
                    style={{
                      borderColor: "#7A0C22",
                      background: selAnswer === "yes" ? "#7A0C22" : "transparent",
                      color: selAnswer === "yes" ? "#FBF4EA" : "#7A0C22",
                    }}
                  >
                    Yes, with joy
                  </button>
                  <button
                    onClick={() => selected && answer(selected, "no")}
                    className="flex-1 basis-full md:basis-0 p-3.5 rounded-[2px] border cursor-pointer text-[14.5px] tracking-[.18em] uppercase"
                    style={{
                      borderColor: "#4A3729",
                      background: selAnswer === "no" ? "#372A20" : "transparent",
                      color: selAnswer === "no" ? "#FBF4EA" : "#372A20",
                    }}
                  >
                    Regretfully no
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
