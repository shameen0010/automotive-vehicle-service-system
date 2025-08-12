import React, { useState } from 'react';
import { register } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'external', name: '', phone: '', address: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      alert('Registered. Managers need admin approval.');
    } catch (err) {
      alert('Error: ' + err.response.data.msg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
      <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" />
      <select name="role" value={formData.role} onChange={handleChange}>
        <option value="external">External User</option>
        <option value="staff_manager">Staff Manager</option>
        <option value="inventory_manager">Inventory Manager</option>
        <option value="advisor_manager">Advisor Manager</option>
        <option value="finance_manager">Finance Manager</option>
      </select>
      <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
      <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;