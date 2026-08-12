import React from 'react';

export function GanttCapacityChart({ weeklyData }) {
  if (!weeklyData || weeklyData.length === 0) return null;

  return (
    <div
      className="gantt-capacity-chart"
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        padding: '16px',
        color: '#f8fafc'
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
        📈 Wochenweise Auslastungskurve vs 100% Kapazitätsgrenze
      </h4>

      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        {weeklyData.map((week, idx) => {
          const util = week.utilizationPercent || 0;
          const isOver = util > 100;

          return (
            <div key={idx} style={{ flex: '1 0 70px', minWidth: '70px', textAlign: 'center', fontSize: '0.8rem' }}>
              <div style={{ height: '100px', backgroundColor: '#0f172a', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '4px' }}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80%',
                    left: 0,
                    right: 0,
                    borderTop: '2px dashed #ef4444',
                    zIndex: 2
                  }}
                  title="100% Kapazität"
                />
                <div
                  style={{
                    width: '80%',
                    height: `${Math.min(util, 100)}%`,
                    backgroundColor: isOver ? '#ef4444' : util > 80 ? '#f59e0b' : '#10b981',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
              </div>
              <div style={{ marginTop: '6px', fontWeight: 'bold' }}>KW {week.weekNumber}</div>
              <div style={{ color: isOver ? '#f87171' : '#94a3b8', fontSize: '0.75rem' }}>{util}%</div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default GanttCapacityChart;
