# Rating: In the Game

Version 0.1, draft. The algorithm is a proposal. Parameters are starting values and must be tuned on pilot data. Items marked "Assumption" need confirmation.

## 1. Goals

- Reflect a player's results per game
- Simple and explainable to players
- Deterministic: the same sessions always give the same ratings
- Works for 2 or more players, ties, and guests
- Reasonable behavior with few games (20 to 50 users, small teams)

## 2. Overview

Each player has one rating per game. The system is Elo-style. A session with N participants is turned into pairwise comparisons: every participant is compared with every other participant by place. All ratings in the session are updated at once, using the ratings from before the session.

Uncertainty: Elo is designed for 1 vs 1 results. The pairwise extension to several players is a common approximation, but it has not been validated for this product. Results should be checked against pilot data.

## 3. Parameters (accepted for the MVP, tune later)

| Parameter | Starting value | Meaning |
|---|---|---|
| Initial rating | 1000 | Rating of a player with no games in this game |
| K | 32 | Maximum change scale |
| Scale | 400 | Standard Elo scale |
| Minimum participants | 2 | Sessions with fewer are stored but not rated |
| Minimum games to appear on a leaderboard | 3 | Reduces noise |

All parameters live in one config file in `src/lib/rating/`.

## 4. Formulas

For two players A and B in the same session:

- Expected score of A against B: `E_AB = 1 / (1 + 10^((R_B - R_A) / 400))`
- Actual score of A against B: `S_AB = 1` if A has a better place, `0.5` if places are equal, `0` if worse

For a session with N participants, the change for player A is:

`delta_A = (K / (N - 1)) * sum over all other players B of (S_AB - E_AB)`

New rating: `R_A_new = R_A + delta_A`.

Dividing K by N - 1 keeps the change per session comparable for tables of different sizes. The total of all changes in one session is zero, so rating points are only redistributed, not created.

Ratings are stored as numbers and shown rounded to integers.

## 5. Special cases

| Case | Rule |
|---|---|
| Ties | Tied players share a place and score 0.5 against each other |
| Winner only | Winner has place 1, all others share place 2. Others therefore tie with each other, which slightly pulls their ratings together. Accepted for the MVP |
| Points result type | Places are derived from scores, equal scores give a tie |
| One participant | Session is stored, no rating change |
| Guests | A session with at least one guest is stored and shown in history, marked as unrated, and changes nobody's rating. Guests have no ratings. When a guest is linked to an account, history shows the account name with a guest mark; old sessions are not re-rated (change C23) |
| Deleted custom game | Its ratings and rating history are removed and it is not replayed again; its sessions stay in history (change C24) |
| Side (team game) results | Not in the MVP. Stored as `side_no` on each participant (FR-12) |
| Unconfirmed sessions | Only sessions with status confirmed count. In team-managed teams a pending session is confirmed automatically after 48 hours (FR-50) |
| Session order | Sessions are replayed by `played_at`, then by `created_at` as a tie-breaker |
| Edit or delete of a session | Rebuild the rating of that game from scratch by replaying its sessions |

## 6. Statistics definitions

| Metric | Definition |
|---|---|
| Games played | Number of sessions the player took part in, including unrated sessions with guests |
| Win | Place 1 in a session with at least 2 participants. A shared first place counts as a win. Unrated sessions with guests count too |
| Win rate | Wins divided by sessions with at least 2 participants |

### Overall rating

The overall rating of a player is the average of their game ratings, weighted by `games_count`, over games with at least 3 rated sessions. A player with no such game has no overall rating. The overall team leaderboard ranks by it (FR-18); wins and games played are shown beside it. It is derived from `ratings`, so nothing extra is stored (change C23).

## 7. Implementation notes

- Pure function in `src/lib/rating/`: takes current ratings, session participants (with places) and parameters, returns new ratings. No database access inside it
- A separate rebuild function replays all sessions of one game and writes `ratings` and `rating_history`
- Rating tables are written by server-side code only, never directly by clients
- Rebuild cost is not a concern at 20 to 50 users. Revisit if data grows

## 8. Test plan (synthetic data)

Hand-checked cases with K = 32 and initial rating 1000:

| Case | Expected result |
|---|---|
| Two equal players, A wins | A +16, B -16 |
| Three equal players, places 1, 2, 3 | +16, 0, -16 |
| Full tie, equal ratings | No change for anyone |
| Player rated 1200 beats player rated 1000 | Winner gains about 7.7, loser loses the same |
| Player rated 1000 beats player rated 1200 | Winner gains about 24.3, loser loses the same |

Property checks:

- The sum of changes in any session is zero (within rounding)
- Expected scores are symmetric: `E_AB + E_BA = 1`
- Rebuilding twice gives identical results
- Deleting a session and rebuilding equals a history in which it never existed
- Changing the order of sessions with equal timestamps does not change the result, thanks to the tie-breaker

## 9. Open questions

1. Answered: the overall leaderboard ranks by the weighted average of game ratings (section 6)
2. Answered: 1000 and K = 32 for the MVP
3. Answered: guests have no ratings (section 5)
4. Answered: luck-heavy games keep the general Elo and accept the noise for now. Later, parameters can be tuned per game after analysing pilot data
5. Answered: all ratings are rebuilt once without sessions with a guest; those sessions count toward wins and win rate (section 6)
