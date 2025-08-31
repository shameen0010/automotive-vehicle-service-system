import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../components/Input';
import api from '../api/client';
import React from 'react';

export default function VerifyOTP() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // First verify the OTP
      const response = await api.post('/auth/verify-otp', { email, otp });

      if (response.data.valid) {
        setMessage('OTP verified successfully! Redirecting to password reset...');
        setTimeout(() => {
          nav(`/reset-password?email=${encodeURIComponent(email)}&token=${response.data.token}`);
        }, 1500);
      }
    } catch (e) {
      console.error('OTP verification error:', e);
      if (e.response) {
        console.error('Response status:', e.response.status);
        console.error('Response data:', e.response.data);
        setError(e.response.data?.message || `Server error (${e.response.status})`);
      } else if (e.request) {
        console.error('No response received:', e.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error('Request setup error:', e.message);
        setError('Error verifying OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/auth/request-reset', { email });
      setMessage('New OTP sent to your email!');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Verify OTP</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Email:</strong> {email}
        </p>
        <p className="text-sm text-blue-600 mt-2">
          We've sent a 6-digit OTP to your email. Please enter it below to continue.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6">
        <Input
          label="Enter 6-digit OTP"
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength="6"
          required
          className="text-center text-2xl tracking-widest"
        />

        {error && <p className="text-red-600 mb-2 text-center">{error}</p>}
        {message && <p className="text-green-600 mb-2 text-center">{message}</p>}

        <button
          className="btn btn-primary mt-2"
          disabled={loading || otp.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Didn't receive the OTP?</p>
        <button
          onClick={resendOTP}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
        >
          Resend OTP
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => nav('/forgot-password')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Forgot Password
        </button>
      </div>
    </div>
  );
}
