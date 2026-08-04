import React from 'react';

export function DetailModal({ job, onClose, onOpenDmsViewer }) {
  if (!job) return null;

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
          width: '540px',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: '#f8fafc',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Auftragsdetails #{job.orderId}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
          <div><strong>Artikel:</strong> {job.articleId}</div>
          <div><strong>Bezeichnung:</strong> {job.articleName}</div>
          <div><strong>Vertragsnummer:</strong> {job.contractNumber || job.orderId}</div>
          <div><strong>Arbeitsgang:</strong> AG {job.AR_STEP} - {job.stepName}</div>
          <div><strong>NC-Programm:</strong> {job.ncProgram || 'Keines'}</div>
          <div><strong>Vorrichtung:</strong> {job.fixture || 'Keine'}</div>
          <div><strong>WinTool Liste:</strong> {job.toolListNr || 'Keine'}</div>
          <div><strong>Geisterschicht:</strong> {job.isNightRunCapable ? 'Ja' : 'Nein'}</div>
        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Zeiten & Belegung</h4>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span>Soll-Rüst: {job.setupTimeMin} Min</span>
            <span>Soll-Lauf: {job.runTimeMin} Min</span>
            <span>Gesamt: {job.totalTimeMin} Min</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {onOpenDmsViewer && (
            <button
              onClick={() => onOpenDmsViewer(job.articleId)}
              style={{ padding: '8px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
            >
              📄 d.velop DMS Zeichnung öffnen
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: '#fff', cursor: 'pointer' }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
