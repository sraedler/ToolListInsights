# Data Model: 04 - Planung Entgraten/Montieren

## Data Entities & Schemas

### 1. ManualWorkstation

Represents a manual finishing station.

```typescript
interface ManualWorkstation {
  code: 'ENTGRATEN_1' | 'ENTGRATEN_2' | 'WASCHANLAGE' | 'MESSRAUM' | 'MONTAGE' | 'VERPACKUNG';
  name: string;
  workerCount: number;
  shiftHoursPerWorker: number;
  totalCapacityHours: number; // workerCount * shiftHoursPerWorker
}
```

---

### 2. ManualJobStep

Represents a manual post-machining work step.

```typescript
interface ManualJobStep {
  stepId: string;
  orderId: string;
  articleId: string;
  workstationCode: string;
  estimatedTimeMin: number;
  isCncPredecessorCompleted: boolean;
  readinessStatus: 'PARTS_READY' | 'WAITING_FOR_CNC';
}
```
