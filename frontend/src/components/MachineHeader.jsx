import React from 'react';

export function MachineHeader({ machineName, scheduledHours, totalCapacityHours, stepCount }) {
  const utilization = totalCapacityHours > 0
    ? Math.min(100, Math.round((scheduledHours / totalCapacityHours) * 100))
    : 0;

  const barColor = utilization > 90 ? '#ef4444' : utilization > 75 ? '#f59e0b' : '#10b981';

  return (
    <div
      className="machine-header"
      style={{
        padding: '12px',
        backgroundColor: 'var(--bg-header, #0f172a)',
        borderRadius: '6px',
        marginBottom: '12px',
        borderBottom: '2px solid var(--border-color, #334155)',
        color: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{machineName}</h4>
        <span style={{ fontSize: '0.75rem', backgroundColor: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
          {stepCount} AGs
        </span>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
        Auslastung: {scheduledHours.toFixed(1)}h / {totalCapacityHours}h ({utilization}%)
      </div>

      <div style={{ width: '100%', height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${utilization}%`,
            height: '100%',
            backgroundColor: barColor,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}

export default MachineHeader;
