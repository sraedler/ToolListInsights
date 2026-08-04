# Feature Specification: ToolListInsights & Workshop Planning Suite

**Feature Branch**: `001-workshop-planning-suite`  
**Created**: 2026-08-04  
**Status**: Draft  
**Input**: User description: "learn the specification from the files in Features folder. Each folder starting with a number is a single feature"  

---

## Overview & System Scope

The **ToolListInsights & Workshop Planning Suite** is an enterprise manufacturing execution and shop-floor scheduling system. It synchronizes ERP order data, WinTool tooling databases, and d.velop document management systems (DMS) to optimize CNC machining operations, tool pre-setting, deburring, and operational performance analysis.

The suite comprises 8 core features:
1. **01 - Kanban Machine Scheduling (`01_Planung_Maschinen`)**: Visual scheduling and capacity control for CNC machining centers.
2. **02 - Blocked Operations & Conflict Management (`02_Planung_Maschinen_Blockiert`)**: Problem resolution for blocked or at-risk routing steps (KV status Yellow & Red).
3. **03 - Tool Pre-Setting & Assembly Planning (`03_Planung_Werkzeugruesten`)**: Preparation and magazine setup management for tooling departments.
4. **04 - Deburring & Assembly Workstation Planning (`04_Planung_Entgraten_Montieren`)**: Capacity planning for manual post-processing, washing, CMM inspection, and assembly.
5. **05 - Target vs. Actual Time Evaluation (`05_Zeitauswertung`)**: Controlling and variance analysis between calculated standard times and BDE actual times.
6. **06 - Long-Term Planning Analysis & Gantt Scheduling (`06_Auswertung_Planung`)**: Multi-week capacity load curves, Gantt timelines, and schedule stability metrics.
7. **07 - Master Data Audit & Data Completeness (`07_Datenvollstaendigkeit`)**: Quality audit dashboard identifying missing NC programs, unassigned fixtures, or unlinked tool lists.
8. **08 - Frequently Used Tools Analytics (`08_Meistgenutzte_Werkzeuge`)**: Historical and predictive tool usage analysis to identify candidates for permanent magazine setup.

---

## General Architectural Rules & Isolation Constraints

- **Strict Isolation (Zero Side-Effects)**: Every feature module MUST operate independently. Modifications to logic, state, UI components, or parameters in one feature MUST NOT alter the layout, behavior, or functionality of any other feature.
- **Immutability of Source Documentation**: Existing specification files (`Features/*.md`) serve as immutable references and MUST NOT be altered, overwritten, or deleted without explicit user approval.
- **Mandatory Automated Test Coverage**: Every user scenario and business rule MUST be backed by automated regression tests executable via `node Features/run_tests.js`.
- **Draft Workflow**: Proposed specification changes MUST be authored in a separate `DRAFT_Spezifikation.md` before merging into main documentation upon user approval.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Machine Scheduling & Capacity Optimization (Priority: P1)

As a shop-floor scheduler or production manager, I want to visually plan CNC machine schedules across adjustable horizons (5–21 days) with automated setup and night-shift optimization, so that machine downtime and tool changes are minimized.

**Why this priority**: Core primary functionality of the entire manufacturing system.

**Independent Test**: Can be tested independently by loading the Kanban scheduling view, applying optimization toggles, and verifying job sequence adjustments without loading other modules.

**Acceptance Scenarios**:
1. **Given** unassigned manufacturing orders with routing steps, **When** the scheduler selects a 5-day horizon and enables tool setup optimization, **Then** jobs requiring identical tooling lists are grouped sequentially on compatible machines.
2. **Given** long-running machining jobs capable of unmanned operation, **When** night-shift optimization is enabled, **Then** night-capable jobs are automatically scheduled at the end of the day shift to run overnight.
3. **Given** a scheduled job card, **When** a user drags and drops the card to a different machine or date, **Then** a persistent override record is created and the board updates immediately.

---

### User Story 2 - Conflict Resolution for Blocked Operations (Priority: P2)

As a production manager or shop supervisor, I want a dedicated view filtering for blocked or warning-flagged operations (KV Yellow & Red), so that I can resolve missing NC programs, missing tooling lists, or fixture conflicts before they delay production.

