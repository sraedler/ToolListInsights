import React from 'react';

export function GanttHeader({ weeksCount, onWeeksCountChange, adherencePercent }) {
  return (
    <div
      className="gantt-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        borderLeft: '6px solid #ec4899',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 6px 0', color: '#f472b6' }}>📈 Auswertung Planung & Mehrwochen-Gantt</h3>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '16px' }}>
          <span>Planungs-Horizont: <strong>{weeksCount} Wochen</strong></span>
          <span>Termintreue: <strong style={{ color: adherencePercent >= 90 ? '#10b981' : '#f59e0b' }}>{adherencePercent}%</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Horizont (Wochen):</span>
        <input
          type="range"
          min="1"
          max="20"
          value={weeksCount}
          onChange={(e) => onWeeksCountChange && onWeeksCountChange(parseInt(e.target.value, 10))}
          style={{ cursor: 'pointer' }}
        />
        <span style={{ fontWeight: 'bold', minWidth: '30px' }}>{weeksCount}W</span>
      </div>
    </div>
  );
}

export default GanttHeader;
