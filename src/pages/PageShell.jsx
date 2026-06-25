import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleCheckBig, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { pageData } from "./pageData";

const demoHighlights = [
  "Client-first panel layout",
  "CA-friendly work queue",
  "Responsive demo pages",
  "Reusable route templates",
];

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</div>
    </div>
  );
}

function Card({ title, body, tone }) {
  const toneClasses = {
    warning: "from-amber-50 to-orange-50 border-amber-200/70 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50",
    info: "from-sky-50 to-cyan-50 border-sky-200/70 dark:from-sky-950/30 dark:to-cyan-950/20 dark:border-sky-900/50",
    success: "from-emerald-50 to-teal-50 border-emerald-200/70 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-900/50",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

export default function PageShell({ name, children }) {
  const data = pageData[name] || pageData.Dashboard;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.9))] p-6 text-white shadow-xl dark:border-slate-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100">
              {data.eyebrow}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{data.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              {data.description}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              Demo panel
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {demoHighlights.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CircleCheckBig className="h-4 w-4 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {data.stats && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>
      )}

      {data.cards && (
        <section className="grid gap-4 lg:grid-cols-3">
          {data.cards.map((card) => (
            <Card key={card.title} {...card} />
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          {children}
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">What this demo includes</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-sky-500" />
              <p>Deadline-oriented sections for filing-heavy CA workflows.</p>
            </div>
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-fuchsia-500" />
              <p>Clean cards, status bars, and quick actions inspired by a client panel.</p>
            </div>
            <div className="flex gap-3">
              <ArrowRight className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>Routes are reusable, so we can expand this into a full practice portal later.</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

