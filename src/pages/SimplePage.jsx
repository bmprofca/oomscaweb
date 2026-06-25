import React from "react";
import PageShell from "./PageShell";

export default function SimplePage({ name, bullets = [] }) {
  return (
    <PageShell name={name}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{name} overview</h2>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          This demo page gives the CA panel a realistic destination for navigation, empty states, and workflow previews.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {bullets.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

