import { useEffect, useMemo, useState } from 'react';
import { getInventoryOverview, getTopUsedParts, getStockSummaryReport, getSupplierSpendReport } from '../../services/inventoty/api';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Line, Bar } from 'react-chartjs-2';
import { getSocket, setSocket } from '../../services/socket';
import NotificationBell from '../../components/inventory/NotificationBell';
import PartListTable from '../../components/inventory/PartListTable';
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
    return raw ? JSON.parse(raw) : { kpis: true, poStatus: true, topUsed: true };
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
        { label: 'Used Qty', data: values, backgroundColor: 'rgba(16,185,129,0.6)' }
      ]
    };
  }, [topUsed]);

  if (loading) return <div className="p-4"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div>
          <h1 className="text-xl font-semibold">Inventory Dashboard</h1>
          <p className="text-slate-500 text-sm">Monitor inventory, stock levels, purchase orders and suppliers</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={load} className="px-3 py-1 border rounded">Refresh</button>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto-refresh
          </label>
        </div>
      </div>

      {widgets.kpis && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        <StatCard title="Total Parts" value={dashboardData.stats.parts} />
        <StatCard title="Low Stock Items" value={dashboardData.stats.lowStock} />
        <StatCard title="Active Suppliers" value={dashboardData.stats.suppliers} />
        <StatCard title="PO Value" value={`$${dashboardData.stats.purchaseOrdersValue.toFixed(2)}`} />
      </div>
      )}

      <div className="flex items-center gap-3 text-sm px-4">
        <label className="flex items-center gap-1"><input type="checkbox" checked={widgets.kpis} onChange={e=>setWidgets(v=>({...v,kpis:e.target.checked}))} /> KPIs</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={widgets.poStatus} onChange={e=>setWidgets(v=>({...v,poStatus:e.target.checked}))} /> PO Status</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={widgets.topUsed} onChange={e=>setWidgets(v=>({...v,topUsed:e.target.checked}))} /> Top Used</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
        {widgets.poStatus && (
        <div className="bg-white rounded shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Purchase Orders by Status</h2>
            <button className="text-blue-600 text-sm" onClick={() => navigate('/purchase-orders')}>View all</button>
          </div>
          <Bar data={poStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        )}

        {widgets.topUsed && (
        <div className="bg-white rounded shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Top Used Parts</h2>
            <button className="text-blue-600 text-sm" onClick={() => navigate('/parts')}>Go to parts</button>
          </div>
          <Bar data={topUsedData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          <div className="mt-3 space-y-1">
            {topUsed.map(i => (
              <div key={i.partId} className="flex items-center justify-between text-sm">
                <div className="truncate">{i.partCode || i.name}</div>
                <StatusBadge status="info" label={`Used ${i.usedQty}`} />
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Embedded Stock Summary */}
      <div className="bg-white rounded shadow p-3 mx-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Stock Summary</h2>
          <button className="text-blue-600 text-sm" onClick={() => navigate('/reports/stock-summary')}>Open full report</button>
        </div>
        {stockSummary.summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <StatCard title="Parts" value={stockSummary.summary.totalParts} />
            <StatCard title="On Hand" value={stockSummary.summary.totalOnHand} />
            <StatCard title="Available" value={stockSummary.summary.totalAvailable} />
            <StatCard title="Value" value={`$${(stockSummary.summary.totalValuation || 0).toFixed(2)}`} />
          </div>
        ) : null}
        <div className="mt-2 space-y-1">
          {stockSummary.items.map(item => (
            <div key={item.partId} className="flex items-center justify-between text-sm">
              <div className="truncate">{item.partCode} — {item.name}</div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600">Avail: {item.available}</span>
                <span className="text-slate-600">Value: ${item.value?.toFixed?.(2) || '0.00'}</span>
              </div>
            </div>
          ))}
          {stockSummary.items.length === 0 && (
            <div className="text-sm text-slate-500">No data</div>
          )}
        </div>
      </div>

      {/* Embedded Supplier Spend */}
      <div className="bg-white rounded shadow p-3 mx-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Supplier Spend</h2>
          <button className="text-blue-600 text-sm" onClick={() => navigate('/reports/supplier-spend')}>Open full report</button>
        </div>
        <div className="space-y-1">
          {supplierSpend.map(row => (
            <div key={row.supplierId} className="flex items-center justify-between text-sm">
              <div className="truncate">{row.companyName || 'Unknown Supplier'}</div>
              <div className="flex items-center gap-3">
                <span className="text-slate-600">Orders: {row.totalOrders}</span>
                <span className="text-slate-600">Spend: ${Number(row.totalAmount||0).toFixed(2)}</span>
              </div>
            </div>
          ))}
          {supplierSpend.length === 0 && (
            <div className="text-sm text-slate-500">No data</div>
          )}
        </div>
      </div>

      {/* Combined Main Content: Recent Parts + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 px-4 py-4">
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white rounded shadow flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-medium">Recent Parts</h2>
              <button onClick={() => navigate('/parts')} className="text-blue-600 text-sm">View All →</button>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <PartListTable
                data={{ items: dashboardData.recentParts }}
                onEdit={(part) => navigate(`/parts/${part._id}/edit`)}
                onDeactivate={(part) => console.log('Deactivate part:', part._id)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Low Stock Alert */}
          <div className="bg-white rounded shadow">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-medium">Low Stock Alert</h3>
              <span className="badge chip-accent">{dashboardData.lowStockParts.length} items</span>
            </div>
            <div className="p-3">
              {dashboardData.lowStockParts.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-slate-500">All parts in stock!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.lowStockParts.slice(0, 5).map(part => (
                    <div key={part._id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div>
                        <div className="font-medium text-slate-700 text-sm">{part.name}</div>
                        <div className="text-xs text-slate-500">{part.partCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-600">{part.stock?.onHand || 0}</div>
                        <div className="text-xs text-slate-500">Min: {part.stock?.reorderLevel || 0}</div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => navigate('/low-stock')} className="btn-secondary w-full text-sm">View All Low Stock Items</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded shadow">
            <div className="p-3 border-b">
              <h3 className="font-medium">Quick Actions</h3>
            </div>
            <div className="p-3 space-y-3">
              <button onClick={() => navigate('/parts/new')} className="btn-primary w-full justify-start">Add New Part</button>
              <button onClick={() => navigate('/suppliers/new')} className="btn-secondary w-full justify-start">Add Supplier</button>
              <button onClick={() => navigate('/purchase-orders/new')} className="btn-secondary w-full justify-start">Create Purchase Order</button>
              <button onClick={() => navigate('/inventory/audit')} className="btn-ghost w-full justify-start">View Audit Logs</button>
            </div>
          </div>

          {/* Recent Activity (static placeholders) */}
          <div className="bg-white rounded shadow">
            <div className="p-3 border-b">
              <h3 className="font-medium">Recent Activity</h3>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 text-sm">
                  <div className="text-slate-700">Part updated</div>
                  <div className="text-slate-500 text-xs">2 minutes ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 text-sm">
                  <div className="text-slate-700">PO approved</div>
                  <div className="text-slate-500 text-xs">1 hour ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1 text-sm">
                  <div className="text-slate-700">Low stock alert</div>
                  <div className="text-slate-500 text-xs">3 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


