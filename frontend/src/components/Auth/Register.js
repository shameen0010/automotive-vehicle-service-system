import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/register', { name, email, password, role });
      toast.success('Registered!');
      navigate('/login');
    } catch (err) {
      toast.error('Registration failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-elite-black">
      <form onSubmit={handleSubmit} className="card w-96">
        <h2 className="text-2xl mb-4 text-elite-white">Register for Auto Elite</h2>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="input mb-4 w-full" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input mb-4 w-full" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="input mb-4 w-full" />
        <select value={role} onChange={e => setRole(e.target.value)} className="input mb-4 w-full">
          <option value="customer">Customer</option>
          {/* Other roles for testing; restrict in prod */}
        </select>
        <button type="submit" className="button w-full">Register</button>
      </form>
    </div>
  );
};

export default Register;