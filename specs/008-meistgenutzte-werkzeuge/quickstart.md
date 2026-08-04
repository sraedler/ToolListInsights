# Quickstart & End-to-End Validation Guide: 08 - Meistgenutzte Werkzeuge

## Prerequisites
- Node.js installed (v18+)

---

## Validation Scenario 1: Test Suite Execution
Run tool usage aggregation and standard tooling threshold unit tests.

```bash
# Execute feature unit tests
node Features/08_Meistgenutzte_Werkzeuge/test.js

# Execute global test runner
node Features/run_tests.js
```

**Expected Outcome**: All tests pass cleanly.

---

## Validation Scenario 2: Tool Usage API Query
Verify tool usage analysis API endpoint.

```bash
# Query tool usage analysis report (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/tool-usage?pastDays=30&futureDays=30"
```

**Expected Outcome**: Returns HTTP 200 containing aggregated tool records, permanent candidate flags, and removal recommendations.
