-- Online games by invite (FR-45, change C22). A room is one game; its
-- players are the host and the invited teammates. Clients only read: every
-- write goes through the server routes in src/app/api/rooms/, which check
-- turns, roll the dice and write with the service role.

create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  game_key text not null check (game_key in ('yahtzee')),
  host_id uuid not null references public.profiles (id),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished', 'cancelled')),
  state jsonb,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_room_players (
  room_id uuid not null references public.game_rooms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  status text not null default 'invited'
    check (status in ('invited', 'joined', 'declined', 'left')),
  seat smallint check (seat between 0 and 5),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (room_id, profile_id)
);

-- Open invites and games of a player, for Home and Play.
create index game_room_players_profile_id_status_idx
  on public.game_room_players (profile_id, status);

create index game_rooms_host_id_idx on public.game_rooms (host_id);

-- True when the caller has a row in the room, whatever its status.
create function public.is_room_player(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_room_players
    where room_id = p_room_id
      and profile_id = public.current_profile_id()
  )
$$;

revoke execute on function public.is_room_player(uuid) from public, anon;
grant execute on function public.is_room_player(uuid) to authenticated;

alter table public.game_rooms enable row level security;
alter table public.game_room_players enable row level security;
revoke all on public.game_rooms from anon;
revoke all on public.game_room_players from anon;

create policy game_rooms_select on public.game_rooms
  for select to authenticated
  using (public.is_room_player(id));

create policy game_room_players_select on public.game_room_players
  for select to authenticated
  using (public.is_room_player(room_id));

grant select on public.game_rooms to authenticated;
grant select on public.game_room_players to authenticated;
grant all on public.game_rooms to service_role;
grant all on public.game_room_players to service_role;

-- Devices follow rooms and invites through Supabase Realtime, which applies
-- the select policies above to every change it sends.
alter publication supabase_realtime add table public.game_rooms;
alter publication supabase_realtime add table public.game_room_players;
