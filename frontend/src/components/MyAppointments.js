import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get('http://localhost:5000/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <ul>
      {appointments.map((appt) => (
        <li key={appt._id}>
          {appt.serviceType} on {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot} - Status: {appt.status} - Advisor: {appt.advisorId?.name || 'N/A'}
        </li>
      ))}
    </ul>
  );
};

export default MyAppointments;