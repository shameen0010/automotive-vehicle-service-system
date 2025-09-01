import { useEffect, useState } from 'react';
import api from '../api/client';
import Input from '../components/Input';
import { useAuth } from '../store/auth';
import React from 'react';

const BACKEND_URL = "http://localhost:5000";

export default function Profile(){
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestingDiscount, setRequestingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState('');

  useEffect(()=>{ setName(user?.name||''); setPhone(user?.phone||''); }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await api.put('/users/me', { name, phone });
    setUser(data.user);
    setSaving(false);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const form = new FormData();
    form.append('avatar', file);
    setUploading(true);
    try{
      const { data } = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }});
      setUser(data.user);
    } finally { setUploading(false); }
  };

  const requestLoyaltyDiscount = async () => {
    setRequestingDiscount(true);
    setDiscountMessage('');
    try {
      const { data } = await api.post('/users/loyalty-discount-request');
      setDiscountMessage(data.message);
      // Refresh user data to update loyalty status
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data.user);
    } catch (error) {
      setDiscountMessage(error.response?.data?.message || 'Failed to request discount');
    } finally {
      setRequestingDiscount(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-6 section-title">My Profile</h1>
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <img
          src={user?.avatarUrl ? `${BACKEND_URL}${user.avatarUrl}` : 'https://via.placeholder.com/96?text=AE'}
          alt="avatar"
          className="w-24 h-24 rounded-2xl object-cover border"
        />
        <label className="btn cursor-pointer mt-4 sm:mt-0">
          {uploading ? 'Uploading...' : 'Change Photo'}
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
      </div>
      {/* Loyalty Status Section */}
      <div className="mb-8 glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4">Loyalty Status</h2>
        <div className="space-y-2 text-base">
          <p><strong>Total Bookings:</strong> {user?.bookingCount || 0}</p>
          <p><strong>Loyalty Eligible:</strong> {user?.isLoyaltyEligible ? '\u2705 Yes' : '\u274c No'}</p>
          {user?.isLoyaltyEligible && (
            <p><strong>Discount Requested:</strong> {user?.loyaltyDiscountRequested ? '\u2705 Yes' : '\u274c No'}</p>
          )}
          {user?.loyaltyDiscountRequested && (
            <p><strong>Request Date:</strong> {new Date(user.loyaltyDiscountRequestDate).toLocaleDateString()}</p>
          )}
          {user?.loyaltyDiscountApproved !== undefined && (
            <p><strong>Approved:</strong> {user?.loyaltyDiscountApproved ? '\u2705 Yes' : '\u274c No'}</p>
          )}
        </div>
        {user?.isLoyaltyEligible && !user?.loyaltyDiscountRequested && (
          <button 
            onClick={requestLoyaltyDiscount}
            disabled={requestingDiscount}
            className="btn bg-gradient-to-r from-primary to-accent2 text-slate-900 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-accent2 hover:to-primary mt-6 w-full"
          >
            {requestingDiscount ? 'Sending Request...' : 'Request Loyalty Discount'}
          </button>
        )}
        
        {discountMessage && (
          <p className={`mt-2 text-sm ${discountMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
            {discountMessage}
          </p>
        )}
      </div>

      <form onSubmit={save}>
        <Input label="Name" value={name} onChange={e=>setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} />
        <Input label="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button className="btn bg-gradient-to-r from-primary to-accent2 text-slate-900 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:from-accent2 hover:to-primary mt-4" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
