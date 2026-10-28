# User stories: In the Game

Version 0.2, draft. Each story links to a requirement in docs/spec.md. Priority: Must, Should, Could. Phase: P1 to P4, Pilot.

## Epic A: Accounts and profiles

**US-A1** (FR-01, P1, Must)
As a visitor, I want to register with my email, so that my games are saved under my name.
Acceptance: registration with email and password; after login I land on the home page; invalid input shows a clear error.

**US-A2** (FR-01, P1, Must)
As a player, I want to log in, log out and reset my password, so that I can keep my account secure and recover access.
Acceptance: the session persists across page reloads; a reset link arrives by email.

**US-A3** (FR-02, P1, Must)
As a player, I want to set a nickname and avatar, so that friends recognize me in sessions and leaderboards.
Acceptance: nickname is required; avatar is optional; changes show everywhere immediately.

**US-A4** (FR-03, P1, Must)
As a player, I want to create a guest profile with just a name, so that I can record sessions with friends who have no account.
Acceptance: a guest needs only a name; guests are selectable when adding participants; guests appear in history and stats.

**US-A5** (FR-04, P4, Could)
As a player, I want to link a guest profile to a friend's real account, so that their past games are not lost when they register.
Acceptance: history of the guest moves to the account; ratings are recalculated; the action asks for confirmation.

**US-A6** (FR-05, Pilot, Should)
As a player, I want to delete my account, so that my personal data is removed.
Acceptance: confirmation required; personal data is removed or anonymized; sessions with other players stay consistent.

## Epic B: Game catalog

**US-B1** (FR-06, FR-07, P1, Must)
As a player, I want to search and filter the catalog, so that I can quickly find the game I played.
Acceptance: search by name; filter by player count and type; classic no-box games are present; results update as I type.

**US-B2** (FR-08, P2, Should)
As a player, I want to open a game page, so that I can see its details and my own stats for it.
Acceptance: shows description, player count, typical duration, my games played and my rating.

**US-B3** (FR-09, P1, Should)
As a player, I want to add a custom game, so that I can record a session even if the game is missing from the catalog.
Acceptance: requires name and player range; the game is immediately selectable; duplicates by name are warned about.

## Epic C: Sessions

**US-C1** (FR-10, FR-13, P1, Must)
As a player, I want to record a session in under a minute, so that logging does not interrupt the game night.
Acceptance: select game, participants and result in a short flow; recent games and participants are suggested; timing is measured in the pilot.

**US-C2** (FR-11, P1, Must)
As a player, I want to choose how the result is recorded (winner only, places, or points), so that it fits the game I played.
Acceptance: three result types are available; the form adapts to the chosen type; stats work for all three.

**US-C3** (FR-12, P2, Should)
As a player, I want to record results by side, so that team games are counted correctly.
Acceptance: participants can be split into sides; the winning side is recorded; each member gets the result.

**US-C4** (FR-14, P1, Must)
As a player, I want to see my session history, so that I can look back at what I played and with whom.
Acceptance: list sorted by date; shows game, participants and result; supports pagination.

**US-C5** (FR-14, P1, Must)
As a player, I want to edit or delete a session I created, so that I can fix mistakes.
Acceptance: only the creator can edit or delete; ratings and stats are recalculated after a change.

**US-C6** (FR-15, P2, Could)
As a player, I want to add a short note to a session, so that I can remember a memorable moment.
Acceptance: optional text field with a length limit; shown in the session details.

## Epic D: Statistics and rating

**US-D1** (FR-16, P2, Must)
As a player, I want to see my stats, so that I know how I perform overall and in each game.
Acceptance: games played, wins and win rate; overall and per game.

**US-D2** (FR-17, P2, Must)
As a player, I want a rating per game, so that my skill is reflected over time.
Acceptance: the rating updates after each session; results are reproducible from stored sessions; tests on synthetic data pass.

**US-D3** (FR-18, P2, Must)
As a team member, I want a leaderboard, so that I can see who leads in our team.
Acceptance: per game and overall; shows rating and games played; updates after each session.

**US-D4** (FR-19, P2, Should)
As a player, I want to compare myself with a specific friend, so that I can follow our rivalry.
Acceptance: shows games played together and the win count for each side.

**US-D5** (FR-20, P2, Should)
As a player, I want a chart of my progress, so that I can see how my rating changes over time.
Acceptance: line chart per game; selectable period.

## Epic E: Achievements

**US-E1** (FR-21, P3, Must)
As a player, I want to earn achievements automatically, so that playing feels rewarding.
Acceptance: at least 30 achievements; awarded after a session is saved; each achievement is awarded once.

**US-E2** (FR-22, P3, Should)
As a player, I want to see all achievements and my progress, so that I know what to aim for.
Acceptance: earned and locked achievements are shown; locked ones show the condition and progress where possible.

**US-E3** (FR-23, P3, Could)
As a player, I want to be notified when I earn an achievement, so that I notice it right away.
Acceptance: an in-app notice after saving a session.

## Epic F: Character customization

**US-F1** (FR-24, P3, Must)
As a player, I want to customize my character, so that my profile feels like mine.
Acceptance: several appearance options; choices are saved and visible on the profile and in the feed.

