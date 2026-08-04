# Implementation Plan: 04 - Planung Entgraten/Montieren (Nacharbeit & Montage)

**Branch**: `004-planung-entgraten-montieren` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/004-planung-entgraten-montieren/spec.md)

**Input**: Feature specification from [`specs/004-planung-entgraten-montieren/spec.md`](file:///C:/git_repos/ToolListInsights/specs/004-planung-entgraten-montieren/spec.md)

---

## Summary

Implement the manual workstation capacity planning view (`04_Planung_Entgraten_Montieren`). The technical approach structures Kanban columns by manual post-machining stations (`ENTGRATEN_1`, `ENTGRATEN_2`, `WASCHANLAGE`, `MESSRAUM`, `MONTAGE`, `VERPACKUNG`), dynamically computing workstation capacity from worker headcount ($\text{Worker Count} \times \text{Shift Hours}$) and checking CNC predecessor completion. A native test suite will be created at `Features/04_Planung_Entgraten_Montieren/test.js`.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: ERP D4 / BDE bookings, `backend/planning_overrides.json`  
**Testing**: Native Node.js `node:assert` test suite in `Features/04_Planung_Entgraten_Montieren/test.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Manual capacity calculation under 100ms  
**Constraints**: Strict feature isolation with zero side-effects on other tabs.  

---

## Constitution Check

- [x] **Principle I: Code Quality**: Modular headcount capacity calculation and readiness predicate.
- [x] **Principle II: Testing Standards**: Covered by automated tests in `Features/04_Planung_Entgraten_Montieren/test.js`.
- [x] **Principle III: UX Consistency**: Green readiness badges and headcount capacity progress bars.
- [x] **Principle IV: Performance**: Client-side manual board rendering < 100ms.

---

## Project Structure

```text
specs/004-planung-entgraten-montieren/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── manual-workstation-api.json
└── checklists/
    └── requirements.md
```

---

## Complexity Tracking

*No constitution violations present.*
