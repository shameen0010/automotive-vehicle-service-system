import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [history, setHistory] = useState({ visitCount: 0, appointments: [], nextServiceDate: null });
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const profileRes = await axios.get('http://localhost:5000/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
        setName(profileRes.data.name);
        setMobileNumber(profileRes.data.mobileNumber);
        setImage(profileRes.data.image);

        const historyRes = await axios.get('http://localhost:5000/api/users/history', { headers: { Authorization: `Bearer ${token}` } });
        setHistory(historyRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put('http://localhost:5000/api/users/profile', { name, mobileNumber, image }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Profile updated');
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <h3>Edit Profile</h3>
      <form onSubmit={handleUpdate}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Mobile Number" required />
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL" />
        <button type="submit">Update</button>
      </form>

      <h3>Service History</h3>
      <p>Visits: {history.visitCount}</p>
      <p>Next Service: {history.nextServiceDate || 'No history yet'}</p>
      <ul>
        {history.appointments.map((appt) => (
          <li key={appt._id}>
            {appt.serviceType} on {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;