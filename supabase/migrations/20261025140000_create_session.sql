-- Saves a session and its participants in one transaction, so a failed save
-- never leaves half a session behind. Runs as the caller (security invoker),
-- so Row Level Security still applies to every insert.
--
-- p_participants is a JSON array of
--   { "profile_id": uuid | null, "guest_id": uuid | null, "place": int, "score": number | null }
-- In the MVP the only registered participant is the caller. Other
-- participants are guests owned by the caller.

create function public.create_session(
  p_game_id uuid,
  p_result_type text,
  p_participants jsonb,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_count integer;
  v_session uuid;
  v_item jsonb;
  v_profile_id uuid;
  v_guest_id uuid;
  v_place integer;
begin
  if v_profile is null then
    raise exception 'Not signed in';
  end if;
  if jsonb_typeof(p_participants) is distinct from 'array' then
    raise exception 'Participants must be a list';
  end if;
  v_count := jsonb_array_length(p_participants);
  if v_count < 1 then
    raise exception 'A session needs at least one participant';
  end if;

  insert into public.sessions (game_id, created_by, result_type, note)
  values (p_game_id, v_profile, p_result_type, p_note)
  returning id into v_session;

  for v_item in select value from jsonb_array_elements(p_participants) loop
    v_profile_id := nullif(v_item ->> 'profile_id', '')::uuid;
    v_guest_id := nullif(v_item ->> 'guest_id', '')::uuid;
    v_place := (v_item ->> 'place')::integer;

    if v_profile_id is not null and v_profile_id <> v_profile then
      raise exception 'Only you can take part as a registered player';
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
      v_session,
      v_profile_id,
      v_guest_id,
      v_place,
      nullif(v_item ->> 'score', '')::numeric
    );
  end loop;

  return v_session;
end;
$$;

revoke execute on function public.create_session(uuid, text, jsonb, text)
  from public, anon;
grant execute on function public.create_session(uuid, text, jsonb, text)
  to authenticated, service_role;
