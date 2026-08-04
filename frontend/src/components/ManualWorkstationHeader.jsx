import React from 'react';

export function ManualWorkstationHeader({
  totalWorkers,
  totalCapacityHours,
  scheduledHours,
  onWorkerCountChange
}) {
  const utilization = totalCapacityHours > 0
    ? Math.min(100, Math.round((scheduledHours / totalCapacityHours) * 100))
    : 0;

  return (
    <div
      className="manual-workstation-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        borderLeft: '6px solid #10b981',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 6px 0', color: '#34d399' }}>✋ Nacharbeit, Entgraten & Montage-Planung</h3>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '16px' }}>
          <span>Gesamte Mitarbeiter: <strong>{totalWorkers} Personen</strong></span>
          <span>Tages-Kapazität: <strong>{totalCapacityHours.toFixed(1)} Std</strong></span>
          <span>Geplante Nacharbeit: <strong>{scheduledHours.toFixed(1)} Std ({utilization}%)</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Personal-Stärke:</span>
        <input
          type="number"
          min="1"
          max="20"
          value={totalWorkers}
          onChange={(e) => onWorkerCountChange && onWorkerCountChange(parseInt(e.target.value, 10) || 1)}
          style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
        />
      </div>
    </div>
  );
}

export default ManualWorkstationHeader;
