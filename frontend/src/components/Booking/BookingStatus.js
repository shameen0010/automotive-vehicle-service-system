import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const BookingStatus = () => {
  const { id } = useParams(); // Get booking ID from URL
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`); // Assumes endpoint for single booking
        setBooking(res.data);
      } catch (err) {
        alert('Failed to fetch booking details');
      }
    };
    fetchBooking();
  }, [id]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-black-main flex items-center justify-center">
        <p className="text-white-main">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-main p-8">
      <div className="bg-gray-light p-8 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-dark mb-4">Booking Details</h2>
        <div className="p-4 bg-white-main rounded shadow">
          <p className="text-gray-dark mb-2">
            <strong>Service:</strong> {booking.serviceType}
          </p>
          <p className="text-gray-dark mb-2">
            <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
          </p>
          <p className="text-gray-dark mb-2">
            <strong>Time:</strong> {booking.time}
          </p>
          <p className="text-gray-dark mb-2">
            <strong>Status:</strong>{' '}
            <span
              className={
                booking.status === 'confirmed'
                  ? 'text-blue-gray'
                  : booking.status === 'cancelled'
                  ? 'text-error-red'
                  : 'text-gray-dark'
              }
            >
              {booking.status}
            </span>
          </p>
          {booking.advisorId && (
            <p className="text-gray-dark">
              <strong>Advisor:</strong> {booking.advisorId.name || 'Assigned'}
            </p>
          )}
        </div>
        <a
          href="/bookings"
          className="mt-4 inline-block bg-blue-gray text-white-main py-2 px-4 rounded hover:bg-gray-dark"
        >
          Back to Bookings
        </a>
      </div>
    </div>
  );
};

export default BookingStatus;