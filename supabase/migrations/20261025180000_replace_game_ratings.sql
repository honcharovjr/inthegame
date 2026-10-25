-- Replaces all ratings of one game in a single transaction. Ratings are derived
-- data: server code recomputes them by replaying the sessions of the game
-- (see src/lib/rating) and hands the result to this function.
-- Only the service role may call it, so clients can never write ratings.
--
-- p_ratings: [{ profile_id | guest_id, rating, games_count }]
-- p_history: [{ session_id, profile_id | guest_id, rating_before, rating_after }]

create function public.replace_game_ratings(
  p_game_id uuid,
  p_ratings jsonb,
  p_history jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rating_history where game_id = p_game_id;
  delete from public.ratings where game_id = p_game_id;

  insert into public.ratings (game_id, profile_id, guest_id, rating, games_count)
  select
    p_game_id,
    nullif(item ->> 'profile_id', '')::uuid,
    nullif(item ->> 'guest_id', '')::uuid,
    (item ->> 'rating')::numeric,
    (item ->> 'games_count')::integer
  from jsonb_array_elements(p_ratings) as item;

  insert into public.rating_history
    (session_id, game_id, profile_id, guest_id, rating_before, rating_after)
  select
    (item ->> 'session_id')::uuid,
    p_game_id,
    nullif(item ->> 'profile_id', '')::uuid,
    nullif(item ->> 'guest_id', '')::uuid,
    (item ->> 'rating_before')::numeric,
    (item ->> 'rating_after')::numeric
  from jsonb_array_elements(p_history) as item;
end;
$$;

revoke execute on function public.replace_game_ratings(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_game_ratings(uuid, jsonb, jsonb)
  to service_role;
