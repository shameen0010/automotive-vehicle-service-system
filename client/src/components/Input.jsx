import React from 'react';
export default function Input({ label, ...props }) {
  return (
    <label className="label mb-4">
      <span>{label}</span>
      <input
        {...props}
        className="input mt-1"
      />
    </label>
  );
}
