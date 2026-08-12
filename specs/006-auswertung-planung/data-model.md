# Data Model: 06 - Auswertung Planung & Contiguous Setup Splitting

## Entities & Data Schemas

### 1. Step Schedule Item (`StepScheduleItem`)
| Field | Type | Description |
|-------|------|-------------|
| `StepId` | String/Number | Unique step identifier |
| `OrderId` | String | Order identifier (e.g. `P202684930`) |
| `OrderPos` | String | Position identifier (e.g. `100`) |
| `StepPos` | String | Step position (e.g. `040`) |
| `MachineId` | Integer/Null | Specific machine assignment |
| `MachinePoolId` | Integer/Null | Pool assignment (`9`/`12` = RS2 Pool, `13` = C40-C42 Pool) |
| `SetupTime` | Integer | Setup time allocated for the current day (100% on Day 1, 0 on Day 2+) |
| `ProdTime` | Integer | Production/milling time allocated for the current day |
| `ScheduledMin` | Integer | Total scheduled time allocated for the current day ($\text{SetupTime} + \text{ProdTime}$) |
| `OriginalSetupTime` | Integer | Original un-split setup time |
| `OriginalProdTime` | Integer | Original un-split production time |
| `IsSetupContiguous` | Boolean | Always true (setup time is never split across days) |
| `MaxProdTag` | Integer | Planned maximum production minutes per day (`PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG`) |
| `IsOverplanned` | Boolean | True if step allows over-planning (`PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`) |
| `IsSplit` | Boolean | True if step is split across multiple days |
| `SplitPart` | Integer | Split segment index (1, 2, 3...) |

### 2. Day Workload Summary (`DayWorkloadSummary`)
| Field | Type | Description |
|-------|------|-------------|
| `DateStr` | String | Calendar day (YYYY-MM-DD) or `Überlauf` |
| `TotalSetupMin` | Integer | Sum of setup minutes allocated for this specific day |
| `TotalProdMin` | Integer | Sum of production minutes allocated for this specific day |
| `TotalWorkloadMin` | Integer | Total allocated workload minutes ($\sum \text{DailyAllocatedMin}$) |
| `DayCapacityMin` | Integer | Daily capacity limit directly from D4 `tPPS_MASTA` |
| `LoadPercentage` | Integer | Capacity utilization percentage ($\min(100, \text{TotalWorkloadMin} / \text{DayCapacityMin} \times 100)$) |
