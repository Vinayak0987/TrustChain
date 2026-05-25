import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../shared/ToastProvider';

const NavItem = ({ to, icon, label, badge, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    onClick={onClick}
    end={to === '/dashboard'}
  >
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon}
    </svg>
    {label}
    {badge && <span className="nav-badge">{badge}</span>}
  </NavLink>
);

export const AppSidebar = ({ isOpen, setSidebarOpen }) => {
  const close = () => { if (window.innerWidth <= 768) setSidebarOpen(false); };
  const { account, trustScore, isRegistered, registerOnChain, registering } = useContext(Web3Context);
  const { kycCompleted, user } = useContext(AppContext);
  const navigate = useNavigate();
  const showToast = useToast();

  const handleRegister = async () => {
    const ok = await registerOnChain();
    if (ok && showToast) showToast('✅ Registered on-chain! TrustScore = 50', 'success');
    else if (!ok && showToast) showToast('Registration rejected or failed. Try again.', 'error');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Prefer Supabase user name, then phone, else fall back to wallet address display
  const displayName  = user?.name || user?.phone || (account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not connected');
  const initials     = user?.initials || (account ? account.slice(2, 4).toUpperCase() : '??');
  const avatarColor  = user?.avatarColor || '#3B9B9B';
  const scoreColor   = trustScore >= 80 ? '#3B9B9B' : trustScore >= 60 ? '#E8A838' : '#E85A5A';

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} id="app-sidebar" role="navigation" aria-label="App navigation">
      <div className="sidebar-header">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="14" stroke="#3B9B9B" strokeWidth="2"/>
          <path d="M10 16.5C10 13.46 12.46 11 15.5 11H22l-3 3h-3.5C12.91 14 12 14.91 12 16.5S12.91 19 14.5 19H18l3 3H14.5C12.46 22 10 19.54 10 16.5Z" fill="#3B9B9B"/>
          <circle cx="22" cy="11" r="2" fill="#F4845F"/>
          <circle cx="22" cy="22" r="2" fill="#E8A838"/>
        </svg>
        <div className="sidebar-logo"><span>TrustChain</span></div>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="avatar avatar-lg" style={{ background: avatarColor }}>{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name" style={{ fontFamily: user?.name ? 'inherit' : 'monospace', fontSize: '0.8rem' }}>{displayName}</div>
          {trustScore !== null ? (
            <div className="sidebar-user-pod">
              <span style={{ color: scoreColor, fontWeight: 700 }}>⛓️ Score: {trustScore}</span>
            </div>
          ) : (
            <div className="sidebar-user-pod">
              {kycCompleted ? '✅ KYC Verified' : '⚠️ KYC Pending'}
            </div>
          )}
        </div>
      </div>

      {/* KYC Banner */}
      {!kycCompleted && (
        <button
          onClick={() => { navigate('/kyc'); close(); }}
          style={{
            margin: '0 var(--sp-4) var(--sp-3)', width: 'calc(100% - 2 * var(--sp-4))',
            background: '#FDE8C0', color: '#B45309', border: 'none', borderRadius: '10px',
            padding: '10px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            textAlign: 'left', lineHeight: 1.4
          }}
          id="kyc-banner-btn"
        >
          ⚠ Complete KYC to unlock loans
        </button>
      )}

      {/* On-chain Registration Banner — shown when wallet connected but not registered */}
      {account && !isRegistered && (
        <button
          onClick={handleRegister}
          disabled={registering}
          style={{
            margin: '0 var(--sp-4) var(--sp-3)', width: 'calc(100% - 2 * var(--sp-4))',
            background: registering ? '#E0F4F4' : 'linear-gradient(135deg, #3B9B9B22, #185FA511)',
            color: '#185FA5', border: '1px solid #3B9B9B55', borderRadius: '10px',
            padding: '10px 12px', fontSize: '12px', fontWeight: 600, cursor: registering ? 'wait' : 'pointer',
            textAlign: 'left', lineHeight: 1.5, opacity: registering ? 0.7 : 1,
          }}
          id="register-onchain-btn"
        >
          {registering ? '⏳ Registering on blockchain…' : '⛓️ Activate your on-chain identity'}
          <div style={{ fontWeight: 400, fontSize: '11px', marginTop: 2 }}>
            {registering ? 'Please confirm in MetaMask' : 'One-time setup · Unlocks borrowing & lending'}
          </div>
        </button>
      )}

      <nav className="sidebar-nav" aria-label="App sections">
        {/* Main */}
        <div className="nav-section-label">Main</div>
        <NavItem to="/dashboard" label="Dashboard" onClick={close}
          icon={<><rect x="1" y="1" width="7" height="7" rx="1.5"/><rect x="10" y="1" width="7" height="7" rx="1.5"/><rect x="1" y="10" width="7" height="7" rx="1.5"/><rect x="10" y="10" width="7" height="7" rx="1.5"/></>} />
        <NavItem to="/transactions" label="Transaction Log" onClick={close}
          icon={<><path d="M1 5h16M1 9h12M1 13h14"/></>} />

        {/* Borrower */}
        <div className="nav-section-label" style={{ marginTop: 'var(--sp-4)' }}>Borrower</div>
        <NavItem to="/profile" label="My Profile" onClick={close}
          icon={<><circle cx="9" cy="6" r="3"/><path d="M2 16c0-3.5 3-6 7-6s7 2.5 7 6"/></>} />
        <NavItem to="/loan/request" label="Request Loan" badge="New" onClick={close}
          icon={<><rect x="1" y="4" width="16" height="12" rx="2"/><path d="M1 8h16M5 12h2M9 12h4"/></>} />
        <NavItem to="/loan/repayment" label="Repayment Tracker" onClick={close}
          icon={<><circle cx="9" cy="9" r="7"/><path d="M9 6v3l2 2"/></>} />
        <NavItem to="/community" label="My Community" onClick={close}
          icon={<><circle cx="6" cy="7" r="2.5"/><circle cx="12" cy="7" r="2.5"/><path d="M1 15c0-3 2.2-5 5-5h6c2.8 0 5 2 5 5"/></>} />

        {/* Lender */}
        <div className="nav-section-label" style={{ marginTop: 'var(--sp-4)' }}>Lender</div>
        <NavItem to="/loans" label="Browse Loans" onClick={close}
          icon={<><rect x="1" y="1" width="16" height="11" rx="2"/><path d="M5 16l4-4 4 4M9 12v4"/></>} />
        <NavItem to="/lender" label="Lender Dashboard" onClick={close}
          icon={<><path d="M1 14L5 9l4 3 4-5 4 2"/></>} />
        <NavItem to="/loan/fund" label="Fund a Loan" onClick={close}
          icon={<><circle cx="9" cy="9" r="7"/><path d="M9 6v6M6.5 8h5M6.5 11h5"/></>} />

        {/* Trust */}
        <div className="nav-section-label" style={{ marginTop: 'var(--sp-4)' }}>Trust</div>
        <NavItem to="/trust" label="Trust Score" onClick={close}
          icon={<><path d="M9 1.5L2 4.5v5c0 3.5 3 6 7 7 4-1 7-3.5 7-7v-5L9 1.5z"/></>} />
        <NavItem to="/verify" label="Identity Verify" onClick={close}
          icon={<><rect x="2" y="3" width="14" height="12" rx="2"/><path d="M5 8h8M5 11h5"/><circle cx="13" cy="11" r="2" fill="currentColor"/></>} />

        {/* Governance */}
        <div className="nav-section-label" style={{ marginTop: 'var(--sp-4)' }}>Governance</div>
        <NavItem to="/fraud" label="Fraud Voting" onClick={close}
          icon={<><circle cx="9" cy="9" r="7"/><path d="M9 6v3M9 12v.5"/></>} />
        <NavItem to="/governance" label="Loan Approval" onClick={close}
          icon={<><path d="M1 9h16M5 5l4 4 4-4M5 13l4-4 4 4"/></>} />
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ width: '100%', marginBottom: '12px', padding: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px', cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Log Out
        </button>
        <div className="security-hint" role="note">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 1L1.5 3.5v4.5C1.5 10.8 4 13 7 13.5c3-.5 5.5-2.7 5.5-5.5V3.5L7 1z"/>
          </svg>
          Your data is encrypted &amp; protected
        </div>
      </div>
    </aside>
  );
};
