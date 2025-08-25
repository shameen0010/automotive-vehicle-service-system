import React from 'react';
import { useAuth } from '../store/auth';
import { Link } from 'react-router-dom';

export default function Dashboard(){
  const { user } = useAuth();
  return (
    <div className="max-w-2xl mx-auto grid gap-8">
      <div className="card p-8">
        <h2 className="text-2xl font-semibold section-title mb-4">Welcome {user ? user.name : 'to Auto Elite'} 👋</h2>
        <p className="text-muted mb-4">Book your automotive service and manage your profile.</p>
        {user ? <Link className="btn btn-primary mt-2 w-fit" to="/book">Book Appointment</Link> : null}
      </div>
    </div>
  );
}
