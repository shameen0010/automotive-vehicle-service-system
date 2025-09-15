import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../components/Input';
import api from '../api/client';
import React from 'react';

export default function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if no verification token
  React.useEffect(() => {
    if (!token) {
      nav('/forgot-password');
    }
  }, [token, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    try {
      const requestData = { email: email.toLowerCase(), token, newPassword };
      console.log('Reset password request:', requestData);
      const response = await api.post('/auth/reset-password', requestData);
      console.log('Reset password response:', response.data);
      setMessage('Password reset successfully! You can now login with your new password.');
      setTimeout(() => nav('/login'), 2000);
    } catch (e) {
      console.error('Reset password error:', e);
      if (e.response) {
        console.error('Response status:', e.response.status);
        console.error('Response data:', e.response.data);
        setError(e.response.data?.message || `Server error (${e.response.status})`);
      } else if (e.request) {
        console.error('No response received:', e.request);
        setError('Network error. Please check your connection and try again.');
      } else {
        console.error('Request setup error:', e.message);
        setError('Error sending request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-semibold mb-6 section-title">Reset Password</h1>
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>✓ OTP Verified!</strong> Please set your new password below.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6">
        <Input
          label="Email"
          type="email"
          value={email}
          readOnly
        />
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter your new password"
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
          required
        />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        {message && <p className="text-green-600 mb-2">{message}</p>}
        <button className="btn btn-primary mt-2" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
