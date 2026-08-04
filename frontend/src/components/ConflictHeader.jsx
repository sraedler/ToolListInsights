import React from 'react';

export function ConflictHeader({
  totalBlocked,
  criticalCount,
  warningCount,
  selectedCategory,
  onCategoryChange,
  onForceReevaluate
}) {
  const categories = [
    { id: 'ALL', label: 'Alle Konflikte' },
    { id: 'MISSING_NC', label: '❌ NC-Programm fehlt' },
    { id: 'MISSING_FIXTURE', label: '⚠️ Vorrichtung fehlt' },
    { id: 'MISSING_TOOL', label: '🛑 Werkzeugliste fehlt' },
    { id: 'PREDECESSOR', label: '⏳ Vorgänger offen' }
  ];

  return (
    <div
      className="conflict-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e1e2d',
        borderRadius: '8px',
        borderLeft: '6px solid #ef4444',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0, color: '#f87171' }}>🚨 Konfliktbehandlung (Maschinen blockiert)</h3>
          <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            {totalBlocked} Konflikte ({criticalCount} Kritisch, {warningCount} Warnungen)
          </span>
        </div>

        <button
          onClick={onForceReevaluate}
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            backgroundColor: '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Alle Konflikte neu prüfen
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: selectedCategory === cat.id ? '#ef4444' : '#334155',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: selectedCategory === cat.id ? 'bold' : 'normal'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ConflictHeader;
