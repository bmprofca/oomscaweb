import React from "react";
import { Link } from "react-router-dom";
export default function ServerUnreachable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 text-white">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Server error</p>
        <h1 className="mt-4 text-3xl font-semibold">Backend temporarily unreachable</h1>
        <p className="mt-4 text-slate-300">This page covers offline and server failure states for the demo panel.</p>
        <Link to="/login" className="mt-8 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
          Return to login
        </Link>
      </div>
    </div>
  );
}

