# Cost and earned value

Version 1.0, Oct 28, 2026. Covers report elements 14 and 17.

## 14. Cost management

### 14.1 Cost breakdown structure (CBS)

Labour is notional: the author is not paid, but every hour is counted at **200 UAH per hour** (concept, section 10), so cost and earned value can be measured. The other lines are real cash spending.

| Code | Cost item | Basis | UAH |
|---|---|---|---:|
| 1 | **Labour** | 440 h × 200 UAH | **88,000** |
| 1.1 | Initiation | 30 h | 6,000 |
| 1.2 | Requirements and design | 50 h | 10,000 |
| 1.3 | P1 Core and sessions | 60 h | 12,000 |
| 1.4 | P2 Rating and stats | 60 h | 12,000 |
| 1.5 | P3 Customization and profile | 60 h | 12,000 |
| 1.6 | P4 Social and tools | 70 h | 14,000 |
| 1.7 | Pilot | 60 h | 12,000 |
| 1.8 | Final | 30 h | 6,000 |
| 1.9 | Project management | 20 h | 4,000 |
| 2 | **Software and services** | | **6,000** |
| 2.1 | Claude subscription | 5 months × 1,000 | 5,000 |
| 2.2 | Domain name, 1 year | Pilot | 1,000 |
| 2.3 | Supabase, Vercel, GitHub, PostHog, Sentry | Free tiers (limits to be checked on the websites) | 0 |
| 3 | **Pilot** | | **6,000** |
| 3.1 | Promotion: targeted ads | Pilot | 5,000 |
| 3.2 | Tournament prize fund | Pilot; RS FIT may cover it | 1,000 |
| 4 | **Reserve** | Used only by a recorded change decision | **3,000** |
| | **Total budget (BAC incl. reserve)** | | **103,000** |
| | of which cash | Lines 2 to 4 | 15,000 |

Cost management tools:

- This CBS as the baseline; cost per WBS package
- Hours log (below) as the source of actual labour cost
- Earned value report every two weeks, at the end of each phase
- Free-tier first: every service starts on a free plan; a paid plan needs a decision in [changes.md](changes.md)
- Reserve only through a recorded change

### 14.2 How the budget was set

1. Listed the work packages (WBS, [structure.md](structure.md)) and estimated hours for each by analogy with similar student web projects, then rounded to 440 h for the 15 weeks of work (about 30 h per week)
2. Priced labour at 200 UAH per hour, a notional junior developer rate
3. Added the real cash items: the AI coding subscription for the 5 months, a domain for the pilot, promotion and a prize fund
4. Added a reserve of 3,000 UAH (about 20% of the cash part) for unexpected costs, for example a paid tier during the pilot
5. Spread the cost over time by phase to get the planned value curve

Planned cumulative labour cost (planned value, PV) at phase ends:

| Date | Phase ends | PV, h | PV, UAH |
|---|---|---:|---:|
| Sep 28 | Initiation | 33 | 6,600 |
| Oct 12 | Requirements | 85 | 17,000 |
| Oct 26 | P1 | 148 | 29,600 |
| Nov 9 | P2 | 211 | 42,200 |
| Nov 23 | P3 | 273 | 54,600 |
| Dec 7 | P4 | 346 | 69,200 |
| Dec 21 | Pilot | 409 | 81,800 |
| Dec 28 | Final | 440 | 88,000 |

Project management (20 h) is spread evenly over the 105 days and included in each row.

## 17. Earned value management

### 17.1 Monitoring system

- **Status date:** the end of each two-week phase, plus any date the supervisor asks for
- **PV:** from the table above, interpolated by day inside a phase
- **EV:** budget of each WBS package × its percent complete. Percent complete is the share of the package's acceptance criteria that are met in production (user stories in [../user-stories.md](../user-stories.md), status in [progress.md](progress.md))
- **AC:** hours from the hours log × 200 UAH
- **Indicators:** CV = EV − AC, SV = EV − PV, CPI = EV / AC, SPI = EV / PV, EAC, ETC, VAC
- **Thresholds:** CPI or SPI below 0.9 triggers a corrective action recorded in [changes.md](changes.md) (cut scope, use reserve time, or re-plan)
- Labour only; cash costs are tracked separately against their CBS lines

