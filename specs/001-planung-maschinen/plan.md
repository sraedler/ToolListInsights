# Implementation Plan: 01 - Planung Maschinen (Kanban-Maschinenbelegungsplanung)

**Branch**: `001-planung-maschinen` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/001-planung-maschinen/spec.md)

**Input**: Feature specification from [`specs/001-planung-maschinen/spec.md`](file:///C:/git_repos/ToolListInsights/specs/001-planung-maschinen/spec.md) with explicit user requirement to re-implement missing test suite.

---

## Summary

Implement the visual Kanban machine scheduling board for CNC machining centers (`01_Planung_Maschinen`) **and build its automated test suite from scratch**. The technical architecture leverages a React 19 frontend built with Vite 8, Recharts 3, Lucide React icons, and custom CSS variables (`[data-theme='dark']` / `[data-theme='light']`). The backend runs on Node.js with Express 5, connecting to MS SQL Server databases (`D4` ERP, `WTData` WinTool, `Toollist`) using dual-driver support (`msnodesqlv8` for Windows Trusted Authentication and `mssql`/`tedious` for Linux/Docker fallback). Manual overrides are persisted in `backend/planning_overrides.json`, while construction drawings stream via d.velop DMS PDF proxy endpoints.

**Test Suite Re-implementation**: Since `Features/01_Planung_Maschinen/test.js` and `Features/run_tests.js` do not currently exist in the codebase, building a lightweight `node:assert`-based test runner and contract verification test suite is a mandatory deliverable of Phase 2 tasks.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: 
- **Backend**: Express `^5.2.1`, `mssql` `^12.5.5`, `msnodesqlv8` `^5.2.0`, `cors` `^2.8.6`, `dotenv` `^17.4.2`, `concurrently` `^8.2.2`
- **Frontend**: React `^19.2.6`, React DOM `^19.2.6`, Vite `^8.0.12`, Recharts `^3.8.1`, Lucide React `^1.21.0`  
**Storage**:
- MS SQL Server `D4` (`tbe_Belp`, `tbe_Arbeitsplan`) on `192.168.100.5\D4`
- MS SQL Server `WTData` (`WinTool_Baugruppen`) on `192.168.100.8\cim4net`
- MS SQL Server `Toollist` on `192.168.100.8\CIM4NET`
- Persistent JSON Overrides: `backend/planning_overrides.json`  
**Testing (To Be Re-implemented)**:
- Native Node.js test runner using `node:assert`
- Test files to create: `Features/01_Planung_Maschinen/test.js` and `Features/run_tests.js`  
**Target Platform**: Node.js Backend (port 5000) + Nginx Reverse Proxy (port 2005 / SSL 443) running in Docker containers (`docker-compose.yml`) or Windows host  
**Project Type**: Full-Stack Web Application (Express API + Vite React SPA)  
**Performance Goals**: < 200ms p95 API response latency for `GET /api/planning`  
**Constraints**: Strict feature isolation (Zero Side-Effects across tabs per `constitution.md`), persistent JSON overrides.  
**Scale/Scope**: 100+ active CNC machining steps, 5–21 days planning horizons, 8+ CNC machine columns.  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Code Quality & Architectural Integrity**: Decoupled backend routes (`backend/server.js`, `backend/db.js`) and React components (`src/App.jsx`); zero dead code or unhandled promise rejections.
- [x] **Principle II: Comprehensive Testing Standards**: **MANDATORY**: Test suite MUST be implemented from scratch (`Features/01_Planung_Maschinen/test.js` & `Features/run_tests.js`) before feature release to comply with Constitution Principle II.
- [x] **Principle III: User Experience Consistency**: Follows HSL contract colors (`getContractColor`), dark/light theme CSS variables, and interactive state indicators.
- [x] **Principle IV: Performance & Resource Efficiency**: In-memory caching, connection pooling (`max: 10`), and p95 API latency target < 200ms.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-planung-maschinen/
├── plan.md              # Implementation plan
├── research.md          # Tech stack & testing research
├── data-model.md        # Data models & SQL schema mapping
├── quickstart.md        # E2E validation & test runner guide
├── contracts/           # API schemas
│   └── planning-api.json
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Layout (repository root)

```text
backend/
├── db.js                # Dynamic SQL Server pool builder (msnodesqlv8 / tedious)
├── matching.js          # NC program & WinTool fuzzy matching engine
├── server.js            # Express server (APIs & optimization heuristics)
└── planning_overrides.json # Persistent JSON override database

frontend/
├── src/
│   ├── App.jsx          # React SPA shell & tab manager
│   ├── index.css        # Scoped CSS tokens ([data-theme='dark']/[data-theme='light'])
│   └── main.jsx         # Vite entry point
├── package.json         # React 19, Vite 8, Recharts 3, Lucide React
└── vite.config.js       # Vite dev server configuration

Features/  (NEW TEST SUITE TO IMPLEMENT)
├── 01_Planung_Maschinen/
│   ├── README.md        # Reference specification
│   └── test.js          # [TO IMPLEMENT] Unit & contract tests
└── run_tests.js         # [TO IMPLEMENT] Master test runner

docker-compose.yml       # Production multi-container orchestration
Dockerfile               # Backend Node.js container build
```

**Structure Decision**: Multi-container web application layout with Express backend, Vite React frontend, and a newly implemented native Node.js test suite in `Features/`.

---

## Technical Design: Chiron Completed Order Tool List Unloading (`FR-009`) & Static Park Tools (`FR-010`)

1. **Chiron Completed Order Tool List Unloading (`FR-009`)**:
   - Target Machine: `Chiron` (`mName === 'Chiron'` / `MachineId === 21`).
   - Unloading Logic: When a job/order (e.g. `2537-0301-SP1`) finishes execution in the schedule, the system proposes unloading its **entire Tool List** (`MatchedListNr` / `NCProgram`) as a complete unit.
   - Exclusion Exceptions:
     a) Tools contained in any static `"park"` list (`staticParkToolsSet`) are NEVER unloaded.
     b) Tools still required by upcoming/subsequent steps in the remaining schedule are retained in the machine.
   - All remaining non-park tools of that completed order's tool list are proposed for unloading (`unloadTools` / `Auswechseln (Raus)`).