**US-F2** (FR-25, P3, Should)
As a player, I want to unlock new items by earning achievements, so that progress gives visible rewards.
Acceptance: locked items show how to unlock them; earning an achievement unlocks linked items.

## Epic G: Teams and social

**US-G1** (FR-26, P2, Must)
As a player, I want to create a team, so that my friends and I share sessions and leaderboards.
Acceptance: team has a name; the creator becomes the owner.

**US-G2** (FR-26, P2, Must)
As a team owner, I want to invite people by link, so that joining is easy.
Acceptance: link joins the team after login; the owner can disable the link.

**US-G3** (FR-26, P2, Must)
As a player, I want to leave a team, so that I control which teams I belong to.
Acceptance: leaving keeps my past sessions; an owner cannot leave while other members remain (Assumption).

**US-G4** (FR-28, P4, Must)
As a team member, I want a feed of team activity, so that I see what my friends played and earned.
Acceptance: shows new sessions and achievements, newest first; only team members see it.

**US-G5** (FR-29, P4, Could)
As a team member, I want to react to feed items, so that I can cheer on friends.
Acceptance: one reaction per user per item; can be removed.

**US-G6** (FR-38, P2, Must)
As a team member, I want to see the session history of my team, so that I can follow what we played together.
Acceptance: list sorted by date; shows game, participants and result; visible only to team members.

**US-G7** (FR-27, P4, Must)
As a team owner, I want to remove a member, so that I keep the team under control.
Acceptance: only the owner can remove; the removed member's past sessions stay in the history.

## Epic H: Table tools

**US-H1** (FR-30, P4, Should)
As a player, I want a scoreboard during the game, so that I do not need paper.
Acceptance: counters per player; works on mobile; can be saved as a session.

**US-H2** (FR-31, P4, Should)
As a player, I want timers, so that I can limit turns or rounds.
Acceptance: countdown and per-turn timer; sound or visual signal at zero.

**US-H3** (FR-32, P4, Should)
As a player, I want to roll dice on screen, so that I can play when physical dice are missing.
Acceptance: standard d6 and custom dice; several dice at once.

**US-H4** (FR-33, P4, Should)
As a player, I want a random team generator, so that splitting players is fast and fair.
Acceptance: select players and number of teams; reshuffle option.

## Epic K: Own games

**US-K1** (FR-43, P4, Should)
As a player, I want the Games tab to ask whether I play or track, so that playing in the app feels separate from logging.
Acceptance: two choices on the first screen; Track opens the catalog; Play opens a list of games that can be played in the app.

**US-K2** (FR-44, P4, Should)
As a player, I want to play Yahtzee on one phone with friends, so that we need no dice or paper and the result is saved by itself.
Acceptance: choose 2 to 6 players (you, teammates, guests); roll up to three times and hold dice; the sheet shows the points every open box would give; standard bonuses and joker rule; the phone is passed with a clear "whose turn" screen; a reload keeps the game; the finished game appears in history with points, and ratings update.

## Epic I: Platform and pilot

**US-I1** (FR-34, P1, Must)
As the project author, I want product analytics events, so that I can measure retention and session entry time.
Acceptance: events for registration, session created and return visits; retention can be calculated for month two.

**US-I2** (FR-35, P1, Should)
As the project author, I want error monitoring, so that I learn about failures before users report them.
Acceptance: unhandled errors reach Sentry with enough context to reproduce.

**US-I3** (FR-36, Pilot, Could)
As a player, I want a quick way to send feedback, so that I can report problems or ideas.
Acceptance: link or form reachable from the main navigation.

**US-I4** (FR-37, Pilot, Must)
As the project author, I want to hold a test tournament with seed data, so that I can validate the product with real users.
Acceptance: the tournament takes place; sessions are logged through the app; feedback and metrics are collected for the final report.

## Epic J: Backlog after MVP

Not scheduled. These stories depend on open questions about timeouts, disputes and guests.

**US-J1** (FR-39, Backlog, Could)
As a team owner, I want to create squads in my team and assign roles such as squad leader, so that responsibility for results is clear.
Acceptance: the owner creates squads and assigns or changes roles; every squad has at least one leader.

**US-J2** (FR-40, Backlog, Could)
As a squad leader, I want to confirm a session result, so that only verified results affect ratings and stats.
Acceptance: a new session is pending until the leader confirms; ratings and stats update only for confirmed sessions; only a leader can confirm.

**US-J3** (FR-41, Backlog, Could)
As a team owner, I want a setting where one squad leader proposes the result and the other squads confirm it, so that all sides agree.
Acceptance: the setting is per team; the proposal appears in the other leaders' UI; the session is confirmed when all other sides confirm; a rejection marks it disputed.

**US-J4** (FR-42, Backlog, Could)
As a player, I want clear rules for sessions that nobody confirms, so that results do not hang forever.
Acceptance: timeout, dispute handling and handling of guests are defined and implemented. The rules are an open question.

## Definition of done (draft)

- Code is merged to main through a pull request
- Rating and statistics logic has tests
- New tables have Row Level Security policies
- The feature works at mobile width
- Acceptance criteria of the story are checked
