-- Tracks whether a host has actioned/resolved a guest's message, so the
-- dashboard's Messages section can separate open messages from resolved ones.

alter table guests add column if not exists message_actioned boolean not null default false;
