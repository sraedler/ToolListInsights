import React, { useState } from 'react';

export function ForceReleaseModal({ job, onClose, onConfirmForceRelease }) {
  const [reason, setReason] = useState('');
  const [user, setUser] = useState('');

  const handleConfirm = () => {
    if (reason.trim() && user.trim()) {
      onConfirmForceRelease(job, reason, user);
    }
  };

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
          width: '420px',
          color: '#f8fafc',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', color: '#f87171' }}>⚠️ Manuelle Freigabe erzwingen</h3>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px' }}>
          Auftrag <strong>#{job.orderId}</strong> ({job.articleName}) trotz bestehender Konflikte manuell freigeben? Diese Aktion wird im Audit-Log gespeichert.
        </p>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#94a3b8' }}>Bearbeiter / Planer:</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="z.B. Planer_Müller"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: '#94a3b8' }}>Begründung für Freigabe:</label>
          <textarea
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="z.B. NC-Programm manuell an Maschine 4 eingelesen."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: '#fff', cursor: 'pointer' }}>Abbrechen</button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || !user.trim()}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: (!reason.trim() || !user.trim()) ? '#991b1b' : '#dc2626',
              color: '#fff',
              cursor: (!reason.trim() || !user.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Freigabe speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForceReleaseModal;
