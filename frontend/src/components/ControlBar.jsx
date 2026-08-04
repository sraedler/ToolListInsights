import React from 'react';

export function ControlBar({
  daysCount,
  onDaysCountChange,
  optimize,
  onOptimizeToggle,
  optimizeNightRun,
  onNightRunToggle,
  algo,
  onAlgoChange,
  dbMode,
  onDbModeChange,
  onRecalculate
}) {
  return (
    <div
      className="control-bar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-card, #1e293b)',
        borderRadius: '8px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        color: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Horizont:</span>
        {[5, 7, 10, 14, 21].map(days => (
          <button
            key={days}
            onClick={() => onDaysCountChange(days)}
            style={{
              padding: '4px 10px',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: daysCount === days ? '#3b82f6' : '#334155',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            {days} Tage
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={optimize}
            onChange={(e) => onOptimizeToggle(e.target.checked)}
          />
          Rüstoptimierung
        </label>

        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={optimizeNightRun}
            onChange={(e) => onNightRunToggle(e.target.checked)}
          />
          🌙 Geisterschicht
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Algorithmus:</span>
        <select
          value={algo}
          onChange={(e) => onAlgoChange(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: '1px solid #475569',
            fontSize: '0.8rem'
          }}
        >
          <option value="greedy">Greedy</option>
          <option value="local_search">Local Search</option>
          <option value="simulated_annealing">Simulated Annealing</option>
        </select>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onDbModeChange(dbMode === 'live' ? 'dev' : 'live')}
          style={{
            padding: '4px 10px',
            fontSize: '0.8rem',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: dbMode === 'live' ? '#10b981' : '#f59e0b',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          Modus: {dbMode.toUpperCase()}
        </button>

        <button
          onClick={onRecalculate}
          style={{
            padding: '4px 12px',
            fontSize: '0.8rem',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Plan neu berechnen
        </button>
      </div>
    </div>
  );
}

export default ControlBar;
