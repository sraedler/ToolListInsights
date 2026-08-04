import React from 'react';

export function TimeEvaluationHeader({
  avgEfficiency,
  totalTargetHours,
  totalActualHours,
  overrunCount,
  onDateRangeChange
}) {
  const efficiencyColor = avgEfficiency >= 90 ? '#10b981' : avgEfficiency >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="time-evaluation-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        borderLeft: '6px solid #8b5cf6',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 6px 0', color: '#a78bfa' }}>⏱️ Zeitauswertung (Soll vs. Ist Maschinenzeiten)</h3>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '16px' }}>
          <span>Effizienz-Index: <strong style={{ color: efficiencyColor }}>{avgEfficiency}%</strong></span>
          <span>Soll-Gesamt: <strong>{totalTargetHours.toFixed(1)} Std</strong></span>
          <span>Ist-Gesamt: <strong>{totalActualHours.toFixed(1)} Std</strong></span>
          <span>Zeit-Überschreitungen (&gt;+25%): <strong style={{ color: overrunCount > 0 ? '#ef4444' : '#10b981' }}>{overrunCount} Aufträge</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onDateRangeChange && onDateRangeChange('7d')} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px', border: 'none', backgroundColor: '#334155', color: '#fff', cursor: 'pointer' }}>7 Tage</button>
        <button onClick={() => onDateRangeChange && onDateRangeChange('30d')} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px', border: 'none', backgroundColor: '#334155', color: '#fff', cursor: 'pointer' }}>30 Tage</button>
      </div>
    </div>
  );
}

export default TimeEvaluationHeader;