2. **Static Park Tools Protection (`FR-010`)**:
   - Target Database: `ToolList` database (`MachineToProgram` & `ProgramToTool` tables).
   - Identification: Query all `MachineToProgram` records where `LOWER(ProgramName) LIKE '%park%'` (e.g., `C400 geparkt`, `RS2-1-Parkplatz`, `RS2-2-Parkplatz`, `Chiron Parkplatz`, `Geparkt`).
   - Protection Strategy: Extract all tools belonging to these park tool lists into a protected `staticParkToolsSet`. During magazine simulation, LRU victim selection (`findOptimalVictim`), sequence optimization, or scenario unloading, tools in `staticParkToolsSet` are **permanently locked in the machine magazine and CANNOT be evicted or unloaded**.

3. **Overdue & Imminent Delivery Date Prioritization in Setup Optimization (`FR-011`)**:
   - Target Algorithms: Greedy, Local Search, Simulated Annealing setup sequence optimization routines in `backend/server.js`.
   - Urgency Metric: For each job step, calculate delivery date delta relative to current date (`today`):
     - `overdueDays = max(0, (today - DeliveryDate) / (1000 * 60 * 60 * 24))`.
     - Overdue jobs (`DeliveryDate < today`) receive an explicit urgency priority boost, placing them at the front of candidate selection pools.
     - Imminent jobs (`DeliveryDate` within 1-2 days) are prioritized over far-future jobs.
   - Cost Balancing: In candidate step selection, the score combines:
     `effectiveScore = (toolMisses * 10) - (overdueDays * 50) - (fixtureMatchBonus * 5)`.
     This ensures overdue and near-term D4 dates are scheduled earlier without sacrificing necessary fixture matching.

---

## Complexity Tracking

*No constitution violations present.*
