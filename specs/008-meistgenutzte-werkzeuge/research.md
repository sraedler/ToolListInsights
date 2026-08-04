# Research & Technical Decisions: 08 - Meistgenutzte Werkzeuge

## Technical Stack & Architectural Decisions

### 1. Tool Usage Aggregation & Permanent Installation Threshold
- **Decision**: Combined historical (BDE `pastDays`) and future schedule (`futureDays`) tool demand aggregator:
  $$\text{Total Usage} = \text{Past BDE Usages} + \text{Future Scheduled Usages}$$
  $$\text{IsStandardToolCandidate} = \text{Total Usage} \ge 5$$
- **Rationale**: Identifies high-frequency tools that should be permanently loaded in machine magazines to minimize pre-setting changeover times.

---

### 2. Export & Recharts Visualizations
- **Decision**: Top 10/20 stacked bar chart displaying past vs future usage breakdown per tool assembly (`ZzIdent`), with client-side CSV export trigger.
- **Rationale**: Provides clear purchasing recommendations and magazine optimization insights.

---

### 3. Native Test Suite Integration (`Features/08_Meistgenutzte_Werkzeuge/test.js`)
- **Decision**: Create a native `node:assert` test suite in `Features/08_Meistgenutzte_Werkzeuge/test.js` and register with `Features/run_tests.js`.
- **Rationale**: Complies with Constitution Principle II (Mandatory Automated Testing).
