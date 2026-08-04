# Research & Technical Decisions: 01 - Planung Maschinen

## Technical Stack & Architectural Decisions

### 1. Dual-Driver MS SQL Server Architecture (`backend/db.js`)
- **Decision**: Hybrid connection pool builder using `msnodesqlv8` on Windows and `mssql` (`tedious`) on Linux/Docker.
- **Rationale**: 
  - On Windows development/on-prem environments, `msnodesqlv8` allows seamless Windows Trusted Authentication via ODBC Driver 17 for SQL Server without plain-text domain credentials.
  - On Linux containers (Docker), standard TCP/IP authentication via `tedious` prevents C++ compilation issues.
- **Connection Pools Configured**:
  - `D4`: Production ERP database (`tbe_Belp`, `tbe_Arbeitsplan`) on `192.168.100.5\D4`.
  - `WTData`: WinTool database (`WinTool_Baugruppen`) on `192.168.100.8\cim4net`.
  - `Toollist`: Auxiliary tool list database on `192.168.100.8\CIM4NET`.

---

### 2. Frontend Framework & Component Design
- **Decision**: React 19 SPA built with Vite 8, Recharts 3, and Lucide React.
- **Rationale**:
  - **React 19**: Ultra-fast component rendering with concurrent mode and minimal render overhead.
  - **Vite 8**: Sub-second Hot Module Replacement (HMR) and optimized production bundling.
  - **Recharts 3**: Declarative SVG charting for machine utilization load curves.
  - **Theme System**: Dynamic Light/Dark mode toggling via scoped CSS variables (`[data-theme='dark']` / `[data-theme='light']`).

---

### 3. Optimization Heuristics & In-Memory Caching
- **Decision**: Express 5 backend with in-memory caching of ERP/WinTool data and dynamic heuristic optimization (`Greedy`, `Local Search`, `Simulated Annealing`).
- **Rationale**:
  - In-memory indexing of 1,000+ routing steps reduces database query overhead.
  - Heuristic algorithms re-sequence jobs by tool list ID (`ZzIdent`) and fixture number (`fixture`), placing night-capable jobs over night shifts in < 50ms.

---

### 4. Overrides & DMS Proxy Integration
- **Decision**: Persistent JSON file `backend/planning_overrides.json` for drag-and-drop manual overrides combined with Express proxy endpoints for d.velop DMS PDF drawings.
- **Rationale**:
  - Keeps ERP database read-only to eliminate risk of corrupting production ERP tables.
  - Nginx reverse proxy routes `/api` calls safely without CORS issues.
