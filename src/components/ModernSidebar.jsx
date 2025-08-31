import React from "react";

export default function ModernSidebar({ items = [], activeIndex = 0, onSelect = ()=>{} }) {
  return (
    <nav className="space-y-3">
      {items.map((it, idx) => (
        <button
          key={it.label || idx}
          onClick={() => onSelect(idx)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-150
            ${idx === activeIndex ? 'bg-gradient-to-r from-primary to-accent text-slate-900 font-semibold shadow' : 'text-muted hover:bg-[rgba(255,255,255,0.02)]'}`}
        >
          {it.icon && <span className="mr-3 inline-block">{it.icon}</span>}
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}