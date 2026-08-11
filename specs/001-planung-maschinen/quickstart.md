# Quickstart Validation Guide: Chiron Tool List Unloading (`01-planung-maschinen`)

## Scenario: Chiron Entire Tool List Unloading Validation

### Goal
Verify that when unloading tools on Chiron (`mName === 'Chiron'`), the entire tool list is unloaded as a complete unit instead of individual tools.

### Prerequisites
- Backend running on `http://localhost:5001` or `https://localhost:5000`
- D4 and Toollist databases online

### Execution Steps
1. Run master test suite:
   ```bash
   node Features/run_tests.js
   ```
2. Run Feature 01 test suite:
   ```bash
   node Features/01_Planung_Maschinen/test.js
   ```
## Scenario 2: Overdue & Imminent Delivery Date Prioritization in Optimization Validation

### Goal
Verify that setup sequence optimization prioritizes jobs with overdue or near-term `DeliveryDate` (D4 dates in the past or today) over far-future jobs.

### Execution Steps
1. Run master test suite:
   ```bash
   node Features/run_tests.js
   ```
2. Trigger setup optimization on a machine schedule containing an overdue job step (`DeliveryDate < today`).
3. Verify that the overdue step is placed at the front of the optimized step sequence.
