import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';

/* ─── tiny sub-components ─────────────────────────────────────────────── */

function Spinner({ color = '#fff' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="2"
        strokeDasharray="24 10" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#eff6ff', border: '0.5px solid #bfdbfe', color: '#1e40af',
      borderRadius: 8, padding: '9px 12px', fontSize: 12, marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 6,
      animation: 'fadeIn .2s ease',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      ⚠ {message}
    </div>
  );
}

function Stepper({ step }) {
  const labels = ['Identify', 'Verify', 'Branch'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
      {[1, 2, 3].map((s) => {
        const done = step > s;
        const active = step === s;
        return (
          <React.Fragment key={s}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 500, flexShrink: 0, transition: 'all .3s',
              background: done ? '#4f46e5' : active ? '#0f172a' : '#f1f5f9',
              color: done || active ? '#fff' : '#94a3b8',
              border: `1.5px solid ${done ? '#4f46e5' : active ? '#0f172a' : '#e2e8f0'}`,
            }}>
              {done ? '✓' : s}
            </div>
            {s < 3 && (
              <div style={{ flex: 1, height: 1.5, background: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0, background: '#0f172a',
                  transform: step > s ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left', transition: 'transform .4s ease',
                }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <span style={{ marginLeft: 4, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
        {labels[step - 1]}
      </span>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder, type = 'text', disabled, hint, maxLength, autoComplete, style: extraStyle = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{
        display: 'block', fontSize: 11, fontWeight: 500, color: '#334155',
        letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        maxLength={maxLength} autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          display: 'block', width: '100%', height: 40, padding: '0 12px',
          fontSize: 14, fontFamily: 'inherit', background: '#f8fafc',
          border: `0.5px solid ${focused ? '#4f46e5' : '#e2e8f0'}`,
          borderRadius: 8, color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px #e0e7ff' : 'none',
          transition: 'border .15s, box-shadow .15s', boxSizing: 'border-box',
          ...extraStyle,
        }}
      />
      {hint && <p style={{ marginTop: 5, fontSize: 11, color: '#94a3b8' }}>{hint}</p>}
    </div>
  );
}

function PrimaryButton({ label, loading, disabled, onClick, type = 'submit' }) {
  return (
    <button
      type={type} disabled={disabled || loading} onClick={onClick}
      style={{
        width: '100%', height: 42, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        background: disabled || loading ? '#cbd5e1' : '#0f172a',
        color: '#fff', border: 'none', borderRadius: 8,
        fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background .15s, transform .1s', letterSpacing: '.03em',
      }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
}

function GhostButton({ label, onClick, muted }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 12, padding: 0,
      color: muted ? '#94a3b8' : '#4f46e5',
    }}>
      {label}
    </button>
  );
}

/* ─── hero left panel ──────────────────────────────────────────────────── */

const FEATURES = [
  { icon: '📋', title: 'Practice overview', desc: 'Track tasks, firms, and compliance work across your CA engagements.' },
  { icon: '⚡', title: 'Fast OTP login', desc: 'Sign in with a one-time code — no passwords to remember.' },
  { icon: '🛡️', title: 'Secure session', desc: 'Each session is verified independently with branch-scoped access.' },
];

function HeroPanel() {
  return (
    <div style={{
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      padding: '52px 48px', position: 'relative', overflow: 'hidden', minHeight: '100vh',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(ellipse 60% 40% at 10% 60%, #312e8122 0%, transparent 70%),
          radial-gradient(ellipse 50% 30% at 85% 15%, #1e3a8a18 0%, transparent 60%)
        `,
      }} />

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: .045 }}>
        <defs>
          <pattern id="topo-ca" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="20" fill="none" stroke="#6366f1" strokeWidth=".8" />
            <circle cx="30" cy="30" r="10" fill="none" stroke="#6366f1" strokeWidth=".6" />
            <circle cx="0"  cy="0"  r="20" fill="none" stroke="#6366f1" strokeWidth=".8" />
            <circle cx="60" cy="60" r="20" fill="none" stroke="#6366f1" strokeWidth=".8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-ca)" />
      </svg>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7,
          background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>◈</div>
        <div>
          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13, letterSpacing: '.08em' }}>OOMS</span>
          <span style={{
            marginLeft: 8, fontSize: 9, fontWeight: 600, letterSpacing: '.12em',
            color: '#818cf8', textTransform: 'uppercase',
            background: '#1e1b4b', border: '0.5px solid #3730a3',
            borderRadius: 4, padding: '2px 6px',
          }}>CA</span>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', padding: '40px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#1e293b', border: '0.5px solid #334155',
          borderRadius: 20, padding: '5px 12px', marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
          <span style={{ color: '#64748b', fontSize: 11, letterSpacing: '.04em' }}>Practice · Compliance · Ledger</span>
        </div>

        <h1 style={{ color: '#f8fafc', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 600, lineHeight: 1.2, margin: '0 0 14px', letterSpacing: '-.01em' }}>
          Your CA workspace,<br />ready to <span style={{ color: '#818cf8' }}>operate.</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, maxWidth: 300, margin: '0 0 44px' }}>
          Chartered accountant portal for OOMS. Sign in with your registered mobile — no passwords, instant access.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: '#1e293b',
                border: '0.5px solid #334155', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 15, flexShrink: 0,
              }}>{f.icon}</div>
              <div>
                <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, margin: '0 0 3px' }}>{f.title}</p>
                <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', animation: 'pulse 2.4s ease-in-out infinite' }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
        <span style={{ color: '#334155', fontSize: 11 }}>Encrypted channel active · 256-bit TLS</span>
      </div>
    </div>
  );
}

/* ─── main Login component ────────────────────────────────────────── */

export default function Login() {
  const { login, userData } = useAuth();

  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileSent, setMobileSent] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [branches, setBranches] = useState([]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^[0-9]{10}$/.test(mobile)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setIsSubmitting(true);
    try {
      const res = await apiCall('/auth/login/send-otp', 'POST', { country_code: countryCode, mobile });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setMobileSent(mobile);
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (otp.length < 4) { setError('Enter the OTP sent to your registered mobile.'); return; }
    setIsSubmitting(true);
    try {
      const res = await apiCall('/auth/login', 'POST', { country_code: countryCode, mobile: mobileSent, otp });
      const data = await res.json();
      if (res.ok && data.success !== false && data.token) {
        setTempToken(data.token);
        const tempUserData = {
          token: data.token,
          country_code: countryCode,
          mobile: mobileSent,
        };
        localStorage.setItem('ooms_user_data', JSON.stringify(tempUserData));

        let branchList = Array.isArray(data.branches) ? data.branches : [];
        if (!branchList.length) {
          const branchRes = await apiCall('/profile/list', 'GET');
          const branchData = await branchRes.json();
          if (branchRes.ok && branchData.success !== false) {
            branchList = branchData.branches || branchData.data || [];
          }
        }

        const validBranches = (branchList || []).filter((b) => b?.branch?.branch_id && b?.username);
        if (!validBranches.length) {
          setError('No branch assignments found for this CA number.');
          localStorage.removeItem('ooms_user_data');
          return;
        }

        if (validBranches.length === 1) {
          login(data.token, validBranches[0], { country_code: countryCode, mobile: mobileSent });
        } else {
          setBranches(validBranches);
          setStep(3);
        }
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
      localStorage.removeItem('ooms_user_data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBranchSelect = (branchProfile) => {
    login(tempToken, branchProfile, { country_code: countryCode, mobile: mobileSent });
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setOtp('');
    setBranches([]);
    localStorage.removeItem('ooms_user_data');
  };

  const cardContent = {
    1: {
      eyebrow: 'CA sign-in',
      title: 'Enter your mobile',
      sub: "We'll send a one-time code to your registered number.",
      body: (
        <form onSubmit={handleSendOtp} style={{ animation: 'slideIn .25s ease' }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 86, flexShrink: 0 }}>
              <Field
                id="cc" label="Code"
                value={`+${countryCode}`}
                onChange={e => setCountryCode(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                id="mobile" label="Mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                disabled={isSubmitting} maxLength={10} autoComplete="tel"
              />
            </div>
          </div>
          <PrimaryButton label="Send OTP →" loading={isSubmitting} disabled={mobile.length !== 10 || !countryCode} />
        </form>
      ),
    },
    2: {
      eyebrow: 'Verification',
      title: 'Check your phone',
      sub: `Code sent to +${countryCode} ${mobileSent}. Valid for a few minutes.`,
      body: (
        <form onSubmit={handleVerifyOtp} style={{ animation: 'slideIn .25s ease' }}>
          <Field
            id="otp" label="One-time code"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="· · · · · ·"
            maxLength={6} disabled={isSubmitting} autoComplete="one-time-code"
            hint="6-digit code from your SMS"
            style={{ letterSpacing: '.35em', fontSize: 18, textAlign: 'center' }}
          />
          <PrimaryButton label="Verify OTP" loading={isSubmitting} disabled={otp.length < 4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <GhostButton label="← Change mobile" onClick={goBack} />
            <GhostButton label="Resend code" onClick={handleSendOtp} muted />
          </div>
        </form>
      ),
    },
    3: {
      eyebrow: 'Almost there',
      title: 'Select a branch',
      sub: 'You are assigned as CA on multiple branches. Choose which branch to open.',
      body: (
        <div style={{ animation: 'slideIn .25s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {branches.map((branchProfile, idx) => (
              <div
                key={`${branchProfile.username}-${branchProfile.branch?.branch_id}-${idx}`}
                onClick={() => handleBranchSelect(branchProfile)}
                style={{
                  padding: 14, border: '0.5px solid #e2e8f0', borderRadius: 8,
                  cursor: 'pointer', transition: 'border .15s, background .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: '0 0 3px' }}>
                  {branchProfile.branch?.name || 'Unnamed branch'}
                </p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px' }}>
                  CA: {branchProfile.name || branchProfile.username}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                  {branchProfile.email || branchProfile.username}
                </p>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: '#e2e8f0', margin: '20px 0' }} />
          <GhostButton label="← Back to login" onClick={goBack} />
        </div>
      ),
    },
  };

  const current = cardContent[step];

  if (userData?.token && userData?.username && userData?.branch?.branch_id) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: '#f8fafc', position: 'relative',
    }}>
      <style>{`
        @media (max-width: 700px) {
          .ca-hero { display: none !important; }
          .ca-right { padding: 24px 16px !important; }
          .ca-card { padding: 28px 20px !important; }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
        <div className="ca-hero">
          <HeroPanel />
        </div>

        <div className="ca-right" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 32px', background: '#f8fafc',
        }}>
          <div className="ca-card" style={{
            width: '100%', maxWidth: 384, background: '#ffffff',
            borderRadius: 16, border: '0.5px solid #e2e8f0',
            padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,.05)',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#eef2ff', border: '0.5px solid #c7d2fe',
              borderRadius: 6, padding: '3px 8px', marginBottom: 16,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#4f46e5', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                ◈ CA portal
              </span>
            </div>

            <p style={{ fontSize: 11, fontWeight: 500, color: '#4f46e5', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {current.eyebrow}
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.25 }}>
              {current.title}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              {current.sub}
            </p>

            <Stepper step={step} />
            <ErrorBanner message={error} />
            {current.body}

            <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 24, lineHeight: 1.6 }}>
              By continuing you agree to OOMS{' '}
              <span style={{ color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer' }}>CA terms of access</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
