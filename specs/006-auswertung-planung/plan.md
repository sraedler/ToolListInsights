# Implementation Plan: 06 - Auswertung Planung (Planungsanalyse, Gantt-Belegung & Contiguous Setup Splitting)

**Branch**: `006-auswertung-planung` | **Date**: 2026-08-12 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md)

**Input**: Feature specification from [`specs/006-auswertung-planung/spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md) & User Directive for Uninterrupted Setup Time ("Rüstzeit immer am Stück") + Daily Milling Time Splitting ("Restliche Fräszeit splitten nach max. Gesamtzeit + D4 Limits pro Tag").

---

## Summary

Implement and refine the multi-week Gantt timeline analysis view (`06_Auswertung_Planung`) with explicit Uninterrupted Setup Time Scheduling and Daily Milling Runtime Capping:
1. **Uninterrupted Setup Time Rule ("Rüstzeit immer am Stück")**:
   - The setup time (`setupTime` / `Rüstzeit`) MUST NEVER be split across calendar days.
   - Setup time MUST be scheduled in full as a single contiguous block on Day 1 (`splitPart: 1`).
   - If the free capacity of candidate Day $D$ is less than `setupTime`, the entire job setup moves to the next available working day where full `setupTime` can fit contiguous.
2. **Production/Milling Time Splitting Rule ("Restliche Fräszeit splitten")**:
   - Once full `setupTime` is allocated contiguous on Day 1, remaining production time (`prodTime`) fills Day 1 up to the daily capacity limit (D4 limit & `maxProdTag`).
   - Overflow production time is split across subsequent working days (`splitPart: 2`, `splitPart: 3`...) with `setupTime = 0` and `prodTime = min(remainingProd, dailyCapacity, maxProdTag)`.
3. **1:1 D4 Capacity Enforcement**: Machine daily capacities are fetched directly 1:1 from D4 `tPPS_MASTA` without artificial defaults.
4. **Two-Pass Pool Allocation**: Fixed machine-assigned steps (`MachineId`) reserve capacity first. Pool steps (`MachinePoolId` for RS2 Pool & C40-C42 Pool) are sorted descending by duration and allocated to the pool machine with the highest remaining free capacity without overbooking.
5. **Machine-Level & Pool-Stealing Setup Optimization**:
   - Jobs are optimized into tool/fixture setup clusters per machine.
   - When pool optimization (`poolOptimization: true`) is active, pool jobs can be re-allocated across partner machines (`RS2_1` <-> `RS2_2`, `C40` <-> `C42`) to match setup clusters while respecting daily capacity limits.
6. **Pool Machine Night Run Capacity Optimization (`MaxNightCapacity` & 24h Ceiling)**:
   - Pool machines (`MachinePoolId`) can be planned beyond standard day window limits via night run (Nachtlauf).
   - $\text{MaxNightCapacity} = \text{MaxPiecesPerNight} \times \text{AvgPieceTime}$, where $\text{AvgPieceTime} = \frac{\text{TotalStepProdTime}}{\text{PosQuantity}}$.
   - Day Window Max Time (`DayCapacity`, e.g. 8h = 480 min) MUST NOT be exceeded during day shift.
   - Night shift runtime is maximized up to $\min(\text{MaxNightCapacity}, 24\text{h} - \text{DayShiftPlannedTime})$.
   - Total daily machine load ($\text{DayShiftPlannedTime} + \text{ScheduledNightTime}$) MUST NOT exceed 24 hours (1,440 minutes).

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: ERP D4 (`tPPS_MASTA`) / BDE schedules  
**Testing**: Native Node.js test suite in `Features/06_Auswertung_Planung/test.js` & `Features/run_tests.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Gantt horizon rendering under 200ms  
**Constraints**: Uninterrupted setup time ("Rüstzeit immer am Stück"); daily milling time capped by daily capacity (D4 limit & `maxProdTag`); 1:1 D4 capacity retrieval; Two-pass pool allocation; Day window strict limit enforcement; Pool Machine Night Run capacity calculation ($\text{MaxPiecesPerNight} \times \text{AvgPieceTime}$) with strict 24h (1,440 min) daily ceiling.

---

## Constitution Check

- [x] **Principle I: Code Quality**: Strict enforcement of uninterrupted setup time preventing partial setup fragmenting across days, and exact mathematical capping of night run capacity.
- [x] **Principle II: Testing Standards**: Automated unit and contract tests in `Features/06_Auswertung_Planung/test.js` verifying contiguous setup placement, milling time daily capping, and pool machine night capacity calculations.
- [x] **Principle III: UX Consistency**: Accurate, realistic setup block visualization, clear night shift indicators, and day header totals matching true physical shopfloor behavior.
- [x] **Principle IV: Performance**: Sub-200ms endpoint evaluation maintaining high responsiveness.

---

## Technical Workflow & Implementation Details

### Phase 0: Contiguous Setup & Daily Milling Time Allocation Algorithm
1. **Contiguous Setup Verification**:
   - For a step with `setupTime > 0`, evaluate if $\text{freeCap}_D \ge \text{setupTime}$.
   - If $\text{freeCap}_D < \text{setupTime}$, defer job start to Day $D+1$ (or next available day where $\text{freeCap} \ge \text{setupTime}$).
2. **Day 1 Allocation (`splitPart: 1`)**:
   - $\text{allocatedSetup} = \text{setupTime}$ (100% contiguous).
   - $\text{allocatedProd}_1 = \min(\text{prodTime}, \text{freeCap}_D - \text{setupTime}, \text{maxProdTag}_D)$.
3. **Subsequent Days Splitting (`splitPart: 2+`)**:
   - For remaining production time $\text{remProd} = \text{prodTime} - \text{allocatedProd}_1$:
   - Allocate $\text{allocatedProd}_i = \min(\text{remProd}, \text{freeCap}_{D+i}, \text{maxProdTag}_{D+i})$ with $\text{setupTime} = 0$.

### Phase 1: Machine-Level & Pool-Stealing Setup Optimization
1. Group steps into setup clusters per machine.
2. When `poolOptimization: true`, evaluate candidate pool steps for re-allocation to pool partner machines with matching setup clusters when daily capacity permits.

### Phase 2: Pool Machine Night Run Capacity Optimization Algorithm
1. **Per-Position Average Piece Processing Time**:
   $$\text{AvgPieceTime} = \frac{\text{TotalStepProdTime}}{\text{PosQuantity}}$$
2. **Maximum Night Capacity Calculation**:
   $$\text{MaxNightCapacity} = \text{MaxPiecesPerNight} \times \text{AvgPieceTime}$$
3. **Day Shift Strict Cap Enforcement**:
   - Day shift planned time $\text{DayShiftPlannedTime}$ MUST NOT exceed standard Day Window Max Time (`DayCapacity`, e.g., 480 min).
4. **Night Shift Allocation & 24-Hour Ceiling**:
   - Calculate remaining available night window:
     $$\text{AvailableNightWindow} = 1,440\text{ min} (24\text{h}) - \text{DayShiftPlannedTime}$$
   - Allocate night run time:
     $$\text{ScheduledNightTime} = \min(\text{MaxNightCapacity}, \text{AvailableNightWindow})$$
   - Hard constraint: $\text{DayShiftPlannedTime} + \text{ScheduledNightTime} \le 1,440\text{ minutes}$.

---

## Complexity Tracking

*No constitution violations present.*
