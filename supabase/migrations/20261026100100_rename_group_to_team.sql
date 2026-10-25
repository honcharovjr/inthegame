-- The shared space of players is called a team, not a group.
-- Renames the tables, columns, helper functions, policies and indexes.
-- Also renames the unused session column team_no to side_no, because a "team"
-- is now a space of players and a side is one party inside a single game.
-- Function bodies are stored as text, so every function that mentioned the old
-- names is replaced below. Policies refer to functions and columns by id, so
-- they follow the renames by themselves.

alter table public.groups rename to teams;
alter table public.group_members rename to team_members;
alter table public.team_members rename column group_id to team_id;
alter table public.sessions rename column group_id to team_id;
alter table public.session_participants rename column team_no to side_no;

alter index public.group_members_profile_id_idx
  rename to team_members_profile_id_idx;
alter index public.sessions_group_id_played_at_idx
  rename to sessions_team_id_played_at_idx;

alter policy groups_select on public.teams rename to teams_select;
alter policy groups_update on public.teams rename to teams_update;
alter policy groups_delete on public.teams rename to teams_delete;
alter policy group_members_select on public.team_members
  rename to team_members_select;

alter function public.is_group_member(uuid) rename to is_team_member;
alter function public.shares_group_with(uuid) rename to shares_team_with;
alter function public.create_group(text) rename to create_team;
alter function public.join_group(text) rename to join_team;
alter function public.leave_group(uuid) rename to leave_team;

-- The parameter keeps its old name p_group_id. Postgres cannot rename the
-- parameter of a function that policies depend on, and nothing calls this
-- function by name, so only the body changes.
create or replace function public.is_team_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_group_id
      and profile_id = public.current_profile_id()
  )
$$;

-- True when the caller and the given profile share at least one team.
create or replace function public.shares_team_with(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members a
    join public.team_members b on a.team_id = b.team_id
    where a.profile_id = p_profile_id
      and b.profile_id = public.current_profile_id()
  )
$$;

-- A session is visible to its creator, its registered participants and the
-- members of its team.
create or replace function public.can_see_session(p_session_id uuid)
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
        or (s.team_id is not null and public.is_team_member(s.team_id))
        or exists (
          select 1 from public.session_participants sp
          where sp.session_id = s.id
            and sp.profile_id = public.current_profile_id()
        )
      )
  )
$$;

-- A profile is visible to itself, to members of a shared team and to
-- co-participants of a session the caller can see.
create or replace function public.can_see_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile_id = public.current_profile_id()
    or public.shares_team_with(p_profile_id)
    or exists (
      select 1 from public.session_participants sp
      where sp.profile_id = p_profile_id
        and public.can_see_session(sp.session_id)
    )
$$;

-- Create a team and make the caller its owner.
create or replace function public.create_team(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_team uuid;
begin
  if v_profile is null then
    raise exception 'Not signed in';
  end if;
  insert into public.teams (name, owner_id)
  values (p_name, v_profile)
  returning id into v_team;
  insert into public.team_members (team_id, profile_id, role)
  values (v_team, v_profile, 'owner');
  return v_team;
end;
$$;

-- Join a team by invite code. Returns the team id.
create or replace function public.join_team(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_team uuid;
begin
  if v_profile is null then
    raise exception 'Not signed in';
  end if;
  select id into v_team
  from public.teams
  where invite_code = p_code and invite_enabled;
  if v_team is null then
    raise exception 'Invite link is not valid';
  end if;
  insert into public.team_members (team_id, profile_id, role)
  values (v_team, v_profile, 'member')
  on conflict do nothing;
  return v_team;
end;
$$;

-- Leave a team. The owner cannot leave while other members remain.
-- An owner who is alone deletes the team by leaving (Assumption).
-- Dropped and created again, because the parameter name changes and nothing
-- depends on this function.
drop function public.leave_team(uuid);

create function public.leave_team(p_team_id uuid)
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
  from public.team_members
  where team_id = p_team_id and profile_id = v_profile;
  if v_role is null then
    raise exception 'Not a member of this team';
  end if;
  select count(*) into v_others
  from public.team_members
  where team_id = p_team_id and profile_id <> v_profile;
  if v_role = 'owner' and v_others > 0 then
    raise exception 'The owner cannot leave while other members remain';
  end if;
  delete from public.team_members
  where team_id = p_team_id and profile_id = v_profile;
  if v_others = 0 then
    delete from public.teams where id = p_team_id;
  end if;
end;
$$;

revoke execute on function public.leave_team(uuid) from public, anon;
grant execute on function public.leave_team(uuid) to authenticated;
