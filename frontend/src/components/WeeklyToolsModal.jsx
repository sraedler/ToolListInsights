import React from 'react';

export function WeeklyToolsModal({ items, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '24px',
          borderRadius: '8px',
          width: '680px',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: '#f8fafc',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#60a5fa' }}>📦 Wochenbedarfs-Kommissionierungsliste</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>Komponenten-ID</th>
              <th style={{ padding: '8px' }}>Bezeichnung</th>
              <th style={{ padding: '8px' }}>Pick-Menge</th>
              <th style={{ padding: '8px' }}>Verwendet in Listen</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.componentId}</td>
                  <td style={{ padding: '8px' }}>{item.description}</td>
                  <td style={{ padding: '8px', color: '#10b981', fontWeight: 'bold' }}>{item.totalPickQty} Stk</td>
                  <td style={{ padding: '8px', color: '#cbd5e1' }}>{(item.usedInToolLists || []).join(', ')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                  Keine Werkzeugkomponenten für diesen Zeitraum kommissionierbar.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: '#fff', cursor: 'pointer' }}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

export default WeeklyToolsModal;
