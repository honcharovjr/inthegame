# Achievements: In the Game

Version 0.1, draft for review. Thresholds are starting values and can be tuned on pilot data. Items marked "Assumption" need confirmation.

## 1. Goals

- Reward real play, not clicking. Every achievement comes from sessions that exist in the history
- Easy to explain: one sentence per achievement
- Awarded automatically after a session is saved (FR-21)
- A visible reward: some achievements unlock character accessories (see docs/character.md)
- Fair between friends: achievements and perks are cosmetic and never change ratings or statistics

## 2. Rules for all achievements

- Only registered players earn achievements. Guests do not (Assumption)
- A "win" is place 1 in a session with at least 2 participants, as in docs/rating.md section 6
- "In a row" means consecutive sessions of the player with at least 2 participants, ordered by `played_at`
- Days are counted in UTC (Assumption: the app does not store a time zone)
- Achievements are checked after a session is saved. Once earned, an achievement is never taken back, even if the session is deleted later (Assumption)
- Progress toward a locked achievement is computed on demand from the history, for example "7 of 10 wins" (FR-22)
- The first check for an existing player counts the whole history, so nobody loses progress

## 3. The list

Tier shows how hard it is: 1 easy, 2 medium, 3 hard.

### Getting started

| # | Name | Rule | Tier |
|---|---|---|---|
| 1 | First Game | Log your first session | 1 |
| 2 | Regular | Play 10 sessions | 1 |
| 3 | Table Veteran | Play 50 sessions | 2 |
| 4 | Centurion | Play 100 sessions | 3 |

### Winning

| # | Name | Rule | Tier |
|---|---|---|---|
| 5 | First Win | Win a session | 1 |
| 6 | Winner's Circle | Win 10 sessions | 2 |
| 7 | Champion | Win 25 sessions | 2 |
| 8 | Dynasty | Win 50 sessions | 3 |
| 9 | Hot Hand | Win 3 sessions in a row | 2 |
| 10 | On Fire | Win 5 sessions in a row | 3 |
| 11 | Comeback Kid | Win right after losing 3 sessions in a row | 2 |
| 12 | Dead Heat | Share first place in a tie | 1 |

### Variety

| # | Name | Rule | Tier |
|---|---|---|---|
| 13 | Explorer | Play 5 different games | 1 |
| 14 | Globetrotter | Play 10 different games | 2 |
| 15 | Inventor | Play a session of a custom game you created | 1 |
| 16 | Jack of All Trades | Win in 3 different games | 2 |
| 17 | Master of One | Win 10 sessions of the same game | 3 |

### Social

| # | Name | Rule | Tier |
|---|---|---|---|
| 18 | Not Alone | Play a session with another registered player | 1 |
| 19 | Full House | Play a session with 5 or more players | 1 |
| 20 | Party Host | Log 10 sessions that include a guest | 2 |
| 21 | Crowd Pleaser | Play with 10 different people, registered or guest | 2 |

### Teams

| # | Name | Rule | Tier |
|---|---|---|---|
| 22 | Team Player | Log a session in a team | 1 |
| 23 | Founder | Create a team | 1 |
| 24 | Recruiter | Own a team that has 4 or more members | 2 |
| 25 | Team Champion | Lead the overall leaderboard of a team that has at least 3 members and 10 sessions | 3 |

### Rating

| # | Name | Rule | Tier |
|---|---|---|---|
| 26 | Rising Star | Reach a rating of 1100 in any game with at least 3 rated sessions | 2 |
| 27 | Elite | Reach a rating of 1300 in any game with at least 3 rated sessions | 3 |
| 28 | Giant Slayer | Beat a player whose rating in that game was at least 200 higher than yours before the session | 3 |

### Habits

| # | Name | Rule | Tier |
|---|---|---|---|
| 29 | Weekly Habit | Log at least one session in each of 4 weeks in a row | 2 |
| 30 | Marathon | Log 5 sessions in one day | 2 |

## 4. What each check needs

All rules are computed from `sessions`, `session_participants`, `games`, `teams`, `team_members`, `ratings` and `rating_history`. No new data is collected. The checks are pure functions in `src/lib/achievements/` with tests, in the same style as `src/lib/rating/` and `src/lib/stats/`.

## 5. Open points

1. Are the thresholds right for groups of 20 to 50 users? (Assumption: yes for a pilot)
2. Should deleting a session ever take an achievement back? (Assumption: no)
3. Do guests who later link to an account inherit achievements? (Out of scope until guest linking exists, P4)
