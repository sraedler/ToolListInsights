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
| `PosQuantity` | Integer | Total piece count of P-Auftrag position |
| `AvgPieceTime` | Float/Integer | Average production time per piece ($\text{TotalStepProdTime} / \text{PosQuantity}$) |
| `MaxPiecesPerNight` | Integer | Max pieces loadable for night run |
| `MaxNightCapacityMin` | Integer | Calculated max night performance runtime ($\text{MaxPiecesPerNight} \times \text{AvgPieceTime}$) |
| `DayShiftMin` | Integer | Runtime allocated within Day Window limit ($\le \text{DayCapacity}$) |
| `NightShiftMin` | Integer | Runtime allocated for Night Run ($\le \min(\text{MaxNightCapacityMin}, 1440 - \text{DayShiftMin})$) |

### 2. Day Workload Summary (`DayWorkloadSummary`)
| Field | Type | Description |
|-------|------|-------------|
| `DateStr` | String | Calendar day (YYYY-MM-DD) or `Überlauf` |
| `TotalSetupMin` | Integer | Sum of setup minutes allocated for this specific day |
| `TotalProdMin` | Integer | Sum of production minutes allocated for this specific day |
| `DayShiftWorkloadMin` | Integer | Workload allocated during standard Day Window ($\le \text{DayCapacityMin}$) |
| `NightShiftWorkloadMin` | Integer | Workload allocated during Night Run ($\le 1,440 - \text{DayShiftWorkloadMin}$) |
| `TotalWorkloadMin` | Integer | Total daily allocated workload ($\text{DayShiftWorkloadMin} + \text{NightShiftWorkloadMin} \le 1,440$) |
| `DayCapacityMin` | Integer | Standard day window capacity limit from D4 `tPPS_MASTA` (e.g. 480 min / 8h) |
| `MaxDailyLimitMin` | Integer | Fixed hard maximum daily capacity ceiling of 1,440 minutes (24 hours) |
| `LoadPercentage` | Integer | Capacity utilization percentage relative to 24h ceiling |

### 3. Pool Machine Night Run Configuration (`PoolNightRunConfig`)
| Field | Type | Description |
|-------|------|-------------|
| `MachinePoolId` | Integer | Pool identifier (`9`/`12` = RS2, `13` = C40-C42) |
| `MachineId` | Integer | Machine identifier |
| `MaxPiecesPerNight` | Integer | Max piece capacity for night run |
| `IsNightRunEnabled` | Boolean | True if machine is authorized for night run optimization |
