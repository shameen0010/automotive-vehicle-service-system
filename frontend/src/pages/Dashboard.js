import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BookingList from '../components/Booking/BookingList';

const Dashboard = ({ role }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (role === 'admin') {
      const fetchLogs = async () => {
        const res = await api.get('/users/logs');
        setLogs(res.data);
      };
      fetchLogs();
    }
  }, [role]);

  return (
    <div className="m-8">
      <h2 className="text-2xl mb-4 text-elite-white">Dashboard</h2>
      {role === 'customer' && <BookingList />}
      {role === 'admin' && (
        <div>
          <h3 className="text-xl mb-2">Activity Logs</h3>
          <ul>
            {logs.map(log => (
              <li key={log._id} className="card mb-2 p-2">
                {log.userId.name} ({log.action}) at {log.timestamp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;