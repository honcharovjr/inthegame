# Communications and changes

Version 1.0, Oct 28, 2026. Covers report element 18.

## 18.1 Communication plan

| What | Who | Channel | When |
|---|---|---|---|
| Progress against plan (self-review) | Author | These docs, [progress.md](progress.md) | Weekly; full review at the end of each phase |
| Change of every feature | Author (developer → reviewer) | GitHub pull request with description and preview | Per feature |
| Consultation and progress report | Author → supervisor | Practical classes and consultations | During the semester, as scheduled by the department |
| Coursework submission | Author → supervisor | Printed and electronic report | Before the final class |
| Defence | Author → supervisor and group | Presentation | Final class of the semester |
| Pilot organization | Author ↔ RS FIT | Meetings, messenger | From P4 (about Nov 24) to the tournament |
| Pilot users | Author ↔ players | Team invite links, a group chat, in-app feedback link (FR-36) | During the pilot, daily |
| Incidents | Author → affected users | Group chat | Within a day of a problem |

Principles: one source of truth (the repository); decisions are written down, not only discussed; stakeholders outside the project hear about changes that affect them.

## 18.2 Change management

### Process

```mermaid
flowchart LR
  A["Change request: idea, feedback, problem"] --> B["Record in this file"]
  B --> C["Impact: scope, hours, cost, risks, report"]
  C --> D{"Decision by the product owner"}
  D -->|rejected| E["Backlog or closed"]
  D -->|approved| F["Update docs: spec, stories, data model"]
  F --> G["Branch, pull request, review, merge"]
  G --> H["Update plan, budget and risks"]
```

Rules:

- Every change that affects scope, schedule, cost or the data model gets a record here
- New tables or columns are added only after the data model is updated
- Changes to MVP scope are checked against the report's success criteria; changes that affect the coursework are discussed with the supervisor
- Small UI polish inside an approved feature needs no record; the pull request is enough

### Change log

| ID | Date | Change | Reason | Impact | Decision |
|---|---|---|---|---|---|
| C1 | Requirements phase | Code written with an AI assistant (Next.js, Supabase) instead of no-code platforms | Row Level Security, custom rating and the character renderer are hard or impossible on no-code tools | Higher control and quality; review effort for the author | Approved |
| C2 | Requirements phase | GitHub and docs in the repository instead of Jira and Google Drive | One person; one source of truth next to the code | No cost; simpler | Approved |
| C3 | Requirements phase | MVP narrowed to P1 and P2: accounts, catalog, sessions, history, stats, rating, minimal teams | 5 months, one developer | Admin panel, seasons, custom dashboards, catalog moderation, comments and role distribution moved to the backlog or later phases | Approved |
| C4 | Requirements phase | Own online games (no multiplayer → multiplayer → ranked) out of scope | Too large for the project | Concept goal 5 not pursued in this project | Approved |
| C5 | Requirements phase | Session place and duration fields not in the MVP; note field kept | Logging must take under 1 minute | Fewer fields in the log flow | Approved |
| C6 | Requirements phase | Admin panel replaced by the maintainer editing catalog and achievements through migrations | Saves P4 time | No admin UI | Approved |
| C7 | Oct 25, 2026 | "Groups" renamed to "teams" | Clearer for users | Migration and UI rename | Approved |
| C8 | Oct 25, 2026 | Catalog reduced to 3 games (Chess, Yahtzee, Codenames), with their sessions removed | Author's request to clean test data | Conflicts with the 30-game requirement (FR-06); risk R5 occurred | Approved; refill planned before the pilot |
| C9 | Oct 25, 2026 | P3 work (30 achievements, character) pulled ahead before P2 was complete | Motivation and demo value | P1 and P2 gaps remain open (see [progress.md](progress.md)) | Approved; gaps first from now on |
| C10 | Oct 27, 2026 | Simple blob characters replaced by layered fantasy characters: 5 races, hair, beards, eye colour, 10 free outfits | Product feel: the blobs did not look like a game | About 2 days of work; new art pipeline scripts | Approved |
| C11 | Oct 27, 2026 | Game-style customizer: character on the left, tabs, camera zoom, dice, animations; accessories and badges hidden until they have art | Usability and uniqueness | Accessory art moved to the backlog | Approved |
| C12 | Oct 28, 2026 | Project management docs added in `docs/project/` | Coursework report needs the 20 PM elements | About 4 h | Approved |

Example in detail (C10): the first character was a simple coloured blob. During P3 the author decided it did not feel like a game. Impact assessment: about 2 days of work, no extra cash (art generated with existing AI tools), no data model change beyond the character's saved choices. Decision: approved, because the character is the main motivation feature. Result: a layered art pipeline, 5 races and 10 outfits, merged in PRs #30 to #34.
