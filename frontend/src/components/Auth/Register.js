import React, { useState } from 'react';
import { register } from '../../services/authService';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default role

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      window.location.href = '/profile'; // Or use navigate
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-black-main flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-light p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-gray-dark mb-4">Register for Auto Elite</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full p-2 mb-4 border border-blue-gray rounded"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 mb-4 border border-blue-gray rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 mb-4 border border-blue-gray rounded"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 mb-4 border border-blue-gray rounded"
          required
        >
          <option value="customer">Customer</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="advisor">Advisor</option>
        </select>
        <button
          type="submit"
          className="w-full bg-blue-gray text-white-main py-2 rounded hover:bg-gray-dark"
        >
          Register
        </button>
        <a href="/login" className="text-blue-gray mt-2 block text-center">
          Already have an account? Login
        </a>
      </form>
    </div>
  );
};

export default Register;