# Technical specification: In the Game

Version 0.2, draft. Items marked "Assumption" or listed in section 9 are not confirmed and need a decision.

## 1. Purpose and scope

In the Game is a web platform for logging board and card game sessions. Any session, even a casual card game in a kitchen, becomes a record in a player's history. From that history the platform builds statistics, ratings, rivalries and achievements.

The product does not sell bookkeeping. It sells interest in one's own history of wins.

Scope of this document: the full product delivered in phases (section 5). Phases follow the project plan.

Audience: friend groups, FIT students, game clubs; later a public service. Starting base is 20 to 50 users. The interface is in English. The service is free at launch and no monetization is in scope.

## 2. Definitions

| Term | Meaning |
|---|---|
| Session | One recorded play of a game by one or more participants |
| Participant | A person in a session: a registered user or a guest profile |
| Guest profile | A participant record created by a registered user. It has a name only and no login |
| Catalog | The list of games available when creating a session |
| Team | A set of users who share sessions, leaderboards and a feed |
| Rating | A numeric skill estimate per player per game, recalculated after each session |
| Achievement | A badge awarded automatically when a condition on session history is met |

## 3. Roles

| Role | Description |
|---|---|
| Visitor | Not logged in. Sees the landing page and the registration form |
| Player | Registered user. Logs sessions, sees own stats, joins teams |
| Team owner | A player who created a team. Can invite and remove members |
| Maintainer | The project author. Manages the catalog and achievements directly in the database in early phases |
| Squad leader (backlog) | A role inside a squad, planned after the MVP. Confirms or proposes session results |

A guest profile is a participant record, not a login role.

## 4. Functional requirements

Priority: Must, Should, Could. Phase: P1 to P4, Pilot (see section 5).

### 4.1 Accounts and profiles

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-01 | Email registration, login, logout and password reset via Supabase Auth | Must | P1 |
| FR-02 | Profile with nickname and avatar | Must | P1 |
| FR-03 | A player can create guest profiles with a name only | Must | P1 |
| FR-04 | A guest profile can later be linked to a real account, transferring its history | Could | P4 |
| FR-05 | Account deletion with removal or anonymization of personal data | Should | Pilot |

### 4.2 Game catalog

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-06 | Catalog of at least 30 games, including classic games that need no box (cards, dice, dominoes and similar) | Must | P1 |
| FR-07 | Search and filter the catalog by name, player count and type | Must | P1 |
| FR-08 | Game page with description, player count, typical duration and the player's own stats | Should | P2 |
| FR-09 | A player can add a custom game when it is missing from the catalog | Should | P1 |

### 4.3 Sessions

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-10 | Create a session: game, date, participants (users or guests), result per participant | Must | P1 |
| FR-11 | Result types: winner only, ranking by place, points per participant | Must | P1 |
| FR-12 | Sides result type (team games) | Should | P2 |
| FR-13 | Fast entry: recent games and recent participants are suggested. Target is under 1 minute from start to saved session | Must | P1 |
| FR-14 | Session history for a player, read-only, with the team of each session. Sessions are managed in their panel: a team's page for team sessions, the personal panel for sessions logged without a team. There the creator can edit and delete own sessions. A session never moves between teams or into a team | Must | P1 |
| FR-15 | Optional note on a session | Could | P2 |

### 4.4 Statistics and rating

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-16 | Personal stats: games played, wins, win rate, overall and per game | Must | P2 |
| FR-17 | Rating per player per game, recalculated after each session. Algorithm is described in docs/rating.md (to be written) | Must | P2 |
| FR-18 | Team leaderboard per game and overall | Must | P2 |
| FR-19 | Head to head stats between two players | Should | P2 |
| FR-20 | Progress charts over time (Recharts) | Should | P2 |

### 4.5 Achievements and customization

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-21 | At least 30 achievements, awarded automatically after sessions | Must | P3 |
| FR-22 | Achievements page on the profile, with progress toward locked ones | Should | P3 |
| FR-23 | Notification when an achievement is earned | Could | P3 |
| FR-24 | Character on the profile with customizable appearance | Must | P3 |
| FR-25 | Some customization items are unlocked by achievements (Assumption) | Should | P3 |

### 4.6 Teams and social

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-26 | Create a team, invite by link, join and leave (minimal teams) | Must | P2 |
| FR-27 | Team roles: owner and member. The owner can remove members | Must | P4 |
| FR-28 | Social feed with team sessions and earned achievements | Must | P4 |
| FR-29 | Reactions on feed items | Could | P4 |
| FR-38 | Session history of a team | Must | P2 |
| FR-48 | Team management mode, set by the owner. Owner-managed: the owner can edit and delete every session of the team, with no approvals. Team-managed: every new session and every edit of a team session needs approval (FR-50) | Should | P4 |
| FR-49 | Team logging setting, set by the owner: only the owner can log team sessions, or any member can | Should | P4 |
| FR-50 | Approvals in team-managed teams. Every registered team member who took part approves; the logger counts as approved; members who did not play are not asked. A pending session or edit does not count in ratings, stats or achievements, and an edit keeps the old version counting until approved. A rejection, with an optional reason, goes back to the logger, who edits and resends or deletes it | Should | P4 |

### 4.7 Table tools

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-30 | Scoreboard with counters per player. Can be saved as a session | Should | P4 |
| FR-31 | Timers: countdown and per-turn | Should | P4 |
| FR-32 | Dice roller: standard d6 and custom dice | Should | P4 |
| FR-33 | Team generator: random split of selected players | Should | P4 |

