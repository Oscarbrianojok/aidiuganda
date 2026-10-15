create table if not exists public.aidi_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_aidi_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.aidi_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_aidi_admin() from public;
grant execute on function public.is_aidi_admin() to anon, authenticated;
grant usage on schema public to anon, authenticated;

create table if not exists public.site_content (
  content_key text primary key,
  value text not null,
  content_type text not null check (content_type in ('text', 'image', 'image_alt')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  excerpt text not null check (char_length(excerpt) between 1 and 600),
  body text not null check (char_length(body) between 1 and 12000),
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.donation_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.aidi_admins enable row level security;
alter table public.site_content enable row level security;
alter table public.stories enable row level security;
alter table public.contact_messages enable row level security;
alter table public.donation_requests enable row level security;

drop policy if exists "Admins can view their own admin record" on public.aidi_admins;
create policy "Admins can view their own admin record"
  on public.aidi_admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
  on public.site_content for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
  on public.site_content for all to authenticated
  using (public.is_aidi_admin()) with check (public.is_aidi_admin());

drop policy if exists "Public can read published stories" on public.stories;
create policy "Public can read published stories"
  on public.stories for select to anon, authenticated using (published = true);
drop policy if exists "Admins can manage stories" on public.stories;
create policy "Admins can manage stories"
  on public.stories for all to authenticated
  using (public.is_aidi_admin()) with check (public.is_aidi_admin());

drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
  on public.contact_messages for insert to anon, authenticated
  with check (
    char_length(trim(name)) between 1 and 120
    and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    and char_length(trim(message)) between 1 and 5000
    and status = 'new'
  );
drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
  on public.contact_messages for all to authenticated
  using (public.is_aidi_admin()) with check (public.is_aidi_admin());

drop policy if exists "Public can submit donation requests" on public.donation_requests;
create policy "Public can submit donation requests"
  on public.donation_requests for insert to anon, authenticated
  with check (
    char_length(trim(name)) between 1 and 120
    and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    and char_length(trim(message)) between 1 and 5000
    and status = 'new'
  );
drop policy if exists "Admins can manage donation requests" on public.donation_requests;
create policy "Admins can manage donation requests"
  on public.donation_requests for all to authenticated
  using (public.is_aidi_admin()) with check (public.is_aidi_admin());

grant select on public.site_content, public.stories to anon, authenticated;
grant insert on public.contact_messages, public.donation_requests to anon, authenticated;
grant select, insert, update, delete on public.aidi_admins, public.site_content, public.stories,
  public.contact_messages, public.donation_requests to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-media');
drop policy if exists "Admins can upload site media" on storage.objects;
create policy "Admins can upload site media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_aidi_admin());
drop policy if exists "Admins can update site media" on storage.objects;
create policy "Admins can update site media"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and public.is_aidi_admin())
  with check (bucket_id = 'site-media' and public.is_aidi_admin());
drop policy if exists "Admins can delete site media" on storage.objects;
create policy "Admins can delete site media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and public.is_aidi_admin());
