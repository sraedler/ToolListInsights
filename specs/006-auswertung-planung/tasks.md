# Tasks: 06 - Auswertung Planung (Planungsanalyse, Gantt-Belegung & Contiguous Setup Splitting)

**Input**: Design documents from [`specs/006-auswertung-planung/`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/)  
**Prerequisites**: [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/plan.md), [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md), [`research.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/research.md), [`data-model.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/data-model.md), [`contracts/gantt-api.json`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/contracts/gantt-api.json), [`quickstart.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization & test environment configuration

- [x] T001 Verify feature specification and design artifacts in `specs/006-auswertung-planung/`
- [x] T002 Configure test framework harness for feature 06 in `Features/06_Auswertung_Planung/test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core D4 database connection structures, machine capacity lookup helpers, and daily workload capping utilities

- [x] T003 Ensure 1:1 D4 `tPPS_MASTA` machine daily capacity retrieval dual-mapping in `backend/server.js`
- [x] T004 Setup in-memory structure for machine pools (`MachinePoolId === 9 || 12` for RS2 Pool, `MachinePoolId === 13` for C40-C42 Pool) in `backend/server.js`

---

## Phase 3: User Story 1 - Multi-Week Gantt Timeline, Contiguous Setup ("Rüstzeit am Stück") & Daily Milling Time Splitting (Priority: P1) 🎯 MVP

**Goal**: Multi-week Gantt timeline rendering, 1:1 D4 machine capacity enforcement, contiguous uninterrupted setup time placement ("Rüstzeit immer am Stück"), and daily milling production time splitting up to max daily capacity limits.

**Independent Test**: Run `node Features/06_Auswertung_Planung/test.js` to verify contiguous setup placement, daily milling runtime capping, and zero pool job overbooking.

### Implementation for User Story 1

- [x] T005 [P] [US1] Update API endpoint `/api/planning` in `backend/server.js` to enforce 1:1 D4 capacity dual-mapping (`MS_KAPAZITAET_ZEIT_MINUTEN_...`) without artificial fallbacks
- [x] T006 [US1] Implement Pass 1 machine-assigned scheduling (`MachineId`) in `backend/server.js` with contiguous setup time placement ("Rüstzeit immer am Stück")
- [x] T007 [US1] Implement Pass 2 pool job scheduling (`MachinePoolId`) in `backend/server.js` sorting pool steps descending by duration and placing them on candidate pool machines with highest remaining free capacity
- [x] T008 [US1] Implement daily milling production time splitting (`prodTime`) across subsequent days with `setupTime = 0` on Day 2+ in `backend/server.js` and `frontend/src/App.jsx`
- [x] T009 [P] [US1] Update Gantt API contract verification in `specs/006-auswertung-planung/contracts/gantt-api.json`
- [x] T010 [P] [US1] Implement horizontal multi-week Gantt timeline rendering (1 to 20 weeks) in `frontend/src/App.jsx`
- [x] T011 [US1] Implement cross-machine synchronous contract highlighting on mouse hover (`hoveredContractNumber`) in `frontend/src/App.jsx`

---

## Phase 4: User Story 2 - Machine-Level Setup & Intra-Pool Job Stealing Optimization (`poolOptimization: true`) (Priority: P2)

**Goal**: Post-allocation setup optimization per machine and cross-machine intra-pool job stealing (`poolOptimization: true`) to consolidate shared tool/fixture clusters across pool partner machines (`RS2_1` <-> `RS2_2`, `C40` <-> `C42`).

**Independent Test**: Query `/api/planning?optimize=true&poolOptimization=true` and verify that pool steps are consolidated onto partner machines with matching setup clusters without exceeding D4 capacity limits.

### Implementation for User Story 2

- [x] T012 [US2] Implement per-machine setup & sequence optimization in `backend/server.js` grouping steps by shared fixture and tool lists
- [x] T013 [US2] Implement intra-pool job stealing logic (`poolOptimization: true`) in `backend/server.js` allowing candidate pool steps to be re-allocated to partner pool machines with matching setup clusters when D4 capacity permits
- [x] T014 [P] [US2] Add UI control switch for "Pool-Optimierung" (`poolOptimization`) in `frontend/src/App.jsx`
- [x] T015 [US2] Add visual indicator for stolen/re-allocated pool steps in `frontend/src/App.jsx`

---

## Phase 5: User Story 3 - Over-planning (Überplanung / Überlappung) Rückwärts-Terminierung & Distinct Purple Styling (Priority: P3)

**Goal**: Backward scheduling for over-planned steps (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) starting from `PSPP_DATUM_START` with up to `PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG` per day, rendered in distinct Purple styling (`#a855f7`).

**Independent Test**: Verify over-planned steps render in Purple styling on both Gantt timelines and stacked capacity charts.

### Implementation for User Story 3

- [x] T016 [US3] Implement backward daily allocation for over-planned steps (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) in `backend/server.js`
- [x] T017 [P] [US3] Add distinct Purple visual styling (`#a855f7`) for over-planned steps in `frontend/src/App.jsx`
- [x] T018 [P] [US3] Add legend toggle and stacked bar segment for over-planned hours in `frontend/src/App.jsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Automated test suite verification, regression checks, and documentation polish

- [x] T019 Run automated test suite `node Features/06_Auswertung_Planung/test.js` to verify clean pass
- [x] T020 Run full feature test runner `node Features/run_tests.js` to ensure zero regressions across all features
- [x] T021 Execute end-to-end quickstart validation steps per `specs/006-auswertung-planung/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Story 1 (Phase 3 - P1 MVP)**: Depends on Foundational completion.
- **User Story 2 (Phase 4 - P2)**: Depends on User Story 1 completion.
- **User Story 3 (Phase 5 - P3)**: Depends on User Story 1 completion.
- **Polish (Phase 6)**: Depends on completion of User Stories 1, 2, and 3.

---

## Parallel Execution Opportunities

- T005 [P] [US1] (Backend D4 capacity 1:1 mapping) and T010 [P] [US1] (Frontend Gantt timeline rendering) can run in parallel.
- T014 [P] [US2] (UI control for Pool-Optimierung switch) can run in parallel with T013 [US2] (Backend pool stealing logic).
- T017 [P] [US3] (Frontend Purple styling) and T018 [P] [US3] (Legend toggles) can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup (Phase 1) & Foundational (Phase 2).
2. Complete User Story 1 (Phase 3).
3. Validate with `node Features/06_Auswertung_Planung/test.js`.

### Full Delivery
1. Add User Story 2 (Pool-Stealing Optimization).
2. Add User Story 3 (Over-planning & Purple Styling).
3. Run full test suite (`node Features/run_tests.js`).
