import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Navbar = ({ role }) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await api.post('/users/logout');
      localStorage.removeItem('token');
      toast.success('Logged out');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="bg-elite-dark-gray p-4 flex justify-between">
      <Link to="/" className="text-elite-white text-xl">Auto Elite</Link>
      <div>
        <Link to="/profile" className="text-elite-accent mx-2">Profile</Link>
        {role === 'customer' && <Link to="/bookings" className="text-elite-accent mx-2">Bookings</Link>}
        {role === 'admin' && <Link to="/dashboard" className="text-elite-accent mx-2">Admin Dashboard</Link>}
        <button onClick={handleLogout} className="text-elite-accent mx-2">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;