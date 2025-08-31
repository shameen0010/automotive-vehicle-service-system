import { useState, useEffect } from 'react';
import api from '../api/client';
import React from 'react';

export default function FinanceManagerDashboard() {
  const [loyaltyRequests, setLoyaltyRequests] = useState([]);
  const [financialStats, setFinancialStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load loyalty discount requests
      const loyaltyResponse = await api.get('/users/loyalty-requests');
      setLoyaltyRequests(loyaltyResponse.data.requests || []);
      // Remove or stub financial stats for now
      setFinancialStats({ totalRevenue: 0, totalDiscounts: 0 });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setMessage('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLoyaltyApproval = async (userId, approved) => {
    try {
      await api.post(`/finance/loyalty-approval`, {
        userId,
        approved,
        notes: approved ? 'Approved by Finance Manager' : 'Rejected by Finance Manager'
      });
      setMessage(`Loyalty discount ${approved ? 'approved' : 'rejected'} successfully!`);
      loadDashboardData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to process approval');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading finance dashboard...</div>
        </div>
      </div>
    );
  }
  if (message && loyaltyRequests.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-red-600 font-semibold">{message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Finance Manager Dashboard</h1>
        <p className="text-gray-600">Manage financial operations and loyalty programs</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Financial Statistics */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">Total Revenue</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${financialStats.totalRevenue || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800">Pending Loyalty Requests</h3>
          <p className="text-2xl font-bold text-green-600">
            {loyaltyRequests.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-800">Total Discounts Given</h3>
          <p className="text-2xl font-bold text-purple-600">
            ${financialStats.totalDiscounts || 0}
          </p>
        </div>
      </div>

      {/* Loyalty Discount Requests */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Loyalty Discount Requests</h2>
        {loyaltyRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No loyalty discount requests found.
          </div>
        ) : (
          <div className="grid gap-4">
            {loyaltyRequests.map(request => (
              <div key={request._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{request.name}</h3>
                    <p className="text-gray-600">{request.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                        {request.bookingCount} bookings
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Status N/A'}
                      </span>
                      <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
                        Requested: {new Date(request.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    {request.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Notes:</strong> {request.notes}
                      </p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoyaltyApproval(request._id, true)}
                        className="px-3 py-1 rounded text-sm bg-green-500 hover:bg-green-600 text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLoyaltyApproval(request._id, false)}
                        className="px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Reports */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Financial Reports</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Monthly Revenue Report</h3>
            <p className="text-sm text-gray-600 mb-3">
              Generate monthly revenue reports for management review.
            </p>
            <button className="btn bg-blue-500 hover:bg-blue-600">
              Generate Report
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Discount Analysis</h3>
            <p className="text-sm text-gray-600 mb-3">
              Analyze discount patterns and their impact on revenue.
            </p>
            <button className="btn bg-green-500 hover:bg-green-600">
              View Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Process Payments</h3>
            <p className="text-sm text-gray-600">Handle pending payments</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Update Pricing</h3>
            <p className="text-sm text-gray-600">Modify service pricing</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Export Data</h3>
            <p className="text-sm text-gray-600">Export financial data</p>
          </button>
        </div>
      </div>
    </div>
  );
}
