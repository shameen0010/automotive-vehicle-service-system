import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Profile = () => {
  const [user, setUser] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await api.get('/users/profile'); // Add getProfile endpoint if needed
      setUser(res.data);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', user);
      alert('Profile updated');
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-black-main p-8">
      <div className="bg-gray-light p-8 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-dark mb-4">My Profile</h2>
        <form onSubmit={handleUpdate}>
          <input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} placeholder="Name" className="w-full p-2 mb-4 border border-blue-gray rounded" />
          <input value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} placeholder="Email" className="w-full p-2 mb-4 border border-blue-gray rounded" />
          <button type="submit" className="w-full bg-blue-gray text-white-main py-2 rounded hover:bg-gray-dark">Update</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;