# Feature Specification: 03 - Planung Werkzeugrüsten (Werkzeugrüst-Planung)

**Feature Branch**: `003-planung-werkzeugruesten`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/03_Planung_Werkzeugruesten/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rüstplatz & Magazinbelegungs-Matrix (Priority: P1)

As a toolroom pre-setter, I want to see a workflow matrix sorted by setup stages (Pending, In Assembly/Measurement, Staged on Cart, Installed in CNC Magazine), so that tool assemblies are prepared before physical machine start.

**Why this priority**: Eliminates machine downtime caused by waiting for tool assembly.

**Independent Test**: Tested by dragging tool setup cards across stage columns and verifying stage state updates.

**Acceptance Scenarios**:
1. **Given** a machine schedule with WinTool lists, **When** viewing the tool pre-setting matrix, **Then** tool cards display total list count, tools to setup, and tools already present in the target machine magazine.

---

### User Story 2 - Weekly Tool Component Aggregator (Priority: P2)

As a tool storekeeper, I want a weekly aggregator modal listing total required cutting inserts, holders, and cutters across all scheduled jobs, so that bulk component picking can be executed.

**Why this priority**: Optimizes warehouse picking and bulk ordering.

**Independent Test**: Tested by opening the weekly tool modal and verifying component summation.

**Acceptance Scenarios**:
1. **Given** scheduled jobs across a calendar week, **When** opening the weekly tool modal, **Then** identical inserts and cutters are aggregated into consolidated pick counts.

---

## Requirements *(mandatory)*

- **FR-001**: System MUST calculate net setup tools: $\text{Tools to Setup} = \text{Total Tools} \setminus \text{Magazine Tools}$.
- **FR-002**: System MUST compute net setup duration: $\text{Net Duration} = \text{Base Setup} + (\text{Tools to Setup} \times \text{Assembly Time per Tool})$.
- **FR-003**: System MUST provide status stages: `Preparation Pending`, `In Assembly`, `Ready on Cart`, `Installed in Magazine`.
- **FR-004**: System MUST aggregate weekly component demands into a unified picking list modal.

---

## Success Criteria *(mandatory)*

- **SC-001**: Tool setup calculation reflects live magazine inventory with 100% accuracy.
- **SC-002**: Net setup time formula reduces pre-setting workload by accurately identifying existing magazine tools.
