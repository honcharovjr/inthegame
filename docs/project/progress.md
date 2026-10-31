# Progress and closure

Version 1.0, status date Oct 28, 2026. Covers report element 20 and the actual state for elements 13, 17 and 19.

## 1. Summary

- Phase: P2 of the plan (Oct 27 to Nov 9). Delivered work is ahead of plan (SPI 1.53, CPI 1.88; [budget.md](budget.md))
- In production: accounts, guests, catalog with filters and custom games, session logging, history, Elo rating, teams, 30 achievements, layered character with a customizer
- Open Must gaps of the MVP: catalog of 30 games, editing a session, per-game personal stats, PostHog analytics
- Quality: 100 unit tests pass; lint and build pass; CI is not set up yet
- 34 pull requests merged between Oct 24 and Oct 27, 2026

## 2. Delivered increments

| Date | Pull requests | Delivered |
|---|---|---|
| Sep 15 to Oct 23, 2026 | | Concept (Task 1), charter, specification draft, user stories, rating algorithm |
| Oct 24 | #1 to #4 | Spec, user stories, rating doc, data model and its review |
| Oct 24 | #3, #5 to #9 | Next.js app, design tokens, database schema with security policies, Supabase client, sign-up, login, password reset |
| Oct 24 to 25 | #10 | Catalog: 34 seeded games, search and filters |
| Oct 25 | #11 to #18 | Visual style, log flow with three result types, Elo rating with tests, home with monthly stats, responsive layouts |
| Oct 25 | #19 to #29 | Profile and history with delete, history filters, custom games, teams (create, invite link, join, leave, leaderboard, history), team stats, UI polish |
| Oct 25 | #29 | 30 achievements with progress, first character with a customizer |
| Oct 25 to 27 | #30 to #32 | Layered character art: 5 races, hair, beards, eye colour, 10 free outfits |
| Oct 27 | #33, #34 | Game-style customizer, profile avatar that expands to the full figure |
| Oct 28 | #35 | Project management documentation |
| Oct 28 | #36 | Games tab split into Play and Track; Yahtzee playable on one device |
| Oct 28 | #37 | Yahtzee modes: solo, one phone, invite placeholder; results not saved |
| Oct 28 | #38 | Admin panel: overview, catalog management, players with blocking |
| Oct 28 | #39 | All UI text in lowercase; player-typed text keeps its case |
| Oct 28 | #40 | Edit a session (FR-14); team management modes designed (FR-48 to FR-50) |
| Oct 28 | #41 | Team and personal panels with session history; read-only profile history |
| Oct 28 | #42 | UI blocks, part 1: shared poster block, tilt buttons, Home hero with a monthly headline |
| Oct 28 | #43 | UI blocks, part 2: poster headers and desktop grids on Teams, History, Profile |
| Oct 29 | #44 | UI blocks, part 3: tilt on main actions, hover motion on game rows and medals |
| Oct 29 | #45 | One page frame: same poster size and place on every top page, side block beside it, wider pages |
| Oct 29 | #46 | Personal stats per game (FR-16) |
| Oct 29 | #47 | Blackjack in the app (FR-51); setup screens shared between games |
| Oct 29 | #48 | Redesign of Home and Profile: page names as titles, character card, activity, rivals, gear stage with mock gear (C20) |
| Oct 29 | (this branch) | Redesign fixes: trading card, tooltips, fancy font, average rating, games blocks (C21) |

## 3. Requirements status

Done: accepted in production. Partial: some acceptance criteria open. Open: not started.

