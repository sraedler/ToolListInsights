import React from 'react';
import { getContractColor } from '../utils/colors';

export function JobCard({ job, onSelectJob, onDragStart }) {
  const contractColor = getContractColor(job.contractNumber || job.orderId);

  const kvStatusColors = {
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444'
  };

  const statusColor = kvStatusColors[job.kvStatus] || kvStatusColors.green;

  return (
    <div
      className="job-card"
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, job)}
      onClick={() => onSelectJob && onSelectJob(job)}
      style={{
        borderLeft: `5px solid ${statusColor}`,
        padding: '12px',
        marginBottom: '10px',
        borderRadius: '6px',
        backgroundColor: 'var(--bg-card, #1e293b)',
        color: 'var(--text-main, #f8fafc)',
        cursor: 'grab',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span
          style={{
            backgroundColor: contractColor,
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          {job.contractNumber || job.orderId}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          AG {job.AR_STEP}
        </span>
      </div>

      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>
        {job.articleName || job.articleId}
      </div>

      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>
        Auftrag: #{job.orderId} | Menge: {job.remainingQty}/{job.orderQty}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
        <span>Rüst: {job.setupTimeMin}m</span>
        <span>Lauf: {job.runTimeMin}m</span>
        <span>Gesamt: {job.totalTimeMin}m</span>
      </div>

      {job.isNightRunCapable && (
        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🌙 Geisterschicht-Tauglich
        </div>
      )}
    </div>
  );
}

export default JobCard;
