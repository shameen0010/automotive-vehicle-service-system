import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Fetch current profile (add getProfile API if needed; for now assume update fetches)
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', { name, email });
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="card m-8">
      <h2 className="text-2xl mb-4 text-elite-white">Update Profile</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="input mb-4 w-full" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input mb-4 w-full" />
        <button type="submit" className="button">Save</button>
      </form>
    </div>
  );
};

export default Profile;