-- Neha & Jay Wedding RSVP — initial schema
-- All access happens through server-side API routes using the Supabase
-- service role key, so Row Level Security stays enabled with no public
-- policies: nothing is reachable directly from the browser with the anon key.

create table if not exists guests (
  id                  bigint primary key,
  name                text not null,
  code                text not null unique,
  email               text,
  phone               text,
  city                text,
  relation            text,
  group_name          text,
  plus_one            text,
  kids                boolean not null default false,
  dietary             text,

  invited_kirtan        boolean not null default false,
  invited_bridal_shower boolean not null default false,
  invited_mehendi       boolean not null default false,
  invited_soiree        boolean not null default false,
  invited_dj_night      boolean not null default false,
  invited_haldi         boolean not null default false,
  invited_pheras        boolean not null default false,

  -- null = follow invited_dj_night; true/false = host override for the DJ Night guest list
  dj_night_override   boolean,

  room_number         text,
  room_type           text,
  room_check_in       text,

  meal_preference     text,
  arrival             text,
  departure           text,
  transport           text,
  message             text,
  rsvp_submitted_at   timestamptz,

  created_at          timestamptz not null default now()
);

create index if not exists guests_code_idx on guests (upper(code));

create table if not exists rsvp_responses (
  guest_id    bigint not null references guests(id) on delete cascade,
  event_key   text not null check (event_key in ('kirtan','bridalShower','mehendi','soiree','djNight','haldi','pheras')),
  answer      text not null check (answer in ('yes','no')),
  updated_at  timestamptz not null default now(),
  primary key (guest_id, event_key)
);

alter table guests enable row level security;
alter table rsvp_responses enable row level security;
-- No policies are created: only the service role (used exclusively by our
-- server-side API routes) can read or write these tables.
