-- Whether a session changes ratings (docs/rating.md section 5, change C23):
-- at least 2 participants and no guest. A computed field, so the history
-- can filter on it as sessions.rated. Runs as the caller, so Row Level
-- Security still decides which participants it sees.

create function public.rated(s public.sessions)
returns boolean
language sql
stable
set search_path = ''
as $$
  select count(*) >= 2 and bool_and(guest_id is null)
  from public.session_participants
  where session_id = s.id
$$;

revoke execute on function public.rated(public.sessions) from public, anon;
grant execute on function public.rated(public.sessions) to authenticated;
