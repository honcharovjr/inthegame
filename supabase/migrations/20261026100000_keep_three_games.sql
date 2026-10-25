-- One-off cleanup requested by the project author: keep only Chess, Yahtzee
-- and Codenames. Everything logged for any other game goes with it: ratings,
-- rating history, sessions and their participants. Guests stay. Not reversible.

delete from public.rating_history
where game_id in (
  select id from public.games where name not in ('Chess', 'Yahtzee', 'Codenames')
);

delete from public.ratings
where game_id in (
  select id from public.games where name not in ('Chess', 'Yahtzee', 'Codenames')
);

-- session_participants rows leave with their session (on delete cascade)
delete from public.sessions
where game_id in (
  select id from public.games where name not in ('Chess', 'Yahtzee', 'Codenames')
);

delete from public.games
where name not in ('Chess', 'Yahtzee', 'Codenames');
