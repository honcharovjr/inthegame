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
teams 1─* team_members ─> profiles
teams 1─* sessions            (optional link, for team history)
games + player 1─1 ratings
sessions + player 1─* rating_history
game_rooms 1─* game_room_players ─> profiles   (online games, FR-45)
```

A participant is either a registered player or a guest, never both.

## 3. Tables

### 3.1 profiles

One row per registered user. Created by a trigger on sign-up (Assumption: trigger, not client code).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | Own id, default `gen_random_uuid()` |
| user_id | uuid, unique | References `auth.users(id)` on delete set null. Null after the account is deleted |
| nickname | text, not null | 2 to 30 characters |
| avatar_url | text | Optional, points to Storage |
| character | jsonb | Optional. The chosen item codes of the character, see docs/character.md. Null means no character yet. Must be a JSON object |
| is_super_admin | boolean, not null | Default false. Opens the admin panel (FR-47). Set by the maintainer in the database, never by the player: players may update only `nickname`, `avatar_url`, `character` and `time_zone` (column grants) |
| time_zone | text, not null | IANA name, for example `Europe/Kyiv`. Default `UTC`. Set from the browser on login while still `UTC`, editable by the player (FR-55, change C25) |
| created_at | timestamptz, not null | Default `now()` |

Account deletion (FR-05, Pilot, Must): the auth user is deleted, `user_id` becomes null, and the row is anonymized (placeholder nickname, no avatar) instead of removed, so sessions of other players stay consistent.

### 3.2 guests

A participant with a name only (FR-03).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| owner_id | uuid, not null | References `profiles(id)` |
| name | text, not null | 1 to 30 characters |
| deleted_at | timestamptz | Set when the guest is deleted (FR-53, change C24). Hidden from pickers; history shows "deleted guest" |
| created_at | timestamptz, not null | Default `now()` |

Guests have no ratings (change C23). Linking a guest to an account (FR-04) is P4 and not modelled now; old sessions are not re-rated when it comes.

### 3.3 games

The catalog (FR-06) and custom games (FR-09).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, not null | |
| description | text | |
| type | text, not null | Check constraint on a fixed list, for example `board`, `card`, `dice`, `tile`, `party`, `other`. `tile` replaces `dominoes` (change C28); needs a migration |
| is_classic | boolean, not null | Default false. True for games that need no box |
| min_players | smallint, not null | |
| max_players | smallint, not null | Check: not less than `min_players` |
| typical_duration_min | smallint | Optional |
| emoji | text | Optional. One emoji for the game tile, up to 8 characters. Null means the app uses a default for the type |
| created_by | uuid | Null for catalog games, otherwise the author. References `profiles(id)` |
| deleted_at | timestamptz | Custom games only. Set when the game is deleted (FR-54, change C24): hidden from the catalog and log flow, its ratings and rating history are removed and it no longer counts in stats; its sessions stay in history |
| created_at | timestamptz, not null | Default `now()` |

Catalog games are managed by super admins in the admin panel (FR-47). Duplicate names are warned about in the UI (US-B3), so there is no unique constraint on name.

### 3.4 teams

Minimal teams (FR-26).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, not null | |
| owner_id | uuid, not null | References `profiles(id)` |
| invite_code | text, not null, unique | Random, hard to guess |
| invite_enabled | boolean, not null | Default true. The owner can disable the link (US-G2) |
| created_at | timestamptz, not null | Default `now()` |

### 3.5 team_members

| Column | Type | Notes |
|---|---|---|
| team_id | uuid | References `teams(id)` on delete cascade |
| profile_id | uuid | References `profiles(id)` |
| role | text, not null | `owner` or `member` (check constraint) |
| joined_at | timestamptz, not null | Default `now()` |

Primary key: (`team_id`, `profile_id`). The owner also has a row with role `owner`. Joining by invite link goes through a server-side function that checks the code, so clients cannot insert themselves freely.

### 3.6 sessions

One recorded play (FR-10).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| game_id | uuid, not null | References `games(id)` |
| created_by | uuid, not null | References `profiles(id)` |
| team_id | uuid | Optional, chosen at creation. References `teams(id)` |
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
| side_no | smallint | Only for results by side (FR-12, P2, Should). Null otherwise. Decided: a plain number, no table for sides |

Constraints:

- Exactly one of `profile_id` and `guest_id` is set (check constraint)
- A player appears once per session: unique (`session_id`, `profile_id`) and unique (`session_id`, `guest_id`), each partial on not null
- `place` must be at least 1
- `score` is required when the session `result_type` is `points`. Enforced in application code and tests, because a check constraint cannot see the parent row

### 3.8 ratings

Current rating per player per game. Written server-side only. Only registered players are rated; sessions with a guest are not rated (change C23), so the `guest_id` columns here and in `rating_history` stay empty and can be dropped by a later migration.

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

### 3.10 achievements

The catalog of achievements (FR-21), filled by a migration. The rules live in code (docs/achievements.md).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| code | text, not null, unique | Stable kebab-case code, for example `first-win` |
| name | text, not null | |
| description | text, not null | One sentence, the rule in words |
| tier | smallint, not null | 1 to 3 |
| sort_order | smallint, not null | |

### 3.11 user_achievements

Who earned what. Written server-side only. Never deleted when a session is deleted.

| Column | Type | Notes |
|---|---|---|
| profile_id | uuid, not null | References `profiles(id)` on delete cascade |
| achievement_id | uuid, not null | References `achievements(id)` on delete cascade |
| earned_at | timestamptz, not null | Default `now()` |

Primary key (`profile_id`, `achievement_id`).

### 3.12 admin_audit

One row per admin action (FR-47). Written server-side only.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| admin_id | uuid, not null | References `profiles(id)` |
| action | text, not null | For example `game.add`, `game.edit`, `game.delete`, `game.promote`, `player.block`, `player.unblock` |
| target_type | text, not null | `game` or `profile` |
| target_id | uuid | The game or profile acted on |
| details | jsonb | For example the name at the time of the action |
| created_at | timestamptz, not null | Default `now()`. Indexed descending |

Blocking a player uses the login ban of Supabase Auth, so no column stores it.

### 3.13 game_rooms

One online game of an in-app game (FR-45, change C22). Written server-side only.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| game_key | text, not null | In-app game, `yahtzee` (check constraint). Not a catalog game |
| host_id | uuid, not null | References `profiles(id)` |
| status | text, not null | `waiting`, `playing`, `finished` or `cancelled` (check constraint). Default `waiting` |
| state | jsonb | The full game: seats, whose turn, dice, holds, rolls left, score sheets. Null while waiting |
| version | integer, not null | Default 0. Raised by 1 on every change; a move names the version it was made on |
| created_at | timestamptz, not null | Default `now()` |
| updated_at | timestamptz, not null | Default `now()` |

The state holds everything a device needs to draw the game, so desktop and phone layouts read the same data. It is safe to show to every player only because Yahtzee has no hidden information; a game with hidden cards needs a different design.

### 3.14 game_room_players

| Column | Type | Notes |
|---|---|---|
| room_id | uuid | References `game_rooms(id)` on delete cascade |
| profile_id | uuid | References `profiles(id)` |
| status | text, not null | `invited`, `joined`, `declined` or `left` (check constraint). The host gets a `joined` row |
| seat | smallint | Turn order, set when the game starts. Null before |
| invited_at | timestamptz, not null | Default `now()` |
| responded_at | timestamptz | When the invite was accepted or declined |

Primary key: (`room_id`, `profile_id`). The host can invite only players who share a team with them; at most 6 rows with status `invited` or `joined`.

## 4. Statistics

No stored statistics tables in the MVP. Games played, wins and win rate (docs/rating.md section 6) are computed by queries or SQL views over `session_participants`. The overall team leaderboard is ranked by wins and games played (docs/rating.md section 9, proposal). Revisit if queries become slow.

## 5. Access rules (Row Level Security)

Helper functions are `security definer` with a fixed `search_path`, so policies do not recurse: `is_team_member(team_id)`, `can_see_session(session_id)` and `is_super_admin()`.

Admin pages check `is_super_admin()` on the server and then read and write with the service role, so no table gets extra client policies for admins.

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| profiles | Self, members of a shared team, and co-participants of a session the caller can see | By sign-up trigger only | Self | None (anonymize, see section 8) |
| guests | Owner, and members of teams where the guest took part in a session | Owner (`owner_id` = caller) | Owner | Server-side `delete_guest` only: the owner, or the owner of a team where the guest played. Sets `deleted_at` |
| games | Catalog games: any logged-in user. Custom games: author and members of the author's teams; deleted ones stay readable for history | Logged-in user, only as custom game with `created_by` = caller | Author, custom only | Server-side `delete_custom_game` only: the author, or the owner of a team that used it. Sets `deleted_at` and removes its ratings |
| teams | Members | Logged-in user, with `owner_id` = caller | Owner; ownership changes only through `transfer_team_ownership` (FR-52) | Owner |
| team_members | Members of the same team | Server-side join function only | None | Server-side leave function only. It blocks the owner while other members remain (US-G3). Owner removing others is P4 (FR-27) |
| sessions | Creator, participants, members of the session's team | Logged-in user, with `created_by` = caller | Creator | Creator |
| session_participants | Same as the parent session | Creator of the parent session | Creator of the parent session | Creator of the parent session |
| ratings | Same visibility as the player's profile or guest | Server-side only | Server-side only | Server-side only |
| rating_history | Same as `ratings` | Server-side only | Server-side only | Server-side only |
| achievements | Any logged-in user | Migration only | Migration only | Migration only |
| user_achievements | Same visibility as the player's profile | Server-side only | Server-side only | Server-side only |
| admin_audit | Super admins (`is_super_admin()`) | Server-side only | None | None |
| game_rooms | Players with a row in `game_room_players` (any status) | Server-side only | Server-side only | None |
| game_room_players | Players of the same room | Server-side only | Server-side only | None |

Notes:

- "Server-side only" means no client policy for that command. The service role key bypasses RLS and is never exposed to the browser
- Teams go through server functions: `create_team`, `join_team`, `leave_team`, and `team_by_invite` for the preview before joining. A session saved to a team may include teammates as registered participants, checked inside `create_session`. Edits go through `update_session`, which only the creator may call, which never changes the session's team, and which replaces the participants in one step (FR-14). A session without a team is "personal": it belongs to its creator and is managed on the personal panel. Team management modes (FR-48 to FR-50) will need team settings, a pending status and an approvals table; they are designed in the spec but not modelled yet
- Avatar files in Storage need their own bucket policies: anyone logged in can read, only the owner can write their own file
- After a session is edited or deleted, ratings of that game are rebuilt (docs/rating.md section 5)
- Online games go through server routes: create a room, invite, accept, decline, cancel, start and move. Each route checks the caller (browser session or a login token in the request header, so future store apps can use it), applies the rules from `src/lib/games/` and writes with the service role. The server rolls the dice. A move is saved only if the room's `version` still matches the one the device sent; otherwise the device reloads the state
- Devices follow changes through Supabase Realtime: the open room by `id`, and the player's own invites in `game_room_players`. Both tables are added to the Realtime publication; Realtime respects the read policies above. No polling

## 6. Indexes

Added for the frequent queries. Everything else waits for evidence.

| Table | Index | Used by |
|---|---|---|
| sessions | (`created_by`, `played_at` desc) | Player history (US-C4) |
| sessions | (`team_id`, `played_at` desc) | Team history (US-G6) |
| sessions | (`game_id`) | Rating rebuild |
| session_participants | (`session_id`) | Session details |
| session_participants | (`profile_id`) | Player stats and history |
| session_participants | (`guest_id`) | Guest stats |
| team_members | (`profile_id`) | "My teams", RLS checks |
| games | (`name`) | Catalog search (US-B1). A trigram index is not needed at about 30 games (Assumption) |
| guests | (`owner_id`) | Participant picker |
| ratings | (`game_id`, `rating` desc) | Per-game leaderboard |
| rating_history | (`profile_id`, `game_id`, `created_at`) | Progress chart |
| game_room_players | (`profile_id`, `status`) | Open invites and games on Home and Play (US-K3) |

Suggestions for fast entry (FR-13), recent games and recent participants, are queries over `sessions` and `session_participants`. No extra table.

## 7. Later phases (not created now)

Listed so the MVP schema does not block them. Each needs its own approval and migration.

| Phase | Tables |
|---|---|
| P3 | `achievements`, `user_achievements`, character and customization items |
| P4 | Feed items (or a view over sessions and achievements), `reactions`, guest to account linking |
| Backlog | `squads`, squad roles, session confirmations (FR-39 to FR-42) |

## 8. Open questions

1. **Session and team link.** Decided: a session has one optional `team_id` chosen at creation. A session belongs to one team only
2. **Account deletion.** Decided: `profiles` has its own `id` and a nullable `user_id` with `on delete set null`. Deleting an account anonymizes the profile and the row stays
3. **Results by side (FR-12).** Decided: `side_no` on the participant
4. **Guest ratings.** Decided: guests have no ratings and sessions with a guest are not rated (change C23)
5. **Guest deletion.** Decided: by the creator or a team owner, at any time, as a soft delete (change C24)
6. **Game types.** Decided: `board`, `card`, `dice`, `tile`, `party`, `other` (change C28)
