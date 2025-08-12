import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, deleteProfile } from '../services/api';

const Dashboard = () => {
  const [profile, setProfile] = useState({});

  useEffect(() => {
    getProfile().then(res => setProfile(res.data));
  }, []);

  const handleUpdate = async () => {
    // Assume form inputs; for simplicity, hardcode or expand
    await updateProfile({ name: 'Updated Name' }); // Replace with form
    alert('Updated');
  };

  const handleDelete = async () => {
    await deleteProfile();
    alert('Deleted');
    localStorage.removeItem('token');
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Name: {profile.name}</p>
      {/* Add edit form here */}
      <button onClick={handleUpdate}>Update Profile</button>
      <button onClick={handleDelete}>Delete Profile</button>
    </div>
  );
};

export default Dashboard;