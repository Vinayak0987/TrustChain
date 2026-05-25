import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../utils/supabaseClient';

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#1A2B3D',
  background: '#FFFFFF',
  borderWidth: '1.5px',
  borderStyle: 'solid',
  borderColor: '#E8EDF2',
  borderRadius: '10px',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#1A2B3D',
  marginBottom: '6px',
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setIsLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const getFocusStyle = (field) => focusedField === field
    ? { ...inputStyle, borderColor: '#3B9B9B', boxShadow: '0 0 0 3px rgba(59,155,155,0.15)' }
    : inputStyle;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle(); // Prevents 406 when profile row doesn't exist yet

    setUser({
      id: data.user.id,
      name: profile?.full_name || data.user.email,
      email: data.user.email,
      initials: (profile?.full_name || 'U').substring(0, 2).toUpperCase(),
      avatarColor: profile?.avatar_color || '#3B9B9B',
      trustScore: 72,
      kycStatus: profile?.kyc_status || 'pending',
      walletAddress: profile?.wallet_address || null,
    });
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F9F9 0%, #F8FAFB 60%, #FDF3E0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 8px 40px rgba(26,43,61,0.10)',
        border: '1px solid #E8EDF2',
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

        {/* Heading */}
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A2B3D', marginBottom: '6px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7B8D', marginBottom: '28px' }}>
          Sign in to your TrustChain account.
        </p>

        {/* Error box */}
        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626',
            padding: '12px 16px', borderRadius: '10px',
            fontSize: '13px', marginBottom: '20px',
            border: '1px solid #FECACA',
          }}>
            <strong>&#9888;</strong> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="login-email" style={labelStyle}>Email</label>
            <input
              id="login-email" type="email"
              placeholder="yourname@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')}
              style={getFocusStyle('email')} required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="login-password" style={labelStyle}>Password</label>
            <input
              id="login-password" type="password"
              placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')}
              style={getFocusStyle('password')} required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#7FC8C8' : '#3B9B9B',
              color: '#FFFFFF', border: 'none',
              borderRadius: '12px', fontSize: '15px',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(59,155,155,0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In \u2192'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6B7B8D' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: '#3B9B9B', fontWeight: 600 }}>Create one &rarr;</Link>
        </div>
      </div>
    </div>
  );
};
