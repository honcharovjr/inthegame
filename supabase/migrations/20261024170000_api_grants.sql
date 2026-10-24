-- Data API access. New tables are not reachable through the Data API until
-- privileges are granted. Grants are the outer gate and match the policies:
-- Row Level Security still decides which rows each user sees.
-- Anonymous users get nothing.

grant usage on schema public to authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.guests to authenticated;
grant select, insert, update, delete on public.games to authenticated;
grant select, update, delete on public.groups to authenticated;
grant select on public.group_members to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, update, delete on public.session_participants to authenticated;
grant select on public.ratings to authenticated;
grant select on public.rating_history to authenticated;

-- Server-side code uses the service role key, for example to write ratings.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
