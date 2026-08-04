# Research & Technical Decisions: 04 - Planung Entgraten/Montieren

## Technical Stack & Architectural Decisions

### 1. Manual Workstation Headcount Capacity Engine
- **Decision**: Dynamic capacity formula based on worker headcount and shift hours:
  $$\text{Capacity Hours} = \text{Worker Count} \times \text{Shift Hours}$$
- **Rationale**: Manual finishing stations (Deburring, Washing, Measuring, Assembly) depend on available personnel rather than automated machine spindles.

---

### 2. Predecessor CNC Completion Verification
- **Decision**: Predicate check comparing BDE machining completion timestamps against manual work step creation:
  $$\text{IsReadyForDeburring} = \text{Predecessor CNC Step Status} \equiv \text{COMPLETED}$$
- **Rationale**: Prevents premature scheduling of manual finishing before CNC machining is finished.

---

### 3. Native Test Suite Integration (`Features/04_Planung_Entgraten_Montieren/test.js`)
- **Decision**: Create a native `node:assert` test suite in `Features/04_Planung_Entgraten_Montieren/test.js` and register with `Features/run_tests.js`.
- **Rationale**: Complies with Constitution Principle II (Mandatory Automated Testing).
