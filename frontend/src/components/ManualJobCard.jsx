import React from 'react';
import { getContractColor } from '../utils/colors';

export function ManualJobCard({ job }) {
  const contractColor = getContractColor(job.contractNumber || job.orderId);
  const isReady = job.readinessStatus === 'PARTS_READY';

  return (
    <div
      className="manual-job-card"
      style={{
        borderLeft: `5px solid ${isReady ? '#10b981' : '#f59e0b'}`,
        backgroundColor: '#1e293b',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '10px',
        color: '#f8fafc',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ backgroundColor: contractColor, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {job.contractNumber || job.orderId}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isReady ? '#34d399' : '#fbbf24' }}>
          {isReady ? '✅ TEILE BEREIT' : '⏳ WARTE AUF CNC'}
        </span>
      </div>

      <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '4px' }}>
        {job.articleName || job.articleId}
      </div>

      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>
        Station: <strong>{job.workstationCode}</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '6px' }}>
        <span>Geschätzte Zeit: {job.estimatedTimeMin} Min</span>
        <span>Auftrag #{job.orderId}</span>
      </div>
    </div>
  );
}

export default ManualJobCard;
