# In the Game

## Project

Web platform for logging board and card game sessions. Any session, even a casual card game in a kitchen, becomes a record in the player's history. From that history grow statistics, ratings, rivalries and achievements. The product sells interest in one's own history of wins, not bookkeeping.

- Audience: friend groups, students, game clubs; later a public service
- Starting base: 20 to 50 users
- Interface language: English
- Free at launch, no monetization in scope
- Developer: one person (project author), who reviews every change

## Documentation

Read the relevant file before implementing a feature. If docs and code conflict, ask before choosing.

- `docs/spec.md`: technical specification, requirements (FR-xx), phases, decisions
- `docs/user-stories.md`: user stories with acceptance criteria
- `docs/data-model.md`: tables, relations, access rules
- `docs/rating.md`: rating algorithm and test cases

Current scope: MVP, which is phases P1 and P2. Do not build features from later phases unless asked.

## Stack

- Frontend: Next.js (React), JavaScript
- Charts: Recharts
- Backend: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- Auth: email via Supabase Auth
- Hosting: Vercel (frontend), Supabase (backend)
- Python: helper scripts only (for example, synthetic data to test the rating logic). Not part of the runtime
- CI/CD: GitHub Actions
- Planned: Sentry (errors), PostHog (product analytics, needed to measure retention), Figma (prototypes)

## Architecture principles

The goal is to stay on free tiers now and move to paid tiers later without rewriting code.

- Use standard PostgreSQL features only. Avoid vendor-specific tricks
- All schema changes go through migration files in `supabase/migrations/`. Never change the schema by hand in the dashboard
- Every table has Row Level Security policies. No table is left open
- Wrap the Supabase client in `src/lib/` so the rest of the code does not depend on it directly
- Rating and statistics logic lives in pure functions in `src/lib/rating/`, separate from UI, and must have tests
- All configuration through environment variables. Never commit secrets. The Supabase service role key is used server-side only
- Be gentle with free-tier limits: paginate lists, add indexes for frequent queries, avoid polling

## Domain (draft, to be finalized in docs/data-model.md)

Profile, guest profile, game (catalog), session (a played match), session participant, group, group member, achievement, user achievement, rating.

## Product constraints

- Logging a session takes under 1 minute. This is the core UX target
- Catalog of at least 30 games, including classic games that need no box
- At least 30 achievements
- Own online games are phased: no multiplayer first, then simple multiplayer, then ranked. Not in MVP scope

## Planned phases

1. Initiation and requirements: charter, technical specification, prototype
2. Development phase 1: session creation, start of the catalog
3. Development phase 2: rating, statistics and minimal groups (create, invite link, join, leave, group history)
4. Development phase 3: character customization and profile
5. Development phase 4: group management, social feed, table tools (scoreboard, timers, dice, team generator)
6. Pilot release: test tournament
7. Final: report and improvement backlog

## Repository structure (target)

```
src/app/          pages and routes
src/components/   UI components
src/lib/          Supabase wrapper, rating logic, helpers
supabase/migrations/   database migrations
docs/             specification, data model, decisions
scripts/          helper scripts (Python or Node)
```

## Commands

- `npm run dev`: dev server
- `npm run build`: production build
- `npm run lint`: lint
- Test command: to be added with the test runner

## Working rules for Claude

- For any non-trivial task, propose a plan first and wait for approval before changing files
- Keep tasks small: one feature, one commit. Use a separate branch per feature, no direct commits to main
- Do not add new dependencies without asking
- Do not create tables or columns beyond docs/data-model.md without asking
- Write tests for rating and statistics logic
- Code, comments, commit messages and UI text are in English
- If requirements are unclear or a decision is missing, ask instead of guessing. State uncertainty explicitly
- Do not claim that free-tier limits or prices are current. They must be checked on the service websites

## Response format

- Lead with the answer or the next action. No preamble, no recap
- Anything I need to do is a numbered list, one action per step, each step at most two lines. Commands go in code blocks
- At most 7 steps at once. If more are needed, give the first part and say what comes next
- No long explanations. Explain why only when I ask
- Bold only the one thing I must not miss
- After code changes, give at most 5 bullets: what changed and what to check
- When I must decide, give at most 3 options and put the recommended one first
- State uncertainty in one short line
- End with exactly one question or one "Next:" line

## Open decisions

- Styling approach (plain CSS, CSS modules or Tailwind)
- TypeScript or JavaScript only (JavaScript is the current choice)
- Exact list of achievements (to be written in docs/). The rating algorithm is drafted in docs/rating.md
