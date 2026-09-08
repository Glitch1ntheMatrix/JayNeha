/**
 * One-time / re-runnable import of data/guests.json into Supabase.
 *
 * Usage:
 *   1. Put your guest list at data/guests.json (same shape as the original
 *      export — see README for the expected fields).
 *   2. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
 *      set (in .env.local or exported in your shell).
 *   3. Run: npm run seed
 *
 * This is idempotent: it upserts by guest id, so re-running after editing
 * guests.json updates existing rows instead of duplicating them. It never
 * touches rsvp_responses, meal preference, or other fields guests have
 * already filled in themselves.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fall back to .env if present too
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import path from "path";

interface RawGuest {
  id: number;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  city?: string;
  relation?: string;
  group?: string;
  plusOne?: string;
  kids?: boolean;
  dietary?: string;
  events?: Partial<
    Record<
      "kirtan" | "bridalShower" | "mehendi" | "soiree" | "djNight" | "haldi" | "pheras",
      boolean
    >
  >;
  room?: { needs?: string; number?: string; type?: string; checkIn?: string };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), "data", "guests.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const guests: RawGuest[] = raw.guests || raw;

  if (!Array.isArray(guests) || guests.length === 0) {
    console.error("No guests found in data/guests.json");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const rows = guests.map((g) => ({
    id: g.id,
    name: g.name,
    code: String(g.code).toUpperCase(),
    email: g.email || null,
    phone: g.phone || null,
    city: g.city || null,
    relation: g.relation || null,
    group_name: g.group || null,
    plus_one: g.plusOne || null,
    kids: !!g.kids,
    dietary: g.dietary || null,
    invited_kirtan: !!g.events?.kirtan,
    invited_bridal_shower: !!g.events?.bridalShower,
    invited_mehendi: !!g.events?.mehendi,
    invited_soiree: !!g.events?.soiree,
    invited_dj_night: !!g.events?.djNight,
    invited_haldi: !!g.events?.haldi,
    invited_pheras: !!g.events?.pheras,
    room_number: g.room?.number || null,
    room_type: g.room?.type || null,
    room_check_in: g.room?.checkIn || null,
  }));

  console.log(`Upserting ${rows.length} guests...`);

  // Chunk to stay well under request size limits.
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("guests")
      .upsert(chunk, { onConflict: "id" });
    if (error) {
      console.error("Failed on chunk starting at", i, error);
      process.exit(1);
    }
    console.log(`  ...${Math.min(i + chunkSize, rows.length)}/${rows.length}`);
  }

  console.log("Done. Guest list is live in Supabase.");
}

main();
