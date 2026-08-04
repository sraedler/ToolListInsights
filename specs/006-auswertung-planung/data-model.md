# Data Model: 06 - Auswertung Planung

## Data Entities & Schemas

### 1. GanttJobBlock

Represents a scheduled job step rendered as a block on a Gantt timeline row.

```typescript
interface GanttJobBlock {
  stepId: string;
  orderId: string;
  contractNumber: string;
  articleName: string;
  machine: string;
  startOffsetDays: number;
  durationDays: number;
  isNightRun: boolean;
  isOnTime: boolean;
  isPoolFilledStep: boolean; // True if step was allocated from pool to fill free space
}
```

---

### 2. WeeklyMachineCapacity

```typescript
interface WeeklyMachineCapacity {
  weekNumber: number;
  weekLabel: string;
  machine: string;
  fixedScheduledHours: number;    // Hours from machine-booked jobs
  poolScheduledHours: number;     // Hours from pool jobs filling free space
  availableCapacityHours: number; // Total max daily capacity limit
  utilizationPercent: number;     // (fixedScheduledHours + poolScheduledHours) / availableCapacityHours * 100
}
```
