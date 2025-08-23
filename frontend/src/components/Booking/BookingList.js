import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

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
      await api.put(`/bookings/${id}`, { status: 'cancelled' });
      setBookings(bookings.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Cancelled');
    } catch (err) {
      toast.error('Failed');
    }
  };

  return (
    <div className="m-8">
      <h2 className="text-2xl mb-4 text-elite-white">My Bookings</h2>
      <ul>
        {bookings.map(booking => (
          <li key={booking._id} className="card mb-4">
            <p>Date: {booking.date}</p>
            <p>Time: {booking.time}</p>
            <p>Service: {booking.serviceType}</p>
            <p>Status: {booking.status}</p>
            {booking.status !== 'cancelled' && <button onClick={() => handleCancel(booking._id)} className="button mt-2">Cancel</button>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingList;