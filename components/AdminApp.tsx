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
const EVENT_SHORT: Record<EventKey, string> = {
  kirtan: "KIR",
  bridalShower: "BS",
  mehendi: "MEH",
  soiree: "SOI",
  djNight: "DJ",
  haldi: "HAL",
  pheras: "PHE",
};

interface AdminRow {
  id: number;
  name: string;
  city: string | null;
  code: string;
  group: string | null;
  phone: string | null;
  email: string | null;
  invited: EventKey[];
  events: Partial<Record<EventKey, RsvpAnswer>>;
  answered: number;
  totalInvited: number;
  room: { number: string; type: string } | null;
  djOn: boolean;
  meal: string | null;
  arrival: string | null;
  departure: string | null;
  transport: string | null;
  message: string | null;
  submittedAt: string | null;
}

function SettingToggle({
  on,
  onToggle,
  label,
  description,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-4 px-4 py-3.5 bg-parchment border border-border rounded-sm">
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        className="relative shrink-0 w-11 h-6 rounded-full border cursor-pointer transition-colors"
        style={{
          background: on ? "#7A0C22" : "transparent",
          borderColor: on ? "#7A0C22" : "#C9AE80",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-cream transition-all"
          style={{ left: on ? "22px" : "2px" }}
        />
      </button>
      <div>
        <div className="text-[15.5px] text-inkSoft font-medium">{label}</div>
        <div className="text-[14px] text-inkMuted">{description}</div>
      </div>
    </div>
  );
}

interface EventStat {
  invited: number;
  confirmed: number;
}

interface Stats {
  guests: number;
  events: Record<EventKey, EventStat>;
  roomsHeld: number;
}

export default function AdminApp() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [roomDraft, setRoomDraft] = useState({ number: "", roomType: "", checkIn: "" });
  const [roomsRevealed, setRoomsRevealed] = useState(false);
  const [scheduleRevealed, setScheduleRevealed] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  async function loadGuests() {
    const res = await fetch("/api/admin/guests");
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.rows || []);
    setStats(data.stats || null);
    loadSettings();
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setRoomsRevealed(Boolean(data.roomsRevealed));
      setScheduleRevealed(Boolean(data.scheduleRevealed));
    }
    setSettingsLoaded(true);
  }

  async function toggleRoomsRevealed() {
    const next = !roomsRevealed;
    setRoomsRevealed(next);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomsRevealed: next }),
    });
  }

  async function toggleScheduleRevealed() {
    const next = !scheduleRevealed;
    setScheduleRevealed(next);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleRevealed: next }),
    });
  }

  useEffect(() => {
    loadGuests();
  }, []);

  async function toggleDj(row: AdminRow) {
    const nextOn = !row.djOn;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, djOn: nextOn } : r)));
    await fetch(`/api/admin/guests/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "dj", on: nextOn }),
    });
  }

  async function cycleEventAnswer(row: AdminRow, key: EventKey) {
    const current = row.events[key] ?? null;
    const next: RsvpAnswer | null = current === null ? "yes" : current === "yes" ? "no" : null;
    const nextLabel = next === "yes" ? "Yes" : next === "no" ? "No" : "Pending (clear the answer)";
    const confirmed = window.confirm(
      `Set ${row.name}’s RSVP for ${EVENT_MAP[key].name} to "${nextLabel}"?\n\nThis records the RSVP on the guest’s behalf.`
    );
    if (!confirmed) return;
    setRows((rs) =>
      rs.map((r) =>
        r.id === row.id
          ? {
              ...r,
              events: next === null ? { ...r.events, [key]: undefined } : { ...r.events, [key]: next },
              answered: Object.values({ ...r.events, [key]: next }).filter(Boolean).length,
            }
          : r
      )
    );
    await fetch(`/api/admin/guests/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "event", eventKey: key, answer: next }),
    });
  }

  function startEditRoom(row: AdminRow) {
    setEditingRoom(row.id);
    setRoomDraft({ number: row.room?.number || "", roomType: row.room?.type || "", checkIn: "" });
  }

  async function saveRoom(id: number) {
    const res = await fetch(`/api/admin/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "room", ...roomDraft }),
    });
    if (res.ok) {
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? { ...r, room: roomDraft.number ? { number: roomDraft.number, type: roomDraft.roomType } : null }
            : r
        )
      );
    }
    setEditingRoom(null);
  }

  const shown = useMemo(() => {
    let list = rows.slice();
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.group || "").toLowerCase().includes(q) ||
          (r.city || "").toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q)
      );
    }
    if (filter === "answered") list = list.filter((r) => r.answered > 0);
    if (filter === "waiting") list = list.filter((r) => r.answered === 0);
    if (filter === "room") list = list.filter((r) => r.room?.number);
    if (filter === "dj") list = list.filter((r) => r.djOn);
    return list.slice(0, 300);
  }, [rows, search, filter]);

  function copyCodes() {
    const text = rows.map((r) => `${r.name}\t${r.code}`).join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <AdminGate active="guests">
      {stats && (
        <div>
          {settingsLoaded && (
            <div className="mb-6">
              <SettingToggle
                on={roomsRevealed}
                onToggle={toggleRoomsRevealed}
                label="Reveal room details to guests"
                description={
                  roomsRevealed
                    ? "Guests with a room assigned now see their room number and type."
                    : "Guests see a “we'll share room details soon” placeholder instead of their room number."
                }
              />
              <SettingToggle
                on={scheduleRevealed}
                onToggle={toggleScheduleRevealed}
                label="Reveal schedule to guests"
                description={
                  scheduleRevealed
                    ? "Guests see their confirmed events under “Your schedule.”"
                    : "The “Your schedule” heading stays visible, but guests see “Will be shared once things are finalized” instead of their events."
                }
              />
            </div>
          )}

          <div
            className="grid gap-3.5 mb-6"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}
          >
            <div className="bg-creamCard border border-border rounded-sm px-4 py-4">
              <div className="font-display text-2xl text-maroon leading-none">{stats.guests}</div>
              <div className="text-sm tracking-[.14em] uppercase text-inkMuted mt-1.5">Guests</div>
            </div>
            {EVENT_KEYS.map((key) => {
              const s = stats.events[key];
              return (
                <div key={key} className="bg-creamCard border border-border rounded-sm px-4 py-4">
                  <div className="font-display text-2xl text-maroon leading-none">
                    {s.confirmed}
                    <span className="text-base text-inkMuted"> / {s.invited}</span>
                  </div>
                  <div className="text-sm tracking-[.14em] uppercase text-inkMuted mt-1.5">
                    {EVENT_MAP[key].name}
                  </div>
                </div>
              );
            })}
            <div className="bg-creamCard border border-border rounded-sm px-4 py-4">
              <div className="font-display text-2xl text-maroon leading-none">{stats.roomsHeld}</div>
              <div className="text-sm tracking-[.14em] uppercase text-inkMuted mt-1.5">Rooms held</div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap items-center mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, group, city, code"
              className="flex-1 min-w-[220px] px-[13px] py-[11px] border border-borderInput rounded-[2px] bg-creamCard text-ink"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-[11px] border border-borderInput rounded-[2px] bg-creamCard text-ink"
            >
              <option value="all">All guests</option>
              <option value="answered">Answered</option>
              <option value="waiting">Not answered</option>
              <option value="room">Has a room</option>
              <option value="dj">DJ Night list</option>
            </select>
            <button
              onClick={copyCodes}
              className="px-[18px] py-[11px] bg-transparent border border-maroon rounded-[2px] text-maroon text-sm tracking-[.16em] uppercase cursor-pointer"
            >
              {copied ? "Copied" : "Copy name + code"}
            </button>
            <a
              href="/api/admin/export"
              className="px-[18px] py-[11px] bg-maroon text-cream border-none rounded-[2px] text-sm tracking-[.16em] uppercase no-underline"
            >
              Export CSV
            </a>
          </div>

          <div className="mb-4 px-4 py-3.5 bg-parchment border border-border rounded-sm text-[15.5px] text-inkMuted leading-relaxed">
            Every guest&apos;s invite code sits in the <strong className="text-maroon font-medium">Code</strong>{" "}
            column below. <strong className="text-maroon font-medium">Copy name + code</strong> puts the whole
            list on your clipboard. <strong className="text-maroon font-medium">Export CSV</strong> downloads
            every guest with their code, events, and answers so far. Set a room number below to make it appear
            on that guest&apos;s page immediately. For guests who replied outside the site (phone,
            WhatsApp, in person), click their dot in an event column to cycle it through{" "}
            <strong className="text-maroon font-medium">pending → yes → no</strong> on their behalf.
          </div>

          <div className="overflow-x-auto border border-border rounded-sm bg-creamCard">
            <div
              className="grid text-sm tracking-[.14em] uppercase text-inkMuted bg-parchment border-b border-border"
              style={{ gridTemplateColumns: "200px 90px 140px 170px repeat(7,44px) 150px 80px 70px", minWidth: 1290 }}
            >
              <div className="px-3.5 py-2.5">Guest</div>
              <div className="px-3.5 py-2.5">Code</div>
              <div className="px-3.5 py-2.5">Group</div>
              <div className="px-3.5 py-2.5">Contact</div>
              {EVENT_KEYS.map((key) => (
                <div key={key} className="py-2.5 text-center" title={EVENT_MAP[key].name}>
                  {EVENT_SHORT[key]}
                </div>
              ))}
              <div className="px-3.5 py-2.5">Room</div>
              <div className="px-3.5 py-2.5">DJ Night</div>
              <div className="px-3.5 py-2.5">Details</div>
            </div>
            {shown.map((r) => (
              <div key={r.id}>
                <div
                  className="grid border-b border-[#F0E4D0] text-[15.5px] text-inkSoft items-center"
                  style={{ gridTemplateColumns: "200px 90px 140px 170px repeat(7,44px) 150px 80px 70px", minWidth: 1290 }}
                >
                  <div className="px-3.5 py-2.5">
                    {r.name}
                    <div className="text-[14.5px] text-inkMuted">{r.city || "—"}</div>
                  </div>
                  <div className="px-3.5 py-2.5 font-mono tracking-[.1em] text-maroon">{r.code}</div>
                  <div className="px-3.5 py-2.5 text-[15.5px] text-inkMuted">{r.group || "—"}</div>
                  <div className="px-3.5 py-2.5 text-[14.5px] text-inkMuted leading-snug">
                    <div>{r.phone || "—"}</div>
                    <div className="truncate">{r.email || "—"}</div>
                  </div>
                  {EVENT_KEYS.map((key) => {
                    if (!r.invited.includes(key)) {
                      return (
                        <div key={key} className="text-center" style={{ color: "rgba(55,42,32,.35)" }}>
                          –
                        </div>
                      );
                    }
                    const answer = r.events[key];
                    const label =
                      answer === "yes" ? "Yes" : answer === "no" ? "No" : "Pending";
                    return (
                      <button
                        key={key}
                        onClick={() => cycleEventAnswer(r, key)}
                        className="flex justify-center items-center bg-transparent border-none cursor-pointer p-2"
                        title={`${EVENT_MAP[key].name}: ${label} — click to change (records the RSVP on their behalf)`}
                      >
                        <span
                          className="inline-block rounded-full"
                          style={{
                            width: 10,
                            height: 10,
                            background: answer === "yes" ? "#4E7A3A" : answer === "no" ? "#8A3B2A" : "transparent",
                            border: answer ? "none" : "1.5px solid #C9AE80",
                          }}
                        />
                      </button>
                    );
                  })}
                  <div className="px-3.5 py-2.5">
                    {editingRoom === r.id ? (
                      <div className="flex flex-col gap-1">
                        <input
                          value={roomDraft.number}
                          onChange={(e) => setRoomDraft((d) => ({ ...d, number: e.target.value }))}
                          placeholder="Room #"
                          className="px-2 py-1 border border-borderInput rounded-[2px] text-[13px]"
                        />
                        <input
                          value={roomDraft.roomType}
                          onChange={(e) => setRoomDraft((d) => ({ ...d, roomType: e.target.value }))}
                          placeholder="Type"
                          className="px-2 py-1 border border-borderInput rounded-[2px] text-[13px]"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveRoom(r.id)}
                            className="px-2 py-1 bg-maroon text-cream text-[12px] rounded-[2px] border-none cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRoom(null)}
                            className="px-2 py-1 bg-transparent border border-borderInput text-[12px] rounded-[2px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditRoom(r)}
                        className="text-left bg-transparent border-none cursor-pointer text-[15.5px] text-inkSoft p-0 underline decoration-dotted"
                      >
                        {r.room ? `${r.room.number} · ${r.room.type.slice(0, 18)}` : "Add room"}
                      </button>
                    )}
                  </div>
                  <div className="px-3.5 py-2.5">
                    <button
                      onClick={() => toggleDj(r)}
                      className="px-2.5 py-1.5 rounded-[2px] border text-[13px] tracking-[.1em] uppercase cursor-pointer"
                      style={{
                        borderColor: r.djOn ? "#443078" : "#C9AE80",
                        background: r.djOn ? "#443078" : "transparent",
                        color: r.djOn ? "#FBF4EA" : "#3B2B21",
                      }}
                    >
                      {r.djOn ? "On list" : "Add"}
                    </button>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <button
                      onClick={() => setExpanded((id) => (id === r.id ? null : r.id))}
                      className="text-left bg-transparent border-none cursor-pointer text-[13.5px] tracking-[.1em] uppercase text-maroon p-0 underline decoration-dotted"
                    >
                      {expanded === r.id ? "Hide" : "View"}
                    </button>
                  </div>
                </div>
                {expanded === r.id && (
                  <div className="border-b border-[#F0E4D0] bg-parchment px-5 py-4 text-[15px] text-inkSoft">
                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}
                    >
                      <div>
                        <div className="text-sm tracking-[.14em] uppercase text-inkMuted mb-1">Meal</div>
                        <div>{r.meal || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm tracking-[.14em] uppercase text-inkMuted mb-1">Arrival</div>
                        <div>{r.arrival || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm tracking-[.14em] uppercase text-inkMuted mb-1">Departure</div>
                        <div>{r.departure || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm tracking-[.14em] uppercase text-inkMuted mb-1">Travel help</div>
                        <div>{r.transport || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm tracking-[.14em] uppercase text-inkMuted mb-1">Submitted</div>
                        <div>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}</div>
                      </div>
                    </div>
                    {r.message && (
                      <div className="mt-3.5 pt-3.5 border-t border-border">
                        <div className="text-sm tracking-[.14em] uppercase text-inkMuted mb-1">Message</div>
                        <div className="leading-relaxed">{r.message}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3.5 text-[15.5px] text-inkMuted">
            {shown.length} of {rows.length} guests
            {rows.length > 300 ? ", showing the first 300" : ""}
          </div>
        </div>
      )}
    </AdminGate>
  );
}
