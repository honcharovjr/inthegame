# Data model: In the Game

Version 0.1, draft. Covers the MVP (phases P1 and P2). Items marked "Assumption" or listed in section 8 need a decision before migrations are written. No table or column outside this document is created without approval.

## 1. Principles

- Standard PostgreSQL only. All changes through files in `supabase/migrations/`
- Row Level Security enabled on every table, with explicit policies. No table is left open
- Primary keys are `uuid` with default `gen_random_uuid()`. Timestamps are `timestamptz`
- Rating tables are written by server-side code only (service role key). Clients can read, never write
- Ratings are derived data: they can always be rebuilt by replaying sessions (NFR-08)
- Lists are paginated, so frequent queries get indexes (section 6)

## 2. Overview

```
auth.users 1─1 profiles
profiles 1─* guests            (a guest is owned by the player who created it)
profiles 1─* games             (custom games only; catalog games have no owner)
games 1─* sessions
sessions 1─* session_participants ─> profiles OR guests
groups 1─* group_members ─> profiles
groups 1─* sessions            (optional link, for group history)
games + player 1─1 ratings
sessions + player 1─* rating_history
```

A participant is either a registered player or a guest, never both.

## 3. Tables

### 3.1 profiles

One row per registered user. `id` equals `auth.users.id`. Created by a trigger on sign-up (Assumption: trigger, not client code).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | References `auth.users(id)` on delete cascade |
| nickname | text, not null | 2 to 30 characters |
| avatar_url | text | Optional, points to Storage |
| created_at | timestamptz, not null | Default `now()` |

Account deletion (FR-05, Pilot): the row is anonymized, not removed, so sessions of other players stay consistent. Details in section 8.

### 3.2 guests

A participant with a name only (FR-03).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| owner_id | uuid, not null | References `profiles(id)` |
| name | text, not null | 1 to 30 characters |
| created_at | timestamptz, not null | Default `now()` |

Linking a guest to an account (FR-04) is P4 and not modelled now.

### 3.3 games

The catalog (FR-06) and custom games (FR-09).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, not null | |
| description | text | |
| type | text, not null | Check constraint on a fixed list, for example `board`, `card`, `dice`, `dominoes`, `party`, `other` (Assumption: list to be agreed) |
| is_classic | boolean, not null | Default false. True for games that need no box |
| min_players | smallint, not null | |
| max_players | smallint, not null | Check: not less than `min_players` |
| typical_duration_min | smallint | Optional |
| created_by | uuid | Null for catalog games, otherwise the author. References `profiles(id)` |
| created_at | timestamptz, not null | Default `now()` |

Catalog games are managed by the maintainer directly in the database. Duplicate names are warned about in the UI (US-B3), so there is no unique constraint on name.

### 3.4 groups

Minimal groups (FR-26).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, not null | |
| owner_id | uuid, not null | References `profiles(id)` |
| invite_code | text, not null, unique | Random, hard to guess |
| invite_enabled | boolean, not null | Default true. The owner can disable the link (US-G2) |
| created_at | timestamptz, not null | Default `now()` |

### 3.5 group_members

| Column | Type | Notes |
|---|---|---|
| group_id | uuid | References `groups(id)` on delete cascade |
| profile_id | uuid | References `profiles(id)` |
| role | text, not null | `owner` or `member` (check constraint) |
| joined_at | timestamptz, not null | Default `now()` |

Primary key: (`group_id`, `profile_id`). The owner also has a row with role `owner`. Joining by invite link goes through a server-side function that checks the code, so clients cannot insert themselves freely.

### 3.6 sessions

One recorded play (FR-10).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| game_id | uuid, not null | References `games(id)` |
| created_by | uuid, not null | References `profiles(id)` |
| group_id | uuid | Optional. References `groups(id)` (see section 8, question 1) |
| played_at | timestamptz, not null | Date and time of the play. Default `now()` |
| result_type | text, not null | `winner`, `ranking` or `points` (FR-11) |
| status | text, not null | `confirmed`, default `confirmed`. Kept for the backlog (spec section 9). Other values are added by a later migration |
| note | text | Optional, length limit 280 (FR-15) |
| created_at | timestamptz, not null | Default `now()` |
| updated_at | timestamptz, not null | Default `now()` |

Replay order for rating is `played_at`, then `created_at` (docs/rating.md section 5).

### 3.7 session_participants

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| session_id | uuid, not null | References `sessions(id)` on delete cascade |
| profile_id | uuid | References `profiles(id)` |
| guest_id | uuid | References `guests(id)` |
| place | smallint, not null | 1 is best. Equal places mean a tie. For `winner`: winner 1, others 2. For `points`: derived from score on save |
| score | numeric | Only for result type `points` |
| team_no | smallint | Only for team results (FR-12, P2, Should). Null otherwise (Assumption: plain number, no teams table) |

Constraints:

- Exactly one of `profile_id` and `guest_id` is set (check constraint)
- A player appears once per session: unique (`session_id`, `profile_id`) and unique (`session_id`, `guest_id`), each partial on not null
- `score` is required when the session `result_type` is `points`. Enforced in application code and tests, because a check constraint cannot see the parent row

