import React, { useEffect, useMemo, useState, useCallback } from 'react';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import DataTable from '../../components/ui/DataTable';
import StatCard from '../../components/ui/StatCard';
import api, { getStockSummaryReport } from '../../services/inventoty/api';

export default function StockSummaryReport() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalParts: 0, totalOnHand: 0, totalAvailable: 0, totalValuation: 0 });

  // Filters
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [category, setCategory] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMasterData = useCallback(async () => {
    try {
      const [catsRes, suppRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/suppliers', { params: { showAll: true, limit: 1000 } })
      ]);
      const cats = (catsRes.data || []).map(c => ({ value: c.name || c._id, label: c.name || c.displayName || 'Category' }));
      const suppliers = (suppRes.data.suppliers || suppRes.data.items || suppRes.data || []).map(s => ({ value: s._id, label: s.companyName || s.displayName || s.name }));
      setCategoryOptions(cats);
      setSupplierOptions(suppliers);
    } catch (e) {
      // Best-effort; keep filters empty on error
      // eslint-disable-next-line no-console
      console.error('Failed to load master data for filters', e);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (supplierId) params.supplierId = supplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await getStockSummaryReport(params);
      setRows(data.items || []);
      setSummary(data.summary || { totalParts: 0, totalOnHand: 0, totalAvailable: 0, totalValuation: 0 });
    } catch (e) {
      setRows([]);
      setSummary({ totalParts: 0, totalOnHand: 0, totalAvailable: 0, totalValuation: 0 });
    } finally {
      setLoading(false);
    }
  }, [category, supplierId, startDate, endDate]);

  useEffect(() => {
    fetchMasterData();
    fetchReport();
  }, [fetchMasterData]);

  const columns = useMemo(() => [
    { key: 'partCode', label: 'Part Code' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'onHand', label: 'On Hand' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'available', label: 'Available' },
    { key: 'unitPrice', label: 'Unit Price', render: (r) => r.unitPrice?.toFixed(2) },
    { key: 'value', label: 'Value', render: (r) => r.value?.toFixed(2) },
  ], []);

  const filters = [
    {
      key: 'category',
      label: 'Category',
      value: category,
      options: categoryOptions,
      placeholder: 'All Categories'
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      value: supplierId,
      options: supplierOptions,
      placeholder: 'All Suppliers'
    }
  ];

  const handleFilterChange = (key, value) => {
    if (key === 'category') setCategory(value);
    if (key === 'supplierId') setSupplierId(value);
  };

  return (
    <div className="min-h-screen w-full bg-app flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-8 pt-8">
        <div>
          <h1 className="section-title mb-2">Stock Summary Report</h1>
          <p className="text-slate-400">Current levels and valuation with supplier/category filters</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Parts" value={summary.totalParts} trend="" />
          <StatCard title="Total On Hand" value={summary.totalOnHand} trend="" />
          <StatCard title="Total Available" value={summary.totalAvailable} trend="" />
          <StatCard title="Stock Value" value={`$${summary.totalValuation?.toFixed?.(2) || '0.00'}`} trend="" />
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
            <label className="label">Start Date (price lookup)</label>
            <input type="date" className="input w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">End Date (price lookup)</label>
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
            <DataTable columns={columns} data={rows} loading={loading} emptyMessage="No parts found for selected filters" />
          </div>
        </div>
      </div>
    </div>
  );
}


