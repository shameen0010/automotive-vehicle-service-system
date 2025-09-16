import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import api from '../../api/client';
import FormField from "../../components/inventory/FormField";
import FormSection from "../../components/inventory/FormSection";
import ActionButtons from "../../components/inventory/ActionButtons";
import LoadingSpinner from "../../components/inventory/LoadingSpinner";
import ErrorAlert from "../../components/inventory/ErrorAlert";
import SuccessToast from "../../components/inventory/SuccessToast";

const PurchaseOrderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  const isInventoryManager = user?.role === 'inventory_manager' || user?.role === 'manager' || user?.role === 'admin';
  
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    notes: '',
    deliveryAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
    paymentTerms: 'Net 30',
    paymentMethod: 'credit',
    paymentDueDate: '',
    shippingInstructions: '',
    items: []
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [parts, setParts] = useState([]);
  const [newItem, setNewItem] = useState({ part: '', quantity: 1, unitPrice: 0 });
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [suppliersError, setSuppliersError] = useState(null);
  const [partsError, setPartsError] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      setSuppliersError(null);
      const response = await api.get('/api/suppliers/public');
      setSuppliers(response.data.suppliers || response.data.items || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch suppliers';
      setSuppliersError(errorMessage);
      setError(`Suppliers error: ${errorMessage}`);
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  const fetchParts = useCallback(async () => {
    try {
      setLoadingParts(true);
      setPartsError(null);
      const response = await api.get('/api/parts/public');
      setParts(response.data.parts || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch parts';
      setPartsError(errorMessage);
      setError(`Parts error: ${errorMessage}`);
    } finally {
      setLoadingParts(false);
    }
  }, []);

  const fetchPurchaseOrder = useCallback(async () => {
    try {
      if (!id || id === 'new') return;
      setLoading(true);
      const response = await api.get(`/api/purchase-orders/${id}`);
      const po = response.data?.purchaseOrder || response.data;
      if (po) {
        setFormData({
          supplier: po.supplier?._id || '',
          expectedDeliveryDate: po.expectedDeliveryDate?.slice(0,10) || '',
          notes: po.notes || '',
          deliveryAddress: po.deliveryAddress || { street: '', city: '', state: '', zipCode: '', country: '' },
          paymentTerms: po.paymentTerms || 'Net 30',
          paymentMethod: po.paymentMethod || 'credit',
          paymentDueDate: po.paymentDueDate?.slice(0,10) || '',
          shippingInstructions: po.shippingInstructions || '',
          items: (po.items || []).map(i => ({
            part: i.part?._id || i.part,
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
            totalPrice: i.totalPrice || (i.quantity || 0) * (i.unitPrice || 0)
          }))
        });
      }
    } catch (err) {
      console.error('❌ Error fetching purchase order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSuppliers();
    fetchParts();
    fetchPurchaseOrder();
  }, [fetchSuppliers, fetchParts, fetchPurchaseOrder]);

  const addItem = () => {
    if (!newItem.part) return;
    const item = {
      part: newItem.part,
      quantity: Number(newItem.quantity) || 1,
      unitPrice: Number(newItem.unitPrice) || 0,
      totalPrice: (Number(newItem.quantity) || 1) * (Number(newItem.unitPrice) || 0)
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, item] }));
    setNewItem({ part: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...formData.items];
    newItems[index].quantity = Number(quantity);
    newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const updateItemPrice = (index, unitPrice) => {
    const newItems = [...formData.items];
    newItems[index].unitPrice = Number(unitPrice);
    newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = { ...formData };
      if (!id || id === 'new') {
        const response = await api.post('/api/purchase-orders', payload);
        const created = response.data?.purchaseOrder || response.data;
        setToast('Purchase Order created successfully!');
        setTimeout(() => navigate(`/purchase-orders/${created?._id || 'list'}`), 1500);
      } else {
        await api.put(`/api/purchase-orders/${id}`, payload);
        setToast('Purchase Order updated successfully!');
        setTimeout(() => navigate('/purchase-orders'), 1500);
      }
    } catch (err) {
      console.error('❌ Error saving purchase order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save purchase order');
    } finally {
      setSaving(false);
    }
  };

  if (!isInventoryManager) {
    return (
      <div className="bg-app min-h-screen">
        <div className="app-container">
          <div className="card text-center p-8">
            <div className="text-red-400 text-xl mb-4">🚫</div>
            <h2 className="card-title mb-2">Access Denied</h2>
            <p className="text-slate-400">Only inventory managers can manage purchase orders.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading purchase order data..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title mb-2">
                {id && id !== 'new' ? 'Edit Purchase Order' : 'New Purchase Order'}
              </h1>
              <p className="text-slate-400">
                {id && id !== 'new' ? 'Update purchase order details and items' : 'Create a new purchase order for inventory'}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {id && id !== 'new' && (
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `/api/purchase-orders/${id}/pdf`;
                    link.download = `PO-${id}.pdf`;
                    link.click();
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <span>📄</span>
                  Download PDF
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/purchase-orders')}
                className="btn-secondary flex items-center gap-2"
              >
                <span>←</span>
                Back to Purchase Orders
              </button>
            </div>
          </div>

          <ErrorAlert 
            message={error} 
            onDismiss={() => setError(null)} 
          />

          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-8">
            {/* Supplier & Delivery */}
            <FormSection title="Supplier & Delivery Information" icon="🚚">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Supplier"
                  name="supplier"
                  required
                  error={suppliersError}
                >
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    required
                    className="select"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name} - {supplier.email}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Expected Delivery Date"
                  name="expectedDeliveryDate"
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </FormSection>

            {/* Payment Terms */}
            <FormSection title="Payment Terms" icon="💳">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Payment Terms"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                >
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="select"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Net 90">Net 90</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </FormField>

                <FormField
                  label="Payment Method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="select"
                  >
                    <option value="credit">Credit</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </FormField>

                <FormField
                  label="Payment Due Date"
                  name="paymentDueDate"
                  type="date"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                />
              </div>
            </FormSection>

            {/* Delivery Address */}
            <FormSection title="Delivery Address" icon="📍">
              <div className="space-y-4">
                <FormField
                  label="Street Address"
                  name="deliveryAddress.street"
                  placeholder="Street Address"
                  value={formData.deliveryAddress.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryAddress: { ...prev.deliveryAddress, street: e.target.value }
                  }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="City"
                    name="deliveryAddress.city"
                    placeholder="City"
                    value={formData.deliveryAddress.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      deliveryAddress: { ...prev.deliveryAddress, city: e.target.value }
                    }))}
                  />

                  <FormField
                    label="State"
                    name="deliveryAddress.state"
                    placeholder="State"
                    value={formData.deliveryAddress.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      deliveryAddress: { ...prev.deliveryAddress, state: e.target.value }
                    }))}
                  />

                  <FormField
                    label="ZIP Code"
                    name="deliveryAddress.zipCode"
                    placeholder="ZIP Code"
                    value={formData.deliveryAddress.zipCode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      deliveryAddress: { ...prev.deliveryAddress, zipCode: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </FormSection>

            {/* Order Items */}
            <FormSection title="Order Items" icon="📦">
              {/* Add New Item */}
              <div className="card bg-white/5 border-dashed border-white/20">
                <div className="card-body">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Add New Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FormField
                      label="Part"
                      name="newItem.part"
                      error={partsError}
                    >
                      <select
                        value={newItem.part}
                        onChange={(e) => setNewItem(prev => ({ ...prev, part: e.target.value }))}
                        className="select"
                      >
                        <option value="">Select a part</option>
                        {parts.map(part => (
                          <option key={part._id} value={part._id}>
                            {part.name} ({part.partCode})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Quantity"
                      name="newItem.quantity"
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    />

                    <FormField
                      label="Unit Price"
                      name="newItem.unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                    />

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!newItem.part}
                      className="btn-primary disabled:opacity-50"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Part</th>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Quantity</th>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Unit Price</th>
                          <th className="text-left p-4 text-sm font-medium text-slate-300">Total</th>
                          <th className="text-center p-4 text-sm font-medium text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-t border-white/5">
                            <td className="p-4 text-sm text-slate-200">
                              {parts.find(p => p._id === item.part)?.name || 'Unknown Part'}
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, e.target.value)}
                                className="input w-20"
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItemPrice(index, e.target.value)}
                                className="input w-24"
                              />
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-200">
                              ${(item.totalPrice || 0).toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="btn-secondary btn-icon text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="border-t border-white/5 p-4 bg-white/5">
                    <div className="flex justify-end items-center gap-4">
                      <span className="text-lg font-medium text-slate-300">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            {/* Additional Information */}
            <FormSection title="Additional Information" icon="📝">
              <div className="space-y-6">
                <FormField
                  label="Shipping Instructions"
                  name="shippingInstructions"
                  value={formData.shippingInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingInstructions: e.target.value }))}
                  helpText="Special handling instructions, delivery preferences, etc."
                >
                  <textarea
                    value={formData.shippingInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingInstructions: e.target.value }))}
                    placeholder="Special handling instructions, delivery preferences, etc."
                    rows={3}
                    className="textarea"
                  />
                </FormField>

                <FormField
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  helpText="Additional notes or comments about this purchase order"
                >
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or comments about this purchase order"
                    rows={3}
                    className="textarea"
                  />
                </FormField>
              </div>
            </FormSection>

            <ActionButtons
              onSave={save}
              onCancel={() => navigate('/purchase-orders')}
              loading={saving}
              saveText={id && id !== 'new' ? "Update Purchase Order" : "Create Purchase Order"}
            />
          </form>
        </div>
      </div>

      <SuccessToast 
        message={toast} 
        onClose={() => setToast("")} 
      />
    </div>
  );
};

export default PurchaseOrderFormPage;