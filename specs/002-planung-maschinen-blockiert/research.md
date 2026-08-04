# Research & Technical Decisions: 02 - Planung Maschinen blockiert

## Technical Stack & Architectural Decisions

### 1. Conflict Filter Engine (`isConflictMode = true`)
- **Decision**: Server-side and client-side predicate filtering for non-green steps:
  ```javascript
  const conflictSteps = allSteps.filter(step =>
    step.kvStatus === 'red' ||
    step.kvStatus === 'yellow' ||
    !step.ncProgram ||
    !step.fixture ||
    step.isPredecessorLate
  );
  ```
- **Rationale**: Isolates problem cases (KV Red/Yellow) into a dedicated view without mutating underlying ERP data.

---

### 2. Force Release & Override Auditing
- **Decision**: Persistent "Force Released" state stored in `backend/planning_overrides.json` under `stepId`.
- **Rationale**: Allows human schedulers to bypass automated block flags when workarounds exist on the shop floor while logging the action timestamp.

---

### 3. Test Suite Integration (`Features/02_Planung_Maschinen_Blockiert/test.js`)
- **Decision**: Implement a native `node:assert` test suite in `Features/02_Planung_Maschinen_Blockiert/test.js` and register it with `Features/run_tests.js`.
- **Rationale**: Complies with Constitution Principle II (Mandatory Automated Testing).
