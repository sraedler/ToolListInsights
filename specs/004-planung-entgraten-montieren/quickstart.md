# Quickstart & End-to-End Validation Guide: 04 - Planung Entgraten/Montieren

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run manual workstation capacity & readiness tests.

```bash
# Execute feature unit tests
node Features/04_Planung_Entgraten_Montieren/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Manual Mode API Query
Verify manual workstation planning mode endpoint.

```bash
# Query manual workstation planning data (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/planning?mode=manual"
```

**Expected Outcome**: Returns HTTP 200 containing workstation capacity breakdown and job readiness states.
