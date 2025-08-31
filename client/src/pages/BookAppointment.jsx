import { useState, useEffect } from 'react';
import api from '../api/client';
import Input from '../components/Input';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import Swal from 'sweetalert2';

const TIME_SLOTS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
];

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function BookAppointment(){
  const nav = useNavigate();
  const [form,setForm] = useState({
    serviceType:'General Service',
    vehicle:{ make:'', model:'', year:'', plate:'' },
    date:'', timeSlot:'', notes:''
  });
  const [err,setErr] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const changeVehicle = (k,v)=>setForm({...form, vehicle:{...form.vehicle, [k]:v}});

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!form.date) { 
      setBookedSlots([]); 
      setAvailableSlots([]);
      return; 
    }
    api.get(`/bookings/booked-slots?date=${form.date}`)
      .then(res => setBookedSlots(res.data.slots))
      .catch(() => setBookedSlots([]));
    
    // Also fetch available slots for queue information
    api.get(`/bookings/available-slots?date=${form.date}`)
      .then(res => setAvailableSlots(res.data.availableSlots))
      .catch(() => setAvailableSlots([]));
  }, [form.date]);

  // Update selected slot info when time slot changes
  useEffect(() => {
    if (form.timeSlot && availableSlots.length > 0) {
      const slotInfo = availableSlots.find(slot => slot.timeSlot === form.timeSlot);
      setSelectedSlotInfo(slotInfo);
    } else {
      setSelectedSlotInfo(null);
    }
  }, [form.timeSlot, availableSlots]);

  // Validate form data
  const validateForm = () => {
    const errors = [];
    
    if (!form.serviceType) errors.push('Service type is required');
    if (!form.date) errors.push('Date is required');
    if (!form.timeSlot) errors.push('Time slot is required');
    if (!form.vehicle.make?.trim()) errors.push('Vehicle make is required');
    if (!form.vehicle.model?.trim()) errors.push('Vehicle model is required');
    if (!form.vehicle.year) errors.push('Vehicle year is required');
    if (!form.vehicle.plate?.trim()) errors.push('Vehicle plate is required');
    
    // Validate year range
    const year = parseInt(form.vehicle.year);
    if (isNaN(year) || year < 1980 || year > 2100) {
      errors.push('Vehicle year must be between 1980 and 2100');
    }
    
    // Validate date format
    if (form.date && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      errors.push('Invalid date format');
    }
    
    return errors;
  };

  const submit = async (e)=>{
    e.preventDefault();
    setErr('');
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErr(validationErrors.join(', '));
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', form);
      setBookingSuccess(data.booking);
      setForm({
        serviceType:'General Service',
        vehicle:{ make:'', model:'', year:'', plate:'' },
        date:'', timeSlot:'', notes:''
      });
      setBookedSlots([]);
      setAvailableSlots([]);
      setSelectedSlotInfo(null);
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const generateReport = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/report`);
      const report = response.data.report;
      
      // Create a formatted report text
      const reportText = `
AUTOMOTIVE SERVICE MANAGEMENT SYSTEM
====================================
BOOKING REPORT
====================================

Booking ID: ${report.bookingId}
Report Generated: ${new Date(report.reportGeneratedAt).toLocaleString()}

CUSTOMER INFORMATION:
--------------------
Name: ${report.customer.name}
Email: ${report.customer.email}
Phone: ${report.customer.phone}

SERVICE DETAILS:
----------------
Service Type: ${report.service.type}
Date: ${report.service.date}
Time Slot: ${report.service.timeSlot}
Status: ${report.service.status}
Estimated Duration: ${report.service.estimatedDuration} minutes

VEHICLE INFORMATION:
--------------------
Make: ${report.vehicle.make}
Model: ${report.vehicle.model}
Year: ${report.vehicle.year}
License Plate: ${report.vehicle.plate}

ADVISOR INFORMATION:
--------------------
${report.advisor ? `Name: ${report.advisor.name}
Email: ${report.advisor.email}
Phone: ${report.advisor.phone}` : 'Not assigned yet'}

TIMELINE:
---------
Booked At: ${new Date(report.timeline.bookedAt).toLocaleString()}
Can Modify Until: ${report.timeline.canModifyUntil ? new Date(report.timeline.canModifyUntil).toLocaleString() : 'N/A'}
${report.timeline.serviceStartTime ? `Service Start: ${new Date(report.timeline.serviceStartTime).toLocaleString()}` : ''}
${report.timeline.serviceEndTime ? `Service End: ${new Date(report.timeline.serviceEndTime).toLocaleString()}` : ''}
${report.timeline.queuePosition ? `Queue Position: #${report.timeline.queuePosition}` : ''}
${report.timeline.queueStartTime ? `Queue Start: ${new Date(report.timeline.queueStartTime).toLocaleString()}` : ''}
${report.timeline.estimatedServiceTime ? `Estimated Service: ${new Date(report.timeline.estimatedServiceTime).toLocaleString()}` : ''}

NOTES:
------
${report.notes || 'No additional notes'}

====================================
End of Report
====================================
      `;

      // Create and download the report as a text file
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-report-${report.bookingId}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Report generated and downloaded successfully!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate report',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const generatePDFReport = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/report/pdf`, { 
        responseType: 'blob' 
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auto-elite-booking-report-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'PDF report generated and downloaded successfully!',
        confirmButtonColor: '#4fffb0',
        background: '#0f1724',
        color: '#dbeafe'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate PDF report',
        confirmButtonColor: '#3fa7ff',
        background: '#0f1724',
        color: '#dbeafe'
      });
    }
  };

  const getSlotStatus = (slot) => {
    if (slot.isAvailable) {
      if (slot.advisorsAvailable <= 5) {
        return { text: `Limited Availability (${slot.advisorsAvailable} advisors left)`, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      }
      return { text: `Available (${slot.advisorsAvailable} advisors)`, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    } else {
      if (slot.queueLength > 0) {
        return { text: `All Advisors Busy - Queue: ${slot.queueLength}`, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      }
      return { text: 'All Advisors Busy', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Book Appointment</h1>
      
      {/* System Info */}
      <div className="mb-8 glass-panel p-6">
        <h2 className="text-lg font-medium mb-4">Service Center Information</h2>
        <ul className="text-base text-muted space-y-1">
          <li>• We have 30 service advisors available</li>
          <li>• Each advisor handles one appointment at a time</li>
          <li>• Advisors are automatically assigned based on service type and specializations</li>
          <li>• If a time slot shows "All Advisors Busy", you can join the queue</li>
          <li>• Queue system automatically assigns appointments when advisors become available</li>
          <li>• System prioritizes advisors with matching specializations for better service</li>
        </ul>
      </div>
      
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-6 mb-8">
        <label className="label">Service Type
          <select className="input mt-1" value={form.serviceType} onChange={e=>setForm({...form,serviceType:e.target.value})} required>
            {['General Service','Oil Change','Diagnostics','Body Work'].map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="label">Date
          <input type="date" className="input mt-1" value={form.date} onChange={e=>setForm({...form,date:e.target.value, timeSlot:''})} required min={todayStr()} />
        </label>
        <label className="label">Time Slot
          <select className="input mt-1" value={form.timeSlot} onChange={e=>setForm({...form,timeSlot:e.target.value})} required disabled={!form.date}>
            <option value="">Select a time slot</option>
            {TIME_SLOTS.map(slot => {
              const slotInfo = availableSlots.find(s => s.timeSlot === slot);
              const status = slotInfo ? getSlotStatus(slotInfo) : { text: 'Loading...', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
              
              return (
                <option key={slot} value={slot} disabled={false}>
                  {slot} - {status.text}
                </option>
              );
            })}
          </select>
        </label>
        
        {/* Slot Information Display */}
        {selectedSlotInfo && (
          <div className="md:col-span-2 glass-panel p-6 border border-primary/40">
            <h3 className="font-medium mb-2 text-slate-100">Slot Information: {selectedSlotInfo.timeSlot}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-200">Status:</span>
                <span className={`ml-2 font-semibold ${getSlotStatus(selectedSlotInfo).color}`}>
                  {getSlotStatus(selectedSlotInfo).text}
                </span>
              </div>
              <div className="text-right">
                <span className="font-medium text-slate-200">Advisors Available:</span>
                <span className="ml-2 text-slate-100">{selectedSlotInfo.advisorsAvailable}/{selectedSlotInfo.totalAdvisors}</span>
              </div>
              {selectedSlotInfo.queueLength > 0 && (
                <>
                  <div>
                    <span className="font-medium text-slate-200">Queue Length:</span>
                    <span className="ml-2 text-orange-400">{selectedSlotInfo.queueLength} people</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-200">Estimated Wait:</span>
                    <span className="ml-2 text-orange-400">{selectedSlotInfo.queueLength * 60} minutes</span>
                  </div>
                </>
              )}
            </div>
            {!selectedSlotInfo.isAvailable && (
              <div className="mt-3 p-3 bg-orange-900/30 rounded border border-orange-400/40">
                <p className="text-sm text-orange-300">
                  <strong>Note:</strong> This time slot is currently full, but you can join the queue. 
                  When an advisor becomes available, you'll be automatically assigned and notified.
                </p>
              </div>
            )}
          </div>
        )}
        
        <Input label="Make" value={form.vehicle.make} onChange={e=>changeVehicle('make', e.target.value)} required />
        <Input label="Model" value={form.vehicle.model} onChange={e=>changeVehicle('model', e.target.value)} required />
        <Input label="Year" type="number" value={form.vehicle.year} onChange={e=>changeVehicle('year', e.target.value)} required min="1980" max="2100" />
        <Input label="Plate" value={form.vehicle.plate} onChange={e=>changeVehicle('plate', e.target.value)} required />
        <label className="md:col-span-2 label">Notes
          <textarea className="input mt-1" rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        </label>
        {err && <p className="text-red-600 md:col-span-2 mb-4">{err}</p>}
        <button className="btn md:col-span-2 mt-2 bg-gradient-to-r from-primary to-accent2 text-slate-900 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-accent2 hover:to-primary" disabled={submitting}>
          {submitting ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>

      {/* Success Message with Report Generation */}
      {bookingSuccess && (
        <div className="mt-6 glass-panel p-8 border border-green-400/40">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-300">Booking Created Successfully!</h3>
              <p className="text-sm text-green-200">
                Your appointment has been scheduled. {bookingSuccess.isQueued ? 
                  `You are currently in queue position #${bookingSuccess.queuePosition}.` : 
                  'An advisor has been assigned to your appointment.'
                }
              </p>
            </div>
          </div>
          <div className="glass-panel p-6 border border-green-400/30 mb-6">
            <h4 className="font-medium text-green-200 mb-2">Booking Details:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-100">
              <div>
                <span className="font-medium">Service:</span> {bookingSuccess.serviceType}
              </div>
              <div>
                <span className="font-medium">Date:</span> {bookingSuccess.date}
              </div>
              <div>
                <span className="font-medium">Time:</span> {bookingSuccess.timeSlot}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  bookingSuccess.status === 'Queued' ? 'bg-purple-600/30 text-purple-200' : 'bg-blue-600/30 text-blue-200'
                }`}>
                  {bookingSuccess.status}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Vehicle:</span> {bookingSuccess.vehicle.make} {bookingSuccess.vehicle.model} ({bookingSuccess.vehicle.plate})
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => generateReport(bookingSuccess._id)}
              className="btn bg-gradient-to-r from-primary to-accent2 text-slate-900 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-accent2 hover:to-primary"
            >
              📄 Text Report
            </button>
            <button
              onClick={() => generatePDFReport(bookingSuccess._id)}
              className="btn bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-red-400 hover:to-red-500"
            >
              📋 PDF Report
            </button>
            <button
              onClick={() => setBookingSuccess(null)}
              className="btn bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}