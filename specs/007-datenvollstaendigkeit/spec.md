# Feature Specification: 07 - Datenvollständigkeit (Stammdaten-Audit & Fehlende Daten)

**Feature Branch**: `007-datenvollstaendigkeit`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/07_Datenvollstaendigkeit/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Data Quality Audit Dashboard (Priority: P1)

As a data auditor or production planner, I want a dashboard listing all manufacturing orders with incomplete master data (missing NC programs, unassigned fixtures, or unlinked tool lists), so that data issues can be fixed prior to production.

**Why this priority**: Essential quality gate preventing invalid scheduling data.

**Independent Test**: Tested by applying completeness filters and validating identified incomplete steps.

**Acceptance Scenarios**:
1. **Given** orders in the database, **When** executing the audit, **Then** steps are flagged as incomplete unless valid NC programs (`ncProgram`), tool lists (`matchedListNr`), fixtures (`fixture`), and non-zero setup/run times exist.
2. **Given** an incomplete item, **When** expanding the accordion detail, **Then** exact root causes (e.g., NC program file name typo / fuzzy match) are displayed.

---

## Requirements *(mandatory)*

- **FR-001**: System MUST audit steps for `!s.ncProgram`, `!s.matchedListNr`, `fuzzy match`, `!s.fixture`, or `s.isWrongMachine`.
- **FR-002**: System MUST display Red, Orange, and Yellow severity badges corresponding to error categories.
- **FR-003**: System MUST provide direct quick-launch buttons to open d.velop DMS drawings for fixture verification.

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% detection rate of incomplete master data attributes.
- **SC-002**: Audit filter execution completes in under 100ms.
