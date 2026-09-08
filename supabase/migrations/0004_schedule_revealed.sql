-- Mirrors rooms_revealed: a host-controlled switch for whether guests can
-- see the "Your schedule / Where to be, and when" section on their page.

alter table app_settings add column if not exists schedule_revealed boolean not null default false;
