# Tasks: 06 - Auswertung Planung (Planungsanalyse & Gantt-Belegung)

**Input**: Design documents from [`specs/006-auswertung-planung/`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/)

**Prerequisites**: [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/plan.md), [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md), [`research.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/research.md), [`data-model.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/data-model.md), [`contracts/gantt-api.json`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/contracts/gantt-api.json)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths are specified in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Feature 06

- [x] T001 Verify feature specification and implementation plan structure in `specs/006-auswertung-planung/spec.md`
- [x] T002 [P] Verify endpoint contract definition in `specs/006-auswertung-planung/contracts/gantt-api.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 1:1 D4 database capacity retrieval infrastructure that MUST be complete before pool allocation

- [x] T003 Ensure 1:1 D4 database capacity retrieval (`tPPS_MASTA`) with dual ID & Name mapping in `backend/server.js`
- [x] T004 [P] Verify strict exact machine name dropdown matching in `frontend/src/App.jsx` (`getSelectedMachineNames`)

---

## Phase 3: User Story 1 - Multi-Week Gantt Timeline & Capacity-Proportional Best-Fit Pool Allocation (Priority: P1) 🎯 MVP

**Goal**: Implement multi-week Gantt timeline horizon rendering, 1:1 D4 machine capacity limits, and capacity-proportional best-fit pool job allocation.

**Independent Test**: Execute `node Features/06_Auswertung_Planung/test.js` to verify 100% test assertions pass cleanly.

### Implementation for User Story 1

- [x] T005 [US1] Implement Two-Pass Pool Allocation algorithm in `backend/server.js` (Pass 1 machine-booked steps, Pass 2 pool steps)
- [x] T006 [US1] Implement Capacity-Proportional Best-Fit Pool Sorting (descending by `stepMin` duration) for each day in `backend/server.js`
- [x] T007 [US1] Implement day-proportionate time calculation (`sTime` + `prTime` = `schMin`) for D4 multi-day entries in `backend/server.js`
- [x] T008 [US1] Implement multi-week Gantt timeline view and synchronous contract hover highlighting in `frontend/src/App.jsx`
- [x] T009 [US1] Implement contract test suite for 1:1 capacity limits and pool allocation in `Features/06_Auswertung_Planung/test.js`

---

## Phase 4: User Story 2 - Over-planning (Überplanung) Backward Scheduling & Purple Visual Styling (Priority: P2)

**Goal**: Support Over-planning (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) using `PSPP_DATUM_START` as End Date, allocating `PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG` minutes per day backwards, with distinct Purple (`#a855f7`) visual styling in Gantt bars and capacity progression stacked charts.

**Independent Test**: Execute `node Features/run_tests.js` to verify over-planning scheduling and visual styling.

### Implementation for User Story 2

- [x] T010 [US2] Support D4 over-planning fields (`PSP_ZEIT_UEBERLAPPUNG_PROZENT` & `PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG`) in SQL query and `backend/server.js`
- [x] T011 [US2] Implement backward daily allocation (`MaxProdTag` per day backward from `PSPP_DATUM_START` as End Date) for over-planned steps in `backend/server.js`
- [x] T012 [US2] Add `isOverplanned` flag and `color: 'Purple'` assignment to over-planned steps in `backend/server.js`
- [x] T013 [US2] Implement Purple visual bar rendering in Gantt timeline and stacked bar segment with "Überplante Stunden" legend checkbox in `frontend/src/App.jsx`

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and documentation updates

- [x] T014 Execute master test runner via `node Features/run_tests.js` to verify all feature test suites pass
- [x] T015 Update quickstart guide in `specs/006-auswertung-planung/quickstart.md`
- [x] T016 Update research documentation in `specs/006-auswertung-planung/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Complete.
- **Foundational (Phase 2)**: Complete.
- **User Story 1 (Phase 3)**: Complete.
- **User Story 2 (Phase 4)**: Ready for execution.
- **Polish (Phase 5)**: Depends on User Story 2 completion.
