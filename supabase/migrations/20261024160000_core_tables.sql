-- Core tables for the MVP, as described in docs/data-model.md.
-- Standard PostgreSQL only. Row Level Security is enabled in a later migration.

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  -- Null after the account is deleted: the profile stays, anonymized,
  -- so sessions of other players remain consistent.
  user_id uuid unique references auth.users (id) on delete set null,
  nickname text not null check (char_length(nickname) between 2 and 30),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text,
  type text not null
    check (type in ('board', 'card', 'dice', 'dominoes', 'party', 'other')),
  is_classic boolean not null default false,
  min_players smallint not null check (min_players >= 1),
  max_players smallint not null,
  typical_duration_min smallint check (typical_duration_min > 0),
  -- Null for catalog games, the author for custom games.
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  check (max_players >= min_players)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null references public.profiles (id),
  invite_code text not null unique
    default replace(gen_random_uuid()::text, '-', ''),
  invite_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id),
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id),
  created_by uuid not null references public.profiles (id),
  group_id uuid references public.groups (id) on delete set null,
  played_at timestamptz not null default now(),
  result_type text not null check (result_type in ('winner', 'ranking', 'points')),
  -- Only 'confirmed' in the MVP. Kept for the confirmation backlog.
  status text not null default 'confirmed' check (status in ('confirmed')),
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  profile_id uuid references public.profiles (id),
  guest_id uuid references public.guests (id),
  place smallint not null check (place >= 1),
  -- Only for result type 'points'. Enforced in application code and tests.
  score numeric,
  -- Only for team results. Null otherwise.
  team_no smallint,
  check ((profile_id is not null)::int + (guest_id is not null)::int = 1)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id),
  profile_id uuid references public.profiles (id),
  guest_id uuid references public.guests (id),
  rating numeric not null default 1000,
  games_count integer not null default 0 check (games_count >= 0),
  updated_at timestamptz not null default now(),
  check ((profile_id is not null)::int + (guest_id is not null)::int = 1)
);

create table public.rating_history (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  game_id uuid not null references public.games (id),
  profile_id uuid references public.profiles (id),
  guest_id uuid references public.guests (id),
  rating_before numeric not null,
  rating_after numeric not null,
  created_at timestamptz not null default now(),
  check ((profile_id is not null)::int + (guest_id is not null)::int = 1)
);

-- A player appears once per session, once per game rating.
create unique index session_participants_session_profile_key
  on public.session_participants (session_id, profile_id)
  where profile_id is not null;
create unique index session_participants_session_guest_key
  on public.session_participants (session_id, guest_id)
  where guest_id is not null;
create unique index ratings_game_profile_key
  on public.ratings (game_id, profile_id)
  where profile_id is not null;
create unique index ratings_game_guest_key
  on public.ratings (game_id, guest_id)
  where guest_id is not null;

-- Indexes for the frequent queries.
create index sessions_created_by_played_at_idx
  on public.sessions (created_by, played_at desc);
create index sessions_group_id_played_at_idx
  on public.sessions (group_id, played_at desc);
create index sessions_game_id_idx on public.sessions (game_id);
create index session_participants_profile_id_idx
  on public.session_participants (profile_id);
create index session_participants_guest_id_idx
  on public.session_participants (guest_id);
create index group_members_profile_id_idx on public.group_members (profile_id);
create index games_name_idx on public.games (name);
create index guests_owner_id_idx on public.guests (owner_id);
create index ratings_game_id_rating_idx on public.ratings (game_id, rating desc);
create index rating_history_profile_game_idx
  on public.rating_history (profile_id, game_id, created_at);
create index rating_history_guest_game_idx
  on public.rating_history (guest_id, game_id, created_at);
