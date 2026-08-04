import React, { useState } from 'react';

export function DmsViewerModal({ articleId, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const rotate90 = () => setRotation((prev) => (prev + 90) % 360);
  const zoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const resetView = () => { setZoom(100); setRotation(0); };

  const pdfUrl = `/api/dms/drawing/${encodeURIComponent(articleId)}?mode=proxy`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
        padding: '16px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '10px 16px',
          borderRadius: '8px 8px 0 0',
          color: '#f8fafc'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>d.velop DMS Zeichnungs-Viewer: {articleId}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={zoomIn} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#334155', color: '#fff', cursor: 'pointer' }}>Zoom +</button>
          <button onClick={zoomOut} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#334155', color: '#fff', cursor: 'pointer' }}>Zoom -</button>
          <button onClick={rotate90} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#334155', color: '#fff', cursor: 'pointer' }}>↻ 90° Drehen</button>
          <button onClick={resetView} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#334155', color: '#fff', cursor: 'pointer' }}>Reset</button>
          <button onClick={onClose} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Schließen</button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          backgroundColor: '#1e293b',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <iframe
          src={pdfUrl}
          title={`DMS Drawing ${articleId}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}

export default DmsViewerModal;