| ID | Requirement | Priority | Phase | Status | Notes |
|---|---|---|---|---|---|
| FR-01 | Email registration, login, logout, password reset | Must | P1 | Done | |
| FR-02 | Profile with nickname and avatar | Must | P1 | Done | Avatar is the character |
| FR-03 | Guest profiles | Must | P1 | Done | |
| FR-06 | Catalog of 30+ games incl. classic games | Must | P1 | Done | 34 games again (migration after change C8); type `tile` replaces `dominoes` (C28) |
| FR-07 | Search and filter by name, player count, type | Must | P1 | Done | |
| FR-09 | Custom game | Should | P1 | Partial | No warning for duplicate names |
| FR-10 | Create a session | Must | P1 | Done | |
| FR-11 | Winner, places, points | Must | P1 | Done | |
| FR-13 | Fast entry, recent games and players suggested | Must | P1 | **Partial** | "Same again" for the last session only; under-1-minute not measured yet |
| FR-14 | History; creator edits and deletes | Must | P1 | Done | History is read-only; edit and delete in the team or personal panel; the date is not editable |
| FR-34 | PostHog analytics | Must | P1 | **Open** | Needs a dependency and an account |
| FR-35 | Sentry | Should | P1 | Open | |
| FR-08 | Game page with own stats | Should | P2 | Open | |
| FR-12 | Sides result type | Should | P2 | Open | |
| FR-15 | Session note | Could | P2 | Open | Database field exists |
| FR-16 | Personal stats overall and per game | Must | P2 | Done | All-time numbers on Profile and History, a "your stats" card per game on Profile, this month on Home |
| FR-17 | Rating per player per game | Must | P2 | Done | Elo-style, tests on synthetic data; sessions with a guest are not rated (C23); rebuild from the admin panel |
| FR-18 | Team leaderboard per game and overall | Must | P2 | Done | Ranked by game rating or the weighted overall rating (C23); wins and games as extra columns |
| FR-19 | Head to head | Should | P2 | Open | |
| FR-20 | Progress charts | Should | P2 | Open | Rating history is stored |
| FR-26 | Teams: create, invite link, join, leave | Must | P2 | Done | |
| FR-38 | Team session history | Must | P2 | Done | |
| FR-21 | 30+ achievements, automatic | Must | P3 | Done | 30 achievements, awarded after each saved session |
| FR-22 | Achievements page with progress | Should | P3 | Done | |
| FR-23 | Notice when an achievement is earned | Could | P3 | Open | |
| FR-24 | Customizable character | Must | P3 | Done | 5 races, 10 outfits, customizer |
| FR-25 | Items unlocked by achievements | Should | P3 | Partial | Backgrounds unlock; earned outfits and accessory art pending |
| FR-04 | Link a guest to an account | Could | P4 | Open | |
| FR-27 | Owner removes members | Must | P4 | Open | |
| FR-48 to FR-50 | Team management modes, logging setting, approvals | Should | P4 | Open | Designed, changes C17, C27 |
| FR-52 | Team ownership transfer | Should | P4 | Open | Change C26 |
| FR-53 | Delete a guest | Should | P4 | Open | Change C24 |
| FR-54 | Delete a custom game | Should | P4 | Open | Change C24 |
| FR-55 | Time zone per profile | Should | P4 | Open | Change C25 |
| FR-28 | Social feed | Must | P4 | Open | |
| FR-29 | Reactions | Could | P4 | Open | |
| FR-30 to FR-33 | Table tools | Should | P4 | Open | |
| FR-43 | Games tab: Play or Track | Should | P4 | Done | Change C13 |
| FR-44 | Yahtzee solo and on one device | Should | P4 | Done | Changes C13, C14; 22 rule tests |
| FR-51 | Blackjack solo and on one device | Should | P4 | Done | Change C19; 19 rule tests |
| FR-45 | Online Yahtzee by invite | Should | P4 | Partial | Change C22. Built: database, room engine with tests, server routes, invites on Home and Play, lobby, online game with timers and host actions, ending a game, presence and reactions (C29). Waiting for a two-device test |
| FR-46 | In-app results saved to history and ratings | Could | Backlog | Open | |
| FR-47 | Admin panel: overview, catalog, players | Should | P4 | Done | Change C15 |
| FR-05 | Account deletion | Must | Pilot | Open | Raised by change C28 |
| FR-36 | Feedback link | Could | Pilot | Open | |
| FR-37 | Pilot with seed data and a tournament | Must | Pilot | Open | |

Non-functional gaps: NFR-07 asks for CI in GitHub Actions (not set up); NFR-01 timing not measured yet.

## 4. Next steps (corrective actions)

1. Refill the catalog to 30+ games (FR-06)
2. PostHog analytics (FR-34), then Sentry (FR-35)
3. Recent games and players in the log flow (FR-13)
4. CI in GitHub Actions (NFR-07)
5. Then the Should items of P2, then P4

## 20. Closure phase

### 20.1 Closure actions

1. Freeze scope: only fixes after the pilot
2. Check every requirement against [section 3](#3-requirements-status); move open items to the improvement backlog with a reason
3. Final earned value report and cost summary ([budget.md](budget.md))
4. Collect pilot results: users, sessions, entry time, retention, feedback
5. Lessons learned
6. Hand-over: documentation complete in `docs/`, user guide and administrator guide (concept section 7), credentials and services owned by the author
7. Decide the future: continue as a public service (legal form, privacy policy) or stop, and cancel paid subscriptions
8. Write and defend the final report

### 20.2 Final report template

1. Goals and results: each goal of the goal tree, planned vs achieved
2. Scope: requirements delivered, changed (change log) and moved to the backlog
3. Schedule: baseline vs actual Gantt, critical path, delays and their causes
4. Cost: planned vs actual by CBS line; final CPI, SPI, EAC
5. Quality: tests, defects found in the pilot, acceptance results
6. Pilot: number of users and sessions, average entry time, retention, feedback themes
7. Risks: which occurred, how responses worked
8. Lessons learned: what to keep, what to change (for example, finish MVP gaps before polishing features)
9. Improvement backlog and development plan
