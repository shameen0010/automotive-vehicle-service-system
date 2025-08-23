import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: send OTP, 2: verify & change

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/reset-password', { email });
      toast.success('OTP sent');
      setStep(2);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/change-password', { email, otp, newPassword });
      toast.success('Password changed');
    } catch (err) {
      toast.error('Invalid OTP');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-elite-black">
      <form onSubmit={step === 1 ? handleSendOtp : handleChange} className="card w-96">
        <h2 className="text-2xl mb-4 text-elite-white">Reset Password</h2>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input mb-4 w-full" />
        {step === 2 && (
          <>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="OTP" className="input mb-4 w-full" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="input mb-4 w-full" />
          </>
        )}
        <button type="submit" className="button w-full">{step === 1 ? 'Send OTP' : 'Change Password'}</button>
      </form>
    </div>
  );
};

export default ResetPassword;