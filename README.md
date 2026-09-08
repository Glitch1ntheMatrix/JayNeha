# Neha & Jay — Wedding RSVP

A guest RSVP site: invite-code login, per-event invitations with attire guides,
RSVP that stays editable up to the deadline, room details that appear
automatically once a host enters them, and a password-protected Hosts' view
for managing guests, DJ Night list, and CSV export.

Built with Next.js (App Router, TypeScript), Supabase (Postgres), and
deployed on Vercel.

## Architecture

- **Guests never talk to Supabase directly.** All reads/writes go through
  Next.js API routes (`app/api/**`) using the Supabase **service role** key,
  which only ever lives on the server. The browser never sees your database
  credentials or the full guest list.
- **Guest sessions** are signed JWT cookies (httpOnly) containing just a
  guest id — created after validating an invite code against the `guests`
  table.
- **Admin/host sessions** are a separate signed cookie, created after
  checking a password against the `ADMIN_PASSWORD` environment variable
  server-side. The password is never shipped to the browser.
- **Room details** go live for a guest automatically the moment a host sets
  a room number for them in the Hosts' view — no separate "reveal" step.

## Local development

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your
     Supabase project's Settings → API page.
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`.
   - `ADMIN_PASSWORD` — the Hosts' view password.
3. Run the migration in `supabase/migrations/0001_init.sql` against your
   Supabase project (via the SQL editor, or `supabase db push` if you use
   the CLI).
4. Put your guest list at `data/guests.json` (same shape as the original
   export: `{ guests: [{ id, name, code, email, phone, city, relation,
   group, plusOne, kids, dietary, events: {...}, room: {...} }, ...] }`).
   This file is gitignored — it's for local seeding only.
5. Seed the database:
   ```
   npm run seed
   ```
6. Run the app:
   ```
   npm run dev
   ```

## Deploying

1. Push this repo to GitHub (already done if you're reading this from the
   repo).
2. Import the repo into Vercel.
3. In Vercel's Project Settings → Environment Variables, set the same
   variables as `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `ADMIN_PASSWORD`,
   `RSVP_DEADLINE`, `NEXT_PUBLIC_SHOW_ROOM_SECTION`).
4. Deploy. Re-run `npm run seed` locally any time you need to add or update
   guests in bulk — it's idempotent (upserts by id) and never touches RSVP
   answers guests have already submitted.

## Managing the wedding

- **Hosts' view**: visit `/admin`, enter the shared password. From there
  you can search/filter guests, toggle the DJ Night list per guest, set
  room numbers (which immediately appear on that guest's page), copy every
  name + invite code to your clipboard, and export a full CSV.
- **Adding guests after launch**: edit `data/guests.json` and re-run
  `npm run seed`, or insert rows directly in the Supabase table editor.
- **Security note**: `data/guests.json` contains real phone numbers and
  emails and is gitignored on purpose — never commit it.
