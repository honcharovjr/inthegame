-- Helper functions, group functions and triggers.
-- Helpers are security definer with a fixed search_path, so RLS policies
-- can call them without recursing into the tables they protect.

create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and profile_id = public.current_profile_id()
  )
$$;

-- True when the caller and the given profile share at least one group.
create function public.shares_group_with(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.profile_id = p_profile_id
      and b.profile_id = public.current_profile_id()
  )
$$;

create function public.owns_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sessions
    where id = p_session_id
      and created_by = public.current_profile_id()
  )
$$;

-- A session is visible to its creator, its registered participants and
-- the members of its group.
create function public.can_see_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sessions s
    where s.id = p_session_id
      and (
        s.created_by = public.current_profile_id()
        or (s.group_id is not null and public.is_group_member(s.group_id))
        or exists (
          select 1 from public.session_participants sp
          where sp.session_id = s.id
            and sp.profile_id = public.current_profile_id()
        )
      )
  )
$$;

-- A profile is visible to itself, to members of a shared group and to
-- co-participants of a session the caller can see.
create function public.can_see_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile_id = public.current_profile_id()
    or public.shares_group_with(p_profile_id)
    or exists (
      select 1 from public.session_participants sp
      where sp.profile_id = p_profile_id
        and public.can_see_session(sp.session_id)
    )
$$;

-- A guest is visible to its owner and to anyone who can see a session
-- the guest took part in.
create function public.can_see_guest(p_guest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.guests g
      where g.id = p_guest_id
        and g.owner_id = public.current_profile_id()
    )
    or exists (
      select 1 from public.session_participants sp
      where sp.guest_id = p_guest_id
        and public.can_see_session(sp.session_id)
    )
$$;

-- Create a group and make the caller its owner.
create function public.create_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_group uuid;
begin
  if v_profile is null then
    raise exception 'Not signed in';
  end if;
  insert into public.groups (name, owner_id)
  values (p_name, v_profile)
  returning id into v_group;
  insert into public.group_members (group_id, profile_id, role)
  values (v_group, v_profile, 'owner');
  return v_group;
end;
$$;

-- Join a group by invite code. Returns the group id.
create function public.join_group(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_group uuid;
begin
  if v_profile is null then
    raise exception 'Not signed in';
  end if;
  select id into v_group
  from public.groups
  where invite_code = p_code and invite_enabled;
  if v_group is null then
    raise exception 'Invite link is not valid';
  end if;
  insert into public.group_members (group_id, profile_id, role)
  values (v_group, v_profile, 'member')
  on conflict do nothing;
  return v_group;
end;
$$;

-- Leave a group. The owner cannot leave while other members remain.
-- An owner who is alone deletes the group by leaving (Assumption).
create function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_role text;
  v_others integer;
begin
  select role into v_role
  from public.group_members
  where group_id = p_group_id and profile_id = v_profile;
  if v_role is null then
    raise exception 'Not a member of this group';
  end if;
  select count(*) into v_others
  from public.group_members
  where group_id = p_group_id and profile_id <> v_profile;
  if v_role = 'owner' and v_others > 0 then
    raise exception 'The owner cannot leave while other members remain';
  end if;
  delete from public.group_members
  where group_id = p_group_id and profile_id = v_profile;
  if v_others = 0 then
    delete from public.groups where id = p_group_id;
  end if;
end;
$$;

-- Create a profile whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nickname text;
begin
  v_nickname := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
      split_part(new.email, '@', 1)
    ),
    30
  );
  if char_length(v_nickname) < 2 then
    v_nickname := 'Player';
  end if;
  insert into public.profiles (user_id, nickname)
  values (new.id, v_nickname);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- Only signed-in users call these functions.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.current_profile_id(),
  public.is_group_member(uuid),
  public.shares_group_with(uuid),
  public.owns_session(uuid),
  public.can_see_session(uuid),
  public.can_see_profile(uuid),
  public.can_see_guest(uuid),
  public.create_group(text),
  public.join_group(text),
  public.leave_group(uuid)
to authenticated;
