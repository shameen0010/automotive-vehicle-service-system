import React, { useState } from 'react';
import api from '../../services/api';

const BookingForm = () => {
  const [formData, setFormData] = useState({ date: '', time: '', serviceType: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bookings', formData);
      alert('Booking created');
    } catch (err) {
      alert('Booking failed');
    }
  };

  return (
    <div className="min-h-screen bg-black-main flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-light p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-gray-dark mb-4">Book Appointment</h2>
        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-2 mb-4 border border-blue-gray rounded" required />
        <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full p-2 mb-4 border border-blue-gray rounded" required />
        <select value={formData.serviceType} onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })} className="w-full p-2 mb-4 border border-blue-gray rounded" required>
          <option value="">Select Service</option>
          <option value="Oil Change">Oil Change</option>
          <option value="Tire Rotation">Tire Rotation</option>
          {/* Add more */}
        </select>
        <button type="submit" className="w-full bg-blue-gray text-white-main py-2 rounded hover:bg-gray-dark">Book</button>
      </form>
    </div>
  );
};

export default BookingForm;