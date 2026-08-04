import React from 'react';

export function ToolUsageChart({ records }) {
  if (!records || records.length === 0) return null;

  const topRecords = records.slice(0, 10);
  const maxVal = Math.max(...topRecords.map(r => r.totalUsagesCount), 1);

  return (
    <div
      className="tool-usage-chart"
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        color: '#f8fafc'
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
        📊 Top Werkzeuge (Historische Nutzung vs. Zukünftige Verplanungen)
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {topRecords.map((item, idx) => (
          <div key={idx} style={{ fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.zzIdent} - {item.description}</span>
              <span style={{ color: item.isStandardToolCandidate ? '#34d399' : '#94a3b8' }}>
                Vergangen: {item.pastUsagesCount} | Zukunft: {item.futureUsagesCount} (Gesamt: {item.totalUsagesCount})
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(item.pastUsagesCount / maxVal) * 100}%`, height: '100%', backgroundColor: '#0284c7' }} title="Vergangenheit" />
              <div style={{ width: `${(item.futureUsagesCount / maxVal) * 100}%`, height: '100%', backgroundColor: '#10b981' }} title="Zukunft" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ToolUsageChart;
