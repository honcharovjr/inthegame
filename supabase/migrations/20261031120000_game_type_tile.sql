-- Game type 'dominoes' becomes 'tile' (change C28): it covers dominoes,
-- Mahjong, Rummikub and other tile games.

alter table public.games drop constraint games_type_check;

update public.games set type = 'tile' where type = 'dominoes';

alter table public.games
  add constraint games_type_check
  check (type in ('board', 'card', 'dice', 'tile', 'party', 'other'));
