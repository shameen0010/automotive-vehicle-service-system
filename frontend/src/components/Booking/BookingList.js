import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const res = await api.get('/bookings');
      setBookings(res.data);
    };
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.put(`/bookings/${id}`, { action: 'cancel' });
      setBookings(bookings.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert('Cancel failed');
    }
  };

  return (
    <div className="min-h-screen bg-black-main p-8">
      <div className="bg-gray-light p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-dark mb-4">My Bookings</h2>
        <ul>
          {bookings.map(booking => (
            <li key={booking._id} className="mb-4 p-4 bg-white-main rounded shadow">
              <p className="text-gray-dark">Service: {booking.serviceType}</p>
              <p>Date: {new Date(booking.date).toLocaleDateString()}</p>
              <p>Time: {booking.time}</p>
              <p>Status: <span className={booking.status === 'confirmed' ? 'text-blue-gray' : booking.status === 'cancelled' ? 'text-error-red' : 'text-gray-dark'}>{booking.status}</span></p>
              {booking.status !== 'cancelled' && <button onClick={() => handleCancel(booking._id)} className="bg-error-red text-white-main py-1 px-2 rounded mt-2">Cancel</button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BookingList;