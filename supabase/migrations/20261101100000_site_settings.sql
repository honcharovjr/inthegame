-- Site settings (change C31): the details the public pages show, such as who
-- runs the service on the privacy policy. One row, edited in the admin panel.

create table public.site_settings (
  id boolean primary key default true check (id),
  operator_name text check (char_length(operator_name) <= 120),
  contact_email text check (char_length(contact_email) <= 254),
  minimum_age smallint check (minimum_age between 13 and 21),
  privacy_updated_on date,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true);

alter table public.site_settings enable row level security;

-- Anyone, logged in or not, can read: the landing and privacy pages are public.
-- Rows are written server-side only.
create policy site_settings_select on public.site_settings
  for select to anon, authenticated
  using (true);

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

-- The admin log can now point at the settings.
alter table public.admin_audit drop constraint admin_audit_target_type_check;
alter table public.admin_audit
  add constraint admin_audit_target_type_check
  check (target_type in ('game', 'profile', 'settings'));
