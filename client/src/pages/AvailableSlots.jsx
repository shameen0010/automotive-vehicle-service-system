import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../store/auth';
import React from 'react';

export default function AvailableSlots(){
  const { user, loading } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(today);
  }, []);

  // Load available slots when date changes (only if user is authenticated)
  useEffect(() => {
    if (selectedDate && user) {
      loadAvailableSlots();
    } else if (!user && !loading) {
      // Clear slots when user logs out
      setAvailableSlots([]);
    }
  }, [selectedDate, user, loading]);

  const loadAvailableSlots = async () => {
    if (!user) return; // Don't load if not authenticated
    
    setLoadingSlots(true);
    try {
      const { data } = await api.get(`/bookings/available-slots?date=${selectedDate}`);
      setAvailableSlots(data.availableSlots);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadQueueInfo = async (timeSlot) => {
    if (!user || !selectedDate) return;
    
    setLoadingQueue(true);
    try {
      const { data } = await api.get(`/bookings/queue-info?date=${selectedDate}&timeSlot=${timeSlot}`);
      setQueueInfo(data);
    } catch (error) {
      console.error('Failed to load queue info:', error);
      setQueueInfo(null);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.queueLength > 0) {
      setSelectedSlot(slot);
      loadQueueInfo(slot.timeSlot);
    }
  };

  const getStatusColor = (isAvailable, advisorsAvailable, queueLength) => {
    if (!isAvailable && queueLength > 0) return 'bg-orange-100 text-orange-800';
    if (!isAvailable) return 'bg-red-100 text-red-800';
    if (advisorsAvailable <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isAvailable, advisorsAvailable, queueLength) => {
    if (!isAvailable && queueLength > 0) return `Queue Available (${queueLength} people)`;
    if (!isAvailable) return 'All Advisors Busy';
    if (advisorsAvailable <= 5) return `Limited Availability (${advisorsAvailable} left)`;
    return `Available (${advisorsAvailable} advisors)`;
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Available Service Slots</h1>
      
      {/* Date Selector */}
      <div className="mb-8 glass-panel p-6">
        <label className="label mb-2">Select Date</label>
        <div className="relative w-full max-w-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="input w-full pl-12 pr-4 py-2 rounded-xl bg-glass border border-white/10 shadow focus:border-primary/70 focus:ring-2 focus:ring-primary/30 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6.75v13.5c0 .414.336.75.75.75z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loadingSlots && (
        <div className="text-center py-8">
          <div className="text-muted">Loading available slots...</div>
        </div>
      )}

      {/* Available Slots Grid */}
      {!loadingSlots && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableSlots.map((slot, index) => (
            <div
              key={index}
              className={`relative p-4 rounded-2xl border border-white/10 bg-glass shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer group hover:scale-[1.03] hover:shadow-2xl hover:border-primary/60 hover:ring-2 hover:ring-primary/30`}
              onClick={() => handleSlotClick(slot)}
            >
              <div className="text-center">
                {/* Time Slot */}
                <h3 className="font-semibold text-lg mb-2 gradient-text drop-shadow">{slot.timeSlot}</h3>
                {/* Status Badge (other statuses) */}
                {!(slot.isAvailable) && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${getStatusColor(slot.isAvailable, slot.advisorsAvailable, slot.queueLength)} group-hover:ring-2 group-hover:ring-accent2/60`}> 
                    {getStatusText(slot.isAvailable, slot.advisorsAvailable, slot.queueLength)}
                  </span>
                )}
                {/* Advisors Info */}
                <div className="mt-2 text-sm text-muted">
                  <p><strong>Advisors:</strong> {slot.advisorsAvailable}/{slot.totalAdvisors}</p>
                  {slot.advisorsAssigned > 0 && (
                    <p className="text-xs mt-1">
                      {slot.advisorsAssigned} advisor{slot.advisorsAssigned > 1 ? 's' : ''} assigned
                    </p>
                  )}
                  {slot.queueLength > 0 && (
                    <p className="text-xs mt-1 text-orange-600">
                      {slot.queueLength} in queue
                    </p>
                  )}
                </div>
                {/* Status Badge at bottom */}
                {(slot.isAvailable && slot.advisorsAvailable > 5) && (
                  <div className="flex justify-center mt-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white font-semibold shadow-sm text-sm whitespace-nowrap">
                      ✅ Ready for booking
                    </span>
                  </div>
                )}
                {(slot.isAvailable && slot.advisorsAvailable <= 5) && (
                  <div className="flex justify-center mt-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-300 text-yellow-900 font-semibold shadow-sm text-sm whitespace-nowrap">
                      ⚠️ Limited availability ({slot.advisorsAvailable} left)
                    </span>
                  </div>
                )}
                {!slot.isAvailable && slot.queueLength > 0 && (
                  <div className="mt-2 text-sm text-accent">
                    <p>📋 Join queue</p>
                  </div>
                )}
                {!slot.isAvailable && slot.queueLength === 0 && (
                  <div className="mt-2 text-sm text-red-400">
                    <p>❌ All advisors busy</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Queue Information Modal */}
      {selectedSlot && queueInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold section-title">Queue Information: {selectedSlot.timeSlot}</h3>
              <button 
                onClick={() => {
                  setSelectedSlot(null);
                  setQueueInfo(null);
                }}
                className="text-muted hover:text-slate-100 text-2xl"
              >
                ×
              </button>
            </div>
            
            {loadingQueue ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading queue information...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">Queue Length:</span>
                    <span className="ml-2 text-orange-600">{queueInfo.queueLength} people</span>
                  </div>
                  <div>
                    <span className="font-medium">Advisors Available:</span>
                    <span className="ml-2">{queueInfo.advisorsAvailable}/{queueInfo.totalAdvisors}</span>
                  </div>
                  <div>
                    <span className="font-medium">Estimated Wait:</span>
                    <span className="ml-2 text-orange-600">{queueInfo.estimatedWaitTime} minutes</span>
                  </div>
                  <div>
                    <span className="font-medium">Next Available:</span>
                    <span className="ml-2 text-orange-600">{queueInfo.nextAvailableTime}</span>
                  </div>
                </div>
                
                {queueInfo.queuedBookings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Current Queue:</h4>
                    <div className="space-y-2">
                      {queueInfo.queuedBookings.map((booking, index) => (
                        <div key={booking.id} className="p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">#{booking.queuePosition} - {booking.userName}</p>
                              <p className="text-sm text-gray-600">{booking.serviceType} - {booking.vehicle.make} {booking.vehicle.model}</p>
                            </div>
                            <div className="text-right text-sm text-orange-600">
                              <p>Est: {new Date(booking.estimatedServiceTime).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> When you join the queue, you'll be automatically assigned 
                    an advisor as soon as one becomes available. The system processes the queue in order, 
                    so earlier bookings get priority.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      setQueueInfo(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      setQueueInfo(null);
                      // Navigate to booking page with pre-filled time slot
                      window.location.href = `/book-appointment?date=${selectedDate}&timeSlot=${selectedSlot.timeSlot}`;
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Join Queue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loadingSlots && availableSlots.length > 0 && (
        <div className="mt-8 glass-panel p-6">
          <h3 className="font-semibold mb-2">Summary for {selectedDate}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="font-medium">Available Slots:</span>
              <span className="ml-2 text-green-600">
                {availableSlots.filter(slot => slot.isAvailable).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Fully Booked:</span>
              <span className="ml-2 text-red-600">
                {availableSlots.filter(slot => !slot.isAvailable && slot.queueLength === 0).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Limited Availability:</span>
              <span className="ml-2 text-yellow-600">
                {availableSlots.filter(slot => slot.isAvailable && slot.advisorsAvailable <= 5).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Queue Available:</span>
              <span className="ml-2 text-orange-600">
                {availableSlots.filter(slot => !slot.isAvailable && slot.queueLength > 0).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Total Advisors:</span>
              <span className="ml-2 text-blue-600">30</span>
            </div>
          </div>
        </div>
      )}

      {/* No Slots Message */}
      {!loadingSlots && availableSlots.length === 0 && (
        <div className="text-center py-8 text-muted">
          No slots available for the selected date.
        </div>
      )}
    </div>
  );
}
