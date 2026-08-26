
// Deterministic color generator for distinct contract/order colors
const getContractColor = (contractNum) => {
  if (!contractNum) return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.5)', text: '#93c5fd', badgeBg: 'rgba(0,0,0,0.4)' };
  let hash = 0;
  const str = String(contractNum).trim();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsla(${hue}, 65%, 28%, 0.45)`,
    border: `hsla(${hue}, 80%, 55%, 0.65)`,
    text: `hsl(${hue}, 90%, 88%)`,
    badgeBg: `hsla(${hue}, 75%, 20%, 0.65)`
  };
};

function getISOWeekNumber(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const kw = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return 'KW ' + String(kw).padStart(2, '0');
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Wrench, 
  CalendarRange,
  Calendar, 
  Sliders, 
  Search, 
  Activity, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X, 
  Info, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  HelpCircle,
  BarChart4,
  Layers,
  ArrowRight,
  RefreshCw,
  Server,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer 
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.protocol === 'https:' ? 'https://localhost:5000/api' : 'http://localhost:5001/api');

function formatMinutes(mins) {
  if (mins < 0 || mins === undefined || mins === null) return '0m';
  const roundedMins = Math.round(mins);
  if (roundedMins < 60) return `${roundedMins}m`;
  const hrs = Math.floor(roundedMins / 60);
  const remainingMins = roundedMins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
}

export default function App() {
  const isDocker = import.meta.env.VITE_API_BASE === '/api' || window.location.port === '2005';

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [systemStatus, setSystemStatus] = useState({
    status: 'loading',
    progress: 'Verbindung zum Analyse-Server wird hergestellt...',
    cachedItems: { toolLists: false, dashboard: false, standardization: false, demand: false, setup: false }
  });
  const [activeTab, setActiveTab] = useState('planning');
  const [summary, setSummary] = useState(null);

  // Helper to format date as YYYY-MM-DD with offset in days from today
  const getOffsetDateStr = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Global Date range filters
  const [globalStartDate, setGlobalStartDate] = useState(getOffsetDateStr(-14));
  const [globalEndDate, setGlobalEndDate] = useState(getOffsetDateStr(42)); // 6 weeks = 42 days
  const [selectedMachine, setSelectedMachine] = useState('All');

  const handleGlobalStartDateChange = (val) => {
    setGlobalStartDate(val);
    if (val && val.length === 10) {
      if (globalEndDate && globalEndDate.length === 10 && globalEndDate < val) {
        setGlobalEndDate(val);
      }
    }
  };

  const handleGlobalEndDateChange = (val) => {
    setGlobalEndDate(val);
    if (val && val.length === 10) {
      if (globalStartDate && globalStartDate.length === 10 && val < globalStartDate) {
        setGlobalStartDate(val);
      }
    }
  };

  // Poll system status on mount
  useEffect(() => {
    let intervalId;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const statusData = await res.json();
        setSystemStatus(statusData);
        
        if (statusData.status === 'ready') {
          clearInterval(intervalId);
        }
      } catch (err) {
        setSystemStatus(prev => ({
          ...prev,
          status: 'loading',
          progress: 'Verbindung zum API-Server unterbrochen. Versuche erneut...'
        }));
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 1500);

    return () => clearInterval(intervalId);
  }, []);

  const fetchSummary = async (start = globalStartDate, end = globalEndDate) => {
    try {
      const res = await fetch(`${API_BASE}/dashboard-summary?startDate=${start}&endDate=${end}`);
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error('Error fetching summary:', e);
    }
  };

  // Re-fetch overview when system is ready or global dates change
  useEffect(() => {
    if (systemStatus.status === 'ready') {
      fetchSummary(globalStartDate, globalEndDate);
    }
  }, [systemStatus.status, globalStartDate, globalEndDate]);

  // 1. Loading / Error Screen
  if (systemStatus.status === 'loading' || systemStatus.status === 'error') {
    const isError = systemStatus.status === 'error';
    const items = systemStatus.cachedItems;
    
    // Calculate progress percentage
    const totalItems = Object.keys(items).length;
    const completedItems = Object.values(items).filter(Boolean).length;
    const percent = Math.round((completedItems / totalItems) * 100);

    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#04060a',
        backgroundImage: 'radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.08) 0px, transparent 60%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f8fafc',
        fontFamily: 'inherit'
      }}>
        <div className="glass-card" style={{
          width: '500px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          border: isError ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-glow)'
        }}>
          {isError ? (
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1.25rem' }} />
          ) : (
            <RefreshCw size={48} className="spinner-icon" style={{ color: '#3b82f6', marginBottom: '1.25rem', animation: 'spin 2s linear infinite' }} />
          )}

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
            {isError ? 'Datenbank-Verbindungsfehler' : 'Lese Fertigungsdaten ein...'}
          </h2>
          <p style={{ color: isError ? '#f87171' : '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', minHeight: '40px', lineHeight: '1.5' }}>
            {systemStatus.progress}
          </p>

          {!isError && (
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', height: '6px', marginBottom: '2rem', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.4s ease' }}></div>
            </div>
          )}

          {/* Loading status items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', borderTop: '1px solid var(--border-dim)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: items.toolLists ? '#fff' : '#64748b' }}>1. WinTool Werkzeugdaten indizieren</span>
              {items.toolLists ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: items.dashboard ? '#fff' : '#64748b' }}>2. ERP-Dashboard-Statistiken laden</span>
              {items.dashboard ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: items.standardization ? '#fff' : '#64748b' }}>3. Werkzeug-Clustering berechnen</span>
              {items.standardization ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: items.demand ? '#fff' : '#64748b' }}>4. Phasenbezogenen Bedarf ausrechnen</span>
              {items.demand ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: items.setup ? '#fff' : '#64748b' }}>5. Rüstzeit-Simulationsdaten cachen</span>
              {items.setup ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>}
            </div>
          </div>

          {isError && (
            <div style={{ marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '1rem', textAlign: 'left' }}>
              <h5 style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.25rem' }}>Fehlerbehebung:</h5>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                Vergewissern Sie sich, dass Ihr lokaler MS SQL Server (MSSQLSERVER) gestartet ist und dass die Verbindungs-Strings in <code>backend/db.js</code> mit Ihren Instanzen übereinstimmen.
              </p>
            </div>
          )}
        </div>
        
        {/* CSS rotation helper */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // 2. Main Dashboard Application (Mounted when system is ready)
  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="sidebar-toggle-btn"
          title={sidebarCollapsed ? "Navigationsleiste ausklappen" : "Navigationsleiste einklappen"}
          style={{
            position: 'absolute',
            top: '24px',
            right: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#cbd5e1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10,
            transition: 'background 0.2s, color 0.2s'
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div>
          <div className="logo-section">
            <Layers className="logo-icon" style={{ color: '#3b82f6', flexShrink: 0 }} />
            {!sidebarCollapsed && <h1>Werkstattplanung</h1>}
          </div>
          
          <nav className="nav-links">
            <div 
              className={`nav-item ${activeTab === 'planning' ? 'active' : ''}`}
              onClick={() => setActiveTab('planning')}
              title={sidebarCollapsed ? "Planung Maschinen" : undefined}
            >
              <Layers size={18} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>Planung Maschinen</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'planning_conflict' ? 'active' : ''}`}
              onClick={() => setActiveTab('planning_conflict')}
              title={sidebarCollapsed ? "Planung Maschinen blockiert" : undefined}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, color: activeTab === 'planning_conflict' ? '#f59e0b' : undefined }} />
              {!sidebarCollapsed && <span>Planung Maschinen blockiert</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'planning_tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('planning_tools')}
              title={sidebarCollapsed ? "Planung Werkzeugrüsten" : undefined}
            >
              <Wrench size={18} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>Planung Werkzeugrüsten</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'planning_deburring' ? 'active' : ''}`}
              onClick={() => setActiveTab('planning_deburring')}
              title={sidebarCollapsed ? "Planung Entgraten/Montieren" : undefined}
            >
              <CalendarRange size={18} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>Planung Entgraten/Montieren</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'time_evaluation' ? 'active' : ''}`}
              onClick={() => setActiveTab('time_evaluation')}
              title={sidebarCollapsed ? "Zeitauswertung" : undefined}
            >
              <BarChart4 size={18} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>Zeitauswertung</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'planning_evaluation' ? 'active' : ''}`}
              onClick={() => setActiveTab('planning_evaluation')}
              title={sidebarCollapsed ? "Auswertung Planung" : undefined}
            >
              <TrendingUp size={18} style={{ flexShrink: 0, color: activeTab === 'planning_evaluation' ? '#3b82f6' : undefined }} />
              {!sidebarCollapsed && <span>Auswertung Planung</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'missing_data' ? 'active' : ''}`}
              onClick={() => setActiveTab('missing_data')}
              title={sidebarCollapsed ? "Datenvollständigkeit" : undefined}
              style={{ 
                borderLeft: !sidebarCollapsed && activeTab === 'missing_data' ? '3px solid #ef4444' : 'none',
                background: activeTab === 'missing_data' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
              }}
            >
              <AlertTriangle size={18} style={{ color: activeTab === 'missing_data' ? '#ef4444' : '#94a3b8', flexShrink: 0 }} />
              {!sidebarCollapsed && <span style={{ color: activeTab === 'missing_data' ? '#ef4444' : '#cbd5e1' }}>Datenvollständigkeit</span>}
            </div>

            <div 
              className={`nav-item ${activeTab === 'most_used_tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('most_used_tools')}
              title={sidebarCollapsed ? "Meistgenutzte Werkzeuge" : undefined}
            >
              <Wrench size={18} style={{ flexShrink: 0, color: activeTab === 'most_used_tools' ? '#38bdf8' : undefined }} />
              {!sidebarCollapsed && <span>Meistgenutzte Werkzeuge</span>}
            </div>
          </nav>
        </div>

        <div className="footer-section" style={{ textAlign: 'center', fontSize: '0.7rem' }}>
          {sidebarCollapsed ? (
            <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>v1.0</p>
          ) : (
            <>
              <p style={{ margin: 0 }}>Version 1.0.0</p>
              <p style={{ margin: '0.2rem 0 0 0' }}>© 2026 Rädler & Reutemann</p>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <h2>
              {activeTab === 'planning' && 'Kanban-Maschinenbelegungsplanung'}
              {activeTab === 'planning_conflict' && 'Planung Maschinen blockiert (KV-Status Gelb & Rot)'}
              {activeTab === 'planning_tools' && 'Werkzeugrüst-Planung'}
              {activeTab === 'planning_deburring' && 'Kanban-Belegungsplanung Entgraten/Montieren'}
              {activeTab === 'time_evaluation' && 'Zeitauswertung: Soll vs. Ist Maschinenzeiten'}
              {activeTab === 'missing_data' && 'Datenvollständigkeit: Fehlende NC / Vorrichtungen'}
              {activeTab === 'most_used_tools' && 'Werkzeuganalyse: Meistgenutzte Werkzeuge (Vergangenheit & Zukunft)'}
            </h2>
          </div>

          {/* Global Date Range Filter (Only shown on historical evaluation tabs) */}
          {['time_evaluation', 'most_used_tools', 'missing_data'].includes(activeTab) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.45rem 1rem', borderRadius: '12px', border: '1px solid var(--border-dim)' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zeitraum:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Von</span>
              <input
                type="date"
                value={globalStartDate}
                onChange={(e) => handleGlobalStartDateChange(e.target.value)}
                style={{
                  background: 'rgba(13, 20, 35, 0.4)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  outline: 'none',
                  height: '28px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Bis</span>
              <input
                type="date"
                value={globalEndDate}
                onChange={(e) => handleGlobalEndDateChange(e.target.value)}
                style={{
                  background: 'rgba(13, 20, 35, 0.4)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  outline: 'none',
                  height: '28px'
                }}
              />
            </div>
          </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-dim)',
                color: '#fff',
                padding: '0.4rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                outline: 'none',
                height: '32px',
                width: '32px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              title={theme === 'dark' ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren'}
            >
              {theme === 'dark' ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} style={{ color: '#3b82f6' }} />}
            </button>

            <div className="system-status">
              <div className="status-dot"></div>
              <span>ERP & WinTool Verbunden</span>
            </div>
          </div>
        </header>

        <div className="content-body">
          {activeTab === 'planning' && <PlanningTab mode="machining" />}
          {activeTab === 'planning_conflict' && <PlanningTab mode="machining" isConflictMode={true} />}
          {activeTab === 'planning_tools' && <PlanningTab mode="tools" />}
          {activeTab === 'planning_deburring' && <PlanningTab mode="deburring" />}
          {activeTab === 'time_evaluation' && (
            <TimeEvaluationTab 
              theme={theme}
              selectedMachine={selectedMachine} 
              setSelectedMachine={setSelectedMachine} 
            />
          )}
          {activeTab === 'planning_evaluation' && (
            <PlanningEvaluationTab 
              theme={theme}
              selectedMachine={selectedMachine} 
              setSelectedMachine={setSelectedMachine} 
            />
          )}
          {activeTab === 'missing_data' && <MissingDataTab />}
          {activeTab === 'most_used_tools' && <MostUsedToolsView />}
        </div>
      </main>
    </div>
  );
}

/* ==========================================
   TABS IMPLEMENTATIONS
   ========================================== */

// 1. Overview Tab
function OverviewTab({ summary, loading, onRefresh }) {
  if (loading) {
    return <div style={{ color: '#64748b' }}>Lade Dashboard-Daten...</div>;
  }

  return (
    <div>
      {/* Visual Metric Cards */}
      <div className="grid-4">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Artikelstamm (ERP)</span>
            <Layers size={16} />
          </div>
          <div className="metric-value">{(summary?.totalArticles ?? 0).toLocaleString()}</div>
          <div className="metric-desc">Aktive ERP-Artikel (AR_ART=0, AR_TYP=1)</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Produktionsaufträge</span>
            <Database size={16} />
          </div>
          <div className="metric-value">{(summary?.totalOrders ?? 0).toLocaleString()}</div>
          <div className="metric-desc">Gesamte Belegpositionen (tbe_Belp)</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Gepflegte Werkzeuglisten</span>
            <Wrench size={16} />
          </div>
          <div className="metric-value">{(summary?.totalToolLists ?? 0).toLocaleString()}</div>
          <div className="metric-desc">Katalogisierte Listen in WinTool</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Werkzeuge (Gesamt)</span>
            <Activity size={16} />
          </div>
          <div className="metric-value">{(summary?.totalTools ?? 0).toLocaleString()}</div>
          <div className="metric-desc">Baugruppen-Werkzeuge in WinTool</div>
        </div>
      </div>

      <div className="grid-main-2">
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Projekt-Übersicht & Funktionalität</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
            Dieses System schlägt eine Brücke zwischen der Fertigungsplanung im ERP-System (D4) und der Werkzeugverwaltung (WinTool). 
            Bei der Planung von Produktionsaufträgen für Artikel sucht die App automatisch nach dem zugeordneten NC-Programm 
            innerhalb des Arbeitsschritt-Bezeichnungstexts und gleicht diesen mittels intelligenter Fuzzy-Logik 
            mit dem WinTool-Werkzeugbestand ab.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong>ERP Explorer:</strong> Detaillierter Drilldown von Artikeln über Fertigungsschritte zu Werkzeugen.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong>Standardisierung:</strong> Gruppierung von Werkzeugen nach Durchmesser und Keyword, um Doubletten aufzudecken.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong>Bedarfsanalyse:</strong> Phasenbezogene Werkzeugbedarfsprognose basierend auf den ERP-Startterminen.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}><strong>Rüstoptimierung:</strong> Simulation von Rüstzeineinsparungen durch Definition eines "Werkzeugstamms".</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Rüstaufwand (Soll)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
              <Clock size={32} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{summary?.totalSetupHours} Std.</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Gesamtrüstzeit in allen Arbeitsgängen</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Wechseln Sie zum Tab <strong>Rüstoptimierung</strong>, um zu simulieren, wie sich dieser Rüstaufwand mit einem standardisierten Werkzeugmagazin reduzieren lässt.
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. ERP Explorer Tab
function ExplorerTab({ startDate, endDate }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilterText, setOrderFilterText] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('all'); // 'all', 'hasDate', 'noDate'
  
  // New contract filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDelayFilter, setOrderDelayFilter] = useState('all');
  const [orderDateStartFilter, setOrderDateStartFilter] = useState(startDate || '');
  const [orderDateEndFilter, setOrderDateEndFilter] = useState(endDate || '');

  // Sync with global date range when it changes
  useEffect(() => {
    setOrderDateStartFilter(startDate || '');
    setOrderDateEndFilter(endDate || '');
  }, [startDate, endDate]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  const [activeToolListNr, setActiveToolListNr] = useState(null);
  const [toolListDetails, setToolListDetails] = useState(null);
  const [loadingToolList, setLoadingToolList] = useState(false);
  const [tableFullscreen, setTableFullscreen] = useState(false);


  useEffect(() => {
    fetchArticles();
  }, [search, page]);

  const fetchArticles = async () => {
    try {
      setLoadingArticles(true);
      const res = await fetch(`${API_BASE}/articles?search=${search}&page=${page}&limit=8`);
      const data = await res.json();
      setArticles(data.data);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingArticles(false);
    }
  };

  const selectArticle = async (art) => {
    setSelectedArticle(art);
    setSelectedOrder(null);
    setSteps([]);
    setOrderFilterText('');
    setOrderDateFilter('all');
    setOrderStatusFilter('all');
    setOrderDelayFilter('all');
    setOrderDateStartFilter('');
    setOrderDateEndFilter('');
    try {
      setLoadingOrders(true);
      const res = await fetch(`${API_BASE}/articles/${art.ID}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const selectOrder = async (ord) => {
    setSelectedOrder(ord);
    try {
      setLoadingSteps(true);
      const res = await fetch(`${API_BASE}/orders/${ord.OrderId}/steps`);
      const data = await res.json();
      setSteps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSteps(false);
    }
  };

  const viewToolList = async (nr) => {
    setActiveToolListNr(nr);
    try {
      setLoadingToolList(true);
      const res = await fetch(`${API_BASE}/tool-lists/${nr}`);
      const data = await res.json();
      setToolListDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingToolList(false);
    }
  };

  // Filter orders in memory based on user inputs
  const filteredOrders = orders.filter(ord => {
    // Restrict list to only Partnerbelege starting with P20 or 62
    const contract = ord.ContractNumber || '';
    const contractUpper = contract.toUpperCase();
    const isPartnerbeleg = contractUpper.startsWith('P20') || contractUpper.startsWith('62');
    if (!isPartnerbeleg) return false;

    const matchesSearch = 
      ord.OrderId.toString().toLowerCase().includes(orderFilterText.toLowerCase()) ||
      (ord.Description || '').toLowerCase().includes(orderFilterText.toLowerCase()) ||
      (ord.ContractNumber || '').toLowerCase().includes(orderFilterText.toLowerCase()) ||
      (ord.CustomerName || '').toLowerCase().includes(orderFilterText.toLowerCase()) ||
      (ord.DeliveryDate && new Date(ord.DeliveryDate).toLocaleDateString().includes(orderFilterText));

    const matchesDateFilter = 
      orderDateFilter === 'all' ? true :
      orderDateFilter === 'hasDate' ? ord.DeliveryDate !== null :
      orderDateFilter === 'noDate' ? ord.DeliveryDate === null : true;

    let matchesStatus = true;
    if (orderStatusFilter === 'open') {
      matchesStatus = ord.Status === 0;
    } else if (orderStatusFilter === 'closed') {
      matchesStatus = ord.Status !== 0;
    }

    let matchesDelay = true;
    if (ord.DeliveryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const delivery = new Date(ord.DeliveryDate);
      delivery.setHours(0, 0, 0, 0);
      const diffTime = delivery - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (orderDelayFilter === 'overdue') {
        matchesDelay = diffDays < 0 && ord.Status !== 1;
      } else if (orderDelayFilter === 'today') {
        matchesDelay = diffDays === 0 && ord.Status !== 1;
      } else if (orderDelayFilter === 'soon') {
        matchesDelay = diffDays >= 0 && diffDays <= 7 && ord.Status !== 1;
      } else if (orderDelayFilter === 'ontime') {
        matchesDelay = diffDays > 7 || ord.Status === 1;
      }
    } else {
      if (orderDelayFilter !== 'all') {
        matchesDelay = false;
      }
    }

    let matchesRange = true;
    if (ord.DeliveryDate) {
      const deliveryDateObj = new Date(ord.DeliveryDate);
      if (orderDateStartFilter) {
        const startLimit = new Date(orderDateStartFilter);
        startLimit.setHours(0, 0, 0, 0);
        if (deliveryDateObj < startLimit) matchesRange = false;
      }
      if (orderDateEndFilter) {
        const endLimit = new Date(orderDateEndFilter);
        endLimit.setHours(23, 59, 59, 999);
        if (deliveryDateObj > endLimit) matchesRange = false;
      }
    } else {
      if (orderDateStartFilter || orderDateEndFilter) {
        matchesRange = false;
      }
    }

    return matchesSearch && matchesDateFilter && matchesStatus && matchesDelay && matchesRange;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      
      {/* Top Part: Articles and Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', flex: '1 1 55%', minHeight: 0 }}>
        
        {/* Column 1: Articles list (320px) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>ERP-Artikel</h3>
          
          <div className="search-input-wrapper" style={{ marginBottom: '1rem' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Artikel-Nr. / Name..." 
              className="search-input" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="smooth-scroll" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {loadingArticles ? (
              <div style={{ padding: '1rem', color: '#64748b' }}>Lade Artikel...</div>
            ) : articles.length === 0 ? (
              <div style={{ padding: '1rem', color: '#64748b' }}>Keine Artikel gefunden.</div>
            ) : (
              articles.map(art => (
                <div 
                  key={art.ID}
                  onClick={() => selectArticle(art)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: selectedArticle?.ID === art.ID ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                    border: selectedArticle?.ID === art.ID ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{art.ArticleNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {art.Description || 'Keine Beschreibung'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pagination" style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
            <button 
              className="btn-secondary" 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: '0.35rem 0.75rem' }}
            >
              Zurück
            </button>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{page} / {totalPages}</span>
            <button 
              className="btn-secondary" 
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              style={{ padding: '0.35rem 0.75rem' }}
            >
              Weiter
            </button>
          </div>
        </div>

        {/* Column 2: Production Orders / Contracts */}
        <div 
          className="glass-card" 
          style={tableFullscreen ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#090d16',
            zIndex: 9999,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            borderRadius: 0
          } : {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontWeight: 600 }}>Produktionsaufträge</h3>
            {selectedArticle && (
              <button
                className="btn-secondary"
                onClick={() => setTableFullscreen(!tableFullscreen)}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.35rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title={tableFullscreen ? "Vollbild beenden" : "Tabelle maximieren"}
              >
                {tableFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{tableFullscreen ? 'Normalbild' : 'Vollbild'}</span>
              </button>
            )}
          </div>
          {selectedArticle ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Artikel: <strong style={{ color: '#3b82f6' }}>{selectedArticle.ArticleNumber}</strong>
              </span>

              {/* Filter Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem' }}>
                  <div className="search-input-wrapper">
                    <Search className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Suchen..." 
                      className="search-input" 
                      value={orderFilterText}
                      onChange={(e) => setOrderFilterText(e.target.value)}
                      style={{ padding: '0.45rem 1rem 0.45rem 2.25rem', fontSize: '0.8rem', height: '36px' }}
                    />
                  </div>
                  
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{
                      background: 'rgba(13, 20, 35, 0.4)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      padding: '0 0.5rem',
                      outline: 'none',
                      cursor: 'pointer',
                      height: '36px'
                    }}
                  >
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="all">Alle Status</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="open">Offen</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="closed">Erledigt</option>
                  </select>

                  <select
                    value={orderDelayFilter}
                    onChange={(e) => setOrderDelayFilter(e.target.value)}
                    style={{
                      background: 'rgba(13, 20, 35, 0.4)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      padding: '0 0.5rem',
                      outline: 'none',
                      cursor: 'pointer',
                      height: '36px'
                    }}
                  >
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="all">Alle Lieferfristen</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="overdue">⚠️ Überfällig</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="today">📅 Heute fällig</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="soon">⏳ In Kürze (&lt;= 7 Tage)</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="ontime">✅ Rechtzeitig</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '0.5rem' }}>
                  <select
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                    style={{
                      background: 'rgba(13, 20, 35, 0.4)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      padding: '0 0.5rem',
                      outline: 'none',
                      cursor: 'pointer',
                      height: '36px'
                    }}
                  >
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="all">Alle Termine</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="hasDate">Termin gesetzt</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value="noDate">Ohne Termin</option>
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>Von:</span>
                    <input
                      type="date"
                      value={orderDateStartFilter}
                      onChange={(e) => setOrderDateStartFilter(e.target.value)}
                      style={{
                        background: 'rgba(13, 20, 35, 0.4)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        padding: '0 0.5rem',
                        outline: 'none',
                        height: '36px',
                        flexGrow: 1
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>Bis:</span>
                    <input
                      type="date"
                      value={orderDateEndFilter}
                      onChange={(e) => setOrderDateEndFilter(e.target.value)}
                      style={{
                        background: 'rgba(13, 20, 35, 0.4)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        padding: '0 0.5rem',
                        outline: 'none',
                        height: '36px',
                        flexGrow: 1
                      }}
                    />
                  </div>
                </div>
              </div>

              {loadingOrders ? (
                <div style={{ color: '#64748b', padding: '1rem' }}>Lade Aufträge...</div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ color: '#64748b', padding: '1rem' }}>Keine Aufträge gefunden.</div>
              ) : (
                <div className="table-wrapper smooth-scroll" style={{ flexGrow: 1 }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Auftrag / Vertrag</th>
                        <th>Kunde</th>
                        <th>Beschreibung</th>
                        <th>Status & Liefertermin</th>
                        <th>Rüstbedarf (Sim)</th>
                        <th>Magazinbel. (Sim)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(ord => {
                        let tendenzBadge = null;
                        let statusBadge = null;

                        if (ord.Status === 0) {
                          statusBadge = <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>Offen</span>;
                        } else {
                          statusBadge = <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>Erledigt</span>;
                        }

                        if (ord.DeliveryDate) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const delivery = new Date(ord.DeliveryDate);
                          delivery.setHours(0, 0, 0, 0);
                          const diffTime = delivery - today;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          if (ord.Status === 1) {
                            tendenzBadge = <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', marginLeft: '0.25rem' }}>Geliefert</span>;
                          } else if (diffDays < 0) {
                            tendenzBadge = <span className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', marginLeft: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{Math.abs(diffDays)} Tage überfällig</span>;
                          } else if (diffDays === 0) {
                            tendenzBadge = <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', marginLeft: '0.25rem' }}>Heute fällig</span>;
                          } else if (diffDays <= 7) {
                            tendenzBadge = <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', marginLeft: '0.25rem' }}>In {diffDays} Tagen</span>;
                          } else {
                            tendenzBadge = <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', marginLeft: '0.25rem' }}>In {diffDays} Tagen</span>;
                          }
                        }

                        return (
                          <tr 
                            key={ord.OrderId}
                            onClick={() => selectOrder(ord)}
                            style={{
                              background: selectedOrder?.OrderId === ord.OrderId ? 'rgba(59, 130, 246, 0.05)' : '',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ fontWeight: 600 }}>
                              <div>{ord.OrderId}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>Vertrag: {ord.ContractNumber || 'N/A'}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                              <div style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.CustomerName}>
                                {ord.CustomerName || 'N/A'}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              <span style={{ display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ord.Description ? ord.Description.replace(/\r?\n/g, ' ') : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  {statusBadge}
                                  {ord.DeliveryDate ? (
                                    <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>
                                      {new Date(ord.DeliveryDate).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>Kein Termin</span>
                                  )}
                                </div>
                                {tendenzBadge}
                              </div>
                            </td>
                            <td>
                              {ord.SimMissesCount !== undefined ? (
                                <span className={`badge ${ord.SimMissesCount > 0 ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '0.75rem' }}>
                                  {ord.SimMissesCount} Tools
                                </span>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>-</span>
                              )}
                            </td>
                            <td>
                              {ord.SimOccupiedSlots !== undefined ? (
                                <span className={`badge ${ord.SimOccupiedSlots > (ord.SimMagazineSize || 999) ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: '0.75rem' }}>
                                  {ord.SimOccupiedSlots} / {ord.SimMagazineSize || '-'}
                                </span>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>-</span>
                              )}
                            </td>
                            <td>
                              <ChevronRight size={14} style={{ color: selectedOrder?.OrderId === ord.OrderId ? '#3b82f6' : '#475569' }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', textAlign: 'center', padding: '2rem' }}>
              <Layers size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>Wählen Sie einen Artikel aus</p>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Part: Arbeitsschritte / Arbeitsplan */}
      <div className="glass-card" style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Arbeitsplan (Schritte)</h3>
        {selectedOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              Auftrag: <strong style={{ color: '#8b5cf6' }}>{selectedOrder.OrderId}</strong>
            </span>

            {loadingSteps ? (
              <div style={{ color: '#64748b', padding: '1rem' }}>Lade Arbeitsplan...</div>
            ) : steps.length === 0 ? (
              <div style={{ color: '#64748b', padding: '1rem' }}>Keine Arbeitsschritte gelistet.</div>
            ) : (
              <div className="smooth-scroll" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {steps.map(step => (
                  <div 
                    key={step.StepId} 
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '10px',
                      display: 'grid',
                      gridTemplateColumns: '80px 1.2fr 2fr 1.2fr 1fr',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: step.IsFinished ? '#10b981' : '#64748b', fontWeight: 600 }}>Pos {step.StepPos}</span>
                        {step.IsFinished && <CheckCircle2 size={12} style={{ color: '#10b981' }} />}
                      </div>
                      {step.StepTyp !== 0 ? (
                        <span className="badge badge-amber" style={{ fontSize: '0.6rem', alignSelf: 'flex-start' }}>{step.StepTypName}</span>
                      ) : step.IsFinished ? (
                        <span className="badge badge-green" style={{ fontSize: '0.6rem', alignSelf: 'flex-start' }}>Erledigt</span>
                      ) : (
                        <span className="badge badge-blue" style={{ fontSize: '0.6rem', alignSelf: 'flex-start' }}>Arbeitsgang</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={step.StepDesc}>
                        {step.StepDesc.split(/\r?\n/)[0]}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.StepDesc.split(/\r?\n/).slice(1).join(' ') || 'Keine Zusatzbeschreibung'}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(13,20,35,0.2)', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                      {step.StepTyp === 0 ? (
                        step.parsedPrograms.length > 0 ? (
                          step.toolListMatches.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                NC: <span style={{ color: '#fff', fontWeight: 600 }}>{m.programName}</span>
                              </span>
                              {m.matches.length > 0 ? (
                                m.matches.map(wt => (
                                  <button
                                    key={wt.Nr}
                                    onClick={() => viewToolList(wt.Nr)}
                                    className="badge badge-blue"
                                    style={{
                                      cursor: 'pointer', fontSize: '0.65rem',
                                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(59, 130, 246, 0.3)'
                                    }}
                                  >
                                    <span>WT: {wt.Ident} ({Math.round(wt.score * 100)}%)</span>
                                    <Info size={10} />
                                  </button>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <AlertCircle size={10} /> Keine WinTool-Liste
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Kein NC-Programm hinterlegt</span>
                        )
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>Keine Werkzeugzuordnung (Nicht-NC-Schritt)</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                      {step.SimMissesCount !== undefined ? (
                        <>
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`badge ${
                              step.SimStatusColor === 'Green' ? 'badge-green' :
                              step.SimStatusColor === 'Yellow' ? 'badge-orange' : 'badge-red'
                            }`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>
                              {step.SimStatusColor === 'Green' && 'Bereit'}
                              {step.SimStatusColor === 'Yellow' && 'Vorbereitung'}
                              {step.SimStatusColor === 'Red' && 'Gesperrt'}
                            </span>
                            <span className={`badge ${step.SimMissesCount > 0 ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>
                              {step.SimMissesCount} Wechsel
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Magazinbel.: <strong style={{ color: step.SimIsFeasible ? '#cbd5e1' : '#ef4444', fontWeight: step.SimIsFeasible ? 500 : 700 }}>{step.SimOccupiedSlots} / {step.SimMagazineSize}</strong>{!step.SimIsFeasible && <span style={{ marginLeft: '0.2rem', fontSize: '0.85rem' }} title="Magazin-Kapazität überschritten">⚠️</span>}
                          </div>
                          {step.SimMisses && step.SimMisses.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Rüstbedarf:</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {step.SimMisses.map((mTool, idx) => (
                                  <span 
                                    key={idx} 
                                    className="badge badge-amber" 
                                    style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', textTransform: 'none', whiteSpace: 'nowrap' }}
                                    title={mTool.desc}
                                  >
                                    ID {mTool.nr}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>Keine Sim</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', fontSize: '0.8rem', paddingRight: '0.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Rüstzeit</div>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{step.SetupTime ? `${step.SetupTime} min` : '-'}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Produktion</div>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{step.ProdTime ? `${step.ProdTime} min` : '-'}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Menge</div>
                        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{step.TargetQty} Stk</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', textAlign: 'center', padding: '2rem' }}>
            <Database size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem' }}>Wählen Sie einen Produktionsauftrag aus, um den Arbeitsplan anzuzeigen</p>
          </div>
        )}
      </div>

      {/* WinTool list side-panel */}
      {activeToolListNr && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end', zIndex: 100
        }}>
          <div 
            className="details-panel"
            style={{
              width: '600px', height: '100vh', background: '#0a0f1d',
              borderLeft: '1px solid var(--border-dim)', padding: '2rem',
              display: 'flex', flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 600 }}>WinTool Werkzeugliste</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {loadingToolList ? 'Lade Liste...' : toolListDetails?.header.Ident}
                </h3>
              </div>
              <button 
                onClick={() => { setActiveToolListNr(null); setToolListDetails(null); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {loadingToolList ? (
              <div>Lade Details aus WinTool...</div>
            ) : toolListDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="grid-3" style={{ margin: 0, gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>NC-Programm</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{toolListDetails.header.NCP || '-'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Maschine</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>M-{toolListDetails.header.MachineNr || '-'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Geändert am</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                      {toolListDetails.header.MDate ? new Date(toolListDetails.header.MDate).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Beschreibung</div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', color: '#cbd5e1' }}>{toolListDetails.header.Descript || 'Keine Beschreibung vorhanden'}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: '#94a3b8' }}>Gelistete Werkzeuge ({toolListDetails.items.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {toolListDetails.items.map(item => (
                      <div 
                        key={item.Pos}
                        style={{
                          background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-dim)',
                          borderRadius: '12px', padding: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>T-{item.T} (Pos {item.Pos})</span>
                          <span className="badge badge-blue">Menge: {item.ToolQuantity || 1}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{item.ToolDesc || 'Unbenanntes Werkzeug'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Typ: {item.ToolKeyWord || 'N/A'} | Ø {item.ToolDia || 0}mm | Länge {item.ToolCutLength || 0}mm
                        </div>

                        {item.parts.length > 0 && (
                          <div style={{ marginTop: '0.75rem', borderTop: '1px dashed var(--border-dim)', paddingTop: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Komponenten</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {item.parts.map(part => (
                                <div key={part.PartPos} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                  <span>{part.PartDesc} <span style={{ color: '#475569' }}>({part.PartKeyWord})</span></span>
                                  <span style={{ color: '#94a3b8' }}>x{part.PartQty}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Standardization Tab
function StandardizationTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => {
    fetchStandardization();
  }, []);

  const fetchStandardization = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/standardization`);
      const rData = await res.json();
      setData(rData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#64748b' }}>Lade Standardisierungsanalyse...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <h3 style={{ fontWeight: 600 }}>Werkzeug-Gruppierung</h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Gefundene Gruppen von Werkzeugen mit identischem Keyword und Durchmesser, aber unterschiedlichen Werkzeug-IDs. Dies sind ideale Kandidaten zur Zusammenlegung!
        </p>

        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data?.groups.map((g, idx) => (
            <div 
              key={idx}
              onClick={() => setExpandedGroup(g)}
              style={{
                padding: '1rem', borderRadius: '12px',
                background: expandedGroup?.keyword === g.keyword && expandedGroup?.diameter === g.diameter ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.015)',
                border: expandedGroup?.keyword === g.keyword && expandedGroup?.diameter === g.diameter ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-dim)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{g.keyword} Ø {g.diameter} mm</h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {g.uniqueToolsCount} Varianten | In {g.totalUsage} Rüstlisten verwendet
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className="badge badge-green">Einsparungspotential</span>
                <ChevronRight size={16} style={{ color: '#475569' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '100%', overflowY: 'auto' }}>
        {expandedGroup ? (
          <div className="glass-card" style={{ minHeight: '100%' }}>
            <span style={{ fontSize: '0.7rem', color: '#8b5cf6', textTransform: 'uppercase', fontWeight: 600 }}>Cluster-Details</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{expandedGroup.keyword} Ø {expandedGroup.diameter} mm</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Dieses Cluster enthält <strong>{expandedGroup.uniqueToolsCount}</strong> verschiedene Werkzeuge. 
              Durch Überprüfung der Nutzlängen und Geometrien können Sie eventuell Typen einsparen.
            </p>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#94a3b8' }}>Werkzeuge im Cluster</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expandedGroup.items.map(tool => (
                <div 
                  key={tool.ToolNr} 
                  style={{
                    padding: '1rem', background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-dim)', borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{tool.ToolDesc}</span>
                    <span className="badge badge-blue">ID: {tool.ToolNr}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Nutzlänge: {tool.ToolCutLength} mm | Verwendung in {tool.ListCount} Rüstlisten
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', height: '100%', color: '#475569' }}>
            <Wrench size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 500, fontSize: '1.05rem', color: '#64748b' }}>Wählen Sie links ein Cluster aus</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Demand Timeline Tab (Machine Magazine Simulation & Future Projections)
function DemandTab({ startDate, endDate }) {
  const [machines, setMachines] = useState([]);
  const [selectedMachineName, setSelectedMachineName] = useState('');
  const [loadingMachines, setLoadingMachines] = useState(true);
  const getDefaultTargetDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 90);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [targetDate, setTargetDate] = useState(getDefaultTargetDate()); // default simulation stop point (90 days from today)
  
  const [simData, setSimData] = useState(null);
  const [currentTools, setCurrentTools] = useState([]);
  const [loadingSim, setLoadingSim] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rightTab, setRightTab] = useState('magazine'); // 'magazine', 'setup', or 'config'
  const [magComparisonTab, setMagComparisonTab] = useState('future'); // 'current' or 'future'
  const [modalTab, setModalTab] = useState('setup'); // 'setup' or 'magazine' inside order details modal
  const [optimize, setOptimize] = useState(false); // setup sequencing optimization toggle
  
  const [expandedPartNrs, setExpandedPartNrs] = useState(new Set());
  const [filterKw, setFilterKw] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Green', 'Yellow', 'Red'

  // Scenario editor states
  const [machinePrograms, setMachinePrograms] = useState([]);
  const [unloadedProgramIds, setUnloadedProgramIds] = useState([]);
  const [preloadedProgramNames, setPreloadedProgramNames] = useState([]);

  // Fetch machines catalog
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoadingMachines(true);
        const res = await fetch(`${API_BASE}/inventory/machines`);
        const mData = await res.json();
        setMachines(mData);
        if (mData.length > 0) {
          // Default to C400 or first machine
          const defaultMach = mData.find(m => m.Name === 'C400') || mData[0];
          setSelectedMachineName(defaultMach.Name);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMachines(false);
      }
    };
    fetchMachines();
  }, []);

  // Fetch loaded programs in Toollist-DB for selected machine
  useEffect(() => {
    if (!selectedMachineName) return;
    const fetchPrograms = async () => {
      try {
        const res = await fetch(`${API_BASE}/inventory/machine/${selectedMachineName}/programs`);
        const data = await res.json();
        setMachinePrograms(data);
        setUnloadedProgramIds([]); // reset selection
        setPreloadedProgramNames([]); // reset selection
      } catch (e) {
        console.error(e);
      }
    };
    fetchPrograms();
  }, [selectedMachineName]);

  // Fetch simulation data and current tools when parameters change
  useEffect(() => {
    if (!selectedMachineName) return;
    const fetchSimAndTools = async () => {
      try {
        setLoadingSim(true);
        
        const unloadParam = unloadedProgramIds.join(',');
        const loadParam = preloadedProgramNames.join(',');
        
        // 1. Fetch simulation
        const simRes = await fetch(`${API_BASE}/inventory/machine/${selectedMachineName}/simulation?targetDate=${targetDate}&optimize=${optimize}&unloadPrograms=${unloadParam}&loadPrograms=${loadParam}&startDate=${startDate}`);
        const sData = await simRes.json();
        setSimData(sData);
        
        // 2. Fetch current tools
        const toolsRes = await fetch(`${API_BASE}/inventory/machine/${selectedMachineName}/current-tools`);
        const tData = await toolsRes.json();
        setCurrentTools(tData);
        
        setSelectedOrder(null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSim(false);
      }
    };
    fetchSimAndTools();
  }, [selectedMachineName, targetDate, optimize, unloadedProgramIds, preloadedProgramNames, startDate]);

  if (loadingMachines || !selectedMachineName) {
    return <div style={{ color: '#64748b', padding: '2rem' }}>Lade Maschinenbestand...</div>;
  }

  // Filter simulation parts strictly by componentFilter
  const filteredSetupParts = simData?.setupParts.filter(p => {
    if (!filterKw) return true;
    const search = filterKw.toLowerCase();
    return (
      (p.desc || '').toLowerCase().includes(search) ||
      (p.partNr || '').toLowerCase().includes(search) ||
      (p.keyword || '').toLowerCase().includes(search)
    );
  }) || [];

  const filteredTimeline = simData?.simulatedTimeline.filter(step => {
    if (statusFilter !== 'All' && step.statusColor !== statusFilter) return false;
    if (startDate && step.date < startDate) return false;
    if (endDate && step.date > endDate) return false;
    return true;
  }) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
      {/* Simulation Toolbar */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1.1fr 1.1fr', gap: '1.2fr', alignItems: 'center', padding: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Magazin- & Rüstsimulation</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Magazin-Bedarfsprognose</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
            Ausgehend vom Ist-Bestand der Maschine simuliert das System den zukünftigen Rüst- und Magazinbelegungsstand.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Maschine auswählen:</span>
          <select
            value={selectedMachineName}
            onChange={(e) => setSelectedMachineName(e.target.value)}
            style={{
              background: 'rgba(13, 20, 35, 0.6)',
              border: '1px solid var(--border-glow)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              padding: '0.45rem 0.75rem',
              outline: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {machines.map(m => (
              <option style={{ background: '#0f172a', color: '#f8fafc' }} key={m.Id} value={m.Name}>
                {m.Name} (Magazin: {m.MagazineSize} Plätze)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Simulationsdatum (bis in die Zukunft):</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-dim)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              padding: '0.4rem 0.75rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Abarbeitungs-Reihenfolge:</span>
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '10px', height: '100%', alignItems: 'center' }}>
            <button
              onClick={() => setOptimize(false)}
              style={{
                flexGrow: 1,
                background: !optimize ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: 'none',
                color: !optimize ? '#3b82f6' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.45rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Chronologisch
            </button>
            <button
              onClick={() => setOptimize(true)}
              style={{
                flexGrow: 1,
                background: optimize ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                color: optimize ? '#10b981' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.45rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Rüstoptimiert
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>Feasibility Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'rgba(13, 20, 35, 0.6)',
              border: '1px solid var(--border-glow)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              padding: '0.45rem 0.75rem',
              outline: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="All">Alle Arbeitsschritte</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="Green">Bereit (Grün)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="Yellow">In Vorbereitung (Gelb)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="Red">Gesperrt (Rot)</option>
          </select>
        </div>
      </div>

      {loadingSim && !simData ? (
        <div style={{ color: '#64748b', padding: '2rem' }}>Berechne Magazinsimulation...</div>
      ) : (
        <div className="grid-main-2" style={{ alignItems: 'start' }}>
          {/* Left Column: Timeline and Scheduled Orders */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            <div style={{ borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: optimize ? '#10b981' : '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>
                  {optimize ? 'Optimierter Ablauf (Vorschlag)' : 'Chronologischer Ablauf'}
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {optimize ? 'Rüstoptimierte Reihenfolge' : 'Geplante Produktionsaufträge'}
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                  {filteredTimeline.filter(s => !s.isPastTarget).length} Aufträge
                </span>
                <span className="badge badge-orange" style={{ fontSize: '0.7rem' }} title="Gesamtanzahl der Werkzeug-Rüstwechsel über den gesamten Zeitraum">
                  {filteredTimeline.reduce((sum, s) => sum + s.missesCount, 0)} Wechsel
                </span>
              </div>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.35rem' }}>
              {filteredTimeline.map((step, idx) => {
                const isSelected = selectedOrder?.stepId === step.stepId;
                
                // Color based on feasibility status color (Green/Yellow/Red)
                let borderLeftColor = '#10b981'; // Green (default)
                if (step.statusColor === 'Yellow') {
                  borderLeftColor = '#f59e0b'; // Yellow (Orange color)
                } else if (step.statusColor === 'Red') {
                  borderLeftColor = '#ef4444'; // Red
                }
                if (step.isPastTarget) {
                  borderLeftColor = 'rgba(100, 116, 139, 0.4)'; // Dim/Grey (after target date)
                }

                // Color badge based on rüst misses
                let badgeClass = 'badge-green';
                if (step.missesCount > 0) {
                  badgeClass = 'badge-orange';
                }
                if (!step.isFeasible) {
                  badgeClass = 'badge-red';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedOrder(step)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                      borderTop: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-dim)',
                      borderRight: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-dim)',
                      borderBottom: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-dim)',
                      borderLeft: `4px solid ${borderLeftColor}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      opacity: step.isPastTarget ? 0.5 : 1,
                      transition: 'border-color 0.2s, background 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        <span style={{ color: optimize ? '#10b981' : '#3b82f6', marginRight: '0.4rem', fontWeight: 700 }}>
                          #{idx + 1}
                        </span>
                        {step.date ? new Date(step.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Kein Datum'}
                        {step.isPastTarget && <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>(Nach Zieldatum)</span>}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {step.programName && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isPreloaded = preloadedProgramNames.includes(step.programName);
                              if (isPreloaded) {
                                setPreloadedProgramNames(prev => prev.filter(p => p !== step.programName));
                              } else {
                                setPreloadedProgramNames(prev => [...prev, step.programName]);
                              }
                            }}
                            style={{
                              background: preloadedProgramNames.includes(step.programName) ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${preloadedProgramNames.includes(step.programName) ? '#3b82f6' : 'var(--border-dim)'}`,
                              borderRadius: '6px',
                              color: preloadedProgramNames.includes(step.programName) ? '#60a5fa' : '#94a3b8',
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.5rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              outline: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              height: '22px'
                            }}
                          >
                            {preloadedProgramNames.includes(step.programName) ? '✓ Vorab geladen' : '+ Vorab laden'}
                          </button>
                        )}
                        <span className={`badge ${
                          step.statusColor === 'Green' ? 'badge-green' :
                          step.statusColor === 'Yellow' ? 'badge-orange' : 'badge-red'
                        }`} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {step.statusColor === 'Green' && <><CheckCircle2 size={10} /> Bereit</>}
                          {step.statusColor === 'Yellow' && <><AlertTriangle size={10} /> In Vorbereitung</>}
                          {step.statusColor === 'Red' && <><XCircle size={10} /> Gesperrt</>}
                        </span>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem' }}>
                          {step.missesCount} Rüsttools
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {step.desc}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                        {step.toolsCount} Tools ges.
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748b' }}>
                      <span>
                        Auftrag: <strong style={{ color: '#cbd5e1' }}>{step.contractNumber}</strong> (Pos. {step.orderPos || 'N/A'} / AS: {step.stepPos})
                        <span style={{ margin: '0 0.4rem', opacity: 0.3 }}>|</span>
                        KV Status: <strong style={{ color: '#cbd5e1' }}>{step.spko === 2 ? '2 (In Arbeit)' : step.spko === 1 ? '1 (Offen)' : step.spko}</strong>
                        <span style={{ margin: '0 0.4rem', opacity: 0.3 }}>|</span>
                        Prog: <strong>{step.programName || 'N/A'}</strong>
                      </span>
                      <span>Magazinbel.: <strong style={{ color: step.isFeasible ? '#cbd5e1' : '#ef4444', fontWeight: step.isFeasible ? 500 : 700 }}>{step.occupiedSlots} / {simData?.magazineSize}</strong>{!step.isFeasible && <span style={{ marginLeft: '0.2rem', fontSize: '0.85rem' }} title="Magazin-Kapazität überschritten">⚠️</span>}</span>
                    </div>

                    {step.misses && step.misses.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Erforderliche Rüstwerkzeuge:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {step.misses.map((mTool, idx) => (
                            <span 
                              key={idx} 
                              className="badge badge-amber" 
                              style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', textTransform: 'none', whiteSpace: 'nowrap' }}
                              title={mTool.desc}
                            >
                              ID {mTool.nr}: {mTool.desc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Magazine state & Swaps / Parts catalog */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px', overflow: 'hidden' }}>
            {/* Top Sub-tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setRightTab('magazine')}
                style={{
                  background: rightTab === 'magazine' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: 'none',
                  color: rightTab === 'magazine' ? '#fff' : '#64748b',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Magazinbelegung ({rightTab === 'magazine' && magComparisonTab === 'current' ? currentTools.length : simData?.finalMagazine.length})
              </button>
              <button
                onClick={() => setRightTab('setup')}
                style={{
                  background: rightTab === 'setup' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: 'none',
                  color: rightTab === 'setup' ? '#fff' : '#64748b',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Rüstbedarf ({simData?.setupTools.length} Tools)
              </button>
              <button
                onClick={() => setRightTab('config')}
                style={{
                  background: rightTab === 'config' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: 'none',
                  color: rightTab === 'config' ? '#fff' : '#64748b',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Konfiguration ({(unloadedProgramIds.length + preloadedProgramNames.length) > 0 ? `${unloadedProgramIds.length + preloadedProgramNames.length} geändert` : 'Standard'})
              </button>
            </div>

            {/* TAB CONTENT 1: MAGAZINE STATE */}
            {rightTab === 'magazine' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  Vergleichen Sie den aktuellen Werkzeugbestand der Maschine mit dem simulierten Zustand.
                </p>
                {/* Compare toggle switches */}
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                  <button
                    onClick={() => setMagComparisonTab('current')}
                    style={{
                      flexGrow: 1,
                      background: magComparisonTab === 'current' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      border: 'none',
                      color: magComparisonTab === 'current' ? '#3b82f6' : '#94a3b8',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Aktueller Ist-Bestand aus der DB"
                  >
                    Ist-Bestand DB ({currentTools.length})
                  </button>
                  <button
                    onClick={() => setMagComparisonTab('simulated_start')}
                    style={{
                      flexGrow: 1,
                      background: magComparisonTab === 'simulated_start' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      border: 'none',
                      color: magComparisonTab === 'simulated_start' ? '#3b82f6' : '#94a3b8',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Simulierter Anfangszustand nach Entladen/Vorab-Laden"
                  >
                    Simulierter Start ({simData?.initialMagazine?.length || 0})
                  </button>
                  <button
                    onClick={() => setMagComparisonTab('future')}
                    style={{
                      flexGrow: 1,
                      background: magComparisonTab === 'future' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: 'none',
                      color: magComparisonTab === 'future' ? '#10b981' : '#94a3b8',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Zukünftiger Stand am Ende der Simulations-Timeline"
                  >
                    End-Zustand ({simData?.finalMagazine?.length || 0} / {simData?.magazineSize})
                  </button>
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                  {magComparisonTab === 'current' && (
                    currentTools.length === 0 ? (
                      <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                        Keine belegten Werkzeuge in dieser Maschine registriert.
                      </div>
                    ) : (
                      currentTools.map((t, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{t.desc}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                              Typ: {t.keyword} | Ø {t.dia}mm | Name: {t.toolName}
                            </div>
                          </div>
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>T {t.pocket}</span>
                        </div>
                      ))
                    )
                  )}

                  {magComparisonTab === 'simulated_start' && (() => {
                    const simulatedStartList = [];

                    if (simData?.initialMagazine) {
                      simData.initialMagazine.forEach(t => {
                        const isInMachine = currentTools.some(ct => ct.wtNr === t.nr);
                        if (isInMachine) {
                          simulatedStartList.push({
                            ...t,
                            status: 'bleibt',
                            label: 'Bleibt in Maschine',
                            badgeClass: 'badge-green',
                            style: {}
                          });
                        } else {
                          simulatedStartList.push({
                            ...t,
                            status: 'neu',
                            label: 'Muss neu rein (Vorab laden)',
                            badgeClass: 'badge-blue',
                            style: { border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.03)' }
                          });
                        }
                      });
                    }

                    currentTools.forEach(ct => {
                      const isStillPresent = simData?.initialMagazine?.some(im => im.nr === ct.wtNr);
                      if (!isStillPresent) {
                        simulatedStartList.push({
                          nr: ct.wtNr,
                          desc: ct.desc,
                          keyword: ct.keyword,
                          dia: ct.dia,
                          pocket: ct.pocket,
                          status: 'raus',
                          label: 'Muss raus (Entladen)',
                          badgeClass: 'badge-red',
                          style: { textDecoration: 'line-through', opacity: 0.7, border: '1px dashed rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.03)' }
                        });
                      }
                    });

                    // Sort: Bleibt first, then Neu, then Raus
                    const statusOrder = { bleibt: 0, neu: 1, raus: 2 };
                    simulatedStartList.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || (a.nr - b.nr));

                    return simulatedStartList.length === 0 ? (
                      <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                        Simulierter Anfangszustand leer (alle Listen entladen).
                      </div>
                    ) : (
                      simulatedStartList.map((t, idx) => (
                        <div key={idx} style={{ 
                          padding: '0.5rem 0.75rem', 
                          background: t.style.background || 'rgba(255,255,255,0.01)', 
                          border: t.style.border || '1px solid var(--border-dim)', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          opacity: t.style.opacity || 1
                        }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: t.status === 'raus' ? '#f87171' : '#fff', textDecoration: t.style.textDecoration || 'none' }}>
                              {t.desc || 'Unbekannt'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                              Typ: {t.keyword || 'N/A'} | Ø {t.dia || 0}mm | ID: {t.nr} {t.pocket ? `| Pocket: T${t.pocket}` : ''}
                            </div>
                          </div>
                          <span className={`badge ${t.badgeClass}`} style={{ fontSize: '0.7rem' }}>{t.label}</span>
                        </div>
                      ))
                    );
                  })()}

                  {magComparisonTab === 'future' && (
                    !simData?.finalMagazine || simData.finalMagazine.length === 0 ? (
                      <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                        Virtuelles Magazin am Ende leer.
                      </div>
                    ) : (
                      simData.finalMagazine.map((t, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{t.desc || 'Unbekannt'}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                              Typ: {t.keyword || 'N/A'} | Ø {t.dia || 0}mm | ID: {t.nr}
                            </div>
                          </div>
                          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Belegt</span>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: SETUP DEMAND */}
            {rightTab === 'setup' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  Aufstellung aller Werkzeuge und physischen Komponenten, die für die anstehenden Aufträge bis zum Zieldatum neu gerüstet werden müssen.
                </p>

                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Komponenten filtern (z.B. HSK63, Weldon)..."
                    value={filterKw}
                    onChange={(e) => setFilterKw(e.target.value)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.75rem',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                  {filteredSetupParts.length === 0 ? (
                    <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                      Keine neu zu rüstenden Komponenten im Filterbereich gefunden.
                    </div>
                  ) : (
                    filteredSetupParts.map((p, idx) => {
                      const isPartExpanded = expandedPartNrs.has(p.partNr);
                      const allToolsAlreadyInMachine = p.tools.every(t => {
                        const isInMachineNow = currentTools.some(ct => ct.wtNr === t.toolNr);
                        const isKilled = simData?.initialMagazine ? !simData.initialMagazine.some(im => im.nr === t.toolNr) : false;
                        return isInMachineNow && !isKilled;
                      });
                      return (
                        <div
                          key={p.partNr}
                          onClick={() => {
                            const newExpanded = new Set(expandedPartNrs);
                            if (newExpanded.has(p.partNr)) {
                              newExpanded.delete(p.partNr);
                            } else {
                              newExpanded.add(p.partNr);
                            }
                            setExpandedPartNrs(newExpanded);
                          }}
                          style={{
                            padding: '0.65rem 0.75rem',
                            background: 'rgba(255,255,255,0.015)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span>{idx + 1}. {p.desc || 'Komponente'}</span>
                                {allToolsAlreadyInMachine && (
                                  <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', textTransform: 'none' }}>Bereits in Maschine</span>
                                )}
                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{isPartExpanded ? '▲' : '▼'}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                Teile-Nr: {p.partNr} | Typ: {p.keyword || 'N/A'}
                              </div>
                            </div>
                            <span className="badge badge-green" style={{ flexShrink: 0 }}>Menge: {p.totalQty}</span>
                          </div>

                          {isPartExpanded && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                borderTop: '1px dashed var(--border-dim)',
                                paddingTop: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                width: '100%'
                              }}
                            >
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                                Benötigt in folgenden Rüstwerkzeugen:
                              </div>
                              {p.tools.map((t, tIdx) => {
                                const isInMachineNow = currentTools.some(ct => ct.wtNr === t.toolNr);
                                const isKilled = simData?.initialMagazine ? !simData.initialMagazine.some(im => im.nr === t.toolNr) : false;

                                let statusLabel = 'Neu';
                                let badgeColor = 'badge-blue';
                                let rowBg = 'rgba(13, 20, 35, 0.3)';

                                if (isInMachineNow) {
                                  if (isKilled) {
                                    statusLabel = 'In Maschine (Wird entladen)';
                                    badgeColor = 'badge-red';
                                    rowBg = 'rgba(239, 68, 68, 0.03)';
                                  } else {
                                    statusLabel = 'Bereits in Maschine';
                                    badgeColor = 'badge-green';
                                    rowBg = 'rgba(16, 185, 129, 0.03)';
                                  }
                                }

                                return (
                                  <div
                                    key={tIdx}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      background: rowBg,
                                      padding: '0.35rem 0.5rem',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      border: isInMachineNow ? (isKilled ? '1px dashed rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)') : '1px solid var(--border-dim)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ color: '#fff', fontWeight: 500, textDecoration: (isInMachineNow && isKilled) ? 'line-through' : 'none' }}>{t.desc}</span>
                                      <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
                                        Werkzeug-ID: {t.toolNr}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                      <span className={`badge ${badgeColor}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                        {statusLabel}
                                      </span>
                                      <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                        Bedarf: {t.partQty}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: SCENARIO CONFIGURATION */}
            {rightTab === 'config' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', gap: '0.75rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  Passen Sie das Rüst-Szenario an: Entladen Sie aktuell gerüstete Listen oder laden Sie kommende Listen vorab in das Magazin.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {/* Part 1: Unload lists in Toollist-DB */}
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                      Toollist-DB: Listen entladen ({machinePrograms.length})
                    </h5>
                    {machinePrograms.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '0.5rem', fontStyle: 'italic' }}>Keine externen Listen auf Maschine geladen.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {machinePrograms.map(prog => {
                          const isPark = prog.isPark || (prog.ProgramName || '').toLowerCase().includes('park');
                          const isUnloaded = !isPark && unloadedProgramIds.includes(prog.Id);
                          return (
                            <label
                              key={prog.Id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                                color: isPark ? '#10b981' : (isUnloaded ? '#f87171' : '#cbd5e1'),
                                cursor: isPark ? 'not-allowed' : 'pointer',
                                background: isPark ? 'rgba(16, 185, 129, 0.08)' : (isUnloaded ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.01)'),
                                padding: '0.4rem 0.6rem',
                                borderRadius: '8px',
                                border: isPark ? '1px solid rgba(16, 185, 129, 0.3)' : (isUnloaded ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-dim)'),
                                opacity: isPark ? 0.9 : 1,
                                transition: 'background 0.2s, border-color 0.2s'
                              }}
                            >
                              <input
                                type="checkbox"
                                disabled={isPark}
                                checked={!isPark && isUnloaded}
                                onChange={() => {
                                  if (isPark) return;
                                  if (isUnloaded) {
                                    setUnloadedProgramIds(prev => prev.filter(id => id !== prog.Id));
                                  } else {
                                    setUnloadedProgramIds(prev => [...prev, prog.Id]);
                                  }
                                }}
                                style={{ cursor: isPark ? 'not-allowed' : 'pointer' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{prog.ProgramName}</span>
                                <span style={{ fontSize: '0.65rem', color: isPark ? '#10b981' : (isUnloaded ? '#f87171' : '#64748b'), fontWeight: isPark ? 600 : 400 }}>
                                  {isPark ? '🔒 Statisch im Magazin (Park-Werkzeugliste — verbleibt dauerhaft in Maschine)' : (isUnloaded ? 'Wird entladen (aus Ist-Bestand abgezogen)' : 'Geladen (Teil des Ist-Bestands)')}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Part 2: Preload upcoming lists */}
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
                      Kommende Listen vorab laden ({preloadedProgramNames.length})
                    </h5>
                    {preloadedProgramNames.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '0.5rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                        Klicken Sie in der Timeline bei einem Arbeitsschritt auf <strong>"+ Vorab laden"</strong>, um dessen Werkzeuge vorab zu rüsten.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {preloadedProgramNames.map(progName => (
                          <div
                            key={progName}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.8rem',
                              color: '#60a5fa',
                              background: 'rgba(59, 130, 246, 0.08)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{progName}</span>
                            <button
                              onClick={() => setPreloadedProgramNames(prev => prev.filter(p => p !== progName))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                outline: 'none'
                              }}
                              title="Vorab laden aufheben"
                            >
                              × Entfernen
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Part 3: Reset Actions */}
                  {(unloadedProgramIds.length > 0 || preloadedProgramNames.length > 0) && (
                    <button
                      onClick={() => {
                        setUnloadedProgramIds([]);
                        setPreloadedProgramNames([]);
                      }}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        outline: 'none',
                        width: '100%'
                      }}
                    >
                      Konfiguration zurücksetzen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order click detail inspect overlay modal/panel */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: '#0a0f1d', border: '1px solid var(--border-glow)',
            borderRadius: '16px', padding: '1.5rem', width: '500px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', gap: '1rem'
          }} onClick={(e) => e.stopPropagation()}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>Details zum Arbeitsgang</span>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selectedOrder.desc}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Datum: <strong>{selectedOrder.date ? new Date(selectedOrder.date).toLocaleDateString('de-DE') : 'N/A'}</strong></span>
                <span>Auftrag: <strong style={{ color: '#fff' }}>{selectedOrder.contractNumber}</strong> (Pos. {selectedOrder.orderPos || 'N/A'} / AS: {selectedOrder.stepPos})</span>
                <span>KV Status: <strong style={{ color: '#fff' }}>{selectedOrder.spko === 2 ? '2 (In Arbeit)' : selectedOrder.spko === 1 ? '1 (Offen)' : selectedOrder.spko === 4 ? '4 (Erledigt)' : selectedOrder.spko || 'N/A'}</strong></span>
                <span>Programm: <strong>{selectedOrder.programName || 'N/A'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Start-Möglichkeit:</span>
                <span className={`badge ${
                  selectedOrder.statusColor === 'Green' ? 'badge-green' :
                  selectedOrder.statusColor === 'Yellow' ? 'badge-orange' : 'badge-red'
                }`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                  {selectedOrder.statusColor === 'Green' && <><CheckCircle2 size={12} /> Bereit (kann angefangen werden)</>}
                  {selectedOrder.statusColor === 'Yellow' && <><AlertTriangle size={12} /> In Vorbereitung (Vorgänger läuft)</>}
                  {selectedOrder.statusColor === 'Red' && <><XCircle size={12} /> Gesperrt (Vorgänger offen)</>}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="glass-card" style={{ flexGrow: 1, padding: '0.50rem 0.75rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.03)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Benötigt</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selectedOrder.toolsCount}</div>
              </div>
              <div className="glass-card" style={{ flexGrow: 1, padding: '0.50rem 0.75rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Vorhanden</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{selectedOrder.hitsCount}</div>
              </div>
              <div className="glass-card" style={{ flexGrow: 1, padding: '0.50rem 0.75rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.03)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Neu Rüsten</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{selectedOrder.missesCount}</div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setModalTab('setup')}
                style={{
                  background: modalTab === 'setup' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  border: 'none',
                  color: modalTab === 'setup' ? '#fff' : '#64748b',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Rüstbedarf ({selectedOrder.missesCount})
              </button>
              <button
                onClick={() => setModalTab('magazine')}
                style={{
                  background: modalTab === 'magazine' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: 'none',
                  color: modalTab === 'magazine' ? '#fff' : '#64748b',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Magazinbelegung ({selectedOrder.magazineTools?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {modalTab === 'setup' ? (
                <>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Neu zu rüstende Werkzeuge für diesen Arbeitsschritt:</span>
                  {selectedOrder.missesCount === 0 ? (
                    <div style={{ color: '#10b981', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem 0' }}>
                      Alle benötigten Werkzeuge bereits im Magazin geladen.
                    </div>
                  ) : (
                    selectedOrder.misses.map((t, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{t.desc}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ID: {t.nr} | Typ: {t.keyword || 'N/A'}</div>
                        </div>
                        <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>Neu laden</span>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Im Magazin geladene Werkzeuge nach diesem Schritt (Stand X):</span>
                  {!selectedOrder.magazineTools || selectedOrder.magazineTools.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem 0' }}>
                      Magazin ist leer.
                    </div>
                  ) : (
                    selectedOrder.magazineTools.map((t, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{t.desc || 'Unbekannt'}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ID: {t.nr} | Typ: {t.keyword || 'N/A'}</div>
                        </div>
                        <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Belegt</span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            <button className="btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => setSelectedOrder(null)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Simulation Tab
function SimulationTab({ startDate, endDate }) {
  const [baseSetSize, setBaseSetSize] = useState(20);
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [simData, setSimData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDetails, setViewDetails] = useState(false);
  const [tableFullscreen, setTableFullscreen] = useState(false);
  const [componentFilter, setComponentFilter] = useState('');
  const [expandedToolNrs, setExpandedToolNrs] = useState(new Set());
  const [stammSubTab, setStammSubTab] = useState('tools'); // 'tools' or 'components'
  const [expandedStammPartNrs, setExpandedStammPartNrs] = useState(new Set());

  // Filter base tools by component description, keyword, ID, or part properties
  const filteredBaseTools = simData?.baseTools.filter(tool => {
    if (!componentFilter) return true;
    const search = componentFilter.toLowerCase();
    const toolMatch = 
      tool.desc.toLowerCase().includes(search) || 
      (tool.keyword || '').toLowerCase().includes(search) || 
      tool.nr.toString().includes(search);
    if (toolMatch) return true;
    if (tool.parts && Array.isArray(tool.parts)) {
      return tool.parts.some(p => 
        (p.partNr || '').toLowerCase().includes(search) ||
        (p.partDesc || '').toLowerCase().includes(search) ||
        (p.partKeyWord || '').toLowerCase().includes(search)
      );
    }
    return false;
  }) || [];

  // Calculate consolidated components for the proposed base tools
  const accumulatedStammParts = (() => {
    const partsMap = {};
    const toolsToAccumulate = simData?.baseTools || [];
    toolsToAccumulate.forEach(tool => {
      if (tool.parts && Array.isArray(tool.parts)) {
        tool.parts.forEach(p => {
          const partNr = p.partNr || 'Unbekannt';
          if (!partsMap[partNr]) {
            partsMap[partNr] = {
              partNr,
              desc: p.partDesc || '',
              keyword: p.partKeyWord || '',
              totalQty: 0,
              tools: []
            };
          }
          partsMap[partNr].totalQty += (p.partQty || 1);
          partsMap[partNr].tools.push({
            toolNr: tool.nr,
            desc: tool.desc,
            partQty: p.partQty || 1,
            usesCount: tool.usesCount
          });
        });
      }
    });
    return Object.values(partsMap).sort((a, b) => b.totalQty - a.totalQty);
  })();

  // Filter components directly for the Components sub-tab
  const filteredAccumulatedStammParts = accumulatedStammParts.filter(p => {
    if (!componentFilter) return true;
    const search = componentFilter.toLowerCase();
    return (
      (p.desc || '').toLowerCase().includes(search) ||
      (p.partNr || '').toLowerCase().includes(search) ||
      (p.keyword || '').toLowerCase().includes(search)
    );
  });

  // Fetch machines/pools catalog on mount
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoadingMachines(true);
        const res = await fetch(`${API_BASE}/machines`);
        const mData = await res.json();
        setMachines(mData);
        if (mData.length > 0) {
          // Default to Hermle BAZ2-1 or C400 if present, else first machine
          const defaultMach = mData.find(m => m.number === 'BAZ2-1') || mData.find(m => m.number === 'C400') || mData[0];
          setSelectedMachineId(defaultMach.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMachines(false);
      }
    };
    fetchMachines();
  }, []);

  // Fetch simulation data when configuration changes
  useEffect(() => {
    if (!selectedMachineId) return;
    const fetchSimulation = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/setup-reduction?baseSetSize=${baseSetSize}&machineId=${selectedMachineId}&startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        setSimData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSimulation();
  }, [baseSetSize, selectedMachineId, startDate, endDate]);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  // Adjust baseSetSize if it exceeds the selected machine's magazine capacity
  useEffect(() => {
    if (selectedMachine && selectedMachine.magazineSize) {
      if (baseSetSize > selectedMachine.magazineSize) {
        setBaseSetSize(selectedMachine.magazineSize);
      }
    }
  }, [selectedMachineId, selectedMachine, baseSetSize]);

  if (loadingMachines || !selectedMachineId) {
    return <div style={{ color: '#64748b' }}>Lade Maschinenkatalog...</div>;
  }

  const filteredMachines = machines.filter(m => {
    const term = machineSearch.toLowerCase();
    const typeLabel = m.type === 'pool' ? 'pool maschinenpool' : 'maschine machine';
    return (
      m.number.toLowerCase().includes(term) ||
      m.name.toLowerCase().includes(term) ||
      typeLabel.includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 84px)', overflowY: 'auto' }}>
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '1.5rem', alignItems: 'center', padding: '0.65rem 1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>Simulationseinstellungen</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Werkzeugstamm</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
            Simulieren Sie Rüstzeiteinsparungen durch permanent verbaute Standardwerkzeuge.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, minWidth: '55px' }}>Suchen:</span>
            <input
              type="text"
              placeholder="Pool oder Maschine..."
              value={machineSearch}
              onChange={(e) => setMachineSearch(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid var(--border-dim)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.8rem',
                padding: '0.3rem 0.6rem',
                outline: 'none',
                flexGrow: 1
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, minWidth: '55px' }}>Auswahl:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              style={{
                background: 'rgba(13, 20, 35, 0.6)',
                border: '1px solid var(--border-glow)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                padding: '0.35rem 0.75rem',
                outline: 'none',
                cursor: 'pointer',
                flexGrow: 1
              }}
            >
              {filteredMachines.map(m => (
                <option style={{ background: '#0f172a', color: '#f8fafc' }} key={m.id} value={m.id}>
                  {m.type === 'pool' ? 'Pool: ' : 'Maschine: '} {m.number} ({m.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="slider-container" style={{ margin: 0, paddingLeft: '1rem', borderLeft: '1px solid var(--border-dim)' }}>
          <div className="slider-label" style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Stammgröße:</span>
            <span className="slider-val" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{baseSetSize} Tools</span>
          </div>
          <input 
            type="range" min="5" max={selectedMachine?.magazineSize || 100} step="5" 
            value={baseSetSize} 
            onChange={(e) => setBaseSetSize(parseInt(e.target.value))}
            className="custom-range"
          />
        </div>
      </div>

      {loading && !simData ? (
        <div style={{ color: '#64748b' }}>Simuliere Rüstzeiteinsparung...</div>
      ) : (
        <div>
          {/* Optimal Recommendation Tip */}
          {simData?.summary.recommendation && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '0.5rem 1rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem',
              color: '#93c5fd'
            }}>
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <div>
                <strong>Kapazitäts-Empfehlung für {selectedMachine?.number}:</strong> {simData.summary.recommendation}
              </div>
            </div>
          )}

          <div className={simData?.config.magazineSize ? "grid-4" : "grid-3"} style={{ marginBottom: '0.75rem' }}>
            <div className="glass-card metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="metric-header">
                <span>Original Rüstaufwand</span>
                <Clock size={16} />
              </div>
              <div className="metric-value" style={{ color: '#fff' }}>{simData?.summary.originalSetupHours} Std.</div>
              <div className="metric-desc">Gesamtrüstzeit in allen Arbeitsgängen</div>
            </div>

            <div className="glass-card metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="metric-header">
                <span>Optimierter Rüstaufwand</span>
                <Clock size={16} />
              </div>
              <div className="metric-value" style={{ color: '#3b82f6' }}>{simData?.summary.simulatedSetupHours} Std.</div>
              <div className="metric-desc">Prognostizierte Rüstzeit nach Stamm-Rüstung</div>
            </div>

            <div className="glass-card metric-card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.03)' }}>
              <div className="metric-header" style={{ color: '#10b981' }}>
                <span>Einsparung Rüstaufwand</span>
                <TrendingDown size={16} />
              </div>
              <div className="metric-value" style={{ background: 'var(--success-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                -{simData?.summary.savingsHours} Std.
              </div>
              <div className="metric-desc" style={{ color: '#34d399', fontWeight: 600 }}>
                Entspricht {simData?.summary.savingsPercent}% Rüstzeit-Reduzierung!
              </div>
            </div>

            {simData?.config.magazineSize && (
              <div className="glass-card metric-card" style={{ borderLeft: `4px solid ${simData.summary.feasibilityRate >= 95 ? '#10b981' : simData.summary.feasibilityRate >= 80 ? '#f59e0b' : '#ef4444'}`, background: 'rgba(255, 255, 255, 0.01)' }}>
                <div className="metric-header">
                  <span>Machbarkeit</span>
                  <Layers size={16} />
                </div>
                <div className="metric-value" style={{ color: simData.summary.feasibilityRate >= 95 ? '#10b981' : simData.summary.feasibilityRate >= 80 ? '#f59e0b' : '#ef4444' }}>
                  {simData.summary.feasibilityRate}%
                </div>
                <div className="metric-desc">
                  {simData.summary.feasibleStepsCount} von {simData.summary.totalSteps} Aufträgen passen ({simData.config.magazineSize} Plätze)
                </div>
              </div>
            )}
          </div>

          <div className="grid-main-2">
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 600 }}>Rüsteinsparungen nach Arbeitsgang (Soll/Ist)</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    className="btn-secondary" onClick={() => setViewDetails(!viewDetails)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    {viewDetails ? 'Erklärung anzeigen' : 'Alle Schritte auflisten'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      if (!tableFullscreen) {
                        setViewDetails(true);
                      }
                      setTableFullscreen(!tableFullscreen);
                    }}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.35rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title={tableFullscreen ? "Vollbild beenden" : "Tabelle maximieren"}
                  >
                    {tableFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    <span>{tableFullscreen ? 'Normalbild' : 'Vollbild'}</span>
                  </button>
                </div>
              </div>

              {viewDetails ? (
                <div style={tableFullscreen ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: '#090d16',
                  zIndex: 9999,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                } : {
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {tableFullscreen && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem', margin: 0 }}>Rüsteinsparungen nach Arbeitsgang (Soll/Ist) - Vollbild</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => setTableFullscreen(false)}
                        style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Minimize2 size={14} />
                        <span>Vollbild beenden</span>
                      </button>
                    </div>
                  )}
                  <div className="table-wrapper" style={{ maxHeight: tableFullscreen ? 'calc(100vh - 100px)' : 'calc(100vh - 280px)' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Arbeitsgang</th>
                        <th>NC-Programm</th>
                        <th>Original</th>
                        <th>Simuliert</th>
                        <th>Einsparung</th>
                        <th>Werkzeuge (Stamm/Gesamt)</th>
                        {simData?.config.magazineSize && <th>Magazinbelegung</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {simData?.sampleSteps.map((step, idx) => (
                        <tr key={idx} style={{ background: step.isFeasible ? 'transparent' : 'rgba(239, 68, 68, 0.07)' }}>
                          <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                            <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {step.desc}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {step.programName || '-'}
                          </td>
                          <td style={{ color: '#f59e0b' }}>{step.originalSetup} Min</td>
                          <td style={{ color: '#3b82f6' }}>{step.simulatedSetup} Min</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>-{step.savings} Min</td>
                          <td>{step.baseToolsCount} / {step.toolsCount}</td>
                          {simData?.config.magazineSize && (
                            <td style={{ color: step.isFeasible ? '#cbd5e1' : '#ef4444', fontWeight: step.isFeasible ? 400 : 600 }}>
                              {step.occupiedSlots} / {simData.config.magazineSize}
                              {!step.isFeasible && <span style={{ marginLeft: '0.35rem', fontSize: '0.8rem' }} title="Magazin-Kapazität überschritten">⚠️</span>}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
                <div style={{ padding: '2rem 1rem' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#94a3b8' }}>Erklärungsmodell</h4>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    Die Simulation berechnet die Rüstzeitersparnis anhand der Werkzeuge im permanenten Stamm:
                    Müssen von 10 Werkzeugen eines NC-Programms nur 3 gerüstet werden, verringert sich die variable Rüstzeit um 70%.
                    Der Simulator berechnet das Einsparungspotenzial über alle Produktionsaufträge in Echtzeit.
                  </p>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: 600 }}>Stamm-Bestandteile</h3>
              </div>

              {/* Sub-tab Toggle buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem' }}>
                <button 
                  onClick={() => setStammSubTab('tools')}
                  style={{
                    background: stammSubTab === 'tools' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: 'none',
                    color: stammSubTab === 'tools' ? '#fff' : '#64748b',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  Werkzeuge ({filteredBaseTools.length})
                </button>
                <button 
                  onClick={() => setStammSubTab('components')}
                  style={{
                    background: stammSubTab === 'components' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: 'none',
                    color: stammSubTab === 'components' ? '#fff' : '#64748b',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  Komponenten ({filteredAccumulatedStammParts.length})
                </button>
              </div>

              {/* Shared Search Filter Input */}
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder={
                    stammSubTab === 'tools' 
                      ? "Werkzeuge nach Name, ID oder Komponenten filtern (z.B. HSK63)..." 
                      : "Komponenten nach Name, Nummer oder Typ filtern..."
                  }
                  value={componentFilter}
                  onChange={(e) => setComponentFilter(e.target.value)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
              
              {stammSubTab === 'tools' ? (
                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredBaseTools.map((tool, idx) => {
                    const isExpanded = expandedToolNrs.has(tool.nr);
                    return (
                      <div 
                        key={tool.nr} 
                        onClick={() => {
                          const newExpanded = new Set(expandedToolNrs);
                          if (newExpanded.has(tool.nr)) {
                            newExpanded.delete(tool.nr);
                          } else {
                            newExpanded.add(tool.nr);
                          }
                          setExpandedToolNrs(newExpanded);
                        }}
                        style={{
                          padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.015)',
                          border: '1px solid var(--border-dim)', borderRadius: '8px',
                          display: 'flex', flexDirection: 'column', gap: '0.5rem',
                          cursor: 'pointer', transition: 'border-color 0.2s',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{idx + 1}. {tool.desc}</span>
                              <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              Ø {tool.dia || 0}mm | ID: {tool.nr}
                            </div>
                          </div>
                          <span className="badge badge-blue" style={{ flexShrink: 0 }}>{tool.usesCount} Listen</span>
                        </div>
                        
                        {isExpanded && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              borderTop: '1px dashed var(--border-dim)',
                              paddingTop: '0.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem',
                              width: '100%'
                            }}
                          >
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                              Werkzeug-Bestandteile (Aufnahme etc.):
                            </div>
                            {(!tool.parts || tool.parts.length === 0) ? (
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                                Keine Bestandteile in WinTool gepflegt.
                              </div>
                            ) : (
                              tool.parts.map((part, pIdx) => (
                                <div 
                                  key={pIdx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(13, 20, 35, 0.3)',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#fff', fontWeight: 500 }}>{part.partDesc}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
                                      Nr: {part.partNr} | Typ: {part.partKeyWord || '-'}
                                    </span>
                                  </div>
                                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                    Menge: {part.partQty}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredAccumulatedStammParts.length === 0 ? (
                    <div style={{ color: '#475569', textAlign: 'center', padding: '2rem' }}>
                      Keine Stamm-Komponenten im Filterbereich gefunden.
                    </div>
                  ) : (
                    filteredAccumulatedStammParts.map((p, idx) => {
                      const isPartExpanded = expandedStammPartNrs.has(p.partNr);
                      return (
                        <div 
                          key={p.partNr}
                          onClick={() => {
                            const newExpanded = new Set(expandedStammPartNrs);
                            if (newExpanded.has(p.partNr)) {
                              newExpanded.delete(p.partNr);
                            } else {
                              newExpanded.add(p.partNr);
                            }
                            setExpandedStammPartNrs(newExpanded);
                          }}
                          style={{
                            padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.015)',
                            border: '1px solid var(--border-dim)', borderRadius: '8px',
                            display: 'flex', flexDirection: 'column', gap: '0.5rem',
                            cursor: 'pointer', transition: 'border-color 0.2s',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>{idx + 1}. {p.desc || 'Komponente'}</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{isPartExpanded ? '▲' : '▼'}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                Teile-Nr: {p.partNr} | Typ: {p.keyword || 'N/A'}
                              </div>
                            </div>
                            <span className="badge badge-green" style={{ flexShrink: 0 }}>Menge: {p.totalQty}</span>
                          </div>
                          
                          {isPartExpanded && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                borderTop: '1px dashed var(--border-dim)',
                                paddingTop: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                width: '100%'
                              }}
                            >
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                                Benötigt in folgenden Stamm-Werkzeugen:
                              </div>
                              {p.tools.map((t, tIdx) => (
                                <div 
                                  key={tIdx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(13, 20, 35, 0.3)',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#fff', fontWeight: 500 }}>{t.desc}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
                                      Werkzeug-ID: {t.toolNr} | Listenverwendung: {t.usesCount}x
                                    </span>
                                  </div>
                                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                    Bedarf: {t.partQty}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. Machines Tab
function MachinesTab({ startDate, endDate }) {
  const [machines, setMachines] = useState([]);
  const [selectedMachineNr, setSelectedMachineNr] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [data, setData] = useState(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [expandedListNr, setExpandedListNr] = useState(null);
  const [rightSubTab, setRightSubTab] = useState('tools'); // 'tools' or 'components'
  const [expandedPartNrs, setExpandedPartNrs] = useState(new Set());

  // Fetch machines list on mount
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoadingMachines(true);
        const res = await fetch(`${API_BASE}/machines`);
        const mData = await res.json();
        setMachines(mData);
        if (mData.length > 0) {
          // Default to Hermle BAZ2-1 or C400 if present, else first machine
          const defaultMach = mData.find(m => m.number === 'BAZ2-1') || mData.find(m => m.number === 'C400') || mData[0];
          setSelectedMachineNr(defaultMach.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMachines(false);
      }
    };
    fetchMachines();
  }, []);

  // Fetch active tool lists & tools when machine or date range changes
  useEffect(() => {
    if (!selectedMachineNr) return;
    const fetchMachineTools = async () => {
      try {
        setLoadingTools(true);
        const res = await fetch(`${API_BASE}/machines/${selectedMachineNr}/tools?startDate=${startDate}&endDate=${endDate}`);
        const tData = await res.json();
        setData(tData);
        setExpandedListNr(null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTools(false);
      }
    };
    fetchMachineTools();
  }, [selectedMachineNr, startDate, endDate]);

  if (loadingMachines) {
    return <div style={{ color: '#64748b' }}>Lade Maschinenkatalog...</div>;
  }

  const filteredMachines = machines.filter(m => {
    const term = machineSearch.toLowerCase();
    const typeLabel = m.type === 'pool' ? 'pool maschinenpool' : 'maschine machine';
    return (
      m.number.toLowerCase().includes(term) ||
      m.name.toLowerCase().includes(term) ||
      typeLabel.includes(term)
    );
  });

  const selectedMachine = machines.find(m => m.id === selectedMachineNr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {/* Top Selector Panel */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Suchen:</span>
            <input
              type="text"
              placeholder="Pool oder Maschine..."
              value={machineSearch}
              onChange={(e) => setMachineSearch(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid var(--border-dim)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                padding: '0.35rem 0.75rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Auswahl:</span>
            <select
              value={selectedMachineNr}
              onChange={(e) => setSelectedMachineNr(e.target.value)}
              style={{
                background: 'rgba(13, 20, 35, 0.6)',
                border: '1px solid var(--border-glow)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.95rem',
                padding: '0.4rem 1rem',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '250px'
              }}
            >
              {filteredMachines.map(m => (
                <option style={{ background: '#0f172a', color: '#f8fafc' }} key={m.id} value={m.id}>
                  {m.type === 'pool' ? 'Pool: ' : 'Maschine: '} {m.number} ({m.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMachine && (
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            <span>Typ: <strong style={{ color: '#fff' }}>{selectedMachine.type === 'pool' ? 'Maschinenpool' : 'Maschine'}</strong></span>
            <span>Nummer: <strong style={{ color: '#fff' }}>{selectedMachine.number}</strong></span>
            {selectedMachine.name && <span>Bezeichnung: <strong style={{ color: '#fff' }}>{selectedMachine.name}</strong></span>}
          </div>
        )}
      </div>

      {loadingTools ? (
        <div style={{ color: '#64748b', padding: '1rem' }}>Berechne Werkzeugbedarfe für Maschine...</div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* Left Panel: Active Tool Lists */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>Planung nach Werkzeuglisten</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Aktive Rüstlisten ({data.activeToolLists.length})
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Werkzeuglisten, die für die in diesem Zeitraum geplanten Produktionsaufträge auf dieser Maschine gerüstet werden müssen.
              </p>
            </div>

            <div className="smooth-scroll" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {data.activeToolLists.length === 0 ? (
                <div style={{ color: '#475569', textAlign: 'center', padding: '3rem' }}>
                  Keine aktiven Werkzeuglisten im gewählten Zeitraum gefunden.
                </div>
              ) : (
                data.activeToolLists.map(list => (
                  <div 
                    key={list.listNr}
                    style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{list.ident}</h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          ID: {list.listNr} | Geplante Arbeitsgänge: {list.stepsCount} | Zugeordnete Aufträge: {list.ordersCount}
                        </div>
                      </div>
                      
                      <button
                        className="btn-secondary"
                        onClick={() => setExpandedListNr(expandedListNr === list.listNr ? null : list.listNr)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        {expandedListNr === list.listNr ? 'Ausblenden' : 'Werkzeuge anzeigen'}
                      </button>
                    </div>

                    {expandedListNr === list.listNr && (
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-dim)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Enthaltene Werkzeuge:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {list.tools.length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>Keine Komponenten in WinTool gepflegt.</div>
                          ) : (
                            list.tools.map((t, idx) => (
                              <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', background: 'rgba(13,20,35,0.2)', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                                <span>{t.desc} <span style={{ color: '#475569' }}>(ID: {t.nr})</span></span>
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>Ø {t.dia || 0}mm | L {t.len || 0}mm</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Accumulated Tools/Components List */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Teilebedarfs-Zusammenfassung</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Bedarfsanalyse ({rightSubTab === 'tools' ? data.accumulatedTools.length : (data.accumulatedParts || []).length})
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {rightSubTab === 'tools'
                  ? 'Konsolidierter Gesamtbestand aller Werkzeuge, die im gewählten Zeitraum für die Maschine benötigt werden, absteigend sortiert nach Verwendungshäufigkeit.'
                  : 'Akkumulierte WinTool-Komponenten (Aufnahmen, Spannzangen, Wendeschneidplatten etc.) für alle Werkzeuge, die im gewählten Zeitraum auf dieser Maschine benötigt werden.'}
              </p>

              {/* Sub-tab Toggle buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.5rem' }}>
                <button 
                  onClick={() => setRightSubTab('tools')}
                  style={{
                    background: rightSubTab === 'tools' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: 'none',
                    color: rightSubTab === 'tools' ? '#fff' : '#64748b',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  Werkzeugbedarf ({data.accumulatedTools.length})
                </button>
                <button 
                  onClick={() => setRightSubTab('components')}
                  style={{
                    background: rightSubTab === 'components' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: 'none',
                    color: rightSubTab === 'components' ? '#fff' : '#64748b',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  Komponentenbedarf ({(data.accumulatedParts || []).length})
                </button>
              </div>
            </div>

            <div className="smooth-scroll" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {rightSubTab === 'tools' ? (
                data.accumulatedTools.length === 0 ? (
                  <div style={{ color: '#475569', textAlign: 'center', padding: '3rem' }}>
                    Keine akkumulierten Werkzeuge gefunden.
                  </div>
                ) : (
                  data.accumulatedTools.map((t, idx) => (
                    <div 
                      key={t.nr}
                      style={{
                        background: 'rgba(255, 255, 255, 0.015)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>#{idx + 1}</span>
                          <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{t.desc}</h4>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          ID: {t.nr} | Typ: {t.keyword || 'N/A'} | Ø {t.dia || 0}mm | L {t.len || 0}mm
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                          {t.toolLists.map((tl, i) => (
                            <span 
                              key={i} 
                              className="badge badge-blue" 
                              style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}
                              title={`Verwendet in Rüstliste ${tl.ident} (für ${tl.stepsCount} Arbeitsgänge)`}
                            >
                              {tl.ident} ({tl.stepsCount}x)
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Bedarfe (AG)</div>
                        <span className="badge badge-purple" style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>
                          {t.totalUsesCount}x
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                !(data.accumulatedParts) || data.accumulatedParts.length === 0 ? (
                  <div style={{ color: '#475569', textAlign: 'center', padding: '3rem' }}>
                    Keine akkumulierten Werkzeugkomponenten gefunden.
                  </div>
                ) : (
                  data.accumulatedParts.map((p, idx) => {
                    const isPartExpanded = expandedPartNrs.has(p.partNr);
                    return (
                      <div 
                        key={p.partNr}
                        onClick={() => {
                          const newExpanded = new Set(expandedPartNrs);
                          if (newExpanded.has(p.partNr)) {
                            newExpanded.delete(p.partNr);
                          } else {
                            newExpanded.add(p.partNr);
                          }
                          setExpandedPartNrs(newExpanded);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.015)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>#{idx + 1}</span>
                              <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>{p.desc || 'Komponente'}</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{isPartExpanded ? '▲' : '▼'}</span>
                              </h4>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                              Teile-Nr: {p.partNr} | Typ: {p.keyword || 'N/A'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Gesamtmenge</div>
                            <span className="badge badge-green" style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>
                              {p.totalQty}x
                            </span>
                          </div>
                        </div>

                        {isPartExpanded && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              borderTop: '1px dashed var(--border-dim)',
                              paddingTop: '0.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem',
                              width: '100%'
                            }}
                          >
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                              Benötigt in folgenden Werkzeugen:
                            </div>
                            {p.tools.map((t, tIdx) => (
                              <div 
                                key={tIdx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'rgba(13, 20, 35, 0.3)',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ color: '#fff', fontWeight: 500 }}>{t.desc}</span>
                                  <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
                                    Werkzeug-ID: {t.toolNr} | Arbeitsgänge: {t.totalUsesCount}
                                  </span>
                                </div>
                                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                  Menge: {t.partQty}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}


// 7c. Time Evaluation Tab (Soll vs Ist)
function TimeEvaluationTab({ theme, selectedMachine, setSelectedMachine }) {
  const getPreviousWorkdayStr = (refDate = new Date()) => {
    const d = new Date(refDate);
    const day = d.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
    if (day === 1) { // Monday -> Friday
      d.setDate(d.getDate() - 3);
    } else if (day === 0) { // Sunday -> Friday
      d.setDate(d.getDate() - 2);
    } else if (day === 6) { // Saturday -> Friday
      d.setDate(d.getDate() - 1);
    } else { // Tuesday-Friday -> Yesterday
      d.setDate(d.getDate() - 1);
    }
    return d.toISOString().substring(0, 10);
  };

  const [startDate, setStartDate] = useState(() => {
    return getPreviousWorkdayStr();
  });
  const [endDate, setEndDate] = useState(() => {
    return getPreviousWorkdayStr();
  });

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (val && val.length === 10) {
      if (endDate && endDate.length === 10 && endDate < val) {
        setEndDate(val);
      }
    }
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    if (val && val.length === 10) {
      if (startDate && startDate.length === 10 && val < startDate) {
        setStartDate(val);
      }
    }
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewMode, setActiveViewMode] = useState('gantt'); // 'gantt' | 'cards' | 'kanban'
  const [selectedStepDetail, setSelectedStepDetail] = useState(null);
  const [hoveredContractNumber, setHoveredContractNumber] = useState(null);
  const [drilldownDate, setDrilldownDate] = useState('');
  const [showRuestFilter, setShowRuestFilter] = useState(true);
  const [showProdFilter, setShowProdFilter] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const [activeModalStep, setActiveModalStep] = useState(null);
  const [fullRoutingSteps, setFullRoutingSteps] = useState([]);
  const [loadingRouting, setLoadingRouting] = useState(false);

  useEffect(() => {
    if (!activeModalStep) {
      setFullRoutingSteps([]);
      return;
    }

    const loadFullRouting = async () => {
      setLoadingRouting(true);
      try {
        const res = await fetch(`${API_BASE}/orders/${activeModalStep.orderId}/steps`);
        if (res.ok) {
          const json = await res.json();
          if (json.length > 0) {
            const mapped = json.map(op => ({
              stepId: op.StepId,
              stepPos: op.StepPos,
              stepDesc: (op.StepDesc || '').trim(),
              setupTime: op.SetupTime || 0,
              prodTime: op.ProdTime || 0,
              isCompleted: op.SPKO === 4,
              isExecuting: op.SPKO === 2,
              machineName: op.MachineName || (op.MachineId ? `Maschine #${op.MachineId}` : 'Pool'),
              stepTyp: op.StepTyp,
              stepTypName: op.StepTypName
            }));
            setFullRoutingSteps(mapped);
          }
        }
      } catch (err) {
        console.error('Error fetching full routing steps:', err);
      } finally {
        setLoadingRouting(false);
      }
    };

    loadFullRouting();
  }, [activeModalStep]);

  useEffect(() => {
    fetchEvaluation();
    const intervalId = setInterval(() => {
      console.log('[Zeitauswertung Auto-Refresh] Synchronizing 5-minute background cache update...');
      fetchEvaluation();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [startDate, endDate]);

  const getDatesInRange = (startStr, endStr) => {
    const datesList = [];
    const curr = new Date(startStr);
    const end = new Date(endStr);
    let limit = 0;
    while (curr <= end && limit < 100) {
      datesList.push(curr.toISOString().substring(0, 10));
      curr.setDate(curr.getDate() + 1);
      limit++;
    }
    return datesList;
  };

  const dates = getDatesInRange(startDate, endDate);

  const getLocalDateStr = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset();
    const localTime = new Date(d.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().substring(0, 10);
  };

  const getWeekendReferenceAreas = () => {
    const areas = [];
    let startMs = null;
    
    dates.forEach((dateStr) => {
      const d = new Date(dateStr + 'T00:00:00');
      const day = d.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
      const timeMs = d.getTime();
      
      if (day === 5) {
        // Start block at Friday 12:00:00
        startMs = timeMs + 12 * 60 * 60 * 1000;
      } else if (day === 6) {
        if (startMs === null) {
          // If we didn't start on Friday, start here at Saturday 00:00
          startMs = timeMs;
        }
      } else if (day === 0) {
        const endMs = timeMs + 24 * 60 * 60 * 1000 - 1000;
        if (startMs !== null) {
          areas.push({
            x1: startMs,
            x2: endMs,
            label: 'Wochenende'
          });
          startMs = null;
        } else {
          areas.push({
            x1: timeMs,
            x2: endMs,
            label: 'Wochenende'
          });
        }
      } else {
        if (startMs !== null) {
          const prevDayEnd = timeMs - 1000;
          areas.push({
            x1: startMs,
            x2: prevDayEnd,
            label: 'Wochenende'
          });
          startMs = null;
        }
      }
    });
    
    if (startMs !== null) {
      const lastDate = dates[dates.length - 1];
      const lastDayEnd = new Date(lastDate + 'T23:59:59').getTime();
      areas.push({
        x1: startMs,
        x2: lastDayEnd,
        label: 'Wochenende'
      });
    }
    
    return areas;
  };

  const fetchEvaluation = async () => {
    if (!startDate || startDate.length !== 10 || !endDate || endDate.length !== 10) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/machine-time-evaluation?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) {
        let errMsg = res.statusText;
        try {
          const errJson = await res.json();
          if (errJson && errJson.error) {
            errMsg = errJson.error;
          }
        } catch (e) {}
        throw new Error(`Fehler beim Laden: ${errMsg}`);
      }
      const json = await res.json();
      
      const mappedJson = json.map(item => {
        const rawName = item.MS_BEZEICHNUNG;
        let cleanName = null;
        if (rawName) {
          const nameUpper = rawName.toUpperCase();
          if (nameUpper.includes('BROTHER') || nameUpper.includes('TC2A')) cleanName = 'Brother';
          else if (nameUpper.includes('CHIRON')) cleanName = 'Chiron';
          else if (nameUpper.includes('C400')) cleanName = 'C400';
          else if (nameUpper.includes('C40') && !nameUpper.includes('C400')) cleanName = 'C40';
          else if (nameUpper.includes('C42')) cleanName = 'C42';
          else if (nameUpper.includes('RS2-1') || nameUpper.includes('RS2_1')) cleanName = 'RS2_1';
          else if (nameUpper.includes('RS2-2') || nameUpper.includes('RS2_2')) cleanName = 'RS2_2';
        }
        if (!cleanName) return null;
        
        // Parse exact start and stop times from movement
        if (!item.ZB_DATUM_START || !item.ZBUBW_ZEIT_START || !item.ZBUBW_ZEIT_STOP) return null;
        const datePart = item.ZB_DATUM_START.substring(0, 10);
        const start = new Date(`${datePart}T${item.ZBUBW_ZEIT_START}`);
        const end = new Date(`${datePart}T${item.ZBUBW_ZEIT_STOP}`);
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        if (duration <= 0) return null;

        const isRuest = item.ZBUBW_TYP_ZEIT === 0;

        // Shift times back by 6 hours to get the logical workday
        const logicalStart = new Date(start.getTime() - 6 * 60 * 60 * 1000);
        const logicalOffset = logicalStart.getTimezoneOffset();
        const localLogicalStart = new Date(logicalStart.getTime() - (logicalOffset * 60 * 1000));
        const logicalDayStr = localLogicalStart.toISOString().substring(0, 10);
        
        return {
          ...item,
          ZB_DATUM_START: logicalDayStr,
          MS_BEZEICHNUNG: cleanName,
          BookingId: item.ID,
          ContractNumber: item.BK_BKBE_NUMMER,
          PositionNumber: item.BP_POSITION_NUMMER,
          ArticleNumber: item.AR_NUMMER,
          ArticleDesc: item.AD_BEZEICHNUNG,
          start_time: start,
          stop_time: end,
          IST_ZEIT_RUESTUNG: isRuest ? duration : 0,
          IST_ZEIT_PRODUKTION: !isRuest ? duration : 0,
          ZBU_ZEIT_GESAMT: duration
        };
      }).filter(Boolean);
      
      setData(mappedJson);
    } catch (err) {
      console.error('Error fetching time evaluation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dates.length > 0) {
      if (!drilldownDate || !dates.includes(drilldownDate)) {
        setDrilldownDate(dates[0]);
      }
    }
  }, [dates]);

  const handleSetQuickRange = (rangeType) => {
    const today = new Date();
    if (rangeType === 'yesterday') {
      const str = getPreviousWorkdayStr(today);
      setStartDate(str);
      setEndDate(str);
    } else if (rangeType === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().substring(0, 10));
      setEndDate(today.toISOString().substring(0, 10));
    } else if (rangeType === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().substring(0, 10));
      setEndDate(today.toISOString().substring(0, 10));
    }
  };

  const formatMinutes = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins)) return "0m";
    const absoluteMins = Math.abs(Math.round(mins));
    if (absoluteMins < 60) return `${mins < 0 ? '-' : ''}${absoluteMins}m`;
    const hrs = Math.floor(absoluteMins / 60);
    const remainingMins = absoluteMins % 60;
    return `${mins < 0 ? '-' : ''}${hrs}h ${remainingMins}m`;
  };

  const filteredData = data.filter(item => {
    const matchesMachine = selectedMachine === 'All' || item.MS_BEZEICHNUNG === selectedMachine;
    const matchesSearch = !searchQuery || 
      (item.ContractNumber && item.ContractNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ArticleNumber && String(item.ArticleNumber).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ArticleDesc && item.ArticleDesc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMachine && matchesSearch;
  });

  const machineCapMap = {};
  data.forEach(item => {
    const mName = item.MS_BEZEICHNUNG;
    if (mName && !machineCapMap[mName]) {
      machineCapMap[mName] = {
        MO: item.MS_KAPAZITAET_ZEIT_MINUTEN_MO || 0,
        DI: item.MS_KAPAZITAET_ZEIT_MINUTEN_DI || 0,
        MI: item.MS_KAPAZITAET_ZEIT_MINUTEN_MI || 0,
        DO: item.MS_KAPAZITAET_ZEIT_MINUTEN_DO || 0,
        FR: item.MS_KAPAZITAET_ZEIT_MINUTEN_FR || 0,
        SA: item.MS_KAPAZITAET_ZEIT_MINUTEN_SA || 0,
        SO: item.MS_KAPAZITAET_ZEIT_MINUTEN_SO || 0,
      };
    }
  });

  const activeMachines = selectedMachine === 'All' 
    ? Object.keys(machineCapMap) 
    : [selectedMachine];

  let totalCapacityPeriod = 0;
  let totalActualRuestPeriod = 0;
  let totalActualProdPeriod = 0;

  activeMachines.forEach(mName => {
    dates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      const day = dateObj.getDay();
      if (day === 0 || day === 6) return;
      let weekdayKey = 'MO';
      if (day === 1) weekdayKey = 'MO';
      else if (day === 2) weekdayKey = 'DI';
      else if (day === 3) weekdayKey = 'MI';
      else if (day === 4) weekdayKey = 'DO';
      else if (day === 5) weekdayKey = 'FR';

      totalCapacityPeriod += (machineCapMap[mName] ? machineCapMap[mName][weekdayKey] : 0) || 0;
    });

    const machineBookings = filteredData.filter(item => item.MS_BEZEICHNUNG === mName);
    totalActualRuestPeriod += machineBookings.reduce((sum, item) => sum + (item.IST_ZEIT_RUESTUNG || 0), 0);
    totalActualProdPeriod += machineBookings.reduce((sum, item) => sum + (item.IST_ZEIT_PRODUKTION || 0), 0);
  });

  const totalActualPeriodTotal = totalActualRuestPeriod + totalActualProdPeriod;
  const overallUtilization = totalCapacityPeriod > 0 ? Math.round((totalActualPeriodTotal / totalCapacityPeriod) * 100) : 0;
  const overallProdRatio = totalCapacityPeriod > 0 ? Math.round((totalActualProdPeriod / totalCapacityPeriod) * 100) : 0;
  const overallRuestRatio = totalCapacityPeriod > 0 ? Math.round((totalActualRuestPeriod / totalCapacityPeriod) * 100) : 0;

  const machineAggList = Object.keys(machineCapMap).map(mName => {
    let totalCapacity = 0;
    dates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      const day = dateObj.getDay();
      if (day === 0 || day === 6) return;
      let weekdayKey = 'MO';
      if (day === 1) weekdayKey = 'MO';
      else if (day === 2) weekdayKey = 'DI';
      else if (day === 3) weekdayKey = 'MI';
      else if (day === 4) weekdayKey = 'DO';
      else if (day === 5) weekdayKey = 'FR';

      totalCapacity += (machineCapMap[mName][weekdayKey] || 0);
    });

    const matches = data.filter(item => item.MS_BEZEICHNUNG === mName);
    const actualRuest = matches.reduce((sum, item) => sum + (item.IST_ZEIT_RUESTUNG || 0), 0);
    const actualProd = matches.reduce((sum, item) => sum + (item.IST_ZEIT_PRODUKTION || 0), 0);
    const actualTotal = actualRuest + actualProd;
    const ratio = totalCapacity > 0 ? Math.round((actualTotal / totalCapacity) * 100) : (actualTotal > 0 ? 100 : 0);

    return {
      name: mName,
      actualRuest,
      actualProd,
      actualTotal,
      plannedCapacity: totalCapacity,
      ratio,
      count: matches.length
    };
  }).sort((a, b) => {
    const order = ['C40', 'C42', 'RS2_1', 'RS2_2', 'Chiron', 'C400', 'Brother'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  const machineChartData = machineAggList.map(m => ({
    name: m.name,
    "Kapazität": parseFloat((m.plannedCapacity / 60).toFixed(1)),
    "Ist-Zeit": parseFloat((m.actualTotal / 60).toFixed(1))
  }));

  const dailyChartData = dates.map(dateStr => {
    let dailyCapacity = 0;
    let dailyActual = 0;

    activeMachines.forEach(mName => {
      const dateObj = new Date(dateStr);
      const day = dateObj.getDay();
      if (day !== 0 && day !== 6) {
        let weekdayKey = 'MO';
        if (day === 1) weekdayKey = 'MO';
        else if (day === 2) weekdayKey = 'DI';
        else if (day === 3) weekdayKey = 'MI';
        else if (day === 4) weekdayKey = 'DO';
        else if (day === 5) weekdayKey = 'FR';

        dailyCapacity += (machineCapMap[mName] ? machineCapMap[mName][weekdayKey] : 0) || 0;
      }

      const matches = data.filter(item => {
        const itemDateStr = getLocalDateStr(item.ZB_DATUM_START);
        return itemDateStr === dateStr && item.MS_BEZEICHNUNG === mName;
      });
      dailyActual += matches.reduce((sum, item) => sum + (item.IST_ZEIT_RUESTUNG || 0) + (item.IST_ZEIT_PRODUKTION || 0), 0);
    });

    const formattedDate = new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

    return {
      date: formattedDate,
      timestamp: new Date(dateStr + 'T00:00:00').getTime(),
      "Kapazität": parseFloat((dailyCapacity / 60).toFixed(1)),
      "Ist-Zeit": parseFloat((dailyActual / 60).toFixed(1))
    };
  });

  const getHourlyChartData = () => {
    const hourlyMins = [];
    for (let i = 0; i < 24; i++) {
      const h = (i + 6) % 24;
      hourlyMins.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        "Rüstzeit (Minuten)": 0,
        "Produktionszeit (Minuten)": 0,
        "Laufzeit (Minuten)": 0,
        bookingsCount: 0,
        rawHour: h
      });
    }

    const targetDayStr = drilldownDate || (dates.length > 0 ? dates[0] : '');
    if (!targetDayStr) return { hourlyMins, drilldownBookingsList: [] };

    const dayStart = new Date(targetDayStr + 'T06:00:00');
    const nextDay = new Date(targetDayStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().substring(0, 10);
    const dayEnd = new Date(nextDayStr + 'T05:59:59.999');

    const drilldownBookingsList = data.filter(item => {
      const matchesGlobalMachine = selectedMachine === 'All' || item.MS_BEZEICHNUNG === selectedMachine;
      if (!matchesGlobalMachine) return false;

      if (!item.start_time) return false;
      const start = new Date(item.start_time);
      const end = new Date(item.stop_time);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

      return start <= dayEnd && end >= dayStart;
    });

    drilldownBookingsList.forEach(booking => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.stop_time);
      const isRuest = booking.ZBUBW_TYP_ZEIT === 0;
      
      const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      if (totalMinutes <= 0) return;

      for (let i = 0; i < totalMinutes; i++) {
        const minTime = start.getTime() + i * 60000;
        if (minTime >= dayStart.getTime() && minTime <= dayEnd.getTime()) {
          const minDate = new Date(minTime);
          const hour = minDate.getHours();
          const targetSlot = hourlyMins.find(slot => slot.rawHour === hour);
          if (targetSlot) {
            if (isRuest) {
              targetSlot["Rüstzeit (Minuten)"]++;
            } else {
              targetSlot["Produktionszeit (Minuten)"]++;
            }
            targetSlot["Laufzeit (Minuten)"]++;
          }
        }
      }
      
      if (start >= dayStart && start <= dayEnd) {
        const startHour = start.getHours();
        const targetSlot = hourlyMins.find(slot => slot.rawHour === startHour);
        if (targetSlot) {
          targetSlot.bookingsCount++;
        }
      }
    });

    return { hourlyMins, drilldownBookingsList };
  };

  const { hourlyMins: drilldownChartData, drilldownBookingsList } = getHourlyChartData();

  const groupedOrders = {};
  data.forEach(item => {
    const orderKey = `${item.ContractNumber || 'N/A'}_${item.AS_NUMMER || 'N/A'}`;
    if (!groupedOrders[orderKey]) {
      groupedOrders[orderKey] = {
        contractNumber: item.ContractNumber || 'N/A',
        orderId: item.OrderId || null,
        stepPos: item.AS_NUMMER || 'N/A',
        stepDesc: item.AS_BEZEICHNUNG || 'N/A',
        articleDesc: item.ArticleDesc || 'N/A',
        articleNumber: item.ArticleNumber || 'N/A',
        articleId: item.ArticleId,
        positionNumber: item.PositionNumber || null,
        machines: new Set(),
        minDate: null,
        maxDate: null,
        actualRuest: 0,
        actualProd: 0,
        plannedRuest: item.SOLL_ZEIT_RUESTUNG || 0,
        plannedProd: item.SOLL_ZEIT_PRODUKTION || 0,
        stepId: item.StepId || null
      };
    }

    const order = groupedOrders[orderKey];
    if (item.MS_BEZEICHNUNG) {
      order.machines.add(item.MS_BEZEICHNUNG);
    }
    if (item.ZB_DATUM_START) {
      const d = new Date(item.ZB_DATUM_START);
      if (!order.minDate || d < order.minDate) order.minDate = d;
      if (!order.maxDate || d > order.maxDate) order.maxDate = d;
    }

    order.actualRuest += (item.IST_ZEIT_RUESTUNG || 0);
    order.actualProd += (item.IST_ZEIT_PRODUKTION || 0);
  });

  const groupedOrdersList = Object.values(groupedOrders).map(order => {
    return {
      ...order,
      machinesStr: Array.from(order.machines).join(', '),
      dateStr: order.minDate 
        ? (order.minDate.toLocaleDateString('de-DE') + (order.maxDate && order.maxDate.getTime() !== order.minDate.getTime() ? ` - ${order.maxDate.toLocaleDateString('de-DE')}` : ''))
        : 'N/A'
    };
  }).sort((a, b) => b.actualRuest + b.actualProd - (a.plannedRuest + a.plannedProd));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 0 }}>
      <div className="machine-pills" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '-0.5rem' }}>
        <button
          className={`pill ${selectedMachine === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedMachine('All')}
        >
          Alle Maschinen (Übersicht)
        </button>
        {['C40', 'C42', 'RS2_1', 'RS2_2', 'Chiron', 'C400', 'Brother'].filter(m => m !== 'C400').map(m => (
          <button
            key={m}
            className={`pill ${selectedMachine === m ? 'active' : ''}`}
            onClick={() => setSelectedMachine(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Startdatum:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => handleStartDateChange(e.target.value)}
              style={{ background: 'rgba(13, 20, 35, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', padding: '0.4rem 0.75rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Enddatum:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => handleEndDateChange(e.target.value)}
              style={{ background: 'rgba(13, 20, 35, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', padding: '0.4rem 0.75rem', outline: 'none' }}
            />
          </div>
          <button onClick={fetchEvaluation} className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '0.45rem 1rem' }} disabled={loading}>
            Auswerten
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', alignSelf: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Auto-Cache Update alle 5 Min.
          </span>
          <button onClick={() => handleSetQuickRange('yesterday')} className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.02)' }}>Vortag (Gestern)</button>
          <button onClick={() => handleSetQuickRange('week')} className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.02)' }}>Letzte Woche</button>
          <button onClick={() => handleSetQuickRange('month')} className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.02)' }}>Letzter Monat</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(56, 189, 248, 0.1)', borderTopColor: '#38bdf8', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
          <h4>Fehler beim Laden der Zeitauswertung</h4>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <Clock size={40} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
          <h4>Keine Rückmeldedaten im gewählten Zeitraum gefunden.</h4>
          <p style={{ fontSize: '0.85rem' }}>Prüfen Sie den Datumsbereich oder buchen Sie Maschinenbelegungen.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-card metric-card" style={{ borderLeft: '4px solid #38bdf8' }}>
              <div className="metric-header" style={{ color: '#38bdf8' }}>
                <span>Maschinen-Auslastung</span>
                <Clock size={16} />
              </div>
              <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span>{overallUtilization}%</span>
                <span style={{ fontSize: '1rem', color: '#10b981', fontWeight: 700 }}>({overallProdRatio}% Prod)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Rüst-Anteil: <strong style={{ color: '#f59e0b' }}>{overallRuestRatio}%</strong> der Gesamtkapazität
              </div>
            </div>

            <div className="glass-card metric-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="metric-header" style={{ color: '#10b981' }}>
                <span>Tatsächliche Belegungszeit (Ist)</span>
                <Activity size={16} />
              </div>
              <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {formatMinutes(totalActualPeriodTotal)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Rüsten: {formatMinutes(totalActualRuestPeriod)} | Produktion: {formatMinutes(totalActualProdPeriod)}
              </div>
            </div>

            <div className="glass-card metric-card" style={{ borderLeft: '4px solid #64748b' }}>
              <div className="metric-header" style={{ color: '#94a3b8' }}>
                <span>Geplante Maschinenzeit (Kapazität)</span>
                <Clock size={16} />
              </div>
              <div className="metric-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {formatMinutes(totalCapacityPeriod)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Verfügbare Kapazität der selektierten Maschinen
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Auslastung nach Maschine (in Stunden)</h3>
              <div style={{ flex: 1, width: '100%', minHeight: '280px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart 
                    data={machineChartData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    style={{ cursor: 'pointer' }}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        const mName = state.activeLabel;
                        setSelectedMachine(prev => prev === mName ? 'All' : mName);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.04)"} />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      itemStyle={{ color: '#cbd5e1' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Bar dataKey="Kapazität" fill={theme === 'light' ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)"} radius={[4, 4, 0, 0]}>
                      {machineChartData.map((entry, idx) => {
                        const isSelected = entry.name === selectedMachine;
                        const hasSelection = selectedMachine !== 'All';
                        
                        let fillVal = theme === 'light' ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)';
                        let strokeVal = theme === 'light' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.3)';
                        let strokeDash = '3 3';
                        
                        if (hasSelection) {
                          if (isSelected) {
                            fillVal = theme === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.25)';
                            strokeVal = '#10b981';
                            strokeDash = 'none';
                          } else {
                            fillVal = theme === 'light' ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.03)';
                            strokeVal = theme === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.08)';
                            strokeDash = '3 3';
                          }
                        } else {
                          fillVal = theme === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)';
                          strokeVal = theme === 'light' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.3)';
                          strokeDash = 'none';
                        }
                        
                        return (
                          <Cell 
                            key={`cap-cell-${idx}`} 
                            fill={fillVal} 
                            stroke={strokeVal} 
                            strokeWidth={1.5}
                            strokeDasharray={strokeDash}
                          />
                        );
                      })}
                    </Bar>
                    <Bar dataKey="Ist-Zeit" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                      {machineChartData.map((entry, idx) => {
                        const isSelected = entry.name === selectedMachine;
                        const hasSelection = selectedMachine !== 'All';
                        const fillVal = isSelected 
                          ? '#10b981' 
                          : (hasSelection ? (theme === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)') : '#38bdf8');
                        return <Cell key={`ist-cell-${idx}`} fill={fillVal} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Täglicher Verlauf der Belegungszeiten (in Stunden)</h3>
              <div style={{ flex: 1, width: '100%', minHeight: '280px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart 
                    data={dailyChartData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    style={{ cursor: 'pointer' }}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        const timestamp = Number(state.activeLabel);
                        if (!isNaN(timestamp)) {
                          const clickedDate = new Date(timestamp);
                          const matchedDate = dates.find(d => {
                            const dObj = new Date(d + 'T00:00:00');
                            return dObj.getFullYear() === clickedDate.getFullYear() &&
                                   dObj.getMonth() === clickedDate.getMonth() &&
                                   dObj.getDate() === clickedDate.getDate();
                          });
                          if (matchedDate) {
                            setDrilldownDate(matchedDate);
                          }
                        }
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorIst" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.04)"} />
                    {getWeekendReferenceAreas().map((area, idx) => (
                      <ReferenceArea 
                        key={`weekend-${idx}`}
                        x1={area.x1} 
                        x2={area.x2} 
                        fill="rgba(239, 68, 68, 0.16)" 
                        stroke="rgba(239, 68, 68, 0.35)" 
                        strokeDasharray="3 3"
                        label={{ value: area.label, angle: -90, position: 'center', fill: 'rgba(248, 113, 113, 0.75)', fontSize: 10, fontWeight: 700 }}
                      />
                    ))}
                    <XAxis 
                      dataKey="timestamp" 
                      type="number" 
                      scale="time"
                      domain={['dataMin', 'dataMax']} 
                      tickFormatter={(time) => new Date(time).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      stroke="#64748b" 
                      style={{ fontSize: '0.75rem' }} 
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      itemStyle={{ color: '#cbd5e1' }}
                      labelFormatter={(label) => new Date(Number(label)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Area type="monotone" dataKey="Kapazität" stroke={theme === 'light' ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.55)"} strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="Ist-Zeit" stroke="#10b981" fillOpacity={1} fill="url(#colorIst)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div id="drilldown-section" className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📊 Stündliche Detailanalyse (Drilldown)</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>Wählen Sie einen Tag und eine Maschine aus, um die Auslastung auf Stundenbasis zu sehen.</p>
              </div>

              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px' }}>
                  <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Tag:</label>
                  <select 
                    value={drilldownDate} 
                    onChange={(e) => setDrilldownDate(e.target.value)}
                    style={{ background: 'rgba(13, 20, 35, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', padding: '0.3rem 0.5rem', outline: 'none', height: '32px', width: '100%' }}
                  >
                    {dates.map(d => (
                      <option key={d} value={d} style={{ background: '#0f172a' }}>
                        {new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Zeiten ein-/ausblenden:</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', height: '32px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={showRuestFilter} 
                        onChange={(e) => setShowRuestFilter(e.target.checked)} 
                        style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
                      />
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Rüstzeit (Gelb)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={showProdFilter} 
                        onChange={(e) => setShowProdFilter(e.target.checked)} 
                        style={{ accentColor: '#10b981', cursor: 'pointer' }}
                      />
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Prod. Zeit (Grün)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem', borderRadius: '12px', height: '260px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem' }}>Laufzeitverteilung (Minuten pro Stunde)</span>
                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={drilldownChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.02)"} />
                      <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '0.65rem' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '0.65rem' }} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontWeight: 600, fontSize: '0.75rem' }}
                        itemStyle={{ fontSize: '0.75rem', color: '#cbd5e1' }}
                      />
                      {showRuestFilter && (
                        <Bar 
                          dataKey="Rüstzeit (Minuten)" 
                          fill="#f59e0b" 
                          stackId="a" 
                          radius={!showProdFilter ? [2, 2, 0, 0] : [0, 0, 0, 0]} 
                        />
                      )}
                      {showProdFilter && (
                        <Bar 
                          dataKey="Produktionszeit (Minuten)" 
                          fill="#10b981" 
                          stackId="a" 
                          radius={[2, 2, 0, 0]} 
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem', borderRadius: '12px', height: '260px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem' }}>Aktive Belegungen an diesem Tag ({drilldownBookingsList.length})</span>
                <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.75rem' }}>
                  {drilldownBookingsList.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '3rem' }}>Keine Belegungsbuchungen</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-dim)', color: '#64748b' }}>
                          <th style={{ paddingBottom: '0.4rem' }}>Uhrzeit</th>
                          <th style={{ paddingBottom: '0.4rem' }}>Auftrag</th>
                          <th style={{ paddingBottom: '0.4rem' }}>Pos.</th>
                          <th style={{ paddingBottom: '0.4rem' }}>AS</th>
                          <th style={{ paddingBottom: '0.4rem' }}>Maschine</th>
                          <th style={{ paddingBottom: '0.4rem', textAlign: 'right', color: '#f59e0b' }}>Ist-Rüsten</th>
                          <th style={{ paddingBottom: '0.4rem', textAlign: 'right', color: '#10b981' }}>Ist-Prod</th>
                          <th style={{ paddingBottom: '0.4rem', textAlign: 'right' }}>Gesamt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drilldownBookingsList.map((b, idx) => (
                          <tr key={`${b.BookingId}-${b.ZBUBW_TYP_ZEIT}-${b.ZBUBW_ZEIT_START || idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.4rem 0' }}>
                              {b.ZBUBW_ZEIT_START ? b.ZBUBW_ZEIT_START.substring(0, 5) : ''} - {b.ZBUBW_ZEIT_STOP ? b.ZBUBW_ZEIT_STOP.substring(0, 5) : ''}
                            </td>
                            <td style={{ padding: '0.4rem 0', fontWeight: 600, color: '#38bdf8' }}>{b.ContractNumber || 'Ohne P-Nr'}</td>
                            <td style={{ padding: '0.4rem 0', color: '#94a3b8' }}>{b.PositionNumber || '-'}</td>
                            <td style={{ padding: '0.4rem 0', color: '#cbd5e1', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.AS_BEZEICHNUNG}>
                              {b.AS_NUMMER ? `${b.AS_NUMMER}${b.AS_BEZEICHNUNG ? ` (${b.AS_BEZEICHNUNG})` : ''}` : '-'}
                            </td>
                            <td style={{ padding: '0.4rem 0', color: '#cbd5e1' }}>{b.MS_BEZEICHNUNG}</td>
                            <td style={{ padding: '0.4rem 0', textAlign: 'right', color: '#f59e0b' }}>{formatMinutes(b.IST_ZEIT_RUESTUNG)}</td>
                            <td style={{ padding: '0.4rem 0', textAlign: 'right', color: '#10b981' }}>{formatMinutes(b.IST_ZEIT_PRODUKTION)}</td>
                            <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>{formatMinutes((b.IST_ZEIT_RUESTUNG || 0) + (b.IST_ZEIT_PRODUKTION || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Maschinen-Auslastung</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {machineAggList.map(m => {
                const ratio = m.ratio;
                const prodRatio = m.plannedCapacity > 0 ? Math.round((m.actualProd / m.plannedCapacity) * 100) : 0;
                const ruestRatio = m.plannedCapacity > 0 ? Math.round((m.actualRuest / m.plannedCapacity) * 100) : 0;
                const isSelected = selectedMachine === m.name;
                
                return (
                  <div 
                    key={m.name} 
                    onClick={() => {
                      setSelectedMachine(prev => prev === m.name ? 'All' : m.name);
                    }}
                    style={{ 
                      background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)', 
                      border: isSelected ? '1.5px solid #10b981' : '1px solid var(--border-dim)', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 10px rgba(16, 185, 129, 0.1)' : 'none'
                    }}
                    className="machine-card-hover"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />}
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{m.name}</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.count} Buchungssegmente</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <span>Geplant (Kapazität): {formatMinutes(m.plannedCapacity)}</span>
                      <span>Ist (Laufzeit): <strong>{formatMinutes(m.actualTotal)}</strong></span>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', marginTop: '0.2rem', display: 'flex' }}>
                      <div style={{ width: `${Math.min(100, prodRatio)}%`, height: '100%', background: '#10b981', borderRadius: '5px 0 0 5px' }} />
                      <div style={{ width: `${Math.min(100, ruestRatio)}%`, height: '100%', background: '#f59e0b', borderRadius: '0 5px 5px 0' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <span>Auslastung: <strong style={{ color: '#fff' }}>{ratio}%</strong> <strong style={{ color: '#10b981', marginLeft: '0.35rem' }}>({prodRatio}% Prod)</strong></span>
                      <span>
                        Rüsten: <strong style={{ color: '#cbd5e1' }}>{formatMinutes(m.actualRuest)}</strong> | Prod: <strong style={{ color: '#cbd5e1' }}>{formatMinutes(m.actualProd)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Rückmelde-Detailprotokoll</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="P-Nummer / Artikel suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'rgba(13, 20, 35, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: '220px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontWeight: 700 }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>AS</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Auftrag (P-Nummer)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Maschine(n)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Datum</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Artikel / Vorgänge</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Soll-Rüsten</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ist-Rüsten</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Soll-Prod</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ist-Prod</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Abweichung</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedOrdersList.map((order, idx) => {
                    const actGesamt = (order.actualRuest || 0) + (order.actualProd || 0);
                    const plGesamt = (order.plannedRuest || 0) + (order.plannedProd || 0);
                    const diff = actGesamt - plGesamt;
                    
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#38bdf8' }}>
                          AS {order.stepPos}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span 
                            onClick={() => {
                              if (order.orderId) {
                                setActiveModalStep({
                                  stepId: order.stepId,
                                  stepPos: order.stepPos,
                                  stepDesc: order.stepDesc,
                                  orderDesc: order.articleDesc,
                                  articleId: order.articleId,
                                  contractNumber: order.contractNumber,
                                  machineName: order.machinesStr,
                                  setupTime: order.plannedRuest,
                                  prodTime: order.plannedProd,
                                  isCompleted: true,
                                  orderId: order.orderId
                                });
                              } else {
                                alert(`Keine interne ID für den Auftrag ${order.contractNumber} gefunden.`);
                              }
                            }}
                            style={{ 
                              color: order.orderId ? '#38bdf8' : '#64748b', 
                              fontWeight: 700, 
                              cursor: order.orderId ? 'pointer' : 'default',
                              textDecoration: order.orderId ? 'underline' : 'none'
                            }}
                            title={order.orderId ? "Klicken für Arbeitsplan-Details" : "Keine D4-Verknüpfung"}
                          >
                            {order.contractNumber}{order.positionNumber ? ` / Pos ${order.positionNumber}` : ''}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#fff', fontWeight: 600 }}>{order.machinesStr || 'Keine'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#cbd5e1' }}>{order.dateStr}</td>
                        <td style={{ padding: '0.75rem 0.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${order.articleDesc} (${order.stepDesc})`}>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{order.articleDesc}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{order.stepDesc}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#94a3b8', fontWeight: 500 }}>{formatMinutes(order.plannedRuest)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 600 }}>{formatMinutes(order.actualRuest)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#94a3b8', fontWeight: 500 }}>{formatMinutes(order.plannedProd)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 600 }}>{formatMinutes(order.actualProd)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: diff <= 0 ? '#10b981' : '#f87171' }}>
                          {diff > 0 ? '+' : ''}{formatMinutes(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal for Detailed Step Information (Evaluation View) */}
      {activeModalStep && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(4, 6, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem',
          transition: 'all 0.3s ease'
        }} onClick={() => setActiveModalStep(null)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.25rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Close Button */}
            <button
              onClick={() => setActiveModalStep(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-dim)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                width: '32px',
                height: '32px'
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700 }}>
                  ✓ Abgeschlossen
                </span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0' }}>
                Arbeitsschritt-Details (Historisch)
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                Ist-Rückmeldedaten aus D4
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Row 1: P-Nummer & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>P-Nummer (Projekt)</div>
                  <div style={{ fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700 }}>
                    {activeModalStep.contractNumber || 'Keine P-Nummer'}
                    {activeModalStep.positionNumber ? ` / Pos ${activeModalStep.positionNumber}` : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Geplant auf</div>
                  <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                    {activeModalStep.machineName || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Row 2: Artikel */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Artikel (Teil)</div>
                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{activeModalStep.orderDesc}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Artikel-ID: {activeModalStep.articleId}</div>
              </div>

              {/* Row 3: Position & Beschreibung */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Arbeitsplan-Position (Arbeitsschritt)</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>{activeModalStep.stepPos || 'N/A'}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>- {activeModalStep.stepDesc}</span>
                </div>
              </div>

              {/* Row 4: Zeiten (Soll vs Ist) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Soll-Rüsten / Soll-Prod</div>
                  <div style={{ fontSize: '1.05rem', color: '#94a3b8', fontWeight: 700, marginTop: '0.25rem' }}>
                    {formatMinutes(activeModalStep.setupTime)} / {formatMinutes(activeModalStep.prodTime)}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Soll-Gesamtzeit</div>
                  <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginTop: '0.15rem' }}>
                    {formatMinutes(activeModalStep.setupTime + activeModalStep.prodTime)}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Typ</div>
                  <div style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 700, marginTop: '0.15rem' }}>Auswertung</div>
                </div>
              </div>

              {/* Gesamter Arbeitsplan Section */}
              <div>
                <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Gesamter Arbeitsplan (Routing)</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#94a3b8' }}>
                    {loadingRouting ? 'Lade...' : `${fullRoutingSteps.length} Operationen`}
                  </span>
                </div>
                {loadingRouting ? (
                  <div className="modal-routing-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', padding: '1rem', border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Lade Arbeitsplan...</span>
                  </div>
                ) : fullRoutingSteps.length > 0 ? (
                  <div className="modal-routing-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem', border: '1px solid var(--border-dim)', padding: '0.75rem', borderRadius: '10px' }}>
                    {fullRoutingSteps.map((op, opIdx) => {
                      const isCurrent = op.stepId === activeModalStep.stepId;
                      const isCompleted = op.isCompleted;
                      const isExecuting = op.isExecuting;

                      let statusBadge = null;
                      let bgStyle = 'rgba(255, 255, 255, 0.01)';
                      let borderStyle = '1px solid rgba(255, 255, 255, 0.03)';

                      if (isCurrent) {
                        statusBadge = <span style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#38bdf8', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>Aktueller Schritt</span>;
                        bgStyle = 'rgba(59, 130, 246, 0.04)';
                        borderStyle = '1px solid rgba(59, 130, 246, 0.25)';
                      } else if (isCompleted) {
                        statusBadge = <span style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>✓ Erledigt</span>;
                      } else if (isExecuting) {
                        statusBadge = <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>⚡ In Arbeit</span>;
                      } else {
                        statusBadge = <span style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>Offen</span>;
                      }

                      let stepTypeBadge = null;
                      if (op.stepTyp === 3) {
                        stepTypeBadge = <span style={{ background: 'rgba(148, 163, 184, 0.12)', border: '1px solid rgba(148, 163, 184, 0.25)', color: '#94a3b8', fontSize: '0.62rem', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 600, marginRight: '0.35rem', flexShrink: 0 }}>ℹ Info</span>;
                      } else if (op.stepTyp === 2) {
                        stepTypeBadge = <span style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.25)', color: '#fdba74', fontSize: '0.62rem', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 600, marginRight: '0.35rem', flexShrink: 0 }}>📦 Material</span>;
                      } else if (op.stepTyp === 1) {
                        stepTypeBadge = <span style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#c084fc', fontSize: '0.62rem', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 600, marginRight: '0.35rem', flexShrink: 0 }}>🤝 Ext. Dienstl.</span>;
                      }

                      return (
                        <div key={opIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bgStyle, border: borderStyle, padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', transition: 'all 0.2s', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
                            <span style={{ color: isCurrent ? '#38bdf8' : '#64748b', fontWeight: 700, fontFamily: 'monospace', minWidth: '42px', flexShrink: 0 }}>AS {op.stepPos}</span>
                            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flexGrow: 1, minWidth: 0, gap: '0.35rem' }}>
                              {stepTypeBadge}
                              <span style={{ color: isCompleted ? '#64748b' : '#fff', fontWeight: 600, textDecoration: isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', flexGrow: 1, minWidth: 0 }} title={op.stepDesc}>
                                {op.stepDesc ? op.stepDesc.replace(/\r?\n/g, ' ') : ''}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap' }} title="Maschine">{op.machineName}</span>
                            <span style={{ color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{op.setupTime}m / {op.prodTime}m</span>
                            {statusBadge}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.5rem', textAlign: 'center' }}>
                    Kein Arbeitsplan für diesen Auftrag hinterlegt.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 8. Missing Data Tab (Datenvollständigkeit)
function MissingDataTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/planning`);
      if (!res.ok) throw new Error('Fehler beim Laden der Planungsdaten');
      const json = await res.json();
      
      const allSteps = [];
      if (json.board) {
        const validMachines = ['Brother', 'Chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2'];
        Object.keys(json.board).forEach(machine => {
          if (!validMachines.includes(machine)) {
            return;
          }
          Object.keys(json.board[machine]).forEach(day => {
            json.board[machine][day].forEach(step => {
              allSteps.push({ ...step, machine, dayScheduled: day });
            });
          });
        });
      }
      
      const filtered = allSteps.filter(s => !s.ncProgram || (s.ncProgram && !s.matchedListNr) || (s.ncProgram && s.matchedType === 'fuzzy') || !s.fixture || s.isWrongMachine);
      setData(filtered);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [filterType, setFilterType] = useState('all'); // 'all', 'nc', 'stamm', 'fixture'
  const [filterMachine, setFilterMachine] = useState('all'); // 'all', 'Brother', etc.

  useEffect(() => {
    fetchData();
  }, []);

  const toggleOrder = (order) => {
    setExpandedOrders(prev => ({
      ...prev,
      [order]: !prev[order]
    }));
  };

  const filteredData = React.useMemo(() => {
    return data.filter(s => {
      // Machine filter
      if (filterMachine !== 'all' && s.machine !== filterMachine) return false;
      
      // Type filter
      if (filterType === 'nc') return !s.ncProgram;
      if (filterType === 'stamm') return s.ncProgram && (!s.matchedListNr || s.matchedType === 'fuzzy');
      if (filterType === 'stamm_p_auftrag') {
        const hasGap = s.ncProgram && (!s.matchedListNr || s.matchedType === 'fuzzy');
        const masterOk = s.masterNcProgram && s.masterMatchedListNr && s.masterMatchedType === 'exact';
        return hasGap && masterOk;
      }
      if (filterType === 'stamm_artikel') {
        const hasGap = s.ncProgram && (!s.matchedListNr || s.matchedType === 'fuzzy');
        const masterNotOk = !s.masterNcProgram || !s.masterMatchedListNr || s.masterMatchedType === 'fuzzy';
        return hasGap && masterNotOk;
      }
      if (filterType === 'fixture') return !s.fixture;
      if (filterType === 'wrong_machine') return s.isWrongMachine;
      
      return true;
    });
  }, [data, filterType, filterMachine]);

  const groupedData = React.useMemo(() => {
    const groups = {};
    filteredData.forEach(s => {
      const pNum = s.contractNumber || 'Keine P-Nummer';
      const artKey = `${s.articleId || 'Unbekannt'} - ${s.orderDesc || 'Keine Bezeichnung'}`;
      if (!groups[pNum]) {
        groups[pNum] = {};
      }
      if (!groups[pNum][artKey]) {
        groups[pNum][artKey] = [];
      }
      groups[pNum][artKey].push(s);
    });
    return groups;
  }, [filteredData]);

  const handleExpandAll = () => {
    const next = {};
    Object.keys(groupedData).forEach(pNum => {
      next[pNum] = true;
    });
    setExpandedOrders(next);
  };

  const handleCollapseAll = () => {
    setExpandedOrders({});
  };

  const ncMissingCount = data.filter(s => !s.ncProgram).length;
  const stammMissingCount = data.filter(s => s.ncProgram && (!s.matchedListNr || s.matchedType === 'fuzzy')).length;
  const fixtureMissingCount = data.filter(s => !s.fixture).length;
  const wrongMachineCount = data.filter(s => s.isWrongMachine).length;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      
      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem', borderRadius: '10px' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Betroffene Schritte</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>{data.length}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.6rem', borderRadius: '10px' }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>NC-Programm fehlt</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{ncMissingCount}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '0.6rem', borderRadius: '10px' }}>
            <Wrench size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Vorrichtung fehlt</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#c084fc' }}>{fixtureMissingCount}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', padding: '0.6rem', borderRadius: '10px' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Im Stamm fehlt</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fb923c' }}>{stammMissingCount}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '1rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.6rem', borderRadius: '10px' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Falsche Maschine</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{wrongMachineCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.85rem 1.25rem', borderRadius: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Fehlertyp:</span>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ background: 'rgba(13, 20, 35, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', padding: '0.25rem 0.5rem', outline: 'none' }}
          >
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="all">Alle Fehler</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="nc">NC-Programm fehlt (ERP)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="stamm">Stamm fehlt (WinTool - Gesamt)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="stamm_p_auftrag">Stamm fehlt (nur P-Auftrag)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="stamm_artikel">Stamm fehlt (auch Artikel-AP)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="fixture">Vorrichtung fehlt (Spannmittel)</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="wrong_machine">Falsche Maschine (Direktzuordnung Pool-Maschine)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Maschine:</span>
          <select 
            value={filterMachine} 
            onChange={(e) => setFilterMachine(e.target.value)}
            style={{ background: 'rgba(13, 20, 35, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', padding: '0.25rem 0.5rem', outline: 'none' }}
          >
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="all">Alle Maschinen</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="Brother">Brother</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="Chiron">Chiron</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="C400">C400</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="C40">C40</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="C42">C42</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="RS2_1">RS2_1</option>
            <option style={{ background: '#0f172a', color: '#f8fafc' }} value="RS2_2">RS2_2</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '4rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#38bdf8' }} />
          <span style={{ fontSize: '0.9rem' }}>Scanne Belegungsplan nach Datenvollständigkeit...</span>
        </div>
      ) : error ? (
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '0.9rem' }}>
          <strong>Fehler beim Laden:</strong> {error}
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <div style={{ padding: '3rem 1rem', border: '1px dashed var(--border-dim)', borderRadius: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 600 }}>Alles vollständig!</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Für alle geplanten Arbeitsschritte existieren eindeutige NC-Programme und Vorrichtungen.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleExpandAll} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                Alle ausklappen
              </button>
              <button onClick={handleCollapseAll} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                Alle einklappen
              </button>
            </div>
            <button onClick={fetchData} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={12} /> Aktualisieren
            </button>
          </div>

          {Object.keys(groupedData).map(pNum => {
            const articles = groupedData[pNum];
            const isExpanded = !!expandedOrders[pNum];
            const articleCount = Object.keys(articles).length;
            const totalStepsInP = Object.values(articles).reduce((sum, list) => sum + list.length, 0);

            return (
              <div 
                key={pNum} 
                style={{ 
                  background: 'rgba(30, 41, 59, 0.25)', 
                  border: '1px solid var(--border-dim)', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  transition: 'border-color 0.2s' 
                }}
              >
                {/* P-Auftrag Header Row */}
                <div 
                  onClick={() => toggleOrder(pNum)}
                  style={{ 
                    padding: '0.85rem 1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isExpanded ? <ChevronDown size={18} style={{ color: '#94a3b8' }} /> : <ChevronRight size={18} style={{ color: '#94a3b8' }} />}
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>{pNum}</span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>|</span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 500 }}>{articleCount} {articleCount === 1 ? 'Artikel' : 'Artikel'} betroffen</span>
                  </div>

                  <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {totalStepsInP} {totalStepsInP === 1 ? 'Schritt offen' : 'Schritte offen'}
                  </span>
                </div>

                {/* Articles & Steps under this P-Auftrag */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.1)' }}>
                    {Object.keys(articles).map(artKey => {
                      const steps = articles[artKey];

                      return (
                        <div key={artKey} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.85rem' }}>
                          
                          {/* Article Title */}
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>📦 Artikel: <span style={{ color: '#a7f3d0' }}>{artKey}</span></span>
                              {steps[0] && steps[0].articleId && (
                                <button 
                                  onClick={() => {
                                    const list = [];
                                    const seen = new Set();
                                    Object.keys(groupedMissing).forEach(pNum => {
                                      const articlesList = groupedMissing[pNum].articles;
                                      Object.keys(articlesList).forEach(ak => {
                                        const stepsList = articlesList[ak];
                                        if (stepsList[0] && stepsList[0].articleId && !seen.has(stepsList[0].articleId)) {
                                          seen.add(stepsList[0].articleId);
                                          list.push({
                                            articleId: stepsList[0].articleId,
                                            articleName: ak
                                          });
                                        }
                                      });
                                    });
                                    const fixture = steps.find(s => s.fixture)?.fixture || null;
                                    openDmsSlider(steps[0].articleId, artKey, list, fixture);
                                  }}
                                  style={{ 
                                    background: 'rgba(56, 189, 248, 0.1)', 
                                    color: '#38bdf8', 
                                    border: '1px solid rgba(56, 189, 248, 0.2)', 
                                    padding: '0.15rem 0.45rem', 
                                    borderRadius: '4px', 
                                    fontSize: '0.65rem', 
                                    cursor: 'pointer',
                                    fontWeight: 600, 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Zeichnung im DMS Slider öffnen"
                                >
                                  📐 Zeichnung
                                </button>
                              )}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{steps.length} {steps.length === 1 ? 'Schritt' : 'Schritte'}</span>
                          </div>

                          {/* Steps Table */}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#64748b', fontWeight: 600 }}>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>AS</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>Schritt</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>D4-ID</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>Maschine</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>Datum</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>NC-Programm</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>WinTool-Stamm</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}>Vorrichtung</th>
                                </tr>
                              </thead>
                              <tbody>
                                {steps.map((s, idx) => (
                                  <tr key={idx} style={{ borderBottom: idx < steps.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none', color: '#cbd5e1' }}>
                                    <td style={{ padding: '0.5rem', color: '#38bdf8', fontWeight: 700 }}>{s.stepPos || 'N/A'}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{s.stepDesc}</td>
                                    <td style={{ padding: '0.5rem', color: '#64748b' }}>#{s.stepId}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                      {s.isWrongMachine ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{s.machine}</span>
                                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.25rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, width: 'fit-content' }} title="Diese Maschine sollte im Pool (z.B. Pool C40-C42) und nicht direkt im ERP geplant werden!">
                                            ❌ FALSCHE MASCHINE
                                          </span>
                                        </div>
                                      ) : (
                                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>{s.machine}</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{s.dayScheduled}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                      {s.ncProgram ? (
                                        s.matchedType === 'fuzzy' ? (
                                          <code style={{ color: '#facc15', background: 'rgba(234, 179, 8, 0.15)', padding: '0.1rem 0.25rem', borderRadius: '4px', border: '1px dashed #eab308' }} title="Dieses NC-Programm hat keine exakte Übereinstimmung im WinTool-Stamm!">
                                            {s.ncProgram}
                                          </code>
                                        ) : (
                                          <code style={{ color: '#a7f3d0' }}>{s.ncProgram}</code>
                                        )
                                      ) : (
                                        <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>NC not found</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                      {s.matchedListIdent ? (
                                        s.matchedType === 'fuzzy' ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <span style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.65rem', width: 'fit-content' }}>
                                              ⚠️ Abweichung ({Math.round(s.matchedScore * 100)}%)
                                            </span>
                                            <span style={{ color: '#eab308', textDecoration: 'underline dashed' }} title={`Erwartet: ${s.ncProgram} | Gefunden: ${s.matchedListIdent}`}>
                                              {s.matchedListIdent} {s.matchedListNr && <span style={{ color: '#cbd5e1' }}>(#{s.matchedListNr})</span>}
                                            </span>
                                          </div>
                                        ) : (
                                          <span style={{ color: '#cbd5e1' }}>{s.matchedListIdent} {s.matchedListNr && <span style={{ color: '#64748b' }}>(#{s.matchedListNr})</span>}</span>
                                        )
                                      ) : s.ncProgram ? (
                                        s.masterNcProgram && s.masterMatchedListNr ? (
                                          <span style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#fb923c', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(249, 115, 22, 0.2)' }} title={`Im Artikel-Arbeitsplan ist NC ${s.masterNcProgram} hinterlegt, das passt.`}>Stamm fehlt (nur P-Auftrag)</span>
                                        ) : (
                                          <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Auch im Master-Artikel-Arbeitsplan fehlt ein gültiges WinTool-Verzeichnis!">Stamm fehlt (auch Artikel-AP)</span>
                                        )
                                      ) : (
                                        <span style={{ color: '#64748b' }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                      {s.fixture ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ color: '#e9d5ff', fontWeight: 600 }}>🛠️ {s.fixture}</span>
                                          {s.fixtureLocation && (
                                            <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>📍 {s.fixtureLocation}</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>Vorrichtung fehlt</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 9. Most Used Tools View (Meistgenutzte Werkzeuge)
function MostUsedToolsView() {
  const [selectedMachine, setSelectedMachine] = useState('Brother');
  const [pastDays, setPastDays] = useState(30);
  const [futureDays, setFutureDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedTools, setExpandedTools] = useState({});

  const fetchMostUsedTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE}/most-used-tools?machine=${encodeURIComponent(selectedMachine)}&pastDays=${pastDays}&futureDays=${futureDays}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Fehler beim Laden: ${res.statusText}`);
      }
      const json = await res.json();
      setResultData(json);
    } catch (err) {
      console.error('Error fetching most used tools:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMostUsedTools();
  }, []);

  const handleToggleExpand = (toolNr) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolNr]: !prev[toolNr]
    }));
  };

  const machines = [
    { label: 'Brother', value: 'Brother' },
    { label: 'Chiron', value: 'Chiron' },
    { label: 'C400', value: 'C400' },
    { label: 'C40', value: 'C40' },
    { label: 'C42', value: 'C42' },
    { label: 'RS2-1', value: 'RS2_1' },
    { label: 'RS2-2', value: 'RS2_2' },
    { label: 'Alle Maschinen', value: 'All' }
  ];

  const filteredTools = (resultData?.tools || []).filter(tool => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      String(tool.nr).toLowerCase().includes(q) ||
      (tool.ident && tool.ident.toLowerCase().includes(q)) ||
      (tool.desc && tool.desc.toLowerCase().includes(q)) ||
      (tool.keyword && tool.keyword.toLowerCase().includes(q))
    );
  });

  const maxCount = resultData?.tools?.[0]?.count || 1;

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Control Header & Filters */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.2))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            padding: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench size={22} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Meistgenutzte Werkzeuge
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Analyse der Werkzeughäufigkeit über abgearbeitete und eingeplante Arbeitsschritte
            </p>
          </div>
        </div>

        {/* Filter inputs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Machine select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Maschine
            </label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                padding: '0.45rem 0.75rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {machines.map(m => (
                <option style={{ background: '#0f172a', color: '#f8fafc' }} key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Past days */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Vergangenheit (Tage)
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={pastDays}
              onChange={(e) => setPastDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{
                width: '100px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                padding: '0.45rem 0.75rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Future days */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Zukunft (Tage)
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={futureDays}
              onChange={(e) => setFutureDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{
                width: '100px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                padding: '0.45rem 0.75rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Load Button */}
          <button
            onClick={fetchMostUsedTools}
            disabled={loading}
            style={{
              marginTop: '1.1rem',
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '0.5rem 1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Analyse laden
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {resultData && !loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '1rem 1.25rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Gefundene Werkzeuge</span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.6rem', color: '#38bdf8', fontWeight: 700 }}>
              {resultData.uniqueToolsCount}
            </h2>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '1rem 1.25rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Gesamt-Werkzeugeinsätze</span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.6rem', color: '#a855f7', fontWeight: 700 }}>
              {resultData.totalToolUsages}
            </h2>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '1rem 1.25rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Ausgewertete Arbeitsschritte</span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.6rem', color: '#10b981', fontWeight: 700 }}>
              {resultData.totalStepsEvaluated}
            </h2>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '1rem 1.25rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Top 1 Werkzeug</span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {resultData.tools?.[0] ? `${resultData.tools[0].ident} (${resultData.tools[0].count}x)` : 'Keine'}
            </h2>
          </div>
        </div>
      )}

      {/* Quick Search */}
      {resultData && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Werkzeug filtern (Ident, Nr, Bezeichnung)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                outline: 'none'
              }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Zeige {filteredTools.length} von {resultData.uniqueToolsCount} Werkzeugen
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '0.75rem', color: '#38bdf8' }} />
          <p>Lade und analysiere Werkzeuge der Maschine {selectedMachine}...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tool List Table / Cards */}
      {resultData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTools.length === 0 ? (
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-dim)',
              borderRadius: '14px',
              padding: '2.5rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              Keine Werkzeuge für den gewählten Zeitraum und Maschinenfilter gefunden.
            </div>
          ) : (
            filteredTools.map((tool, index) => {
              const isExpanded = !!expandedTools[tool.nr];
              const pct = Math.round((tool.count / maxCount) * 100);

              let rankBadge = `#${index + 1}`;
              if (index === 0) rankBadge = '🥇 #1';
              else if (index === 1) rankBadge = '🥈 #2';
              else if (index === 2) rankBadge = '🥉 #3';

              return (
                <div
                  key={tool.nr}
                  style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    onClick={() => handleToggleExpand(tool.nr)}
                    style={{
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '1rem'
                    }}
                  >
                    {/* Rank & Ident */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1.2, minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: index < 3 ? '#f59e0b' : '#64748b',
                        background: index < 3 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '8px',
                        minWidth: '55px',
                        textAlign: 'center'
                      }}>
                        {rankBadge}
                      </span>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                            {tool.ident || `Werkzeug #${tool.nr}`}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            Nr. {tool.nr}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {tool.desc || 'Keine Beschreibung'}
                        </span>
                      </div>
                    </div>

                    {/* Frequency Progress Bar */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Häufigkeit</span>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>{tool.count}× Nutzungen</span>
                      </div>
                      <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>

                    {/* Stats & Machine Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Arbeitsschritte</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{tool.stepCount} Schritte</span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Aufträge</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{tool.contractCount} Aufträge</span>
                      </div>

                      {tool.isCurrentlyLoaded ? (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#4ade80',
                          background: 'rgba(74, 222, 128, 0.12)',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <CheckCircle2 size={12} /> Magazin
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#64748b',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px'
                        }}>
                          Nicht gerüstet
                        </span>
                      )}

                      <button style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.2rem'
                      }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Sub-table of Steps */}
                  {isExpanded && (
                    <div style={{
                      background: 'rgba(10, 15, 30, 0.6)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '1rem 1.25rem'
                    }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                        Zugeordnete Arbeitsschritte ({tool.steps.length}):
                      </h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <th style={{ padding: '0.4rem 0.6rem' }}>Auftrag</th>
                              <th style={{ padding: '0.4rem 0.6rem' }}>Pos / Schritt</th>
                              <th style={{ padding: '0.4rem 0.6rem' }}>NC-Programm</th>
                              <th style={{ padding: '0.4rem 0.6rem' }}>WinTool-Liste</th>
                              <th style={{ padding: '0.4rem 0.6rem' }}>Datum</th>
                              <th style={{ padding: '0.4rem 0.6rem' }}>Bezeichnung</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tool.steps.map((st, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#cbd5e1' }}>
                                <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: '#38bdf8' }}>{st.contractNumber || '-'}</td>
                                <td style={{ padding: '0.45rem 0.6rem' }}>Pos {st.orderPos || '10'} / AS {st.stepPos}</td>
                                <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'monospace', color: '#a855f7' }}>{st.ncProgram}</td>
                                <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'monospace', color: '#f59e0b' }}>{st.matchedListIdent || '-'}</td>
                                <td style={{ padding: '0.45rem 0.6rem' }}>{st.actionDate || '-'}</td>
                                <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }}>{st.stepDesc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}

// A view listing tools that need to be prepared/built for the planning period
function ToolsPlanningView({ 
  board, 
  selectedMachine, 
  days, 
  machines, 
  getDayName, 
  formatDate,
  setActiveModalStep,
  setIsExplanationCollapsed,
  highlightRobotFlow,
  isFollowedByRobot,
  hideExecuting,
  formatMinutes,
  capacities,
  toolMachineMap = {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState('consolidated'); // 'consolidated' or 'grouped'
  // Filter machines to process
  const machinesToProcess = selectedMachine === 'All' ? machines : [selectedMachine];
  const [expandedTool, setExpandedTool] = useState(null);
  const [toolParts, setToolParts] = useState({}); // toolNr -> Array of parts
  const [loadingParts, setLoadingParts] = useState({}); // toolNr -> boolean
  const [expandedGroupedTool, setExpandedGroupedTool] = useState(null); // machine-day-toolNr
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const [sortKey, setSortKey] = useState('nr'); // 'nr' | 'desc' | 'count'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [showPoolOrders, setShowPoolOrders] = useState(true);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const isPoolMachineSelected = selectedMachine === 'All' || ['RS2_1', 'RS2_2', 'C40', 'C42'].includes(selectedMachine);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOrderDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const allOrders = React.useMemo(() => {
    const orders = new Set();
    machinesToProcess.forEach(mName => {
      days.forEach(day => {
        const daySteps = board[mName]?.[day] || [];
        daySteps.forEach(step => {
          if (step.contractNumber) {
            orders.add(step.contractNumber);
          }
        });
      });
    });
    return Array.from(orders).sort();
  }, [board, machinesToProcess, days]);

  const handleToggleExpand = async (toolNr) => {
    const isExpanded = expandedTool === toolNr;
    setExpandedTool(isExpanded ? null : toolNr);
    
    if (!isExpanded && !toolParts[toolNr]) {
      setLoadingParts(prev => ({ ...prev, [toolNr]: true }));
      try {
        const res = await fetch(`${API_BASE}/tools/${toolNr}/parts`);
        if (res.ok) {
          const parts = await res.json();
          setToolParts(prev => ({ ...prev, [toolNr]: parts }));
        }
      } catch (err) {
        console.error('Error fetching tool parts:', err);
      } finally {
        setLoadingParts(prev => ({ ...prev, [toolNr]: false }));
      }
    }
  };

  const handleGroupedExpandToggle = async (e, machineName, day, toolNr) => {
    e.stopPropagation();
    const key = `${machineName}-${day}-${toolNr}`;
    const isExpanded = expandedGroupedTool === key;
    setExpandedGroupedTool(isExpanded ? null : key);
    
    if (!isExpanded && !toolParts[toolNr]) {
      setLoadingParts(prev => ({ ...prev, [toolNr]: true }));
      try {
        const res = await fetch(`${API_BASE}/tools/${toolNr}/parts`);
        if (res.ok) {
          const parts = await res.json();
          setToolParts(prev => ({ ...prev, [toolNr]: parts }));
        }
      } catch (err) {
        console.error('Error fetching tool parts:', err);
      } finally {
        setLoadingParts(prev => ({ ...prev, [toolNr]: false }));
      }
    }
  };



  // Gather all tool requirements
  const toolRequirements = []; // Array of { tool, machineName, day, step }
  const uniqueToolsMap = new Map(); // toolNr -> aggregated tool info

  machinesToProcess.forEach(mName => {
    days.forEach(day => {
      const daySteps = board[mName]?.[day] || [];
      daySteps.forEach(step => {
        // Filter by selected orders if any are selected
        if (selectedOrders.length > 0 && !selectedOrders.includes(step.contractNumber)) {
          return;
        }

        // Filter by pool orders setting if pool machine is active
        const isFromPool = step.machinePoolId && (!step.machineId || step.machineId === 0);
        if (isPoolMachineSelected && !showPoolOrders && isFromPool) {
          return;
        }

        const stepWithMachine = { ...step, machineName: mName };
        const toolsToLoad = step.directMisses || step.loadTools || [];
        toolsToLoad.forEach(t => {
          toolRequirements.push({
            tool: t,
            machineName: mName,
            day: day,
            step: stepWithMachine
          });

          const key = t.nr;
          if (!uniqueToolsMap.has(key)) {
            uniqueToolsMap.set(key, {
              nr: t.nr,
              desc: t.desc,
              dia: t.dia,
              len: t.len,
              machines: new Set([mName]),
              days: new Set([day]),
              steps: [stepWithMachine],
              count: 1
            });
          } else {
            const existing = uniqueToolsMap.get(key);
            existing.machines.add(mName);
            existing.days.add(day);
            if (!existing.steps.some(st => st.stepId === step.stepId)) {
              existing.steps.push(stepWithMachine);
              existing.count += 1;
            }
          }
        });
      });
    });
  });

  const consolidatedTools = React.useMemo(() => {
    const list = Array.from(uniqueToolsMap.values())
      .filter(t => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return String(t.nr).includes(term) || (t.desc && t.desc.toLowerCase().includes(term));
      });

    list.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'desc') {
        valA = (a.desc || '').toLowerCase();
        valB = (b.desc || '').toLowerCase();
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else if (sortKey === 'count') {
        valA = a.count || 0;
        valB = b.count || 0;
      } else {
        // default: 'nr'
        valA = Number(a.nr) || 0;
        valB = Number(b.nr) || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [uniqueToolsMap, searchTerm, sortKey, sortDirection]);

  // Stats
  const totalUniqueTools = uniqueToolsMap.size;
  const totalSetupOps = toolRequirements.length;
  
  // Find most frequent tool
  let mostFrequentTool = null;
  let maxCount = 0;
  uniqueToolsMap.forEach((val) => {
    if (val.count > maxCount) {
      maxCount = val.count;
      mostFrequentTool = val;
    }
  });

  // Group tool requirements by machine & day
  const groupedData = {};
  machinesToProcess.forEach(mName => {
    groupedData[mName] = {};
    days.forEach(day => {
      groupedData[mName][day] = [];
    });
  });

  toolRequirements.forEach(req => {
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matches = String(req.tool.nr).includes(term) || (req.tool.desc && req.tool.desc.toLowerCase().includes(term));
      if (!matches) return;
    }
    groupedData[req.machineName]?.[req.day]?.push(req);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flexGrow: 1 }}>
      {/* Sub-view Toggle and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
          <button
            onClick={() => setViewType('consolidated')}
            style={{
              background: viewType === 'consolidated' ? 'var(--primary-gradient)' : 'transparent',
              color: viewType === 'consolidated' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={14} />
            <span>Konsolidierte Werkzeugliste</span>
          </button>
          <button
            onClick={() => setViewType('grouped')}
            style={{
              background: viewType === 'grouped' ? 'var(--primary-gradient)' : 'transparent',
              color: viewType === 'grouped' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s'
            }}
          >
            <CalendarRange size={14} />
            <span>Nach Maschine & Tag</span>
          </button>
        </div>

        {/* Search & Order Filter Wrapper */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Order Multiselect Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOrderDropdownOpen(prev => !prev)}
              style={{
                background: 'rgba(13, 20, 35, 0.4)',
                border: '1px solid var(--border-dim)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.8rem',
                padding: '0.4rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '180px',
                justifyContent: 'space-between',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => { if (!orderDropdownOpen) e.currentTarget.style.borderColor = 'var(--border-dim)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                <Layers size={12} style={{ color: '#fbbf24' }} />
                <span>
                  {selectedOrders.length === 0 
                    ? 'Alle Aufträge' 
                    : selectedOrders.length === 1 
                    ? `1 Auftrag: ${selectedOrders[0]}` 
                    : `${selectedOrders.length} Aufträge`}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: '#64748b', transform: orderDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {orderDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 5px)',
                right: 0,
                background: '#0a0f1d',
                border: '1px solid var(--border-dim)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                width: '280px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Search inside Dropdown */}
                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-dim)', position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Auftrag suchen..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.5rem 0.3rem 1.75rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.01)' }}>
                  <button
                    onClick={() => setSelectedOrders([])}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Alle abwählen
                  </button>
                  <button
                    onClick={() => setSelectedOrders([...allOrders])}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Alle auswählen
                  </button>
                </div>

                {/* Options List */}
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0.25rem' }}>
                  {allOrders
                    .filter(ord => ord.toLowerCase().includes(orderSearchTerm.toLowerCase()))
                    .map(ord => {
                      const isChecked = selectedOrders.includes(ord);
                      return (
                        <label
                          key={ord}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: isChecked ? '#fff' : '#cbd5e1',
                            background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                            userSelect: 'none',
                            transition: 'all 0.1s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedOrders(prev => prev.filter(x => x !== ord));
                              } else {
                                setSelectedOrders(prev => [...prev, ord]);
                              }
                            }}
                            style={{ accentColor: '#3b82f6', width: '13px', height: '13px', cursor: 'pointer' }}
                          />
                          <span>{ord}</span>
                        </label>
                      );
                    })}
                  {allOrders.filter(ord => ord.toLowerCase().includes(orderSearchTerm.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.72rem', textAlign: 'center', fontStyle: 'italic' }}>
                      Keine Aufträge gefunden
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pool orders toggle (only for pool machines) */}
          {isPoolMachineSelected && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: '#c084fc', fontSize: '0.8rem', height: '36px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)'}>
              <input
                type="checkbox"
                checked={showPoolOrders}
                onChange={(e) => setShowPoolOrders(e.target.checked)}
                style={{ width: '14px', height: '14px', accentColor: '#a855f7', cursor: 'pointer' }}
              />
              <span>Pool-Aufträge</span>
            </label>
          )}

          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Werkzeug suchen (Nr. oder Bez.)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(13, 20, 35, 0.4)',
              border: '1px solid var(--border-dim)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.8rem',
              padding: '0.4rem 0.75rem 0.4rem 2rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-dim)'}
          />
          {searchTerm && (
            <X 
              size={12} 
              onClick={() => setSearchTerm('')} 
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', cursor: 'pointer' }} 
            />
          )}
        </div>
      </div>
    </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-dim)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flex: '1 1 200px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#38bdf8', padding: '0.75rem', borderRadius: '10px' }}>
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aufzubauende Werkzeuge</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{totalUniqueTools}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-dim)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flex: '1 1 200px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '0.75rem', borderRadius: '10px' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gesamt-Rüstbeladungen</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{totalSetupOps}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-dim)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flex: '1 1 250px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '0.75rem', borderRadius: '10px' }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Häufigster Rüstbedarf</div>
            {mostFrequentTool ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>T{mostFrequentTool.nr}</span>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={mostFrequentTool.desc}>{mostFrequentTool.desc}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({mostFrequentTool.count}x)</span>
              </div>
            ) : (
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#cbd5e1' }}>-</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewType === 'consolidated' ? (
        /* Consolidated Table View */
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-dim)' }}>
          {consolidatedTools.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Keine Werkzeuge entsprechen dem Suchfilter oder müssen in diesem Zeitraum gerüstet werden.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-dim)' }}>
                    <th 
                      onClick={() => handleSort('nr')}
                      style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8', width: '120px', cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>T-Nummer</span>
                        <span style={{ color: sortKey === 'nr' ? '#fbbf24' : '#475569', fontSize: '0.65rem' }}>
                          {sortKey === 'nr' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('desc')}
                      style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>Werkzeugbezeichnung</span>
                        <span style={{ color: sortKey === 'desc' ? '#fbbf24' : '#475569', fontSize: '0.65rem' }}>
                          {sortKey === 'desc' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                        </span>
                      </div>
                    </th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8', width: '130px' }}>Dimensionen</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8' }}>Einsatz-Maschinen</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8' }}>Aktueller Ort</th>
                    <th 
                      onClick={() => handleSort('count')}
                      style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8', width: '120px', textAlign: 'center', cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <span>Bedarfe</span>
                        <span style={{ color: sortKey === 'count' ? '#fbbf24' : '#475569', fontSize: '0.65rem' }}>
                          {sortKey === 'count' ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                        </span>
                      </div>
                    </th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#94a3b8', width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedTools.map((t, idx) => {
                    const isExpanded = expandedTool === t.nr;
                    return (
                      <React.Fragment key={t.nr}>
                        <tr 
                          onClick={() => handleToggleExpand(t.nr)}
                          style={{ 
                            borderBottom: '1px solid var(--border-dim)', 
                            background: isExpanded ? 'rgba(59, 130, 246, 0.04)' : idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                          onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'; }}
                        >
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>
                            <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                              T{t.nr}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#fff', fontWeight: 500 }}>
                            {t.desc || <span style={{ color: '#475569', fontStyle: 'italic' }}>Keine Beschreibung</span>}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                            {((t.dia && t.dia !== 0 && t.dia !== '0') || (t.len && t.len !== 0 && t.len !== '0')) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.75rem' }}>
                                {t.dia && t.dia !== '0' && t.dia !== 0 && <span>Ø {t.dia} mm</span>}
                                {t.len && t.len !== '0' && t.len !== 0 && <span>L {t.len} mm</span>}
                              </div>
                            ) : (
                              <span style={{ color: '#475569' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {Array.from(t.machines).map(m => {
                                const hasPoolStep = t.steps.some(st => st.machineName === m && st.machinePoolId && (!st.machineId || st.machineId === 0));
                                return (
                                  <div key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.15rem 0.35rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ color: '#cbd5e1', fontSize: '0.68rem', fontWeight: 600 }}>
                                      {m}
                                    </span>
                                    {hasPoolStep && (
                                      <span style={{ fontSize: '0.55rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.05rem 0.2rem', borderRadius: '3px', fontWeight: 700 }} title="Wurde für mindestens einen Pool-Auftrag auf dieser Maschine eingeplant">
                                        Pool
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {toolMachineMap[t.nr] && toolMachineMap[t.nr].length > 0 ? (
                                toolMachineMap[t.nr].map(m => (
                                  <span key={m} style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.15rem 0.35rem', borderRadius: '6px', fontWeight: 600 }}>
                                    {m}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: '#475569', fontSize: '0.75rem' }}>-</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {t.count}x
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            {isExpanded ? <ChevronUp size={16} style={{ color: '#94a3b8' }} /> : <ChevronDown size={16} style={{ color: '#94a3b8' }} />}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                            <td colSpan={6} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-dim)' }}>
                              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                {/* Left Column: Jobs */}
                                <div style={{ flex: '1 1 350px' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                                    Benötigt für folgende Belegungen ({t.steps.length}):
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                    {t.steps.map((st, sIdx) => {
                                      const parentDay = days.find(d => (board[st.machineName]?.[d] || []).some(x => x.stepId === st.stepId));
                                      return (
                                        <div 
                                          key={sIdx} 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveModalStep(st);
                                            setIsExplanationCollapsed(true);
                                          }}
                                          style={{ 
                                            background: 'rgba(13, 20, 35, 0.5)', 
                                            border: '1px solid rgba(255,255,255,0.04)', 
                                            padding: '0.5rem 0.75rem', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.2rem'
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; e.currentTarget.style.background = 'rgba(13, 20, 35, 0.8)'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.background = 'rgba(13, 20, 35, 0.5)'; }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem' }}>{st.contractNumber}</span>
                                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                              {st.machinePoolId && (!st.machineId || st.machineId === 0) && (
                                                <span style={{ fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 600 }} title="Auftrag wurde automatisch aus einem Maschinenpool zugewiesen">
                                                  Pool
                                                </span>
                                              )}
                                              <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.05rem 0.25rem', borderRadius: '3px' }}>
                                                {st.machineName || `Maschine #${st.machineId}`}
                                              </span>
                                            </div>
                                          </div>
                                          <div style={{ color: '#cbd5e1', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            Pos {st.stepPos}: {st.stepDesc}
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#64748b', marginTop: '0.1rem' }}>
                                            <span>Rüst: {Math.round(st.setupTime)}m | Prod: {Math.round(st.prodTime)}m</span>
                                            {parentDay && <span style={{ color: '#94a3b8', fontWeight: 500 }}>{getDayName(parentDay)} ({formatDate(parentDay)})</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Right Column: Components */}
                                <div style={{ flex: '1 1 350px' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
                                    Benötigte Komponenten (WinTool-Stückliste):
                                  </div>
                                  {loadingParts[t.nr] ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', padding: '1rem', background: 'rgba(13,20,35,0.3)', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                                      <RefreshCw size={14} className="animate-spin" style={{ color: '#fbbf24' }} />
                                      <span>Komponenten werden geladen...</span>
                                    </div>
                                  ) : toolParts[t.nr] && toolParts[t.nr].length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                      {toolParts[t.nr].map((p, pIdx) => (
                                        <div 
                                          key={pIdx} 
                                          style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.75rem', 
                                            fontSize: '0.72rem', 
                                            background: 'rgba(13, 20, 35, 0.4)', 
                                            padding: '0.45rem 0.65rem', 
                                            borderRadius: '6px', 
                                            border: '1px solid rgba(255,255,255,0.02)'
                                          }}
                                        >
                                          <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                                            {p.partQty}x
                                          </span>
                                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.partDesc}>{p.partDesc || 'Keine Beschreibung'}</span>
                                          </div>
                                          {p.partKeyWord && (
                                            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.62rem', background: 'rgba(255,255,255,0.04)', padding: '0.08rem 0.35rem', borderRadius: '4px', flexShrink: 0 }}>
                                              {p.partKeyWord}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', padding: '1.5rem', background: 'rgba(13,20,35,0.2)', borderRadius: '8px', border: '1px dashed var(--border-dim)', textAlign: 'center', fontStyle: 'italic' }}>
                                      Keine Komponenten-Stückliste in WinTool hinterlegt.
                                    </div>
                                  )}
                                </div>
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
          )}
        </div>
      ) : selectedMachine !== 'All' ? (
        /* Detailed Single Machine Kanban View but listing tools instead of steps */
        <div className="kanban-board">
          {days.map(day => {
            const dayReqs = groupedData[selectedMachine]?.[day] || [];
            
            // Unique tools for this column
            const dayToolsMap = new Map();
            dayReqs.forEach(req => {
              const key = req.tool.nr;
              if (!dayToolsMap.has(key)) {
                dayToolsMap.set(key, {
                  tool: req.tool,
                  steps: [req.step]
                });
              } else {
                const existing = dayToolsMap.get(key);
                if (!existing.steps.some(x => x.stepId === req.step.stepId)) {
                  existing.steps.push(req.step);
                }
              }
            });
            const uniqueDayTools = Array.from(dayToolsMap.values());

            return (
              <div key={day} className="kanban-column">
                <div className="column-header">
                  <div className="day-name">{getDayName(day)}</div>
                  <div className="day-date">{formatDate(day)}</div>
                  <div className="column-summary" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>
                      {uniqueDayTools.length} {uniqueDayTools.length === 1 ? 'Werkzeug' : 'Werkzeuge'} aufzubauen
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.65rem' }}>
                      (für {dayReqs.map(r => r.step.stepId).filter((val, i, arr) => arr.indexOf(val) === i).length} Aufträge)
                    </div>
                  </div>
                </div>

                <div className="column-content">
                  {uniqueDayTools.length === 0 ? (
                    <div className="empty-column-state" style={{ color: '#10b981' }}>✓ Alle Werkzeuge auf Maschine</div>
                  ) : (
                    uniqueDayTools.map(({ tool, steps }, idx) => (
                      <div
                        key={`${tool.nr}-${idx}`}
                        className="kanban-card"
                        style={{
                          padding: '0.65rem',
                          borderLeft: '3px solid #fbbf24',
                          background: 'var(--bg-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            T{tool.nr}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            Ø{tool.dia || '-'} / L{tool.len || '-'}
                          </span>
                        </div>
                        <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tool.desc}>
                          {tool.desc || 'Keine Beschreibung'}
                        </div>
                        {toolMachineMap && toolMachineMap[tool.nr] && toolMachineMap[tool.nr].length > 0 && (
                          <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.05rem', marginBottom: '0.05rem' }}>
                            <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500 }}>Aktuell in:</span>
                            {toolMachineMap[tool.nr].map(m => (
                              <span key={m} style={{ fontSize: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.02rem 0.2rem', borderRadius: '3px', fontWeight: 600 }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ borderTop: '1px dashed var(--border-dim)', paddingTop: '0.3rem', marginTop: '0.15rem' }}>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.15rem' }}>Benötigt für:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.35rem' }}>
                            {steps.map((st, stIdx) => (
                              <div
                                key={stIdx}
                                onClick={() => {
                                  setActiveModalStep(st);
                                  setIsExplanationCollapsed(true);
                                }}
                                style={{
                                  fontSize: '0.65rem',
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={`${st.contractNumber} (Pos ${st.stepPos}): ${st.stepDesc}`}
                              >
                                {st.contractNumber} ({st.stepDesc.substring(0, 12)}...)
                              </div>
                            ))}
                          </div>

                          {/* Components Accordion inside Card */}
                          <div style={{ borderTop: '1px dotted rgba(255,255,255,0.06)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                            <button
                              onClick={(e) => handleGroupedExpandToggle(e, selectedMachine, day, tool.nr)}
                              style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#fbbf24',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0',
                                outline: 'none'
                              }}
                            >
                              <span>🔧 Komponenten ({toolParts[tool.nr] ? toolParts[tool.nr].length : '?'})</span>
                              {expandedGroupedTool === `${selectedMachine}-${day}-${tool.nr}` ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                            
                            {expandedGroupedTool === `${selectedMachine}-${day}-${tool.nr}` && (
                              <div style={{ marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.1rem' }}>
                                {loadingParts[tool.nr] ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.58rem', color: '#94a3b8' }}>
                                    <RefreshCw size={10} className="animate-spin" />
                                    <span>Lade...</span>
                                  </div>
                                ) : toolParts[tool.nr] && toolParts[tool.nr].length > 0 ? (
                                  toolParts[tool.nr].map((p, pIdx) => (
                                    <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.58rem', background: 'rgba(0,0,0,0.15)', padding: '0.15rem 0.25rem', borderRadius: '3px', overflow: 'hidden' }}>
                                      <span style={{ color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>{p.partQty}x</span>
                                      <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.partDesc}>{p.partDesc || 'Keine Beschreibung'}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ fontSize: '0.58rem', color: '#64748b', fontStyle: 'italic' }}>Keine Stückliste</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Swimlane Matrix View showing tools */
        <div className="swimlane-view card">
          <div className="swimlane-grid">
            {/* Header Row */}
            <div className="grid-row header-row" style={{ gridTemplateColumns: `180px repeat(${days.length}, 1fr)`, position: 'sticky', top: 0, zIndex: 10, background: '#0c1220', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
              <div className="grid-cell machine-cell header-cell" style={{ fontWeight: 700 }}>Maschine</div>
              {days.map(day => (
                <div key={day} className="grid-cell header-cell">
                  <div className="day-name">{getDayName(day)}</div>
                  <div className="day-date">{formatDate(day)}</div>
                </div>
              ))}
            </div>

            {/* Content Rows */}
            {machines.map(mName => {
              return (
                <div key={mName} className="grid-row content-row" style={{ gridTemplateColumns: `180px repeat(${days.length}, 1fr)` }}>
                  <div className="grid-cell machine-cell" onClick={() => setSelectedMachine(mName)}>
                    <div className="machine-title">{mName}</div>
                    <div className="machine-click-hint">Filter anwenden</div>
                  </div>
                
                  {days.map(day => {
                    const dayReqs = groupedData[mName]?.[day] || [];
                    
                    // Deduplicate tools for display inside cell
                    const dayToolsMap = new Map();
                    dayReqs.forEach(r => {
                      const key = r.tool.nr;
                      if (!dayToolsMap.has(key)) {
                        dayToolsMap.set(key, r.tool);
                      }
                    });
                    const uniqueDayTools = Array.from(dayToolsMap.values());

                    return (
                      <div 
                        key={day} 
                        className="grid-cell cell-content" 
                        onClick={() => setSelectedMachine(mName)} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.35rem', 
                          justifyContent: 'flex-start', 
                          paddingTop: '0.65rem' 
                        }}
                      >
                        {/* Cell Day Header */}
                        <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.2rem', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', width: '100%', textTransform: 'uppercase', letterSpacing: '0.02em', pointerEvents: 'none', userSelect: 'none' }}>
                          <span style={{ color: '#38bdf8' }}>{getDayName(day)}</span>
                          <span>{formatDate(day)}</span>
                        </div>
                        
                        {uniqueDayTools.length === 0 ? (
                          <div className="grid-empty" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.1)' }}>✓ 0 Wz.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fbbf24' }}>
                              {uniqueDayTools.length} {uniqueDayTools.length === 1 ? 'Wz.' : 'Wz.'}:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                              {uniqueDayTools.map(t => (
                                <span 
                                  key={t.nr} 
                                  title={`${t.desc || 'Keine Beschreibung'}${toolMachineMap && toolMachineMap[t.nr] && toolMachineMap[t.nr].length > 0 ? `\n(Aktuell geladen in: ${toolMachineMap[t.nr].join(', ')})` : ''}`}
                                  style={{ 
                                    background: 'rgba(245, 158, 11, 0.15)', 
                                    color: '#fbbf24', 
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '4px',
                                    padding: '0.08rem 0.25rem',
                                    fontSize: '0.62rem',
                                    fontWeight: 700
                                  }}
                                >
                                  T{t.nr}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 7. Planning Tab (Kanban Board for next 5 working days)
function PlanningTab({ mode = 'machining', isListMode = false, isConflictMode = false }) {
  const isDocker = import.meta.env.VITE_API_BASE === '/api' || window.location.port === '2005';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [optimize, setOptimize] = useState(true);
  const [optimizeNightRun, setOptimizeNightRun] = useState(true);
  const [optimizeFixture, setOptimizeFixture] = useState(true);
  const [fixtureWeight, setFixtureWeight] = useState(50); // weighting slider (0 = tools only, 50 = balanced standard, 100 = fixtures only)
  const [tempFixtureWeight, setTempFixtureWeight] = useState(50);
  const [allowLookahead, setAllowLookahead] = useState(true);
  const [dbMode, setDbModeState] = useState('dev');
  const [daysCount, setDaysCount] = useState(5);
  const [poolOptimization, setPoolOptimization] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    setTempFixtureWeight(fixtureWeight);
  }, [fixtureWeight]);

  useEffect(() => {
    fetch(`${API_BASE}/db-mode`)
      .then(res => res.json())
      .then(json => setDbModeState(json.mode))
      .catch(err => console.error('Error fetching DB mode:', err));
  }, []);
  const [selectedMachine, setSelectedMachine] = useState('All');
  const [activeModalStep, setActiveModalStep] = useState(null);
  const [isExplanationCollapsed, setIsExplanationCollapsed] = useState(true);
  const [hideExecuting, setHideExecuting] = useState(false);
  const [algo, setAlgo] = useState('greedy');
  const [expandedCards, setExpandedCards] = useState({});
  const [fullRoutingSteps, setFullRoutingSteps] = useState([]);
  const [loadingRouting, setLoadingRouting] = useState(false);
  const [modalBookings, setModalBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [hoveredStepId, setHoveredStepId] = useState(null);
  const [weeklyToolsModal, setWeeklyToolsModal] = useState(null);
  const [kanbanFullscreen, setKanbanFullscreen] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  // d.velop DMS Drawing Slider States
  const [dmsSliderOpen, setDmsSliderOpen] = useState(false);
  const [dmsSliderList, setDmsSliderList] = useState([]);
  const [dmsSliderIndex, setDmsSliderIndex] = useState(0);
  const [useNativePdf, setUseNativePdf] = useState(true);
  const [dmsSliderFullscreen, setDmsSliderFullscreen] = useState(false);

  // Sub-documents per article states
  const [dmsSubDocs, setDmsSubDocs] = useState([]);
  const [dmsSubIndex, setDmsSubIndex] = useState(0);
  const [loadingDmsMeta, setLoadingDmsMeta] = useState(false);
  const [dmsResolvedArticleNumber, setDmsResolvedArticleNumber] = useState('');

  const [dmsSliderFixture, setDmsSliderFixture] = useState(null);

  const openDmsSlider = (articleId, articleName, customList = null, fixture = null) => {
    setDmsSliderFixture(fixture || null);
    setDmsResolvedArticleNumber('');
    if (customList && customList.length > 0) {
      setDmsSliderList(customList);
      const idx = customList.findIndex(item => item.articleId === articleId);
      setDmsSliderIndex(idx >= 0 ? idx : 0);
    } else {
      setDmsSliderList([{ articleId, articleName }]);
      setDmsSliderIndex(0);
    }
    setDmsSliderOpen(true);
  };

  const closeActiveModal = () => {
    setActiveModalStep(null);
    setDmsSliderOpen(false);
    setDmsSliderFullscreen(false);
  };

  const fetchDmsMetadata = async (articleId, fixture = null) => {
    try {
      setLoadingDmsMeta(true);
      setDmsSubDocs([]);
      setDmsSubIndex(0);
      setDmsResolvedArticleNumber('');
      
      let url = `${API_BASE}/dms/drawing/${encodeURIComponent(articleId)}/meta`;
      if (fixture) {
        url += `?fixture=${encodeURIComponent(fixture)}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.documents) {
          setDmsSubDocs(data.documents);
        }
        if (data.resolvedArticleNumber) {
          setDmsResolvedArticleNumber(data.resolvedArticleNumber);
        }
      }
    } catch (err) {
      console.error("Error loading DMS sub documents:", err);
    } finally {
      setLoadingDmsMeta(false);
    }
  };

  useEffect(() => {
    if (dmsSliderOpen && dmsSliderList.length > 0) {
      const currentItem = dmsSliderList[dmsSliderIndex];
      if (currentItem && currentItem.articleId) {
        fetchDmsMetadata(currentItem.articleId, dmsSliderFixture);
      }
    }
  }, [dmsSliderOpen, dmsSliderList, dmsSliderIndex, dmsSliderFixture]);

  const [highlightRobotFlow, setHighlightRobotFlow] = useState(false);
  const [conflictNightRunOnly, setConflictNightRunOnly] = useState(false);
  const [conflictSortByNightRun, setConflictSortByNightRun] = useState(false);
  const [conflictRobotFlowOnly, setConflictRobotFlowOnly] = useState(false);
  const [conflictSortByRobotFlow, setConflictSortByRobotFlow] = useState(false);
  const abortControllerRef = useRef(null);

  const cancelPlanningCalculation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isFollowedByRobot = (step) => {
    if (!step || !step.entireArbeitsplan || !Array.isArray(step.entireArbeitsplan)) return false;
    const plan = step.entireArbeitsplan;
    const currIdx = plan.findIndex(p => p.stepId === step.stepId || String(p.stepPos).trim() === String(step.stepPos).trim());
    if (currIdx !== -1) {
      for (let i = currIdx + 1; i < plan.length; i++) {
        const nextStep = plan[i];
        if (!nextStep) continue;
        const mName = (nextStep.machineName || '').trim();
        const isMachineStep = mName !== '' && 
                              !mName.includes('Sonstige') && 
                              !mName.includes('Extern') && 
                              !mName.includes('Unbekannt') &&
                              !mName.includes('Handarbeit') &&
                              !mName.includes('Entgraten') &&
                              !mName.includes('Montage') &&
                              !mName.includes('Versand');
        if (isMachineStep) {
          const nameUpper = mName.toUpperCase();
          return nameUpper.includes('RS2') || 
                 nameUpper.includes('ROBO') || 
                 (nameUpper.includes('C40') && !nameUpper.includes('C400')) || 
                 nameUpper.includes('C42');
        }
      }
    }
    return false;
  };

  const toggleCardDetails = (e, stepId) => {
    e.stopPropagation();
    setExpandedCards(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  useEffect(() => {
    if (!activeModalStep) {
      setFullRoutingSteps([]);
      setModalBookings([]);
      return;
    }

    const loadFullRouting = async () => {
      setLoadingRouting(true);
      try {
        const res = await fetch(`${API_BASE}/orders/${activeModalStep.orderId}/steps`);
        if (res.ok) {
          const json = await res.json();
          const mapped = json.map(op => ({
            stepId: op.StepId,
            stepPos: op.StepPos,
            stepDesc: (op.StepDesc || '').trim(),
            setupTime: op.SetupTime || 0,
            prodTime: op.ProdTime || 0,
            isCompleted: op.SPKO === 4,
            isExecuting: op.SPKO === 2,
            machineName: op.MachineName || (op.MachineId ? `Maschine #${op.MachineId}` : 'Pool'),
            color: op.SPKO === 4 ? 'Green' : op.SPKO === 2 ? 'Yellow' : 'Blue',
            stepTyp: op.StepTyp,
            stepTypName: op.StepTypName
          }));
          setFullRoutingSteps(mapped);
        }
      } catch (err) {
        console.error('Error fetching full routing steps:', err);
      } finally {
        setLoadingRouting(false);
      }
    };

    const loadStepBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await fetch(`${API_BASE}/planning/step-bookings?stepId=${activeModalStep.stepId}`);
        if (res.ok) {
          const json = await res.json();
          setModalBookings(json);
        } else {
          setModalBookings([]);
        }
      } catch (err) {
        console.error('Error fetching step bookings:', err);
        setModalBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadFullRouting();
    loadStepBookings();
  }, [activeModalStep]);

  const handleMachineOverride = async (machineName) => {
    if (!activeModalStep) return;
    try {
      const res = await fetch(`${API_BASE}/planning/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: activeModalStep.stepId,
          machine: machineName || null
        })
      });
      if (!res.ok) {
        throw new Error('Fehler beim Speichern der Übersteuerung');
      }
      // Update local modal state immediately
      setActiveModalStep(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          manualMachineOverride: machineName || null
        };
      });
      // Recalculate board planning
      fetchPlanningData();
    } catch (err) {
      console.error('Error override machine:', err);
      alert('Fehler beim Zuweisen der Maschine: ' + err.message);
    }
  };

  const renderOverrideButtons = () => {
    if (!activeModalStep) return null;

    const { machinePoolId, machineId, manualMachineOverride } = activeModalStep;

    let options = [];
    let title = "";

    if (machinePoolId === 9 || machinePoolId === 12 || machineId === 5 || machineId === 6) {
      title = "RS2 Pool";
      options = [
        { label: 'Auto', value: null },
        { label: 'RS2-1', value: 'RS2_1' },
        { label: 'RS2-2', value: 'RS2_2' }
      ];
    } else if (machinePoolId === 13 || machineId === 4 || machineId === 25) {
      title = "C40-C42 Pool";
      options = [
        { label: 'Auto', value: null },
        { label: 'C40', value: 'C40' },
        { label: 'C42', value: 'C42' }
      ];
    } else if (machineId === 21 || machineId === 8) {
      title = "Chiron/Brother";
      options = [
        { label: 'Auto', value: null },
        { label: 'Chiron', value: 'Chiron' },
        { label: 'Brother', value: 'Brother' }
      ];
    }

    if (options.length === 0) return null;

    const currentVal = manualMachineOverride || null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Zuweisung ({title})
        </span>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '2px', overflow: 'hidden' }}>
          {options.map((opt) => {
            const isActive = currentVal === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => handleMachineOverride(opt.value)}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  margin: 0
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const fetchPlanningData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const calculatedWeight = (fixtureWeight <= 50 
        ? (fixtureWeight / 50) * 1.5 
        : 1.5 + ((fixtureWeight - 50) / 50) * 8.5
      ).toFixed(2);
      let url = `${API_BASE}/planning?optimize=${optimize}&optimizeNightRun=${optimizeNightRun}&algo=${algo}&optimizeFixture=${optimizeFixture}&fixtureWeight=${calculatedWeight}&allowLookahead=${allowLookahead}&daysCount=${daysCount}`;
      if (isConflictMode) {
        url += `&isConflictMode=true`;
      }
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (searchQuery) {
        url += `&searchQuery=${encodeURIComponent(searchQuery)}`;
      }
      const res = await fetch(url, { signal: abortControllerRef.current.signal });
      if (!res.ok) {
        throw new Error(`Fehler beim Laden: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
      if (json.days && json.days.length > 0 && !startDate) {
        setStartDate(json.days[0]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Planning fetch aborted by user.');
        return;
      }
      console.error('Error fetching planning data:', err);
      setError(err.message);
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPlanningData();
  }, [optimize, optimizeNightRun, algo, optimizeFixture, fixtureWeight, allowLookahead, daysCount, searchQuery]);


  const handleDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleApplyDate = () => {
    fetchPlanningData();
  };

  const handleClearCacheAndReload = async () => {
    setLoading(true);
    setError(null);
    try {
      const clearRes = await fetch(`${API_BASE}/clear-cache`, { method: 'POST' });
      if (!clearRes.ok) {
        throw new Error('Fehler beim Löschen des Caches.');
      }
      await fetchPlanningData();
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleToggleDbMode = async () => {
    const targetMode = dbMode === 'live' ? 'dev' : 'live';
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/db-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: targetMode })
      });
      if (!res.ok) {
        throw new Error('Fehler beim Umschalten der Datenbank.');
      }
      const json = await res.json();
      setDbModeState(json.mode);
      await fetchPlanningData();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem', color: '#94a3b8' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span>Planungsdaten werden berechnet & rüstoptimiert...</span>
        <button
          onClick={cancelPlanningCalculation}
          className="btn btn-secondary"
          style={{
            marginTop: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontSize: '0.75rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
        >
          Berechnung abbrechen
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', margin: '2rem 0' }}>
        <AlertTriangle size={32} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h3 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>Verbindungsfehler</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={refetch} className="btn btn-primary">Erneut versuchen</button>
      </div>
    );
  }

  const { days: rawDays = [], machines: rawMachines = [], board = {}, capacities = {} } = data || {};
  const allDays = rawDays.includes('Überlauf') ? rawDays : [...rawDays, 'Überlauf'];
  const days = allDays.filter(day => {
    if (day === 'Überlauf') {
      return true; // Im Modus "Planung Maschinen" Spalte Überlauf immer anzeigen
    }
    if (selectedMachine === 'All') {
      return Object.keys(board).some(mName => (board[mName]?.[day] || []).length > 0);
    } else {
      return (board[selectedMachine]?.[day] || []).length > 0;
    }
  });

  const machines = mode === 'deburring'
    ? ['Entgraten', 'Laser', 'Messmaschine', 'Montage', 'Montage UR5', 'Prüfplanung', 'Versand']
    : ['Brother', 'Chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2'];

  const getDayName = (dateStr) => {
    if (dateStr === 'Überlauf') return 'Überlauf';
    const d = new Date(dateStr);
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return dayNames[d.getDay()];
  };

  const formatDate = (dateStr) => {
    if (dateStr === 'Überlauf') return 'Postponed backlog';
    if (!dateStr) return '';
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.`;
    }
    return dateStr;
  };

  const getPredecessorForStep = (step) => {
    if (!step || !data || !data.board) return null;
    for (let m of Object.keys(data.board)) {
      for (let d of Object.keys(data.board[m])) {
        const list = data.board[m][d] || [];
        const idx = list.findIndex(s => s.stepId === step.stepId);
        if (idx !== -1) {
          return idx > 0 ? list[idx - 1] : null;
        }
      }
    }
    return null;
  };

  const getStepsUntilNextUseVal = (tNr, step) => {
    if (!step || !data || !data.board) return Infinity;
    let sequence = [];
    const days = [...(data.days || []), 'Überlauf'];
    for (let m of Object.keys(data.board)) {
      const seq = [];
      let found = false;
      for (let d of days) {
        const list = data.board[m][d] || [];
        seq.push(...list);
        if (list.some(s => s.stepId === step.stepId)) found = true;
      }
      if (found) {
        sequence = seq;
        break;
      }
    }
    if (sequence.length === 0) return Infinity;
    const currentIdx = sequence.findIndex(s => s.stepId === step.stepId);
    if (currentIdx === -1) return Infinity;
    for (let i = currentIdx + 1; i < sequence.length; i++) {
      const nextStep = sequence[i];
      const nextNeeded = [...(nextStep.directMisses || []), ...(nextStep.directHits || [])].map(nt => nt.nr);
      if (nextNeeded.includes(tNr)) return i - currentIdx;
    }
    return Infinity;
  };

  const getWeeklyNextUseIndex = (tNr, machineName) => {
    if (!machineName || !data || !data.board) return Infinity;
    const sequence = [];
    const days = [...(data.days || []), 'Überlauf'];
    for (let d of days) {
      const list = data.board[machineName]?.[d] || [];
      sequence.push(...list);
    }
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      const needed = [...(step.directMisses || []), ...(step.directHits || [])].map(nt => nt.nr);
      if (needed.includes(tNr)) return i;
    }
    return Infinity;
  };

  const getWeeklyToolLifetimeInfo = (tNr, machineName) => {
    if (!machineName || !data || !data.board) return "";
    const sequence = [];
    const days = [...(data.days || []), 'Überlauf'];
    for (let d of days) {
      const list = data.board[machineName]?.[d] || [];
      sequence.push(...list);
    }
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      const needed = [...(step.directMisses || []), ...(step.directHits || [])].map(nt => nt.nr);
      if (needed.includes(tNr)) {
        const label = step.contractNumber || `Auftrag #${step.orderId}`;
        return `Wird bei Schritt ${i + 1} (${label}) wieder benötigt`;
      }
    }
    return "Wird in dieser Woche nicht mehr benötigt";
  };

  const getToolLifetimeInfo = (t, step, type) => {
    if (!step || !data || !data.board) return "";
    
    // Find the sequence of steps on this machine
    let machineName = null;
    let sequence = [];
    const days = [...(data.days || []), 'Überlauf'];
    
    for (let m of Object.keys(data.board)) {
      const seq = [];
      let found = false;
      for (let d of days) {
        const list = data.board[m][d] || [];
        seq.push(...list);
        if (list.some(s => s.stepId === step.stepId)) {
          found = true;
        }
      }
      if (found) {
        machineName = m;
        sequence = seq;
        break;
      }
    }

    if (sequence.length === 0) return "";
    const currentIdx = sequence.findIndex(s => s.stepId === step.stepId);
    if (currentIdx === -1) return "";

    if (type === 'rein') {
      let stepsDuration = null;
      for (let i = currentIdx; i < sequence.length; i++) {
        const futureStep = sequence[i];
        const futureUnloaded = (futureStep.unloadTools || []).map(ut => ut.nr);
        if (futureUnloaded.includes(t.nr)) {
          stepsDuration = i - currentIdx;
          break;
        }
      }
      if (stepsDuration === null) {
        return "Bleibt bis Planungsende geladen";
      } else if (stepsDuration === 0) {
        return "Wird danach wieder entladen";
      } else {
        return `Bleibt für ${stepsDuration + 1} Schritte geladen`;
      }
    } else if (type === 'raus') {
      let stepsUntilNextUse = null;
      for (let i = currentIdx + 1; i < sequence.length; i++) {
        const nextStep = sequence[i];
        const nextNeeded = [...(nextStep.directMisses || []), ...(nextStep.directHits || [])].map(nt => nt.nr);
        if (nextNeeded.includes(t.nr)) {
          stepsUntilNextUse = i - currentIdx;
          break;
        }
      }
      if (stepsUntilNextUse === null) {
        return "Nicht mehr benötigt im Planungszeitraum";
      } else if (stepsUntilNextUse === 1) {
        return "Wird bei NÄCHSTEM Schritt benötigt!";
      } else {
        return `Wird in ${stepsUntilNextUse} Schritten wieder benötigt`;
      }
    }
    return "";
  };

  const getStepPlacementExplanation = (step, prevStep) => {
    const lines = [];
    if (!step) return "";
    
    if (step.isExecuting) {
      lines.push("Der Auftrag befindet sich aktuell auf der Maschine in aktiver Ausführung.");
    }
    
    if (step.isLookahead) {
      const formattedOrigDate = formatDate(step.originalStartDate);
      lines.push(`Wurde aus einer Folgewoche (geplant für ${formattedOrigDate}) vorgezogen, um freie Kapazitäten und Rüstüberschneidungen optimal zu nutzen.`);
    }

    if (prevStep) {
      const prevLabel = prevStep.contractNumber || `Auftrag #${prevStep.orderId}`;
      if (step.fixture && prevStep.fixture && step.fixture === prevStep.fixture) {
        lines.push(`Teilt die gleiche Vorrichtung ("${step.fixture}") mit dem direkten Vorläufer (${prevLabel}). Dies spart einen zeitintensiven Vorrichtungswechsel.`);
      } else if (step.fixture) {
        lines.push(`Benötigt Vorrichtung "${step.fixture}".`);
      }

      const misses = step.directMisses ? step.directMisses.length : (step.loadTools ? step.loadTools.length : 0);
      if (misses === 0) {
        lines.push(`0-Rüstzeit: Alle benötigten Werkzeuge sind bereits durch den Vorläufer (${prevLabel}) im Magazin vorhanden.`);
      } else {
        lines.push(`Rüstoptimiert: Im Vergleich zum Vorläufer (${prevLabel}) müssen nur ${misses} Werkzeuge getauscht werden.`);
      }
    } else {
      if (!step.isExecuting) {
        lines.push("Tagesstart-Auftrag. Das Werkzeug-Setup wurde bestmöglich auf den Vortag abgestimmt, um Anrüstzeiten zu minimieren.");
      }
    }

    if (step.isNightRunCapable) {
      lines.push("Bedienerloser Nachtlauf: Der Auftrag ist nachtlaufgeeignet und kann in unbemannten Schichten laufen.");
    }
    
    if (lines.length === 0) {
      lines.push("Kapazitäts-Einplanung: Der Schritt wurde zur optimalen Auslastung der Maschinenbelegungszeit an dieser Stelle platziert.");
    }
    
    return lines.map(line => `• ${line}`).join("\n");
  };

  return (
    <div className="planning-tab">
      <div className="planning-controls card" style={{ padding: controlsCollapsed ? '0.5rem 1rem' : '1.25rem', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: controlsCollapsed ? 0 : '1rem' }}>
        <div 
          onClick={() => setControlsCollapsed(prev => !prev)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={15} style={{ color: 'var(--primary)' }} />
            <span>Planungs- & Optimierungs-Einstellungen</span>
            {controlsCollapsed && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginLeft: '0.5rem' }}>
                (Eingeklappt • Start: {formatDate(startDate)} • {daysCount} Tage)
              </span>
            )}
          </h3>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
          >
            {controlsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!controlsCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-dim)', paddingTop: '0.85rem' }}>
            <div className="controls-row">
              <div className="control-group">
                <label>Planungs-Startdatum & Zeitraum:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleDateChange}
                    style={{
                      background: 'rgba(13, 20, 35, 0.4)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      padding: '0.4rem 0.75rem',
                      outline: 'none'
                    }}
                  />
                  <select
                    value={daysCount}
                    onChange={(e) => setDaysCount(parseInt(e.target.value, 10))}
                    style={{
                      background: 'rgba(13, 20, 35, 0.4)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      padding: '0.4rem 0.75rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value={5}>5 Arbeitstage</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value={10}>10 Arbeitstage</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value={15}>15 Arbeitstage</option>
                    <option style={{ background: '#0f172a', color: '#f8fafc' }} value={20}>20 Arbeitstage</option>
                  </select>
                </div>
              </div>

              <div className="control-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>🔍 Auftragssuche:</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Auftrag / Beleg / NC..."
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontSize: '0.85rem',
                      padding: '0.4rem 2rem 0.4rem 0.75rem',
                      outline: 'none',
                      fontWeight: 600,
                      width: '180px'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                      title="Suche zurücksetzen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <button onClick={handleApplyDate} className="btn btn-primary btn-sm">
                Planung laden
              </button>

              <button 
                onClick={handleClearCacheAndReload} 
                className="btn btn-secondary btn-sm"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  color: '#ef4444' 
                }}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Cache leeren & neu laden</span>
              </button>

              {!isDocker && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-dim)', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    height: '36px',
                    boxSizing: 'border-box'
                  }} 
                  onClick={handleToggleDbMode}
                  title="Klicken, um zwischen Entwicklungs- und Live-Datenbank umzuschalten"
                >
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Datenquelle:</span>
                  <span style={{ 
                    background: dbMode === 'live' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                    border: dbMode === 'live' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', 
                    color: dbMode === 'live' ? '#34d399' : '#f87171', 
                    fontSize: '0.72rem', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: '6px', 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    {dbMode === 'live' ? '🟢 LIVE-DB' : '🔴 DEV-DB'}
                  </span>
                </div>
              )}
            </div>

            {mode !== 'deburring' && mode !== 'tools' && (
              <div className="control-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {isConflictMode ? (
                    <>
                      {['Chiron', 'C400', 'Brother'].includes(selectedMachine) ? (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', color: '#c084fc', fontWeight: 600, fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={conflictRobotFlowOnly}
                              onChange={(e) => setConflictRobotFlowOnly(e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🤖 Nur Roboter-Folgeschritt</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', color: '#d8b4fe', fontWeight: 600, fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={conflictSortByRobotFlow}
                              onChange={(e) => setConflictSortByRobotFlow(e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#c084fc' }}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🤖 Roboter-Folgeschritt nach oben</span>
                          </label>
                        </>
                      ) : (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', color: '#c084fc', fontWeight: 600, fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={conflictNightRunOnly}
                              onChange={(e) => setConflictNightRunOnly(e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🌙 Nur Nachtlauf anzeigen</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', color: '#d8b4fe', fontWeight: 600, fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={conflictSortByNightRun}
                              onChange={(e) => setConflictSortByNightRun(e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#c084fc' }}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>⬆️ Nachtlauf nach oben sortieren</span>
                          </label>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: '#fff', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={optimize}
                          onChange={(e) => setOptimize(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                        />
                        <span>Rüstoptimierung aktiv</span>
                      </label>

                      {selectedMachine !== 'Chiron' && selectedMachine !== 'C400' && selectedMachine !== 'Brother' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: '#fff', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={optimizeNightRun}
                            onChange={(e) => setOptimizeNightRun(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
                          />
                          <span style={{ color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Moon size={14} /> Nachtlauf-Optimierung</span>
                        </label>
                      )}

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: '#fff', fontWeight: 600 }} title="Erlaubt es dem Algorithmus, Aufträge der Folgewochen (bis zu 14 Tage) vorzuziehen, falls dadurch Werkzeugwechsel eingespart werden können und freie Kapazitäten vorhanden sind.">
                        <input
                          type="checkbox"
                          checked={allowLookahead}
                          onChange={(e) => setAllowLookahead(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#f43f5e' }}
                        />
                        <span style={{ color: '#fda4af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🔮 Zukünftige Aufträge vorziehen</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: '#fff', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={hideExecuting}
                          onChange={(e) => setHideExecuting(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                        />
                        <span style={{ color: '#a7f3d0' }}>⚡ Laufende verblassen</span>
                      </label>

                      {['RS2_1', 'RS2_2', 'C40', 'C42'].includes(selectedMachine) && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: '#fff', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={poolOptimization}
                            onChange={(e) => setPoolOptimization(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                          />
                          <span style={{ color: '#93c5fd' }}>🔄 Pool Optimierung</span>
                        </label>
                      )}

                      {(selectedMachine === 'Chiron' || selectedMachine === 'Brother' || selectedMachine === 'C400' || selectedMachine === 'All') && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', color: '#fff', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={highlightRobotFlow}
                            onChange={(e) => setHighlightRobotFlow(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
                          />
                          <span style={{ color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            🤖 Roboter-Folgeschritte
                          </span>
                        </label>
                      )}
                    </>
                  )}
                </div>

                {!isConflictMode && optimize && optimizeFixture && (
                  <div style={{
                    margin: '0.25rem 0',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.6rem',
                    maxWidth: '550px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Steuert das Verhältnis zwischen Werkzeugwechselminimierung (Wzg.) und Vorrichtungswechselminimierung (Vorr.)">
                      ⚖️ Gewichtung:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexGrow: 1, minWidth: '150px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Werkzeug</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempFixtureWeight}
                        onChange={(e) => setTempFixtureWeight(parseInt(e.target.value))}
                        onMouseUp={() => setFixtureWeight(tempFixtureWeight)}
                        onTouchEnd={() => setFixtureWeight(tempFixtureWeight)}
                        className="custom-range"
                        title={
                          tempFixtureWeight === 50 ? "Ausgeglichene Gewichtung (Standard)." :
                          tempFixtureWeight < 50 ? `${100 - tempFixtureWeight}% Werkzeug / ${tempFixtureWeight}% Vorrichtung (${tempFixtureWeight === 0 ? 'Ignoriert Vorrichtungswechsel' : 'Werkzeugfokus'})` :
                          `${100 - tempFixtureWeight}% Werkzeug / ${tempFixtureWeight}% Vorrichtung (Vorrichtungsfokus)`
                        }
                        style={{
                          flexGrow: 1,
                          background: `linear-gradient(to right, #3b82f6 0%, #a855f7 ${tempFixtureWeight}%, rgba(255,255,255,0.08) ${tempFixtureWeight}%, rgba(255,255,255,0.08) 100%)`,
                          height: '5px'
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: '#c084fc' }}>Vorrichtung</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, minWidth: '115px', textAlign: 'right' }}>
                      {100 - tempFixtureWeight}% Wzg / {tempFixtureWeight}% Vorr
                    </span>
                  </div>
                )}

                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Sortiert nach Werkzeugüberschneidung. Die Nachtlauf-Optimierung erkennt historische Nachtlauf-Kompatibilität und priorisiert diese entsprechend.
                </span>


              </div>
            )}
          </div>
        )}
      </div>

      {/* Conflict Mode Info Banner */}
      {isConflictMode && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#fbbf24',
          fontSize: '0.8rem'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Konfliktansicht aktiv (KV-Status Filter):</strong> Ausgeblendet sind alle direkt abarbeitbaren (grünen) Aufträge. Dargestellt werden ausschließlich Aufträge mit 🟡 <strong>GELB</strong> (wartet auf Vorgänger) und 🔴 <strong>ROT</strong> (Vorgänger ungeplant / noch nicht gestartet).
          </div>
        </div>
      )}

        {/* Machine Tabs */}
        <div className="machine-pills">
          <button
            className={`pill ${selectedMachine === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedMachine('All')}
          >
            {mode === 'deburring' ? 'Alle Arbeitsschritte (Übersicht)' : 'Alle Maschinen (Übersicht)'}
          </button>
          {machines.map(m => (
            <button
              key={m}
              className={`pill ${selectedMachine === m ? 'active' : ''}`}
              onClick={() => setSelectedMachine(m)}
            >
              {m}
            </button>
          ))}
        </div>
      



      {/* Fullscreen Button Block (unconditionally rendered under the banner area) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.15rem', marginBottom: '0.15rem', flexShrink: 0 }}>
        <button
          className="btn-secondary"
          onClick={() => setKanbanFullscreen(!kanbanFullscreen)}
          style={{ 
            fontSize: '0.75rem', 
            padding: '0.25rem 0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          title={kanbanFullscreen ? "Vollbild beenden" : "Kanban maximieren"}
        >
          {kanbanFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span>{kanbanFullscreen ? 'Normalbild' : 'Vollbild'}</span>
        </button>
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(8, 12, 20, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes loadingProgress {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
          <div style={{
            background: 'radial-gradient(100% 100% at 0% 0%, rgba(59, 130, 246, 0.1) 0%, rgba(8, 12, 20, 0.95) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '24px',
            padding: '2.5rem 3rem',
            textAlign: 'center',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            {/* Animated Milling / Gear Circle */}
            <div style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '3px solid rgba(59, 130, 246, 0.1)',
                borderTopColor: '#38bdf8',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{
                position: 'absolute',
                width: '70%',
                height: '70%',
                borderRadius: '50%',
                border: '3px solid rgba(168, 85, 247, 0.1)',
                borderBottomColor: '#a855f7',
                animation: 'spin 1.5s linear infinite reverse'
              }} />
              <Wrench size={32} style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 8px #38bdf8)' }} />
            </div>

            <div>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Belegungsplan wird optimiert
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                {algo === 'ga' && 'Der Genetische Algorithmus kreuzt und mutiert Auftragssequenzen, um Werkzeugwechsel auf Chiron & Brother zu minimieren.'}
                {algo === 'mip' && 'Der exakte Branch-and-Bound-Solver berechnet die mathematisch rüstzeitminimale Belegungsreihenfolge.'}
                {algo === 'greedy' && 'Die Rüstoptimierung ordnet alle Jobs nach dem Greedy-Nearest-Neighbor-Prinzip für kürzeste Rüstwege.'}
              </p>
            </div>

            {/* Custom Fake Progress Bar */}
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '0.5rem', position: 'relative' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                width: '100%',
                animation: 'loadingProgress 2s ease-in-out infinite'
              }} />
            </div>
            
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Systemdaten & Magazin-Setups werden abgeglichen...
            </span>

            <button
              onClick={cancelPlanningCalculation}
              style={{
                marginTop: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '0.75rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'; }}
            >
              <X size={12} /> Berechnung abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board Container */}
      <div 
        style={kanbanFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#080c14',
          zIndex: 9999,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto'
        } : {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minHeight: 0
        }}
      >
        {kanbanFullscreen && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem', margin: 0 }}>
                Belegungsplanung Kanban-Board - Vollbild
              </h3>
              <div className="machine-pills" style={{ marginBottom: 0 }}>
                <button
                  className={`pill ${selectedMachine === 'All' ? 'active' : ''}`}
                  onClick={() => setSelectedMachine('All')}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                >
                  Alle Maschinen (Übersicht)
                </button>
                {machines.map(m => (
                  <button
                    key={m}
                    className={`pill ${selectedMachine === m ? 'active' : ''}`}
                    onClick={() => setSelectedMachine(m)}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setKanbanFullscreen(false)}
              style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Minimize2 size={14} />
              <span>Vollbild beenden</span>
            </button>
          </div>
        )}

        {mode === 'tools' ? (
          <ToolsPlanningView 
            board={board} 
            selectedMachine={selectedMachine} 
            days={days} 
            machines={machines} 
            getDayName={getDayName} 
            formatDate={formatDate}
            setActiveModalStep={setActiveModalStep}
            setIsExplanationCollapsed={setIsExplanationCollapsed}
            highlightRobotFlow={highlightRobotFlow}
            isFollowedByRobot={isFollowedByRobot}
            hideExecuting={hideExecuting}
            formatMinutes={formatMinutes}
            capacities={capacities}
            toolMachineMap={data?.toolMachineMap || {}}
          />
        ) : selectedMachine !== 'All' || isListMode ? (
          // Detailed Single Machine Kanban Board (or List)
          <div className={isListMode ? "sequential-list-view" : "kanban-board"} style={isListMode ? { display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', overflowY: 'auto', background: '#0f172a' } : {}}>
          {(isListMode && selectedMachine === 'All' ? machines : [selectedMachine]).map(mName => {
            return (isListMode ? ['List'] : days).map(day => {
              const partnerMap = { 'C40': 'C42', 'C42': 'C40', 'RS2_1': 'RS2_2', 'RS2_2': 'RS2_1' };
              const partnerName = partnerMap[mName];
              
              let daySteps = [];
              if (isListMode) {
                days.forEach(d => {
                  if (board[mName]?.[d]) {
                    daySteps = daySteps.concat(board[mName][d]);
                  }
                });
                // Deduplicate and filter out split parts > 1
                const seenListKeys = new Set();
                daySteps = daySteps.filter(s => {
                  if (s.isSplit && s.splitPart > 1) return false;
                  if (seenListKeys.has(s.stepId)) return false;
                  seenListKeys.add(s.stepId);
                  return true;
                });
                // Restore original times
                daySteps = daySteps.map(s => ({
                  ...s,
                  setupTime: s.originalSetupTime !== undefined ? s.originalSetupTime : s.setupTime,
                  prodTime: s.originalProdTime !== undefined ? s.originalProdTime : s.prodTime
                }));
              } else {
                daySteps = board[mName]?.[day] || [];
                if (poolOptimization && partnerName) {
                  const recommendedFromPartner = (board[partnerName]?.[day] || [])
                    .filter(s => s.poolRecommendation && s.poolRecommendation.partnerMachine === mName)
                    .map(s => ({ ...s, isPoolRecommendationCopy: true }));
                  daySteps = [...daySteps, ...recommendedFromPartner];
                }

                // Deduplicate daySteps by stepId + splitPart + isPoolRecommendationCopy
                const seenKeys = new Set();
                daySteps = daySteps.filter(s => {
                  const key = `${s.stepId}-${s.splitPart || 0}-${!!s.isPoolRecommendationCopy}`;
                  if (seenKeys.has(key)) return false;
                  seenKeys.add(key);
                  return true;
                });
              }

              daySteps = daySteps.filter(s => {
                const cNr = String(s.contractNumber || '').trim();
                const oId = String(s.orderId || '').trim();
                return cNr !== '990001' && oId !== '990001' && !cNr.includes('990001');
              });

              if (isConflictMode) {
                daySteps = daySteps.filter(s => s.color && s.color.toLowerCase() !== 'green');
                if (['Chiron', 'C400', 'Brother'].includes(selectedMachine)) {
                  if (conflictRobotFlowOnly) {
                    daySteps = daySteps.filter(s => isFollowedByRobot(s));
                  }
                  if (conflictSortByRobotFlow) {
                    daySteps = [...daySteps].sort((a, b) => {
                      const aRobot = isFollowedByRobot(a);
                      const bRobot = isFollowedByRobot(b);
                      if (aRobot === bRobot) return 0;
                      return aRobot ? -1 : 1;
                    });
                  }
                } else {
                  if (conflictNightRunOnly) {
                    daySteps = daySteps.filter(s => s.isNightRunCapable);
                  }
                  if (conflictSortByNightRun) {
                    daySteps = [...daySteps].sort((a, b) => {
                      if (a.isNightRunCapable === b.isNightRunCapable) return 0;
                      return a.isNightRunCapable ? -1 : 1;
                    });
                  }
                }
              }

              const actualSteps = daySteps.filter(s => !s.isPoolRecommendationCopy);
              const totalSetupTime = actualSteps.reduce((acc, s) => acc + (s.setupTime || 0), 0);
              const totalProdTime = actualSteps.reduce((acc, s) => acc + (s.prodTime || 0), 0);
              const totalWorkloadTime = totalSetupTime + totalProdTime;
              const totalChanges = actualSteps.reduce((acc, s) => acc + (s.missesCount || 0), 0);

              const dayCapacity = capacities[mName]?.[day];
              const loadPercentage = dayCapacity ? Math.min(100, Math.round((totalWorkloadTime / dayCapacity) * 100)) : 0;
              const barColor = loadPercentage > 100 ? '#ef4444' : loadPercentage > 85 ? '#f59e0b' : '#10b981';

              if (isListMode && daySteps.length === 0) return null;

              return (
                <div key={`${mName}-${day}`} className={isListMode ? "list-container" : "kanban-column"} style={isListMode ? { background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-dim)' } : {}}>
                  {isListMode ? (
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-dim)', background: 'rgba(128, 128, 128, 0.05)' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Wrench size={18} color="#38bdf8" />
                        {mName} ({daySteps.length} Aufträge)
                      </h3>
                    </div>
                  ) : (
                    <div className="column-header">
                  <div className="day-name">{getDayName(day)}</div>
                  <div className="day-date">{formatDate(day)}</div>
                  <div className="column-summary" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>
                      {actualSteps.length} {actualSteps.length === 1 ? 'Auftrag' : 'Aufträge'}
                      {daySteps.length > actualSteps.length && (
                        <span style={{ color: '#93c5fd', fontSize: '0.68rem', fontWeight: 500, marginLeft: '0.25rem' }}>
                          (+{daySteps.length - actualSteps.length} Tipps)
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                      Gesamt: {formatMinutes(totalWorkloadTime)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.65rem' }}>
                      (Rüst: {Math.round(totalSetupTime)}m | Prod: {Math.round(totalProdTime)}m)
                    </div>
                  </div>
                  {dayCapacity && day !== 'Überlauf' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
                        <span>Auslastung: {loadPercentage}%</span>
                        <span>Max: {formatMinutes(dayCapacity)}</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', marginTop: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${loadPercentage}%`, height: '100%', background: barColor, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )}
                  {totalChanges > 0 && (
                    <span className="badge badge-warning" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                      {totalChanges} Wz. rüsten
                    </span>
                  )}
                </div>
              )}

              <div className={isListMode ? "list-content" : "column-content"} style={isListMode ? { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' } : {}}>
                  {daySteps.length === 0 ? (
                    <div className="empty-column-state">Keine Aufträge geplant</div>
                  ) : (
                    daySteps.map((step, idx) => {
                      const isHoveredGroup = hoveredStepId !== null && step.stepId === hoveredStepId;
                      const isUnhoveredGroup = hoveredStepId !== null && step.stepId !== hoveredStepId;
                      const isFeederMachine = mName === 'Chiron' || mName === 'Brother' || mName === 'C400';
                      const isRobotFlowStep = highlightRobotFlow && isFeederMachine && isFollowedByRobot(step);
                      const isNonRobot = highlightRobotFlow && isFeederMachine && !isFollowedByRobot(step);
                      const isBlurryExecuting = hideExecuting && step.isExecuting;
                      
                      const sollTime = Math.round((step.originalSetupTime ?? step.setupTime ?? 0) + (step.originalProdTime ?? step.prodTime ?? 0));
                      const istTime = Math.round(step.bookedTime ?? 0);
                      let restTime = Math.round((step.setupTime ?? 0) + (step.prodTime ?? 0));
                      if (istTime > sollTime) {
                        restTime = sollTime - istTime;
                      }

                      const plannedDays = (step.PlannedDays && step.PlannedDays > 0) ? step.PlannedDays : ((step.ThroughputDays && step.ThroughputDays > 0) ? step.ThroughputDays : 1);
                      const usedDays = step.UsedDays ?? 0;
                      const daysPct = Math.round((usedDays / Math.max(1, plannedDays)) * 100);

                      return (
                        <div 
                          key={step.isPoolRecommendationCopy ? `recommendation-${step.stepId}-${step.splitPart || 0}` : `${step.stepId}-${step.splitPart || 0}`} 
                          className={`kanban-card ${step.isExecuting ? 'executing' : ''} ${isHoveredGroup ? 'highlighted-split' : ''} ${isUnhoveredGroup ? 'dimmed-split' : ''}`} 
                          onClick={() => { setActiveModalStep(step); setIsExplanationCollapsed(true); }}
                          onMouseEnter={() => setHoveredStepId(step.stepId)}
                          onMouseLeave={() => setHoveredStepId(null)}
                          style={{
                            cursor: 'pointer',
                            padding: '0.65rem',
                            transition: 'opacity 0.25s, filter 0.25s, border-color 0.25s, box-shadow 0.25s',
                            opacity: isBlurryExecuting ? 0.6 : (isNonRobot ? 0.6 : 1),
                            filter: isBlurryExecuting ? 'blur(1px) grayscale(20%)' : (isNonRobot ? 'blur(0.8px) grayscale(15%)' : 'none'),
                            border: step.isPoolRecommendationCopy 
                              ? '1.5px dashed rgba(59, 130, 246, 0.5)' 
                              : (isRobotFlowStep ? '1.5px solid #a855f7' : undefined),
                            boxShadow: step.isPoolRecommendationCopy
                              ? '0 0 12px rgba(59, 130, 246, 0.2)'
                              : (isRobotFlowStep ? '0 0 12px rgba(168, 85, 247, 0.2)' : undefined),
                            background: step.isPoolRecommendationCopy ? 'rgba(59, 130, 246, 0.03)' : undefined,
                            pointerEvents: isBlurryExecuting ? 'none' : undefined
                          }}
                        >
                          {step.isPoolRecommendationCopy && (
                            <div style={{
                              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                              borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                              margin: '-0.65rem -0.65rem 0.4rem -0.65rem',
                              padding: '0.25rem 0.65rem',
                              borderTopLeftRadius: '8px',
                              borderTopRightRadius: '8px',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: '#93c5fd',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              letterSpacing: '0.02em'
                            }}>
                              <span>🔄 Pool-Tipp: besser auf {selectedMachine} (-{step.poolRecommendation.savings} Rüstwechsel)</span>
                            </div>
                          )}
                          {/* Header Row */}
                          <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                              <span className="card-order-id" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                                {step.contractNumber || 'Auftrag'}
                              </span>
                              <span 
                                title={getStepPlacementExplanation(step, idx > 0 ? daySteps[idx - 1] : null)}
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Info size={11} style={{ color: '#64748b' }} />
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                              {step.isExecuting && (
                                <span className="badge badge-aktiv" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.58rem', padding: '0.05rem 0.2rem', borderRadius: '3px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  ⚡ AKTIV
                                </span>
                              )}
                              {step.originalStartDate && (
                                step.isConflict ? (
                                  <span style={{ fontSize: '0.64rem', color: '#f87171', fontWeight: 700, whiteSpace: 'nowrap' }} title={`Überfälliger D4-Termin (Vergangenheit): ${formatDate(step.originalStartDate)}`}>
                                    D4: ⚠ {formatDate(step.originalStartDate)}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.64rem', color: '#38bdf8', fontWeight: 600, whiteSpace: 'nowrap' }} title="Geplantes Bearbeitungsdatum nach D4 (AS)">
                                    📅 D4: {formatDate(step.originalStartDate)}
                                  </span>
                                )
                              )}
                              {(step.productionDate || step.deliveryDate) && (
                                <span style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }} title="Fertigstellungstermin der Position">
                                  Fertig: {formatDate(step.productionDate || step.deliveryDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Secondary Badges Row */}
                          {(step.isSplit || step.isLookahead || step.isNightRunCapable || step.maxDayQty || step.manualMachineOverride || (isConflictMode && false) || isRobotFlowStep) && (
                            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.1rem', marginBottom: '0.15rem' }}>
                              {isRobotFlowStep && (
                                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', fontSize: '0.55rem', padding: '0.05rem 0.2rem', borderRadius: '3px', fontWeight: 700 }}>
                                  🤖 FLOW
                                </span>
                              )}
                              {step.manualMachineOverride && (
                                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', fontSize: '0.55rem', padding: '0.05rem 0.2rem', borderRadius: '3px', fontWeight: 700 }} title={`Manuell zugewiesen zu ${step.manualMachineOverride}`}>
                                  🔧 {step.manualMachineOverride}
                                </span>
                              )}
                              {!isConflictMode && step.isSplit && (
                                <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', color: '#38bdf8', fontSize: '0.55rem', padding: '0.05rem 0.2rem', borderRadius: '3px' }}>
                                  ✂ T{step.splitPart}
                                </span>
                              )}
                              {step.isLookahead && (
                                <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.55rem', padding: '0.05rem 0.2rem', borderRadius: '3px', fontWeight: 600, whiteSpace: 'nowrap' }} title={`Vorgezogen aus der eigentlichen Woche: ${formatDate(step.originalStartDate)}`}>
                                  🔮 Vorgezogen
                                </span>
                              )}
                              {step.isNightRunCapable ? (
                                <>
                                  <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#d8b4fe', fontSize: '0.55rem', padding: '0.05rem 0.25rem', borderRadius: '3px', whiteSpace: 'nowrap' }} title={`Nachtbauteil | Max. BDE-Stempelungen in 1 Nacht: ${step.maxNightQty ? step.maxNightQty + ' Stk.' : 'k.A.'}`}>
                                    🌙 Nacht (Max: {step.maxNightQty || 0} Stk)
                                  </span>
                                  {step.maxDayQty > 0 && (
                                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.55rem', padding: '0.05rem 0.25rem', borderRadius: '3px', whiteSpace: 'nowrap' }} title={`Tagbauteil | Max. BDE-Stempelungen in 1 Tagschicht: ${step.maxDayQty} Stk.`}>
                                      ☀️ Tag (Max: {step.maxDayQty} Stk)
                                    </span>
                                  )}
                                </>
                              ) : (
                                step.maxDayQty > 0 && (
                                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.55rem', padding: '0.05rem 0.25rem', borderRadius: '3px', whiteSpace: 'nowrap' }} title={`Tagbauteil | Max. BDE-Stempelungen in 1 Tagschicht: ${step.maxDayQty} Stk.`}>
                                    ☀️ Tag (Max: {step.maxDayQty} Stk)
                                  </span>
                                )
                              )}
                            </div>
                          )}

                          {/* Order Description */}
                          <div className="card-desc" title={step.orderDesc} style={{ fontSize: '0.75rem', fontWeight: 500, color: '#e2e8f0', margin: '0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {step.orderDesc}
                          </div>

                          {/* Collapsed Compact Summary Row */}
                  {!expandedCards[step.stepId] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.68rem', color: '#64748b' }}>
                            {isConflictMode ? (
                              <div style={{
                                background: step.color?.toLowerCase() === 'red' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                border: `1px solid ${step.color?.toLowerCase() === 'red' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                                borderRadius: '6px',
                                padding: '0.45rem 0.55rem',
                                marginTop: '0.2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem'
                              }}>
                                {/* Prominent display of WHERE the order is stuck */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <span style={{ fontSize: '0.6rem', color: step.color?.toLowerCase() === 'red' ? '#f87171' : '#fbbf24', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>
                                    🛑 Stockt in Arbeitsschritt:
                                  </span>
                                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', background: 'rgba(255,255,255,0.06)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {(() => {
                                      let desc = (step.predStepDesc || 'Vorgänger-Arbeitsschritt').replace(/\r/g, '').split('\n')[0].trim();
                                      if (/fräsen|fräs/i.test(desc)) {
                                        const m = desc.match(/fräsen\s+([A-Za-z0-9_\-\/]+)/i);
                                        if (m && m[1] && m[1].trim()) return m[1].trim();
                                      }
                                      return desc;
                                    })()}
                                  </span>
                                </div>

                                {/* Blocked Step Info */}
                                <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderTop: '1px dotted rgba(255,255,255,0.1)', paddingTop: '0.25rem' }}>
                                  <span>⏳ Blockierter Folgeschritt:</span>
                                  <strong style={{ color: '#cbd5e1' }}>
                                    {step.stepPos ? `Pos ${step.stepPos}: ` : ''}
                                    {typeof formatShortDesc === 'function' ? formatShortDesc(step.stepDesc) : (step.stepDesc ? step.stepDesc.split(/\r?\n/)[0].trim() : 'Geplanter Schritt')}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Row 1: Time / Execution Progress */}
                                <div>
                                  {isListMode ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', background: 'var(--bg-main)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soll</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sollTime}m</span>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ist</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: step.isExecuting ? '#10b981' : 'inherit' }}>{istTime}m</span>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rest</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>{restTime}m</span>
                                          </div>
                                        </div>
                                        {step.fixture && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', textAlign: 'right', borderLeft: '1px solid rgba(128,128,128,0.2)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                                            <span style={{ fontSize: '0.6rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spannmittel</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e9d5ff', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={step.fixture}>{step.fixture}</span>
                                          </div>
                                        )}
                                      </div>
                                      {step.isExecuting && (
                                        <div style={{ height: '5px', background: 'rgba(128, 128, 128, 0.15)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                                          <div style={{ 
                                            width: `${Math.min(100, (istTime / Math.max(1, sollTime)) * 100)}%`, 
                                            height: '100%', 
                                            background: istTime > sollTime ? '#ef4444' : '#10b981', 
                                            borderRadius: '3px' 
                                          }} />
                                        </div>
                                      )}
                                    </div>
                                  ) : step.isExecuting ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%' }} title={`Ist: ${istTime}m / Soll: ${sollTime}m (Rest: ${restTime}m)`}>
                                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center' }}>
                                        ⏱
                                      </span>
                                      <span style={{ fontSize: '0.62rem', color: istTime > sollTime ? '#ef4444' : '#10b981', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                        {Math.round((istTime / Math.max(1, sollTime)) * 100)}%
                                      </span>
                                      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', flexGrow: 1, overflow: 'hidden' }}>
                                        <div style={{ 
                                          width: `${Math.min(100, (istTime / Math.max(1, sollTime)) * 100)}%`, 
                                          height: '100%', 
                                          background: istTime > sollTime ? '#ef4444' : '#10b981', 
                                          borderRadius: '2px' 
                                        }} />
                                      </div>
                                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                        Rest: {restTime}m
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>⏱ {Math.round(step.setupTime)}m / {Math.round(step.prodTime)}m</span>
                                    </div>
                                  )}
                                </div>

                                {/* Row 1b: Durchlaufzeit Progress Bar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: '100%', marginTop: '0.2rem' }} title={`Durchlaufzeit: ${usedDays} von ${plannedDays} Tage (X = ${usedDays} Arbeitstage im Auftrag, Y = ${plannedDays} Tage hist. Ø für diesen Artikel & Arbeitsschritt)`}>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center' }}>
                                    📅
                                  </span>
                                  <span style={{ fontSize: '0.62rem', color: usedDays > plannedDays ? '#ef4444' : '#10b981', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    {daysPct}%
                                  </span>
                                  <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', flexGrow: 1, overflow: 'hidden' }}>
                                    <div style={{ 
                                      width: `${Math.min(100, daysPct)}%`, 
                                      height: '100%', 
                                      background: usedDays > plannedDays ? '#ef4444' : '#10b981', 
                                      borderRadius: '2px' 
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {usedDays}/{plannedDays}d
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Row 2: Status Indicators & Details button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                              <div>
                                {!step.ncProgram || !step.matchedListNr ? (
                                  <span style={{ color: '#ef4444', fontWeight: 600 }}>NC not found</span>
                                ) : !isConflictMode ? (
                                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                                    🔧 Rüsten: 
                                    <span style={{ color: '#f59e0b', marginLeft: '0.2rem' }}>
                                      +{step.directMisses ? step.directMisses.length : step.loadTools.length}
                                    </span>
                                    {step.unloadTools && step.unloadTools.length > 0 && (
                                      <span style={{ color: '#f87171', marginLeft: '0.15rem' }}>
                                        /-{step.unloadTools.length}
                                      </span>
                                    )}
                                  </span>
                                ) : null}
                              </div>

                              <button
                                onClick={(e) => toggleCardDetails(e, step.stepId)}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--border-dim)',
                                  borderRadius: '4px',
                                  color: '#94a3b8',
                                  fontSize: '0.62rem',
                                  padding: '0.1rem 0.35rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.15rem'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94a3b8'; }}
                              >
                                <span>Details</span>
                                <ChevronDown size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Expanded Details View */
                          <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '0.4rem', marginTop: '0.4rem', animation: 'fadeIn 0.15s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Details</span>
                              <button
                                onClick={(e) => toggleCardDetails(e, step.stepId)}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--border-dim)',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  fontSize: '0.6rem',
                                  padding: '0.05rem 0.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.15rem'
                                }}
                              >
                                Schließen <ChevronUp size={8} />
                              </button>
                            </div>

                            {/* Additional Information */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                              <div><strong>Schritt:</strong> {step.stepDesc}</div>
                              {step.ncProgram && <div><strong>NC-Prog:</strong> <code style={{ color: '#38bdf8' }}>{step.ncProgram}</code></div>}
                              {step.matchedListIdent && <div><strong>WinTool:</strong> {step.matchedListIdent}</div>}
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.1rem' }}>
                                <span className="card-badge" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.05rem 0.25rem', borderRadius: '3px', fontSize: '0.65rem' }}>Rüstzeit: {Math.round(step.setupTime)}m</span>
                                <span className="card-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '0.05rem 0.25rem', borderRadius: '3px', fontSize: '0.65rem' }}>Prodzeit: {Math.round(step.prodTime)}m</span>
                              </div>
                            </div>

                            {/* Rüstbedarf Details */}
                            <div style={{ borderTop: '1px dotted var(--border-dim)', paddingTop: '0.35rem' }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>
                                Rüstbedarf ({step.toolsCount} Wz. gesamt)
                              </div>
                              {!step.ncProgram || !step.matchedListNr ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#ef4444', fontWeight: 600 }}>
                                  <span>NC not found</span>
                                </div>
                              ) : (
                                <>
                                  <div style={{ marginBottom: '0.35rem' }}>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.15rem' }}>
                                      Tatsächlich zu rüsten ({step.directMisses ? step.directMisses.length : step.loadTools.length}):
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                      {((step.directMisses || step.loadTools).length === 0) ? (
                                        <div style={{ color: '#10b981', fontSize: '0.6rem', fontStyle: 'italic' }}>
                                          ✓ Alle Werkzeuge auf der Maschine
                                        </div>
                                      ) : (
                                        (step.directMisses || step.loadTools).map(t => (
                                          <div key={t.nr} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.01)', padding: '0.08rem 0.2rem', borderRadius: '2px' }}>
                                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>T{t.nr}</span>
                                            <span style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={t.desc}>{t.desc}</span>
                                            {t.dia && t.dia !== '0' && t.dia !== 0 ? <span style={{ color: '#64748b' }}>Ø{t.dia}</span> : null}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {((step.unloadTools && step.unloadTools.length > 0) || (step.directMisses && step.directMisses.length !== step.loadTools.length)) && (
                                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                                      <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#64748b', marginBottom: '0.1rem' }}>
                                        Simulierter Ablauf (Transitional):
                                      </div>
                                      <div style={{ fontSize: '0.58rem', color: '#8b9bb4' }}>
                                        Einwechseln: {step.loadTools.map(t => `T${t.nr}`).join(', ') || 'Keine'}
                                      </div>
                                      <div style={{ fontSize: '0.58rem', color: '#8b9bb4' }}>
                                        Auswechseln: {(selectedMachine === 'Chiron' || (step.machineName || '').includes('Chiron')) ? (step.unloadListNames ? `Werkzeugliste ${step.unloadListNames} (${step.unloadTools.length} Werkzeuge)` : 'Keine') : (step.unloadTools.map(t => `T${t.nr}`).join(', ') || 'Keine')}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                  )}
                </div>
              </div>
            );
          })
          })}
        </div>
      ) : (
        // Swimlane Matrix View (Rows = Machines, Cols = Days)
        <div className="swimlane-view card">
          <div className="swimlane-grid">
            {/* Header Row */}
            <div className="grid-row header-row" style={{ gridTemplateColumns: `180px repeat(${days.length}, 1fr)`, position: 'sticky', top: 0, zIndex: 10, background: '#0c1220', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
              <div className="grid-cell machine-cell header-cell" style={{ fontWeight: 700 }}>Maschine</div>
              {days.map(day => (
                <div key={day} className="grid-cell header-cell">
                  <div className="day-name">{getDayName(day)}</div>
                  <div className="day-date">{formatDate(day)}</div>
                </div>
              ))}
            </div>

            {/* Content Rows */}
            {machines.map(mName => {
              const weeklyLoadTools = [];
              const weeklyUnloadTools = [];
              const machineConflictSteps = [];

              days.forEach(day => {
                let daySteps = board[mName]?.[day] || [];
                if (isConflictMode) {
                  daySteps = daySteps.filter(s => s.color && s.color.toLowerCase() !== 'green');
                  machineConflictSteps.push(...daySteps);
                } else {
                  daySteps.forEach(s => {
                    if (s.loadTools) {
                      s.loadTools.forEach(t => {
                        if (!weeklyLoadTools.some(x => x.nr === t.nr)) {
                          weeklyLoadTools.push(t);
                        }
                      });
                    }
                    if (s.unloadTools) {
                      s.unloadTools.forEach(t => {
                        if (!weeklyUnloadTools.some(x => x.nr === t.nr)) {
                          weeklyUnloadTools.push(t);
                        }
                      });
                    }
                  });
                }
              });

              const machineRedCount = machineConflictSteps.filter(s => s.color?.toLowerCase() === 'red').length;
              const machineYellowCount = machineConflictSteps.filter(s => s.color?.toLowerCase() === 'yellow').length;

              return (
                <div key={mName} className="grid-row content-row" style={{ gridTemplateColumns: `180px repeat(${days.length}, 1fr)` }}>
                  <div className="grid-cell machine-cell" onClick={() => setSelectedMachine(mName)}>
                    <div className="machine-title">{mName}</div>
                    <div className="machine-click-hint">Kanban-Ansicht</div>

                    {isConflictMode ? (
                      <div style={{ marginTop: '0.35rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.25)', padding: '0.3rem 0.5rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                          Konflikte ({machineConflictSteps.length}):
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.68rem', fontWeight: 700 }}>
                          <span style={{ color: '#f87171' }}>🔴 {machineRedCount} Rot</span>
                          <span style={{ color: '#fbbf24' }}>🟡 {machineYellowCount} Gelb</span>
                        </div>
                      </div>
                    ) : (
                      (weeklyLoadTools.length > 0 || weeklyUnloadTools.length > 0) && (
                        <div 
                          className="weekly-summary-box"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWeeklyToolsModal({
                              machineName: mName,
                              loadTools: weeklyLoadTools,
                              unloadTools: weeklyUnloadTools
                            });
                          }}
                        >
                          <div className="weekly-summary-title">
                            <span>Wochen-Rüsten:</span>
                          </div>
                          <div className="weekly-summary-counts">
                            <span className="weekly-summary-rein">+{weeklyLoadTools.length} rein</span>
                            <span className="weekly-summary-raus">-{weeklyUnloadTools.length} raus</span>
                          </div>
                          <span className="weekly-summary-link">Details anzeigen</span>
                        </div>
                      )
                    )}
                  </div>
                
                {days.map(day => {
                  let daySteps = board[mName]?.[day] || [];
                  if (isConflictMode) {
                    daySteps = daySteps.filter(s => s.color && s.color.toLowerCase() !== 'green');
                  }
                  const actualSteps = daySteps.filter(s => !s.isPoolRecommendationCopy);
                  const totalSetupTime = actualSteps.reduce((acc, s) => acc + (s.setupTime || 0), 0);
                  const totalProdTime = actualSteps.reduce((acc, s) => acc + (s.prodTime || 0), 0);
                  const totalWorkloadTime = totalSetupTime + totalProdTime;
                  const totalChanges = actualSteps.reduce((acc, s) => acc + (s.missesCount || 0), 0);
                  const nightRunsCount = actualSteps.filter(s => s.isNightRunCapable).length;

                  const redStepsCount = daySteps.filter(s => s.color?.toLowerCase() === 'red').length;
                  const yellowStepsCount = daySteps.filter(s => s.color?.toLowerCase() === 'yellow').length;

                  const dayCapacity = capacities[mName]?.[day];
                  const loadPercentage = dayCapacity ? Math.min(100, Math.round((totalWorkloadTime / dayCapacity) * 100)) : 0;
                  const barColor = loadPercentage > 100 ? '#ef4444' : loadPercentage > 85 ? '#f59e0b' : '#10b981';

                  return (
                    <div key={day} className="grid-cell cell-content" onClick={() => setSelectedMachine(mName)} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'flex-start', paddingTop: '0.65rem' }}>
                      {/* Cell Day Header */}
                      <div className="swimlane-cell-header" style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.2rem', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', width: '100%', textTransform: 'uppercase', letterSpacing: '0.02em', pointerEvents: 'none', userSelect: 'none' }}>
                        <span className="swimlane-cell-day-name">{getDayName(day)}</span>
                        <span className="swimlane-cell-day-date">{formatDate(day)}</span>
                      </div>
                      {daySteps.length === 0 ? (
                        <div className="grid-empty">
                          {isConflictMode ? '✓ Keine Konflikte' : 'Keine Belegung'}
                        </div>
                      ) : isConflictMode ? (
                        <div className="grid-summary-card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(15, 23, 42, 0.7)', padding: '0.45rem' }}>
                          <div className="summary-qty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.72rem' }}>{daySteps.length} Konflikte</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.35rem', fontSize: '0.62rem', fontWeight: 700 }}>
                            <span style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '0.08rem 0.3rem', borderRadius: '3px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                              🔴 {redStepsCount} Rot
                            </span>
                            <span style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '0.08rem 0.3rem', borderRadius: '3px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                              🟡 {yellowStepsCount} Gelb
                            </span>
                          </div>
                          <div className="grid-steps-preview" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {daySteps.slice(0, 4).map((s, idx) => {
                              const orderNr = s.contractNumber || (s.orderId ? `Auftrag ${s.orderId}` : '');
                              const partName = (s.orderDesc || s.articleId || 'Bauteil').split('\n')[0].trim();
                              let pDesc = (s.predStepDesc || 'Vorgänger-Schritt').replace(/\r/g, '').split('\n')[0].trim();
                              if (/fräsen|fräs/i.test(pDesc)) {
                                const m = pDesc.match(/fräsen\s+([A-Za-z0-9_\-\/]+)/i);
                                if (m && m[1] && m[1].trim()) pDesc = m[1].trim();
                              }
                              const blockingStep = pDesc;

                              return (
                                <div 
                                  key={`${s.stepId}-${idx}`} 
                                  className="preview-item" 
                                  style={{
                                    fontSize: '0.62rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.15rem',
                                    padding: '0.35rem 0.45rem',
                                    borderRadius: '6px',
                                    background: s.color?.toLowerCase() === 'red' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    border: `1px solid ${s.color?.toLowerCase() === 'red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                  }}
                                  title={`Auftrag: ${orderNr}\nBauteil: ${partName}\nStockt bei: ${blockingStep}\nFolgeschritt: Pos ${s.stepPos} ${s.stepDesc}`}
                                >
                                  {/* Row 1: Order Nr + KV Badge */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                                    <span style={{ color: '#38bdf8', fontSize: '0.65rem' }}>
                                      📋 {orderNr}
                                    </span>
                                    <span style={{
                                      fontSize: '0.58rem',
                                      padding: '0.05rem 0.25rem',
                                      borderRadius: '3px',
                                      background: s.color?.toLowerCase() === 'red' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)',
                                      color: s.color?.toLowerCase() === 'red' ? '#f87171' : '#fbbf24'
                                    }}>
                                      {s.color?.toLowerCase() === 'red' ? '🔴 ROT' : '🟡 GELB'}
                                    </span>
                                  </div>

                                  {/* Row 2: Bauteilname / Artikel */}
                                  <div style={{ color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.64rem' }}>
                                    {partName}
                                  </div>

                                  {/* Row 3: Stockender Vorgänger-Schritt (welcher Arbeitsschritt blockiert) */}
                                  <div style={{ color: s.color?.toLowerCase() === 'red' ? '#fca5a5' : '#fcd34d', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.05rem' }}>
                                    <span>🛑 Stockt bei:</span>
                                    <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                      {blockingStep}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {daySteps.length > 4 && (
                              <div className="preview-more" style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 600, marginTop: '0.1rem', textAlign: 'center' }}>
                                +{daySteps.length - 4} weitere Konflikte
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid-summary-card">
                          <div className="summary-qty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{daySteps.length} Aufträge</span>
                            {nightRunsCount > 0 && (
                              <span style={{ color: '#c084fc', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.1rem' }} title={`${nightRunsCount} Nachtlauf-geeignet`}>
                                🌙 {nightRunsCount}
                              </span>
                            )}
                          </div>
                          <div className="summary-time" style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem', margin: '0.15rem 0' }}>
                            <span>Gesamt: <strong style={{ color: '#38bdf8' }}>{formatMinutes(totalWorkloadTime)}</strong></span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>(Rüst: {Math.round(totalSetupTime)}m | Prod: {Math.round(totalProdTime)}m)</span>
                          </div>
                          {dayCapacity && day !== 'Überlauf' && (
                            <div style={{ marginTop: '0.2rem', width: '100%' }}>
                              <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '1.5px', overflow: 'hidden' }} title={`Auslastung: ${loadPercentage}% (Max: ${formatMinutes(dayCapacity)})`}>
                                <div style={{ width: `${loadPercentage}%`, height: '100%', background: barColor }} />
                              </div>
                            </div>
                          )}
                          {totalChanges > 0 ? (
                            <span className="mini-badge warning">
                              {totalChanges} Wz. rüsten
                            </span>
                          ) : (
                            <span className="mini-badge success">
                              ✓ 0 Rüstwechsel
                            </span>
                          )}
                          <div className="grid-steps-preview">
                            {daySteps.slice(0, 2).map((s, idx) => {
                              const isBlurryExecuting = hideExecuting && s.isExecuting;
                              return (
                                <div 
                                  key={`${s.stepId}-${idx}`} 
                                  className="preview-item"
                                  style={{
                                    opacity: isBlurryExecuting ? 0.6 : 1,
                                    filter: isBlurryExecuting ? 'blur(0.3px) grayscale(20%)' : 'none'
                                  }}
                                >
                                  {s.ncProgram || s.stepDesc.substring(0, 15)}...
                                </div>
                              );
                            })}
                            {daySteps.length > 2 && (
                              <div className="preview-more">+{daySteps.length - 2} weitere</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          </div>
        </div>
      )}
      </div>

      {/* Modal for Detailed Step Information */}
      {activeModalStep && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: dmsSliderOpen ? '45%' : '100%',
          height: '100%',
          background: 'rgba(4, 6, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: dmsSliderOpen ? '1rem' : '2rem',
          transition: 'all 0.3s ease'
        }} onClick={closeActiveModal}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: dmsSliderOpen ? '95%' : '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: dmsSliderOpen ? '1.5rem' : '2.25rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Close Button */}
            <button
              onClick={closeActiveModal}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-dim)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {activeModalStep.isExecuting ? (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700 }}>
                      ⚡ IN AUSFÜHRUNG
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Aktivierbar</span>
                  )}
                  {activeModalStep.isSplit && (
                    <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>
                      ✂ Teil {activeModalStep.splitPart}
                    </span>
                  )}
                  {activeModalStep.isConflict && (
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>
                      <AlertTriangle size={12} /> Soll: {formatDate(activeModalStep.originalStartDate)}
                    </span>
                  )}
                  {activeModalStep.isLookahead && (
                    <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>
                      🔮 Vorgezogen (Soll: {formatDate(activeModalStep.originalStartDate)})
                    </span>
                  )}
                  {activeModalStep.isNightRunCapable && (
                    <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>
                      <Moon size={12} /> Nachtlauf
                    </span>
                  )}
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0' }}>
                  Arbeitsschritt-Details
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  Detaillierte Belegungsdaten des Arbeitsschritts
                </p>
              </div>

              {/* Manual Override Action Buttons */}
              <div style={{ flexShrink: 0 }}>
                {renderOverrideButtons()}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Einplanungserklärung (Placement Explanation) */}
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', padding: '0.85rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div 
                  onClick={() => setIsExplanationCollapsed(!isExplanationCollapsed)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={14} /> Einplanung & Optimierung
                  </div>
                  {isExplanationCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
                {!isExplanationCollapsed && (
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4, whiteSpace: 'pre-line', marginTop: '0.2rem' }}>
                    {getStepPlacementExplanation(activeModalStep, getPredecessorForStep(activeModalStep))}
                  </div>
                )}
              </div>

              {/* Row 1: P-Nummer, Fertigstellungstermin & Lieferdatum */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>P-Nummer (Projekt) / Position</div>
                  <div style={{ fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700 }}>
                    {activeModalStep.contractNumber || 'Keine P-Nummer'} {activeModalStep.orderPos ? `/ Pos ${activeModalStep.orderPos}` : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Fertigstellungstermin</div>
                  <div style={{ fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700 }}>
                    {activeModalStep.productionDate || activeModalStep.deliveryDate ? formatDate(activeModalStep.productionDate || activeModalStep.deliveryDate) : 'Kein Termin'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Lieferdatum (Kunde / Beleg)</div>
                  <div style={{ fontSize: '1.05rem', color: '#10b981', fontWeight: 700 }}>
                    {activeModalStep.orderDeliveryDate ? formatDate(activeModalStep.orderDeliveryDate) : (activeModalStep.deliveryDate ? formatDate(activeModalStep.deliveryDate) : 'Kein Lieferdatum')}
                  </div>
                </div>
              </div>

              {/* Row 2: Artikel */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Artikel (Teil)</div>
                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{activeModalStep.orderDesc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Artikel-ID: {activeModalStep.articleId}</div>
                  {activeModalStep.articleId && (
                    <button 
                      onClick={() => {
                        openDmsSlider(activeModalStep.articleId, activeModalStep.orderDesc, null, activeModalStep.fixture);
                      }}
                      style={{ 
                        background: 'rgba(56, 189, 248, 0.1)', 
                        color: '#38bdf8', 
                        border: '1px solid rgba(56, 189, 248, 0.2)', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '6px', 
                        fontSize: '0.7rem', 
                        cursor: 'pointer',
                        fontWeight: 600, 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s'
                      }}
                      title="Zeichnung im DMS Slider öffnen"
                    >
                      📐 Zeichnung öffnen
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: Arbeitsplan-Schritt */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Arbeitsplan-Position (Arbeitsschritt)</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>{activeModalStep.stepPos || 'N/A'}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>- {activeModalStep.stepDesc}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Schritt-ID: {activeModalStep.stepId}</div>
              </div>

              {/* Row 4: Soll vs Ist vs Rest Zeitvergleich */}
              {(() => {
                const originalSetup = activeModalStep.originalSetupTime || 0;
                const originalProd = activeModalStep.originalProdTime || 0;
                const originalTotal = originalSetup + originalProd;

                const seenBookingIdsForSum = new Set();
                let totalBookedSetup = 0;
                let totalBookedProd = 0;
                modalBookings.forEach(b => {
                  const bookingId = b.ID;
                  if (bookingId && !seenBookingIdsForSum.has(bookingId)) {
                    seenBookingIdsForSum.add(bookingId);
                    totalBookedSetup += b.ZBU_ZEIT_RUESTUNG_GESAMT || 0;
                    totalBookedProd += (b.ZBU_ZEIT_PRODUKTION_AK || 0) + (b.ZBU_ZEIT_PRODUKTION_MS || 0);
                  }
                });
                const totalBookedTotal = totalBookedSetup + totalBookedProd;

                let remainingSetup = Math.round(activeModalStep.setupTime || 0);
                if (totalBookedSetup > originalSetup) {
                  remainingSetup = originalSetup - totalBookedSetup;
                }
                
                let remainingProd = Math.round(activeModalStep.prodTime || 0);
                if (totalBookedProd > originalProd) {
                  remainingProd = originalProd - totalBookedProd;
                }

                let remainingTotal = Math.round((activeModalStep.setupTime || 0) + (activeModalStep.prodTime || 0));
                if (totalBookedTotal > originalTotal) {
                  remainingTotal = originalTotal - totalBookedTotal;
                }

                const formatTime = (min) => {
                  const roundedMin = Math.round(min);
                  if (roundedMin === 0) return '0m';
                  const isNeg = roundedMin < 0;
                  const absMin = Math.abs(roundedMin);
                  if (absMin >= 60) {
                    const hours = Math.floor(absMin / 60);
                    const mins = absMin % 60;
                    const formatted = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                    return isNeg ? `-${formatted}` : formatted;
                  }
                  return `${roundedMin}m`;
                };

                const setupPct = originalSetup > 0 ? (totalBookedSetup / originalSetup) * 100 : 0;
                const prodPct = originalProd > 0 ? (totalBookedProd / originalProd) * 100 : 0;
                const totalPct = originalTotal > 0 ? (totalBookedTotal / originalTotal) * 100 : 0;

                return (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Soll / Ist / Rest Zeitvergleich & Durchlaufzeit</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Werte gerundet in Minuten, Stunden & Tagen</span>
                    </div>

                    {/* Row 1: Zeitvergleich (Rüsten, Produktion, Gesamtzeit in einer Reihe) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      {/* Rüsten */}
                      <div style={{ background: 'rgba(249, 115, 22, 0.03)', border: '1px solid rgba(249, 115, 22, 0.15)', padding: '0.65rem 0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#fdba74', fontWeight: 700 }}>🛠️ RÜSTEN</span>
                          <span style={{ fontSize: '0.68rem', color: setupPct > 100 ? '#ef4444' : '#94a3b8', fontWeight: setupPct > 100 ? 700 : 400, fontFamily: 'monospace' }}>{Math.round(setupPct)}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Soll:</span><span style={{ fontWeight: 600 }}>{formatTime(originalSetup)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ist:</span><span style={{ fontWeight: 600, color: totalBookedSetup > originalSetup ? '#ef4444' : '#fdba74' }}>{formatTime(totalBookedSetup)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(249, 115, 22, 0.15)', paddingTop: '0.15rem', marginTop: '0.15rem' }}><span>Rest:</span><span style={{ fontWeight: 700, color: remainingSetup < 0 ? '#ef4444' : (remainingSetup > 0 ? '#38bdf8' : '#64748b') }}>{formatTime(remainingSetup)}</span></div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, setupPct)}%`, height: '100%', background: setupPct > 100 ? '#ef4444' : '#f97316', borderRadius: '2px' }} />
                        </div>
                      </div>

                      {/* Produktion */}
                      <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.15)', padding: '0.65rem 0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>⚙️ PRODUKTION</span>
                          <span style={{ fontSize: '0.68rem', color: prodPct > 100 ? '#ef4444' : '#94a3b8', fontWeight: prodPct > 100 ? 700 : 400, fontFamily: 'monospace' }}>{Math.round(prodPct)}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Soll:</span><span style={{ fontWeight: 600 }}>{formatTime(originalProd)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ist:</span><span style={{ fontWeight: 600, color: totalBookedProd > originalProd ? '#ef4444' : '#60a5fa' }}>{formatTime(totalBookedProd)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(59, 130, 246, 0.15)', paddingTop: '0.15rem', marginTop: '0.15rem' }}><span>Rest:</span><span style={{ fontWeight: 700, color: remainingProd < 0 ? '#ef4444' : (remainingProd > 0 ? '#38bdf8' : '#64748b') }}>{formatTime(remainingProd)}</span></div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, prodPct)}%`, height: '100%', background: prodPct > 100 ? '#ef4444' : '#3b82f6', borderRadius: '2px' }} />
                        </div>
                      </div>

                      {/* Gesamtzeit */}
                      <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.65rem 0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 700 }}>📊 GESAMTZEIT</span>
                          <span style={{ fontSize: '0.68rem', color: totalPct > 100 ? '#ef4444' : '#94a3b8', fontWeight: totalPct > 100 ? 700 : 400, fontFamily: 'monospace' }}>{Math.round(totalPct)}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Soll:</span><span style={{ fontWeight: 600 }}>{formatTime(originalTotal)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ist:</span><span style={{ fontWeight: 600, color: totalBookedTotal > originalTotal ? '#ef4444' : '#10b981' }}>{formatTime(totalBookedTotal)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '0.15rem', marginTop: '0.15rem' }}><span>Rest:</span><span style={{ fontWeight: 700, color: remainingTotal < 0 ? '#ef4444' : (remainingTotal > 0 ? '#38bdf8' : '#64748b') }}>{formatTime(remainingTotal)}</span></div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, totalPct)}%`, height: '100%', background: totalPct > 100 ? '#ef4444' : '#10b981', borderRadius: '2px' }} />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Durchlaufzeit (Volle Breite darunter) */}
                    {(() => {
                      const mPlannedDays = (activeModalStep.PlannedDays && activeModalStep.PlannedDays > 0) ? activeModalStep.PlannedDays : ((activeModalStep.ThroughputDays && activeModalStep.ThroughputDays > 0) ? activeModalStep.ThroughputDays : 1);
                      const mOrderPlanDays = activeModalStep.OrderPlanDays ?? mPlannedDays;
                      const mUsedDays = activeModalStep.UsedDays ?? 0;
                      const mDaysPct = Math.round((mUsedDays / Math.max(1, mPlannedDays)) * 100);
                      const mRemainingDays = mPlannedDays - mUsedDays;

                      return (
                        <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.18)', padding: '0.65rem 0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              📅 DURCHLAUFZEIT
                            </span>
                            <span style={{ fontSize: '0.7rem', color: mUsedDays > mPlannedDays ? '#ef4444' : '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                              {mDaysPct}%
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Auftragsplan:</span>
                              <span style={{ fontWeight: 600 }}>{mOrderPlanDays} {mOrderPlanDays === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Historischer Ø:</span>
                              <span style={{ fontWeight: 600 }}>{mPlannedDays} {mPlannedDays === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Ist (Gebraucht):</span>
                              <span style={{ fontWeight: 600, color: mUsedDays > mPlannedDays ? '#ef4444' : '#38bdf8' }}>{mUsedDays} {mUsedDays === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Geplanter Restbedarf:</span>
                              <span style={{ fontWeight: 700, color: mRemainingDays < 0 ? '#ef4444' : '#38bdf8' }}>{mRemainingDays} {Math.abs(mRemainingDays) === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.2rem' }}>
                            <div style={{ width: `${Math.min(100, mDaysPct)}%`, height: '100%', background: mUsedDays > mPlannedDays ? '#ef4444' : '#38bdf8', borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Row 5: NC & WinTool */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.1rem' }}>NC-Programm (Auftrag)</div>
                    <div style={{ fontSize: '0.88rem', color: (activeModalStep.ncProgram && activeModalStep.matchedListNr) ? '#fff' : '#ef4444', fontFamily: 'monospace', fontWeight: 600 }}>
                      {(activeModalStep.ncProgram && activeModalStep.matchedListNr) ? activeModalStep.ncProgram : 'NC not found'}
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.1rem' }}>WinTool-Liste</div>
                    {activeModalStep.matchedListNr ? (
                      <div>
                        <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={activeModalStep.matchedListIdent}>
                          {activeModalStep.matchedListIdent}
                        </div>
                        {activeModalStep.matchedListNcp && (
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                            ({activeModalStep.matchedListNcp})
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>NC not found</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Row 6: Vorrichtung (Fixture) */}
              {activeModalStep.fixture && (
                <div style={{ background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.15)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600, textTransform: 'uppercase' }}>Spannmittel / Vorrichtung</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.95rem', color: '#e9d5ff', fontWeight: 700 }}>
                      🛠️ {activeModalStep.fixture}
                    </span>
                    {activeModalStep.fixtureLocation && (
                      activeModalStep.fixtureLocationFromDb ? (
                        <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                          📍 Lagerort: {activeModalStep.fixtureLocation}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.15rem 0.4rem', borderRadius: '6px' }} title="Dieser Lagerplatz wurde aus dem Arbeitsschritt-Text ausgelesen, da in der Datenbank kein Lagerort hinterlegt ist.">
                          ⚠️ Lagerplatz nicht hinterlegt (Text-Info: {activeModalStep.fixtureLocation})
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Entire Arbeitsplan Section */}
              <div>
                <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Gesamter Arbeitsplan (Routing)</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#94a3b8' }}>
                    {loadingRouting ? 'Lade...' : `${fullRoutingSteps.length} Operationen`}
                  </span>
                </div>
                {loadingRouting ? (
                  <div className="modal-routing-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', padding: '1rem', border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Lade Arbeitsplan...</span>
                  </div>
                ) : fullRoutingSteps.length > 0 ? (
                  <div className="modal-routing-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem', border: '1px solid var(--border-dim)', padding: '0.75rem', borderRadius: '10px' }}>
                    {fullRoutingSteps.map((op, opIdx) => {
                      const isCurrent = op.stepId === activeModalStep.stepId;
                      const isCompleted = op.isCompleted;
                      const isExecuting = op.isExecuting;

                      let statusBadge = null;
                      let bgStyle = 'var(--bg-card)';
                      let borderStyle = '1px solid var(--border-dim)';
                      let textColor = 'var(--text-main)';

                      if (isCurrent) {
                        statusBadge = <span style={{ color: '#60a5fa', fontSize: '0.7rem', fontWeight: 700 }}>Aktuell</span>;
                        bgStyle = 'rgba(59, 130, 246, 0.15)';
                        borderStyle = '1px solid rgba(59, 130, 246, 0.4)';
                      } else if (isCompleted) {
                        statusBadge = <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>✓ Erledigt</span>;
                        bgStyle = 'transparent';
                        borderStyle = '1px dashed var(--border-dim)';
                        textColor = '#64748b';
                      } else if (isExecuting) {
                        statusBadge = <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>▶ In Arbeit</span>;
                        bgStyle = 'rgba(16, 185, 129, 0.1)';
                        borderStyle = '1px solid rgba(16, 185, 129, 0.3)';
                      } else {
                        statusBadge = <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>Offen</span>;
                        bgStyle = 'rgba(128,128,128,0.05)';
                        borderStyle = '1px solid var(--border-dim)';
                      }

                      let stepTypeBadge = null;
                      if (op.stepTyp === 3) {
                        stepTypeBadge = <span style={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, marginRight: '0.4rem', border: '1px solid rgba(148,163,184,0.3)', padding: '0 0.2rem', borderRadius: '3px' }}>INFO</span>;
                      } else if (op.stepTyp === 2) {
                        stepTypeBadge = <span style={{ color: '#fb923c', fontSize: '0.65rem', fontWeight: 700, marginRight: '0.4rem', border: '1px solid rgba(251,146,60,0.3)', padding: '0 0.2rem', borderRadius: '3px' }}>MAT</span>;
                      } else if (op.stepTyp === 1) {
                        stepTypeBadge = <span style={{ color: '#c084fc', fontSize: '0.65rem', fontWeight: 700, marginRight: '0.4rem', border: '1px solid rgba(192,132,252,0.3)', padding: '0 0.2rem', borderRadius: '3px' }}>EXT</span>;
                      }

                      return (
                        <div key={opIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bgStyle, border: borderStyle, padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', transition: 'all 0.2s', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
                            <span style={{ color: isCurrent ? '#38bdf8' : '#64748b', fontWeight: 700, fontFamily: 'monospace', minWidth: '42px', flexShrink: 0 }}>AS {op.stepPos}</span>
                            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flexGrow: 1, minWidth: 0, gap: '0.35rem' }}>
                              {stepTypeBadge}
                              <span style={{ color: textColor, fontWeight: 600, textDecoration: isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', flexGrow: 1, minWidth: 0 }} title={op.stepDesc}>
                                {op.stepDesc ? op.stepDesc.replace(/\r?\n/g, ' ') : ''}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap' }} title="Zugeordnete Maschine/Pool">{op.machineName}</span>
                            <span style={{ color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }} title="Rüstzeit / Prodzeit">{op.setupTime}m / {op.prodTime}m</span>
                            {statusBadge}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.5rem', textAlign: 'center' }}>
                    Kein Arbeitsplan für diesen Auftrag hinterlegt.
                  </div>
                )}
              </div>

              {/* Abgeschlossene Laufzeit Section */}
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Abgeschlossene Laufzeit (Ist-Zeiterfassung)</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#94a3b8' }}>
                    {loadingBookings ? 'Lade...' : `${modalBookings.length} Einträge`}
                  </span>
                </div>
                {loadingBookings ? (
                  <div className="modal-bookings-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', padding: '1rem', border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Lade Ist-Zeiten...</span>
                  </div>
                ) : modalBookings.length > 0 ? (
                  <div className="modal-bookings-container" style={{ border: '1px solid var(--border-dim)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#cbd5e1', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-dim)', color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0.4rem 0.6rem' }}>Mitarbeiter / Maschine</th>
                            <th style={{ padding: '0.4rem 0.6rem' }}>Datum</th>
                            <th style={{ padding: '0.4rem 0.6rem' }}>Uhrzeit</th>
                            <th style={{ padding: '0.4rem 0.6rem' }}>Typ</th>
                            <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Dauer (Std. / Min.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Sum up unique booking totals
                            const seenBookingIds = new Set();
                            let totalMinutes = 0;
                            
                            const rowsHtml = modalBookings.map((b, bIdx) => {
                              let typeStr = 'Sonstige';
                              if (b.ZBUBW_TYP_ZEIT === 0) {
                                typeStr = '🛠️ Rüstzeit';
                              } else if (b.ZBUBW_TYP_ZEIT === 1) {
                                if (b.ZBUBW_TYP_PRODUKTION === 1) {
                                  typeStr = '🤖 Maschine';
                                } else {
                                  typeStr = '👤 Manuell';
                                }
                              }

                              const bookingId = b.ID;
                              let showDurationText = '';
                              if (bookingId && !seenBookingIds.has(bookingId)) {
                                seenBookingIds.add(bookingId);
                                const durationMin = b.ZBU_ZEIT_GESAMT || 0;
                                totalMinutes += durationMin;
                                
                                if (durationMin >= 60) {
                                  const hours = Math.floor(durationMin / 60);
                                  const mins = Math.round(durationMin % 60);
                                  showDurationText = `${hours}h ${mins}m`;
                                } else {
                                  showDurationText = `${Math.round(durationMin)}m`;
                                }
                              }

                              return (
                                <tr key={bIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', background: bIdx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                  <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: '#f1f5f9' }}>{b.ZBU_MARB_MASTA || 'Unbekannt'}</td>
                                  <td style={{ padding: '0.45rem 0.6rem' }}>{b.ZB_DATUM_START ? new Date(b.ZB_DATUM_START).toLocaleDateString('de-DE') : '-'}</td>
                                  <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                    {b.ZBUBW_ZEIT_START || '-'} – {b.ZBUBW_ZEIT_STOP || 'laufend'}
                                  </td>
                                  <td style={{ padding: '0.45rem 0.6rem' }}>
                                    <span style={{ 
                                      fontSize: '0.62rem', 
                                      padding: '0.08rem 0.3rem', 
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                      background: b.ZBUBW_TYP_ZEIT === 0 ? 'rgba(249, 115, 22, 0.12)' : b.ZBUBW_TYP_PRODUKTION === 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                                      border: b.ZBUBW_TYP_ZEIT === 0 ? '1px solid rgba(249, 115, 22, 0.25)' : b.ZBUBW_TYP_PRODUKTION === 1 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(14, 165, 233, 0.25)',
                                      color: b.ZBUBW_TYP_ZEIT === 0 ? '#fdba74' : b.ZBUBW_TYP_PRODUKTION === 1 ? '#34d399' : '#38bdf8'
                                    }}>
                                      {typeStr}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: showDurationText ? '#fff' : '#475569' }}>
                                    {showDurationText || '↳'}
                                  </td>
                                </tr>
                              );
                            });

                            return (
                              <>
                                {rowsHtml}
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: '2px solid var(--border-dim)' }}>
                                  <td colSpan={4} style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: '#94a3b8' }}>Summe erfasste Ist-Laufzeit (D4)</td>
                                  <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#10b981', fontSize: '0.85rem' }}>
                                    {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m` : `${Math.round(totalMinutes)}m`}
                                  </td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.5rem', textAlign: 'center' }}>
                    Bisher keine Ist-Zeiterfassung für diesen Arbeitsschritt erfasst.
                  </div>
                )}
              </div>

              {/* Row 6: Rüstbedarf (Simulierte Reihenfolge & Direktvergleich) */}
              <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Left Column: Reihenfolge-Rüstbedarf (Sequentieller Ablauf) */}
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Reihenfolge-Rüstbedarf (Ablauf-Simulation)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                      Welche Werkzeuge müssen ein- und ausgelagert werden, wenn die Aufträge in der geplanten Reihenfolge ablaufen?
                    </div>
                    
                    {/* Einwechseln */}
                    {(() => {
                      const loadListName = (() => {
                        const candidates = [
                          activeModalStep.MatchedListIdent,
                          activeModalStep.matchedListIdent,
                          activeModalStep.winToolName,
                          activeModalStep.ncProgram,
                          activeModalStep.NCProgram,
                          activeModalStep.programName,
                          activeModalStep.toolListNr,
                          activeModalStep.MatchedListNr,
                          activeModalStep.matchedListNr,
                          activeModalStep.contractNumber,
                          activeModalStep.ContractNumber
                        ];
                        for (const cand of candidates) {
                          if (cand && typeof cand === 'string') {
                            const trimmed = cand.trim();
                            if (trimmed && !trimmed.includes(',') && isNaN(trimmed)) {
                              return trimmed;
                            }
                          }
                        }
                        if (activeModalStep.contractNumber) return `Auftrag ${activeModalStep.contractNumber}`;
                        if (activeModalStep.ContractNumber) return `Auftrag ${activeModalStep.ContractNumber}`;
                        return activeModalStep.MatchedListNr ? `WinTool-Liste ${activeModalStep.MatchedListNr}` : 'Werkzeugliste';
                      })();
                      const loadCount = activeModalStep.loadTools ? activeModalStep.loadTools.length : 0;
                      return (
                        <>
                          <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: '#38bdf8' }}>Einwechseln (Rein)</span>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#38bdf8', fontWeight: 600 }}>
                              +{loadCount}
                            </span>
                          </div>
                          {loadCount > 0 ? (
                            <>
                              <div style={{
                                background: 'rgba(56, 189, 248, 0.08)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '6px',
                                padding: '0.45rem 0.65rem',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.15rem'
                              }}>
                                <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>📥 WinTool-Liste:</span>
                                  <span style={{ color: '#7dd3fc', fontFamily: 'monospace' }}>{loadListName}</span>
                                  <span>einwechseln (+{loadCount} Werkzeuge)</span>
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                  Benötigte Werkzeuge der Liste abzüglich bereits im Magazin vorhandener Werkzeuge.
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1rem' }}>
                                {activeModalStep.loadTools.map((t, tIdx) => (
                                  <div key={tIdx} style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '0.15rem', 
                                    background: 'rgba(56, 189, 248, 0.03)', 
                                    border: '1px solid rgba(56, 189, 248, 0.12)', 
                                    padding: '0.45rem 0.75rem', 
                                    borderRadius: '6px', 
                                    fontSize: '0.8rem' 
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ color: '#fff', fontWeight: 700 }}>T{t.nr}</span>
                                      {t.dia && t.dia !== '0' && t.dia !== 0 ? <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>Ø {t.dia} mm</span> : null}
                                    </div>
                                    <div style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 500 }} title={t.desc}>
                                      {t.desc}
                                    </div>
                                    {t.currentMachines && t.currentMachines.length > 0 && (
                                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.15rem' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>Aktiv in:</span>
                                        {t.currentMachines.map(m => (
                                          <span key={m} style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                                            {m}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600, marginTop: '0.25rem' }}>
                                      ℹ {getToolLifetimeInfo(t, activeModalStep, 'rein')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div style={{ color: '#10b981', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', fontWeight: 500, marginBottom: '1rem' }}>
                              ✓ Keine Werkzeuge einwechseln (Alle Werkzeuge der WinTool-Liste {loadListName} sind bereits im Magazin)
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Auswechseln */}
                    {(() => {
                      const isChironModal = (activeModalStep.machineName || activeModalStep.machine || selectedMachine || '').toUpperCase().includes('CHIRON');
                      const cleanListName = (() => {
                        const candidates = [
                          activeModalStep.MatchedListIdent,
                          activeModalStep.matchedListIdent,
                          activeModalStep.unloadListNames,
                          activeModalStep.ncProgram,
                          activeModalStep.NCProgram,
                          activeModalStep.programName,
                          activeModalStep.toolListNr,
                          activeModalStep.MatchedListNr,
                          activeModalStep.matchedListNr,
                          activeModalStep.contractNumber,
                          activeModalStep.ContractNumber
                        ];
                        for (const cand of candidates) {
                          if (cand && typeof cand === 'string') {
                            const trimmed = cand.trim();
                            if (trimmed && !trimmed.includes(',') && isNaN(trimmed)) {
                              return trimmed;
                            }
                          }
                        }
                        if (activeModalStep.contractNumber) return `Auftrag ${activeModalStep.contractNumber}`;
                        if (activeModalStep.ContractNumber) return `Auftrag ${activeModalStep.ContractNumber}`;
                        return activeModalStep.MatchedListNr ? `WinTool-Liste ${activeModalStep.MatchedListNr}` : 'Werkzeugliste';
                      })();
                      const unloadCount = activeModalStep.unloadTools ? activeModalStep.unloadTools.length : 0;
                      return (
                        <>
                          <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem' }}>
                            <span style={{ color: '#f87171' }}>Auswechseln (Raus)</span>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#f87171', fontWeight: 600 }}>
                              -{unloadCount}
                            </span>
                          </div>
                          {isChironModal && (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              padding: '0.45rem 0.65rem',
                              marginBottom: '0.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.15rem'
                            }}>
                              <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>📦 Chiron WinTool-Liste:</span>
                                <span style={{ color: '#fca5a5', fontFamily: 'monospace' }}>{cleanListName}</span>
                                <span>entladen (-{unloadCount} Werkzeuge)</span>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                Entladung nach Auftragsabschluss (exkl. Park- & Folgewerkzeuge).
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {activeModalStep.unloadTools && activeModalStep.unloadTools.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {[...activeModalStep.unloadTools]
                          .sort((a, b) => getStepsUntilNextUseVal(a.nr, activeModalStep) - getStepsUntilNextUseVal(b.nr, activeModalStep))
                          .map((t, tIdx) => (
                          <div key={tIdx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.15rem', 
                            background: 'rgba(239, 68, 68, 0.03)', 
                            border: '1px solid rgba(239, 68, 68, 0.12)', 
                            padding: '0.45rem 0.75rem', 
                            borderRadius: '6px', 
                            fontSize: '0.8rem' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#fff', fontWeight: 700 }}>T{t.nr}</span>
                              {t.dia && t.dia !== '0' && t.dia !== 0 ? <span style={{ color: '#f87171', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>Ø {t.dia} mm</span> : null}
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 500 }} title={t.desc}>
                              {t.desc}
                            </div>
                            {t.currentMachines && t.currentMachines.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.15rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>Aktiv in:</span>
                                {t.currentMachines.map(m => (
                                  <span key={m} style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600, marginTop: '0.25rem' }}>
                              ℹ {getToolLifetimeInfo(t, activeModalStep, 'raus')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#10b981', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', fontWeight: 500 }}>
                        ✓ Keine Werkzeuge auswechseln (Magazin ausreichend frei)
                      </div>
                    )}
                  </div>

                  {/* Right Column: Direktvergleich (Aktueller Ist-Zustand) */}
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Direktvergleich (Aktueller Maschinenbestand)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                      Welche Werkzeuge fehlen im Vergleich zum heutigen Ist-Zustand der Maschine? (Andere Aufträge ignoriert).
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ color: '#f59e0b' }}>Fehlende Werkzeuge (Laden)</span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#f59e0b', fontWeight: 600 }}>
                        {activeModalStep.directMisses ? activeModalStep.directMisses.length : 0}
                      </span>
                    </div>
                    {activeModalStep.directMisses && activeModalStep.directMisses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {activeModalStep.directMisses.map((t, tIdx) => (
                          <div key={tIdx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.15rem', 
                            background: 'rgba(245, 158, 11, 0.03)', 
                            border: '1px solid rgba(245, 158, 11, 0.12)', 
                            padding: '0.45rem 0.75rem', 
                            borderRadius: '6px', 
                            fontSize: '0.8rem' 
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#fff', fontWeight: 700 }}>T{t.nr}</span>
                              {t.dia && t.dia !== '0' && t.dia !== 0 ? <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>Ø {t.dia} mm</span> : null}
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 500 }} title={t.desc}>
                              {t.desc}
                            </div>
                            {t.currentMachines && t.currentMachines.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.15rem' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>Aktiv in:</span>
                                {t.currentMachines.map(m => (
                                  <span key={m} style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.05rem 0.25rem', borderRadius: '4px', fontWeight: 600 }}>
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#10b981', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', fontWeight: 500 }}>
                        ✓ Alle benötigten Werkzeuge sind aktuell in der Maschine!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Weekly Setup Tools Detail */}
      {weeklyToolsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 6, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem',
          animation: 'fadeIn 0.15s ease-out'
        }} onClick={() => setWeeklyToolsModal(null)}>
          <div style={{
            background: 'radial-gradient(100% 100% at 0% 0%, var(--bg-card-glow) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--border-glow)',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '750px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            animation: 'scaleIn 0.15s ease-out'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-dim)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Wochen-Rüstbedarf: {weeklyToolsModal.machineName}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Zusammenfassung aller Rüstwechsel über den gesamten Planungszeitraum
                </p>
              </div>
              <button 
                onClick={() => setWeeklyToolsModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{
              padding: '1.25rem',
              overflowY: 'auto',
              flexGrow: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              minHeight: '250px'
            }}>
              {/* Load Tools Column (Rein) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: '#34d399', 
                  margin: 0, 
                  paddingBottom: '0.4rem', 
                  borderBottom: '2px solid rgba(52, 211, 153, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Einzuwechseln (Rein)</span>
                  <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '0.05rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                    +{weeklyToolsModal.loadTools.length}
                  </span>
                </h4>
                {weeklyToolsModal.loadTools.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
                    Keine Werkzeuge zum Einwechseln geplant.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', maxHeight: '450px' }}>
                    {weeklyToolsModal.loadTools.map((t, idx) => (
                      <div key={idx} style={{ 
                        background: 'rgba(52, 211, 153, 0.03)', 
                        border: '1px solid rgba(52, 211, 153, 0.1)', 
                        borderRadius: '6px', 
                        padding: '0.45rem 0.6rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                          <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>T{t.nr}</span>
                          <span style={{ color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.desc}>
                            {t.desc}
                          </span>
                          {t.currentMachines && t.currentMachines.length > 0 && (
                            <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.02rem 0.2rem', borderRadius: '3px', fontWeight: 600, marginLeft: '0.25rem', whiteSpace: 'nowrap' }} title={`Aktuell geladen in: ${t.currentMachines.join(', ')}`}>
                              📍 {t.currentMachines.join(', ')}
                            </span>
                          )}
                        </div>
                        {t.dia && t.dia !== '0' && t.dia !== 0 ? (
                          <span style={{ color: '#38bdf8', fontSize: '0.7rem', fontWeight: 600, fontFamily: 'monospace' }}>
                            Ø{t.dia}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unload Tools Column (Raus) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: '#f87171', 
                  margin: 0, 
                  paddingBottom: '0.4rem', 
                  borderBottom: '2px solid rgba(248, 113, 113, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Auszuwechseln (Raus)</span>
                  <span style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', padding: '0.05rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                    -{weeklyToolsModal.unloadTools.length}
                  </span>
                </h4>
                {weeklyToolsModal.unloadTools.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
                    Keine Werkzeuge zum Auswechseln geplant.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', maxHeight: '450px' }}>
                    {[...weeklyToolsModal.unloadTools]
                      .sort((a, b) => getWeeklyNextUseIndex(a.nr, weeklyToolsModal.machineName) - getWeeklyNextUseIndex(b.nr, weeklyToolsModal.machineName))
                      .map((t, idx) => (
                        <div key={idx} style={{ 
                          background: 'rgba(248, 113, 113, 0.03)', 
                          border: '1px solid rgba(248, 113, 113, 0.1)', 
                          borderRadius: '6px', 
                          padding: '0.45rem 0.6rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ color: '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>T{t.nr}</span>
                              <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.desc}>
                                {t.desc}
                              </span>
                              {t.currentMachines && t.currentMachines.length > 0 && (
                                <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.02rem 0.2rem', borderRadius: '3px', fontWeight: 600, marginLeft: '0.25rem', whiteSpace: 'nowrap' }} title={`Aktuell geladen in: ${t.currentMachines.join(', ')}`}>
                                  📍 {t.currentMachines.join(', ')}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 500 }}>
                              ℹ {getWeeklyToolLifetimeInfo(t.nr, weeklyToolsModal.machineName)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--border-dim)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(0,0,0,0.1)'
            }}>
              <button 
                className="btn-primary" 
                onClick={() => setWeeklyToolsModal(null)}
                style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem' }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
      {/* d.velop DMS Drawing Slider Drawer */}
      {dmsSliderOpen && dmsSliderList.length > 0 && (() => {
        const currentItem = dmsSliderList[dmsSliderIndex];
        let iframeSrc = `${API_BASE}/dms/drawing/${encodeURIComponent(currentItem.articleId)}?mode=proxy&index=${dmsSubIndex}`;
        if (dmsSliderFixture) {
          iframeSrc += `&fixture=${encodeURIComponent(dmsSliderFixture)}`;
        }
        
        return (
          <>
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: dmsSliderFullscreen ? '100%' : '55%',
              height: '100%',
              background: '#0f172a',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideIn 0.25s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1e293b'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Zeichnungs-Explorer
                </span>
                <h4 style={{ color: '#fff', margin: '0.1rem 0 0 0', fontSize: '1.05rem', fontWeight: 600 }}>
                  Artikel: {dmsResolvedArticleNumber || currentItem.articleId}
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setDmsSliderFullscreen(prev => !prev)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title={dmsSliderFullscreen ? "Viewer verkleinern (55% Breite)" : "Viewer maximieren (Ganze Breite)"}
                >
                  <span>{dmsSliderFullscreen ? '🗗 Verkleinern' : '🗖 Maximieren'}</span>
                </button>
                <button
                  onClick={() => setUseNativePdf(prev => !prev)}
                  style={{
                    background: useNativePdf ? 'rgba(56, 189, 248, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    color: useNativePdf ? '#38bdf8' : '#34d399',
                    border: useNativePdf ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title={useNativePdf ? "Wechseln zu integriertem HTML5 Viewer (Keine Installation nötig)" : "Wechseln zu System-Browser Viewer"}
                >
                  <span>{useNativePdf ? '🖥️ Browser-Viewer' : '🎨 HTML5-Viewer'}</span>
                </button>
                <button 
                  onClick={() => setDmsSliderOpen(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  Schließen
                </button>
              </div>
            </div>
            
            {/* Slider Controls */}
            {dmsSliderList.length > 1 && (
              <div style={{
                padding: '0.75rem 1.5rem',
                background: '#1e293b',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  disabled={dmsSliderIndex === 0}
                  onClick={() => setDmsSliderIndex(prev => prev - 1)}
                  style={{
                    background: dmsSliderIndex === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(56,189,248,0.1)',
                    color: dmsSliderIndex === 0 ? '#64748b' : '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.15)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: dmsSliderIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  ◀ Vorherige
                </button>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                  Zeichnung {dmsSliderIndex + 1} von {dmsSliderList.length}
                </span>
                <button
                  disabled={dmsSliderIndex === dmsSliderList.length - 1}
                  onClick={() => setDmsSliderIndex(prev => prev + 1)}
                  style={{
                    background: dmsSliderIndex === dmsSliderList.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(56,189,248,0.1)',
                    color: dmsSliderIndex === dmsSliderList.length - 1 ? '#64748b' : '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.15)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: dmsSliderIndex === dmsSliderList.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Nächste ▶
                </button>
              </div>
            )}
            
            {/* Sub-documents / multiple files selector (Pfeile für Revisionen/weitere Dateien) */}
            {dmsSubDocs && dmsSubDocs.length > 1 && (
              <div style={{
                padding: '0.6rem 1.5rem',
                background: '#0f172a',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  disabled={dmsSubIndex === 0}
                  onClick={() => setDmsSubIndex(prev => prev - 1)}
                  style={{
                    background: dmsSubIndex === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(16,185,129,0.1)',
                    color: dmsSubIndex === 0 ? '#475569' : '#34d399',
                    border: '1px solid rgba(16,185,129,0.15)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    cursor: dmsSubIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  ◀ Vorheriges Dok.
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden', padding: '0 0.5rem' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}>
                    Dokument {dmsSubIndex + 1} von {dmsSubDocs.length}
                  </span>
                  {dmsSubDocs[dmsSubIndex] && (
                    <span style={{ color: '#64748b', fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }} title={dmsSubDocs[dmsSubIndex].caption}>
                      {dmsSubDocs[dmsSubIndex].caption}
                    </span>
                  )}
                </div>
                <button
                  disabled={dmsSubIndex === dmsSubDocs.length - 1}
                  onClick={() => setDmsSubIndex(prev => prev + 1)}
                  style={{
                    background: dmsSubIndex === dmsSubDocs.length - 1 ? 'rgba(255,255,255,0.01)' : 'rgba(16,185,129,0.1)',
                    color: dmsSubIndex === dmsSubDocs.length - 1 ? '#475569' : '#34d399',
                    border: '1px solid rgba(16,185,129,0.15)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    cursor: dmsSubIndex === dmsSubDocs.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Nächstes Dok. ▶
                </button>
              </div>
            )}
            
            {/* Embedded PDF iframe */}
            <div style={{ flex: 1, position: 'relative', background: '#020617', minHeight: 0 }}>
              {useNativePdf ? (
                <iframe
                  src={iframeSrc}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#020617'
                  }}
                  title="DMS PDF Viewer"
                />
              ) : (
                <PDFCanvasViewer url={iframeSrc} dmsSliderFullscreen={dmsSliderFullscreen} />
              )}
            </div>
          </div>
        </>
        );
      })()}
    </div>
  );
}

function PDFCanvasViewer({ url, dmsSliderFullscreen }) {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPdf(null);
    
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        // Load worker script cross-origin via Blob URL to execute in a separate worker thread
        const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js');`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        loadPdf();
      };
      script.onerror = () => {
        setError('PDF.js CDN konnte nicht geladen werden.');
        setLoading(false);
      };
      document.body.appendChild(script);
    } else {
      loadPdf();
    }

    function loadPdf() {
      const loadingTask = window.pdfjsLib.getDocument({
        url: url,
        withCredentials: false
      });
      loadingTask.promise.then(
        (loadedPdf) => {
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setCurrentPage(1);
          setLoading(false);
        },
        (err) => {
          console.error('Error loading PDF with PDF.js:', err);
          setError(err.message || 'Fehler beim Laden des PDFs.');
          setLoading(false);
        }
      );
    }
  }, [url]);

  // Auto-fit scale to fit container height/width exactly
  useEffect(() => {
    if (!pdf) return;
    
    const timer = setTimeout(() => {
      pdf.getPage(currentPage).then((page) => {
        const container = containerRef.current;
        if (!container) return;
        
        const viewport1 = page.getViewport({ scale: 1 });
        const padding = 32;
        const widthScale = (container.clientWidth - padding) / viewport1.width;
        const heightScale = (container.clientHeight - padding) / viewport1.height;
        
        // Choose the smaller scale to fit the entire page
        const fitScale = Math.min(widthScale, heightScale);
        const clampedScale = Math.max(Math.min(fitScale, 3), 0.25);
        
        setScale(clampedScale);
      });
    }, 120); // 120ms delay to allow DOM/drawer layout transition animations to complete
    
    return () => clearTimeout(timer);
  }, [pdf, dmsSliderFullscreen, currentPage]);

  useEffect(() => {
    if (!pdf) return;
    
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
    
    pdf.getPage(currentPage).then((page) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale });
      
      // Double-buffering: Render to an off-screen canvas in the background to prevent flickering
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = viewport.width * pixelRatio;
      tempCanvas.height = viewport.height * pixelRatio;
      const tempContext = tempCanvas.getContext('2d');
      
      const renderContext = {
        canvasContext: tempContext,
        viewport: viewport,
        transform: [pixelRatio, 0, 0, pixelRatio, 0, 0]
      };
      
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      
      renderTask.promise.then(
        () => {
          // Render finished! Draw the buffered content onto the visible canvas in a single frame
          canvas.width = tempCanvas.width;
          canvas.height = tempCanvas.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          
          const context = canvas.getContext('2d');
          context.drawImage(tempCanvas, 0, 0);
          
          renderTaskRef.current = null;
        },
        (err) => {
          if (err.name !== 'RenderingCancelledException') {
            console.error('Render error:', err);
          }
        }
      );
    });
    
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, currentPage, scale]);

  // Gestures: Ctrl + Mouse Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setScale(prev => Math.min(prev + 0.1, 3.0));
        } else {
          setScale(prev => Math.max(prev - 0.1, 0.5));
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [pdf]);

  // Gestures: Mouse drag to pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    const container = containerRef.current;
    if (!container) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop
    });
    container.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    container.scrollLeft = dragStart.scrollLeft - dx;
    container.scrollTop = dragStart.scrollTop - dy;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const container = containerRef.current;
    if (container) {
      container.style.cursor = scale > 1 ? 'grab' : 'default';
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.style.cursor = scale > 1 ? 'grab' : 'default';
    }
  }, [scale]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', gap: '1rem', background: '#020617' }}>
        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(56,189,248,0.1)', borderTop: '3px solid #38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ fontSize: '0.85rem' }}>Lade Dokument mit PDF.js...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#f87171', padding: '2rem', textAlign: 'center', background: '#020617', gap: '0.75rem' }}>
        <span>⚠️ PDF.js Fehler: {error}</span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Nutzen Sie stattdessen den Browser-Viewer im Header-Menü.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a' }}>
      {/* Viewer controls */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '0.5rem', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <button 
          disabled={currentPage <= 1} 
          onClick={() => setCurrentPage(prev => prev - 1)}
          style={{ background: currentPage <= 1 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.06)', color: currentPage <= 1 ? '#475569' : '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem' }}
        >
          ◀ Zurück
        </button>
        <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
          Seite {currentPage} von {numPages}
        </span>
        <button 
          disabled={currentPage >= numPages} 
          onClick={() => setCurrentPage(prev => prev + 1)}
          style={{ background: currentPage >= numPages ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.06)', color: currentPage >= numPages ? '#475569' : '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: currentPage >= numPages ? 'not-allowed' : 'pointer', fontSize: '0.75rem' }}
        >
          Weiter ▶
        </button>
        <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.1)' }} />
        <button 
          onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))}
          style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          🔍 Verkleinern
        </button>
        <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button 
          onClick={() => setScale(prev => Math.min(prev + 0.25, 3))}
          style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          Vergrößern 🔍
        </button>
      </div>
      {/* Canvas container with drag & scroll handlers */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '1.5rem', 
          background: '#020617',
          userSelect: 'none',
          textAlign: 'center',
          minHeight: 0
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
            background: '#fff', 
            borderRadius: '4px',
            display: 'inline-block',
            margin: '0 auto'
          }} 
        />
      </div>
    </div>
  );
}


/* ==========================================
   PLANNING EVALUATION TAB (Auswertung Planung)
   ========================================== */
function PlanningEvaluationTab({ theme, selectedMachine, setSelectedMachine }) {
  const ganttContainerRef = useRef(null);
  const chartContainerRef = useRef(null);

  const [highlightedDayIndex, setHighlightedDayIndex] = useState(null);
  const [weeksCount, setWeeksCount] = useState(4); // 1 to 20 weeks
  const [tempWeeksCount, setTempWeeksCount] = useState(4);
  useEffect(() => { setTempWeeksCount(weeksCount); }, [weeksCount]);
  const [includeGesperrte, setIncludeGesperrte] = useState(false);
  const [includeVorgemerkte, setIncludeVorgemerkte] = useState(false);
  const [useOptimizedPlan, setUseOptimizedPlan] = useState(false);
  const [chartViewType, setChartViewType] = useState('ruest_lauf'); // 'ruest_lauf' | 'status'
  const [showTrendline, setShowTrendline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRuestFilter, setShowRuestFilter] = useState(true);
  const [showProdFilter, setShowProdFilter] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const refetch = () => setReloadTrigger(c => c + 1);
  const [activeViewMode, setActiveViewMode] = useState('gantt'); // 'gantt' | 'cards' | 'kanban'
  const [selectedStepDetail, setSelectedStepDetail] = useState(null);
  const [hoveredContractNumber, setHoveredContractNumber] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [loadingStageText, setLoadingStageText] = useState('D4-Auftragsdaten laden...');
  const [currentDayLoaded, setCurrentDayLoaded] = useState(0);

  const [error, setError] = useState(null);
  const [boardData, setBoardData] = useState({});
  const [dailyCapacities, setDailyCapacities] = useState({});
  const [planningDays, setPlanningDays] = useState([]);
  const [summaryInfo, setSummaryInfo] = useState(null);
  const [visibleStepLimits, setVisibleStepLimits] = useState({});

  const handleLoadMoreSteps = (mName, count = 25) => {
    setVisibleStepLimits(prev => ({
      ...prev,
      [mName]: (prev[mName] || 15) + count
    }));
  };

  const handleShowAllSteps = (mName, totalCount) => {
    setVisibleStepLimits(prev => ({
      ...prev,
      [mName]: totalCount
    }));
  };

  const handleCollapseSteps = (mName) => {
    setVisibleStepLimits(prev => ({
      ...prev,
      [mName]: 15
    }));
  };

  const handleChartDayClick = (targetIdx) => {
    if (targetIdx === undefined || targetIdx === null || targetIdx < 0) return;
    setActiveViewMode('gantt');
    setHighlightedDayIndex(targetIdx);

    setTimeout(() => {
      setHighlightedDayIndex(null);
    }, 4000);
  };

  useEffect(() => {
    if (highlightedDayIndex !== null && highlightedDayIndex !== undefined) {
      if (activeViewMode !== 'gantt') {
        setActiveViewMode('gantt');
      }

      const animateScroll = (element, targetPos, isHorizontal = false, duration = 500) => {
        if (!element) return;
        const startPos = isHorizontal ? element.scrollLeft : element.scrollTop;
        const change = targetPos - startPos;
        if (Math.abs(change) < 2) return;

        const startTime = performance.now();

        const step = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(1, elapsed / duration);
          const easeProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const currentScrollPos = startPos + change * easeProgress;
          if (isHorizontal) {
            element.scrollLeft = currentScrollPos;
          } else {
            element.scrollTop = currentScrollPos;
          }

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        };

        requestAnimationFrame(step);
      };

      const timer = setTimeout(() => {
        const contentBody = document.querySelector('.content-body');
        const ganttSec = document.getElementById('gantt-section');
        const el = document.getElementById('gantt-col-idx-' + highlightedDayIndex);
        const container = ganttContainerRef.current;

        if (contentBody && ganttSec) {
          const topPos = ganttSec.offsetTop - contentBody.offsetTop;
          animateScroll(contentBody, Math.max(0, topPos - 15), false, 450);
        } else if (ganttSec) {
          ganttSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (container && el) {
          const targetLeft = el.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2);
          animateScroll(container, Math.max(0, targetLeft), true, 500);
        }
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [highlightedDayIndex, activeViewMode]);

  const [activeModalStep, setActiveModalStep] = useState(null);
  const [fullRoutingSteps, setFullRoutingSteps] = useState([]);
  const [loadingRouting, setLoadingRouting] = useState(false);
  const [modalBookings, setModalBookings] = useState([]);

  // d.velop DMS Drawing Slider States for PlanningEvaluationTab
  const [dmsSliderOpen, setDmsSliderOpen] = useState(false);
  const [dmsSliderList, setDmsSliderList] = useState([]);
  const [dmsSliderIndex, setDmsSliderIndex] = useState(0);
  const [dmsSliderFullscreen, setDmsSliderFullscreen] = useState(false);
  const [dmsSubDocs, setDmsSubDocs] = useState([]);
  const [dmsSubIndex, setDmsSubIndex] = useState(0);
  const [loadingDmsMeta, setLoadingDmsMeta] = useState(false);
  const [dmsResolvedArticleNumber, setDmsResolvedArticleNumber] = useState('');
  const [dmsSliderFixture, setDmsSliderFixture] = useState(null);

  const openDmsSlider = (articleId, articleName, customList = null, fixture = null) => {
    setDmsSliderFixture(fixture || null);
    setDmsResolvedArticleNumber('');
    if (customList && customList.length > 0) {
      setDmsSliderList(customList);
      const idx = customList.findIndex(item => item.articleId === articleId);
      setDmsSliderIndex(idx >= 0 ? idx : 0);
    } else {
      setDmsSliderList([{ articleId, articleName }]);
      setDmsSliderIndex(0);
    }
    setDmsSliderOpen(true);
  };

  // Exact milling machines list (matching "Planung Maschinen")
  const validMillingMachines = ['Brother', 'Chiron', 'C400', 'C40', 'C42', 'RS2_1', 'RS2_2'];

  // Routing Modal & BDE Bookings loading effect
  useEffect(() => {
    if (!activeModalStep) {
      setFullRoutingSteps([]);
      setModalBookings([]);
      return;
    }
    const loadModalDetails = async () => {
      setLoadingRouting(true);
      try {
        const sId = activeModalStep.stepId || activeModalStep.StepId;
        const cNum = activeModalStep.contractNumber || activeModalStep.ContractNumber;
        const oId = activeModalStep.orderId || activeModalStep.OrderId || cNum || sId;

        if (oId) {
          let res = await fetch(API_BASE + '/orders/' + encodeURIComponent(oId) + '/steps');
          let json = res.ok ? await res.json() : [];

          if ((!json || json.length === 0) && sId && sId !== oId) {
            res = await fetch(API_BASE + '/orders/' + encodeURIComponent(sId) + '/steps');
            json = res.ok ? await res.json() : [];
          }

          if ((!json || json.length === 0) && cNum && cNum !== oId) {
            res = await fetch(API_BASE + '/orders/' + encodeURIComponent(cNum) + '/steps');
            json = res.ok ? await res.json() : [];
          }

          if (Array.isArray(json) && json.length > 0) {
            const mapped = json.map(op => ({
              stepId: op.StepId,
              stepPos: op.StepPos,
              stepDesc: (op.StepDesc || '').trim(),
              setupTime: op.SetupTime || 0,
              prodTime: op.ProdTime || 0,
              isCompleted: op.SPKO === 4,
              isExecuting: op.SPKO === 2,
              machineName: op.MachineName || (op.MachineId ? ('Maschine #' + op.MachineId) : 'Pool'),
              stepTyp: op.StepTyp,
              stepTypName: op.StepTypName
            }));
            setFullRoutingSteps(mapped);
          } else {
            setFullRoutingSteps([]);
          }
        }

        if (sId) {
          const bRes = await fetch(API_BASE + '/planning/step-bookings?stepId=' + sId);
          if (bRes.ok) {
            const bJson = await bRes.json();
            setModalBookings(Array.isArray(bJson) ? bJson : []);
          }
        }
      } catch (err) {
        console.error('Error fetching modal details:', err);
      } finally {
        setLoadingRouting(false);
      }
    };
    loadModalDetails();
  }, [activeModalStep]);

  // Fetch planning data with progress bar simulation and AbortController
  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;

    setLoading(true);
    setError(null);
    setLoadingPercent(5);
    setLoadingStageText('D4-Auftrags- und Kapazitätsdaten werden abgerufen...');
    setCurrentDayLoaded(0);

    const totalDaysToLoad = weeksCount * 7;
    let simulatedDay = 0;
    const stepInterval = Math.max(180, Math.round(6000 / totalDaysToLoad));

    const interval = setInterval(() => {
      if (isCancelled) return;
      simulatedDay += 1;
      if (simulatedDay <= totalDaysToLoad) {
        const pct = Math.min(92, Math.round((simulatedDay / totalDaysToLoad) * 88) + 4);
        setCurrentDayLoaded(simulatedDay);
        setLoadingPercent(pct);
        setLoadingStageText('Berechne Belegung für Tag ' + simulatedDay + ' von ' + totalDaysToLoad + '...');
      } else {
        setLoadingPercent(95);
        setLoadingStageText(useOptimizedPlan ? 'Berechne Engpass-gesteuerte Maschinenbelegungen...' : 'Erstelle Auswertung aus D4-Originaldaten...');
      }
    }, stepInterval);

    const runFetch = async () => {
      try {
        const days = weeksCount * 7;
        const res = await fetch(API_BASE + '/planning?daysCount=' + days + '&includeNonGreen=true&useD4Plan=' + (!useOptimizedPlan), {
          signal: controller.signal
        });
        if (!res.ok) {
          throw new Error('Fehler beim Laden der Planungsdaten (' + res.status + ' ' + res.statusText + ')');
        }
        const data = await res.json();
        if (isCancelled) return;

        setBoardData(data.board || {});
        setDailyCapacities(data.dailyCapacities || data.capacities || {});
        setSummaryInfo(data.summary || null);
        const daysList = (data.days || data.planningDays || (
          data.board && Object.keys(data.board).length > 0 
            ? Object.keys(data.board[Object.keys(data.board)[0]] || {}) 
            : []
        )).filter(d => d !== 'Überlauf');
        setPlanningDays(daysList);

        clearInterval(interval);
        setCurrentDayLoaded(totalDaysToLoad);
        setLoadingPercent(100);
        setLoadingStageText('Auswertung abgeschlossen!');

        setTimeout(() => {
          if (!isCancelled) setLoading(false);
        }, 250);
      } catch (err) {
        clearInterval(interval);
        if (err.name === 'AbortError') {
          console.log('Planning evaluation fetch aborted cleanly.');
          return;
        }
        if (!isCancelled) {
          console.error('Error loading planning evaluation data:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      isCancelled = true;
      clearInterval(interval);
      controller.abort();
    };
  }, [weeksCount, includeVorgemerkte, includeGesperrte, useOptimizedPlan, reloadTrigger]);

  // Filter board keys to ONLY valid milling machines present in boardData
  const availableMillingMachines = validMillingMachines.filter(m => boardData[m] !== undefined || Object.keys(boardData).length === 0);

  // Machine / Pool Filter Options
  const filterOptions = [
    { value: 'All', label: 'Alle Fräsmaschinen (7)' },
    { value: 'ROBOTER_ALL', label: '🤖 Alle Roboteranlagen (C40, C42, RS2_1, RS2_2)' },
    { value: 'POOL_RS2', label: '🤖 Robotersystem RS2 Pool (RS2_1, RS2_2)' },
    { value: 'POOL_C40_C42', label: '🤖 Robotersystem C40-C42 Pool (C40, C42)' },
    { value: 'Brother', label: 'Brother (SPEEDIO)' },
    { value: 'Chiron', label: 'Chiron (FZ 15 W)' },
    { value: 'C400', label: 'Hermle C400' },
    { value: 'C40', label: 'Hermle C40' },
    { value: 'C42', label: 'Hermle C42' },
    { value: 'RS2_1', label: 'Fräsen RS2-1' },
    { value: 'RS2_2', label: 'Fräsen RS2-2' }
  ];

  // Resolve active filter to array of machine names
  const getSelectedMachineNames = () => {
    const sel = selectedMachine || 'All';
    if (sel === 'All') return validMillingMachines;
    if (sel === 'ROBOTER_ALL') return ['C40', 'C42', 'RS2_1', 'RS2_2'];
    if (sel === 'POOL_RS2') return ['RS2_1', 'RS2_2'];
    if (sel === 'POOL_C40_C42') return ['C40', 'C42'];
    
    // Check direct match
    const matched = validMillingMachines.filter(m => {
      if (m === sel) return true;
      if (sel === 'C400' && m === 'C40') return false;
      if (sel === 'C40' && m === 'C400') return false;
      const selLower = sel.toLowerCase();
      const mLower = m.toLowerCase();
      return selLower === mLower;
    });
    return matched.length > 0 ? matched : validMillingMachines;
  };

  const filteredMachines = getSelectedMachineNames();

  // Compute machine utilization summaries
  const machineSummaries = filteredMachines.map(mName => {
    const machineBoard = boardData[mName] || {};
    const machineCaps = dailyCapacities[mName] || {};

    let totalCapMin = 0;
    let freigegebenMin = 0;
    let gesperrtMin = 0;
    let vorgemerktMin = 0;
    let stepsList = [];

    // Separate 4-week window metrics from overflow backlog to match D4 native evaluation!
    let windowFreigegebenMin = 0;
    let windowGesperrtMin = 0;
    let windowVorgemerktMin = 0;

    let overflowFreigegebenMin = 0;
    let overflowGesperrtMin = 0;
    let overflowVorgemerktMin = 0;

    let explicitMin = 0;
    let poolShareMin = 0;

    const allBoardDays = Array.from(new Set([...planningDays, ...Object.keys(machineBoard)]));

    allBoardDays.forEach(day => {
      const isWindowDay = planningDays.includes(day);
      if (isWindowDay) {
        totalCapMin += (machineCaps[day] || 0);
      }

      const daySteps = machineBoard[day] || [];
      daySteps.forEach(s => {
        const isFreigegeben = s.isFreigegeben !== undefined ? s.isFreigegeben : (s.zustandPlanung !== undefined ? s.zustandPlanung === 0 : true);
        const isGesperrt = !!(s.isGesperrt || s.typSperre > 0);

        // Filter by user selection
        if (!isFreigegeben && !includeVorgemerkte) {
          return;
        }
        if (isFreigegeben && isGesperrt && !includeGesperrte) {
          return;
        }

        const contractNumber = s.contractNumber || s.ContractNumber || s.orderId || s.OrderId || s.BK_BKBE_NUMMER || 'P-Auftrag';
        const orderPos = s.orderPos || s.OrderPos || s.BP_POSITION_NUMMER || '10';
        const stepPos = s.stepPos || s.StepPos || s.PSP_POSITION_NUMMER || '10';
        const stepDesc = s.stepDesc || s.StepDesc || s.articleDesc || s.ArticleDesc || s.orderDesc || s.OrderDesc || '';

        // Apply text search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = String(contractNumber).toLowerCase().includes(q) ||
                        String(orderPos).toLowerCase().includes(q) ||
                        String(stepDesc).toLowerCase().includes(q);
          if (!match) return;
        }

        const setupVal = s.setupTime !== undefined ? s.setupTime : (s.SetupTime || 0);
        const prodVal = s.prodTime !== undefined ? s.prodTime : (s.ProdTime || 0);
        const schedVal = s.scheduledMin !== undefined ? s.scheduledMin : (s.ScheduledMin || 0);

        let stepTime = 0;
        if (showRuestFilter && showProdFilter) {
          stepTime = (setupVal + prodVal) > 0 ? (setupVal + prodVal) : schedVal;
        } else if (showRuestFilter) {
          stepTime = setupVal;
        } else if (showProdFilter) {
          stepTime = prodVal > 0 ? prodVal : schedVal;
        }

        if (stepTime === 0 && schedVal > 0) {
          stepTime = schedVal;
        }

        const isPoolStep = !!(s.machinePoolId === 13 || s.machinePoolId === 9 || s.machinePoolId === 12);
        if (isPoolStep) {
          poolShareMin += stepTime;
        } else {
          explicitMin += stepTime;
        }

        if (isWindowDay) {
          if (!isFreigegeben) windowVorgemerktMin += stepTime;
          else if (isGesperrt) windowGesperrtMin += stepTime;
          else windowFreigegebenMin += stepTime;
        } else {
          if (!isFreigegeben) overflowVorgemerktMin += stepTime;
          else if (isGesperrt) overflowGesperrtMin += stepTime;
          else overflowFreigegebenMin += stepTime;
        }

        if (!isFreigegeben) vorgemerktMin += stepTime;
        else if (isGesperrt) gesperrtMin += stepTime;
        else freigegebenMin += stepTime;

        stepsList.push({
          ...s,
          contractNumber,
          ContractNumber: contractNumber,
          orderPos,
          OrderPos: orderPos,
          stepPos,
          StepPos: stepPos,
          stepDesc,
          StepDesc: stepDesc,
          day,
          isFreigegeben,
          isGesperrt,
          stepTime,
          isPoolStep
        });
      });
    });

    const windowPlannedMin = windowFreigegebenMin + windowGesperrtMin + windowVorgemerktMin;
    const overflowPlannedMin = overflowFreigegebenMin + overflowGesperrtMin + overflowVorgemerktMin;

    const windowFreigegebenHrs = windowFreigegebenMin / 60;
    const windowGesperrtHrs = windowGesperrtMin / 60;
    const windowVorgemerktHrs = windowVorgemerktMin / 60;
    const windowPlannedHrs = windowPlannedMin / 60;
    const overflowPlannedHrs = overflowPlannedMin / 60;

    const totalCapHrs = totalCapMin / 60;
    const totalPlannedMin = freigegebenMin + gesperrtMin + vorgemerktMin;
    const totalPlannedHrs = totalPlannedMin / 60;

    // Window utilization matches strictly the selected time window (1, 2, 4, 6 weeks)
    const windowUtilizationPct = totalCapHrs > 0 ? (windowPlannedHrs / totalCapHrs) * 100 : 0;
    const freigegebenPct = totalCapHrs > 0 ? (windowFreigegebenHrs / totalCapHrs) * 100 : 0;
    const gesperrtPct = totalCapHrs > 0 ? (windowGesperrtHrs / totalCapHrs) * 100 : 0;
    const vorgemerktPct = totalCapHrs > 0 ? (windowVorgemerktHrs / totalCapHrs) * 100 : 0;

    return {
      machineName: mName,
      totalCapMin,
      totalCapHrs,
      windowFreigegebenMin,
      windowFreigegebenHrs,
      windowGesperrtMin,
      windowGesperrtHrs,
      windowVorgemerktMin,
      windowVorgemerktHrs,
      windowPlannedMin,
      windowPlannedHrs,
      overflowPlannedMin,
      overflowPlannedHrs,
      freigegebenHrs: windowFreigegebenHrs, // UI default reflects window
      gesperrtHrs: windowGesperrtHrs,       // UI default reflects window
      vorgemerktHrs: windowVorgemerktHrs,   // UI default reflects window
      totalPlannedHrs: windowPlannedHrs,
      allTimeFreigegebenHrs: freigegebenMin / 60,
      allTimeGesperrtHrs: gesperrtMin / 60,
      allTimeVorgemerktHrs: vorgemerktMin / 60,
      explicitMin,
      explicitHrs: explicitMin / 60,
      poolShareMin,
      poolShareHrs: poolShareMin / 60,
      windowUtilizationPct,
      utilizationPct: windowUtilizationPct,
      freigegebenPct,
      gesperrtPct,
      vorgemerktPct,
      stepsCount: stepsList.length,
      stepsList
    };
  });

  // Global total metrics for selected filter STRICTLY BASED ON SELECTED TIME WINDOW
  const globalTotalCapHrs = machineSummaries.reduce((sum, m) => sum + m.totalCapHrs, 0);
  const globalFreigegebenHrs = machineSummaries.reduce((sum, m) => sum + m.windowFreigegebenHrs, 0);
  const globalGesperrtHrs = machineSummaries.reduce((sum, m) => sum + m.windowGesperrtHrs, 0);
  const globalVorgemerktHrs = machineSummaries.reduce((sum, m) => sum + m.windowVorgemerktHrs, 0);
  const globalTotalPlannedHrs = globalFreigegebenHrs + globalGesperrtHrs + globalVorgemerktHrs;
  const globalOverflowHrs = machineSummaries.reduce((sum, m) => sum + m.overflowPlannedHrs, 0);
  const globalUtilizationPct = globalTotalCapHrs > 0 ? (globalTotalPlannedHrs / globalTotalCapHrs) * 100 : 0;

  // Chart data: Timeline per Day FILTERED STRICTLY BY SELECTED MACHINES AND STATUSES
  const chartData = planningDays.map(day => {
    let dayCapMin = 0;
    let dayFreigegebenMin = 0;
    let dayGesperrtMin = 0;
    let dayVorgemerktMin = 0;
    let dayRuestMin = 0;
    let dayLaufMin = 0;

    filteredMachines.forEach(mName => {
      dayCapMin += (dailyCapacities[mName]?.[day] || 0);
      const daySteps = boardData[mName]?.[day] || [];
      daySteps.forEach(s => {
        const isFreigegeben = s.isFreigegeben !== undefined ? s.isFreigegeben : (s.zustandPlanung !== undefined ? s.zustandPlanung === 0 : true);
        const isGesperrt = !!(s.isGesperrt || s.typSperre > 0);

        if (!isFreigegeben && !includeVorgemerkte) return;
        if (isFreigegeben && isGesperrt && !includeGesperrte) return;

        let setupMin = showRuestFilter ? (s.setupTime || s.SetupTime || 0) : 0;
        let prodMin = showProdFilter ? (s.prodTime || s.ProdTime || (s.scheduledMin || s.ScheduledMin || 0) - setupMin) : 0;
        if (prodMin < 0) prodMin = 0;

        let stepTime = setupMin + prodMin;
        if (stepTime === 0 && (s.scheduledMin || s.ScheduledMin) > 0) {
          stepTime = s.scheduledMin || s.ScheduledMin;
        }
        dayRuestMin += setupMin;
        dayLaufMin += prodMin;

        if (!isFreigegeben) {
          dayVorgemerktMin += stepTime;
        } else if (isGesperrt) {
          dayGesperrtMin += stepTime;
        } else {
          dayFreigegebenMin += stepTime;
        }
      });
    });

    const dObj = new Date(day);
    const dayLabel = !isNaN(dObj.getTime()) ? (String(dObj.getDate()).padStart(2, '0') + '.' + String(dObj.getMonth() + 1).padStart(2, '0') + '.') : day;

    return {
      day,
      dayLabel,
      Kapazität: Math.round((dayCapMin / 60) * 10) / 10,
      Freigegeben: Math.round((dayFreigegebenMin / 60) * 10) / 10,
      Gesperrt: Math.round((dayGesperrtMin / 60) * 10) / 10,
      Vorgemerkt: Math.round((dayVorgemerktMin / 60) * 10) / 10,
      Rüstzeit: Math.round((dayRuestMin / 60) * 10) / 10,
      Laufzeit: Math.round((dayLaufMin / 60) * 10) / 10,
      GesamtGeplant: Math.round(((dayFreigegebenMin + dayGesperrtMin + dayVorgemerktMin) / 60) * 10) / 10
    };
  });

  // Calculate linear trend line for GesamtGeplant (total planned workload)
  const nPoints = chartData.length;
  let trendSlope = 0;
  let trendIntercept = 0;

  if (nPoints > 1) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    chartData.forEach((item, idx) => {
      const x = idx;
      const y = item.GesamtGeplant;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const meanX = sumX / nPoints;
    const meanY = sumY / nPoints;
    const denom = sumXX - nPoints * meanX * meanX;

    if (denom !== 0) {
      trendSlope = (sumXY - nPoints * meanX * meanY) / denom;
      trendIntercept = meanY - trendSlope * meanX;
    } else {
      trendIntercept = meanY;
    }
  } else if (nPoints === 1) {
    trendIntercept = chartData[0]?.GesamtGeplant || 0;
  }

  const slopePerWeek = trendSlope * 7;

  const chartDataWithTrend = chartData.map((item, idx) => ({
    ...item,
    Trend: Math.max(0, Math.round((trendSlope * idx + trendIntercept) * 10) / 10)
  }));

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', maxWidth: '650px', margin: '3rem auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <RefreshCw size={28} className="spinning" style={{ color: '#3b82f6' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Berechne Maschinenauslastung für die nächsten {weeksCount} Wochen ({weeksCount * 7} Tage)
          </div>
        </div>

        {/* Progress Text */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>{loadingStageText}</span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{loadingPercent}%</span>
        </div>

        {/* Outer Progress Bar Container */}
        <div style={{ width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-glow)' }}>
          {/* Animated Inner Progress Bar */}
          <div
            style={{
              height: '100%',
              width: `${loadingPercent}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #38bdf8 50%, #10b981 100%)',
              borderRadius: '7px',
              transition: 'width 0.15s ease-out',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
            }}
          />
        </div>

        {/* Day-by-Day Counter Badge */}
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.25)', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={14} style={{ color: '#38bdf8' }} />
          <span>Verarbeitete Planungstage: <strong>{currentDayLoaded} / {weeksCount * 7} Tage</strong></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <AlertTriangle size={36} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Fehler beim Laden der Auswertungsdaten</div>
        <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{error}</div>
        <button onClick={() => setReloadTrigger(c => c + 1)} className="btn-primary" style={{ marginTop: '0.5rem' }}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  const selectedFilterLabel = filterOptions.find(o => o.value === selectedMachine)?.label || selectedMachine;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Filter & Control Panel */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Machine / Pool Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter / Anlage:</span>
            <select
              value={selectedMachine || 'All'}
              onChange={(e) => setSelectedMachine(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-glow)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {filterOptions.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#0f172a', color: '#f8fafc', padding: '8px' }}>{opt.label}</option>
              ))}
            </select>

            {/* Planning Mode Selector: Original D4-Plan vs. Optimierter Plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <button
                onClick={() => setUseOptimizedPlan(false)}
                style={{
                  background: !useOptimizedPlan ? 'linear-gradient(135deg, #1e293b, #334155)' : 'transparent',
                  color: !useOptimizedPlan ? '#f8fafc' : 'var(--text-muted)',
                  border: !useOptimizedPlan ? '1px solid #475569' : 'none',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📄 Original D4-Plan
              </button>
              <button
                onClick={() => setUseOptimizedPlan(true)}
                style={{
                  background: useOptimizedPlan ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                  color: useOptimizedPlan ? '#ffffff' : 'var(--text-muted)',
                  border: useOptimizedPlan ? '1px solid #3b82f6' : 'none',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⚡ Optimierter Plan
              </button>
              {useOptimizedPlan && summaryInfo?.algorithm === 'bottleneck' && (
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  🎯 Engpass-Algorithmus (Drum-Buffer-Rope) | Haupt-Engpass: {summaryInfo.primaryBottleneck || 'C42'} ({summaryInfo.primaryBottleneckRatio || '100%'})
                </span>
              )}
            </div>

            {/* View Mode Toggle: Gantt Tagesfüllung / Karten / Kanban */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
              {[
                { id: 'gantt', label: '📅 Gantt Tagesfüllung' },
                { id: 'cards', label: '📊 Übersicht & Karten' },
                { id: 'kanban', label: '📋 Board-Spalten' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveViewMode(v.id)}
                  style={{
                    background: activeViewMode === v.id ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                    color: activeViewMode === v.id ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeViewMode === v.id ? '0 2px 8px rgba(59, 130, 246, 0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Interactive Range Slider (1 to 26 Weeks in 1-week steps) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.45rem 0.95rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.35)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  📅 Zeitraum:
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  {tempWeeksCount} {tempWeeksCount === 1 ? 'Woche' : 'Wochen'} ({tempWeeksCount * 7} Tage)
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="26"
                step="1"
                value={tempWeeksCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTempWeeksCount(val);
                }}
                onMouseUp={() => setWeeksCount(tempWeeksCount)}
                onTouchEnd={() => setWeeksCount(tempWeeksCount)}
                style={{
                  width: '150px',
                  accentColor: '#38bdf8',
                  cursor: 'pointer'
                }}
              />

              {/* Quick Preset Buttons (18 W = 126 Tage) */}
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                {[4, 8, 12, 18, 24].map(w => (
                  <button
                    key={w}
                    onClick={() => {
                      setTempWeeksCount(w);
                      setWeeksCount(w);
                    }}
                    style={{
                      background: weeksCount === w ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.04)',
                      color: weeksCount === w ? '#38bdf8' : '#94a3b8',
                      border: weeksCount === w ? '1px solid #38bdf8' : '1px solid var(--border-dim)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontWeight: weeksCount === w ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    title={`${w} Wochen (${w * 7} Tage)`}
                  >
                    {w}W{w === 18 ? ' (126T)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Checkboxes: Gesperrt & Vorgemerkt */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {/* Checkbox: Include Gesperrte */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: includeGesperrte ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: includeGesperrte ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-dim)',
                transition: 'all 0.2s',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={includeGesperrte}
                  onChange={(e) => setIncludeGesperrte(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: includeGesperrte ? '#ef4444' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Gesperrte Aufträge (D4-Sperre)
                </span>
              </label>

              {/* Checkbox: Include Vorgemerkte */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: includeVorgemerkte ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: includeVorgemerkte ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-dim)',
                transition: 'all 0.2s',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={includeVorgemerkte}
                  onChange={(e) => setIncludeVorgemerkte(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: includeVorgemerkte ? '#f59e0b' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Vorgemerkte Aufträge (BelegArt 0)
                </span>
              </label>
            </div>
          </div>

          {/* Right Controls: Rüst/Prod Toggles & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowRuestFilter(!showRuestFilter)}
              style={{
                background: showRuestFilter ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: showRuestFilter ? '#3b82f6' : 'var(--text-muted)',
                border: showRuestFilter ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-dim)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Rüstzeit {showRuestFilter ? '✓' : '✕'}
            </button>

            <button
              onClick={() => setShowProdFilter(!showProdFilter)}
              style={{
                background: showProdFilter ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: showProdFilter ? '#10b981' : 'var(--text-muted)',
                border: showProdFilter ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-dim)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Laufzeit {showProdFilter ? '✓' : '✕'}
            </button>

            <button
              onClick={() => setShowTrendline(!showTrendline)}
              style={{
                background: showTrendline ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: showTrendline ? '#c084fc' : 'var(--text-muted)',
                border: showTrendline ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-dim)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <TrendingUp size={14} />
              <span>Trendlinie {showTrendline ? '✓' : '✕'}</span>
            </button>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Auftrag / Artikel suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-dim)',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  width: '200px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={refetch}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-4">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Auslastung ({filteredMachines.length} {filteredMachines.length === 1 ? 'Maschine' : 'Maschinen'})</span>
            <Activity size={16} style={{ color: globalUtilizationPct > 100 ? '#ef4444' : globalUtilizationPct > 80 ? '#f59e0b' : '#10b981' }} />
          </div>
          <div className="metric-value" style={{ color: globalUtilizationPct > 100 ? '#ef4444' : globalUtilizationPct > 80 ? '#f59e0b' : '#10b981' }}>
            {globalUtilizationPct.toFixed(1)}%
          </div>
          <div className="metric-desc">
            {globalTotalPlannedHrs.toFixed(1)}h Geplant / {globalTotalCapHrs.toFixed(1)}h Kapazität ({weeksCount} {weeksCount === 1 ? 'Woche' : 'Wochen'})
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Freigegeben</span>
            <CheckCircle2 size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div className="metric-value" style={{ color: '#3b82f6' }}>
            {globalFreigegebenHrs.toFixed(1)}h
          </div>
          <div className="metric-desc">Aktiv bearbeitbare P-Aufträge ohne Sperre</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Gesperrte Stunden</span>
            <AlertTriangle size={16} style={{ color: includeGesperrte ? '#ef4444' : 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ color: includeGesperrte ? '#ef4444' : 'var(--text-muted)' }}>
            {includeGesperrte ? (globalGesperrtHrs.toFixed(1) + 'h') : 'Ausgeblendet'}
          </div>
          <div className="metric-desc">
            {includeGesperrte ? 'BelegArt 1 mit D4-Sperre' : 'Per Checkbox oben aktivierbar'}
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Vorgemerkte Stunden</span>
            <Clock size={16} style={{ color: includeVorgemerkte ? '#f59e0b' : 'var(--text-muted)' }} />
          </div>
          <div className="metric-value" style={{ color: includeVorgemerkte ? '#f59e0b' : 'var(--text-muted)' }}>
            {includeVorgemerkte ? (globalVorgemerktHrs.toFixed(1) + 'h') : 'Ausgeblendet'}
          </div>
          <div className="metric-desc">
            {includeVorgemerkte ? 'BelegArt 0 (Vorgemerkt / Vertrieb)' : 'Per Checkbox oben aktivierbar'}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            {(() => {
              const startKW = planningDays.length > 0 ? getISOWeekNumber(planningDays[0]) : '';
              const endKW = planningDays.length > 0 ? getISOWeekNumber(planningDays[planningDays.length - 1]) : '';
              const kwRangeStr = startKW && endKW ? (startKW === endKW ? startKW + ', ' : startKW + ' – ' + endKW + ', ') : '';
              return (
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>
                  Kapazitätsverlauf: {selectedFilterLabel} ({kwRangeStr}{weeksCount} {weeksCount === 1 ? 'Woche' : 'Wochen'})
                </h3>
              );
            })()}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              💡 <span style={{ color: '#38bdf8', fontWeight: 600 }}>Tipp:</span> Klicke auf einen Tag im Diagramm, um im Gantt-Kalender direkt zu diesem Tag zu springen! | 
              {chartViewType === 'ruest_lauf' 
                ? ' Gestapelte Gegenüberstellung von Rüstzeit (Setup) und Laufzeit (Bearbeitung) vs. Kapazität'
                : ' Gestapelte Gegenüberstellung der Belegungsstunden nach Auftragsstatus vs. Kapazität'}
            </p>
          </div>

          {/* Chart Display Mode Selector & Trendline Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowTrendline(!showTrendline)}
              style={{
                background: showTrendline ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                color: showTrendline ? '#ec4899' : 'var(--text-muted)',
                border: showTrendline ? '1px solid #ec4899' : '1px solid var(--border-dim)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📈 Linearer Trend {showTrendline ? '✓' : '✕'}
            </button>
            {showTrendline && (
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: slopePerWeek >= 0 ? '#10b981' : '#f59e0b', background: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-glow)' }}>
                {slopePerWeek >= 0 ? '📈 Trend: +' : '📉 Trend: '} {slopePerWeek.toFixed(1)}h / Woche
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
              <button
                onClick={() => setChartViewType('ruest_lauf')}
                style={{
                  background: chartViewType === 'ruest_lauf' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                  color: chartViewType === 'ruest_lauf' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⚙️ Rüsten & Laufzeit (Stacked)
              </button>
              <button
                onClick={() => setChartViewType('status')}
                style={{
                  background: chartViewType === 'status' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                  color: chartViewType === 'status' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📊 Nach Status (Stacked)
              </button>
            </div>
          </div>
        </div>

        <div
          id="capacity-chart-container"
          ref={chartContainerRef}
          style={{ width: '100%', height: 320, cursor: 'pointer', position: 'relative' }}
        >
          <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
            {(() => {
              const kwBoundaries = [];
              let lastKW = '';
              chartDataWithTrend.forEach((item, idx) => {
                const kw = getISOWeekNumber(item.day);
                if (kw && kw !== lastKW) {
                  kwBoundaries.push({ kw, dayLabel: item.dayLabel, startIndex: idx });
                  lastKW = kw;
                }
              });

              return (
                <BarChart
                  data={chartDataWithTrend}
                  margin={{ top: 25, right: 30, left: 0, bottom: 25 }}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    if (e && typeof e.activeTooltipIndex === 'number') {
                      handleChartDayClick(e.activeTooltipIndex);
                    } else if (e && e.activePayload && e.activePayload.length > 0) {
                      const idx = chartDataWithTrend.findIndex(item => item.day === e.activePayload[0].payload?.day);
                      if (idx >= 0) handleChartDayClick(idx);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  {kwBoundaries.map((b, bIdx) => {
                    const nextB = kwBoundaries[bIdx + 1];
                    const endLabel = nextB ? nextB.dayLabel : chartDataWithTrend[chartDataWithTrend.length - 1]?.dayLabel;
                    const isEven = bIdx % 2 === 0;

                    return (
                      <React.Fragment key={b.kw}>
                        {isEven && endLabel && (
                          <ReferenceArea
                            x1={b.dayLabel}
                            x2={endLabel}
                            fill="rgba(56, 189, 248, 0.03)"
                            stroke="none"
                          />
                        )}
                        <ReferenceLine
                          x={b.dayLabel}
                          stroke="rgba(56, 189, 248, 0.45)"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: '📅 ' + b.kw,
                            fill: '#38bdf8',
                            position: 'top',
                            fontSize: 11,
                            fontWeight: 800,
                            offset: 8
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                  <XAxis dataKey="dayLabel" stroke="var(--text-muted)" fontSize={11} interval={Math.floor(planningDays.length / 14)} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} unit="h" />
                  <Tooltip
                    labelFormatter={(label) => '📅 ' + label}
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid var(--border-glow)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />

                  {chartViewType === 'ruest_lauf' ? (
                    <>
                      <Bar dataKey="Rüstzeit" stackId="rl" fill="#0284c7" name="Rüstzeit (h)" onClick={(entry, idx) => handleChartDayClick(typeof idx === 'number' ? idx : chartDataWithTrend.findIndex(item => item.day === (entry?.day || entry?.payload?.day)))} cursor="pointer" />
                      <Bar dataKey="Laufzeit" stackId="rl" fill="#10b981" name="Laufzeit (h)" onClick={(entry, idx) => handleChartDayClick(typeof idx === 'number' ? idx : chartDataWithTrend.findIndex(item => item.day === (entry?.day || entry?.payload?.day)))} cursor="pointer" />
                      <Line type="monotone" dataKey="Kapazität" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Max. Kapazität (h)" />
                      {showTrendline && (
                        <Line type="monotone" dataKey="Trend" stroke="#ec4899" strokeWidth={3} strokeDasharray="4 4" dot={false} name="📈 Trend (Gleitender Mittelwert h)" />
                      )}
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Freigegeben" stackId="st" fill="#3b82f6" name="Freigegeben (h)" onClick={(entry, idx) => handleChartDayClick(typeof idx === 'number' ? idx : chartDataWithTrend.findIndex(item => item.day === (entry?.day || entry?.payload?.day)))} cursor="pointer" />
                      {includeGesperrte && (
                        <Bar dataKey="Gesperrt" stackId="st" fill="#ef4444" name="Gesperrt (h)" onClick={(entry, idx) => handleChartDayClick(typeof idx === 'number' ? idx : chartDataWithTrend.findIndex(item => item.day === (entry?.day || entry?.payload?.day)))} cursor="pointer" />
                      )}
                      {includeVorgemerkte && (
                        <Bar dataKey="Vorgemerkt" stackId="st" fill="#f59e0b" name="Vorgemerkt (h)" onClick={(entry, idx) => handleChartDayClick(typeof idx === 'number' ? idx : chartDataWithTrend.findIndex(item => item.day === (entry?.day || entry?.payload?.day)))} cursor="pointer" />
                      )}
                      <Line type="monotone" dataKey="Kapazität" stroke="#10b981" strokeWidth={2.5} dot={false} name="Max. Kapazität (h)" />
                      {showTrendline && (
                        <Line type="monotone" dataKey="Trend" stroke="#ec4899" strokeWidth={3} strokeDasharray="4 4" dot={false} name="📈 Trend (Gleitender Mittelwert h)" />
                      )}
                    </>
                  )}
                </BarChart>
              );
            })()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* GANTT TAGESFÜLLUNGS-ANSICHT (WER / WO / WIE LANGE GEPLANT IST) */}
      {activeViewMode === 'gantt' && (
        <div id="gantt-section" className="glass-card" style={{ padding: '1.25rem', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: '#38bdf8' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Gantt Tagesfüllung – Kalenderansicht ({weeksCount} {weeksCount === 1 ? 'Woche' : 'Wochen'})
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '2px', background: '#3b82f6' }}></span> Freigegeben
              </span>
              {includeGesperrte && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '2px', background: '#ef4444' }}></span> Gesperrt
                </span>
              )}
              {includeVorgemerkte && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '2px', background: '#f59e0b' }}></span> Vorgemerkt
                </span>
              )}
            </div>
          </div>

          {/* Matrix Table Timeline Container with Sticky Header & Sticky Machine Column */}
          <div ref={ganttContainerRef} style={{ maxHeight: '78vh', overflow: 'auto', borderRadius: '8px', border: '1px solid var(--border-glow)', position: 'relative' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.74rem', minWidth: (planningDays.length * 85 + 140) + 'px' }}>
              {(() => {
                const weekGroups = [];
                planningDays.forEach(day => {
                  const kw = getISOWeekNumber(day);
                  const lastGroup = weekGroups[weekGroups.length - 1];
                  if (lastGroup && lastGroup.kw === kw) {
                    lastGroup.span += 1;
                  } else {
                    weekGroups.push({ kw, span: 1 });
                  }
                });

                return (
                  <thead style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f172a' }}>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid var(--border-glow)' }}>
                      <th style={{ padding: '0.4rem 1rem', textAlign: 'left', position: 'sticky', top: 0, left: 0, background: '#1e293b', zIndex: 40, borderRight: '2px solid var(--border-glow)', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                        📅 Kalenderwochen (KW)
                      </th>
                      {weekGroups.map((group, gIdx) => (
                        <th key={gIdx} colSpan={group.span} style={{ padding: '0.4rem 0.5rem', textAlign: 'center', background: 'rgba(56, 189, 248, 0.08)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 800, borderRight: '1px solid var(--border-glow)', borderBottom: '1px solid var(--border-glow)', letterSpacing: '0.5px' }}>
                          📅 {group.kw}
                        </th>
                      ))}
                    </tr>
                    <tr style={{ background: '#0f172a', borderBottom: '2px solid var(--border-glow)' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '180px', position: 'sticky', top: 0, left: 0, background: '#0f172a', zIndex: 40, borderRight: '2px solid var(--border-glow)', borderBottom: '2px solid var(--border-glow)' }}>
                        Maschine / Anlage
                      </th>
                      {planningDays.map((day, dIdx) => {
                        const dObj = new Date(day);
                        const dayOfWeek = isNaN(dObj.getTime()) ? '' : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][dObj.getDay()];
                        const dayFormatted = isNaN(dObj.getTime()) ? day : (String(dObj.getDate()).padStart(2, '0') + '.' + String(dObj.getMonth() + 1).padStart(2, '0') + '.');
                        const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

                        return (
                          <th
                            key={day}
                            id={'gantt-col-idx-' + dIdx}
                            style={{
                              padding: '0.4rem 0.15rem',
                              textAlign: 'center',
                              minWidth: '85px',
                              position: 'sticky',
                              top: 0,
                              zIndex: 30,
                              background: highlightedDayIndex === dIdx ? 'rgba(56, 189, 248, 0.35)' : (isWeekend ? '#1e293b' : '#0f172a'),
                              color: highlightedDayIndex === dIdx ? '#38bdf8' : 'inherit',
                              boxShadow: highlightedDayIndex === dIdx ? 'inset 0 0 15px rgba(56, 189, 248, 0.8)' : 'none',
                              transition: 'all 0.3s ease',
                              borderRight: '1px solid var(--border-dim)',
                              borderBottom: '2px solid var(--border-glow)'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: isWeekend ? '#94a3b8' : '#f8fafc', fontSize: '0.85rem' }}>
                              {dayOfWeek} {dayFormatted}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                );
              })()}
              <tbody>
                {filteredMachines.map(mName => {
                  const mSummary = machineSummaries.find(x => x.machineName === mName);
                  const mBoard = boardData[mName] || {};

                  return (
                    <tr key={mName} style={{ borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.01)' }}>
                      {/* Sticky Machine Name Column */}
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, position: 'sticky', left: 0, background: '#0f172a', zIndex: 20, borderRight: '2px solid var(--border-glow)', borderBottom: '1px solid var(--border-dim)' }}>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{mName}</div>
                        {mSummary && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                            {mSummary.windowPlannedHrs.toFixed(1)}h / {mSummary.totalCapHrs.toFixed(1)}h ({mSummary.windowUtilizationPct.toFixed(0)}%)
                          </div>
                        )}
                      </td>

                      {/* Calendar Day Cells */}
                      {planningDays.map(day => {
                        const dayCapMin = dailyCapacities[mName]?.[day] || 360;
                        const dayCapHrs = dayCapMin / 60;
                        const daySteps = (mBoard[day] || []).filter(s => {
                          const isFreigegeben = s.isFreigegeben !== undefined ? s.isFreigegeben : (s.zustandPlanung !== undefined ? s.zustandPlanung === 0 : true);
                          const isGesperrt = !!(s.isGesperrt || s.typSperre > 0);

                          if (!isFreigegeben && !includeVorgemerkte) return false;
                          if (isFreigegeben && isGesperrt && !includeGesperrte) return false;

                          if (searchQuery.trim()) {
                            const q = searchQuery.toLowerCase();
                            return String(s.contractNumber || '').toLowerCase().includes(q) ||
                                   String(s.orderPos || '').toLowerCase().includes(q) ||
                                   String(s.orderDesc || '').toLowerCase().includes(q) ||
                                   String(s.stepDesc || '').toLowerCase().includes(q);
                          }
                          return true;
                        });

                        let totalDayMin = 0;
                        daySteps.forEach(s => {
                          if (showRuestFilter) totalDayMin += (s.setupTime || 0);
                          if (showProdFilter) totalDayMin += (s.prodTime || 0);
                        });
                        const totalDayHrs = totalDayMin / 60;
                        const fillPct = dayCapMin > 0 ? Math.min(100, (totalDayMin / dayCapMin) * 100) : 0;
                        const isOverCapacity = totalDayMin > dayCapMin;

                        return (
                          <td
                            key={day}
                            style={{
                              padding: '0.25rem 0.15rem',
                              verticalAlign: 'top',
                              borderRight: '1px solid var(--border-dim)',
                              background: isOverCapacity ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                            }}
                          >
                            {/* Ultra-compact Day Capacity Bar inside cell */}
                            <div style={{ marginBottom: '0.25rem', background: 'rgba(0,0,0,0.35)', padding: '0.15rem 0.25rem', borderRadius: '3px', border: '1px solid var(--border-dim)', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: isOverCapacity ? '#ef4444' : fillPct > 80 ? '#f59e0b' : '#38bdf8' }}>
                                {totalDayHrs.toFixed(1)}h
                              </div>
                              <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '1px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: fillPct + '%',
                                    background: isOverCapacity ? '#ef4444' : fillPct > 80 ? '#f59e0b' : '#3b82f6',
                                    transition: 'width 0.3s'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Stacked Compact Order Step Cards with Distinct Order Colors */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {daySteps.length === 0 ? (
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)', textAlign: 'center', padding: '0.35rem 0' }}>
                                  —
                                </div>
                              ) : (
                                daySteps.map((step, sIdx) => {
                                  const isFreigegeben = step.isFreigegeben !== undefined ? step.isFreigegeben : (step.belegArt === 1);
                                  const isGesperrt = !!(step.isGesperrt || step.typSperre > 0);

                                  const setupH = ((step.setupTime || 0) / 60).toFixed(1);
                                  const prodH = ((step.prodTime || 0) / 60).toFixed(1);
                                  const totalH = (((step.setupTime || 0) + (step.prodTime || 0)) / 60).toFixed(1);

                                  // Get unique vibrant color palette per contract number
                                  const orderColor = getContractColor(step.contractNumber);

                                  const statusDot = !isFreigegeben ? '🟡' : isGesperrt ? '🔴' : '🟢';

                                  const displayTitle = (step.contractNumber || 'Auftrag') + ' / Pos ' + (step.orderPos || '10');
                                  const articleLabel = step.orderDesc || step.stepDesc || 'Artikel';

                                  const isSameContract = hoveredContractNumber && step.contractNumber === hoveredContractNumber;
                                  const isOtherContract = hoveredContractNumber && step.contractNumber !== hoveredContractNumber;

                                  return (
                                    <div
                                      key={sIdx}
                                      onClick={() => setActiveModalStep(step)}
                                      onMouseEnter={() => setHoveredContractNumber(step.contractNumber)}
                                      onMouseLeave={() => setHoveredContractNumber(null)}
                                      style={{
                                        background: isSameContract ? orderColor.border : (step.positionCategoryHex ? `${step.positionCategoryHex}20` : orderColor.bg),
                                        borderLeft: '4px solid ' + (step.positionCategoryHex || step.orderCategoryHex || (isGesperrt ? '#ef4444' : !isFreigegeben ? '#f59e0b' : orderColor.border)),
                                        borderTop: '1px solid ' + (step.positionCategoryHex ? `${step.positionCategoryHex}60` : orderColor.border),
                                        borderRight: '1px solid ' + (step.positionCategoryHex ? `${step.positionCategoryHex}60` : orderColor.border),
                                        borderBottom: '1px solid ' + (step.positionCategoryHex ? `${step.positionCategoryHex}60` : orderColor.border),
                                        borderRadius: '4px',
                                        padding: '0.2rem 0.25rem',
                                        cursor: 'pointer',
                                        opacity: isOtherContract ? 0.35 : 1,
                                        transform: isSameContract ? 'scale(1.08)' : 'scale(1)',
                                        zIndex: isSameContract ? 50 : 1,
                                        boxShadow: isSameContract ? ('0 0 14px ' + (step.positionCategoryHex || orderColor.border) + ', 0 2px 8px rgba(0,0,0,0.5)') : '0 1px 3px rgba(0,0,0,0.3)',
                                        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s, boxShadow 0.15s, background 0.15s',
                                        overflow: 'hidden'
                                      }}
                                      title={(step.orderCategoryName ? `D4 Auftrags-Kategorie: ${step.orderCategoryName}\n` : '') + (step.positionCategoryName ? `D4 Pos-Kategorie: ${step.positionCategoryName}\n` : '') + step.contractNumber + ' Pos ' + step.orderPos + ' - AS ' + step.stepPos + '\nArtikel: ' + articleLabel + '\nRüst: ' + setupH + 'h | Lauf: ' + prodH + 'h | Gesamt: ' + totalH + 'h'}
                                    >
                                      {/* Micro 1-Line: P-Nummer / Pos */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {step.orderCategoryHex ? (
                                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: step.orderCategoryHex, boxShadow: `0 0 6px ${step.orderCategoryHex}`, flexShrink: 0 }} title={step.orderCategoryName ? `D4 Auftrags-Kategorie: ${step.orderCategoryName}` : 'D4 Auftrags-Kategorie'} />
                                        ) : (
                                          <span style={{ fontSize: '0.6rem', lineHeight: 1 }}>{statusDot}</span>
                                        )}
                                        <span style={{ fontWeight: 800, color: step.positionCategoryHex || orderColor.text, fontSize: '0.68rem', letterSpacing: '-0.2px' }}>
                                          {displayTitle}
                                        </span>
                                      </div>

                                      {/* Micro 2-Line: Artikel / Duration Pill */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: '#ffffff', opacity: 0.9, marginTop: '1px' }}>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45px' }} title={articleLabel}>
                                          {articleLabel}
                                        </span>
                                        <span style={{ fontWeight: 700, color: '#38bdf8', background: 'rgba(0,0,0,0.4)', padding: '0px 3px', borderRadius: '2px' }}>
                                          {totalH}h
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Machine Utilization Cards Grid */}
      {activeViewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {machineSummaries.map(m => {
          const isOverloaded = m.utilizationPct > 100;
          const isHigh = m.utilizationPct >= 80 && m.utilizationPct <= 100;
          const barColor = isOverloaded ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';

          return (
            <div key={m.machineName} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>{m.machineName}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {m.stepsCount} {m.stepsCount === 1 ? 'Arbeitsschritt' : 'Arbeitsschritte'} geplant
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {m.overflowPlannedHrs > 0 && (
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '20px',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }} title="Zusätzlicher Arbeitsvorrat im D4-Überlauf / Rückstand">
                      +{m.overflowPlannedHrs.toFixed(1)}h Überlauf
                    </span>
                  )}
                  <div style={{
                    background: isOverloaded ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: barColor,
                    border: '1px solid ' + barColor + '40',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }} title={"Auslastung im " + weeksCount + "-Wochen-Fenster (ohne Überlauf)"}>
                    {m.windowUtilizationPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Triple Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>Planung ({weeksCount} {weeksCount === 1 ? 'Woche' : 'Wochen'}) / Kapazität</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {m.windowPlannedHrs.toFixed(1)}h / {m.totalCapHrs.toFixed(1)}h
                    {m.overflowPlannedHrs > 0 && <span style={{ color: '#f59e0b', fontSize: '0.7rem', marginLeft: '4px' }}>(+{m.overflowPlannedHrs.toFixed(1)}h Überlauf)</span>}
                  </span>
                </div>
                
                <div style={{
                  height: '10px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  {/* Freigegeben bar (Blue) */}
                  <div
                    style={{
                      height: '100%',
                      width: Math.min(100, m.freigegebenPct) + '%',
                      background: '#3b82f6',
                      transition: 'width 0.3s'
                    }}
                    title={'Freigegeben: ' + m.freigegebenHrs.toFixed(1) + 'h (' + m.freigegebenPct.toFixed(1) + '%)'}
                  />
                  {/* Gesperrt bar (Red) */}
                  {includeGesperrte && (
                    <div
                      style={{
                        height: '100%',
                        width: Math.min(100 - m.freigegebenPct, m.gesperrtPct) + '%',
                        background: '#ef4444',
                        transition: 'width 0.3s'
                      }}
                      title={'Gesperrt: ' + m.gesperrtHrs.toFixed(1) + 'h (' + m.gesperrtPct.toFixed(1) + '%)'}
                    />
                  )}
                  {/* Vorgemerkt bar (Orange) */}
                  {includeVorgemerkte && (
                    <div
                      style={{
                        height: '100%',
                        width: Math.min(100 - m.freigegebenPct - (includeGesperrte ? m.gesperrtPct : 0), m.vorgemerktPct) + '%',
                        background: '#f59e0b',
                        transition: 'width 0.3s'
                      }}
                      title={'Vorgemerkt: ' + m.vorgemerktHrs.toFixed(1) + 'h (' + m.vorgemerktPct.toFixed(1) + '%)'}
                    />
                  )}
                </div>
              </div>

              {/* Hours Details Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-dim)' }}>
                  <div>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>Freigegeben: </span>
                    <span style={{ fontWeight: 700 }}>{m.freigegebenHrs.toFixed(1)}h</span>
                  </div>
                  {includeGesperrte && (
                    <div>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Gesperrt: </span>
                      <span style={{ fontWeight: 700 }}>{m.gesperrtHrs.toFixed(1)}h</span>
                    </div>
                  )}
                  {includeVorgemerkte && (
                    <div>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Vorgemerkt: </span>
                      <span style={{ fontWeight: 700 }}>{m.vorgemerktHrs.toFixed(1)}h</span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Kapazität: </span>
                    <span style={{ fontWeight: 700 }}>{m.totalCapHrs.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Pool Allocation Visualizer (50/50 Split) */}
                {m.poolShareHrs > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd' }}>
                      <span style={{ fontWeight: 700 }}>Pool-Aufteilung (50/50):</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Fest: <strong style={{ color: '#fff' }}>{m.explicitHrs.toFixed(1)}h</strong></span>
                      <span style={{ color: '#38bdf8' }}>+ 50% Pool-Anteil: <strong style={{ color: '#38bdf8' }}>{(m.poolShareHrs / 2).toFixed(1)}h</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expandable Step List Preview */}
              {m.stepsList.length > 0 && (() => {
                const currentLimit = visibleStepLimits[m.machineName] || 15;
                const visibleSteps = m.stepsList.slice(0, currentLimit);
                const hasMore = m.stepsList.length > currentLimit;
                const isExpanded = currentLimit > 15;

                return (
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>Geplante Aufträge ({m.stepsList.length}):</span>
                      {isExpanded && (
                        <button
                          onClick={() => handleCollapseSteps(m.machineName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          ↩ Minimieren (15 anzeigen)
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: isExpanded ? '380px' : '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '4px', transition: 'max-height 0.3s ease' }}>
                      {visibleSteps.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveModalStep(s)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: s.isGesperrt ? '1px solid rgba(239, 68, 68, 0.3)' : (s.isFreigegeben ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'),
                            borderRadius: '6px',
                            padding: '0.4rem 0.6rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                            {s.orderCategoryHex && (
                              <span style={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: s.orderCategoryHex,
                                boxShadow: `0 0 6px ${s.orderCategoryHex}`,
                                flexShrink: 0
                              }} title={s.orderCategoryName ? `D4 Auftrags-Kategorie: ${s.orderCategoryName}` : 'D4 Auftrags-Kategorie'} />
                            )}
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: s.positionCategoryHex ? `${s.positionCategoryHex}35` : (s.isGesperrt ? 'rgba(239, 68, 68, 0.2)' : (s.isFreigegeben ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)')),
                              color: s.positionCategoryHex || (s.isGesperrt ? '#ef4444' : (s.isFreigegeben ? '#3b82f6' : '#f59e0b')),
                              border: s.positionCategoryHex ? `1.5px solid ${s.positionCategoryHex}` : 'none'
                            }}>
                              {s.isGesperrt ? '🔒 GESPERRT ' : ''}{s.contractNumber || s.ContractNumber || s.orderId || s.OrderId || 'P-Auftrag'} Pos {s.orderPos || s.OrderPos || '10'}
                            </span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                              AS {s.stepPos || s.StepPos || '10'}{s.stepDesc || s.StepDesc || s.articleDesc || s.ArticleDesc || s.orderDesc || s.OrderDesc ? (': ' + (s.stepDesc || s.StepDesc || s.articleDesc || s.ArticleDesc || s.orderDesc || s.OrderDesc)) : ''}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                              {formatMinutes(s.stepTime)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {hasMore && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingTop: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleLoadMoreSteps(m.machineName, 25)}
                            style={{
                              background: 'rgba(56, 189, 248, 0.12)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              borderRadius: '6px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            ➕ 25 weitere nachladen ({m.stepsList.length - currentLimit} verbleibend)
                          </button>
                          <button
                            onClick={() => handleShowAllSteps(m.machineName, m.stepsList.length)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-dim)',
                              borderRadius: '6px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            📖 Alle {m.stepsList.length} anzeigen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
      )}

      {/* Modal for Order Routing Details */}
      {/* Full Rich Arbeitsschritt-Details Modal (Matching "Planung Maschinen") */}
      {activeModalStep && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(4, 6, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem',
          transition: 'all 0.3s ease'
        }} onClick={() => setActiveModalStep(null)}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.25rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Close Button */}
            <button
              onClick={() => setActiveModalStep(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-dim)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-dim)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {activeModalStep.isGesperrt ? (
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.7rem', fontWeight: 700 }}>
                      🔒 GESPERRT
                    </span>
                  ) : activeModalStep.isFreigegeben ? (
                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 700 }}>
                      ✓ FREIGEGEBEN
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.7rem', fontWeight: 700 }}>
                      ⏳ VORGEMERKT
                    </span>
                  )}
                  {activeModalStep.isExecuting && (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700 }}>
                      ⚡ IN AUSFÜHRUNG
                    </span>
                  )}
                  {activeModalStep.isSplit && (
                    <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 600 }}>
                      ✂ Teil {activeModalStep.splitPart || 1}
                    </span>
                  )}
                  {activeModalStep.isNightRunCapable && (
                    <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', fontSize: '0.7rem', fontWeight: 600 }}>
                      <Moon size={12} style={{ marginRight: 3 }} /> Nachtlauf
                    </span>
                  )}
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0' }}>
                  Arbeitsschritt-Details
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  Detaillierte Belegungsdaten des Arbeitsschritts (Auswertung Planung)
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Row 1: P-Nummer, Tag, Fertigstellungstermin & Lieferdatum */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>P-Nummer (Projekt) / Position</div>
                  <div style={{ fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>{activeModalStep.contractNumber || activeModalStep.ContractNumber || 'Keine P-Nummer'} {activeModalStep.orderPos || activeModalStep.OrderPos ? `/ Pos ${activeModalStep.orderPos || activeModalStep.OrderPos}` : ''}</span>
                    {activeModalStep.orderCategoryHex && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: `${activeModalStep.orderCategoryHex}20`,
                        border: `1px solid ${activeModalStep.orderCategoryHex}`,
                        color: activeModalStep.orderCategoryHex,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }} title={activeModalStep.orderCategoryName ? `D4 Auftrags-Kategorie: ${activeModalStep.orderCategoryName}` : 'D4 Auftrags-Kategorie'}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeModalStep.orderCategoryHex }} />
                        {activeModalStep.orderCategoryName || 'D4 Kategorie'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Eingeplanter Tag</div>
                  <div style={{ fontSize: '1.05rem', color: '#10b981', fontWeight: 700 }}>
                    {activeModalStep.day || 'Überlauf'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Fertigstellungstermin</div>
                  <div style={{ fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700 }}>
                    {activeModalStep.productionDate || activeModalStep.deliveryDate ? formatDate(activeModalStep.productionDate || activeModalStep.deliveryDate) : 'Kein Termin'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Lieferdatum</div>
                  <div style={{ fontSize: '1.05rem', color: '#10b981', fontWeight: 700 }}>
                    {activeModalStep.orderDeliveryDate ? formatDate(activeModalStep.orderDeliveryDate) : (activeModalStep.deliveryDate ? formatDate(activeModalStep.deliveryDate) : 'Kein Lieferdatum')}
                  </div>
                </div>
              </div>

              {/* Row 2: Artikel */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Artikel / Auftrag (Bezeichnung)</div>
                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{activeModalStep.orderDesc || activeModalStep.articleDesc || activeModalStep.ArticleDesc || 'K.A.'}</div>
                {(activeModalStep.articleId || activeModalStep.ArticleId) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Artikel-ID: {activeModalStep.articleId || activeModalStep.ArticleId}</div>
                    {typeof openDmsSlider === 'function' && (
                      <button 
                        onClick={() => openDmsSlider(activeModalStep.articleId || activeModalStep.ArticleId, activeModalStep.orderDesc || activeModalStep.articleDesc)}
                        style={{ 
                          background: 'rgba(56, 189, 248, 0.1)', 
                          color: '#38bdf8', 
                          border: '1px solid rgba(56, 189, 248, 0.2)', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '6px', 
                          fontSize: '0.7rem', 
                          cursor: 'pointer',
                          fontWeight: 600, 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        📐 Zeichnung im DMS öffnen
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Row 3: Arbeitsplan-Schritt */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Arbeitsplan-Position (Arbeitsschritt)</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>AS {activeModalStep.stepPos || activeModalStep.StepPos || '10'}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>- {activeModalStep.stepDesc || activeModalStep.StepDesc || ''}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Schritt-ID: {activeModalStep.stepId || activeModalStep.StepId || 'N/A'}</div>
              </div>

              {/* Row 4: Soll vs Ist vs Rest Zeitvergleich & Durchlaufzeit */}
              {(() => {
                const originalSetup = activeModalStep.originalSetupTime || activeModalStep.setupTime || activeModalStep.SetupTime || 0;
                const originalProd = activeModalStep.originalProdTime || activeModalStep.prodTime || activeModalStep.ProdTime || 0;
                const originalTotal = originalSetup + originalProd;

                const seenBookingIdsForSum = new Set();
                let totalBookedSetup = 0;
                let totalBookedProd = 0;
                (modalBookings || []).forEach(b => {
                  const bookingId = b.ID;
                  if (bookingId && !seenBookingIdsForSum.has(bookingId)) {
                    seenBookingIdsForSum.add(bookingId);
                    totalBookedSetup += b.ZBU_ZEIT_RUESTUNG_GESAMT || 0;
                    totalBookedProd += (b.ZBU_ZEIT_PRODUKTION_AK || 0) + (b.ZBU_ZEIT_PRODUKTION_MS || 0);
                  }
                });
                const totalBookedTotal = totalBookedSetup + totalBookedProd;

                let remainingSetup = Math.round(activeModalStep.setupTime !== undefined ? activeModalStep.setupTime : originalSetup);
                if (totalBookedSetup > originalSetup) {
                  remainingSetup = originalSetup - totalBookedSetup;
                }
                
                let remainingProd = Math.round(activeModalStep.prodTime !== undefined ? activeModalStep.prodTime : originalProd);
                if (totalBookedProd > originalProd) {
                  remainingProd = originalProd - totalBookedProd;
                }

                let remainingTotal = Math.round((activeModalStep.setupTime || 0) + (activeModalStep.prodTime || 0));
                if (totalBookedTotal > originalTotal) {
                  remainingTotal = originalTotal - totalBookedTotal;
                }

                const setupPct = originalSetup > 0 ? (totalBookedSetup / originalSetup) * 100 : 0;
                const prodPct = originalProd > 0 ? (totalBookedProd / originalProd) * 100 : 0;
                const totalPct = originalTotal > 0 ? (totalBookedTotal / originalTotal) * 100 : 0;

                return (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Soll / Ist / Rest Zeitvergleich & Durchlaufzeit</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Werte gerundet in Minuten, Stunden & Tagen</span>
                    </div>

                    {/* Row 1: Zeitvergleich (Rüsten, Produktion, Gesamtzeit in einer Reihe) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      {/* Rüsten */}
                      <div style={{ background: 'rgba(249, 115, 22, 0.03)', border: '1px solid rgba(249, 115, 22, 0.15)', padding: '0.65rem 0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#fdba74', fontWeight: 700 }}>🛠️ RÜSTEN</span>
                          <span style={{ fontSize: '0.68rem', color: setupPct > 100 ? '#ef4444' : '#94a3b8', fontWeight: setupPct > 100 ? 700 : 400, fontFamily: 'monospace' }}>{Math.round(setupPct)}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Soll:</span><span style={{ fontWeight: 600 }}>{formatMinutes(originalSetup)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ist:</span><span style={{ fontWeight: 600, color: totalBookedSetup > originalSetup ? '#ef4444' : '#fdba74' }}>{formatMinutes(totalBookedSetup)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(249, 115, 22, 0.15)', paddingTop: '0.15rem', marginTop: '0.15rem' }}><span>Rest:</span><span style={{ fontWeight: 700, color: remainingSetup < 0 ? '#ef4444' : (remainingSetup > 0 ? '#38bdf8' : '#64748b') }}>{formatMinutes(remainingSetup)}</span></div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, setupPct)}%`, height: '100%', background: setupPct > 100 ? '#ef4444' : '#f97316', borderRadius: '2px' }} />
                        </div>
                      </div>

                      {/* Produktion */}
                      <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.15)', padding: '0.65rem 0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>⚙️ PRODUKTION</span>
                          <span style={{ fontSize: '0.68rem', color: prodPct > 100 ? '#ef4444' : '#94a3b8', fontWeight: prodPct > 100 ? 700 : 400, fontFamily: 'monospace' }}>{Math.round(prodPct)}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Soll:</span><span style={{ fontWeight: 600 }}>{formatMinutes(originalProd)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ist:</span><span style={{ fontWeight: 600, color: totalBookedProd > originalProd ? '#ef4444' : '#60a5fa' }}>{formatMinutes(totalBookedProd)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(59, 130, 246, 0.15)', paddingTop: '0.15rem', marginTop: '0.15rem' }}><span>Rest:</span><span style={{ fontWeight: 700, color: remainingProd < 0 ? '#ef4444' : (remainingProd > 0 ? '#38bdf8' : '#64748b') }}>{formatMinutes(remainingProd)}</span></div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, prodPct)}%`, height: '100%', background: prodPct > 100 ? '#ef4444' : '#3b82f6', borderRadius: '2px' }} />
                        </div>
                      </div>

                      {/* Gesamtzeit */}
                      <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '0.65rem 0.75rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 700 }}>📊 GESAMTZEIT</span>
                          <span style={{ fontSize: '0.68rem', color: totalPct > 100 ? '#ef4444' : '#94a3b8', fontWeight: totalPct > 100 ? 700 : 400, fontFamily: 'monospace' }}>{Math.round(totalPct)}%</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Soll:</span><span style={{ fontWeight: 600 }}>{formatMinutes(originalTotal)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ist:</span><span style={{ fontWeight: 600, color: totalBookedTotal > originalTotal ? '#ef4444' : '#10b981' }}>{formatMinutes(totalBookedTotal)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '0.15rem', marginTop: '0.15rem' }}><span>Rest:</span><span style={{ fontWeight: 700, color: remainingTotal < 0 ? '#ef4444' : (remainingTotal > 0 ? '#38bdf8' : '#64748b') }}>{formatMinutes(remainingTotal)}</span></div>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, totalPct)}%`, height: '100%', background: totalPct > 100 ? '#ef4444' : '#10b981', borderRadius: '2px' }} />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Durchlaufzeit */}
                    {(() => {
                      const mPlannedDays = (activeModalStep.PlannedDays && activeModalStep.PlannedDays > 0) ? activeModalStep.PlannedDays : ((activeModalStep.ThroughputDays && activeModalStep.ThroughputDays > 0) ? activeModalStep.ThroughputDays : 1);
                      const mOrderPlanDays = activeModalStep.OrderPlanDays ?? mPlannedDays;
                      const mUsedDays = activeModalStep.UsedDays ?? 0;
                      const mDaysPct = Math.round((mUsedDays / Math.max(1, mPlannedDays)) * 100);
                      const mRemainingDays = mPlannedDays - mUsedDays;

                      return (
                        <div style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.18)', padding: '0.65rem 0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              📅 DURCHLAUFZEIT
                            </span>
                            <span style={{ fontSize: '0.7rem', color: mUsedDays > mPlannedDays ? '#ef4444' : '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                              {mDaysPct}%
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Auftragsplan:</span>
                              <span style={{ fontWeight: 600 }}>{mOrderPlanDays} {mOrderPlanDays === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Historischer Ø:</span>
                              <span style={{ fontWeight: 600 }}>{mPlannedDays} {mPlannedDays === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Ist (Gebraucht):</span>
                              <span style={{ fontWeight: 600, color: mUsedDays > mPlannedDays ? '#ef4444' : '#38bdf8' }}>{mUsedDays} {mUsedDays === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Geplanter Restbedarf:</span>
                              <span style={{ fontWeight: 700, color: mRemainingDays < 0 ? '#ef4444' : '#38bdf8' }}>{mRemainingDays} {Math.abs(mRemainingDays) === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.2rem' }}>
                            <div style={{ width: `${Math.min(100, mDaysPct)}%`, height: '100%', background: mUsedDays > mPlannedDays ? '#ef4444' : '#38bdf8', borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Row 5: NC & WinTool */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.1rem' }}>NC-Programm</div>
                  <div style={{ fontSize: '0.88rem', color: (activeModalStep.ncProgram || activeModalStep.NCProgram) ? '#fff' : '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                    {activeModalStep.ncProgram || activeModalStep.NCProgram || 'Kein NC-Prog hinterlegt'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.1rem' }}>WinTool-Liste</div>
                  <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
                    {activeModalStep.matchedListIdent || activeModalStep.matchedListNr || activeModalStep.MatchedListNr || 'Keine WinTool-Liste'}
                  </div>
                </div>
              </div>

              {/* Row 6: Vorrichtung (Fixture) */}
              {(activeModalStep.fixture || activeModalStep.Fixture) && (
                <div style={{ background: 'rgba(168, 85, 247, 0.03)', border: '1px solid rgba(168, 85, 247, 0.15)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600, textTransform: 'uppercase' }}>Spannmittel / Vorrichtung</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.95rem', color: '#e9d5ff', fontWeight: 700 }}>
                      🛠️ {activeModalStep.fixture || activeModalStep.Fixture}
                    </span>
                    {(activeModalStep.fixtureLocation || activeModalStep.FixtureLocation) && (
                      <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                        📍 Lagerort: {activeModalStep.fixtureLocation || activeModalStep.FixtureLocation}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Entire Arbeitsplan Section (Routing steps chain) */}
              <div>
                <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Gesamter Arbeitsplan (Routing Chain)</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.05rem 0.35rem', borderRadius: '4px', color: '#94a3b8' }}>
                    {loadingRouting ? 'Lade...' : `${fullRoutingSteps.length} Operationen`}
                  </span>
                </div>
                {loadingRouting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', padding: '1rem', border: '1px solid var(--border-dim)', borderRadius: '10px' }}>
                    <span>Lade Arbeitsplan...</span>
                  </div>
                ) : fullRoutingSteps.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem', border: '1px solid var(--border-dim)', padding: '0.75rem', borderRadius: '10px' }}>
                    {fullRoutingSteps.map((op, opIdx) => {
                      const isCurrent = op.stepId === (activeModalStep.stepId || activeModalStep.StepId);
                      const isCompleted = op.isCompleted;
                      const isExecuting = op.isExecuting;

                      let statusBadge = null;
                      let bgStyle = 'var(--bg-card)';
                      let borderStyle = '1px solid var(--border-dim)';

                      if (isCurrent) {
                        statusBadge = <span style={{ color: '#60a5fa', fontSize: '0.7rem', fontWeight: 700 }}>Aktuell</span>;
                        bgStyle = 'rgba(59, 130, 246, 0.15)';
                        borderStyle = '1px solid rgba(59, 130, 246, 0.4)';
                      } else if (isCompleted) {
                        statusBadge = <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>✓ Erledigt</span>;
                        bgStyle = 'transparent';
                        borderStyle = '1px dashed var(--border-dim)';
                      } else if (isExecuting) {
                        statusBadge = <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>▶ In Arbeit</span>;
                        bgStyle = 'rgba(16, 185, 129, 0.1)';
                        borderStyle = '1px solid rgba(16, 185, 129, 0.3)';
                      } else {
                        statusBadge = <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>Offen</span>;
                        bgStyle = 'rgba(128,128,128,0.05)';
                        borderStyle = '1px solid var(--border-dim)';
                      }

                      return (
                        <div key={opIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bgStyle, border: borderStyle, padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
                            <span style={{ color: isCurrent ? '#38bdf8' : '#64748b', fontWeight: 700, fontFamily: 'monospace', minWidth: '42px', flexShrink: 0 }}>AS {op.stepPos}</span>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{op.stepDesc}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({(op.machineName || '').replace(/\s*\(\s*Pool\s*\)/gi, '').trim()})</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            {statusBadge}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {formatMinutes(op.setupTime + op.prodTime)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.5rem' }}>
                    Keine weiteren Operationen im Arbeitsplan gefunden.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DMS Drawing Slider Drawer Overlay */}
      {dmsSliderOpen && dmsSliderList.length > 0 && (() => {
        const currentItem = dmsSliderList[dmsSliderIndex];
        let iframeSrc = `${API_BASE}/dms/drawing/${encodeURIComponent(currentItem.articleId)}?mode=proxy&index=${dmsSubIndex}`;
        if (dmsSliderFixture) {
          iframeSrc += `&fixture=${encodeURIComponent(dmsSliderFixture)}`;
        }
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: dmsSliderFullscreen ? '100%' : '55%',
            height: '100%',
            background: '#0f172a',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              background: '#1e293b'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Zeichnungs-Explorer
                </span>
                <h4 style={{ color: '#fff', margin: '0.1rem 0 0 0', fontSize: '1.05rem', fontWeight: 600 }}>
                  Artikel: {dmsResolvedArticleNumber || currentItem.articleId}
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setDmsSliderFullscreen(prev => !prev)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span>{dmsSliderFullscreen ? '🗗 Verkleinern' : '🗖 Maximieren'}</span>
                </button>
                <button 
                  onClick={() => setDmsSliderOpen(false)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
            
            {/* Viewer Iframe */}
            <div style={{ flex: 1, background: '#020617', position: 'relative' }}>
              <iframe
                src={iframeSrc}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="DMS Zeichnung Viewer"
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
