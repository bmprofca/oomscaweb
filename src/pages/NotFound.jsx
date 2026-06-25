import React from "react";
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">404</p>
        <h1 className="mt-4 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-slate-300">The requested route is not part of this CA demo build.</p>
        <Link to="/dashboard" className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

