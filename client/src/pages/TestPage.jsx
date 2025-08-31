import { useState } from 'react';
import api from '../api/client';
import React from 'react';
import Swal from 'sweetalert2';

export default function TestPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestAdvisors = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await api.post('/users/create-test-advisors');
      setMessage(`✅ ${response.data.message}\nCreated ${response.data.advisors.length} advisors`);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Created ${response.data.advisors.length} test advisors successfully!`,
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message,
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } finally {
      setLoading(false);
    }
  };

  const createSpecializedAdvisors = async () => {
    setLoading(true);
    setMessage('');
    try {
      const specializedAdvisors = [
        {
          name: 'John Smith - General Service Expert',
          email: 'john.general@autoelite.com',
          password: 'password123',
          specializations: ['General Service'],
          isAvailable: true,
          maxConcurrentBookings: 1
        },
        {
          name: 'Sarah Johnson - Oil Change Specialist',
          email: 'sarah.oil@autoelite.com',
          password: 'password123',
          specializations: ['Oil Change'],
          isAvailable: true,
          maxConcurrentBookings: 1
        },
        {
          name: 'Mike Wilson - Diagnostics Expert',
          email: 'mike.diagnostics@autoelite.com',
          password: 'password123',
          specializations: ['Diagnostics'],
          isAvailable: true,
          maxConcurrentBookings: 1
        },
        {
          name: 'Lisa Brown - Body Work Specialist',
          email: 'lisa.bodywork@autoelite.com',
          password: 'password123',
          specializations: ['Body Work'],
          isAvailable: true,
          maxConcurrentBookings: 1
        },
        {
          name: 'David Lee - Multi-Service Expert',
          email: 'david.multiservice@autoelite.com',
          password: 'password123',
          specializations: ['General Service', 'Oil Change', 'Diagnostics'],
          isAvailable: true,
          maxConcurrentBookings: 2
        }
      ];

      for (const advisor of specializedAdvisors) {
        try {
          await api.post('/users/advisors', advisor);
        } catch (error) {
          console.error(`Failed to create ${advisor.name}:`, error);
        }
      }

      setMessage('✅ Specialized advisors created successfully!');
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Specialized advisors created successfully!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message,
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will delete ALL test data and cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4fffb0',
      cancelButtonColor: '#3fa7ff',
      confirmButtonText: 'Yes, clear all data!',
      background: '#0f1724',
      color: '#dbeafe'
    });
    
    if (result.isConfirmed) {
      setLoading(true);
      setMessage('');
      try {
        await api.delete('/test/clear-all');
        setMessage('✅ All test data cleared successfully!');
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'All test data cleared successfully!',
          confirmButtonColor: '#4fffb0',
          background: '#0f1724',
          color: '#dbeafe'
        });
      } catch (error) {
        setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message,
          confirmButtonColor: '#3fa7ff',
          background: '#0f1724',
          color: '#dbeafe'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Test Page</h1>
      <p className="text-muted mb-6">Use this page to create test data for development and testing purposes.</p>
      
      <div className="space-y-4">
        <button
          onClick={createTestAdvisors}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Creating...' : 'Create Test Advisors'}
        </button>
        
        <button
          onClick={createSpecializedAdvisors}
          disabled={loading}
          className="btn bg-accent hover:bg-accent/80 text-slate-900 w-full"
        >
          {loading ? 'Creating...' : 'Create Specialized Advisors'}
        </button>
        
        <button
          onClick={clearAllData}
          disabled={loading}
          className="btn bg-red-500 hover:bg-red-600 text-white w-full"
        >
          {loading ? 'Clearing...' : 'Clear All Test Data'}
        </button>
      </div>
      
      {message && (
        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <pre className="whitespace-pre-wrap text-sm">{message}</pre>
        </div>
      )}
    </div>
  );
}
