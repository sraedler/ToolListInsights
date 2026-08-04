# Quickstart & End-to-End Validation Guide: 05 - Zeitauswertung

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run efficiency index and variance formula unit tests.

```bash
# Execute feature unit tests
node Features/05_Zeitauswertung/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Time Evaluation API Query
Verify time evaluation backend report endpoint.

```bash
# Query time evaluation report data (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/time-evaluation"
```

**Expected Outcome**: Returns HTTP 200 containing target vs actual breakdown records and efficiency summary.
