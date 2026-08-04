# Implementation Plan: 02 - Planung Maschinen blockiert (KV-Status Gelb & Rot)

**Branch**: `002-planung-maschinen-blockiert` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/002-planung-maschinen-blockiert/spec.md)

**Input**: Feature specification from [`specs/002-planung-maschinen-blockiert/spec.md`](file:///C:/git_repos/ToolListInsights/specs/002-planung-maschinen-blockiert/spec.md)

---

## Summary

Implement the dedicated problem and conflict resolution view (`02_Planung_Maschinen_Blockiert`). The technical approach filters out green (ready) jobs, displaying only steps with KV status Yellow/Red, missing NC programs, missing fixtures, or predecessor delays (`isConflictMode = true`). Human planners can trigger a "Force Release" override or reallocate jobs to alternative machines with automatic prerequisite validation, storing audit entries in `backend/planning_overrides.json`. A new native test suite will be created at `Features/02_Planung_Maschinen_Blockiert/test.js`.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: `backend/planning_overrides.json`, MS SQL Server (D4 / WinTool)  
**Testing**: Native Node.js `node:assert` test suite in `Features/02_Planung_Maschinen_Blockiert/test.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Client-side filtering execution under 100ms  
**Constraints**: Strict feature isolation with zero side-effects on other tabs.  

---

## Constitution Check

- [x] **Principle I: Code Quality**: Modular conflict filtering logic and visual warning banners.
- [x] **Principle II: Testing Standards**: Covered by automated tests in `Features/02_Planung_Maschinen_Blockiert/test.js`.
- [x] **Principle III: UX Consistency**: Red alert cards, yellow warning banners, and pulsatile indicators.
- [x] **Principle IV: Performance**: Client-side response filtering < 100ms.

---

## Project Structure

```text
specs/002-planung-maschinen-blockiert/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── conflict-api.json
└── checklists/
    └── requirements.md
```

---

## Complexity Tracking

*No constitution violations present.*
