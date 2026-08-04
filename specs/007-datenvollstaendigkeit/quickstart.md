# Quickstart & End-to-End Validation Guide: 07 - Datenvollständigkeit

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run master data audit & completeness score unit tests.

```bash
# Execute feature unit tests
node Features/07_Datenvollstaendigkeit/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Data Audit API Query
Verify master data audit report API endpoint.

```bash
# Query master data audit report (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/data-completeness"
```

**Expected Outcome**: Returns HTTP 200 containing audited steps, completeness scores, and DMS drawing availability.
