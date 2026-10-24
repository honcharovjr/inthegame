# Rating: In the Game

Version 0.1, draft. The algorithm is a proposal. Parameters are starting values and must be tuned on pilot data. Items marked "Assumption" need confirmation.

## 1. Goals

- Reflect a player's results per game
- Simple and explainable to players
- Deterministic: the same sessions always give the same ratings
- Works for 2 or more players, ties, and guests
- Reasonable behavior with few games (20 to 50 users, small groups)

## 2. Overview

Each player has one rating per game. The system is Elo-style. A session with N participants is turned into pairwise comparisons: every participant is compared with every other participant by place. All ratings in the session are updated at once, using the ratings from before the session.

Uncertainty: Elo is designed for 1 vs 1 results. The pairwise extension to several players is a common approximation, but it has not been validated for this product. Results should be checked against pilot data.

## 3. Parameters (Assumption, tune later)

| Parameter | Starting value | Meaning |
|---|---|---|
| Initial rating | 1000 | Rating of a player with no games in this game |
| K | 32 | Maximum change scale |
| Scale | 400 | Standard Elo scale |
| Minimum participants | 2 | Sessions with fewer are stored but not rated |
| Minimum games to appear on a leaderboard | 3 | Reduces noise (Assumption) |

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
| Guests | Rated like any player (Assumption). If a guest is later merged into an account, ratings of affected games are rebuilt |
| Team results | Not in the MVP |
| Unconfirmed sessions | Only sessions with status confirmed count. In the MVP all sessions are confirmed |
| Session order | Sessions are replayed by `played_at`, then by `created_at` as a tie-breaker |
| Edit or delete of a session | Rebuild the rating of that game from scratch by replaying its sessions |

## 6. Statistics definitions

| Metric | Definition |
|---|---|
| Games played | Number of sessions the player took part in |
| Win | Place 1 in a session with at least 2 participants. A shared first place counts as a win (Assumption) |
| Win rate | Wins divided by sessions with at least 2 participants |

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

1. **Overall leaderboard:** ratings of different games are not comparable. Proposal for the MVP: the overall leaderboard of a group is ranked by wins and games played, and only per-game leaderboards use rating. Needs your decision
2. Is 1000 and K = 32 acceptable, or should new players have a higher K for their first games?
3. Should guest ratings be hidden from leaderboards?
4. Luck-heavy games (dice, simple card games) will produce noisy ratings. Show a "casual" label for such games, or accept the noise?
