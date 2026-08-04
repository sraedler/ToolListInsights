# Quickstart & End-to-End Validation Guide: 06 - Auswertung Planung

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run Gantt timeline and contract highlighting unit tests.

```bash
# Execute feature unit tests
node Features/06_Auswertung_Planung/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Gantt API Horizon Query
Verify multi-week Gantt report API endpoint.

```bash
# Query 4-week Gantt planning data (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/gantt?weeksCount=4"
```

**Expected Outcome**: Returns HTTP 200 containing multi-week Gantt rows and weekly machine load metrics.
