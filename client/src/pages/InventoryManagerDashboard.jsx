import { useState, useEffect } from 'react';
import api from '../api/client';
import React from 'react';

export default function InventoryManagerDashboard() {
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    partNumber: '',
    category: '',
    quantity: 0,
    minQuantity: 5,
    price: 0,
    supplier: ''
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      // Load inventory items
      const inventoryResponse = await api.get('/inventory/items');
      setInventory(inventoryResponse.data.items || []);
      
      // Load low stock items
      const lowStockResponse = await api.get('/inventory/low-stock');
      setLowStockItems(lowStockResponse.data.items || []);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      setMessage('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/items', form);
      setMessage('Inventory item added successfully!');
      setShowAddForm(false);
      setForm({
        name: '',
        partNumber: '',
        category: '',
        quantity: 0,
        minQuantity: 5,
        price: 0,
        supplier: ''
      });
      loadInventoryData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add inventory item');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await api.put(`/inventory/items/${itemId}/quantity`, { quantity: newQuantity });
      setMessage('Quantity updated successfully!');
      loadInventoryData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading inventory dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Manager Dashboard</h1>
          <p className="text-gray-600">Manage parts inventory and stock levels</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn bg-green-500 hover:bg-green-600"
        >
          Add New Item
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Inventory Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">Total Items</h3>
          <p className="text-2xl font-bold text-blue-600">{inventory.length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="font-medium text-red-800">Low Stock Items</h3>
          <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800">Total Value</h3>
          <p className="text-2xl font-bold text-green-600">
            ${inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-800">Categories</h3>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(inventory.map(item => item.category)).size}
          </p>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Add New Inventory Item</h2>
          <form onSubmit={handleAddItem} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Item Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="label">Part Number</label>
              <input
                type="text"
                value={form.partNumber}
                onChange={(e) => setForm({...form, partNumber: e.target.value})}
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="input mt-1"
                required
              >
                <option value="">Select Category</option>
                <option value="Engine Parts">Engine Parts</option>
                <option value="Brake System">Brake System</option>
                <option value="Electrical">Electrical</option>
                <option value="Body Parts">Body Parts</option>
                <option value="Filters">Filters</option>
                <option value="Fluids">Fluids</option>
                <option value="Tools">Tools</option>
              </select>
            </div>
            <div>
              <label className="label">Supplier</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({...form, supplier: e.target.value})}
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="label">Initial Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({...form, quantity: parseInt(e.target.value)})}
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="label">Minimum Quantity</label>
              <input
                type="number"
                min="0"
                value={form.minQuantity}
                onChange={(e) => setForm({...form, minQuantity: parseInt(e.target.value)})}
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="label">Price per Unit</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({...form, price: parseFloat(e.target.value)})}
                className="input mt-1"
                required
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn bg-blue-500 hover:bg-blue-600">
                Add Item
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Low Stock Alerts</h2>
          <div className="grid gap-4">
            {lowStockItems.map(item => (
              <div key={item._id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-600">Part #: {item.partNumber}</p>
                    <div className="mt-2 flex gap-4">
                      <span className="text-red-600 font-medium">
                        Current: {item.quantity} | Min: {item.minQuantity}
                      </span>
                      <span className="text-gray-600">Category: {item.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 10)}
                      className="px-3 py-1 rounded text-sm bg-green-500 hover:bg-green-600 text-white"
                    >
                      Add 10
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 50)}
                      className="px-3 py-1 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Add 50
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">All Inventory Items</h2>
        {inventory.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No inventory items found. Add your first item above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Part #</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item._id} className="border-t">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-gray-600">{item.partNumber}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">
                      <span className={`font-medium ${
                        item.quantity <= item.minQuantity ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2">${item.price}</td>
                    <td className="px-4 py-2 font-medium">${(item.quantity * item.price).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        item.quantity <= item.minQuantity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.quantity <= item.minQuantity ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        className="px-2 py-1 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white mr-1"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, Math.max(0, item.quantity - 1))}
                        className="px-2 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
                      >
                        -1
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Generate Report</h3>
            <p className="text-sm text-gray-600">Export inventory report</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Order Parts</h3>
            <p className="text-sm text-gray-600">Place supplier orders</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Stock Take</h3>
            <p className="text-sm text-gray-600">Perform inventory count</p>
          </button>
        </div>
      </div>
    </div>
  );
}





