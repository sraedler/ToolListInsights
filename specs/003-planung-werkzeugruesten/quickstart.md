# Quickstart & End-to-End Validation Guide: 03 - Planung Werkzeugrüsten

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run unit and net calculation tests.

```bash
# Execute feature unit tests
node Features/03_Planung_Werkzeugruesten/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Tool Preset API Mode
Verify tooling mode schedule API payload.

```bash
# Query tooling mode planning data (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/planning?mode=tools&daysCount=5"
```

**Expected Outcome**: Returns HTTP 200 with list of preset jobs and net setup duration estimates.
