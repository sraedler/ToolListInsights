import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Wrench, 
  CalendarRange, 
  Sliders, 
  Search, 
  Activity, 
  ChevronRight, 
  X, 
  Info, 
  Clock, 
  TrendingDown, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  HelpCircle,
  BarChart4,
  Layers,
  ArrowRight,
  RefreshCw,
  Server
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function App() {
  const [systemStatus, setSystemStatus] = useState({
    status: 'loading',
    progress: 'Verbindung zum Analyse-Server wird hergestellt...',
    cachedItems: { toolLists: false, dashboard: false, standardization: false, demand: false, setup: false }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);

  // Global Date range filters
  const [globalStartDate, setGlobalStartDate] = useState('2025-01-01');
  const [globalEndDate, setGlobalEndDate] = useState('2025-12-31');

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
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <Layers className="logo-icon" style={{ color: '#3b82f6' }} />
            <h1>ToolListInsights</h1>
          </div>
          
          <nav className="nav-links">
            <div 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              <span>Übersicht</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
              onClick={() => setActiveTab('explorer')}
            >
              <Database size={18} />
              <span>ERP Explorer</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'standardization' ? 'active' : ''}`}
              onClick={() => setActiveTab('standardization')}
            >
              <Wrench size={18} />
              <span>Standardisierung</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'demand' ? 'active' : ''}`}
              onClick={() => setActiveTab('demand')}
            >
              <CalendarRange size={18} />
              <span>Bedarfsanalyse</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'simulation' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulation')}
            >
              <Sliders size={18} />
              <span>Rüstoptimierung</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'machines' ? 'active' : ''}`}
              onClick={() => setActiveTab('machines')}
            >
              <Server size={18} />
              <span>Maschinenanalyse</span>
            </div>
          </nav>
        </div>

        <div className="footer-section">
          <p>Version 1.0.0</p>
          <p>© 2026 Antigravity-Team</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <h2>
              {activeTab === 'overview' && 'Dashboard-Übersicht'}
              {activeTab === 'explorer' && 'ERP & WinTool Daten-Drilldown'}
              {activeTab === 'standardization' && 'Werkzeug-Standardisierungs-Analyse'}
              {activeTab === 'demand' && 'Phasenbezogener Werkzeugbedarf'}
              {activeTab === 'simulation' && 'Rüstzeit-Optimierungs-Simulator'}
              {activeTab === 'machines' && 'Maschinen-Werkzeugbedarf'}
            </h2>
          </div>

          {/* Global Date Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.45rem 1rem', borderRadius: '12px', border: '1px solid var(--border-dim)' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zeitraum:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Von</span>
              <input
                type="date"
                value={globalStartDate}
                onChange={(e) => setGlobalStartDate(e.target.value)}
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
                onChange={(e) => setGlobalEndDate(e.target.value)}
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

          <div className="system-status">
            <div className="status-dot"></div>
            <span>ERP & WinTool Verbunden</span>
          </div>
        </header>

        <div className="content-body">
          {activeTab === 'overview' && <OverviewTab summary={summary} loading={!summary} onRefresh={() => fetchSummary(globalStartDate, globalEndDate)} />}
          {activeTab === 'explorer' && <ExplorerTab startDate={globalStartDate} endDate={globalEndDate} />}
          {activeTab === 'standardization' && <StandardizationTab />}
          {activeTab === 'demand' && <DemandTab startDate={globalStartDate} endDate={globalEndDate} />}
          {activeTab === 'simulation' && <SimulationTab startDate={globalStartDate} endDate={globalEndDate} />}
          {activeTab === 'machines' && <MachinesTab startDate={globalStartDate} endDate={globalEndDate} />}
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
          <div className="metric-value">{summary?.totalArticles.toLocaleString()}</div>
          <div className="metric-desc">Aktive ERP-Artikel (AR_ART=0, AR_TYP=1)</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Produktionsaufträge</span>
            <Database size={16} />
          </div>
          <div className="metric-value">{summary?.totalOrders.toLocaleString()}</div>
          <div className="metric-desc">Gesamte Belegpositionen (tbe_Belp)</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Gepflegte Werkzeuglisten</span>
            <Wrench size={16} />
          </div>
          <div className="metric-value">{summary?.totalToolLists.toLocaleString()}</div>
          <div className="metric-desc">Katalogisierte Listen in WinTool</div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Werkzeuge (Gesamt)</span>
            <Activity size={16} />
          </div>
          <div className="metric-value">{summary?.totalTools.toLocaleString()}</div>
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
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Produktionsaufträge</h3>
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
                    <option value="all">Alle Status</option>
                    <option value="open">Offen</option>
                    <option value="closed">Erledigt</option>
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
                    <option value="all">Alle Lieferfristen</option>
                    <option value="overdue">⚠️ Überfällig</option>
                    <option value="today">📅 Heute fällig</option>
                    <option value="soon">⏳ In Kürze (&lt;= 7 Tage)</option>
                    <option value="ontime">✅ Rechtzeitig</option>
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
                    <option value="all">Alle Termine</option>
                    <option value="hasDate">Termin gesetzt</option>
                    <option value="noDate">Ohne Termin</option>
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
                      gridTemplateColumns: '80px 1.5fr 2fr 1fr',
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
  const [rightTab, setRightTab] = useState('magazine'); // 'magazine' or 'setup'
  const [magComparisonTab, setMagComparisonTab] = useState('future'); // 'current' or 'future'
  const [modalTab, setModalTab] = useState('setup'); // 'setup' or 'magazine' inside order details modal
  const [optimize, setOptimize] = useState(false); // setup sequencing optimization toggle
  
  const [expandedPartNrs, setExpandedPartNrs] = useState(new Set());
  const [filterKw, setFilterKw] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Green', 'Yellow', 'Red'

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

  // Fetch simulation data and current tools when machine, targetDate, or optimize changes
  useEffect(() => {
    if (!selectedMachineName) return;
    const fetchSimAndTools = async () => {
      try {
        setLoadingSim(true);
        
        // 1. Fetch simulation
        const simRes = await fetch(`${API_BASE}/inventory/machine/${selectedMachineName}/simulation?targetDate=${targetDate}&optimize=${optimize}`);
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
  }, [selectedMachineName, targetDate, optimize]);

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
              <option key={m.Id} value={m.Name}>
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
            <option value="All">Alle Arbeitsschritte</option>
            <option value="Green">Bereit (Grün)</option>
            <option value="Yellow">In Vorbereitung (Gelb)</option>
            <option value="Red">Gesperrt (Rot)</option>
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
                        Prog: <strong>{step.programName || 'N/A'}</strong>
                      </span>
                      <span>Magazinbel.: <strong>{step.occupiedSlots} / {simData?.magazineSize}</strong></span>
                    </div>
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
            </div>

            {/* TAB CONTENT 1: MAGAZINE STATE */}
            {rightTab === 'magazine' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  Vergleichen Sie den aktuellen Werkzeugbestand der Maschine mit dem simulierten Bestand nach Ablauf der Aufträge bis zum Zieldatum.
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
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    Aktueller Ist-Bestand ({currentTools.length})
                  </button>
                  <button
                    onClick={() => setMagComparisonTab('future')}
                    style={{
                      flexGrow: 1,
                      background: magComparisonTab === 'future' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: 'none',
                      color: magComparisonTab === 'future' ? '#10b981' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    Zukünftiger Stand ({simData?.finalMagazine.length} / {simData?.magazineSize})
                  </button>
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                  {magComparisonTab === 'current' ? (
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
                  ) : (
                    simData?.finalMagazine.length === 0 ? (
                      <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                        Virtuelles Magazin leer.
                      </div>
                    ) : (
                      simData?.finalMagazine.map((t, i) => (
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
                                Benötigt in folgenden Rüstwerkzeugen:
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
                                      Werkzeug-ID: {t.toolNr}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '2rem', alignItems: 'center', padding: '1.5rem' }}>
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
                <option key={m.id} value={m.id}>
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
              padding: '0.75rem 1.25rem',
              marginBottom: '1.25rem',
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

          <div className={simData?.config.magazineSize ? "grid-4" : "grid-3"} style={{ marginBottom: '1.5rem' }}>
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
                <button 
                  className="btn-secondary" onClick={() => setViewDetails(!viewDetails)}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {viewDetails ? 'Erklärung anzeigen' : 'Alle Schritte auflisten'}
                </button>
              </div>

              {viewDetails ? (
                <div className="table-wrapper" style={{ maxHeight: '400px' }}>
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
                <option key={m.id} value={m.id}>
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
