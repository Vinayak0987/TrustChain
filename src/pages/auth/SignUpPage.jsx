import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../utils/supabaseClient';

const inputStyle = {
  width: '100%', padding: '12px 16px', fontSize: '15px',
  fontFamily: 'inherit', color: '#1A2B3D', background: '#FFFFFF',
  border: '1.5px solid #E8EDF2', borderRadius: '10px', outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease', boxSizing: 'border-box',
};
const focusedStyle = { ...inputStyle, borderColor: '#3B9B9B', boxShadow: '0 0 0 3px rgba(59,155,155,0.15)' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A2B3D', marginBottom: '6px' };
const groupStyle = { marginBottom: '16px' };

const parseAuthError = (message) => {
  const msg = message || '';
  if (msg.toLowerCase().includes('fetch')) {
    return 'Cannot reach Supabase. Check your internet/VPN, then try again.';
  }
  const waitMatch = msg.match(/after (\d+) seconds?/i);
  if (waitMatch) {
    return `Please wait ${waitMatch[1]} seconds before requesting another email.`;
  }
  return msg;
};

// ─── Step 1: Registration Form ──────────────────────────────
const StepRegister = ({ onContinue, loading, setError, error }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [focused, setFocused] = useState('');
  const fs = (f) => focused === f ? focusedStyle : inputStyle;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your full name.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    await onContinue({ name, email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', border: '1px solid #FECACA' }}>
          &#9888; {error}
        </div>
      )}
      <div style={groupStyle}>
        <label style={labelStyle}>Full Name</label>
        <input id="signup-name" type="text" placeholder="e.g. Riya Kulkarni" required
          value={name} onChange={e => setName(e.target.value)}
          onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
          style={fs('name')} />
      </div>
      <div style={groupStyle}>
        <label style={labelStyle}>Gmail / Email</label>
        <input id="signup-email" type="email" placeholder="yourname@gmail.com" required
          value={email} onChange={e => setEmail(e.target.value)}
          onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
          style={fs('email')} />
      </div>
      <div style={groupStyle}>
        <label style={labelStyle}>Password</label>
        <input id="signup-password" type="password" placeholder="Min. 6 characters" required
          value={password} onChange={e => setPassword(e.target.value)}
          onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
          style={fs('password')} />
      </div>
      <div style={{ ...groupStyle, marginBottom: '24px' }}>
        <label style={labelStyle}>Confirm Password</label>
        <input id="signup-confirm" type="password" placeholder="Re-enter password" required
          value={confirm} onChange={e => setConfirm(e.target.value)}
          onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')}
          style={fs('confirm')} />
      </div>
      <button type="submit" id="signup-submit-btn" disabled={loading}
        style={{ width: '100%', padding: '14px', background: loading ? '#7FC8C8' : '#3B9B9B', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(59,155,155,0.3)' }}>
        {loading ? 'Sending OTP...' : 'Continue →'}
      </button>
    </form>
  );
};

// ─── Step 2: OTP Verification ───────────────────────────────
const StepVerifyOtp = ({
  email, onVerified, onResend,
  loading, setLoading, setError, error, resendCooldown,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleChange = (val, idx) => {
    const d = [...digits];
    d[idx] = val.replace(/\D/, '').slice(-1);
    setDigits(d);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      refs[5].current?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const token = digits.join('');
    if (token.length < 6) return setError('Please enter the full 6-digit OTP.');
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    setLoading(false);
    if (err) return setError(err.message || 'Invalid OTP. Please check your Gmail inbox and try again.');
    onVerified(data.user);
  };

  return (
    <div>
      <div style={{ background: '#E6F4F4', border: '1px solid #B2DFDF', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B3D' }}>Check your inbox</div>
        <div style={{ fontSize: '12px', color: '#6B7B8D', marginTop: '4px' }}>
          Enter the 6-digit code sent to <strong>{email}</strong> (check spam).
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', border: '1px solid #FECACA' }}>
          &#9888; {error}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              id={`otp-digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              disabled={loading}
              onChange={e => handleChange(e.target.value, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              style={{
                width: '48px', height: '56px', textAlign: 'center',
                fontSize: '22px', fontWeight: 700, fontFamily: 'monospace',
                border: d ? '2px solid #3B9B9B' : '1.5px solid #E8EDF2',
                borderRadius: '12px', outline: 'none',
                background: d ? '#E6F4F4' : '#FFFFFF',
                color: '#1A2B3D', transition: 'all 0.15s ease',
                boxShadow: d ? '0 0 0 3px rgba(59,155,155,0.1)' : 'none',
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px', color: '#6B7B8D' }}>
          Didn&#39;t receive the email?{' '}
          <button type="button" onClick={onResend} disabled={loading || resendCooldown > 0}
            style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#9AABB8' : '#3B9B9B', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '13px', padding: 0 }}>
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>

        <button type="submit" id="otp-verify-btn" disabled={loading}
          style={{ width: '100%', padding: '14px', background: loading ? '#7FC8C8' : '#3B9B9B', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(59,155,155,0.3)' }}>
          {loading ? 'Verifying...' : 'Verify Email →'}
        </button>
      </form>
    </div>
  );
};

// ─── Main SignUp Page ───────────────────────────────────────
export const SignUpPage = () => {
  const navigate = useNavigate();
  const { setUser, setIsLoggedIn } = useContext(AppContext);
  const [step, setStep] = useState(1); // 1 = register, 2 = verify OTP
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleContinue = async ({ name, email, password }) => {
    setError('');
    setLoading(true);
    const emailRedirectTo = `${window.location.origin}/signup`;

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo,
      },
    });

    setLoading(false);
    if (err) {
      setError(parseAuthError(err.message));
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setError('This email is already registered. Sign in instead.');
      return;
    }

    if (data?.session) {
      setUser({
        id: data.user?.id,
        name,
        email,
        initials: name.substring(0, 2).toUpperCase(),
        avatarColor: '#3B9B9B',
        trustScore: 0,
        kycStatus: 'pending',
      });
      setIsLoggedIn(true);
      navigate('/dashboard');
      return;
    }

    setRegisteredName(name);
    setRegisteredEmail(email);
    setResendCooldown(60);
    setStep(2);
  };

  const handleVerified = (supabaseUser) => {
    setUser({
      id: supabaseUser?.id,
      name: registeredName,
      email: registeredEmail,
      initials: registeredName.substring(0, 2).toUpperCase(),
      avatarColor: '#3B9B9B',
      trustScore: 0,
      kycStatus: 'pending',
    });
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    const emailRedirectTo = `${window.location.origin}/signup`;
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: registeredEmail,
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (err) {
      const parsed = parseAuthError(err.message);
      setError(parsed);
      const waitMatch = parsed.match(/wait (\d+) seconds/i);
      if (waitMatch) setResendCooldown(Number(waitMatch[1]));
      return;
    }
    setError('');
    setResendCooldown(60);
    alert('Verification email resent. Check inbox and spam.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F9F9 0%, #F8FAFB 60%, #FDF3E0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: '20px', padding: '40px', width: '100%',
        maxWidth: '440px', boxShadow: '0 8px 40px rgba(26,43,61,0.10)', border: '1px solid #E8EDF2',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3B9B9B" strokeWidth="2" />
            <path d="M10 16.5C10 13.46 12.46 11 15.5 11H22l-3 3h-3.5C12.91 14 12 14.91 12 16.5S12.91 19 14.5 19H18l3 3H14.5C12.46 22 10 19.54 10 16.5Z" fill="#3B9B9B" />
            <circle cx="22" cy="11" r="2" fill="#F4845F" />
            <circle cx="22" cy="22" r="2" fill="#E8A838" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#1A2B3D' }}>TrustChain</span>
        </div>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {['Create Account', 'Verify Gmail'].map((label, i) => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ height: '3px', borderRadius: '3px', background: i + 1 <= step ? '#3B9B9B' : '#E8EDF2', transition: 'background 0.3s ease', marginBottom: '5px' }} />
              <div style={{ fontSize: '10px', color: i + 1 <= step ? '#3B9B9B' : '#9AABB8', fontWeight: i + 1 === step ? 700 : 400 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step heading */}
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A2B3D', marginBottom: '4px' }}>
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7B8D', marginBottom: '24px' }}>
          {step === 1 ? 'Join the decentralized trust economy.' : 'Enter the 6-digit code we sent to your email.'}
        </p>

        {step === 1 && (
          <StepRegister
            onContinue={handleContinue}
            loading={loading}
            error={error} setError={setError}
          />
        )}

        {step === 2 && (
          <StepVerifyOtp
            email={registeredEmail}
            onVerified={handleVerified}
            onResend={handleResend}
            resendCooldown={resendCooldown}
            loading={loading} setLoading={setLoading}
            error={error} setError={setError}
          />
        )}

        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6B7B8D' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#3B9B9B', fontWeight: 600 }}>Sign in &rarr;</Link>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#9AABB8' }}>
              &#128274; Your data is encrypted end-to-end
            </div>
          </>
        )}
      </div>
    </div>
  );
};
