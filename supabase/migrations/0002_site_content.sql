-- Editable footer/intro copy (Getting there, Where to stay, Our story, Family
-- helpline) so this text can be updated from the Hosts' view without a code
-- change. The app always has hardcoded defaults, so this table is optional —
-- rows here simply override the defaults for guests.

create table if not exists site_content (
  key         text primary key,
  title       text not null default '',
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

alter table site_content enable row level security;
-- No policies: only the service role (used by our server-side API routes)
-- can read or write this table.

insert into site_content (key, title, body) values
  ('getting_there', 'Getting there',
   E'The Mumbai events sit within the city: Iskon Temple at Chowpatty, Soho Club in Juhu, and Karl Residency in Andheri. Allow extra time for evening traffic.\n\nIkshana Resort, Lonavala is about two and a half hours from Mumbai by road. Tell us in the form above if you would like help with travel.'),
  ('where_to_stay', 'Where to stay',
   E'Rooms for the 11th and 12th are held for guests travelling to Lonavala. If a room is reserved for you, the details appear on this page once you sign in.\n\nCheck in from the afternoon of 11 December, check out on the 13th.'),
  ('our_story', 'Our story',
   E'It started in Mumbai in January 2019. We spent four years in different time zones and learned that the distance never really changed how we felt.\n\nThe years since have been spent together, and they have been the happiest ones. This December we take the next step and marry, with the blessings of everyone we hold dear.'),
  ('family_helpline', 'Amit Chandak', '+91 90225 22149')
on conflict (key) do nothing;
