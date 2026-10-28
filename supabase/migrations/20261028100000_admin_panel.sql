-- Admin panel (change C15): a super admin flag on profiles and a log of
-- admin actions. Admin pages check the flag on the server and then use the
-- service role, so no client policy grants admins extra rows.

alter table public.profiles
  add column is_super_admin boolean not null default false;

-- Players may only change their own nickname, avatar and character. Without
-- this, the self-update policy would let anyone make themselves an admin.
revoke update on public.profiles from authenticated;
grant update (nickname, avatar_url, character) on public.profiles to authenticated;

create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_super_admin from public.profiles where user_id = auth.uid()),
    false
  )
$$;

revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- One row per admin action: what was done, by whom, to what.
create table public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null check (char_length(action) between 1 and 60),
  target_type text not null check (target_type in ('game', 'profile')),
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_created_at_idx on public.admin_audit (created_at desc);

alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon;

-- Super admins can read the log. Rows are written server-side only.
create policy admin_audit_select on public.admin_audit
  for select to authenticated
  using (public.is_super_admin());

grant select on public.admin_audit to authenticated;
grant all on public.admin_audit to service_role;
