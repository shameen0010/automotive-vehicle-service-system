import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login.';
import Register from './components/Register.';
import Dashboard from './components/Dashboard.';
import BookAppointment from './components/BookAppointment';
import MyAppointments from './components/MyAppointments';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/book" element={<BookAppointment />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/" element={<h1>Welcome! <a href="/login">Login</a></h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;