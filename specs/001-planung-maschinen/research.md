## Decision 1: Entire Tool List Unloading Unit for Completed Chiron and C400 Orders

### Problem Statement
On Chiron and Hermle C400 machining centers, physical tool management and shopfloor setup procedures require that when an order (e.g. `2537-0301-SP1`) finishes execution according to schedule, its **entire Tool List** (`Werkzeugliste` / `ZzIdent`) is proposed for unloading as a complete unit.

### Decision
For Chiron and Hermle C400 machine operations (`mName === 'Chiron' || mName === 'C400'` or `MachineId === 21 || MachineId === 2`):
1. When an order finishes, identify its tool list (`MatchedListNr` / `NCProgram`).
2. Propose unloading ALL tools belonging to that completed Tool List, EXCEPT:
   - Tools in any static `"park"` list (e.g. `Chiron Parkplatz`, `C400 geparkt`, which remain locked in the machine).
   - Tools needed by future/upcoming steps in the schedule.
3. Show the completed order's Tool List Name and unload count clearly in `Auswechseln (Raus)` in the UI modal (`📦 Chiron / C400 WinTool-Liste: ... entladen (-X Werkzeuge)`).

### Rationale
- Aligns ToolListInsights setup simulation with physical shop-floor procedures on both Chiron and C400 machines.
- Prevents partial list pre-setting and teardown discrepancies on C400 machines, making its behavior 100% consistent with Chiron.

### Alternatives Considered
- **Universal tool list unloading across all machines**: Rejected because automated palleted centers (e.g. RS2_1, RS2_2, C40, C42) support individual tool retention in large magazines.
- **Keep C400 on individual LRU eviction**: Rejected per user directive, as operators on C400 work with entire list changeovers similar to Chiron.

---

## Decision 2: Permanent Protection for Static Park Tools (`LOWER(ProgramName) LIKE '%park%'`)

### Problem Statement
In the `ToolList` database, machine magazines contain permanent/static park tool lists (e.g. `C400 geparkt`, `RS2-1-Parkplatz`, `RS2-2-Parkplatz`, `Chiron Parkplatz`, `Geparkt`). Tools in these lists are physically fixed in the machine magazine and must NEVER be unloaded or evicted during setup changeovers or scenario configuration.

### Decision
1. Fetch all `MachineToProgram` records where `LOWER(ProgramName) LIKE '%park%'`.
2. Extract all tool numbers mapped via `ProgramToTool` into a protected `staticParkToolsSet`.
3. In `findOptimalVictim`, LRU magazine simulation, sequence optimization algorithms, and scenario unloading API endpoints, exclude `staticParkToolsSet` items from candidate victim lists so they are **permanently locked** in the machine magazine.

### Rationale
- Guarantees 100% alignment with physical machine magazine configurations in CIM4NET/ToolList DB.
- Prevents setup optimization heuristics from attempting to unload static base tools.

---

## Decision 3: Overdue and Imminent Delivery Date Urgency Weighting in Setup Sequence Optimization

### Problem Statement
When sequence optimization algorithms (Greedy, Local Search, Simulated Annealing) evaluate candidates purely based on tool list similarity (`MatchedListNr`) or fixture matching (`fixtureWeight`), overdue jobs (`DeliveryDate < today`) or jobs with imminent delivery deadlines could be pushed to the back of the queue.

### Decision
Incorporate delivery date urgency into sequence optimization candidate scoring:
1. Compute `overdueDays` for each candidate step.
2. For overdue steps (`DeliveryDate < today`), apply a heavy score reduction (favoring earlier placement) proportional to days overdue.
3. For non-overdue steps, prioritize steps with nearer `DeliveryDate` over steps with far-future delivery dates.
4. Ensure overdue customer orders are never delayed behind far-future jobs for minor setup savings.

### Rationale
- Protects shop-floor delivery commitments (D4 delivery dates).
- Prevents setup optimization from causing delivery overruns.

---

## Decision 4: Pool Machine Night Run Capacity Optimization (`MaxNightCapacity` & 24h Ceiling) in Kanban Planung Maschinen

### Problem Statement
In the Kanban Planung Maschinen view (`01_Planung_Maschinen`), pool machines (RS2 Pool `9`/`12`, C40/C42 Pool `13`) can perform unmanned night runs (Nachtlauf). Night capacity must be mathematically bounded by piece processing time and fixture limits, while total daily machine workload (Day shift + Night run) cannot exceed physical 24-hour day boundaries (1,440 minutes).

### Decision
1. Calculate average piece processing time: $\text{AvgPieceTime} = \frac{\text{TotalStepProdTime}}{\text{PosQuantity}}$.
2. Calculate maximum night capacity limit: $\text{MaxNightCapacity} = \text{MaxPiecesPerNight} \times \text{AvgPieceTime}$.
3. Enforce strict Day Window cap: Day shift planned time $\text{DayShiftPlannedTime}$ MUST NOT exceed standard Day Window Max Time (`DayCapacity`, e.g., 480 min / 8h).
4. Allocate night shift runtime: $\text{ScheduledNightTime} = \min(\text{MaxNightCapacity}, 1,440\text{ min} - \text{DayShiftPlannedTime})$.
5. Hard 24h daily maximum ceiling: Total daily machine workload ($\text{DayShiftPlannedTime} + \text{ScheduledNightTime}$) MUST NOT exceed 24 hours (1,440 minutes).

### Rationale
- Ensures consistent capacity planning rules across both the Kanban view (`01_Planung_Maschinen`) and the Auswertung view (`06_Auswertung_Planung`).
- Maximizes unmanned overnight utilization for pool machines without overbooking day shift windows or exceeding 24 hours.

---

## Decision 5: Order/Contract Search Filtering & Out-of-Range Future Step Routing to Overflow in Kanban Views

### Problem Statement
Production schedulers need a quick way to filter the Kanban board (`Planung Maschinen` & `Planung Maschinen blockiert`) for a specific order number or contract (e.g. `P2026`). Non-matching items must be completely hidden. Furthermore, any future steps belonging to the searched order that fall beyond the currently selected date horizon (`daysCount`) must be displayed in the `Überlauf` (Overflow) column so no matching step is missed.

### Decision
1. Add an interactive search input `searchQuery` to the control bar for both `Planung Maschinen` and `Planung Maschinen blockiert`.
2. Filter steps in real-time: match `searchQuery` against `orderId`, `contractNumber`, `articleName` / `stepDesc`, `customerName`, `ncProgram`, and `toolListNr`.
3. Hide all steps that do NOT match the query (e.g. searching `P2026` excludes `P2025`).
4. When `searchQuery` is non-empty, include matching steps whose scheduled start date falls beyond the visible range (`stepDateStr > planningDays[last]`) and assign them to the machine's `Überlauf` (Overflow) column.

### Rationale
- Provides immediate visual focus on searched customer contracts across both current date horizons and future backlogs.
- Guarantees 100% visibility of all matching steps without requiring the user to expand date range sliders unnecessarily.