**Why this priority**: Critical operational gatekeeper to prevent machine stoppage due to missing inputs.

**Independent Test**: Can be tested independently by toggling conflict mode, confirming that green (ready) jobs are filtered out, and validating conflict alert banners.

**Acceptance Scenarios**:
1. **Given** scheduled routing steps, **When** conflict mode is activated (`isConflictMode = true`), **Then** only steps with missing NC programs, unassigned fixtures, or late predecessor steps are displayed.
2. **Given** a job blocked due to a missing NC program, **When** the planner applies a manual override ("Force Release"), **Then** the job status is temporarily updated to allow scheduling while logging an audit override.
3. **Given** a conflict card, **When** the user selects an alternative machine, **Then** the system automatically validates if the target machine supports the required NC program and fixture.

---

### User Story 3 - Tool Pre-Setting & Magazine Preparation (Priority: P3)

As a tool pre-setter or toolroom operator, I want to view a timeline of required tool assemblies per machine and net setup requirements, so that tools can be assembled, measured, and staged prior to physical machine execution.

**Why this priority**: Essential to minimize machine setup idle time and ensure tooling availability.

**Independent Test**: Can be tested independently by switching to the tooling mode tab and verifying net tool calculation against machine magazine inventories.

**Acceptance Scenarios**:
1. **Given** a machine schedule with attached WinTool lists, **When** the toolroom operator views the pre-setting matrix, **Then** the system displays the total tools required versus tools already present in the machine magazine.
2. **Given** weekly tool demands across multiple jobs, **When** opening the weekly tool aggregator modal, **Then** identical cutting inserts and tool components are aggregated into a unified picking list.

---

### User Story 4 - Post-Processing & Deburring Workstation Planning (Priority: P4)

As an assembly or finishing supervisor, I want a dedicated Kanban board organized by manual workstations (Deburring, Washing, CMM Inspection, Assembly), so that post-machining operations can be scheduled according to workforce capacity.

**Why this priority**: Ensures smooth throughput after CNC machining without creating bottlenecks in finishing.

**Independent Test**: Can be tested independently by filtering for deburring/assembly stations and verifying capacity load calculations based on staffing headcount.

**Acceptance Scenarios**:
1. **Given** completed machining steps, **When** viewing the deburring board, **Then** job cards indicate whether predecessor machining has been completed and Bauteile are physically ready.
2. **Given** manual workstation capacities, **When** assigning jobs to a station, **Then** available daily hours are calculated dynamically based on worker headcount multiplied by shift length.

---

### User Story 5 - Target vs. Actual Time Evaluation & Controlling (Priority: P5)

As a production controller or plant manager, I want to compare planned target setup/run times against actual BDE feedback times, so that efficiency indices can be tracked and inaccurate standard times can be identified.

**Why this priority**: Provides essential feedback loops to maintain accurate ERP standard times and costing.

**Independent Test**: Can be tested independently by specifying date ranges and calculating efficiency indices from target and actual time inputs.

**Acceptance Scenarios**:
1. **Given** recorded BDE completion times, **When** running the time evaluation report, **Then** the overall efficiency index is calculated as `(Target Setup + Target Run) / (Actual Setup + Actual Run) * 100`.
2. **Given** extreme time overruns (> +25%), **When** reviewing the detailed table grid, **Then** outlier rows are visually highlighted in red for immediate investigation.

---

### User Story 6 - Long-Term Planning Analysis & Gantt Scheduling (Priority: P6)

As an executive or master scheduler, I want to view multi-week Gantt charts (1 to 20 weeks) and capacity load curves, so that long-term machine utilization and on-time delivery adherence can be evaluated.

**Why this priority**: Enables strategic capacity planning and delivery promise verification.

**Independent Test**: Can be tested independently by adjusting the planning horizon slider (1–20 weeks) and verifying Gantt block alignment.

**Acceptance Scenarios**:
1. **Given** a multi-week schedule, **When** hovering over a contract/order number, **Then** all related job steps across all machines are simultaneously highlighted in the Gantt view.
2. **Given** machine capacity limits, **When** displaying the load curve chart, **Then** weekly scheduled hours are plotted against the 100% capacity threshold line.

---

