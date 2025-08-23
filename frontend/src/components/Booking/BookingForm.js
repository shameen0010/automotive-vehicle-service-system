import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const BookingForm = () => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [serviceType, setServiceType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bookings', { date, time, serviceType });
      toast.success('Booking created');
    } catch (err) {
      toast.error(err.response.data.msg || 'Failed');
    }
  };

  return (
    <div className="card m-8">
      <h2 className="text-2xl mb-4 text-elite-white">Book Appointment</h2>
      <form onSubmit={handleSubmit}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input mb-4 w-full" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input mb-4 w-full" />
        <input type="text" value={serviceType} onChange={e => setServiceType(e.target.value)} placeholder="Service Type (e.g., Oil Change)" className="input mb-4 w-full" />
        <button type="submit" className="button">Book</button>
      </form>
    </div>
  );
};

export default BookingForm;