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

## Scenario 3: Pool Machine Night Run Capacity Optimization Validation

### Goal
Verify that pool machines (`MachinePoolId`) calculate night capacity as $\text{MaxPiecesPerNight} \times \text{AvgPieceTime}$ (where $\text{AvgPieceTime} = \frac{\text{TotalStepProdTime}}{\text{PosQuantity}}$), enforce Day Window limits during day shift, and cap total daily workload at 24 hours (1,440 minutes).

### Execution Steps
1. Run feature test suite:
   ```bash
   npm run test:features
   ```
2. Open **Planung Maschinen** (Kanban board).
3. Verify for pool machine columns (e.g. RS2 Pool, C40/C42 Pool) that night shift capacity is added up to $\min(\text{MaxNightCapacity}, 1440 - \text{DayShiftPlannedTime})$ without exceeding Day Window limits during the day.

