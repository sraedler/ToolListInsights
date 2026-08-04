import React, { useState } from 'react';

export function ToolUsageGrid({ records }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = (records || []).filter(r =>
    (r.zzIdent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="tool-usage-grid"
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        padding: '16px',
        color: '#f8fafc'
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Suche nach Werkzeug-ID oder Bezeichnung..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '6px 12px', width: '280px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Werkzeug-ID (ZzIdent)</th>
            <th style={{ padding: '8px' }}>Bezeichnung</th>
            <th style={{ padding: '8px' }}>Maschine</th>
            <th style={{ padding: '8px' }}>BDE Vergangen</th>
            <th style={{ padding: '8px' }}>Geplant Zukunft</th>
            <th style={{ padding: '8px' }}>Gesamt-Einsätze</th>
            <th style={{ padding: '8px' }}>Empfehlung</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{r.zzIdent}</td>
              <td style={{ padding: '8px' }}>{r.description}</td>
              <td style={{ padding: '8px' }}>{r.machine}</td>
              <td style={{ padding: '8px' }}>{r.pastUsagesCount}</td>
              <td style={{ padding: '8px' }}>{r.futureUsagesCount}</td>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{r.totalUsagesCount}</td>
              <td style={{ padding: '8px' }}>
                {r.isStandardToolCandidate && (
                  <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    ⭐ FESTBESTÜCKUNG
                  </span>
                )}
                {r.isRemovalCandidate && (
                  <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    🧹 ENTNAHME PRÜFEN
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ToolUsageGrid;
