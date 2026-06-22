-- File: supabase/migrations/20250921_admin_auth.sql
-- Purpose: Link admins to Supabase Auth (auth.users), fix/ensure RLS for admin access,
-- and upsert the admin row by email (requires the Auth user to exist first).

-- Create admins table if missing
create table if not exists public.admins (
  user_id uuid primary key,
  email text unique not null,
  display_name text,-- Secure RPC: validate admins.email + admins.admin_id and return minimal profile.
-- Requires public.admins with columns (user_id uuid, email text, admin_id text, display_name text, enabled bool).

create or replace function public.admin_login(email_in text, code_in text)
returns table (user_id uuid, email text, display_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select a.user_id,
         a.email,
         coalesce(a.display_name, 'Administrator') as display_name
  from public.admins a
  where lower(a.email) = lower(email_in)
    and a.admin_id = upper(code_in)
    and a.enabled = true
  limit 1;
end
$$;

-- Allow browser (anon) to execute this RPC; it returns a row only on correct credentials.
grant execute on function public.admin_login(text, text) to anon;

  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Point FK to auth.users (not public.users)
alter table public.admins
  drop constraint if exists admins_user_id_fkey;

alter table public.admins
  add constraint admins_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Enable RLS and allow admins to read their own admin row
alter table public.admins enable row level security;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read
on public.admins for select
using (auth.uid() = user_id);

-- Keep/ensure student-scoped interview access
drop policy if exists interviews_select_own on public.interviews;
create policy interviews_select_own
on public.interviews for select
using (user_id = auth.uid());

drop policy if exists interviews_update_own on public.interviews;
create policy interviews_update_own
on public.interviews for update
using (user_id = auth.uid());

-- Admin override: allow enabled admins to read/update all interviews
drop policy if exists interviews_admin_all on public.interviews;
create policy interviews_admin_all
on public.interviews for all
using (
  exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true)
)
with check (
  exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true)
);

-- Upsert admin row by looking up the Auth user by email (must already exist in Auth)
insert into public.admins (user_id, email, display_name, enabled)
select u.id, u.email, 'Administrator', true
from auth.users u
where lower(u.email) = lower('rsprangswamy@gamil.com')
on conflict (user_id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    enabled = excluded.enabled;
