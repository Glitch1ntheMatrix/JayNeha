"use client";

import { useEffect, useMemo, useState } from "react";
import { EVENT_MAP } from "@/lib/events";
import { EventKey, RsvpAnswer } from "@/lib/types";
import AdminGate from "./AdminGate";

const EVENT_KEYS: EventKey[] = [
  "kirtan",
  "bridalShower",
  "mehendi",
  "soiree",
  "djNight",
  "haldi",
  "pheras",
];

interface DashboardRow {
  id: number;
  name: string;
  invited: EventKey[];
  events: Partial<Record<EventKey, RsvpAnswer>>;
  meal: string | null;
  arrival: string | null;
  departure: string | null;
  transport: string | null;
  message: string | null;
  messageActioned: boolean;
}

function Section({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="bg-creamCard border border-border rounded-sm mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-5 bg-transparent border-none cursor-pointer text-left"
      >
        <div>
          <div className="text-[16.5px] text-inkSoft font-medium">{title}</div>
          {subtitle && <div className="text-[13.5px] text-inkMuted mt-0.5">{subtitle}</div>}
        </div>
        <span className="text-sm tracking-[.14em] uppercase text-maroon shrink-0">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function nightsBetween(arrival: string, departure: string): number | null {
  const a = new Date(arrival);
  const d = new Date(departure);
  if (Number.isNaN(a.getTime()) || Number.isNaN(d.getTime())) return null;
  const diff = Math.round((d.getTime() - a.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

export default function AdminDashboard() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savingMessage, setSavingMessage] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/guests")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRows(data.rows || []);
        setLoaded(true);
      });
  }, []);

  const mealCounts = useMemo(() => {
    let veg = 0,
      jain = 0,
      none = 0;
    for (const r of rows) {
      if (r.meal === "Vegetarian") veg++;
      else if (r.meal === "Jain") jain++;
      else none++;
    }
    return { veg, jain, none };
  }, [rows]);

  const transportCounts = useMemo(() => {
    let yes = 0,
      no = 0,
      none = 0;
    for (const r of rows) {
      if (r.transport === "Yes, please arrange") yes++;
      else if (r.transport === "No, driving myself") no++;
      else none++;
    }
    return { yes, no, none };
  }, [rows]);

  const rsvpByEvent = useMemo(() => {
    const byEvent: Record<EventKey, { yes: number; no: number; pending: number }> = {} as Record<
      EventKey,
      { yes: number; no: number; pending: number }
    >;
    EVENT_KEYS.forEach((key) => (byEvent[key] = { yes: 0, no: 0, pending: 0 }));
    for (const r of rows) {
      for (const key of r.invited) {
        const answer = r.events[key];
        if (answer === "yes") byEvent[key].yes++;
        else if (answer === "no") byEvent[key].no++;
        else byEvent[key].pending++;
      }
    }
    return byEvent;
  }, [rows]);

  const overall = useMemo(
    () =>
      EVENT_KEYS.reduce(
        (acc, key) => ({
          yes: acc.yes + rsvpByEvent[key].yes,
          no: acc.no + rsvpByEvent[key].no,
          pending: acc.pending + rsvpByEvent[key].pending,
        }),
        { yes: 0, no: 0, pending: 0 }
      ),
    [rsvpByEvent]
  );

  const arrivals = useMemo(
    () =>
      rows
        .filter((r) => r.arrival || r.departure)
        .slice()
        .sort((a, b) => (a.arrival || "").localeCompare(b.arrival || "")),
    [rows]
  );

  const messages = useMemo(() => rows.filter((r) => r.message), [rows]);
  const openMessages = messages.filter((r) => !r.messageActioned);
  const resolvedMessages = messages.filter((r) => r.messageActioned);

  async function setMessageActioned(id: number, actioned: boolean) {
    setSavingMessage(id);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, messageActioned: actioned } : r)));
    await fetch(`/api/admin/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "message", actioned }),
    });
    setSavingMessage(null);
  }

  return (
    <AdminGate active="dashboard">
      {!loaded ? (
        <div className="text-[15.5px] text-inkMuted">Loading…</div>
      ) : (
        <div>
          <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            <div className="bg-creamCard border border-border rounded-sm p-5">
              <div className="text-[15.5px] text-inkSoft font-medium mb-3">Meal preference</div>
              <div className="flex flex-col gap-2 text-[15px] text-inkSoft">
                <div className="flex justify-between">
                  <span>Vegetarian</span>
                  <span className="font-medium text-maroon">{mealCounts.veg}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jain</span>
                  <span className="font-medium text-maroon">{mealCounts.jain}</span>
                </div>
                <div className="flex justify-between text-inkMuted">
                  <span>No response</span>
                  <span className="font-medium">{mealCounts.none}</span>
                </div>
              </div>
            </div>

            <div className="bg-creamCard border border-border rounded-sm p-5">
              <div className="text-[15.5px] text-inkSoft font-medium mb-3">Travel help needed</div>
              <div className="flex flex-col gap-2 text-[15px] text-inkSoft">
                <div className="flex justify-between">
                  <span>Yes, please arrange</span>
                  <span className="font-medium text-maroon">{transportCounts.yes}</span>
                </div>
                <div className="flex justify-between">
                  <span>No, driving myself</span>
                  <span className="font-medium text-maroon">{transportCounts.no}</span>
                </div>
                <div className="flex justify-between text-inkMuted">
                  <span>No response</span>
                  <span className="font-medium">{transportCounts.none}</span>
                </div>
              </div>
            </div>

            <div className="bg-creamCard border border-border rounded-sm p-5">
              <div className="text-[15.5px] text-inkSoft font-medium mb-3">RSVPs — overall</div>
              <div className="flex flex-col gap-2 text-[15px] text-inkSoft">
                <div className="flex justify-between">
                  <span>Yes</span>
                  <span className="font-medium" style={{ color: "#4E7A3A" }}>
                    {overall.yes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>No</span>
                  <span className="font-medium" style={{ color: "#8A3B2A" }}>
                    {overall.no}
                  </span>
                </div>
                <div className="flex justify-between text-inkMuted">
                  <span>Pending</span>
                  <span className="font-medium">{overall.pending}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-creamCard border border-border rounded-sm p-5 mb-6">
            <div className="text-[15.5px] text-inkSoft font-medium mb-3">RSVPs — per event</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] text-inkSoft" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="text-sm tracking-[.1em] uppercase text-inkMuted text-left">
                    <th className="py-2 pr-3 font-normal">Event</th>
                    <th className="py-2 px-3 font-normal" style={{ color: "#4E7A3A" }}>
                      Yes
                    </th>
                    <th className="py-2 px-3 font-normal" style={{ color: "#8A3B2A" }}>
                      No
                    </th>
                    <th className="py-2 px-3 font-normal">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENT_KEYS.map((key) => (
                    <tr key={key} className="border-t border-border">
                      <td className="py-2 pr-3">{EVENT_MAP[key].name}</td>
                      <td className="py-2 px-3">{rsvpByEvent[key].yes}</td>
                      <td className="py-2 px-3">{rsvpByEvent[key].no}</td>
                      <td className="py-2 px-3 text-inkMuted">{rsvpByEvent[key].pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Section
            title="Who's arriving when, and staying how long"
            subtitle={`${arrivals.length} guest${arrivals.length === 1 ? "" : "s"} with arrival or departure dates`}
          >
            {arrivals.length === 0 ? (
              <div className="text-[15px] text-inkMuted">No arrival or departure dates yet.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {arrivals.map((r) => {
                  const nights =
                    r.arrival && r.departure ? nightsBetween(r.arrival, r.departure) : null;
                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 border-b border-[#F0E4D0] last:border-b-0"
                    >
                      <div className="text-[15px] text-inkSoft font-medium min-w-[160px]">{r.name}</div>
                      <div className="text-[14.5px] text-inkMuted">
                        Arrival: {r.arrival || "—"} · Departure: {r.departure || "—"}
                        {nights !== null && ` · ${nights} night${nights === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section
            title="A message for us"
            subtitle={`${openMessages.length} open${
              resolvedMessages.length ? `, ${resolvedMessages.length} resolved` : ""
            }`}
          >
            {messages.length === 0 ? (
              <div className="text-[15px] text-inkMuted">No messages yet.</div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {openMessages.map((r) => (
                    <div key={r.id} className="bg-parchment border border-border rounded-sm p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[15px] text-inkSoft font-medium">{r.name}</div>
                        <button
                          onClick={() => setMessageActioned(r.id, true)}
                          disabled={savingMessage === r.id}
                          className="shrink-0 px-2.5 py-1 bg-transparent border border-maroon rounded-[2px] text-maroon text-[12px] tracking-[.1em] uppercase cursor-pointer disabled:opacity-60"
                        >
                          Close
                        </button>
                      </div>
                      <div className="mt-1.5 text-[15px] text-inkBody leading-relaxed">{r.message}</div>
                      <label className="mt-2.5 flex items-center gap-2 text-[13.5px] text-inkMuted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={(e) => setMessageActioned(r.id, e.target.checked)}
                        />
                        Action taken
                      </label>
                    </div>
                  ))}
                  {openMessages.length === 0 && (
                    <div className="text-[15px] text-inkMuted">All messages actioned.</div>
                  )}
                </div>

                {resolvedMessages.length > 0 && (
                  <div className="mt-5">
                    <Section title={`Resolved (${resolvedMessages.length})`}>
                      <div className="flex flex-col gap-3">
                        {resolvedMessages.map((r) => (
                          <div key={r.id} className="border border-border rounded-sm p-4 opacity-70">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-[15px] text-inkSoft font-medium">{r.name}</div>
                              <button
                                onClick={() => setMessageActioned(r.id, false)}
                                disabled={savingMessage === r.id}
                                className="shrink-0 px-2.5 py-1 bg-transparent border border-borderInput rounded-[2px] text-inkSoft text-[12px] tracking-[.1em] uppercase cursor-pointer disabled:opacity-60"
                              >
                                Reopen
                              </button>
                            </div>
                            <div className="mt-1.5 text-[15px] text-inkBody leading-relaxed">{r.message}</div>
                            <label className="mt-2.5 flex items-center gap-2 text-[13.5px] text-inkMuted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => setMessageActioned(r.id, e.target.checked)}
                              />
                              Action taken
                            </label>
                          </div>
                        ))}
                      </div>
                    </Section>
                  </div>
                )}
              </>
            )}
          </Section>
        </div>
      )}
    </AdminGate>
  );
}
