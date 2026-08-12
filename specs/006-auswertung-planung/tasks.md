# Tasks: 06 - Auswertung Planung (Planungsanalyse, Gantt-Belegung & Pool-Nachtlaufzeit)

**Input**: Design documents from [`specs/006-auswertung-planung/`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/)

**Prerequisites**: [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/plan.md), [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md), [`research.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/research.md), [`data-model.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/data-model.md), [`contracts/gantt-api.json`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/contracts/gantt-api.json), [`quickstart.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/quickstart.md)

**Tests**: Unit & Contract tests are included in `Features/06_Auswertung_Planung/test.js`.

**Organization**: Tasks are grouped by user story (US1 to US4) to enable independent implementation and testing.

## Format: `- [x] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Parallelizable (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3], [US4])

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment verification and test runner setup

- [x] T001 Verify project structure and test runner configuration in `package.json` and `Features/run_tests.js`
- [x] T002 [P] Verify database connection settings and environment configuration in `backend/db.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and capacity querying infrastructure required before implementing user stories

- [x] T003 Verify D4 database query framework in `backend/db.js` for direct 1:1 machine capacity retrieval from `tPPS_MASTA` without fallback constants
- [x] T004 [P] Refactor base Gantt schedule data structure in `backend/models/ganttAnalysis.js` to support step splits, day window capacity limits, and night run fields
- [x] T005 [P] Implement shared daily workload calculation helpers in `backend/models/ganttAnalysis.js`

---

## Phase 3: User Story 1 - Multi-Week Gantt Timeline & Consistent 1:1 D4 Machine Capacities (Priority: P1) 🎯 MVP

**Goal**: Render multi-week Gantt timelines (1-20 weeks) where machine daily capacities are fetched 1:1 directly from D4 `tPPS_MASTA` for all machines, and pool steps fill free capacity without overbooking.

**Independent Test**: Run tests 1, 2, and 3 in `Features/06_Auswertung_Planung/test.js` to verify exact 1:1 D4 capacity figures and non-overbooking pool job allocations.

### Tests & Implementation for User Story 1

- [x] T006 [P] [US1] Update unit tests for 1:1 D4 capacity retrieval and two-pass pool allocation in `Features/06_Auswertung_Planung/test.js`
- [x] T007 [P] [US1] Update API endpoint for multi-week horizon query (`weeksCount` 1 to 20) in `backend/server.js` per contract `specs/006-auswertung-planung/contracts/gantt-api.json`
- [x] T008 [US1] Implement Two-Pass Capacity-Proportional Best-Fit Pool Allocation algorithm in `backend/models/ganttAnalysis.js`
- [x] T009 [P] [US1] Implement synchronous contract number hover matcher logic in `frontend/src/components/GanttChart.jsx`
- [x] T010 [US1] Update Gantt timeline rendering and machine load curve components in `frontend/src/components/GanttChart.jsx`

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Uninterrupted Setup Time ("Rüstzeit am Stück") & Daily Milling Runtime Splitting (Priority: P2)

**Goal**: Guarantee that setup time (`setupTime`) is scheduled 100% contiguous on Day 1 (`splitPart: 1`), deferring start if free capacity on candidate day is less than setup time. Split remaining milling production time across subsequent working days capped by daily machine capacity (`maxProdTag` & D4 limit).

**Independent Test**: Run tests 6 and 7 in `Features/06_Auswertung_Planung/test.js` verifying contiguous setup placement and daily milling runtime capping.

### Tests & Implementation for User Story 2

- [x] T011 [P] [US2] Update unit tests for contiguous setup placement ("Rüstzeit am Stück") and daily milling splitting in `Features/06_Auswertung_Planung/test.js`
- [x] T012 [US2] Implement Contiguous Setup Verification algorithm in `backend/models/ganttAnalysis.js` (defer start if free capacity < setup time)
- [x] T013 [US2] Implement Day 1 Contiguous Setup Allocation (`allocatedSetup = setupTime`) in `backend/models/ganttAnalysis.js`
- [x] T014 [US2] Implement Multi-Day Milling Production Time Splitting (`splitPart: 2+`, `setupTime = 0`) in `backend/models/ganttAnalysis.js`
- [x] T015 [P] [US2] Update frontend step bar rendering in `frontend/src/components/GanttChart.jsx` to distinguish contiguous setup blocks from split milling segments

**Checkpoint**: User Story 2 fully functional and testable independently.

---

## Phase 5: User Story 3 - Pool Machine Night Run Capacity Optimization & 24h Ceiling (Priority: P3)

**Goal**: Enable unmanned night run optimization for pool machines. Calculate $\text{AvgPieceTime} = \frac{\text{TotalStepProdTime}}{\text{PosQuantity}}$ and $\text{MaxNightCapacity} = \text{MaxPiecesPerNight} \times \text{AvgPieceTime}$. Enforce strict Day Window cap (`DayCapacity`, e.g. 8h) during day shift and maximize night shift up to $\min(\text{MaxNightCapacity}, 1440 - \text{DayShiftPlannedTime})$ with a hard 24h daily ceiling per machine.

**Independent Test**: Add and run Test 8 in `Features/06_Auswertung_Planung/test.js` verifying average piece time calculation, day window limit enforcement, and strict 24-hour (1,440 min) daily ceiling.

### Tests & Implementation for User Story 3

- [x] T016 [P] [US3] Write unit test (Test 8) for Pool Machine Night Run Capacity calculation, Day Window capping, and 24h ceiling in `Features/06_Auswertung_Planung/test.js`
- [x] T017 [P] [US3] Update backend pool machine configuration model `PoolNightRunConfig` in `backend/models/ganttAnalysis.js`
- [x] T018 [US3] Implement Average Piece Time ($\text{AvgPieceTime}$) and Maximum Night Capacity ($\text{MaxNightCapacity}$) calculation engine in `backend/models/ganttAnalysis.js`
- [x] T019 [US3] Implement Night Shift Allocation algorithm with strict Day Window cap enforcement and hard 24-hour (1,440 min) daily ceiling in `backend/models/ganttAnalysis.js`
- [x] T020 [P] [US3] Update `GET /api/planning` endpoint in `backend/server.js` to accept `nightRunOptimization` parameter per contract `specs/006-auswertung-planung/contracts/gantt-api.json`
- [x] T021 [P] [US3] Add Night Run capacity stacked bar segments and toggle controls to `frontend/src/components/PlanningEvaluationTab.jsx`

**Checkpoint**: User Story 3 fully functional and testable independently.

---

## Phase 6: User Story 4 - Over-planning Visual Styling & D4 Order/Position Category Colors (Priority: P4)

**Goal**: Schedule over-planned steps (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) backwards from end date and highlight in distinct Purple (`#a855f7`). Render D4 order header category (`BK_BKBE_AGBEWE_KATEGORIE` / `tKAGO.KG_FARBE`) near contract header and position category color (`BP_AGBEWE_KATEGORIE`) for status filtering and Gantt bar styling.

