-- Sessions are managed in their team, or in personal when logged without a
-- team, and never move between them. update_session now refuses an edit
-- that changes the team. Everything else is as in 20261028120000.

create or replace function public.update_session(
  p_session_id uuid,
  p_game_id uuid,
  p_result_type text,
  p_participants jsonb,
  p_team_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_count integer;
  v_item jsonb;
  v_profile_id uuid;
  v_guest_id uuid;
  v_place integer;
begin
  if v_profile is null then
    raise exception 'Not signed in';
  end if;
  if not exists (
    select 1 from public.sessions
    where id = p_session_id and created_by = v_profile
  ) then
    raise exception 'Only the player who logged a session can edit it';
  end if;
  -- A session stays in the team it was logged in, or stays personal.
  if exists (
    select 1 from public.sessions
    where id = p_session_id and team_id is distinct from p_team_id
  ) then
    raise exception 'A session cannot move to another team';
  end if;
  if jsonb_typeof(p_participants) is distinct from 'array' then
    raise exception 'Participants must be a list';
  end if;
  v_count := jsonb_array_length(p_participants);
  if v_count < 1 then
    raise exception 'A session needs at least one participant';
  end if;
  if p_team_id is not null and not public.is_team_member(p_team_id) then
    raise exception 'You are not a member of this team';
  end if;

  update public.sessions
  set game_id = p_game_id,
      team_id = p_team_id,
      result_type = p_result_type,
      updated_at = now()
  where id = p_session_id;

  delete from public.session_participants where session_id = p_session_id;

  for v_item in select value from jsonb_array_elements(p_participants) loop
    v_profile_id := nullif(v_item ->> 'profile_id', '')::uuid;
    v_guest_id := nullif(v_item ->> 'guest_id', '')::uuid;
    v_place := (v_item ->> 'place')::integer;

    if v_profile_id is not null and v_profile_id <> v_profile and not (
      p_team_id is not null and exists (
        select 1 from public.team_members
        where team_id = p_team_id and profile_id = v_profile_id
      )
    ) then
      raise exception 'Only you and your teammates can take part as registered players';
    end if;
    if v_guest_id is not null and not exists (
      select 1 from public.guests
      where id = v_guest_id and owner_id = v_profile
    ) then
      raise exception 'Unknown guest';
    end if;
    if v_place < 1 or v_place > v_count then
      raise exception 'Place out of range';
    end if;
    if p_result_type = 'points' and (v_item ->> 'score') is null then
      raise exception 'A score is required for each participant';
    end if;

    insert into public.session_participants
      (session_id, profile_id, guest_id, place, score)
    values (
      p_session_id,
      v_profile_id,
      v_guest_id,
      v_place,
      nullif(v_item ->> 'score', '')::numeric
    );
  end loop;

  return p_session_id;
end;
$$;

