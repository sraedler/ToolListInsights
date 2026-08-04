# Research & Technical Decisions: 07 - Datenvollständigkeit

## Technical Stack & Architectural Decisions

### 1. Master Data Quality Audit Engine
- **Decision**: Comprehensive validation predicate auditing ERP/WinTool fields:
  ```javascript
  const issues = [];
  if (!step.ncProgram) issues.push({ code: 'MISSING_NC', severity: 'RED' });
  if (step.ncMatchMode === 'fuzzy') issues.push({ code: 'FUZZY_NC_MATCH', severity: 'ORANGE' });
  if (!step.matchedListNr) issues.push({ code: 'MISSING_TOOL_LIST', severity: 'RED' });
  if (!step.fixture) issues.push({ code: 'MISSING_FIXTURE', severity: 'YELLOW' });
  if (step.isWrongMachine) issues.push({ code: 'WRONG_MACHINE', severity: 'RED' });
  ```
- **Rationale**: Categorizes data completeness gaps into clear Red (Critical), Orange (Fuzzy Warning), and Yellow (Notice) severity tiers.

---

### 2. Direct DMS Quick-Launch Integration
- **Decision**: Integrated action trigger connecting audited article IDs directly to the d.velop DMS proxy viewer (`/api/dms/drawing/:articleId`).
- **Rationale**: Enables planners to immediately inspect technical drawings while fixing missing fixture or tool list references.

---

### 3. Native Test Suite Integration (`Features/07_Datenvollstaendigkeit/test.js`)
- **Decision**: Create a native `node:assert` test suite in `Features/07_Datenvollstaendigkeit/test.js` and register with `Features/run_tests.js`.
- **Rationale**: Complies with Constitution Principle II (Mandatory Automated Testing).
