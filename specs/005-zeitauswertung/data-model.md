# Data Model: 05 - Zeitauswertung

## Data Entities & Schemas

### 1. TimeEvaluationRecord

Represents target vs actual machining time metrics for a job step.

```typescript
interface TimeEvaluationRecord {
  orderId: string;
  articleId: string;
  articleName: string;
  machine: string;
  targetSetupMin: number;
  actualSetupMin: number;
  targetRunMin: number;
  actualRunMin: number;
  targetTotalMin: number;
  actualTotalMin: number;
  efficiencyPercent: number;    // (targetTotalMin / actualTotalMin) * 100
  variancePercent: number;      // ((actualTotalMin - targetTotalMin) / targetTotalMin) * 100
  isOverrunFlagged: boolean;    // variancePercent > 25%
}
```

---

### 2. TimeEvaluationSummary

```typescript
interface TimeEvaluationSummary {
  totalJobsEvaluated: number;
  avgEfficiencyPercent: number;
  totalTargetHours: number;
  totalActualHours: number;
  overrunCount: number;
}
```
