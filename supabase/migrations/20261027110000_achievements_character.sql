-- Achievements and the character of a player (docs/achievements.md and
-- docs/character.md). The catalog is data, the rules live in src/lib/achievements/.
-- Earned achievements are written by the server only.

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  tier smallint not null check (tier between 1 and 3),
  sort_order smallint not null
);

create table public.user_achievements (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, achievement_id)
);

alter table public.profiles
  add column character jsonb
  check (character is null or jsonb_typeof(character) = 'object');

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy achievements_select on public.achievements
  for select to authenticated
  using (true);

-- Visible like the profile it belongs to. No insert, update or delete policy:
-- only the service role writes here.
create policy user_achievements_select on public.user_achievements
  for select to authenticated
  using (public.can_see_profile(profile_id));

grant select on public.achievements to authenticated;
grant select on public.user_achievements to authenticated;
grant all on public.achievements to service_role;
grant all on public.user_achievements to service_role;

insert into public.achievements (code, name, description, tier, sort_order) values
  ('first-game', 'First Game', 'Log your first session', 1, 1),
  ('regular', 'Regular', 'Play 10 sessions', 1, 2),
  ('table-veteran', 'Table Veteran', 'Play 50 sessions', 2, 3),
  ('centurion', 'Centurion', 'Play 100 sessions', 3, 4),
  ('first-win', 'First Win', 'Win a session', 1, 5),
  ('winners-circle', 'Winner''s Circle', 'Win 10 sessions', 2, 6),
  ('champion', 'Champion', 'Win 25 sessions', 2, 7),
  ('dynasty', 'Dynasty', 'Win 50 sessions', 3, 8),
  ('hot-hand', 'Hot Hand', 'Win 3 sessions in a row', 2, 9),
  ('on-fire', 'On Fire', 'Win 5 sessions in a row', 3, 10),
  ('comeback-kid', 'Comeback Kid', 'Win right after losing 3 sessions in a row', 2, 11),
  ('dead-heat', 'Dead Heat', 'Share first place in a tie', 1, 12),
  ('explorer', 'Explorer', 'Play 5 different games', 1, 13),
  ('globetrotter', 'Globetrotter', 'Play 10 different games', 2, 14),
  ('inventor', 'Inventor', 'Play a session of a custom game you created', 1, 15),
  ('jack-of-all-trades', 'Jack of All Trades', 'Win in 3 different games', 2, 16),
  ('master-of-one', 'Master of One', 'Win 10 sessions of the same game', 3, 17),
  ('not-alone', 'Not Alone', 'Play a session with another registered player', 1, 18),
  ('full-house', 'Full House', 'Play a session with 5 or more players', 1, 19),
  ('party-host', 'Party Host', 'Log 10 sessions that include a guest', 2, 20),
  ('crowd-pleaser', 'Crowd Pleaser', 'Play with 10 different people', 2, 21),
  ('team-player', 'Team Player', 'Log a session in a team', 1, 22),
  ('founder', 'Founder', 'Create a team', 1, 23),
  ('recruiter', 'Recruiter', 'Own a team with 4 or more members', 2, 24),
  ('team-champion', 'Team Champion', 'Lead a team of 3 or more after 10 team sessions', 3, 25),
  ('rising-star', 'Rising Star', 'Reach a rating of 1100 in a game with 3 rated sessions', 2, 26),
  ('elite', 'Elite', 'Reach a rating of 1300 in a game with 3 rated sessions', 3, 27),
  ('giant-slayer', 'Giant Slayer', 'Beat a player rated 200 or more above you', 3, 28),
  ('weekly-habit', 'Weekly Habit', 'Log a session in each of 4 weeks in a row', 2, 29),
  ('marathon', 'Marathon', 'Log 5 sessions in one day', 2, 30);
