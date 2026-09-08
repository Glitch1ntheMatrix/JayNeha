"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EVENT_MAP } from "@/lib/events";
import { EventKey } from "@/lib/types";

interface AdminRow {
  id: number;
  name: string;
  city: string | null;
  code: string;
  group: string | null;
  phone: string | null;
  email: string | null;
  invited: EventKey[];
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

interface Stats {
  guests: number;
  kirtan: number;
  mehendi: number;
  soiree: number;
  haldi: number;
  pheras: number;
  djNight: number;
  roomsHeld: number;
}

type LockState = "checking" | "locked" | "open";

export default function AdminApp() {
  const [lock, setLock] = useState<LockState>("checking");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [roomDraft, setRoomDraft] = useState({ number: "", roomType: "", checkIn: "" });
  const [roomsRevealed, setRoomsRevealed] = useState(false);
  const [roomsRevealedLoaded, setRoomsRevealedLoaded] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  async function loadGuests() {
    const res = await fetch("/api/admin/guests");
    if (res.status === 401) {
      setLock("locked");
      return;
    }
    const data = await res.json();
    setRows(data.rows || []);
    setStats(data.stats || null);
    setLock("open");
    loadRoomsRevealed();
  }

  async function loadRoomsRevealed() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setRoomsRevealed(Boolean(data.roomsRevealed));
    }
    setRoomsRevealedLoaded(true);
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

  useEffect(() => {
    loadGuests();
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
    loadGuests();
  }

  async function toggleDj(row: AdminRow) {
    const nextOn = !row.djOn;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, djOn: nextOn } : r)));
    await fetch(`/api/admin/guests/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "dj", on: nextOn }),
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

  if (lock === "checking") {
    return <div className="min-h-screen bg-cream" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[1400px] mx-auto px-[22px] pt-6 md:pt-[clamp(24px,4vw,52px)] pb-20">
        <div className="flex items-baseline gap-4 flex-wrap mb-7">
          <h1 className="font-display text-[30px] text-maroon font-normal m-0">Hosts&apos; view</h1>
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

        {lock === "open" && stats && (
          <div>
            {roomsRevealedLoaded && (
              <div className="mb-6 flex items-center gap-4 px-4 py-3.5 bg-parchment border border-border rounded-sm">
                <button
                  onClick={toggleRoomsRevealed}
                  role="switch"
                  aria-checked={roomsRevealed}
                  className="relative shrink-0 w-11 h-6 rounded-full border cursor-pointer transition-colors"
                  style={{
                    background: roomsRevealed ? "#7A0C22" : "transparent",
                    borderColor: roomsRevealed ? "#7A0C22" : "#C9AE80",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-cream transition-all"
                    style={{ left: roomsRevealed ? "22px" : "2px" }}
                  />
                </button>
                <div>
                  <div className="text-[15.5px] text-inkSoft font-medium">
                    Reveal room details to guests
                  </div>
                  <div className="text-[14px] text-inkMuted">
                    {roomsRevealed
                      ? "Guests with a room assigned now see their room number and type."
                      : "Guests see a \u201cwe'll share room details soon\u201d placeholder instead of their room number."}
                  </div>
                </div>
              </div>
            )}
            <div
              className="grid gap-3.5 mb-6"
              style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}
            >
              {[
                { label: "Guests", value: stats.guests },
                { label: "Kirtan", value: stats.kirtan },
                { label: "Mehendi", value: stats.mehendi },
                { label: "Soiree", value: stats.soiree },
                { label: "Haldi", value: stats.haldi },
                { label: "Pheras", value: stats.pheras },
                { label: "DJ Night", value: stats.djNight },
                { label: "Rooms held", value: stats.roomsHeld },
              ].map((s) => (
                <div key={s.label} className="bg-creamCard border border-border rounded-sm px-4 py-4">
                  <div className="font-display text-2xl text-maroon leading-none">{s.value}</div>
                  <div className="text-sm tracking-[.14em] uppercase text-inkMuted mt-1.5">{s.label}</div>
                </div>
              ))}
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
              on that guest&apos;s page immediately.
            </div>

            <div className="overflow-x-auto border border-border rounded-sm bg-creamCard">
              <div
                className="grid text-sm tracking-[.14em] uppercase text-inkMuted bg-parchment border-b border-border"
                style={{ gridTemplateColumns: "200px 90px 150px 190px 230px 100px 170px 90px 80px", minWidth: 1300 }}
              >
                <div className="px-3.5 py-2.5">Guest</div>
                <div className="px-3.5 py-2.5">Code</div>
                <div className="px-3.5 py-2.5">Group</div>
                <div className="px-3.5 py-2.5">Contact</div>
                <div className="px-3.5 py-2.5">Invited to</div>
                <div className="px-3.5 py-2.5">RSVP</div>
                <div className="px-3.5 py-2.5">Room</div>
                <div className="px-3.5 py-2.5">DJ Night</div>
                <div className="px-3.5 py-2.5">Details</div>
              </div>
              {shown.map((r) => (
                <div key={r.id}>
                <div
                  className="grid border-b border-[#F0E4D0] text-[15.5px] text-inkSoft items-center"
                  style={{ gridTemplateColumns: "200px 90px 150px 190px 230px 100px 170px 90px 80px", minWidth: 1300 }}
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
                  <div className="px-3.5 py-2.5 text-[15px] text-inkMuted">
                    {r.invited.map((k) => EVENT_MAP[k].name).join(" · ") || "—"}
                  </div>
                  <div className="px-3.5 py-2.5 text-[15px]" style={{ color: r.answered ? "#4E7A3A" : "#6B3D08" }}>
                    {r.answered ? `${r.answered} answered` : "waiting"}
                  </div>
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
      </div>
    </div>
  );
}
