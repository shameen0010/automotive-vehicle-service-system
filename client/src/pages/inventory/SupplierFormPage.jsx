import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "../../components/inventory/FormField";
import FormSection from "../../components/inventory/FormSection";
import ActionButtons from "../../components/inventory/ActionButtons";
import LoadingSpinner from "../../components/inventory/LoadingSpinner";
import ErrorAlert from "../../components/inventory/ErrorAlert";
import SuccessToast from "../../components/inventory/SuccessToast";

const empty = { 
  name: "", 
  email: "", 
  phone: "", 
  address: "", 
  contactPerson: "", 
  notes: "",
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

const validationRules = {
  name: { required: true, minLength: 2, maxLength: 100, pattern: /^[a-zA-Z0-9\s\-_.&]+$/, message: "Name must be 2-100 characters, alphanumeric with spaces, hyphens, underscores, dots, or ampersands" },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email address" },
  phone: { pattern: /^[+]?[1-9][\d]{0,15}$/, message: "Please enter a valid phone number" },
  contactPerson: { maxLength: 100, pattern: /^[a-zA-Z\s-]+$/, message: "Contact person name must contain only letters, spaces, hyphens, or dots" },
  address: { maxLength: 200, message: "Address must be less than 200 characters" },
  notes: { maxLength: 500, message: "Notes must be less than 500 characters" },
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
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
    const { data } = await api.get(`/api/suppliers/${id}`);
    const mapped = {
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

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return "";

    if (rules.required && (!value || value.toString().trim() === "")) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
    }

    if (!value || value.toString().trim() === "") return "";

    if (rules.minLength && value.toString().length < rules.minLength) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be less than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return rules.message || `${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} format is invalid`;
    }

    return "";
  };

  const checkEmailExists = async (email) => {
    if (!email || id) return;
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
    
    setErrors((prev) => ({ ...prev, [name]: null }));
    setEmailExists(false);
    
    if (name.includes('.')) {
      setFormPathValue(name, value);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }

    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === "email") {
      const timeoutId = setTimeout(() => checkEmailExists(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    ['notes'].forEach((fieldName) => {
      const value = form[fieldName];
      const error = validateField(fieldName, value);
      if (error) { newErrors[fieldName] = error; isValid = false; }
    });

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

    if (form.leadTimeDays === '' || form.leadTimeDays === null || typeof form.leadTimeDays === 'undefined') {
      newErrors.leadTimeDays = 'Lead time days is required';
      isValid = false;
    } else if (!/^\d+$/.test(String(form.leadTimeDays)) || Number(form.leadTimeDays) < 0) {
      newErrors.leadTimeDays = 'Lead time days must be a non-negative integer';
      isValid = false;
    }

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
        leadTimeDays: Number(form.leadTimeDays) || 0,
        isActive: typeof form.isActive === 'boolean' ? form.isActive : true,
        notes: form.notes || "",
      };

      if (id) {
        await api.put(`/api/suppliers/${id}`, payload);
        setToast("Supplier updated successfully!");
      } else {
        await api.post("/api/suppliers", payload);
        setToast("Supplier created successfully!");
      }
      
      setTimeout(() => navigate("/suppliers"), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save supplier";
      setErrors({ submit: errorMessage });
      
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

  if (loading && id) {
    return <LoadingSpinner message="Loading supplier data..." />;
  }

  return (
    <div className="bg-app min-h-screen">
      <div className="app-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title mb-2">
                {id ? "Edit Supplier" : "Add New Supplier"}
              </h1>
              <p className="text-slate-400">
                {id ? "Update supplier information and contact details" : "Create a new supplier profile"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/suppliers")}
              className="btn-secondary flex items-center gap-2"
            >
              <span>←</span>
              Back to Suppliers
            </button>
          </div>

          <ErrorAlert 
            message={errors.submit} 
            onDismiss={() => setErrors(prev => ({ ...prev, submit: null }))} 
          />

          <form onSubmit={submit} className="space-y-8">
            {/* Basic Company Information */}
            <FormSection title="Basic Company Information" icon="🏢">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Company Name"
                  name="companyName"
                  placeholder="e.g., Colombo Auto Parts Distributors"
                  value={form.companyName}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.companyName}
                  touched={touched.companyName}
                />

                <FormField
                  label="Display Name"
                  name="displayName"
                  placeholder="e.g., Colombo Auto"
                  value={form.displayName}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.displayName}
                  touched={touched.displayName}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Business Registration No."
                  name="businessRegistrationNo"
                  placeholder="e.g., PV123456789"
                  value={form.businessRegistrationNo}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.businessRegistrationNo}
                  touched={touched.businessRegistrationNo}
                />

                <FormField
                  label="Website"
                  name="website"
                  placeholder="e.g., https://www.colomboauto.lk"
                  value={form.website}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors.website}
                  touched={touched.website}
                />
              </div>
            </FormSection>

            {/* Primary Contact Information */}
            <FormSection title="Primary Contact Information" icon="📞">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  name="primaryContact.fullName"
                  placeholder="e.g., Jane Perera"
                  value={form.primaryContact?.fullName}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors['primaryContact.fullName']}
                  touched={touched['primaryContact.fullName']}
                />

                <FormField
                  label="Position"
                  name="primaryContact.position"
                  placeholder="e.g., Procurement Manager"
                  value={form.primaryContact?.position}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['primaryContact.position']}
                  touched={touched['primaryContact.position']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Email"
                  name="primaryContact.email"
                  type="email"
                  placeholder="e.g., jane@colomboauto.lk"
                  value={form.primaryContact?.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors['primaryContact.email']}
                  touched={touched['primaryContact.email']}
                />

                <FormField
                  label="Phone"
                  name="primaryContact.phone"
                  placeholder="e.g., +94 77 123 4567"
                  value={form.primaryContact?.phone}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors['primaryContact.phone']}
                  touched={touched['primaryContact.phone']}
                />

                <FormField
                  label="Mobile (optional)"
                  name="primaryContact.mobile"
                  placeholder="e.g., +94 71 234 5678"
                  value={form.primaryContact?.mobile}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={errors['primaryContact.mobile']}
                  touched={touched['primaryContact.mobile']}
                />
              </div>
            </FormSection>

            {/* Address Information */}
            <FormSection title="Address Information" icon="📍">
              {form.addresses?.map((address, index) => (
                <div key={index} className="space-y-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-300">
                      {address.type === 'HEAD_OFFICE' ? 'Head Office' : 'Address'} {index + 1}
                    </h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="btn-secondary btn-icon text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Address Line 1"
                      name={`addresses.${index}.line1`}
                      placeholder="Street address"
                      value={address.line1}
                      onChange={(e) => updateAddressField(index, 'line1', e.target.value)}
                      required={index === 0}
                      error={errors[`addresses.${index}.line1`]}
                      touched={touched[`addresses.${index}.line1`]}
                    />

                    <FormField
                      label="Address Line 2"
                      name={`addresses.${index}.line2`}
                      placeholder="Apartment, suite, etc."
                      value={address.line2}
                      onChange={(e) => updateAddressField(index, 'line2', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      label="City"
                      name={`addresses.${index}.city`}
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => updateAddressField(index, 'city', e.target.value)}
                      required={index === 0}
                      error={errors[`addresses.${index}.city`]}
                      touched={touched[`addresses.${index}.city`]}
                    />

                    <FormField
                      label="State"
                      name={`addresses.${index}.state`}
                      placeholder="State/Province"
                      value={address.state}
                      onChange={(e) => updateAddressField(index, 'state', e.target.value)}
                    />

                    <FormField
                      label="Postal Code"
                      name={`addresses.${index}.postalCode`}
                      placeholder="Postal code"
                      value={address.postalCode}
                      onChange={(e) => updateAddressField(index, 'postalCode', e.target.value)}
                    />

                    <FormField
                      label="Country"
                      name={`addresses.${index}.country`}
                      placeholder="Country"
                      value={address.country}
                      onChange={(e) => updateAddressField(index, 'country', e.target.value)}
                      required={index === 0}
                      error={errors[`addresses.${index}.country`]}
                      touched={touched[`addresses.${index}.country`]}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addAddress}
                className="btn-ghost flex items-center gap-2"
              >
                <span>+</span>
                Add Another Address
              </button>
            </FormSection>

            {/* Business Terms */}
            <FormSection title="Business Terms" icon="💼">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Payment Terms"
                  name="paymentTerms"
                  value={form.paymentTerms}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.paymentTerms}
                  touched={touched.paymentTerms}
                >
                  <select
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={onChange}
                    onBlur={onBlur}
                    required
                    className="select"
                  >
                    <option value="">Select payment terms</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Net 90">Net 90</option>
                    <option value="COD">Cash on Delivery</option>
                    <option value="Advance">Advance Payment</option>
                  </select>
                </FormField>

                <FormField
                  label="Currency"
                  name="currency"
                  value={form.currency}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.currency}
                  touched={touched.currency}
                >
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={onChange}
                    onBlur={onBlur}
                    required
                    className="select"
                  >
                    <option value="">Select currency</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </FormField>

                <FormField
                  label="Lead Time (Days)"
                  name="leadTimeDays"
                  type="number"
                  min="0"
                  placeholder="e.g., 7"
                  value={form.leadTimeDays}
                  onChange={onChange}
                  onBlur={onBlur}
                  required
                  error={errors.leadTimeDays}
                  touched={touched.leadTimeDays}
                  helpText="Average delivery time in days"
                />
              </div>
            </FormSection>

            {/* Bank Details */}
            <FormSection title="Bank Details (Optional)" icon="🏦">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Bank Name"
                  name="bankDetails.bankName"
                  placeholder="e.g., Commercial Bank of Ceylon"
                  value={form.bankDetails?.bankName}
                  onChange={onChange}
                  onBlur={onBlur}
                />

                <FormField
                  label="Branch"
                  name="bankDetails.branch"
                  placeholder="e.g., Colombo Main Branch"
                  value={form.bankDetails?.branch}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Account Name"
                  name="bankDetails.accountName"
                  placeholder="e.g., Colombo Auto Parts Distributors"
                  value={form.bankDetails?.accountName}
                  onChange={onChange}
                  onBlur={onBlur}
                />

                <FormField
                  label="Account Number"
                  name="bankDetails.accountNumber"
                  placeholder="e.g., 1234567890"
                  value={form.bankDetails?.accountNumber}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              </div>
            </FormSection>

            {/* Additional Notes */}
            <FormSection title="Additional Notes" icon="📝">
              <FormField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.notes}
                touched={touched.notes}
                helpText="Any additional information about this supplier"
              >
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Enter any additional notes about this supplier..."
                  rows={4}
                  className="textarea"
                />
              </FormField>
            </FormSection>

            <ActionButtons
              onSave={submit}
              onCancel={() => navigate("/suppliers")}
              loading={loading}
              saveText={id ? "Update Supplier" : "Create Supplier"}
            />
          </form>
        </div>
      </div>

      <SuccessToast 
        message={toast} 
        onClose={() => setToast("")} 
      />
    </div>
  );
}