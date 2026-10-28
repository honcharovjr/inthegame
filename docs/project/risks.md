# Risk management

Version 1.0, Oct 28, 2026. Covers report element 15.

Probability (P) and impact (I): H high, M medium, L low. Risks R1 to R5 come from the concept; the rest were found during the project.

## 15.1 Sources of risk and register

| ID | Source | Risk | P | I | Status |
|---|---|---|---|---|---|
| R1 | Market | Slow start: narrow niche and small audience | H | H | Open |
| R2 | Users | Players forget to log sessions | H | H | Open |
| R3 | Technical | Wrong rating calculation | M | H | Reduced: rating is pure functions with tests; 100 tests pass |
| R4 | Market | Competition with existing services | M | M | Open |
| R5 | Content | Filling the catalog is laborious | H | M | **Occurred**: the catalog was cut from 34 to 3 games on Oct 25 (change C8); needs to be refilled to 30 |
| R6 | Organizational | One developer: illness, exams or other courses stop the work (bus factor 1) | M | H | Open |
| R7 | Organizational | Scope creep: polishing the character takes time from MVP gaps | H | M | **Occurred** Oct 25 to 28 |
| R8 | Technical | Code written with an AI assistant has hidden defects or security holes | M | H | Controlled: review of every pull request, tests, Row Level Security on every table |
| R9 | Technical | Free-tier limits are reached during the pilot (database, bandwidth, builds) | L | M | Open; limits not verified |
| R10 | Technical | AI-generated art is inconsistent between images (drift) | H | M | Reduced: art pipeline fits one human drawing to all races |
| R11 | Legal | Personal data of users without a privacy policy | M | M | Open; needed before public launch |
| R12 | Schedule | Late start of development (Oct 24 instead of Oct 13) | Occurred | M | Compensated: delivered work is ahead of plan (SPI 1.53) |
| R13 | Measurement | No analytics, so the 1-minute logging target and retention cannot be proven | H | H | Open: PostHog not set up yet |
| R14 | Dependency | The AI subscription or its terms change | L | M | Open |

## 15.2 Responses

| ID | Strategy | Response | Owner | Trigger |
|---|---|---|---|---|
| R1 | Mitigate | Start with friends and FIT students; RS FIT promotion; invite links in team chats; targeted ads in the pilot (5,000 UAH) | Author | Fewer than 20 users a week after release |
| R2 | Mitigate | One person logs for the whole table; guests; "same again" in one tap; achievements for streaks; reminders later | Author | Fewer than 2 sessions per active user per week |
| R3 | Mitigate | Test cases on synthetic data (docs/rating.md); ratings rebuilt from stored sessions | Author | A failing test or a user report |
| R4 | Avoid | Focus on what competitors lack: classic no-box games, team rivalry, a character; free | Author | Pilot feedback names a competitor feature as a blocker |
| R5 | Mitigate | Seed 30+ games in one migration before the pilot; custom games for anything missing | Author | Catalog below 30 games at the start of the pilot |
| R6 | Accept, mitigate | Everything in Git and docs, so work can resume quickly; reserve time until mid-February 2027 | Author | A week without progress |
| R7 | Mitigate | MVP gaps first; new ideas go to the backlog through a change record | Author | Must items open at the end of a phase |
| R8 | Mitigate | One feature per pull request; author reviews and checks the preview; tests; security policies; CI to be added | Author | A bug found in production |
| R9 | Mitigate | Pagination, indexes, no polling; check usage dashboards weekly in the pilot; reserve for a paid tier | Author | Usage above 70% of a limit |
| R10 | Mitigate | Draw once on the human and fit by script; reject drifted images | Author | Visible seams or mismatch |
| R11 | Mitigate | Minimal data; account deletion; privacy policy before public launch | Author | Before any public promotion |
| R12 | Accept | Track with earned value; use the reserve time if SPI drops below 0.9 | Author | SPI below 0.9 |
| R13 | Mitigate | Set up PostHog before the pilot; time logging during the tournament by hand as a backup | Author | Pilot start without analytics |
| R14 | Accept | The code is standard Next.js and SQL, so work can continue without the assistant | Author | Price or terms change |

Review: at the end of each phase the register is updated and the status column changed.
