# Tasks: 08 - Meistgenutzte Werkzeuge (Werkzeugnutzungs- & Eingriffszeit-Analyse)

**Input**: Design documents from [`specs/008-meistgenutzte-werkzeuge/`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/)  
**Prerequisites**: [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/plan.md), [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/spec.md), [`research.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/research.md), [`data-model.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/data-model.md), [`contracts/tool-usage-api.json`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/contracts/tool-usage-api.json)

**Tests Requirement**: **MANDATORY** — Implement unit & contract test suite in `Features/08_Meistgenutzte_Werkzeuge/test.js` and register with `Features/run_tests.js`.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1)
- Includes exact file paths for every task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment and dependency verification for tool usage analysis

- [x] T001 Verify Feature 08 configuration per [`plan.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/plan.md) in `package.json`
- [x] T002 [P] Verify WinTool & BDE usage tables in `backend/db.js`

---

## Phase 2: Foundational (Blocking Prerequisites & Test Suite Creation)

**Purpose**: Data models and test suite harness for tool usage analysis

- [x] T003 Implement unit & contract test suite harness for tool usage analysis in `Features/08_Meistgenutzte_Werkzeuge/test.js`
- [x] T004 Register Feature 08 test suite in master test runner `Features/run_tests.js`
- [x] T005 [P] Define ToolUsageRecord and ToolUsageSummary data models in `backend/models/toolUsage.js`

**Checkpoint**: Foundation & test harness ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Tool Usage Aggregation & Standard Tooling Recommendation (Priority: P1) 🎯 MVP

**Goal**: Combine past BDE usages and future schedule demands, highlighting standard tooling candidates ($\ge 5$) and removal recommendations with CSV export.

**Independent Test**: Run `node Features/08_Meistgenutzte_Werkzeuge/test.js` for US1 tests and query `GET /api/reports/tool-usage`.

### Tests for User Story 1

- [x] T006 [P] [US1] Write test assertions for tool usage summation, standard candidate qualification ($\ge 5$), and removal flags in `Features/08_Meistgenutzte_Werkzeuge/test.js`

### Implementation for User Story 1

- [x] T007 [US1] Implement tool usage analysis endpoint `GET /api/reports/tool-usage` in `backend/server.js`
- [x] T008 [P] [US1] Build tool usage header card with CSV export trigger in `frontend/src/components/ToolUsageHeader.jsx`
- [x] T009 [US1] Build Top 10/20 past vs future tool usage stacked bar chart in `frontend/src/components/ToolUsageChart.jsx`
- [x] T010 [US1] Build tool ranking grid with "Festbestückung" badges and removal flags in `frontend/src/components/ToolUsageGrid.jsx`

**Checkpoint**: User Story 1 MVP fully functional and testable independently.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Scoped CSS isolation, theme tokens, and validation

- [x] T011 [P] Enforce strict scoped CSS isolation for tool usage components to guarantee zero side-effects in `frontend/src/index.css`
- [x] T012 Execute master test runner `node Features/run_tests.js` and validate quickstart scenarios in [`quickstart.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/quickstart.md)

---

## Dependencies & Execution Order

```mermaid
flowchart TD
    Setup[Phase 1: Setup] --> Foundational[Phase 2: Foundational & Test Creation]
    Foundational --> US1[Phase 3: US1 - Tool Usage Analysis MVP]
    US1 --> Polish[Phase 4: Polish & Validation]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Includes test harness creation in `Features/08_Meistgenutzte_Werkzeuge/test.js`)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Execute `node Features/08_Meistgenutzte_Werkzeuge/test.js` for US1
5. Polish & Final Validation (Phase 4)
