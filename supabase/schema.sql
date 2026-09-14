-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- Anyone may read and publish; nobody except you (via the dashboard) can edit or delete.

create table public.games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text check (char_length(author) <= 60),
  data jsonb not null check (
    pg_column_size(data) < 32000
    and jsonb_typeof(data->'items') = 'array'
    and jsonb_array_length(data->'items') between 12 and 60
  ),
  image_path text not null check (image_path ~ '^[0-9a-f-]{36}\.(webp|png|jpeg)$')
);

alter table public.games enable row level security;
grant select, insert on public.games to anon, authenticated;
create policy "anyone can read" on public.games for select to anon, authenticated using (true);
create policy "anyone can publish" on public.games for insert to anon, authenticated with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 1048576, array['image/webp', 'image/png', 'image/jpeg']);

create policy "anyone can upload game images" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'images');
