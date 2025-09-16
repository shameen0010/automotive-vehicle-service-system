import { useEffect, useMemo, useState } from 'react';
import { getInventoryOverview, getTopUsedParts, getStockSummaryReport, getSupplierSpendReport } from '../../services/inventoty/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Bar } from 'react-chartjs-2';
import { getSocket, setSocket } from '../../services/socket';
import PartListTable from '../../components/inventory/PartListTable';
import DashboardHeader from '../../components/inventory/DashboardHeader';
import DashboardKPIs from '../../components/inventory/DashboardKPIs';
import DashboardCharts from '../../components/inventory/DashboardCharts';
import DashboardWidgetToggle from '../../components/inventory/DashboardWidgetToggle';
import EmbeddedReports from '../../components/inventory/EmbeddedReports';
import DashboardSidebar from '../../components/inventory/DashboardSidebar';
import api from '../../api/client';
// Optional: live updates when server emits stock/po events
let socketInitTried = false;
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [topUsed, setTopUsed] = useState([]);
  const [days, setDays] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const raw = localStorage.getItem('inv_dash_auto');
    return raw ? raw === '1' : false;
  });
  const [widgets, setWidgets] = useState(() => {
    const raw = localStorage.getItem('inv_dash_widgets');
    return raw ? JSON.parse(raw) : { 
      kpis: true, 
      poStatus: true, 
      topUsed: true, 
      stockSummary: true, 
      supplierSpend: true 
    };
  });
  const [stockSummary, setStockSummary] = useState({ summary: null, items: [] });
  const [supplierSpend, setSupplierSpend] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      parts: 0,
      lowStock: 0,
      suppliers: 0,
      purchaseOrdersValue: 0,
      poCount: 0
    },
    recentParts: [],
    lowStockParts: [],
  });
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const [o, u, partsResp, suppliersResp, lowStockResp] = await Promise.all([
        getInventoryOverview(),
        getTopUsedParts(days),
        api.get('/api/parts', { params: { limit: 5 } }),
        api.get('/api/suppliers', { params: { limit: 3 } }),
        api.get('/api/parts/low-stock')
      ]);
      setOverview(o);
      setTopUsed(u);
      // derive PO metrics
      const poBreakdown = o?.purchaseOrders?.breakdown || [];
      const poCount = poBreakdown.reduce((sum, b) => sum + (b.count || 0), 0);
      const purchaseOrdersValue = poBreakdown.reduce((sum, b) => sum + (b.totalValue || 0), 0);
      setDashboardData(prev => ({
        ...prev,
        stats: {
          parts: o?.totalParts || 0,
          lowStock: o?.lowStockCount || 0,
          suppliers: suppliersResp?.data?.total || (suppliersResp?.data?.suppliers?.length || suppliersResp?.data?.items?.length || 0),
          purchaseOrdersValue,
          poCount
        },
        recentParts: partsResp?.data?.items || partsResp?.data?.parts || [],
        lowStockParts: lowStockResp?.data?.items || []
      }));
      // lightweight snapshots for embedded components
      getStockSummaryReport().then((data) => setStockSummary({ summary: data.summary, items: (data.items || []).slice(0, 5) })).catch(()=>{});
      getSupplierSpendReport({}).then((data) => setSupplierSpend((data.rows || []).slice(0, 5))).catch(()=>{});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, days]);

  useEffect(() => {
    localStorage.setItem('inv_dash_auto', autoRefresh ? '1' : '0');
  }, [autoRefresh]);

  const handleWidgetChange = (key, value) => {
    setWidgets(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    localStorage.setItem('inv_dash_widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    // Attempt to hook into socket if available
    if (!socketInitTried) {
      socketInitTried = true;
      try {
        // dynamic import to avoid bundling if not installed
        import('socket.io-client').then(({ io }) => {
          const s = io();
          setSocket(s);
        }).catch(() => {});
      } catch {}
    }
    const s = getSocket?.();
    if (!s) return;
    const onLow = () => load();
    const onPO = () => load();
    s.on('stock:low', onLow);
    s.on('po:updated', onPO);
    return () => {
      s.off?.('stock:low', onLow);
      s.off?.('po:updated', onPO);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poStatusData = useMemo(() => {
    const breakdown = overview?.purchaseOrders?.breakdown || [];
    const labels = breakdown.map(b => b._id);
    const counts = breakdown.map(b => b.count);
    return {
      labels,
      datasets: [
        {
          label: 'PO Count',
          data: counts,
          backgroundColor: 'rgba(59,130,246,0.5)'
        }
      ]
    };
  }, [overview]);

  const topUsedData = useMemo(() => {
    const labels = topUsed.map(i => i.partCode || i.name);
    const values = topUsed.map(i => i.usedQty);
    return {
      labels,
      datasets: [
        { 
          label: 'Used Qty', 
          data: values, 
          backgroundColor: 'rgba(79, 255, 176, 0.6)',
          borderColor: 'rgba(79, 255, 176, 0.8)',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }, [topUsed]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-app flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-app">
      <div className="app-container space-y-6">
        {/* Header */}
        <DashboardHeader
          days={days}
          onDaysChange={setDays}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={load}
          loading={loading}
        />

        {/* Widget Controls */}
        <DashboardWidgetToggle
          widgets={widgets}
          onWidgetChange={handleWidgetChange}
        />

        {/* KPIs */}
        {widgets.kpis && (
          <DashboardKPIs stats={dashboardData.stats} />
        )}

        {/* Charts */}
        {(widgets.poStatus || widgets.topUsed) && (
          <DashboardCharts
            poStatusData={poStatusData}
            topUsedData={topUsedData}
            topUsed={topUsed}
            onNavigate={navigate}
          />
        )}

        {/* Embedded Reports */}
        {(widgets.stockSummary || widgets.supplierSpend) && (
          <EmbeddedReports
            stockSummary={stockSummary}
            supplierSpend={supplierSpend}
            onNavigate={navigate}
          />
        )}

        {/* Main Content: Recent Parts + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Parts */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="card-title">Recent Parts</h3>
                    <p className="card-subtitle">Latest inventory additions</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/parts')} 
                  className="btn-ghost text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="card-body">
                <PartListTable
                  data={{ items: dashboardData.recentParts }}
                  onEdit={(part) => navigate(`/parts/${part._id}/edit`)}
                  onDeactivate={(part) => console.log('Deactivate part:', part._id)}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <DashboardSidebar
            lowStockParts={dashboardData.lowStockParts}
            onNavigate={navigate}
          />
        </div>
      </div>
    </div>
  );
}
