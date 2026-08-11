# Feature Specification: 01 - Planung Maschinen (Kanban-Maschinenbelegungsplanung)

**Feature Branch**: `001-planung-maschinen`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: Feature documentation from `Features/01_Planung_Maschinen/README.md`  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Kanban Belegungsplanung (Priority: P1)

As a shop-floor scheduler, I want to visually manage CNC machining center workloads across flexible day horizons (5, 7, 10, 14, or 21 days), so that machine capacities are fully utilized without overbooking.

**Why this priority**: Core operational view for daily CNC machine assignment.

**Independent Test**: Can be tested independently by loading the Kanban board with machine columns, changing planning horizons, and inspecting column capacity summaries.

**Acceptance Scenarios**:
1. **Given** the scheduler opens the planning page, **When** selecting a 7-day horizon and filtering by "Hermle C400", **Then** only scheduled jobs for Hermle C400 across 7 workdays are shown.
2. **Given** scheduled job cards, **When** reviewing column headers, **Then** total planned hours and utilization percentage are updated dynamically.

---

### User Story 2 - Rüst- und Geisterschicht-Optimierung (Priority: P2)

As a production planner, I want to execute optimization algorithms (Greedy, Local Search, Simulated Annealing) to re-order job steps by tool lists, fixture weightings, and night-shift capabilities, so that setup changeovers are minimized.

**Why this priority**: Dramatically reduces downtime and enables unmanned overnight production runs.

**Independent Test**: Can be tested by toggling optimization switches and verifying that jobs with identical tool lists or fixtures are clustered together.

**Acceptance Scenarios**:
1. **Given** a batch of jobs with overlapping WinTool lists, **When** setup optimization is triggered, **Then** jobs sharing identical tool IDs are grouped sequentially on the target machine.
2. **Given** long-running jobs marked as night-run capable (`isNightRunCapable === true`), **When** night-shift optimization is enabled, **Then** those jobs are automatically moved to the end of the day shift for overnight execution.

---

### User Story 3 - Drag & Drop Manual Overrides & Splitting (Priority: P3)

As a scheduler, I want to manually drag job cards between machines or dates and split large production lots, so that emergency adjustments are persisted across sessions.

**Why this priority**: Gives human planners absolute override authority over automated suggestions.

**Independent Test**: Can be tested by dragging a job card to a new column and confirming persistence in `planning_overrides.json`.

**Acceptance Scenarios**:
1. **Given** a job card, **When** dragged to a different machine, **Then** a POST request to `/api/planning/override` persists the manual machine and date assignment.
2. **Given** a long job lot, **When** performing a split operation, **Then** remaining quantities are scheduled as follow-up steps.

---

### User Story 4 - Detail Inspection & d.velop DMS Drawing Viewer (Priority: P4)

As a machine operator, I want to click any job card to view routing details, BDE bookings, WinTool lists, and open construction drawings in an inline PDF viewer.

**Why this priority**: Direct access to engineering documentation at the machine.

**Independent Test**: Can be tested by clicking a job card and launching the d.velop DMS PDF viewer with zoom/rotate controls.

**Acceptance Scenarios**:
1. **Given** an open job detail modal, **When** clicking the DMS Drawing button, **Then** the drawing renders in an inline PDF viewer with 90-degree rotation and zoom capabilities.

---

### User Story 5 - Priorisierung überfälliger & naher Liefertermine (Priority: P2)

As a production planner, I want setup optimization algorithms (Greedy, Local Search, Simulated Annealing) to prioritize jobs with overdue or imminent delivery dates (`DeliveryDate` / D4 Termin), so that urgent or delayed customer orders are scheduled earlier, even if tool setup changeover optimization would otherwise group them later.

**Why this priority**: Prevents production lateness and ensures critical/overdue D4 delivery dates take precedence over tool changeover minimization.

**Independent Test**: Can be tested by running setup optimization on a job list where one job has an overdue `DeliveryDate` and confirming that the overdue job is prioritized to the front of the schedule.

**Acceptance Scenarios**:
1. **Given** a set of jobs where job A has an overdue `DeliveryDate` (or D4 date in the past) and job B has a far-future delivery date with matching tools, **When** setup optimization is triggered, **Then** job A is scheduled before job B.
2. **Given** multiple jobs with varying delivery dates, **When** setup sequence optimization evaluates candidates, **Then** delivery urgency score (`overdueDays` / earliest `DeliveryDate`) is weighted into candidate selection alongside tool list similarity and fixture matching.

---

### Edge Cases

- **Database Offline**: If ERP or WinTool SQL databases disconnect, cached board data is loaded with a warning banner.
- **Overbooking Warning**: Spans exceeding 16 daily capacity hours trigger visual warning highlights.
- **Zero Side-Effects**: Modifications in this view MUST NOT alter component state or layout of other feature tabs (`Allgemeine_Regeln.md`).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide Kanban columns per CNC machine displaying scheduled job cards and total utilization.
- **FR-002**: System MUST support planning horizon switches (5, 7, 10, 14, 21 days) and machine filtering.
- **FR-003**: System MUST execute setup optimization using Greedy, Local Search, or Simulated Annealing algorithms.
- **FR-004**: System MUST cluster jobs by tool list IDs (`ZzIdent`) and fixture numbers (`fixture`) weighted by `fixtureWeight` (0–100%).
- **FR-005**: System MUST position night-run capable jobs (`isNightRunCapable === true`) at the end of the day shift.
- **FR-006**: System MUST persist manual drag-and-drop machine/date overrides to `backend/planning_overrides.json`.
- **FR-007**: System MUST provide an inline d.velop DMS PDF viewer with proxy streaming, zoom, and rotation.
- **FR-008**: System MUST display deterministic contract colors (`getContractColor`) per order.
- **FR-009**: System MUST propose entire tool list unloading for Chiron machine operations (`mName === 'Chiron'`). When an order (e.g. `2537-0301-SP1`) is completed according to planning, the system MUST propose to unload its entire Tool List as a complete unit (all tools belonging to that completed list), EXCEPT tools that are also in any `"park"` list (which remain static in the machine) and tools that are still required by upcoming/subsequent steps in the schedule.
- **FR-010**: System MUST classify all tools contained in ToolLists whose name contains `"park"` (case-insensitive, retrieved from `MachineToProgram` / `ProgramToTool` in the `ToolList` database) as **Static Park Tools**. Static Park Tools MUST NEVER be unloaded or evicted from machine magazines during simulation, sequence optimization, LRU victim eviction, or manual scenario configuration.
- **FR-011**: System MUST prioritize jobs with overdue or imminent delivery dates (`DeliveryDate <= today` or near deadline) during setup sequence optimization (Greedy, Local Search, Simulated Annealing), ensuring overdue and urgent D4 orders are scheduled earlier in the sequence rather than being deferred behind far-future jobs purely for tool changeover savings.

---

### Key Entities

- **Job Card**: Scheduled routing step containing `orderId`, `articleId`, `AR_STEP`, `setupTimeMin`, `runTimeMin`, `kvStatus`, `ncProgram`, `fixture`, and `toolListNr`.
- **Planning Override**: Persistent manual override payload stored in `planning_overrides.json`.

---

## Success Criteria *(mandatory)*

- **SC-001**: Schedule calculation API (`GET /api/planning`) completes under 200ms p95.
- **SC-002**: Setup optimization reduces total batch setup time by at least 15%.
- **SC-003**: 100% compliance with zero side-effects requirement across tabs.
