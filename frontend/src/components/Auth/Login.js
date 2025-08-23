import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/login', { email, password });
      localStorage.setItem('token', res.data.token);
      toast.success('Logged in!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-elite-black">
      <form onSubmit={handleSubmit} className="card w-96">
        <h2 className="text-2xl mb-4 text-elite-white">Login to Auto Elite</h2>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input mb-4 w-full" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="input mb-4 w-full" />
        <button type="submit" className="button w-full">Login</button>
      </form>
    </div>
  );
};

export default Login;