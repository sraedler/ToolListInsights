# Research & Technical Decisions: 06 - Auswertung Planung

## Technical Stack & Architectural Decisions

### 1. Direct 1:1 D4 Database Capacity Retrieval Policy with Dual-Mapping (ID & Name)
- **Entscheidung**: Die Tageskapazitäten aller Fräsmaschinen (einschließlich C400, C40, C42, Brother, Chiron, RS2_1, RS2_2) werden zu 100% ohne Schichtannahmen 1:1 direkt aus der D4-Tabelle `[D4].[dbo].[tPPS_MASTA]` (`MS_KAPAZITAET_ZEIT_MINUTEN_...`) geladen. Es kommt ein Dual-Mapping nach ID und Namens-Match (`MS_NUMMER`/`MS_BEZEICHNUNG`) zum Einsatz:
  ```javascript
  const capMap = (dbId && capacities[dbId]) || nameCapacities[mName.toUpperCase()] || nameCapacities[mName];
  ```
- **Rationale**: Garantiert, dass Maschinen wie die C400 auch bei abweichenden oder dynamischen D4-IDs exakt ihre hinterlegten Tageskapazitäten erhalten.

---

### 2. Capacity-Proportional Best-Fit Pool Allocation Algorithm (Pass 2)
- **Regel & Sortierung**:
  - **Pass 1 (Maschinengebucht)**: Fest gebuchte Maschinenaufträge (`MachineId`) belegen zuerst die primäre Kapazität ihrer Maschine.
  - **Pass 2 (Pool-Sortierung & Zuweisung)**: Alle Pool-Aufträge eines Tages werden vor der Zuweisung **absteigend nach Dauer (`stepMin`)** sortiert (große Aufträge zuerst).
  - **Best-Fit Zuweisung nach freier Kapazität**:
    - Ein Auftrag mit Dauer $T$ vergleicht die verbleibende freie Tageskapazität $R_{\text{C40}}$ und $R_{\text{C42}}$.
    - Kann der Auftrag bei beiden Maschinen ohne Überbuchung platziert werden ($T \le R_{\text{C40}}$ und $T \le R_{\text{C42}}$), wird er der Maschine mit der **größeren freien Restkapazität** zugewiesen (z. B. 7h-Auftrag geht an C42 mit 10h frei statt an C40 mit 5h frei).
    - Danach verbleibt kleineren Aufträgen (z. B. 3h) noch ausreichend Kapazität auf beiden Maschinen.
  - **Strikter Schutz vor Überbuchung**: Kann ein Pool-Auftrag auf keiner Maschine des Pools ohne Überbuchung platziert werden, landet er im `Überlauf`.

---

### 3. Synchronous Contract Highlighting (`hoveredContractNumber`)
- **Decision**: Centralized hover state (`hoveredContractNumber`) shared across all machine Gantt rows:
  ```javascript
  const isHighlighted = hoveredContractNumber && job.contractNumber === hoveredContractNumber;
  ```
- **Rationale**: Instantly visually connects all machining operations belonging to the same order contract across different CNC machines.

---

### 4. Multi-Week Horizon Timeline Engine (1-20 Weeks)
- **Decision**: Parameterized date window generator grouping machine load hours into weekly buckets against the 100% capacity threshold line.
- **Rationale**: Enables strategic long-term capacity balancing and bottleneck detection up to 20 weeks in advance.

---

### 6. Over-planning (Überplanung / Überlappung) Scheduling & Visual Engine
- **Decision & Fields**:
  - `sk.PSP_ZEIT_UEBERLAPPUNG_PROZENT` (`UeberlappungProzent`): Percentage of over-planning allowed.
  - `sk.PSP_PP_ZEIT_MINUTEN_MAX_PROD_TAG` (`MaxProdTag`): Daily max production minutes allocated for the step.
- **Rückwärts-Terminierung (Backward Scheduling)**:
  - When `PSP_ZEIT_UEBERLAPPUNG_PROZENT > 0`, `PSPP_DATUM_START` is treated as the **End Date** (Enddatum).
  - Allocation allocates `MaxProdTag` minutes per working day **backwards** starting from `PSPP_DATUM_START` until total batch duration (`SetupTime + ProdTime`) is reached.
- **Visuelle Farbcodierung (Distinct Purple Styling `#a855f7`)**:
  - Over-planned steps receive `color: 'Purple'` and `isOverplanned: true`.
  - In the Gantt timeline, job bars render in distinct **Purple** styling (`#a855f7`).
  - In the Capacity Progression Chart (`PlanningEvaluationTab`), over-planned hours render as a distinct **Purple** stacked bar segment with a separate legend checkbox toggle (**"Überplante Stunden"**).
