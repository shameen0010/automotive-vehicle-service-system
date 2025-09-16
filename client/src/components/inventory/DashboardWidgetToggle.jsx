import React from 'react';

export default function DashboardWidgetToggle({ widgets, onWidgetChange, className = '' }) {
  const widgetOptions = [
    { key: 'kpis', label: 'KPIs', icon: '📊' },
    { key: 'poStatus', label: 'PO Status', icon: '📋' },
    { key: 'topUsed', label: 'Top Used', icon: '📈' },
    { key: 'stockSummary', label: 'Stock Summary', icon: '📦' },
    { key: 'supplierSpend', label: 'Supplier Spend', icon: '💰' }
  ];

  return (
    <div className={`card ${className}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-accent2/10">
            <svg className="w-4 h-4 text-accent2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-200">Widget Controls</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {widgetOptions.map(option => (
            <label 
              key={option.key}
              className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 cursor-pointer transition-colors border border-white/10 hover:border-white/20"
            >
              <input 
                type="checkbox" 
                checked={widgets[option.key]} 
                onChange={e => onWidgetChange(option.key, e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50 focus:ring-offset-0"
              />
              <span className="mr-1">{option.icon}</span>
              <span className="text-slate-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}