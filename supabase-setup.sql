-- Run this in your Supabase SQL editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Evolutions table
create table if not exists evolutions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  element     text not null check (element in ('water', 'fire', 'wind')),
  tier        text not null check (tier in ('starter', 'evolved', 'champion', 'legendary')),
  pet_image_url    text not null,
  joKemon_image_url text not null,
  video_url   text,
  nickname    text
);

-- Enable Row Level Security (public read, no auth required for inserts)
alter table evolutions enable row level security;

create policy "Public read evolutions"
  on evolutions for select using (true);

create policy "Public insert evolutions"
  on evolutions for insert with check (true);

-- Storage bucket for pet photos
insert into storage.buckets (id, name, public)
values ('pokepet', 'pokepet', true)
on conflict do nothing;

create policy "Public read pokepet"
  on storage.objects for select
  using (bucket_id = 'pokepet');

create policy "Public upload pokepet"
  on storage.objects for insert
  with check (bucket_id = 'pokepet');
