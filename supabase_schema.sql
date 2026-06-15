-- 1. Create the media table (if not exists) and add story column
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  type text not null, -- 'image' or 'video'
  size bigint not null,
  captured_at timestamptz not null,
  bucket_path text not null,
  created_at timestamptz default now()
);

-- Add story column if it doesn't exist
alter table public.media add column if not exists story text;

-- Enable Row Level Security (RLS) on public.media
alter table public.media enable row level security;

-- Create policy to allow public select access
create policy "Allow public read access to media"
  on public.media for select using (true);

-- Create policy to allow public update (to write/edit stories on photos)
create policy "Allow public update access to media"
  on public.media for update using (true) with check (true);


-- 2. Create the poems table
create table if not exists public.poems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text not null, -- 'acrostic' or 'poem'
  created_at timestamptz default now()
);

alter table public.poems enable row level security;

create policy "Allow public read access to poems"
  on public.poems for select using (true);

create policy "Allow public insert access to poems"
  on public.poems for insert with check (true);


-- 3. Create the love stories table
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.stories enable row level security;

create policy "Allow public read access to stories"
  on public.stories for select using (true);

create policy "Allow public insert access to stories"
  on public.stories for insert with check (true);


-- 4. Create the Yucatan map pins table
create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text, -- the story of the visit
  lat double precision not null,
  lng double precision not null,
  date date,
  media_id uuid references public.media(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.pins enable row level security;

create policy "Allow public read access to pins"
  on public.pins for select using (true);

create policy "Allow public insert access to pins"
  on public.pins for insert with check (true);

create policy "Allow public delete access to pins"
  on public.pins for delete using (true);


-- 5. Create the time capsules table
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  unlock_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.capsules enable row level security;

create policy "Allow public read access to capsules"
  on public.capsules for select using (true);

create policy "Allow public insert access to capsules"
  on public.capsules for insert with check (true);


-- 6. Ensure public storage policies
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Allow public read access to media bucket"
  on storage.objects for select using (bucket_id = 'media');

insert into storage.buckets (id, name, public)
values ('musica', 'musica', true)
on conflict (id) do nothing;

create policy "Allow public read access to musica bucket"
  on storage.objects for select using (bucket_id = 'musica');

