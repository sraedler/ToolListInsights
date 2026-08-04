# Data Model: 07 - Datenvollständigkeit

## Data Entities & Schemas

### 1. DataAuditIssue

Represents a missing or incomplete master data attribute.

```typescript
interface DataAuditIssue {
  code: 'MISSING_NC' | 'FUZZY_NC_MATCH' | 'MISSING_TOOL_LIST' | 'MISSING_FIXTURE' | 'WRONG_MACHINE';
  severity: 'RED' | 'ORANGE' | 'YELLOW';
  description: string;
}
```

---

### 2. AuditedJobStep

```typescript
interface AuditedJobStep {
  stepId: string;
  orderId: string;
  articleId: string;
  articleName: string;
  machine: string;
  issues: DataAuditIssue[];
  completenessScorePercent: number; // 100 - (issues.length * 20)
  hasDmsDrawing: boolean;
}
```
