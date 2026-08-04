# Quickstart & End-to-End Validation Guide: 02 - Planung Maschinen blockiert

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run feature unit & contract tests for conflict filtering.

```bash
# Execute feature unit tests
node Features/02_Planung_Maschinen_Blockiert/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Conflict API Filtering
Verify conflict mode filtering via API endpoint.

```bash
# Query conflict mode planning data (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/planning?isConflictMode=true"
```

**Expected Outcome**: Returns HTTP 200 containing only Red/Yellow conflict steps and total conflict counts.
