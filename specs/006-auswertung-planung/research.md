# Research & Technical Decisions: 06 - Auswertung Planung & Contiguous Setup Splitting

## Technical Stack & Architectural Decisions

### 1. Uninterrupted Setup Time Policy ("Rüstzeit immer am Stück")
- **Problem**: In physical CNC manufacturing, setting up tools, fixtures, and workholding is an active human process that cannot be interrupted mid-way and resumed on the next calendar day. Splitting setup time across days creates inaccurate shopfloor schedules.
- **Decision**: Setup time (`setupTime` / `Rüstzeit`) MUST NEVER be split across days. It must be placed in full as a contiguous block on Day 1 (`splitPart: 1`). If a candidate day does not have enough free capacity to fit the full `setupTime`, the start of the job MUST be deferred to the first day with sufficient contiguous free capacity.
- **Rationale**: Reflects realistic shopfloor operations and prevents partial setup fragments on calendar day boundaries.

---

### 2. Daily Milling Runtime Splitting & Capping (`maxProdTag` + D4 Limits)
- **Problem**: Multi-day milling jobs (e.g. 2080 min) need to be distributed across multiple days without exceeding daily machine capacity limits (D4 limit & `maxProdTag`).
- **Decision**: Once the contiguous setup time is placed on Day 1, remaining production time (`prodTime`) fills Day 1 up to the free capacity limit ($\min(\text{freeCap} - \text{setupTime}, \text{maxProdTag})$). Any overflow production time is split onto subsequent working days (`splitPart: 2`, `splitPart: 3`...) with `setupTime = 0` and `prodTime = min(remainingProd, freeCap, maxProdTag)`.
- **Rationale**: Ensures day header totals match physical daily capacity limits while accurately tracking multi-day milling progress.

---

### 3. Direct 1:1 D4 Database Capacity Retrieval Policy with Dual-Mapping
- Machine daily capacities for all milling machines (including C400, C40, C42, Brother, Chiron, RS2_1, RS2_2) are fetched 1:1 directly from D4 table `[D4].[dbo].[tPPS_MASTA]` (`MS_KAPAZITAET_ZEIT_MINUTEN_...`) without artificial fallbacks or hardcoded shift modifications.

---

### 4. Two-Pass Capacity-Proportional Best-Fit Pool Allocation Algorithm
- **Pass 1 (Machine-Assigned Jobs)**: Jobs explicitly assigned to a specific machine (`MachineId`) reserve capacity first on that machine.
- **Pass 2 (Pool Jobs - `MachinePoolId`)**:
  - Filter steps with `MachinePoolId === 9 || 12` (RS2 Pool) or `MachinePoolId === 13` (C40/C42 Pool).
  - Sort pool steps **descending by duration**.
  - Assign each step to the pool machine with the highest remaining capacity $R_m$ where $\text{Duration} \le R_m$.
  - Move to `Überlauf` if no pool machine can accept the step without overbooking.

---

### 5. Machine-Level & Pool-Stealing Setup Optimization Engine (`poolOptimization`)
- **Baseline Machine Optimization**: Group jobs by shared fixtures and tool lists per machine.
- **Pool-Stealing Intra-Pool Optimization (`poolOptimization: true`)**: When pool optimization is toggled ON, the setup optimizer evaluates whether pool jobs assigned to a partner machine can be stolen to match setup clusters on the target machine when daily capacity permits.

---

### 6. Pool Machine Night Run Capacity Optimization (`MaxNightCapacity` & 24h Ceiling)
- **Problem**: Pool machines can run unmanned night shifts (Nachtlauf) to increase throughput, but night overbooking must be constrained by fixture/pallet piece limits and a hard 24-hour daily limit per machine. Day window runtime must remain strictly capped.
- **Decision**:
  - Calculate average piece processing time: $\text{AvgPieceTime} = \frac{\text{TotalStepProdTime}}{\text{PosQuantity}}$.
  - Calculate maximum night capacity limit: $\text{MaxNightCapacity} = \text{MaxPiecesPerNight} \times \text{AvgPieceTime}$.
  - Enforce strict day window cap: $\text{DayShiftPlannedTime} \le \text{DayCapacity}$ (Day window max time MUST NOT be exceeded).
  - Calculate night shift runtime allocation: $\text{ScheduledNightTime} = \min(\text{MaxNightCapacity}, 1,440\text{ min} - \text{DayShiftPlannedTime})$.
  - Enforce daily maximum ceiling: Total daily machine load ($\text{DayShiftPlannedTime} + \text{ScheduledNightTime}$) MUST NOT exceed 24 hours (1,440 minutes).
- **Rationale**: Maximizes unmanned night capacity utilization for pool jobs while preserving day shift boundaries and ensuring physical 24h daily reality.
