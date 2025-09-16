import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';
import PageHeader from '../../components/inventory/PageHeader';
import FilterBar from '../../components/inventory/FilterBar';
import StatsCard from '../../components/inventory/StatsCard';
import StatusBadge from '../../components/inventory/StatusBadge';
import SearchInput from '../../components/inventory/SearchInput';
import Pagination from '../../components/inventory/Pagination';
import ActionMenu from '../../components/inventory/ActionMenu';
import LoadingSpinner from '../../components/inventory/LoadingSpinner';
import SuccessToast from '../../components/inventory/SuccessToast';

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [toast, setToast] = useState('');

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isInventoryManager = user?.role === 'inventory_manager' || user?.role === 'manager' || user?.role === 'admin';

  const statusColors = {
    draft: 'draft',
    submitted: 'submitted', 
    approved: 'approved',
    delivered: 'delivered'
  };

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    delivered: 'Delivered'
  };

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      if (filter !== 'all') {
        params.append('status', filter);
      }
      const response = await api.get(`/api/purchase-orders?${params}`);
      const purchaseOrders = response.data?.purchaseOrders || [];
      const pagination = response.data?.pagination || {};
      setPurchaseOrders(purchaseOrders);
      setTotalPages(pagination.totalPages || 0);
    } catch (err) {
      console.error('Error fetching POs:', err);
      setPurchaseOrders([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/purchase-orders/statistics');
      setStats(response.data || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({});
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchStats();
  }, [filter, currentPage, fetchPurchaseOrders, fetchStats]);

  const handleStatusChange = async (poId, newStatus) => {
    try {
      let endpoint = '';
      let action = '';
      let requiredRole = '';
      
      switch (newStatus) {
        case 'submitted':
          endpoint = `submit`;
          action = 'submit';
          requiredRole = 'Inventory Manager';
          if (!isInventoryManager) {
            setToast('Access denied. Only Inventory Managers can submit purchase orders.');
            return;
          }
          break;
        case 'approved':
          endpoint = `approve`;
          action = 'approve';
          requiredRole = 'Manager';
          if (!isManager) {
            setToast('Access denied. Only Managers can approve purchase orders.');
            return;
          }
          break;
        case 'delivered':
          endpoint = `deliver`;
          action = 'deliver';
          requiredRole = 'Inventory Manager';
          if (!isInventoryManager) {
            setToast('Access denied. Only Inventory Managers can mark purchase orders as delivered.');
            return;
          }
          break;
        default:
          return;
      }
      
      await api.patch(`/api/purchase-orders/${poId}/${endpoint}`);
      
      fetchPurchaseOrders();
      fetchStats();
      
      setToast(`Purchase Order ${action}d successfully!`);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setToast(`Failed to ${newStatus} purchase order: ${errorMessage}`);
      console.error(`Error ${newStatus}ing PO:`, err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredPOs = (purchaseOrders || []).filter(po => {
    if (searchTerm) {
      return (
        po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items?.some(item => 
          item.part?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.part?.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return true;
  });

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: filter,
      placeholder: 'All Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'delivered', label: 'Delivered' }
      ]
    }
  ];

  const headerActions = [
    ...(isInventoryManager ? [
      {
        label: 'Download All PDFs',
        icon: '📄',
        onClick: () => {
          const link = document.createElement('a');
          link.href = `/api/purchase-orders/download/all-pdf?status=${filter}`;
          link.download = `PurchaseOrders-Summary-${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
        },
        variant: 'secondary'
      },
      {
        label: 'Create New PO',
        icon: '+',
        onClick: () => navigate('/purchase-orders/new'),
        variant: 'primary'
      }
    ] : [])
  ];

  if (loading) {
    return <LoadingSpinner message="Loading purchase orders..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Purchase Orders"
            subtitle={
              <div className="flex items-center gap-4">
                <span>Manage and track purchase orders</span>
                {user && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Role:</span>
                    <StatusBadge 
                      status={user.role === 'admin' ? 'Admin' : 
                             user.role === 'manager' ? 'Manager' : 
                             user.role === 'inventory_manager' ? 'Inventory Manager' : 
                             'User'} 
                      variant={isManager ? 'success' : isInventoryManager ? 'info' : 'default'}
                    />
                  </div>
                )}
              </div>
            }
            actions={headerActions}
          />

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total POs"
              value={stats.totalPOs || 0}
              icon="📋"
              color="primary"
            />
            <StatsCard
              title="Total Value"
              value={formatCurrency(stats.totalValue || 0)}
              icon="💰"
              color="success"
            />
            {stats.statusBreakdown?.map(stat => (
              <StatsCard
                key={stat._id}
                title={statusLabels[stat._id] || stat._id}
                value={stat.count}
                icon="📊"
                color="info"
              />
            ))}
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-1">
              <FilterBar
                filters={filterOptions}
                onFilterChange={(key, value) => setFilter(value)}
                title="Filter"
              />
            </div>
            <div className="lg:col-span-3">
              <div className="card">
                <div className="card-body">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by PO number, supplier, or part..."
                    onClear={() => setSearchTerm('')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Orders List */}
          <div className="space-y-6 mb-8">
            {filteredPOs.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">No purchase orders found</h3>
                <p className="text-slate-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredPOs.map(po => (
                <div key={po._id} className="card card-hover">
                  <div className="card-body">
                    {/* PO Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-100 mb-2">{po.poNumber}</h3>
                          <StatusBadge status={statusLabels[po.status]} variant={statusColors[po.status]} />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Status Action Buttons */}
                        {po.status === 'draft' && isInventoryManager && (
                          <button
                            onClick={() => handleStatusChange(po._id, 'submitted')}
                            className="btn-primary text-sm"
                            title="Submit Purchase Order (Inventory Manager only)"
                          >
                            Submit
                          </button>
                        )}
                        
                        {po.status === 'submitted' && isManager && (
                          <button
                            onClick={() => handleStatusChange(po._id, 'approved')}
                            className="btn-primary text-sm"
                            title="Approve Purchase Order (Manager only)"
                          >
                            Approve
                          </button>
                        )}
                        
                        {po.status === 'approved' && isInventoryManager && (
                          <button
                            onClick={() => handleStatusChange(po._id, 'delivered')}
                            className="btn-primary text-sm"
                            title="Mark as Delivered (Inventory Manager only)"
                          >
                            Mark Delivered
                          </button>
                        )}
                        
                        {/* Status Messages */}
                        {po.status === 'submitted' && !isManager && (
                          <div className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            ⏳ Awaiting Manager Approval
                          </div>
                        )}
                        
                        {po.status === 'approved' && !isInventoryManager && (
                          <div className="badge bg-green-500/20 text-green-400 border-green-500/30">
                            ✅ Ready for Delivery
                          </div>
                        )}

                        <ActionMenu
                          actions={[
                            {
                              label: 'Download PDF',
                              icon: '📄',
                              onClick: () => {
                                const link = document.createElement('a');
                                link.href = `/api/purchase-orders/${po._id}/pdf`;
                                link.download = `PO-${po.poNumber || po._id}.pdf`;
                                link.click();
                              }
                            },
                            ...(isInventoryManager ? [
                              {
                                label: 'Edit',
                                icon: '✏️',
                                onClick: () => navigate(`/purchase-orders/${po._id}`)
                              }
                            ] : [])
                          ]}
                        />
                      </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Supplier Information</h4>
                        <div className="text-slate-200 font-medium">{po.supplier?.name || 'N/A'}</div>
                        <div className="text-sm text-slate-400">{po.supplier?.email}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Delivery Information</h4>
                        <div className="text-slate-200">Expected: {formatDate(po.expectedDeliveryDate)}</div>
                        <div className="text-sm text-slate-400">Payment: {po.paymentTerms}</div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Items ({po.items?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {po.items?.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-200">
                                {item.part?.name || 'Unknown Part'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {item.part?.partNumber || 'N/A'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-300">Qty: {item.quantity}</div>
                              <div className="text-sm font-medium text-primary">
                                {formatCurrency(item.totalPrice)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {po.items?.length > 3 && (
                          <div className="text-center text-sm text-slate-400">
                            +{po.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <div className="text-sm text-slate-400">
                        Created: {formatDate(po.createdAt)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Total Amount</div>
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(po.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <SuccessToast 
        message={toast} 
        onClose={() => setToast('')} 
      />
    </div>
  );
};

export default PurchaseOrdersPage;