import React from 'react';

export function ToolPresetBoard({ jobs, onStageChange }) {
  const stages = [
    { id: 'PREPARATION_PENDING', title: '1. Vorbereitung ausstehend', color: '#f59e0b' },
    { id: 'IN_ASSEMBLY', title: '2. In Montage & Einmessung', color: '#3b82f6' },
    { id: 'READY_ON_CART', title: '3. Bereit am Rüstwagen', color: '#8b5cf6' },
    { id: 'INSTALLED_IN_MAGAZINE', title: '4. In Maschinenmagazin', color: '#10b981' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {stages.map(stage => {
        const stageJobs = jobs.filter(j => j.setupStatus === stage.id);

        return (
          <div
            key={stage.id}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              padding: '12px',
              borderTop: `4px solid ${stage.color}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc' }}>{stage.title}</h4>
              <span style={{ backgroundColor: '#334155', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                {stageJobs.length}
              </span>
            </div>

            {stageJobs.map((job, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '10px',
                  color: '#f8fafc',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#60a5fa', marginBottom: '4px' }}>
                  Liste: {job.toolListNr}
                </div>
                <div style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                  Maschine: <strong>{job.machine}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '8px' }}>
                  Werkzeuge: {job.toolsToSetupCount} neu / {job.totalToolsCount} gesamt ({job.toolsAlreadyInMagazineCount} im Magazin)
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Est: {job.estimatedSetupDurationMin}m</span>

                  <select
                    value={job.setupStatus}
                    onChange={(e) => onStageChange && onStageChange(job, e.target.value)}
                    style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: '#334155', color: '#fff', border: 'none' }}
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default ToolPresetBoard;
