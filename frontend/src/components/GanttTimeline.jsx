import React, { useState } from 'react';
import { getContractColor } from '../utils/colors';

export function GanttTimeline({ rows }) {
  const [hoveredContract, setHoveredContract] = useState(null);

  if (!rows || rows.length === 0) return null;

  return (
    <div
      className="gantt-timeline"
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        color: '#f8fafc'
      }}
    >
      <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
        🗓️ Maschinen-Belegung (Synchrone Vertrags-Hervorhebung)
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '130px', fontWeight: 'bold', fontSize: '0.8rem', color: '#94a3b8' }}>
              {row.machine}
            </div>

            <div style={{ flex: 1, display: 'flex', height: '36px', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden', padding: '4px', gap: '4px' }}>
              {(row.blocks || []).map((block, bIdx) => {
                const contractColor = block.isOverplanned ? '#a855f7' : getContractColor(block.contractNumber);
                const isHovered = hoveredContract && block.contractNumber === hoveredContract;

                return (
                  <div
                    key={bIdx}
                    onMouseEnter={() => setHoveredContract(block.contractNumber)}
                    onMouseLeave={() => setHoveredContract(null)}
                    style={{
                      flex: block.durationDays || 1,
                      backgroundColor: contractColor,
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      color: '#fff',
                      fontWeight: isHovered ? 'bold' : 'normal',
                      transform: isHovered ? 'scale(1.05)' : 'none',
                      boxShadow: isHovered ? '0 0 10px #ffffff' : 'none',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={`${block.orderId} (${block.contractNumber})${block.isOverplanned ? ' - Überplanung' : ''}${block.isNightRun ? ' - Nachtlauf' : ''}`}
                  >
                    <span>#{block.orderId} ({block.contractNumber})</span>
                    {block.isNightRun && <span style={{ fontSize: '0.65rem', backgroundColor: '#0f172a', padding: '1px 3px', borderRadius: '3px' }}>🌙</span>}
                    {block.isOverplanned && <span style={{ fontSize: '0.65rem', backgroundColor: '#581c87', padding: '1px 3px', borderRadius: '3px' }}>⚡</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GanttTimeline;