### 4.8 Platform

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-34 | Product analytics events (PostHog): registration, session created, return visits. Needed to measure retention, so instrument from the start | Must | P1 |
| FR-35 | Error monitoring (Sentry) | Should | P1 |
| FR-36 | Link to send feedback from the app | Could | Pilot |
| FR-37 | Pilot: seed data prepared and a test tournament held | Must | Pilot |

### 4.9 Backlog (after MVP)

Not scheduled. These depend on open questions in section 9.

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-39 | Squads inside a team. The team owner creates squads and manages roles such as squad leader | Could | Backlog |
| FR-40 | Replaced by FR-48 to FR-50 (team management modes, change C17) | | |
| FR-41 | Replaced by FR-48 to FR-50 (team management modes, change C17) | | |
| FR-42 | Rules for sessions that wait for approval too long: timeout and reminders | Could | Backlog |

### 4.10 Own games

Games played inside the app. Stage 1 of the staged plan in section 9: no network play, one device passed between players. Added by change C13 in [project/changes.md](project/changes.md).

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-43 | The Games tab opens on a choice: Play (games inside the app) or Track (the catalog and logging). Play has its own look | Should | P4 |
| FR-44 | Yahtzee in the app, solo or with friends on one device (2 to 6 players): dice with holds and three rolls, full score sheet with the upper bonus, Yahtzee bonus and joker rule. A game in progress survives a reload. Results are not saved to history or ratings yet | Should | P4 |
| FR-45 | Play with friends by invite: a friend gets a notification, joins and plays from their own phone. Shown as "Coming soon" in the game | Could | Backlog |
| FR-46 | Save in-app game results to history, ratings and achievements | Could | Backlog |

### 4.11 Administration

Added by change C15 in [project/changes.md](project/changes.md).

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-47 | Admin panel for super admins, shown as a menu tab above "Log a session": overview dashboard (totals, active and returning players, sessions and sign-ups per week, top games, admin activity), catalog management (add, edit, delete unused games, move a custom game into the catalog), and players (search, details, block and unblock). Every action is logged | Should | P4 |

## 5. Phases

| Phase | Duration | Result |
|---|---|---|
| Initiation | 2 weeks | Project charter approved |
| Requirements | 2 weeks | Specification and prototype approved |
| P1 | 2 weeks | Session creation works, catalog started |
| P2 | 2 weeks | Rating and statistics are calculated, minimal teams work |
| P3 | 2 weeks | Customization and profile are ready |
| P4 | 2 weeks | Team management, social feed, table tools |
| Pilot | 2 weeks | Test tournament held |
| Final | 1 week | Final report, improvement backlog |

Dates, the critical path and the actual progress are in [project/schedule.md](project/schedule.md) and [project/progress.md](project/progress.md).

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | Performance: session entry under 1 minute, confirmed by timing real users. Page load target of about 2 seconds on a mobile connection (target, to be validated) |
| NFR-02 | Security: Row Level Security on every table, no secrets in the repository, HTTPS only |
| NFR-03 | Privacy: store minimal personal data. A guest profile stores a name only. A user can delete the account |
| NFR-04 | Compatibility: responsive, mobile first. Latest versions of Chrome, Safari, Firefox and Edge (Assumption) |
| NFR-05 | Localization: English interface. Keep UI strings in one place so translation can be added later (Assumption) |
| NFR-06 | Cost: run on free tiers for up to 50 users. Moving to paid tiers must not require code changes |
| NFR-07 | Maintainability: schema through migrations, tests for rating logic, CI in GitHub Actions running lint and tests |
| NFR-08 | Data integrity: ratings must be reproducible by recalculating from stored sessions |
| NFR-09 | Accessibility: keyboard navigation and sufficient contrast on main screens (basic level) |

## 7. Constraints and assumptions

- One developer (the project author), who combines the roles of manager, analyst, developer and tester
- Stack as in CLAUDE.md: Next.js, Supabase, Vercel, Recharts
- Free-tier limits and prices have not been verified and must be checked on the service websites before relying on them
- No legal entity is created during development
- Budget and schedule are defined in the project plan ([project/](project/README.md)), not in this document

## 8. Success criteria

- 50 active users and 300 logged sessions in the first quarter after launch
- Retention at month two of at least 40 percent
- Average session entry time under 1 minute, measured on real users
- Catalog of at least 30 games
- At least 30 achievements
- Rating calculation confirmed correct by tests on synthetic data

## 9. Decisions, out of scope and open questions

Out of scope for this project:

- Monetization and payments
- Native mobile apps
- Own online games with network multiplayer or ranked mode. Stage 1, games on one device, is in scope (section 4.10); simple multiplayer and ranked stay after the project
- Integrations with external catalogs such as BoardGameGeek

Decisions made:

- MVP is P1 and P2: accounts, catalog, sessions, history, statistics, rating, minimal teams
- In the MVP the session creator records the result alone. Confirmation by squad leaders is in the backlog (section 4.9). The session `status` field is kept in the data model for it
- The catalog is managed by super admins in the admin panel (FR-47). Custom games are visible to their author and the author's teams
- Profiles are visible to team members only
- Rating is Elo-style, details in docs/rating.md

Open questions:

1. Rating parameters and how an overall leaderboard is defined (see docs/rating.md)
2. Confirmation rules for the backlog: timeout for non-responding confirmers, dispute handling, how guests are covered
3. Answered: scope of character customization is in [character.md](character.md) (5 races, hair, beards, eye colour, 10 free outfits, backgrounds; accessories need art)
4. Is email verification required during the pilot?
5. Data protection: are users in the EU, and is a privacy policy needed before public launch?
