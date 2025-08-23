import React, { useState } from 'react';
import { login } from '../../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/profile'; // Or use navigate
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-black-main flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-light p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-gray-dark mb-4">Login to Auto Elite</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-4 border border-blue-gray rounded" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 mb-4 border border-blue-gray rounded" required />
        <button type="submit" className="w-full bg-blue-gray text-white-main py-2 rounded hover:bg-gray-dark">Login</button>
        <a href="/reset" className="text-error-red mt-2 block">Forgot Password?</a>
      </form>
    </div>
  );
};

export default Login;