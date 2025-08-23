import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Profile/Profile';
import BookingForm from './components/Booking/BookingForm';
import BookingList from './components/Booking/BookingList';
// Add reset password page similar to login

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book" element={<BookingForm />} />
        <Route path="/bookings" element={<BookingList />} />
        {/* Add more, e.g., /reset */}
      </Routes>
    </Router>
  );
};

export default App;