import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = () => {
    login("demo-token", {
      name: "CA Demo Partner",
      email: "ca@example.com",
      branch: { name: "Main Office" },
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_40%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
            CA portal demo
          </div>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Client-panel style workspace for chartered accountants
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            This login page is a lightweight entry point for the demo build. Use it to preview the dashboard, tasks, firms, documents, and billing flows.
          </p>
          <button
            onClick={handleDemoLogin}
            className="mt-8 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Enter demo panel
          </button>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[1.5rem] bg-slate-950/70 p-5">
            <div className="text-sm font-medium text-cyan-300">Snapshot</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl bg-white/5 p-4">26 pending filings due this week</div>
              <div className="rounded-2xl bg-white/5 p-4">7 items awaiting partner review</div>
              <div className="rounded-2xl bg-white/5 p-4">3 client onboarding workflows active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

