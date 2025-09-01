import { useState, useEffect } from 'react';
import api from '../api/client';
import Input from '../components/Input';
import React from 'react';
import Swal from 'sweetalert2';

export default function AdvisorManagement() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    specializations: [],
    isAvailable: true,
    maxConcurrentBookings: 1
  });
  const [message, setMessage] = useState('');

  const specializations = ['General Service', 'Oil Change', 'Diagnostics', 'Body Work'];

  useEffect(() => {
    loadAdvisors();
  }, []);

  const loadAdvisors = async () => {
    try {
      const response = await api.get('/users/advisors');
      setAdvisors(response.data.advisors);
    } catch (error) {
      console.error('Failed to load advisors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (editingAdvisor) {
        await api.put(`/users/advisors/${editingAdvisor._id}`, form);
        setMessage('Advisor updated successfully!');
      } else {
        await api.post('/users/advisors', form);
        setMessage('Advisor created successfully!');
      }
      
      setShowForm(false);
      setEditingAdvisor(null);
      resetForm();
      loadAdvisors();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save advisor');
    }
  };

  const handleEdit = (advisor) => {
    setEditingAdvisor(advisor);
    setForm({
      name: advisor.name,
      email: advisor.email,
      password: '',
      specializations: advisor.specializations || [],
      isAvailable: advisor.isAvailable,
      maxConcurrentBookings: advisor.maxConcurrentBookings || 1
    });
    setShowForm(true);
  };

  const handleDelete = async (advisorId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4fffb0',
      cancelButtonColor: '#3fa7ff',
      confirmButtonText: 'Yes, delete it!',
      background: '#0f1724',
      color: '#dbeafe'
    });
    
    if (result.isConfirmed) {
      try {
        await api.delete(`/users/advisors/${advisorId}`);
        setMessage('Advisor deleted successfully!');
        loadAdvisors();
      } catch (error) {
        setMessage(error.response?.data?.message || 'Failed to delete advisor');
      }
    }
  };

  const toggleAvailability = async (advisorId, currentStatus) => {
    try {
      await api.patch(`/users/advisors/${advisorId}/availability`, {
        isAvailable: !currentStatus
      });
      setMessage('Advisor availability updated!');
      loadAdvisors();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update availability');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      specializations: [],
      isAvailable: true,
      maxConcurrentBookings: 1
    });
  };

  const toggleSpecialization = (spec) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading advisors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold section-title">Advisor Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add New Advisor
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingAdvisor ? 'Edit Advisor' : 'Add New Advisor'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                required
              />
            </div>
            
            {!editingAdvisor && (
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                required
              />
            )}
            
            <div>
              <label className="label">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {specializations.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                      form.specializations.includes(spec)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-transparent text-muted border-white/20 hover:border-primary/40'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Max Concurrent Bookings</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.maxConcurrentBookings}
                  onChange={(e) => setForm({...form, maxConcurrentBookings: parseInt(e.target.value)})}
                  className="input"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({...form, isAvailable: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isAvailable">Available for bookings</label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingAdvisor ? 'Update Advisor' : 'Create Advisor'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAdvisor(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {advisors.map(advisor => (
          <div key={advisor._id} className="glass-panel p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-1">{advisor.name}</h3>
                <p className="text-muted mb-2">{advisor.email}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {advisor.specializations?.map(spec => (
                    <span key={spec} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg">
                      {spec}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted">
                  Max bookings: {advisor.maxConcurrentBookings} • 
                  Status: <span className={advisor.isAvailable ? 'text-green-400' : 'text-red-400'}>
                    {advisor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(advisor)}
                  className="btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleAvailability(advisor._id, advisor.isAvailable)}
                  className={`btn px-3 py-1 text-sm ${
                    advisor.isAvailable 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {advisor.isAvailable ? 'Set Unavailable' : 'Set Available'}
                </button>
                <button
                  onClick={() => handleDelete(advisor._id)}
                  className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {advisors.length === 0 && (
          <div className="text-center py-8 text-muted">
            No advisors found.
          </div>
        )}
      </div>
    </div>
  );
}
