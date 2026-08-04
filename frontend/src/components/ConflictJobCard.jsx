import React from 'react';
import { getContractColor } from '../utils/colors';

export function ConflictJobCard({ job, onOpenForceRelease, onReallocateMachine }) {
  const contractColor = getContractColor(job.contractNumber || job.orderId);
  const isRed = job.kvStatus === 'red';

  return (
    <div
      className="conflict-job-card"
      style={{
        borderLeft: `6px solid ${isRed ? '#ef4444' : '#f59e0b'}`,
        boxShadow: isRed ? '0 0 8px rgba(239,68,68,0.4)' : '0 0 6px rgba(245,158,11,0.3)',
        backgroundColor: '#1e293b',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '12px',
        color: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ backgroundColor: contractColor, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {job.contractNumber || job.orderId}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isRed ? '#f87171' : '#fbbf24' }}>
          {isRed ? '🛑 KRITISCHER KONFLIKT' : '⚠️ WARNUNG'}
        </span>
      </div>

      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>
        {job.articleName || job.articleId} (AG {job.AR_STEP})
      </div>

      {job.conflictReasons && job.conflictReasons.map((reason, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: reason.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            border: `1px solid ${reason.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '0.78rem',
            margin: '6px 0',
            color: reason.severity === 'CRITICAL' ? '#fca5a5' : '#fde047'
          }}
        >
          {reason.message}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
        <select
          onChange={(e) => onReallocateMachine && onReallocateMachine(job, e.target.value)}
          defaultValue=""
          style={{ padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: '#334155', color: '#fff', border: 'none' }}
        >
          <option value="" disabled>Ausweichmaschine...</option>
          <option value="Hermle C400">Hermle C400</option>
          <option value="GROB G550">GROB G550</option>
          <option value="Brother">Brother</option>
        </select>

        <button
          onClick={() => onOpenForceRelease && onOpenForceRelease(job)}
          style={{
            padding: '4px 10px',
            fontSize: '0.75rem',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Manuell freigeben
        </button>
      </div>
    </div>
  );
}

export default ConflictJobCard;
