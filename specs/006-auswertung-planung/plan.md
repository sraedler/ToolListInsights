# Implementation Plan: 06 - Auswertung Planung (Planungsanalyse & Gantt-Belegung)

**Branch**: `006-auswertung-planung` | **Date**: 2026-08-04 | **Spec**: [`spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md)

**Input**: Feature specification from [`specs/006-auswertung-planung/spec.md`](file:///C:/git_repos/ToolListInsights/specs/006-auswertung-planung/spec.md)

---

## Summary

Implement and refine the multi-week Gantt timeline analysis view (`06_Auswertung_Planung`). The technical approach retrieves machine daily capacities 1:1 directly from D4 `tPPS_MASTA` for all machines (using dual ID & Name mapping to guarantee C400, C40, C42, Brother, Chiron, RS2 accuracy) without shift assumptions or alterations. Uses a **Two-Pass Non-Overbooking Pool Allocation Algorithm**: machine-booked jobs (`MachineId`) reserve capacity first; pool jobs (`MachinePoolId === 13`) fill ONLY remaining free capacity without ever overbooking any machine beyond its 1:1 D4 capacity limit. Renders horizontal Gantt timelines for flexible 1 to 20-week horizons and supports synchronous cross-machine contract highlighting on mouse hover (`hoveredContractNumber`). A native test suite is updated at `Features/06_Auswertung_Planung/test.js`.

---

## Learned Technical Context

**Language/Version**: Node.js (v18+, CommonJS), JavaScript (React 19, Vite 8)  
**Primary Dependencies**: Express 5, React 19, Recharts 3, Lucide React  
**Storage**: ERP D4 (`tPPS_MASTA`) / BDE schedules  
**Testing**: Native Node.js `node:assert` test suite in `Features/06_Auswertung_Planung/test.js`  
**Target Platform**: Node.js Backend + React Web Frontend  
**Project Type**: Full-Stack Web Application  
**Performance Goals**: Gantt horizon rendering under 200ms  
**Constraints**: Direct 1:1 D4 database capacity retrieval with dual ID/Name mapping; Two-Pass Pool allocation algorithm.  

---

## Constitution Check

- [x] **Principle I: Code Quality**: 1:1 D4 capacity mapping, dual ID/Name resolution for C400, two-pass pool allocation, and synchronous contract highlighting.
- [x] **Principle II: Testing Standards**: Covered by automated tests in `Features/06_Auswertung_Planung/test.js`.
- [x] **Principle III: UX Consistency**: Interactive hover effects and 100% capacity limit line indicators.
- [x] **Principle IV: Performance**: Client-side Gantt timeline rendering < 200ms.

---

## Project Structure

```text
specs/006-auswertung-planung/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── gantt-api.json
└── checklists/
    └── requirements.md
```

---

## Complexity Tracking

*No constitution violations present.*
