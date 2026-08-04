# Research & Technical Decisions: 03 - Planung Werkzeugrüsten

## Technical Stack & Architectural Decisions

### 1. Net Tool Assembly & Magazine Delta Calculation
- **Decision**: Server-side tool set difference algorithm comparing WinTool lists against machine magazine inventories:
  $$\text{Tools to Setup} = \text{WinTool List Assemblies} \setminus \text{Live Magazine Assemblies}$$
- **Rationale**: Prevents unnecessary tool assembly teardown and re-assembly when tools are already mounted in the machine magazine.

---

### 2. Status Stage State Machine
- **Decision**: Four-stage workflow state machine for pre-setting jobs:
  `PREPARATION_PENDING` → `IN_ASSEMBLY` → `READY_ON_CART` → `INSTALLED_IN_MAGAZINE`.
- **Rationale**: Provides real-time visibility between the toolroom pre-setters and CNC operators.

---

### 3. Native Test Suite Integration (`Features/03_Planung_Werkzeugruesten/test.js`)
- **Decision**: Create a native `node:assert` test suite in `Features/03_Planung_Werkzeugruesten/test.js` and register with `Features/run_tests.js`.
- **Rationale**: Complies with Constitution Principle II (Mandatory Automated Testing).
