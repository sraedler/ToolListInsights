# Quickstart & End-to-End Validation Guide: 01 - Planung Maschinen

## Prerequisites
- Node.js installed (v18+)
- Backend dependencies installed (`npm install` in project root)

---

## Validation Scenario 1: Test Suite Re-implementation & Execution

Since the test files currently do not exist, they must be created under `Features/`:

### 1. Create Feature Unit Test (`Features/01_Planung_Maschinen/test.js`)
Build unit tests validating:
- Optimization heuristics (`greedy`, `local_search`)
- Day capacity calculation algorithms
- Net setup time formulas
- JSON override persistence format

### 2. Create Master Test Runner (`Features/run_tests.js`)
Build a central test runner executing all `Features/*/test.js` files with summary output.

```bash
# Execute feature unit tests (once created)
node Features/01_Planung_Maschinen/test.js

# Execute global test runner (once created)
node Features/run_tests.js
```

**Expected Outcome**: Tests execute via native `node:assert`, reporting total passed/failed counts with 0 failures.

---

## Validation Scenario 2: Backend API Schedule Generation
Start backend in dev mode and verify `/api/planning` payload.

```bash
# Start backend server
npm run start:backend

# Verify API response (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/planning?daysCount=5&optimize=true"
```

**Expected Outcome**: Returns HTTP 200 with JSON payload containing `board` object mapped by CNC machine names and summary totals.

---

## Validation Scenario 3: Persistent Drag-and-Drop Override Test
Simulate manual drag-and-drop override persistence.

```bash
# Send override POST request (PowerShell)
$body = @{ stepId = "100234_10"; overrideMachine = "GROB G550"; startDate = "2026-08-05" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/planning/override" -Method POST -Body $body -ContentType "application/json"
```

**Expected Outcome**: Returns `{ "success": true, "stepId": "100234_10" }` and records the override in `backend/planning_overrides.json`.
