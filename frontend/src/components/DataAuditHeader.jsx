import React from 'react';

export function DataAuditHeader({
  totalIncomplete,
  avgScore,
  selectedSeverity,
  onSeverityChange
}) {
  const scoreColor = avgScore >= 90 ? '#10b981' : avgScore >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="data-audit-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        borderLeft: '6px solid #f59e0b',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 6px 0', color: '#fbbf24' }}>📋 Datenvollständigkeit (Stammdaten-Audit)</h3>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '16px' }}>
          <span>Durchschnittl. Datenvollständigkeit: <strong style={{ color: scoreColor }}>{avgScore}%</strong></span>
          <span>Fehlerhafte Arbeitsgänge: <strong style={{ color: totalIncomplete > 0 ? '#ef4444' : '#10b981' }}>{totalIncomplete}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'ALL', label: 'Alle' },
          { id: 'RED', label: '🛑 Kritisch (Rot)' },
          { id: 'ORANGE', label: '🟧 Fuzzy Match (Orange)' },
          { id: 'YELLOW', label: '⚠️ Warnung (Gelb)' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => onSeverityChange && onSeverityChange(cat.id)}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: selectedSeverity === cat.id ? '#f59e0b' : '#334155',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: selectedSeverity === cat.id ? 'bold' : 'normal'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DataAuditHeader;
