-- Each game gets one emoji, shown on its tile instead of the first letter.
-- Null means "use the default for the game type", which the app picks.

alter table public.games
  add column emoji text check (emoji is null or char_length(emoji) between 1 and 8);

update public.games
set emoji = case name
  when 'Chess' then '♟️'
  when 'Yahtzee' then '🎲'
  when 'Codenames' then '🕵️'
end
where created_by is null
  and name in ('Chess', 'Yahtzee', 'Codenames');
