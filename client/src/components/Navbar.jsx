import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import React, { useState } from 'react';

const BACKEND_URL = "http://localhost:5000";
const LOGO_URL = `${BACKEND_URL}/assets/WhatsApp%20Image%202025-08-23%20at%2008.36.41_4ac10a51.jpg`;
const LOCAL_LOGO_URL = '/logo.svg';

export default function Navbar(){
  const { user, logout } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const [useLocalLogo, setUseLocalLogo] = useState(false);

  const handleLogoError = () => {
    if (!useLocalLogo) {
      setUseLocalLogo(true);
    } else {
      setLogoError(true);
    }
  };

  return (
    <header className="nav-bar shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          {!logoError ? (
            <img 
              src={useLocalLogo ? LOCAL_LOGO_URL : LOGO_URL} 
              alt="Auto Elite Logo" 
              className="w-10 h-10 rounded-xl shadow border-2 border-primary bg-slate-800 object-cover"
              onError={handleLogoError}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl shadow border-2 border-primary bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              AE
            </div>
          )}
          <span className="text-2xl font-bold gradient-text tracking-tight drop-shadow">Auto Elite</span>
        </Link>
        <nav className="flex gap-6 items-center">
          {user ? (
            <>
              {user.role === 'user' && (
                <>
                  <Link to="/book" className="btn-ghost">Book</Link>
                  <Link to="/bookings" className="btn-ghost">My Bookings</Link>
                  <Link to="/available-slots" className="btn-ghost">Available Slots</Link>
                  <Link to="/profile" className="btn-ghost">Profile</Link>
                </>
              )}
              {(user.role === 'manager' || user.role === 'admin') && <Link to="/advisor-management" className="btn-ghost">Advisors</Link>}
              {(user.role === 'manager' || user.role === 'admin' || user.role === 'advisor') && <Link to="/bookings-management" className="btn-ghost">Bookings</Link>}
              {user.role === 'admin' && <Link to="/admin-dashboard" className="btn-ghost">Admin Dashboard</Link>}
              {user.role === 'finance_manager' && <Link to="/finance-dashboard" className="btn-ghost">Finance Dashboard</Link>}
              {user.role === 'inventory_manager' && <Link to="/inventory-dashboard" className="btn-ghost">Inventory Dashboard</Link>}
              {user.role === 'staff_manager' && <Link to="/staff-dashboard" className="btn-ghost">Staff Dashboard</Link>}
              {(user.role === 'manager' || user.role === 'admin') && <Link to="/audit-logs" className="btn-ghost">Audit</Link>}
              <div className="flex items-center gap-3 px-3 py-1 rounded-xl bg-glass border border-white/10 backdrop-blur-md shadow-inner">
                <img
                  src={user.avatarUrl ? `${BACKEND_URL}${user.avatarUrl}` : 'https://via.placeholder.com/40?text=U'}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover border-2 border-primary shadow"
                />
                <span className="font-semibold text-slate-100 text-sm">{user.name}</span>
              </div>
              <button onClick={logout} className="btn-primary ml-2">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