**Independent Test**: Run test 5 in `Features/06_Auswertung_Planung/test.js` and verify UI color application.

### Tests & Implementation for User Story 4

- [x] T022 [P] [US4] Write unit test for over-planning backward allocation and D4 category color retrieval in `Features/06_Auswertung_Planung/test.js`
- [x] T023 [US4] Implement Backward Scheduling for Over-planned steps (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) in `backend/models/ganttAnalysis.js`
- [x] T024 [P] [US4] Add D4 SQL queries for order header category (`BK_BKBE_AGBEWE_KATEGORIE` via `tKAGO.KG_FARBE`) and position category (`BP_AGBEWE_KATEGORIE`) in `backend/db.js`
- [x] T025 [P] [US4] Update Gantt timeline bar styling in `frontend/src/components/GanttChart.jsx` to render over-planned steps in Purple (`#a855f7`) and position category colors
- [x] T026 [P] [US4] Display order header category color badge near contract/order header in `frontend/src/components/PlanningEvaluationTab.jsx`

**Checkpoint**: All user stories fully functional and testable independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, API documentation alignment, and end-to-end testing

- [x] T027 [P] Update API contract documentation and schemas in `specs/006-auswertung-planung/contracts/gantt-api.json`
- [x] T028 Execute native test suite `npm run test:features` to verify 100% clean test pass rate across all tests in `Features/06_Auswertung_Planung/test.js`
- [x] T029 Run end-to-end validation steps documented in `specs/006-auswertung-planung/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1). BLOCKS all User Stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2).
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2).
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2).
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2).
- **Polish (Phase 7)**: Depends on completion of all desired User Stories.

### Parallel Opportunities

- All tasks marked **[P]** within a phase can run in parallel.
- Once Phase 2 (Foundational) is complete, User Stories 1, 2, 3, and 4 can be implemented concurrently by separate developers or sequentially in priority order.

---

## Implementation Strategy (MVP First)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1 - Multi-Week Gantt Timeline & 1:1 D4 Capacities).
3. **Validate MVP**: Run `npm run test:features` to confirm US1 works independently.
4. Incrementally add Phase 4 (US2), Phase 5 (US3), and Phase 6 (US4).
5. Complete Phase 7 (Polish & E2E Quickstart validation).