### User Story 7 - Master Data Audit & Data Completeness (Priority: P7)

As a data quality auditor or production engineer, I want a dashboard listing all orders with incomplete master data (missing NC programs, unassigned fixtures, or unlinked tool lists), so that data issues can be fixed before scheduling.

**Why this priority**: Prevents invalid data from polluting automated scheduling logic.

**Independent Test**: Can be tested independently by executing data completeness filters and verifying error categorizations.

**Acceptance Scenarios**:
1. **Given** production orders in the system, **When** running the data completeness audit, **Then** steps are flagged as incomplete unless valid NC programs, tool lists, fixtures, and non-zero setup/run times exist.
2. **Given** an incomplete item, **When** clicking the DMS link, **Then** the corresponding engineering drawing opens in the d.velop DMS viewer to verify fixture requirements.

---

### User Story 8 - Frequently Used Tools Analytics (Priority: P8)

As a tooling engineer or purchasing agent, I want an aggregated analysis of past and future tool assembly usage, so that high-demand tools can be recommended for permanent machine magazine installation.

**Why this priority**: Reduces tool changeover frequency and optimizes inventory investment.

**Independent Test**: Can be tested independently by setting past/future observation windows (e.g., 30 days) and verifying tool ranking calculations.

**Acceptance Scenarios**:
1. **Given** historical BDE logs and future scheduling data, **When** executing the tool usage analysis for a machine, **Then** tools exceeding the threshold (e.g. >= 5 total usages) are flagged as candidates for permanent magazine installation ("Festbestückung").
2. **Given** tools with zero planned future usages, **When** reviewing magazine optimization recommendations, **Then** those tools are flagged for removal from the machine magazine.

---

### Edge Cases

- **Database Disconnection**: If external databases (DMS, WinTool, or ERP) become unavailable, core scheduling functionality MUST remain usable with warning indicators (Graceful Degradation).
- **Zero Standard Times**: If an ERP routing step has 0 setup or run time, the system MUST flag the step as a data quality issue (Yellow/Red) and prohibit automated scheduling until corrected or overridden.
- **Conflicting Overrides**: If two users attempt manual overrides on the same routing step, the system MUST persist the latest override in `planning_overrides.json` with an explicit timestamp and user ID.
- **Unlinked NC Program Names**: If NC program file names contain minor typos (e.g. `O4012.NC` vs `O-4012.NC`), the system MUST apply fuzzy matching logic and flag the item as a warning (Orange badge) for auditor verification.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide interactive Kanban board scheduling for CNC machining centers supporting day horizons from 5 to 21 days.
- **FR-002**: System MUST implement optimization algorithms (`Greedy`, `Local Search`, `Simulated Annealing`) to re-order job sequences for setup time minimization and fixture clustering.
- **FR-003**: System MUST support unmanned night-shift scheduling by placing night-capable jobs (`isNightRunCapable === true`) at the end of daily shift hours.
- **FR-004**: System MUST allow manual drag-and-drop job rescheduling between machines and dates, storing changes persistently in `planning_overrides.json`.
- **FR-005**: System MUST allow manual splitting of routing steps across multiple shift days.
- **FR-006**: System MUST integrate an inline d.velop DMS PDF drawing viewer supporting zoom, 90-degree rotation, page navigation, and proxy streaming (`GET /api/dms/drawing/:articleId`).
- **FR-007**: System MUST provide a conflict management view (`isConflictMode === true`) filtering strictly for jobs with KV status Yellow/Red, missing NC programs, missing fixtures, or predecessor delays.
- **FR-008**: System MUST allow manual override releases ("Force Release") for blocked jobs while logging audit entries.
- **FR-009**: System MUST calculate net tool preparation needs: $\text{Tools to Setup} = \text{Required Tools} \setminus \text{Magazine Tools}$.
- **FR-010**: System MUST provide a weekly tool component aggregator modal summarizing total insert and cutter counts across all scheduled jobs.
- **FR-011**: System MUST support workstation scheduling for manual post-processing (Deburring, Washing, Messraum, Assembly) organized by station groups.
- **FR-012**: System MUST calculate manual workstation capacity based on staffing headcount multiplied by shift hours.
- **FR-013**: System MUST compute target vs. actual time variances and efficiency indices: $\text{Efficiency} = \frac{\text{Target Setup} + \text{Target Run}}{\text{Actual Setup} + \text{Actual Run}} \times 100$.
- **FR-014**: System MUST visually flag extreme target vs. actual time overruns exceeding +25% in red.
- **FR-015**: System MUST provide Gantt chart scheduling visualizations supporting 1 to 20 week horizons.
- **FR-016**: System MUST support synchronous cross-machine highlighting of all job steps belonging to a selected contract number on mouse hover.
- **FR-017**: System MUST compute on-time delivery adherence scores: $\text{Adherence \%} = \frac{\text{Jobs Completed On-Time}}{\text{Total Jobs}} \times 100$.
- **FR-018**: System MUST provide a data completeness audit dashboard categorizing missing NC programs, missing fixtures, unlinked tool lists, and zero standard times.
- **FR-019**: System MUST enforce a completeness rule requiring valid NC programs, tool lists, fixtures, and positive setup/run times before declaring a step ready (Green).
- **FR-020**: System MUST aggregate historical BDE usages and future planned usages for tool assemblies (`ZzIdent`) by machine over customizable past/future day windows.
- **FR-021**: System MUST recommend permanent magazine installation ("Festbestückung") for tool assemblies exceeding configured usage thresholds ($\text{Usage} \ge 5$).
- **FR-022**: System MUST support dark mode and light mode themes via CSS variable scoping (`[data-theme='dark']` / `[data-theme='light']`).
- **FR-023**: System MUST generate deterministic HSL contract colors (`getContractColor`) based on contract number for visual tracing across all views.
- **FR-024**: System MUST maintain strict feature isolation such that UI, state, or API parameter updates in any single tab produce zero side-effects on other tabs.

