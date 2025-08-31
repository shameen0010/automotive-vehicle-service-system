import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import { useAuth } from '../store/auth';
import api from '../api/client';
import React from 'react';

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email:'', password:'' });
  const [err,setErr] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    setErr('');
    try{
      const response = await api.post('/auth/login', form);
      login(response.data.user); // Backend sets cookies, so we don't need to store token manually
      nav('/');
    }catch(e){ setErr(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Login</h1>
      <form onSubmit={submit} className="grid gap-6">
        <Input label="Email" type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required />
        <Input label="Password" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required />
        {err && <p className="text-red-600 mb-2">{err}</p>}
        <button className="btn btn-primary mt-2">Login</button>
      </form>
      <p className="text-sm mt-4">No account? <Link to="/register" className="text-blue-600">Register</Link></p>
    </div>
  );
}
