import React from "react";

export default function ModernLayout({ children, side }) {
  return (
    <div className="bg-app min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-b-[rgba(255,255,255,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent shadow-soft flex items-center justify-center text-slate-900 font-bold">AS</div>
          <div>
            <div className="text-xl font-semibold">ASMS • Staff</div>
            <div className="text-sm text-muted">Environment: Demo</div>
          </div>
        </div>
        <div className="text-sm text-muted">Welcome, Alex</div>
      </header>

      <main className="app-container grid grid-cols-12 gap-6 py-8">
        <aside className="col-span-3 bg-[rgba(255,255,255,0.02)] rounded-xl p-4 shadow-glass">
          {side}
        </aside>

        <section className="col-span-9">
          <div className="rounded-xl p-6 shadow-glass bg-surface">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}