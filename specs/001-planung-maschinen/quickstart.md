# Quickstart Validation Guide: Chiron & C400 Tool List Unloading (`01-planung-maschinen`)

## Scenario 1: Chiron & C400 Entire Tool List Unloading Validation

### Goal
Verify that when unloading tools on Chiron (`mName === 'Chiron'`) or Hermle C400 (`mName === 'C400'`), the entire tool list of a completed order is unloaded as a complete unit (excluding static park tools and future needed tools).

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
3. Open **Planung Maschinen** (Kanban board) and filter by "Hermle C400" or "Chiron".
4. Open the step details modal for a scheduled job card and inspect the **Auswechseln (Raus)** section.
5. Verify that the whole WinTool list identifier and unload tool count badge (`📦 C400 WinTool-Liste: ... entladen (-X Werkzeuge)`) are displayed.
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

## Scenario 4: Order/Contract Search Filtering & Overflow Lookahead Validation

### Goal
Verify that entering a search term (e.g. `P2026`) in **Planung Maschinen** or **Planung Maschinen blockiert** hides non-matching items (e.g. `P2025`) and routes any matching future steps beyond the current visible horizon to the **Überlauf** (Overflow) column.

### Execution Steps
1. Launch app (`npm run dev`) and open `http://localhost:5173`.
2. Open **Planung Maschinen** or **Planung Maschinen blockiert**.
3. Type `P2026` into the Search input box in the Control Bar.
4. Verify that all job cards containing `P2025` or non-matching orders disappear immediately.
5. Verify that any matching step for `P2026` with a start date beyond the visible date range appears in the **Überlauf** column.


