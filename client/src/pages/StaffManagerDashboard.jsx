import { useState, useEffect } from 'react';
import api from '../api/client';
import React from 'react';

export default function StaffManagerDashboard() {
  const [staff, setStaff] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      // Load all staff members
      const staffResponse = await api.get('/users/staff');
      setStaff(staffResponse.data.staff || []);
      
      // Load performance statistics
      const performanceResponse = await api.get('/staff/performance-stats');
      setPerformanceStats(performanceResponse.data.stats || {});
    } catch (error) {
      console.error('Failed to load staff data:', error);
      setMessage('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformanceReview = async (staffId, review) => {
    try {
      await api.post(`/staff/${staffId}/performance-review`, review);
      setMessage('Performance review submitted successfully!');
      setShowPerformanceModal(false);
      setSelectedStaff(null);
      loadStaffData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit performance review');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'advisor': 'bg-blue-100 text-blue-800',
      'finance_manager': 'bg-green-100 text-green-800',
      'inventory_manager': 'bg-purple-100 text-purple-800',
      'staff_manager': 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'advisor': 'Service Advisor',
      'finance_manager': 'Finance Manager',
      'inventory_manager': 'Inventory Manager',
      'staff_manager': 'Staff Manager'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading staff dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Staff Manager Dashboard</h1>
        <p className="text-gray-600">Manage staff performance, scheduling, and HR operations</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Staff Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">Total Staff</h3>
          <p className="text-2xl font-bold text-blue-600">{staff.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800">Available Staff</h3>
          <p className="text-2xl font-bold text-green-600">
            {staff.filter(s => s.isAvailable).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-800">Avg Performance</h3>
          <p className="text-2xl font-bold text-purple-600">
            {performanceStats.averagePerformance || 0}%
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-medium text-orange-800">Departments</h3>
          <p className="text-2xl font-bold text-orange-600">
            {new Set(staff.map(s => s.department).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Staff Performance Overview */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Staff Performance Overview</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Top Performers</h3>
            <div className="space-y-2">
              {staff
                .filter(s => s.performanceScore > 80)
                .slice(0, 3)
                .map(member => (
                  <div key={member._id} className="flex justify-between items-center">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-green-600 font-bold">{member.performanceScore || 0}%</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Needs Improvement</h3>
            <div className="space-y-2">
              {staff
                .filter(s => s.performanceScore < 70)
                .slice(0, 3)
                .map(member => (
                  <div key={member._id} className="flex justify-between items-center">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-red-600 font-bold">{member.performanceScore || 0}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">All Staff Members</h2>
        {staff.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No staff members found.
          </div>
        ) : (
          <div className="grid gap-4">
            {staff.map(staffMember => (
              <div key={staffMember._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{staffMember.name}</h3>
                    <p className="text-gray-600">{staffMember.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getRoleColor(staffMember.role)}`}>
                        {getRoleLabel(staffMember.role)}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        staffMember.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {staffMember.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      {staffMember.department && (
                        <span className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-800">
                          {staffMember.department}
                        </span>
                      )}
                      <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                        Performance: {staffMember.performanceScore || 0}%
                      </span>
                    </div>
                    {staffMember.specializations && staffMember.specializations.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Specializations: </span>
                        <span className="text-sm font-medium">
                          {staffMember.specializations.join(', ')}
                        </span>
                      </div>
                    )}
                    {staffMember.permissions && staffMember.permissions.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Permissions: </span>
                        <span className="text-sm font-medium">
                          {staffMember.permissions.map(p => p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedStaff(staffMember);
                        setShowPerformanceModal(true);
                      }}
                      className="px-3 py-1 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Performance Review
                    </button>
                    <button
                      onClick={() => {
                        // Handle schedule management
                      }}
                      className="px-3 py-1 rounded text-sm bg-green-500 hover:bg-green-600 text-white"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Review Modal */}
      {showPerformanceModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              Performance Review - {selectedStaff.name}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handlePerformanceReview(selectedStaff._id, {
                score: parseInt(formData.get('score')),
                comments: formData.get('comments'),
                goals: formData.get('goals')
              });
            }}>
              <div className="mb-4">
                <label className="label">Performance Score (0-100)</label>
                <input
                  type="number"
                  name="score"
                  min="0"
                  max="100"
                  defaultValue={selectedStaff.performanceScore || 0}
                  className="input mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Comments</label>
                <textarea
                  name="comments"
                  rows="3"
                  className="input mt-1"
                  placeholder="Performance comments..."
                />
              </div>
              <div className="mb-4">
                <label className="label">Goals for Next Period</label>
                <textarea
                  name="goals"
                  rows="3"
                  className="input mt-1"
                  placeholder="Goals and objectives..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn bg-blue-500 hover:bg-blue-600">
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPerformanceModal(false);
                    setSelectedStaff(null);
                  }}
                  className="btn bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR Tools */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">HR Management Tools</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Staff Scheduling</h3>
            <p className="text-sm text-gray-600 mb-3">
              Manage work schedules and shifts for all staff members.
            </p>
            <button className="btn bg-blue-500 hover:bg-blue-600">
              Manage Schedules
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Training Programs</h3>
            <p className="text-sm text-gray-600 mb-3">
              Track training progress and assign new training modules.
            </p>
            <button className="btn bg-green-500 hover:bg-green-600">
              View Training
            </button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Performance Reports</h3>
            <p className="text-sm text-gray-600 mb-3">
              Generate comprehensive performance reports for management.
            </p>
            <button className="btn bg-purple-500 hover:bg-purple-600">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Add New Staff</h3>
            <p className="text-sm text-gray-600">Create new staff accounts</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Time Tracking</h3>
            <p className="text-sm text-gray-600">Monitor work hours</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Leave Management</h3>
            <p className="text-sm text-gray-600">Handle leave requests</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium">Payroll</h3>
            <p className="text-sm text-gray-600">Process payroll</p>
          </button>
        </div>
      </div>
    </div>
  );
}



<<<<<<< HEAD


=======
>>>>>>> 383711344a2ca0083916cb5a126db79b0ef3e9d9
