import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import DataTable from '../../components/ui/DataTable';
import StatCard from '../../components/ui/StatCard';
import api, { getSupplierSpendReport } from '../../services/inventoty/api';

export default function SupplierSpendReport() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const totalAmount = rows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalOrders = rows.reduce((sum, r) => sum + (r.totalOrders || 0), 0);

  const fetchSuppliers = useCallback(async () => {
    try {
      const resp = await api.get('/api/suppliers', { params: { showAll: true, limit: 1000 } });
      const items = resp.data.suppliers || resp.data.items || resp.data || [];
      setSupplierOptions(items.map(s => ({ value: s._id, label: s.companyName || s.displayName || s.name })));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load suppliers', e);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await getSupplierSpendReport(params);
      setRows(data.rows || []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supplierId, startDate, endDate]);

  useEffect(() => {
    fetchSuppliers();
    fetchReport();
  }, [fetchSuppliers]);

  const columns = useMemo(() => [
    { key: 'companyName', label: 'Supplier' },
    { key: 'totalOrders', label: 'Orders' },
    { key: 'totalAmount', label: 'Total Spend', render: (r) => (r.totalAmount || 0).toFixed(2) },
  ], []);

  const filters = [
    { key: 'supplierId', label: 'Supplier', value: supplierId, options: supplierOptions, placeholder: 'All Suppliers' },
  ];

  const handleFilterChange = (key, value) => {
    if (key === 'supplierId') setSupplierId(value);
  };

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-8 pt-8">
        <div>
          <h1 className="section-title mb-2">Supplier Spend Report</h1>
          <p className="text-slate-400">Total spend by supplier over a date range</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Spend" value={`$${totalAmount.toFixed(2)}`} trend="" />
          <StatCard title="Total Orders" value={totalOrders} trend="" />
        </div>
      </div>

      {/* Filters */}
      <div className="px-8">
        <SearchFilterBar
          searchValue={''}
          onSearchChange={() => {}}
          searchPlaceholder=""
          filters={filters}
          onFilterChange={handleFilterChange}
          actions={[{ label: 'Run Report', onClick: fetchReport, className: 'btn-primary' }]}
          className="mb-4"
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear Dates</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col px-8">
        <div className="card mb-8 flex-1">
          <div className="card-body">
            <DataTable columns={columns} data={rows} loading={loading} emptyMessage="No supplier spend for selected filters" />
          </div>
        </div>
      </div>
    </div>
  );
}


