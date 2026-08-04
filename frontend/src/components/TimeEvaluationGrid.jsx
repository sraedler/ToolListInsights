import React, { useState } from 'react';

export function TimeEvaluationGrid({ records }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyOverruns, setShowOnlyOverruns] = useState(false);

  const filtered = (records || []).filter(r => {
    const matchesSearch = (r.orderId || '').includes(searchTerm) || (r.articleName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOverrun = showOnlyOverruns ? r.isOverrunFlagged : true;
    return matchesSearch && matchesOverrun;
  });

  return (
    <div
      className="time-evaluation-grid"
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        padding: '16px',
        color: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Filter nach Auftrag oder Artikel..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '6px 12px', width: '280px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
        />

        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showOnlyOverruns}
            onChange={(e) => setShowOnlyOverruns(e.target.checked)}
          />
          🚨 Nur Zeitüberschreitungen (&gt;+25%) anzeigen
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Auftrag #</th>
            <th style={{ padding: '8px' }}>Artikel</th>
            <th style={{ padding: '8px' }}>Maschine</th>
            <th style={{ padding: '8px' }}>Soll-Gesamt</th>
            <th style={{ padding: '8px' }}>Ist-Gesamt</th>
            <th style={{ padding: '8px' }}>Abweichung</th>
            <th style={{ padding: '8px' }}>Effizienz</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: '1px solid #334155',
                backgroundColor: r.isOverrunFlagged ? 'rgba(239,68,68,0.15)' : 'transparent'
              }}
            >
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{r.orderId}</td>
              <td style={{ padding: '8px' }}>{r.articleName || r.articleId}</td>
              <td style={{ padding: '8px' }}>{r.machine}</td>
              <td style={{ padding: '8px' }}>{r.targetTotalMin} Min</td>
              <td style={{ padding: '8px', fontWeight: 'bold', color: r.isOverrunFlagged ? '#f87171' : '#fff' }}>{r.actualTotalMin} Min</td>
              <td style={{ padding: '8px', fontWeight: 'bold', color: r.variancePercent > 0 ? '#f87171' : '#34d399' }}>
                {r.variancePercent > 0 ? `+${r.variancePercent}%` : `${r.variancePercent}%`}
              </td>
              <td style={{ padding: '8px', fontWeight: 'bold', color: r.efficiencyPercent < 80 ? '#f87171' : '#34d399' }}>
                {r.efficiencyPercent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimeEvaluationGrid;
