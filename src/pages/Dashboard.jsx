import React from "react";
import PageShell from "./PageShell";

export default function Dashboard() {
  return (
    <PageShell name="Dashboard">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Today&apos;s practice snapshot</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Priority work</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>• GST return review for three clients</li>
              <li>• TDS reconciliation on pending ledgers</li>
              <li>• Audit checklist sign-off for two firms</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Quick actions</div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white dark:bg-white dark:text-slate-900">Create filing</span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Add client</span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Upload docs</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

