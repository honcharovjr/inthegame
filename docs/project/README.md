# Project management documentation

Version 1.0, Oct 28, 2026. These documents describe how the In the Game project is managed. They are the source for the coursework report in the discipline "Project Management" (NTU "Dnipro Polytechnic", Dept. of System Analysis and Management), which asks for 20 elements of project management.

Product documentation stays in the parent folder: [spec](../spec.md), [user stories](../user-stories.md), [data model](../data-model.md), [rating](../rating.md), [achievements](../achievements.md), [character](../character.md).

The approved concept (Task 1, in Ukrainian) is kept unchanged in [source/concept-uk.md](source/concept-uk.md). Where these documents differ from it, the reason is recorded in [changes.md](changes.md).

## Map to the report

| # | Report element | Questions | Where |
|---|---|---|---|
| 1 | Project and its external environment | 1.1 type; 1.2 environment | [charter.md §1](charter.md#1-project-and-its-environment) |
| 2 | Systems view of the real-world object | 2.1 origin; 2.2 stakeholders, integration | [charter.md §2](charter.md#2-systems-view-of-the-real-world-object) |
| 3 | Product of the project | 3.1 product; 3.2 product by stage | [charter.md §3](charter.md#3-product-of-the-project), [spec](../spec.md) |
| 4 | Goal and strategy | 4.1 goal tree; 4.2 alternative strategies | [charter.md §4](charter.md#4-goal-and-strategy) |
| 5 | Success criteria and constraints | 5.1 criteria; 5.2 measures | [charter.md §5](charter.md#5-success-criteria-and-measures) |
| 6 | Life cycle and phases | 6.1 life cycle; 6.2 phases | [structure.md §6](structure.md#6-life-cycle) |
| 7 | Project analysis and funding | 7.1 analysis, funding sources | [charter.md §7](charter.md#7-project-analysis-and-funding) |
| 8 | Project start and legal form | 8.1 base document; 8.2 legal form, milestones | [charter.md §8](charter.md#8-project-start-and-legal-form) |
| 9 | Project organization and team | 9.1 structure type; 9.2 team | [structure.md §9](structure.md#9-project-organization-and-team) |
| 10 | Work breakdown structure | 10.1 principle; 10.2 WBS | [structure.md §10](structure.md#10-work-breakdown-structure) |
| 11 | Organizational structure | 11.1 OBS; 11.2 responsibility matrix | [structure.md §11](structure.md#11-organizational-structure-and-responsibility) |
| 12 | Resource management | 12.1 RBS; 12.2 limits | [schedule.md §12](schedule.md#12-resource-management) |
| 13 | Time management | 13.1 tools; 13.2 network, critical path | [schedule.md §13](schedule.md#13-time-management) |
| 14 | Cost management | 14.1 CBS, tools; 14.2 budget | [budget.md §14](budget.md#14-cost-management) |
| 15 | Risk management | 15.1 sources; 15.2 responses | [risks.md](risks.md) |
| 16 | Quality management | 16.1 actions; 16.2 system | [quality.md §16](quality.md#16-quality-management) |
| 17 | Earned value management | 17.1 monitoring; 17.2 report and analysis | [budget.md §17](budget.md#17-earned-value-management) |
| 18 | Communications and changes | 18.1 communications; 18.2 change process, example | [changes.md](changes.md) |
| 19 | Product quality confirmation | 19.1 actions; 19.2 procedure | [quality.md §19](quality.md#19-acceptance-of-the-product) |
| 20 | Closure phase | 20.1 actions; 20.2 final report | [progress.md §20](progress.md#20-closure-phase) |

## Key numbers

| Item | Value |
|---|---|
| Duration | Sep 15 to Dec 28, 2026 (15 weeks), reserve to mid-February 2027 (5 months) |
| Budget | 103,000 UAH: labour 88,000 (440 h × 200 UAH, notional), cash 15,000 |
| Team | The author in all roles |
| Status | See [progress.md](progress.md) |

## Keeping these documents current

Update at the end of each phase, and whenever a decision changes scope, schedule or cost:

- [progress.md](progress.md): delivered increments and requirement status
- [budget.md](budget.md): hours log and a new earned value report
- [risks.md](risks.md): status of each risk
- [changes.md](changes.md): new change records
- [schedule.md](schedule.md): actual bars in the Gantt chart

Diagrams are written in Mermaid; GitHub renders them, and they can be exported as images for the report.
