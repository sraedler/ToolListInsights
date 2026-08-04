# Research & Technical Decisions: 05 - Zeitauswertung

## Technical Stack & Architectural Decisions

### 1. Efficiency Index & Time Variance Formulas
- **Decision**: Precise mathematical variance calculations comparing ERP Target vs BDE Actual times:
  $$\text{Efficiency \%} = \left( \frac{\text{Target Setup} + \text{Target Run}}{\text{Actual Setup} + \text{Actual Run}} \right) \times 100$$
  $$\text{Variance \%} = \left( \frac{\text{Actual Total} - \text{Target Total}}{\text{Target Total}} \right) \times 100$$
- **Rationale**: Overruns > +25% are visually flagged in red for production controllers.

---

### 2. Recharts Dynamic Visualizations
- **Decision**: Interactive Recharts bar and trend charts visualizing setup vs run time variance across CNC machines.
- **Rationale**: Provides high-level visual insight into shop-floor performance.

---

### 3. Native Test Suite Integration (`Features/05_Zeitauswertung/test.js`)
- **Decision**: Create a native `node:assert` test suite in `Features/05_Zeitauswertung/test.js` and register with `Features/run_tests.js`.
- **Rationale**: Complies with Constitution Principle II (Mandatory Automated Testing).
