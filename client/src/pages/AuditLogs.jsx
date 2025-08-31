import { useEffect, useState } from 'react';
import api from '../api/client';
import React from 'react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/audit-logs');
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (action) => {
    switch (action) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'profile_update': return '👤';
      case 'avatar_update': return '🖼️';
      case 'booking_create': return '📅';
      case 'booking_cancel': return '❌';
      case 'booking_complete': return '✅';
      case 'user_role_change': return '👑';
      case 'staff_availability_update': return '👷';
      default: return '📝';
    }
  };

  const getEventTypeColor = (action) => {
    switch (action) {
      case 'login': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'logout': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'profile_update': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'avatar_update': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'booking_create': return 'bg-accent/20 text-accent border-accent/30';
      case 'booking_cancel': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'booking_complete': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'user_role_change': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'staff_availability_update': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getEventTypeDescription = (action) => {
    switch (action) {
      case 'login': return 'User logged into the system';
      case 'logout': return 'User logged out of the system';
      case 'profile_update': return 'User updated their profile information';
      case 'avatar_update': return 'User changed their profile picture';
      case 'booking_create': return 'New service booking was created';
      case 'booking_cancel': return 'Service booking was cancelled';
      case 'booking_complete': return 'Service was marked as completed';
      case 'user_role_change': return 'User role was modified';
      case 'staff_availability_update': return 'Staff availability status was updated';
      default: return 'System action performed';
    }
  };

  const formatMetaData = (action, meta) => {
    if (!meta || Object.keys(meta).length === 0) return null;

    switch (action) {
      case 'profile_update':
        return (
          <div className="space-y-2">
            {meta.name && <div className="flex items-center gap-2"><span className="text-accent">👤</span> <span className="text-sm">Name updated to: <strong>{meta.name}</strong></span></div>}
            {meta.phone && <div className="flex items-center gap-2"><span className="text-accent">📞</span> <span className="text-sm">Phone updated to: <strong>{meta.phone}</strong></span></div>}
            {meta.email && <div className="flex items-center gap-2"><span className="text-accent">📧</span> <span className="text-sm">Email updated to: <strong>{meta.email}</strong></span></div>}
          </div>
        );
      
      case 'avatar_update':
        return (
          <div className="flex items-center gap-2">
            <span className="text-accent">🖼️</span>
            <span className="text-sm">Profile picture was updated</span>
          </div>
        );
      
      case 'booking_create':
        return (
          <div className="space-y-2">
            {meta.serviceType && <div className="flex items-center gap-2"><span className="text-accent">🔧</span> <span className="text-sm">Service: <strong>{meta.serviceType}</strong></span></div>}
            {meta.date && <div className="flex items-center gap-2"><span className="text-accent">📅</span> <span className="text-sm">Date: <strong>{meta.date}</strong></span></div>}
            {meta.timeSlot && <div className="flex items-center gap-2"><span className="text-accent">⏰</span> <span className="text-sm">Time: <strong>{meta.timeSlot}</strong></span></div>}
          </div>
        );
      
      case 'booking_cancel':
        return (
          <div className="space-y-2">
            {meta.wasQueued && <div className="flex items-center gap-2"><span className="text-accent">⏳</span> <span className="text-sm">Was in queue: <strong>{meta.wasQueued ? 'Yes' : 'No'}</strong></span></div>}
            {meta.bookingCount && <div className="flex items-center gap-2"><span className="text-accent">📊</span> <span className="text-sm">Total bookings: <strong>{meta.bookingCount}</strong></span></div>}
            {meta.isLoyaltyEligible && <div className="flex items-center gap-2"><span className="text-accent">⭐</span> <span className="text-sm">Loyalty eligible: <strong>{meta.isLoyaltyEligible ? 'Yes' : 'No'}</strong></span></div>}
          </div>
        );
      
      case 'user_role_change':
        return (
          <div className="flex items-center gap-2">
            <span className="text-accent">👑</span>
            <span className="text-sm">Role changed to: <strong>{meta.role}</strong></span>
          </div>
        );
      
      case 'staff_availability_update':
        return (
          <div className="flex items-center gap-2">
            <span className="text-accent">👷</span>
            <span className="text-sm">Staff member <strong>{meta.name}</strong> is now <strong>{meta.isAvailable ? 'Available' : 'Unavailable'}</strong></span>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-muted">
            <details className="cursor-pointer">
              <summary className="hover:text-slate-200 transition-colors">View technical details</summary>
              <pre className="mt-2 p-2 bg-white/5 rounded text-xs font-mono overflow-x-auto">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </details>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.action === filter;
  });

  if (loading) {
    return (
      <div className="card p-8">
        <div className="text-center py-8">
          <div className="text-muted">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">System Activity Log</h1>
      
      {/* Filters */}
      <div className="mb-6">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="all">All Activities</option>
          <option value="login">🔐 Logins</option>
          <option value="logout">🚪 Logouts</option>
          <option value="profile_update">👤 Profile Updates</option>
          <option value="avatar_update">🖼️ Avatar Changes</option>
          <option value="booking_create">📅 New Bookings</option>
          <option value="booking_cancel">❌ Cancellations</option>
          <option value="booking_complete">✅ Completed Services</option>
          <option value="user_role_change">👑 Role Changes</option>
          <option value="staff_availability_update">👷 Staff Updates</option>
        </select>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {filteredLogs.map(log => (
          <div key={log._id} className="glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-200">
            <div className="flex items-start gap-4">
              {/* Icon and Action Type */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getEventTypeColor(log.action)}`}>
                  {getEventTypeIcon(log.action)}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(log.action)}`}>
                    {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-sm text-muted">
                    {log.actor ? 'User Action' : 'System Action'}
                  </span>
                </div>
                
                <p className="text-slate-200 mb-3">
                  {getEventTypeDescription(log.action)}
                </p>
                
                {/* Formatted Metadata */}
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    {formatMetaData(log.action, log.meta)}
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm text-muted mb-1">
                  {formatTimestamp(log.createdAt)}
                </div>
                <div className="text-xs text-muted">
                  {log.actor ? 'User ID: ' + log.actor : 'System'}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-muted">
            <div className="text-4xl mb-2">📝</div>
            <div>No activity logs found matching your criteria.</div>
            <div className="text-sm mt-1">Try selecting a different filter or check back later.</div>
          </div>
        )}
      </div>
    </div>
  );
}
