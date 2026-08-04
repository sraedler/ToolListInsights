# Implementation Plan: 08 - Meistgenutzte Werkzeuge (Werkzeugnutzungs- & Eingriffszeit-Analyse)

**Branch**: `008-meistgenutzte-werkzeuge` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/spec.md)

**Input**: Feature specification from [`specs/008-meistgenutzte-werkzeuge/spec.md`](file:///C:/git_repos/ToolListInsights/specs/008-meistgenutzte-werkzeuge/spec.md)

---

## Summary

Implement the Tool Usage & Permanent Magazine Staging Analysis view (`08_Meistgenutzte_Werkzeuge`). The technical approach aggregates historical BDE tool usages (`pastDays`) and future scheduled tool requirements (`futureDays`) by machine for tool assemblies (`ZzIdent`). Tool assemblies with total usage $\ge 5$ are highlighted with a "Festbestückung empfohlen" (Standard Magazine Candidate) badge, while tools with zero future demand are flagged for removal. Includes Recharts bar charts and CSV export functionality. A native test suite will be created at `Features/08_Meistgenutzte_Werkzeuge/test.js`.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: WinTool SQL database (`WTData`), BDE feedback SQL logs  
**Testing**: Native Node.js `node:assert` test suite in `Features/08_Meistgenutzte_Werkzeuge/test.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Tool usage aggregation query < 250ms  
**Constraints**: Strict feature isolation with zero side-effects on other tabs.  

---

## Constitution Check

- [x] **Principle I: Code Quality**: Modular tool usage aggregator and threshold evaluator.
- [x] **Principle II: Testing Standards**: Covered by automated tests in `Features/08_Meistgenutzte_Werkzeuge/test.js`.
- [x] **Principle III: UX Consistency**: Standard tooling badges, removal flags, and CSV export triggers.
- [x] **Principle IV: Performance**: In-memory tool demand calculation < 250ms.

---

## Project Structure

```text
specs/008-meistgenutzte-werkzeuge/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tool-usage-api.json
└── checklists/
    └── requirements.md
```

---

## Complexity Tracking

*No constitution violations present.*
