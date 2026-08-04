# Implementation Plan: 03 - Planung Werkzeugrüsten (Werkzeugrüst-Planung)

**Branch**: `003-planung-werkzeugruesten` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/003-planung-werkzeugruesten/spec.md)

**Input**: Feature specification from [`specs/003-planung-werkzeugruesten/spec.md`](file:///C:/git_repos/ToolListInsights/specs/003-planung-werkzeugruesten/spec.md)

---

## Summary

Implement the tool pre-setting and magazine setup planning view (`03_Planung_Werkzeugruesten`). The technical approach calculates net tool assembly requirements by computing the difference between WinTool lists and live machine magazine inventories (`mode = 'tools'`). Toolroom pre-setters can manage setup stages (`PREPARATION_PENDING` → `IN_ASSEMBLY` → `READY_ON_CART` → `INSTALLED_IN_MAGAZINE`) and view an aggregated weekly cutting component picking list modal. A native unit test suite will be created at `Features/03_Planung_Werkzeugruesten/test.js`.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: WinTool SQL database (`WTData`), MS SQL Server (`Toollist`), `backend/planning_overrides.json`  
**Testing**: Native Node.js `node:assert` test suite in `Features/03_Planung_Werkzeugruesten/test.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Net setup calculations executed under 150ms  
**Constraints**: Strict feature isolation with zero side-effects on other tabs.  

---

## Constitution Check

- [x] **Principle I: Code Quality**: Modular pre-setting stage handlers and delta calculation functions.
- [x] **Principle II: Testing Standards**: Covered by automated tests in `Features/03_Planung_Werkzeugruesten/test.js`.
- [x] **Principle III: UX Consistency**: Stage matrix indicators and net setup KPI cards.
- [x] **Principle IV: Performance**: In-memory magazine delta calculation < 150ms.

---

## Project Structure

```text
specs/003-planung-werkzeugruesten/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tool-preset-api.json
└── checklists/
    └── requirements.md
```

---

## Complexity Tracking

*No constitution violations present.*
