import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";

// Step 1: extend form state to include new supplier schema fields (keeps legacy fields for current UI)
const empty = { 
  // legacy/simple fields currently used by the UI
  name: "", 
  email: "", 
  phone: "", 
  address: "", 
  contactPerson: "", 
  notes: "",

  // new schema (will be wired in later steps)
  companyName: "",
  displayName: "",
  businessRegistrationNo: "",
  website: "",
  primaryContact: {
    fullName: "",
    position: "",
    email: "",
    phone: "",
    mobile: ""
  },
  addresses: [
    {
      type: "HEAD_OFFICE",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }
  ],
  paymentTerms: "",
  currency: "",
  bankDetails: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    branch: ""
  },
  suppliedCategories: [],
  leadTimeDays: 0,
  isActive: true
};

// Validation rules (expanded to include new schema inputs incrementally)
const validationRules = {
  // legacy fields still rendered in UI
  name: { required: true, minLength: 2, maxLength: 100, pattern: /^[a-zA-Z0-9\s\-_.&]+$/, message: "Name must be 2-100 characters, alphanumeric with spaces, hyphens, underscores, dots, or ampersands" },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email address" },
  phone: { pattern: /^[+]?[1-9][\d]{0,15}$/, message: "Please enter a valid phone number" },
  contactPerson: { maxLength: 100, pattern: /^[a-zA-Z\s-]+$/, message: "Contact person name must contain only letters, spaces, hyphens, or dots" },
  address: { maxLength: 200, message: "Address must be less than 200 characters" },
  notes: { maxLength: 500, message: "Notes must be less than 500 characters" },

  // new schema fields to be surfaced in later steps
  companyName: { minLength: 2, maxLength: 120 },
  businessRegistrationNo: { minLength: 2, maxLength: 60 },
  "primaryContact.email": { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  leadTimeDays: { pattern: /^\d+$/ }
};

export default function SupplierFormPage() {
  const { id } = useParams();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [emailExists, setEmailExists] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
    const { data } = await api.get(`/api/suppliers/${id}`);
    // Step 2 (load): map server -> UI form shape, while preserving new schema fields in state
    const mapped = {
      // legacy/simple fields for current UI
      name: data.companyName || data.displayName || "",
      email: data.primaryContact?.email || "",
      phone: data.primaryContact?.phone || "",
      contactPerson: data.primaryContact?.fullName || "",
      address: Array.isArray(data.addresses) && data.addresses[0]
        ? [
            data.addresses[0].line1,
            data.addresses[0].line2,
            data.addresses[0].city,
            data.addresses[0].country,
          ].filter(Boolean).join(", ")
        : "",
      notes: data.notes || "",

      // new schema fields kept in state so we don't lose them
      companyName: data.companyName || "",
      displayName: data.displayName || "",
      businessRegistrationNo: data.businessRegistrationNo || "",
      website: data.website || "",
      primaryContact: {
        fullName: data.primaryContact?.fullName || "",
        position: data.primaryContact?.position || "",
        email: data.primaryContact?.email || "",
        phone: data.primaryContact?.phone || "",
        mobile: data.primaryContact?.mobile || "",
      },
      addresses: Array.isArray(data.addresses) && data.addresses.length > 0
        ? data.addresses
        : empty.addresses,
      paymentTerms: data.paymentTerms || "",
      currency: data.currency || "",
      bankDetails: {
        bankName: data.bankDetails?.bankName || "",
        accountName: data.bankDetails?.accountName || "",
        accountNumber: data.bankDetails?.accountNumber || "",
        branch: data.bankDetails?.branch || "",
      },
      suppliedCategories: Array.isArray(data.suppliedCategories) ? data.suppliedCategories : [],
      leadTimeDays: typeof data.leadTimeDays === 'number' ? data.leadTimeDays : 0,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    };
    setForm(mapped);
    } catch (err) {
      console.error('Failed to load supplier:', err);
      setErrors({ submit: "Failed to load supplier data" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [id, load]);

  // Removed categories fetch as Supplied Categories section is no longer used

  // Step 4: address helpers
  const addAddress = () => {
    setForm(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { type: 'HEAD_OFFICE', line1: '', line2: '', city: '', state: '', postalCode: '', country: '' }]
    }));
  };

  const removeAddress = (index) => {
    setForm(prev => ({
      ...prev,
      addresses: (prev.addresses || []).filter((_, i) => i !== index)
    }));
  };

  const updateAddressField = (index, field, value) => {
    setForm(prev => {
      const next = { ...prev, addresses: [...(prev.addresses || [])] };
      next.addresses[index] = { ...(next.addresses[index] || {}), [field]: value };
      return next;
    });
  };

  // Real-time validation
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return "";

    // Required validation
    if (rules.required && (!value || value.toString().trim() === "")) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
    }

    // Skip other validations if empty and not required
    if (!value || value.toString().trim() === "") return "";

    // Min length validation
    if (rules.minLength && value.toString().length < rules.minLength) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be less than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return rules.message || `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} format is invalid`;
    }

    return "";
  };

  // Check if email already exists (for new suppliers)
  const checkEmailExists = async (email) => {
    if (!email || id) return; // Skip if editing or no email
    try {
      const { data } = await api.get(`/api/suppliers?email=${email}`);
      setEmailExists(data.items && data.items.length > 0);
    } catch (err) {
      console.error('Failed to check email:', err);
    }
  };

  const setFormPathValue = (path, value) => {
    const segments = path.split('.');
    setForm(prev => {
      const clone = { ...prev };
      let cursor = clone;
      for (let i = 0; i < segments.length - 1; i += 1) {
        const key = segments[i];
        cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] || {}) };
        cursor = cursor[key];
      }
      cursor[segments[segments.length - 1]] = value;
      return clone;
    });
  };

  const onChange = (e) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? e.target.checked : e.target.value;
    
    // Clear previous errors
    setErrors((prev) => ({ ...prev, [name]: null }));
    setEmailExists(false);
    
    // Update form (supports dot-notation for nested fields)
    if (name.includes('.')) {
      setFormPathValue(name, value);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }

    // Real-time validation
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Check email existence (legacy email field)
    if (name === "email") {
      const timeoutId = setTimeout(() => checkEmailExists(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate on blur
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Legacy fields are no longer required for the updated supplier form UI
    // Validate only new schema plus optional notes
    const legacyToSkip = ['name','email','phone','contactPerson','address'];
    ['notes'].forEach((fieldName) => {
      const value = form[fieldName];
      const error = validateField(fieldName, value);
      if (error) { newErrors[fieldName] = error; isValid = false; }
    });

    // 2) Validate new required fields (per spec)
    const requiredFlat = [
      'companyName',
      'businessRegistrationNo',
      'paymentTerms',
      'currency'
    ];
    requiredFlat.forEach((fieldName) => {
      const value = form[fieldName];
      if (!value || String(value).trim() === '') {
        newErrors[fieldName] = `${fieldName.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())} is required`;
        isValid = false;
      } else {
        const error = validateField(fieldName, value);
        if (error) { newErrors[fieldName] = error; isValid = false; }
      }
    });

    // 3) Primary contact required
    const pc = form.primaryContact || {};
    const pcRequired = [
      ['primaryContact.fullName', pc.fullName],
      ['primaryContact.email', pc.email],
      ['primaryContact.phone', pc.phone]
    ];
    pcRequired.forEach(([key, value]) => {
      if (!value || String(value).trim() === '') {
        newErrors[key] = `${key.split('.').slice(-1)[0].replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())} is required`;
        isValid = false;
      } else {
        const err = validateField(key, value);
        if (err) { newErrors[key] = err; isValid = false; }
      }
    });

    // 4) Lead time number >= 0
    if (form.leadTimeDays === '' || form.leadTimeDays === null || typeof form.leadTimeDays === 'undefined') {
      newErrors.leadTimeDays = 'Lead time days is required';
      isValid = false;
    } else if (!/^\d+$/.test(String(form.leadTimeDays)) || Number(form.leadTimeDays) < 0) {
      newErrors.leadTimeDays = 'Lead time days must be a non-negative integer';
      isValid = false;
    }

    // 5) At least one address line1 (head office)
    const firstAddr = Array.isArray(form.addresses) && form.addresses[0] ? form.addresses[0] : {};
    if (!firstAddr.line1 || String(firstAddr.line1).trim() === '') {
      newErrors['addresses.0.line1'] = 'Address line 1 is required';
      isValid = false;
    }
    if (!firstAddr.city || String(firstAddr.city).trim() === '') {
      newErrors['addresses.0.city'] = 'City is required';
      isValid = false;
    }
    if (!firstAddr.country || String(firstAddr.country).trim() === '') {
      newErrors['addresses.0.country'] = 'Country is required';
      isValid = false;
    }

    // Supplied categories validation removed from form

    // Skip legacy email existence check; primaryContact.email is validated above

    setErrors(newErrors);
    return isValid;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrors({ submit: "Please fix the validation errors above" });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      // Step 2 (save): map current UI fields -> server schema payload
      const payload = {
        companyName: form.companyName || form.name,
        displayName: form.displayName || form.name,
        businessRegistrationNo: form.businessRegistrationNo || "",
        website: form.website || "",
        primaryContact: {
          fullName: form.primaryContact?.fullName || form.contactPerson || "",
          position: form.primaryContact?.position || "",
          email: form.primaryContact?.email || form.email || "",
          phone: form.primaryContact?.phone || form.phone || "",
          mobile: form.primaryContact?.mobile || "",
        },
        addresses: (Array.isArray(form.addresses) && form.addresses.length > 0)
          ? form.addresses
          : [
              {
                type: "HEAD_OFFICE",
                line1: form.address || "",
                line2: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
              },
            ],
        paymentTerms: form.paymentTerms || "",
        currency: form.currency || "",
        bankDetails: {
          bankName: form.bankDetails?.bankName || "",
          accountName: form.bankDetails?.accountName || "",
          accountNumber: form.bankDetails?.accountNumber || "",
          branch: form.bankDetails?.branch || "",
        },
        // suppliedCategories removed from form UI; omit from payload
        leadTimeDays: Number(form.leadTimeDays) || 0,
        isActive: typeof form.isActive === 'boolean' ? form.isActive : true,
        notes: form.notes || "",
      };

      if (id) {
        await api.put(`/api/suppliers/${id}`, payload);
      } else {
        await api.post("/api/suppliers", payload);
      }
      navigate("/suppliers");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save supplier";
      setErrors({ submit: errorMessage });
      
      // Handle specific server-side validation errors
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          serverErrors[error.field] = error.message;
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const hasError = errors[fieldName];
    const isTouched = touched[fieldName];
    
    return {
      width: '100%',
      padding: '0.75rem',
      border: hasError ? '2px solid #dc2626' : isTouched ? '2px solid #3b82f6' : '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease-in-out',
      backgroundColor: hasError ? '#fef2f2' : 'white',
      outline: 'none'
    };
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName] && touched[fieldName] ? errors[fieldName] : null;
  };

  if (loading && id) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ color: '#6b7280' }}>Loading supplier data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      padding: '2rem',
      backgroundColor: '#f8fafc',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>{id ? "Edit Supplier" : "Add New Supplier"}</h1>
          <button
            type="button"
            onClick={() => navigate("/suppliers")}
            style={{
              background: 'transparent',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Suppliers
          </button>
        </div>

        {errors.submit && (
          <div style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            {errors.submit}
          </div>
        )}

        <form style={{ display: 'grid', gap: '1.5rem' }} onSubmit={submit}>
          {/* Basic Information Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏢 Basic Company Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Company Name
                </label>
                <input 
                  style={getInputStyle('companyName')}
                  name="companyName" 
                  placeholder="e.g., Colombo Auto Parts Distributors" 
                  value={form.companyName || ""} 
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('companyName') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('companyName')}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Display Name
                </label>
                <input 
                  style={getInputStyle('displayName')}
                  name="displayName" 
                  placeholder="e.g., Colombo Auto" 
                  value={form.displayName || ""} 
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('displayName') && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {getFieldError('displayName')}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business Registration No.
                </label>
                <input 
                  style={getInputStyle('businessRegistrationNo')}
                  name="businessRegistrationNo" 
                  placeholder="e.g., PV123456789" 
                  value={form.businessRegistrationNo || ""} 
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Website
                </label>
                <input 
                  style={getInputStyle('website')}
                  name="website" 
                  placeholder="e.g., https://www.colomboauto.lk" 
                  value={form.website || ""} 
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>
            </div>
          </div>

          {/* Primary Contact Information Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📞 Primary Contact Information
            </h2>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Full Name
                </label>
                <input
                  style={getInputStyle('primaryContact.fullName')}
                  name="primaryContact.fullName"
                  placeholder="e.g., Jane Perera"
                  value={form.primaryContact?.fullName || ""}
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('primaryContact.fullName') && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⚠️</span>
                    {getFieldError('primaryContact.fullName')}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Position
                </label>
                <input
                  style={getInputStyle('primaryContact.position')}
                  name="primaryContact.position"
                  placeholder="e.g., Procurement Manager"
                  value={form.primaryContact?.position || ""}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Email
                </label>
                <input
                  style={getInputStyle('primaryContact.email')}
                  name="primaryContact.email"
                  placeholder="e.g., jane@colomboauto.lk"
                  value={form.primaryContact?.email || ""}
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('primaryContact.email') && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⚠️</span>
                    {getFieldError('primaryContact.email')}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Phone
                </label>
                <input
                  style={getInputStyle('primaryContact.phone')}
                  name="primaryContact.phone"
                  placeholder="e.g., +94 77 123 4567"
                  value={form.primaryContact?.phone || ""}
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('primaryContact.phone') && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⚠️</span>
                    {getFieldError('primaryContact.phone')}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Mobile (optional)
                </label>
                <input
                  style={getInputStyle('primaryContact.mobile')}
                  name="primaryContact.mobile"
                  placeholder="e.g., +94 71 234 5678"
                  value={form.primaryContact?.mobile || ""}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>
            </div>
          </div>

          {/* Address Section (structured) */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📍 Address Information
            </h2>
            
            {(form.addresses || []).map((addr, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                background: 'white'
              }}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Type</label>
                    <select
                      name={`addresses.${index}.type`}
                      value={addr.type || 'HEAD_OFFICE'}
                      onChange={(e)=>updateAddressField(index,'type', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                    >
                      <option value="HEAD_OFFICE">HEAD_OFFICE</option>
                      <option value="WAREHOUSE">WAREHOUSE</option>
                      <option value="BILLING">BILLING</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Line 1</label>
                    <input
                      style={getInputStyle(`addresses.${index}.line1`)}
                      name={`addresses.${index}.line1`}
                      placeholder="Street address line 1"
                      value={addr.line1 || ''}
                      onChange={(e)=>updateAddressField(index,'line1', e.target.value)}
                      onBlur={onBlur}
                    />
                    {getFieldError(`addresses.${index}.line1`) && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>⚠️</span>
                        {getFieldError(`addresses.${index}.line1`)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Line 2</label>
                    <input
                      style={getInputStyle(`addresses.${index}.line2`)}
                      name={`addresses.${index}.line2`}
                      placeholder="Street address line 2 (optional)"
                      value={addr.line2 || ''}
                      onChange={(e)=>updateAddressField(index,'line2', e.target.value)}
                      onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>City</label>
                    <input
                      style={getInputStyle(`addresses.${index}.city`)}
                      name={`addresses.${index}.city`}
                      placeholder="City"
                      value={addr.city || ''}
                      onChange={(e)=>updateAddressField(index,'city', e.target.value)}
                      onBlur={onBlur}
                    />
                    {getFieldError(`addresses.${index}.city`) && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>⚠️</span>
                        {getFieldError(`addresses.${index}.city`)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>State/Province</label>
                    <input
                      style={getInputStyle(`addresses.${index}.state`)}
                      name={`addresses.${index}.state`}
                      placeholder="State/Province"
                      value={addr.state || ''}
                      onChange={(e)=>updateAddressField(index,'state', e.target.value)}
                      onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Postal Code</label>
                    <input
                      style={getInputStyle(`addresses.${index}.postalCode`)}
                      name={`addresses.${index}.postalCode`}
                      placeholder="Postal code"
                      value={addr.postalCode || ''}
                      onChange={(e)=>updateAddressField(index,'postalCode', e.target.value)}
                      onBlur={onBlur}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Country</label>
                    <input
                      style={getInputStyle(`addresses.${index}.country`)}
                      name={`addresses.${index}.country`}
                      placeholder="Country"
                      value={addr.country || ''}
                      onChange={(e)=>updateAddressField(index,'country', e.target.value)}
                      onBlur={onBlur}
                    />
                    {getFieldError(`addresses.${index}.country`) && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>⚠️</span>
                        {getFieldError(`addresses.${index}.country`)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {index > 0 && (
                      <button type="button" onClick={() => removeAddress(index)} style={{
                        background: 'transparent', border: '1px solid #d1d5db', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer'
                      }}>Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addAddress} style={{
              background: 'transparent', border: '1px dashed #d1d5db', color: '#374151', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer'
            }}>+ Add Address</button>
          </div>

          {/* Financial & Terms Section */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💳 Financial & Terms
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Payment Terms</label>
                <select
                  name="paymentTerms"
                  value={form.paymentTerms || ''}
                  onChange={onChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                >
                  <option value="">Select terms</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="50% Advance">50% Advance</option>
                </select>
                {getFieldError('paymentTerms') && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⚠️</span>
                    {getFieldError('paymentTerms')}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Currency</label>
                <select
                  name="currency"
                  value={form.currency || ''}
                  onChange={onChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                >
                  <option value="">Select currency</option>
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                </select>
                {getFieldError('currency') && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⚠️</span>
                    {getFieldError('currency')}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Bank Details (optional)</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <input style={getInputStyle('bankDetails.bankName')} name="bankDetails.bankName" placeholder="Bank Name" value={form.bankDetails?.bankName || ''} onChange={onChange} onBlur={onBlur} />
                  <input style={getInputStyle('bankDetails.accountName')} name="bankDetails.accountName" placeholder="Account Name" value={form.bankDetails?.accountName || ''} onChange={onChange} onBlur={onBlur} />
                  <input style={getInputStyle('bankDetails.accountNumber')} name="bankDetails.accountNumber" placeholder="Account Number" value={form.bankDetails?.accountNumber || ''} onChange={onChange} onBlur={onBlur} />
                  <input style={getInputStyle('bankDetails.branch')} name="bankDetails.branch" placeholder="Branch" value={form.bankDetails?.branch || ''} onChange={onChange} onBlur={onBlur} />
                </div>
              </div>
            </div>
          </div>

          {/* Product & Operational Section */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ Product & Operational
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Lead Time (days)</label>
                <input
                  type="number"
                  min="0"
                  style={getInputStyle('leadTimeDays')}
                  name="leadTimeDays"
                  placeholder="e.g., 7"
                  value={form.leadTimeDays}
                  onChange={onChange}
                  onBlur={onBlur}
                />
                {getFieldError('leadTimeDays') && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⚠️</span>
                    {getFieldError('leadTimeDays')}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isActive" name="isActive" checked={!!form.isActive} onChange={onChange} />
                <label htmlFor="isActive" style={{ color: '#374151' }}>Active supplier</label>
              </div>
            </div>
          </div>

          {/* Supplied Categories section removed */}

          {/* Notes Section */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📝 Additional Notes
            </h2>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Notes
              </label>
              <textarea 
                style={{
                  ...getInputStyle('notes'),
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                name="notes" 
                placeholder="Enter any additional notes about this supplier (optional)" 
                value={form.notes || ""} 
                onChange={onChange}
                onBlur={onBlur}
              />
              {getFieldError('notes') && (
                <div style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>⚠️</span>
                  {getFieldError('notes')}
                </div>
              )}
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem',
                textAlign: 'right'
              }}>
                {form.notes.length}/500 characters
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginTop: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button 
              disabled={loading} 
              style={{
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '120px',
                justifyContent: 'center'
              }}
              type="submit"
              aria-label={loading ? "Saving..." : "Save supplier"}
            >
              {loading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  {id ? "Update Supplier" : "Save Supplier"}
                </>
              )}
            </button>
            <button 
              style={{
                background: 'transparent',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              type="button" 
              onClick={() => navigate("/suppliers")}
              aria-label="Cancel"
            >
              <span>❌</span>
              Cancel
            </button>
        </div>
      </form>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          input[style*="border: 2px solid #dc2626"]:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
