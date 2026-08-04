import React from 'react';

export function TimeEvaluationChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.slice(0, 10).map(item => ({
    name: item.articleName || item.orderId,
    Target: Math.round(item.targetTotalMin / 60 * 10) / 10,
    Actual: Math.round(item.actualTotalMin / 60 * 10) / 10,
    isOverrun: item.isOverrunFlagged
  }));

  const maxVal = Math.max(...chartData.flatMap(d => [d.Target, d.Actual]), 1);

  return (
    <div
      className="time-evaluation-chart"
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        color: '#f8fafc'
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
        📊 Soll vs. Ist Gegenüberstellung (Stunden)
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {chartData.map((item, idx) => (
          <div key={idx} style={{ fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
              <span style={{ color: item.isOverrun ? '#ef4444' : '#10b981' }}>
                Soll: {item.Target}h | Ist: {item.Actual}h
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(item.Target / maxVal) * 100}%`, height: '100%', backgroundColor: '#3b82f6' }} title="Soll" />
              <div style={{ width: `${(item.Actual / maxVal) * 100}%`, height: '100%', backgroundColor: item.isOverrun ? '#ef4444' : '#10b981', opacity: 0.8 }} title="Ist" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimeEvaluationChart;
