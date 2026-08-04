# Data Model: 08 - Meistgenutzte Werkzeuge

## Data Entities & Schemas

### 1. ToolUsageRecord

Represents aggregated usage metrics for a tool assembly.

```typescript
interface ToolUsageRecord {
  zzIdent: string;               // Tool assembly ID (e.g. "TL-9912")
  description: string;           // Tool description
  machine: string;               // Machine name
  pastUsagesCount: number;      // Historical BDE usage count
  futureUsagesCount: number;    // Scheduled future usage count
  totalUsagesCount: number;     // pastUsagesCount + futureUsagesCount
  isStandardToolCandidate: boolean; // totalUsagesCount >= 5
  isRemovalCandidate: boolean;  // pastUsagesCount > 0 && futureUsagesCount === 0
}
```

---

### 2. ToolUsageSummary

```typescript
interface ToolUsageSummary {
  machine: string;
  totalUniqueToolsCount: number;
  standardToolCandidatesCount: number;
  removalCandidatesCount: number;
}
```