### 3.8 ratings

Current rating per player per game. Written server-side only.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| game_id | uuid, not null | References `games(id)` |
| profile_id | uuid | References `profiles(id)` |
| guest_id | uuid | References `guests(id)` |
| rating | numeric, not null | Starts at 1000. Shown rounded |
| games_count | integer, not null | Rated sessions in this game. Leaderboards need at least 3 |
| updated_at | timestamptz, not null | |

Same exactly-one check as in `session_participants`. Unique (`game_id`, `profile_id`) and unique (`game_id`, `guest_id`), each partial.

### 3.9 rating_history

One row per rated participant per session. Feeds the progress chart (FR-20) and makes rebuilds checkable.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| session_id | uuid, not null | References `sessions(id)` on delete cascade |
| game_id | uuid, not null | References `games(id)` |
| profile_id | uuid | References `profiles(id)` |
| guest_id | uuid | References `guests(id)` |
| rating_before | numeric, not null | |
| rating_after | numeric, not null | |
| created_at | timestamptz, not null | |

Rebuilding a game deletes its `rating_history` rows and `ratings`, then replays its sessions.

## 4. Statistics

No stored statistics tables in the MVP. Games played, wins and win rate (docs/rating.md section 6) are computed by queries or SQL views over `session_participants`. The overall group leaderboard is ranked by wins and games played (docs/rating.md section 9, proposal). Revisit if queries become slow.

## 5. Access rules (Row Level Security)

Helper functions are `security definer` with a fixed `search_path`, so policies do not recurse: `is_group_member(group_id)` and `can_see_session(session_id)`.

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| profiles | Self, and members of a shared group | By sign-up trigger only | Self | None (anonymize, see section 8) |
| guests | Owner, and members of groups where the guest took part in a session | Owner (`owner_id` = caller) | Owner | Owner, if the guest has no sessions (Assumption) |
| games | Catalog games: any logged-in user. Custom games: author and members of the author's groups | Logged-in user, only as custom game with `created_by` = caller | Author, custom only | Author, custom only, if unused (Assumption) |
| groups | Members | Logged-in user, with `owner_id` = caller | Owner | Owner |
| group_members | Members of the same group | Server-side join function only | None | Self (leave), and owner for others (P4, FR-27) |
| sessions | Creator, participants, members of the session's group | Logged-in user, with `created_by` = caller | Creator | Creator |
| session_participants | Same as the parent session | Creator of the parent session | Creator of the parent session | Creator of the parent session |
| ratings | Same visibility as the player's profile or guest | Server-side only | Server-side only | Server-side only |
| rating_history | Same as `ratings` | Server-side only | Server-side only | Server-side only |

Notes:

- "Server-side only" means no client policy for that command. The service role key bypasses RLS and is never exposed to the browser
- After a session is edited or deleted, ratings of that game are rebuilt (docs/rating.md section 5)

## 6. Indexes

Added for the frequent queries. Everything else waits for evidence.

| Table | Index | Used by |
|---|---|---|
| sessions | (`created_by`, `played_at` desc) | Player history (US-C4) |
| sessions | (`group_id`, `played_at` desc) | Group history (US-G6) |
| sessions | (`game_id`) | Rating rebuild |
| session_participants | (`session_id`) | Session details |
| session_participants | (`profile_id`) | Player stats and history |
| session_participants | (`guest_id`) | Guest stats |
| group_members | (`profile_id`) | "My groups", RLS checks |
| games | (`name`) | Catalog search (US-B1). A trigram index is not needed at about 30 games (Assumption) |
| guests | (`owner_id`) | Participant picker |
| ratings | (`game_id`, `rating` desc) | Per-game leaderboard |
| rating_history | (`profile_id`, `game_id`, `created_at`) | Progress chart |

Suggestions for fast entry (FR-13), recent games and recent participants, are queries over `sessions` and `session_participants`. No extra table.

## 7. Later phases (not created now)

Listed so the MVP schema does not block them. Each needs its own approval and migration.

| Phase | Tables |
|---|---|
| P3 | `achievements`, `user_achievements`, character and customization items |
| P4 | Feed items (or a view over sessions and achievements), `reactions`, guest to account linking |
| Backlog | `teams`, team roles, session confirmations (FR-39 to FR-42) |

## 8. Open questions

1. **Session and group link.** Proposal: a session has one optional `group_id` chosen at creation. Alternative: a session is visible to every group that contains all its registered participants, with no column. The proposal is simpler and cheaper for RLS, but a session belongs to one group only. Decide
2. **Account deletion.** Proposal: set the nickname to a fixed placeholder, clear the avatar, delete the `auth.users` row, keep the `profiles` row. This needs `profiles.id` not to cascade from `auth.users`, or a separate delete flow. Decide before the Pilot phase
3. **Game types.** Confirm the list in 3.3, or give your own
4. **Team results (FR-12).** Is `team_no` on the participant enough for P2 (Assumption), or do you want a teams table now?
5. **Guest ratings.** Stored like any player (docs/rating.md, Assumption). Hiding them on leaderboards is a query filter, not a schema change
6. **Guest deletion.** Allowed only if the guest has no sessions (Assumption)
