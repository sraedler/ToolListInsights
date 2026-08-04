# Implementation Plan: 05 - Zeitauswertung (Soll vs. Ist Maschinenzeiten)

**Branch**: `005-zeitauswertung` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/spec.md)

**Input**: Feature specification from [`specs/005-zeitauswertung/spec.md`](file:///C:/git_repos/ToolListInsights/specs/005-zeitauswertung/spec.md)

---

## Summary

Implement the Target vs Actual time controlling report view (`05_Zeitauswertung`). The technical approach calculates efficiency index percentages ($\frac{\text{Target}}{\text{Actual}} \times 100$) and variance percentages ($\frac{\text{Actual} - \text{Target}}{\text{Target}} \times 100$) comparing ERP target times against BDE feedback logs. Time overruns exceeding +25% are highlighted in red in an interactive Recharts trend chart and breakdown table. A native unit test suite will be created at `Features/05_Zeitauswertung/test.js`.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: ERP D4 / BDE feedback SQL logs  
**Testing**: Native Node.js `node:assert` test suite in `Features/05_Zeitauswertung/test.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Time evaluation report query execution < 300ms  
**Constraints**: Strict feature isolation with zero side-effects on other tabs.  

---

## Constitution Check

- [x] **Principle I: Code Quality**: Modular efficiency formulas and data aggregator functions.
- [x] **Principle II: Testing Standards**: Covered by automated tests in `Features/05_Zeitauswertung/test.js`.
- [x] **Principle III: UX Consistency**: Recharts visual trend graphs and red overrun indicators.
- [x] **Principle IV: Performance**: DB report aggregation query < 300ms.

---

## Project Structure

```text
specs/005-zeitauswertung/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── time-evaluation-api.json
└── checklists/
    └── requirements.md
```

---

## Complexity Tracking

*No constitution violations present.*
