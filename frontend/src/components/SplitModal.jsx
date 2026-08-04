import React, { useState } from 'react';

export function SplitModal({ job, onClose, onConfirmSplit }) {
  const [splitQty, setSplitQty] = useState(Math.floor(job.remainingQty / 2) || 1);

  const handleConfirm = () => {
    if (splitQty > 0 && splitQty < job.remainingQty) {
      onConfirmSplit(job, splitQty);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #1e293b)',
          padding: '24px',
          borderRadius: '8px',
          width: '360px',
          color: '#f8fafc',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
      >
        <h3 style={{ margin: '0 0 12px 0' }}>Arbeitsgang teilen (Splitting)</h3>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
          Auftrag #{job.orderId} - {job.articleName}
          <br />
          Aktuelle Restmenge: <strong>{job.remainingQty} Stück</strong>
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
            Abzuspaltene Menge (Los 2):
          </label>
          <input
            type="number"
            min="1"
            max={job.remainingQty - 1}
            value={splitQty}
            onChange={(e) => setSplitQty(parseInt(e.target.value, 10) || 1)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #475569',
              backgroundColor: '#0f172a',
              color: '#ffffff'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: '#fff', cursor: 'pointer' }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
          >
            Teilen bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

export default SplitModal;
