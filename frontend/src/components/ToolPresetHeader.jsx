import React from 'react';

export function ToolPresetHeader({
  timeSavedMin,
  totalJobsCount,
  toolsToPresetCount,
  onOpenWeeklyModal
}) {
  return (
    <div
      className="tool-preset-header"
      style={{
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        borderLeft: '6px solid #3b82f6',
        marginBottom: '16px',
        color: '#f8fafc',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 6px 0', color: '#60a5fa' }}>🛠️ Werkzeugrüsten & Voreinstellgeräte-Planung</h3>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', gap: '16px' }}>
          <span>Offene Rüstaufträge: <strong>{totalJobsCount}</strong></span>
          <span>Neu aufzubauende Werkzeuge: <strong>{toolsToPresetCount}</strong></span>
          <span>Rüstzeit-Ersparnis (Magazin-Matching): <strong style={{ color: '#10b981' }}>{timeSavedMin} Min</strong></span>
        </div>
      </div>

      <button
        onClick={onOpenWeeklyModal}
        style={{
          padding: '8px 14px',
          fontSize: '0.85rem',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        📦 Wochenbedarfs-Kommissionierung
      </button>
    </div>
  );
}

export default ToolPresetHeader;
