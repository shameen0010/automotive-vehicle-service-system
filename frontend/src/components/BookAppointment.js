import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookAppointment = () => {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('http://localhost:5000/api/users/profile', { headers: { Authorization: `Bearer ${token}` } });
          setName(res.data.name);
          setMobileNumber(res.data.mobileNumber);
          setEmail(res.data.email);
          setVehicleNumber(res.data.vehicleNumber);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleDateChange = async (e) => {
    setDate(e.target.value);
    const token = localStorage.getItem('token');
    if (e.target.value && token) {
      try {
        const res = await axios.get(`http://localhost:5000/api/appointments/slots/${e.target.value}`, { headers: { Authorization: `Bearer ${token}` } });
        setAvailableSlots(res.data);
      } catch (err) {
        alert('Error fetching slots');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Please login');

    try {
      await axios.post('http://localhost:5000/api/appointments', {
        name, mobileNumber, email, vehicleType, vehicleNumber, serviceType, date, timeSlot
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Appointment booked!');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
      <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Mobile Number" required />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Vehicle Type" required />
      <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle Number" required />
      <input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Service Type" required />
      <input type="date" value={date} onChange={handleDateChange} required />
      <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required>
        <option value="">Select Slot</option>
        {availableSlots.map((slot, i) => <option key={i} value={slot}>{slot}</option>)}
      </select>
      <button type="submit">Book</button>
    </form>
  );
};

export default BookAppointment;