---

### Key Entities

- **Manufacturing Order (`Belp`)**: Represents an ERP manufacturing order with attributes: `orderId`, `articleId`, `articleName`, `orderQty`, `contractNumber`, and `deliveryDate`.
- **Routing Step (`Arbeitsplan Schritt`)**: Represents an individual production step with attributes: `stepId`, `AR_STEP`, `stepName`, `machineGroup`, `setupTimeMin`, `runTimeMin`, `kvStatus` (green/yellow/red), `ncProgram`, `fixture`, and `toolListNr`.
- **Machine & Workstation**: Represents a CNC machine tool (e.g. Hermle C400, GROB G550) or manual workstation (e.g. Entgratplatz 1, Messraum) with shift capacity limits.
- **Tool Assembly (`WinTool ZzIdent`)**: Represents a complete tool assembly in WinTool with component breakdowns, cutting inserts, holder specs, and magazine position indicators.
- **Planning Override**: Represents a manual schedule adjustment with fields: `stepId`, `targetMachine`, `targetDate`, `manualOverride`, `timestamp`, and `user`.
- **DMS Drawing Document**: Represents engineering drawing metadata and PDF stream references in d.velop DMS.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: API response times for core schedule fetching (`GET /api/planning`) MUST remain under 200ms for p95 requests.
- **SC-002**: Automated setup time optimization MUST demonstrate a measurable setup time reduction of at least 15% across multi-job batches compared to unoptimized sequences.
- **SC-003**: Data audit algorithms MUST achieve 100% detection accuracy for incomplete master data (missing NC programs, unassigned fixtures, 0-minute standard times).
- **SC-004**: On-time delivery calculation accuracy MUST achieve 99%+ consistency across multi-week planning horizons.
- **SC-005**: Zero regressions across modules: 100% of automated unit tests (`node Features/run_tests.js`) MUST pass without side-effects when any single feature component is modified.

---

## Assumptions & Scope Boundaries

- **Assumptions**:
  - The underlying database layer connects to MS SQL Server (ERP D4 tables), WinTool SQL database, and d.velop DMS API.
  - Manual overrides persist in local filesystem JSON (`backend/planning_overrides.json`).
  - Standard shift duration defaults to 16 hours per day (two 8-hour shifts) unless specified.
- **Out of Scope**:
  - Direct real-time control of CNC machine hardware (NC code transmission to machine CNC controllers is handled out-of-band by DNC software).
  - Modification of immutable reference files in `Features/*.md`.
