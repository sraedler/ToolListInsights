import React from 'react';

export function ToolUsageHeader({
  totalUniqueTools,
  standardCandidatesCount,
  removalCandidatesCount,
  onExportCsv
}) {
  return (
    <div
      className="tool-usage-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        borderLeft: '6px solid #06b6d4',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 6px 0', color: '#22d3ee' }}>⚙️ Meistgenutzte Werkzeuge & Festbestückungs-Analyse</h3>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '16px' }}>
          <span>Analysierte Werkzeugsätze: <strong>{totalUniqueTools}</strong></span>
          <span>Empfohlene Festbestückungen ($\ge 5$): <strong style={{ color: '#10b981' }}>{standardCandidatesCount}</strong></span>
          <span>Empfohlene Magazin-Entnahmen: <strong style={{ color: '#f59e0b' }}>{removalCandidatesCount}</strong></span>
        </div>
      </div>

      <button
        onClick={onExportCsv}
        style={{
          padding: '8px 14px',
          fontSize: '0.85rem',
          backgroundColor: '#0891b2',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        📥 CSV-Export für Einkauf / Magazin
      </button>
    </div>
  );
}

export default ToolUsageHeader;
