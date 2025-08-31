import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import React from 'react';

export default function ProtectedRoute({ children }){
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-lg text-gray-600">
        Loading...
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
}
