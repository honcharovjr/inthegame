-- Fix: inserting a row and reading it back in the same statement failed.
-- The select policies for guests and sessions called a function that looks
-- the row up again. That function cannot see a row created by the statement
-- that is still running, so "insert ... returning" was rejected.
-- The owner check now reads the row's own column first, which needs no
-- lookup. The function still decides everything else.

drop policy guests_select on public.guests;
create policy guests_select on public.guests
  for select to authenticated
  using (
    owner_id = public.current_profile_id()
    or public.can_see_guest(id)
  );

drop policy sessions_select on public.sessions;
create policy sessions_select on public.sessions
  for select to authenticated
  using (
    created_by = public.current_profile_id()
    or public.can_see_session(id)
  );
