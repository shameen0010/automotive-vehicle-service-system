import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import React from 'react';

export default function RoleGuard({ roles, children }){
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-lg text-gray-600">
        Loading...
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return roles.includes(user.role) ? children : <Navigate to="/" replace />;
}
