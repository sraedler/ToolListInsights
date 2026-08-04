# Tasks: 05 - Zeitauswertung (Soll vs. Ist Maschinenzeiten)

**Input**: Design documents from [`specs/005-zeitauswertung/`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/)  
**Prerequisites**: [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/plan.md), [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/spec.md), [`research.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/research.md), [`data-model.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/data-model.md), [`contracts/time-evaluation-api.json`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/contracts/time-evaluation-api.json)

**Tests Requirement**: **MANDATORY** — Implement unit & contract test suite in `Features/05_Zeitauswertung/test.js` and register with `Features/run_tests.js`.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1)
- Includes exact file paths for every task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment and dependency verification for time evaluation

- [x] T001 Verify Feature 05 configuration per [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/plan.md) in `package.json`
- [x] T002 [P] Verify BDE SQL feedback logging tables in `backend/db.js`

---

## Phase 2: Foundational (Blocking Prerequisites & Test Suite Creation)

**Purpose**: Data models and test suite harness for time evaluation

- [x] T003 Implement unit & contract test suite harness for time evaluation in `Features/05_Zeitauswertung/test.js`
- [x] T004 Register Feature 05 test suite in master test runner `Features/run_tests.js`
- [x] T005 [P] Define TimeEvaluationRecord and TimeEvaluationSummary data models in `backend/models/timeEvaluation.js`

**Checkpoint**: Foundation & test harness ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Efficiency Index & Variance Analysis (Priority: P1) 🎯 MVP

**Goal**: Compare ERP target vs BDE actual times, calculating efficiency index % and flagging overruns > +25% in red.

**Independent Test**: Run `node Features/05_Zeitauswertung/test.js` for US1 tests and query `GET /api/reports/time-evaluation`.

### Tests for User Story 1

- [x] T006 [P] [US1] Write test assertions for efficiency formula and overrun threshold logic in `Features/05_Zeitauswertung/test.js`

### Implementation for User Story 1

- [x] T007 [US1] Implement time evaluation calculation endpoint `GET /api/reports/time-evaluation` in `backend/server.js`
- [x] T008 [P] [US1] Build time evaluation KPI summary card in `frontend/src/components/TimeEvaluationHeader.jsx`
- [x] T009 [US1] Build Recharts target vs actual variance bar chart in `frontend/src/components/TimeEvaluationChart.jsx`
- [x] T010 [US1] Build time breakdown grid table with red overrun highlights in `frontend/src/components/TimeEvaluationGrid.jsx`

**Checkpoint**: User Story 1 MVP fully functional and testable independently.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Scoped CSS isolation, theme tokens, and validation

- [x] T011 [P] Enforce strict scoped CSS isolation for time evaluation components to guarantee zero side-effects in `frontend/src/index.css`
- [x] T012 Execute master test runner `node Features/run_tests.js` and validate quickstart scenarios in [`quickstart.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/quickstart.md)

---

## Dependencies & Execution Order

```mermaid
flowchart TD
    Setup[Phase 1: Setup] --> Foundational[Phase 2: Foundational & Test Creation]
    Foundational --> US1[Phase 3: US1 - Efficiency Report MVP]
    US1 --> Polish[Phase 4: Polish & Validation]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Includes test harness creation in `Features/05_Zeitauswertung/test.js`)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Execute `node Features/05_Zeitauswertung/test.js` for US1
5. Polish & Final Validation (Phase 4)
