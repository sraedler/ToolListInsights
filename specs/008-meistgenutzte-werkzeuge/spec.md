# Feature Specification: 08 - Meistgenutzte Werkzeuge (Werkzeugnutzungs- & Eingriffszeit-Analyse)

**Feature Branch**: `008-meistgenutzte-werkzeuge`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/08_Meistgenutzte_Werkzeuge/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tool Usage Aggregation & Standard Tooling Recommendation (Priority: P1)

As a tooling engineer or purchasing agent, I want to aggregate past BDE tool usages and future scheduled tool demands for a machine over configurable day windows (e.g. 30 past days, 30 future days), so that high-demand tools are recommended for permanent machine magazine installation ("Festbestückung").

**Why this priority**: Optimizes tooling inventory and reduces magazine changeover frequency.

**Independent Test**: Tested by querying tool usage statistics by machine and verifying qualification thresholds.

**Acceptance Scenarios**:
1. **Given** historical BDE logs and future schedule data, **When** setting a 30-day past/future window, **Then** tool assemblies exceeding the threshold ($\text{Total Usage} \ge 5$) are highlighted with a "Festbestückung empfohlen" badge.
2. **Given** tools with zero planned future usages, **When** reviewing rankings, **Then** those tools are flagged as candidates for removal from the machine magazine.

---

## Requirements *(mandatory)*

- **FR-001**: System MUST aggregate historical usages (`pastDays`) and future scheduled usages (`futureDays`) by machine for tool assemblies (`ZzIdent`).
- **FR-002**: System MUST render Top 10/20 tool usage bar charts distinguishing past vs. future usage.
- **FR-003**: System MUST flag tools with $\text{Past} + \text{Future} \ge 5$ as standard magazine candidates ("Festbestückung").
- **FR-004**: System MUST support CSV/JSON exports of tool requirement rankings for purchasing.

---

## Success Criteria *(mandatory)*

- **SC-001**: Tool usage aggregation combines past BDE tables and future planning data accurately.
- **SC-002**: 100% compliance with zero side-effects across module views.
