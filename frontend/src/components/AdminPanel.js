import React, { useEffect, useState } from 'react';
import { getPending, approveUser } from '../services/api';

const AdminPanel = () => {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    getPending().then(res => setPending(res.data));
  }, []);

  const handleApprove = async (userId) => {
    await approveUser(userId);
    alert('Approved');
    // Refresh list
    getPending().then(res => setPending(res.data));
  };

  return (
    <div>
      <h2>Admin Panel - Pending Approvals</h2>
      <ul>
        {pending.map(user => (
          <li key={user._id}>
            {user.email} - {user.role}
            <button onClick={() => handleApprove(user._id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;