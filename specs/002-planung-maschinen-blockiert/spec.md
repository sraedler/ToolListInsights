# Feature Specification: 02 - Planung Maschinen blockiert (KV-Status Gelb & Rot)

**Feature Branch**: `002-planung-maschinen-blockiert`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/02_Planung_Maschinen_Blockiert/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dedicated Conflict Filtering View (Priority: P1)

As a production supervisor, I want a specialized view (`isConflictMode = true`) filtering out all green (ready) jobs and displaying only blocked (Red) or warning-flagged (Yellow) steps, so that missing prerequisites are highlighted immediately.

**Why this priority**: Focuses attention strictly on bottleneck resolution without distraction from ready jobs.

**Independent Test**: Can be tested by enabling conflict mode and confirming that only steps with `kvStatus === 'red'` or `'yellow'` are rendered.

**Acceptance Scenarios**:
1. **Given** scheduled jobs, **When** switching to the conflict mode view, **Then** all green steps are hidden and a conflict counter badge displays total blocked count.
2. **Given** conflict cards, **When** viewing the card header, **Then** prominent conflict banners display the exact reason (e.g. "NC Program missing", "Fixture not approved").

---

### User Story 2 - Manual Conflict Override & Reallocation (Priority: P2)

As a planner, I want to force-release a blocked job or reallocate it to an alternative machine, so that production can proceed when manual workarounds exist.

**Why this priority**: Resolves shop-floor blocks when prerequisites are handled outside automated systems.

**Independent Test**: Can be tested by executing a "Force Release" or machine reallocation and confirming status persistence.

**Acceptance Scenarios**:
1. **Given** a red-status job, **When** clicking "Force Release", **Then** the job status is overridden and logged in `planning_overrides.json`.
2. **Given** a blocked job on Hermle C400, **When** dragging to GROB G550, **Then** the system checks NC program and fixture availability on GROB G550.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST filter planning steps for `kvStatus === 'red'` or `'yellow'`, missing NC programs, missing fixtures, or predecessor delays when `isConflictMode === true`.
- **FR-002**: System MUST display visual alert banners and conflict details on every job card.
- **FR-003**: System MUST support category filtering: `Missing NC Program`, `Missing Fixture`, `Missing Tool List`, `Material Delay`, `Predecessor Open`.
- **FR-004**: System MUST allow manual override release ("Force Release") stored in `planning_overrides.json`.
- **FR-005**: System MUST maintain complete feature isolation with zero side-effects on other views.

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% detection rate of blocked steps matching conflict criteria.
- **SC-002**: Conflict mode response filtering executes under 100ms client-side.
