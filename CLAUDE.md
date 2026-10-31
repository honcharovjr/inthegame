# In the Game

Web platform for logging board and card game sessions. Every session becomes a record in the player's history, which grows into statistics, ratings, rivalries and achievements. The product sells interest in one's own history of wins, not bookkeeping.

- Audience: friend groups, students, game clubs; 20 to 50 users at start. Free, English UI
- One developer (project author) reviews every change

## Docs (read the relevant one before implementing; if docs and code conflict, ask)

- `docs/spec.md` requirements (FR-xx), phases, decisions
- `docs/user-stories.md`, `docs/data-model.md` (tables, relations, access rules), `docs/rating.md`
- `docs/achievements.md`, `docs/character.md`
- `docs/project/`: university report elements. Update `progress.md` and the change log when scope, schedule or cost change

Scope: MVP (phases P1 and P2). No later-phase features unless asked. Own games: stage 1 (one device) only, per change C13; no network multiplayer.

## Stack

Next.js (React, JavaScript), CSS modules, Supabase (PostgreSQL, Auth, Storage, RLS), Vercel, GitHub Actions, Vitest. Python only for helper scripts. Planned: Sentry, PostHog.

## Architecture

- Standard PostgreSQL only; schema changes only via `supabase/migrations/`; RLS on every table
- Supabase client wrapped in `src/lib/`
- Rating and statistics logic: pure functions in `src/lib/` with tests
- Config via env vars; never commit secrets; service role key server-side only
- Respect free tiers: paginate, index frequent queries, no polling

## Product constraints

- Logging a session takes under 1 minute
- Catalog of 30+ games including classics without a box; 30+ achievements

## Commands

`npm run dev` · `npm run build` · `npm run lint` · `npm test`

## Working rules

- Non-trivial task: propose a plan and wait for approval
- One feature per branch, one commit; never commit to main
- Ask before new dependencies, or tables/columns beyond `docs/data-model.md`
- Code, comments, commits and UI in English
- UI text is lowercase (a global CSS rule does it). Text a player typed keeps its case: wrap in `UserText`, game names in `GameName`
- Unclear requirement: ask, don't guess. Never claim free-tier limits or prices are current

## Response format

- Lead with the answer. No preamble or recap; explain why only when asked
- My actions: numbered steps, max 7, each max 2 lines, commands in code blocks
- Bold only the one thing I must not miss
- After code changes: max 5 bullets, what changed and what to check
- Decisions: max 3 options, recommended first
- Uncertainty in one short line
- End with exactly one question or one "Next:" line
