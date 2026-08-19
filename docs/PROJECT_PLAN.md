# Project plan — 16 August 2026 to 15 February 2027

Capacity is roughly 222 hours (6 × 37). The goal is a demonstrable pilot for one selected test rig or asset, not a generalized industrial platform.

| Month | Outcome | Main deliverables | Estimated hours |
| --- | --- | --- | ---: |
| 1 | Scope and foundations | stakeholder requirements, asset/sensor inventory, architecture, local API/database baseline | 37 |
| 2 | Data pipeline | database migrations, simulated gateway, authenticated ingestion, retained raw data | 37 |
| 3 | Dashboard MVP | React asset view, time-series charts, alert thresholds, role model | 37 |
| 4 | Hardware pilot | selected protocol adapter, buffering/retry, deployment to a non-production environment | 37 |
| 5 | Analytics and assistant | baseline anomaly rules, explainable alerts, read-only LLM tools with citations | 37 |
| 6 | Validation and handover | reliability tests, documentation, user feedback, demo and next-step backlog | 37 |

## Decisions to obtain in week 1

1. Pilot asset and sensors: signals, units, sampling rates, sensor/PLC protocol, and data ownership.
2. Hosting boundary: IAA/on-premises versus approved cloud tenant; this determines identity, networking, and data-processing approval.
3. Success criteria: e.g. ingest 95% of expected readings, display latency below 10 seconds, and detect two agreed fault scenarios.
4. Users and permissions: operator, researcher, supervisor, administrator.
5. LLM policy: approved provider/model, allowed data, retention, and whether external API use is permitted.

## Weekly operating rhythm

Use a 30-minute review each week with Akash Mangaluru-Ramananda: show a working increment, record decisions, update risks, and select the next smallest testable outcome. Give Prof. Kley a concise milestone review at the end of each month.

## First two weeks

### Week 1

- Confirm the five decisions above and create a data dictionary.
- Run this repository locally; agree API naming and timestamp convention (UTC).
- Select one pilot asset and define a replayable sample data set.

### Week 2

- Add PostgreSQL tables and migrations for assets, sensors, measurements, and alerts.
- Implement an authenticated simulated gateway that replays sample data.
- Demonstrate ingestion, storage, and a basic query to the supervisor.

## Definition of done for every increment

- Runs from documented setup steps.
- Has a small automated test or repeatable acceptance check.
- Preserves timestamps, units, source device, and data-quality state.
- Has no hard-coded credentials or unapproved external data transfer.
