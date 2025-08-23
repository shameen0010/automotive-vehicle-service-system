import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // Install jwt-decode
import Navbar from './components/Shared/Navbar';
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Profile/Profile';
import BookingForm from './components/Booking/BookingForm';
import BookingList from './components/Booking/BookingList';
import Dashboard from './pages/Dashboard';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer } from 'react-toastify';

const App = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }
  }, []);

  return (
    <Router>
      {role && <Navbar role={role} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book" element={<BookingForm />} />
        <Route path="/bookings" element={<BookingList />} />
        <Route path="/dashboard" element={<Dashboard role={role} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
};

export default App;