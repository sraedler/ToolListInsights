import React, { useState } from 'react';

export function DataAuditGrid({ auditedSteps, onOpenDmsViewer }) {
  const [expandedStepId, setExpandedStepId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedStepId(expandedStepId === id ? null : id);
  };

  const severityBadge = (severity) => {
    switch (severity) {
      case 'RED':
        return <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>🛑 KRITISCH</span>;
      case 'ORANGE':
        return <span style={{ backgroundColor: '#f97316', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>🟧 FUZZY MATCH</span>;
      case 'YELLOW':
        return <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>⚠️ HINWEIS</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className="data-audit-grid"
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        padding: '16px',
        color: '#f8fafc'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155', textAlign: 'left' }}>
            <th style={{ padding: '8px' }}>Auftrag #</th>
            <th style={{ padding: '8px' }}>Artikel</th>
            <th style={{ padding: '8px' }}>Maschine</th>
            <th style={{ padding: '8px' }}>Gefundene Probleme</th>
            <th style={{ padding: '8px' }}>Score</th>
            <th style={{ padding: '8px' }}>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {(auditedSteps || []).map((step, idx) => {
            const isExpanded = expandedStepId === step.stepId;

            return (
              <React.Fragment key={idx}>
                <tr
                  onClick={() => toggleExpand(step.stepId)}
                  style={{
                    borderBottom: '1px solid #334155',
                    cursor: 'pointer',
                    backgroundColor: step.issues.length > 0 ? 'rgba(245,158,11,0.08)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{step.orderId}</td>
                  <td style={{ padding: '8px' }}>{step.articleName || step.articleId}</td>
                  <td style={{ padding: '8px' }}>{step.machine}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {step.issues.map((iss, iIdx) => (
                        <span key={iIdx}>{severityBadge(iss.severity)}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: step.completenessScorePercent === 100 ? '#10b981' : '#f59e0b' }}>
                    {step.completenessScorePercent}%
                  </td>
                  <td style={{ padding: '8px' }}>
                    {step.hasDmsDrawing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDmsViewer && onOpenDmsViewer(step.articleId);
                        }}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer' }}
                      >
                        📄 DMS Zeichnung
                      </button>
                    )}
                  </td>
                </tr>

                {isExpanded && step.issues.length > 0 && (
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    <td colSpan="6" style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        <strong>Stammdaten-Detailanalyse:</strong>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                          {step.issues.map((iss, iIdx) => (
                            <li key={iIdx} style={{ marginBottom: '4px' }}>
                              <strong style={{ color: iss.severity === 'RED' ? '#f87171' : '#fbbf24' }}>[{iss.code}]</strong>: {iss.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataAuditGrid;
