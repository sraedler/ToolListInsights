# Feature Specification: 04 - Planung Entgraten/Montieren (Nacharbeit & Montage)

**Feature Branch**: `004-planung-entgraten-montieren`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/04_Planung_Entgraten_Montieren/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Workstation Capacity Planning (Priority: P1)

As a finishing team lead, I want a Kanban board structured by manual workstations (Entgratplatz 1, Entgratplatz 2, Waschanlage, Messraum, Montage), so that post-machining work is scheduled according to team shift hours.

**Why this priority**: Coordinates manual finishing steps following CNC machining.

**Independent Test**: Tested by assigning jobs to workstation columns and verifying capacity limit calculation.

**Acceptance Scenarios**:
1. **Given** completed CNC machining steps, **When** viewing the deburring board, **Then** job cards show a green readiness icon confirming parts are physically ready.
2. **Given** manual workstation capacity, **When** calculating daily limits, **Then** available hours are derived as $\text{Available Hours} = \text{Worker Count} \times \text{Shift Hours}$.

---

## Requirements *(mandatory)*

- **FR-001**: System MUST group Kanban columns by manual workstation codes (`ENTGRATEN`, `MONTAGE`, `Wäsche`, `Messraum`, `VERPACKUNG`).
- **FR-002**: System MUST calculate available capacity from worker headcount multiplied by shift length.
- **FR-003**: System MUST verify predecessor CNC machining completion before flagging deburring jobs as ready.

---

## Success Criteria *(mandatory)*

- **SC-001**: Manual workstation overbooking is prevented by dynamic headcount capacity checks.
- **SC-002**: 100% adherence to zero side-effects across module views.
