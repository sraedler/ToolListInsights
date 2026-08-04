# Feature Specification: 05 - Zeitauswertung (Soll vs. Ist Maschinenzeiten)

**Feature Branch**: `005-zeitauswertung`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/05_Zeitauswertung/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Efficiency Index & Variance Analysis (Priority: P1)

As a production controller, I want to compare ERP target setup/run times against BDE actual recorded times, so that efficiency indices and extreme time overruns (> +25%) are identified.

**Why this priority**: Core financial and efficiency controlling for machining operations.

**Independent Test**: Tested by querying time evaluation data over date ranges and validating efficiency formulas.

**Acceptance Scenarios**:
1. **Given** BDE feedback logs, **When** executing the evaluation report, **Then** efficiency index is calculated as $\text{Efficiency \%} = \frac{\text{Target Setup} + \text{Target Run}}{\text{Actual Setup} + \text{Actual Run}} \times 100$.
2. **Given** time variance exceeding +25%, **When** rendering the breakdown grid, **Then** the row is highlighted in red.

---

## Requirements *(mandatory)*

- **FR-001**: System MUST compute efficiency index percentage and variance percentages.
- **FR-002**: System MUST render interactive Recharts bar and trend charts comparing target vs. actual hours.
- **FR-003**: System MUST provide detailed breakdown grid with filtering and search capabilities.

---

## Success Criteria *(mandatory)*

- **SC-001**: Efficiency index calculations match exact mathematical formulas.
- **SC-002**: Data fetching from BDE/MSSQL sources completes under 300ms.
