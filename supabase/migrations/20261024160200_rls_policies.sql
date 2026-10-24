-- Row Level Security on every table. Nothing is open to anonymous users.
-- "No policy" for a command means that command is denied to clients.

alter table public.profiles enable row level security;
alter table public.guests enable row level security;
alter table public.games enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_history enable row level security;

revoke all on
  public.profiles, public.guests, public.games, public.groups,
  public.group_members, public.sessions, public.session_participants,
  public.ratings, public.rating_history
from anon;

-- profiles: created by the sign-up trigger, never deleted by clients.
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.can_see_profile(id));
create policy profiles_update on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- guests
create policy guests_select on public.guests
  for select to authenticated
  using (public.can_see_guest(id));
create policy guests_insert on public.guests
  for insert to authenticated
  with check (owner_id = public.current_profile_id());
create policy guests_update on public.guests
  for update to authenticated
  using (owner_id = public.current_profile_id())
  with check (owner_id = public.current_profile_id());
create policy guests_delete on public.guests
  for delete to authenticated
  using (owner_id = public.current_profile_id());

-- games: catalog games are read-only for clients. Custom games belong
-- to their author and are visible to the author's groups.
create policy games_select on public.games
  for select to authenticated
  using (
    created_by is null
    or created_by = public.current_profile_id()
    or public.shares_group_with(created_by)
  );
create policy games_insert on public.games
  for insert to authenticated
  with check (created_by = public.current_profile_id());
create policy games_update on public.games
  for update to authenticated
  using (created_by = public.current_profile_id())
  with check (created_by = public.current_profile_id());
create policy games_delete on public.games
  for delete to authenticated
  using (created_by = public.current_profile_id());

-- groups: created through create_group(), joined through join_group().
create policy groups_select on public.groups
  for select to authenticated
  using (public.is_group_member(id));
create policy groups_update on public.groups
  for update to authenticated
  using (owner_id = public.current_profile_id())
  with check (owner_id = public.current_profile_id());
create policy groups_delete on public.groups
  for delete to authenticated
  using (owner_id = public.current_profile_id());

-- group_members: read only. Changes go through create_group(),
-- join_group() and leave_group().
create policy group_members_select on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

-- sessions
create policy sessions_select on public.sessions
  for select to authenticated
  using (public.can_see_session(id));
create policy sessions_insert on public.sessions
  for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and (group_id is null or public.is_group_member(group_id))
  );
create policy sessions_update on public.sessions
  for update to authenticated
  using (created_by = public.current_profile_id())
  with check (
    created_by = public.current_profile_id()
    and (group_id is null or public.is_group_member(group_id))
  );
create policy sessions_delete on public.sessions
  for delete to authenticated
  using (created_by = public.current_profile_id());

-- session_participants: follow the parent session.
create policy session_participants_select on public.session_participants
  for select to authenticated
  using (public.can_see_session(session_id));
create policy session_participants_insert on public.session_participants
  for insert to authenticated
  with check (public.owns_session(session_id));
create policy session_participants_update on public.session_participants
  for update to authenticated
  using (public.owns_session(session_id))
  with check (public.owns_session(session_id));
create policy session_participants_delete on public.session_participants
  for delete to authenticated
  using (public.owns_session(session_id));

-- ratings and rating_history: read only. Written by server-side code
-- with the service role key.
create policy ratings_select on public.ratings
  for select to authenticated
  using (
    (profile_id is not null and public.can_see_profile(profile_id))
    or (guest_id is not null and public.can_see_guest(guest_id))
  );
create policy rating_history_select on public.rating_history
  for select to authenticated
  using (
    (profile_id is not null and public.can_see_profile(profile_id))
    or (guest_id is not null and public.can_see_guest(guest_id))
  );
