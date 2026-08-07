# Feature Specification: 06 - Auswertung Planung (Planungsanalyse & Gantt-Belegung)

**Feature Branch**: `006-auswertung-planung`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/06_Auswertung_Planung/README.md` & Consistent 1:1 D4 Database Capacity Enforcement

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Week Gantt Timeline & Consistent 1:1 D4 Machine Capacities (Priority: P1)

As a master scheduler, I want to view multi-week Gantt timelines (1 to 20 weeks) and machine capacity load curves where machine daily capacities are consistently fetched 1:1 directly from the D4 database (`tPPS_MASTA`) for ALL machines without hardcoded fallback defaults or shift alterations, and pool jobs fill only remaining free space without overbooking.

**Why this priority**: Essential requirement for 100% data integrity between ERP D4 master data and ToolListInsights planning charts.

**Independent Test**: Tested by verifying that all machines fetch exact D4 `tPPS_MASTA` daily minutes, without any artificial fallback constants (`360`, `900`) altering the capacity limits.

**Acceptance Scenarios**:
1. **Given** machine capacity records in D4 `tPPS_MASTA`, **When** querying machine capacities for any day or view, **Then** the value is read 1:1 directly from `MS_KAPAZITAET_ZEIT_MINUTEN_...` without hardcoded fallbacks.
2. **Given** machine-assigned steps (`MachineId`), **When** scheduling a day, **Then** machine-assigned steps are placed first to reserve exact machine capacity.
3. **Given** pool steps (`MachinePoolId === 13` for C40/C42), **When** allocating pool steps, **Then** pool steps are sorted descending by duration (largest job first) and assigned to the machine with the highest remaining free capacity that fits the job without overbooking.
4. **Given** a pool step that exceeds remaining capacity on all candidate machines in the pool, **When** scheduling, **Then** the step is moved to 'Überlauf' (overflow) on the machine with higher remaining capacity instead of overbooking.

---

## Requirements *(mandatory)*

- **FR-001**: System MUST render horizontal Gantt timelines for 1 to 20 week horizons.
- **FR-002**: System MUST support synchronous cross-machine contract highlighting on mouse hover (`hoveredContractNumber`).
- **FR-003**: System MUST calculate on-time delivery adherence percentage: $\text{Adherence \%} = \frac{\text{On-Time Jobs}}{\text{Total Jobs}} \times 100$.
- **FR-004**: System MUST retrieve machine daily capacity limits 1:1 consistently directly from D4 `tPPS_MASTA` (`MS_KAPAZITAET_ZEIT_MINUTEN_...`) for ALL machines across all endpoints and components without hardcoded fallbacks or shift alterations.
- **FR-005**: System MUST schedule fixed machine-assigned jobs (`MachineId`) first to occupy capacity, then sort pool jobs (`MachinePoolId`) descending by duration and assign each job to the candidate machine with the highest remaining free capacity. Pool jobs MUST NEVER overbook a machine.
- **FR-006**: System MUST support Over-planning (Überplanung / Überlappung) when `PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`. For over-planned steps, `PSPP_DATUM_START` MUST be treated as the **End Date**, and daily allocations of `PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG` minutes per day MUST be scheduled **backwards** until total step runtime (`SetupTime + ProdTime`) is reached.
- **FR-007**: System MUST render over-planned steps (`isOverplanned: true`) using a distinct visual color (**Purple** / `#a855f7`) in both the Gantt timeline bars and the Capacity Progression Chart (`PlanningEvaluationTab`) stacked bar segments and legend toggles.
- **FR-008**: System MUST retrieve order header category (`BK_BKBE_AGBEWE_KATEGORIE` via `tKAGO.KG_FARBE`) and position category (`BP_AGBEWE_KATEGORIE`) directly from D4 SQL queries. The order category color MUST be displayed in the UI header near the contract/order number, and position category color MUST be used for position-level status filtering and Gantt machine board color coding.

---

## Clarifications

### Session 2026-08-05
- Q: How should D4 order category color (`tKAGO.KG_FARBE` / `BK_BKBE_AGBEWE_KATEGORIE` / `BP_AGBEWE_KATEGORIE`) be used? → A: Use `BK_BKBE_AGBEWE_KATEGORIE` (`tKAGO.KG_FARBE`) at the header level near contract/order number for the overall order, and use `BP_AGBEWE_KATEGORIE` at the position level for position-level status filtering and Gantt/machine board color coding.

---

## Success Criteria *(mandatory)*

- **SC-001**: Gantt timeline renders smoothly up to 20-week horizons.
- **SC-002**: Contract highlighting executes synchronously across all machine rows on mouseover.
- **SC-003**: 100% consistency between D4 `tPPS_MASTA` capacity figures and ToolListInsights capacity limit lines across all machines.
- **SC-004**: 0% machine overbooking caused by standard pool job allocations, while over-planned steps (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) are correctly allocated backwards up to `PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG` per day and highlighted in distinct Purple styling.
- **SC-005**: 100% accurate rendering of D4 category colors (`tKAGO.KG_FARBE`) at both order header and position levels.