### 17.2 Hours log

**The hours below are estimates and need to be replaced with the author's real hours before the report is submitted.**

| Period | Work | Hours (estimate) |
|---|---|---:|
| Sep 15 to Oct 23 | Concept, charter, competitor review, spec, user stories, data model, rating | 80 |
| Oct 24 | Repository, schema, security policies, auth, catalog | 10 |
| Oct 25 | Log flow, rating, history, teams, achievements, character v1 | 14 |
| Oct 27 | Layered character art, outfits, customizer | 12 |
| Oct 28 | Customizer polish, MVP gap review, project docs | 4 |
| Sep 15 to Oct 28 | Project management | 8 |
| | **Total (AC)** | **128** |

### 17.3 Earned value report, status date Oct 28, 2026 (day 43 of 105)

| WBS | Package | Budget, h | Complete | EV, h |
|---|---|---:|---:|---:|
| 1 | Initiation | 30 | 100% | 30.0 |
| 2 | Requirements and design (no separate prototype; built in code) | 50 | 92% | 46.0 |
| 3 | P1 Core and sessions (catalog has 3 games, no session edit) | 60 | 88% | 52.8 |
| 4 | P2 Rating and stats (no per-game stats, charts, head to head) | 60 | 80% | 48.0 |
| 5 | P3 Customization and profile (accessory art missing) | 60 | 92% | 55.2 |
| 6 | P4 Social and tools | 70 | 0% | 0 |
| 7 | Pilot | 60 | 0% | 0 |
| 8 | Final | 30 | 0% | 0 |
| 9 | Project management | 20 | 40% | 8.0 |
| | **Total** | **440** | | **240.0** |

PV on Oct 28: phases 1 to 3 (140 h) + 2 of 14 days of P2 (8.6 h) + project management (8.2 h) ≈ **157 h**.

| Indicator | Hours | UAH | Meaning |
|---|---:|---:|---|
| BAC | 440 | 88,000 | Labour budget |
| PV | 157 | 31,400 | Work planned by Oct 28 |
| EV | 240 | 48,000 | Work actually done, at budget cost |
| AC | 128 | 25,600 | Actual cost (estimated hours) |
| CV = EV − AC | 112 | 22,400 | Under budget |
| SV = EV − PV | 83 | 16,600 | Ahead of schedule in delivered work |
| CPI = EV / AC | 1.88 | | Each hour delivers 1.88 planned hours of work |
| SPI = EV / PV | 1.53 | | 53% more work done than planned |
| EAC = AC + (BAC − EV) | 328 | 65,600 | Forecast if the remaining work goes as planned (recommended: pilot and report do not speed up with AI) |
| EAC = BAC / CPI | 234 | 46,900 | Forecast if the current efficiency continues |
| ETC = EAC − AC | 200 | 40,000 | Remaining cost (with the recommended EAC) |
| VAC = BAC − EAC | 112 | 22,400 | Expected saving (with the recommended EAC) |

Analysis:

- **Cost:** CPI 1.88. The AI coding assistant writes most of the code; the author's time goes into decisions, review and checks. The saving is in labour hours, not cash
- **Schedule:** SPI 1.53 even though development started 11 days late (Oct 24 instead of Oct 13). Most of P1, P2 and P3 was built in four days
- **Risk in the numbers:** the high indices hide uneven progress. P3 is almost done while P1 and P2 still have Must gaps (catalog, session edit, analytics, per-game stats). Corrective action: finish the MVP gaps before starting P4 ([progress.md](progress.md))
- **Forecast:** the project should finish within budget and before the Dec 28 baseline, with the 3,000 UAH reserve untouched
