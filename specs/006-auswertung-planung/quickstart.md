# Quickstart & End-to-End Validation Guide: 06 - Auswertung Planung & Contiguous Setup Splitting

## Prerequisites
- Node.js (v18+)
- Local environment with toollistinsights dependencies installed (`npm install`)

---

## Runnable Validation Commands

### 1. Execute Unit & Contract Tests
Run the native test suite for feature 06 (Auswertung Planung):
```bash
npm run test:features
```
*Expected Outcome*: All test assertions pass cleanly with 0 errors, validating 1:1 D4 capacity limits, two-pass pool job allocation, contiguous setup time placement ("Rüstzeit immer am Stück"), milling time daily capping, pool-stealing setup optimization (`poolOptimization: true`), and Pool Machine Night Run Capacity Optimization (`MaxNightCapacity` calculation & strict 24h ceiling).

### 2. Verify Contiguous Setup & Day Header Workload Summation
1. Launch the application with `npm run dev`.
2. Open `http://localhost:5173`.
3. Navigate to **Planung Maschinen** / **Auswertung Planung**.
4. Inspect multi-day steps on the Gantt timeline or Kanban board.
5. Verify that `setupTime` is placed 100% on Day 1 (`splitPart: 1`) as an uninterrupted block, while remaining milling time is split across subsequent days up to daily capacity limits.
6. Verify for pool machines that Night Run Capacity ($\text{MaxNightCapacity} = \text{MaxPiecesPerNight} \times \text{AvgPieceTime}$) is added only to night hours without exceeding the Day Window limit (e.g. 8h) during the day, and that total daily machine workload does not exceed 24 hours (1,440 minutes).
