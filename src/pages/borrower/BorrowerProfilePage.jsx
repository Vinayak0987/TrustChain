import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { fetchUserVouchers, fetchUserLoans } from '../../utils/supabaseService';
import { TrustGaugeLarge } from '../../components/shared/SharedComponents';
import { TRUST_SCORE_FACTORS } from '../../data/mockData';

export const BorrowerProfilePage = () => {
  const { user, trustScore, vouchers: ctxVouchers } = useContext(AppContext);
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [loanStats, setLoanStats] = useState({ totalBorrowed: 0, totalRepaid: 0, streak: 0, loanCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const [voucherData, loans] = await Promise.all([
        fetchUserVouchers(user.id),
        fetchUserLoans(user.id),
      ]);
      setVouchers(voucherData);

      const repaid = loans.filter(l => l.status === 'repaid');
      setLoanStats({
        totalBorrowed: loans.reduce((s, l) => s + l.amount, 0),
        totalRepaid: repaid.reduce((s, l) => s + l.total_owed, 0),
        streak: repaid.length,
        loanCount: loans.length,
      });
      setLoading(false);
    };
    load();
  }, [user?.id]);

  // Use context vouchers if no DB vouchers yet
  const displayVouchers = vouchers.length > 0 ? vouchers : (ctxVouchers || []);
  const confirmedVouchers = displayVouchers.filter(v => v.status === 'confirmed');

  const displayName = user?.name || user?.full_name || 'User';
  const initials = user?.initials || displayName.substring(0, 2).toUpperCase();
  const avatarColor = user?.avatarColor || user?.avatar_color || '#3B9B9B';
  const joinedLabel = user?.joined_label || (user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently joined');
  const location = user?.location || 'India';
  const kycVerified = user?.kycStatus === 'completed';

  // Build trust factor data from real profile
  const trustFactors = [
    { label: 'ID Verified', points: 30, earned: kycVerified ? 30 : 0, icon: '🪪' },
    { label: 'Repaid Loans', points: 40, earned: Math.min(40, loanStats.streak * 10), icon: '✓' },
    { label: 'Community Vouchers', points: 30, earned: Math.min(30, confirmedVouchers.length * 10), icon: '🤝' },
  ];

  return (
    <section className="screen active" aria-label="My Profile">
      <div className="profile-grid">

        {/* Left — Profile card */}
        <div className="card profile-main-card animate-fade-in-up">
          <div className="profile-header">
            <div className="profile-avatar" style={{ background: avatarColor }}>{initials}</div>
            <div className="profile-name-block">
              <div className="profile-name">
                {displayName}
                {kycVerified && <span className="verified-badge" aria-label="Verified member">✓</span>}
              </div>
              <div className="profile-role-tag">
                <span className="pill pill-success" style={{ fontSize: '11px' }}>{user?.role || 'Borrower'}</span>
              </div>
              <div className="profile-meta text-xs text-muted">Joined {joinedLabel} · {location}</div>
            </div>
          </div>

          {/* Stats row */}
          {!loading && (
            <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>₹{loanStats.totalBorrowed.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Borrowed</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-success)' }}>₹{loanStats.totalRepaid.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Repaid</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-warning)' }}>{loanStats.loanCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Loans</div>
              </div>
            </div>
          )}

          {/* Trust Score */}
          <div className="profile-gauge-wrapper text-center mt-6" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-6)' }}>
            <div className="card-title mb-4">Trust Score</div>
            <TrustGaugeLarge score={trustScore ?? 50} size={210} />
            <div className="trust-tier-name mt-2">
              {trustScore >= 80 ? 'High Trust' : trustScore >= 60 ? 'Medium-High' : trustScore >= 40 ? 'Building Trust' : 'New Member'}
            </div>
            <button className="btn btn-ghost text-sm mt-2" onClick={() => navigate('/trust')} id="profile-trust-detail-btn">
              View full breakdown →
            </button>
          </div>

          {/* ID Status */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-5)', marginTop: 'var(--sp-5)' }}>
            <div className="card-title mb-3">Identity Verification</div>
            <div className="id-status-row">
              <div className="id-item" role="status">
                <span className={`pill text-xs ${user?.phone_number || user?.phone ? 'pill-success' : 'pill-warning'}`}>
                  {user?.phone_number || user?.phone ? '✓ Verified' : '⚠ Pending'}
                </span>
                <span className="text-xs text-muted ml-2">Phone Number</span>
              </div>
              <div className="id-item">
                <span className={`pill text-xs ${user?.aadhaar_number ? 'pill-success' : 'pill-warning'}`}>
                  {user?.aadhaar_number ? '✓ Verified' : '⚠ Pending'}
                </span>
                <span className="text-xs text-muted ml-2">Aadhaar Card</span>
              </div>
              <div className="id-item">
                <span className={`pill text-xs ${user?.pan_number ? 'pill-success' : 'pill-warning'}`}>
                  {user?.pan_number ? '✓ Verified' : '⚠ Pending'}
                </span>
                <span className="text-xs text-muted ml-2">PAN Card</span>
              </div>
            </div>
            <button className="btn btn-outline w-full mt-3 text-sm" id="add-id-btn" onClick={() => navigate(kycVerified ? '/verify' : '/kyc')}>
              {kycVerified ? 'Add more verification →' : 'Complete KYC →'}
            </button>
          </div>
        </div>

        {/* Right — Score breakdown + Vouchers + Repayment */}
        <div>
          {/* Trust Score factor bars */}
          <div className="card animate-fade-in-up stagger-2 mb-5">
            <div className="card-title mb-4">Score Breakdown</div>
            {trustFactors.map(f => (
              <div key={f.label} className="factor-row">
                <div className="factor-label">
                  <span>{f.icon}</span> {f.label}
                </div>
                <div className="factor-bar-wrapper">
                  <div className="factor-bar">
                    <div className="factor-fill" style={{ width: `${(f.earned / f.points) * 100}%` }} />
                  </div>
                  <span className="factor-score text-xs">{f.earned}/{f.points}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Community vouchers */}
          <div className="card animate-fade-in-up stagger-3 mb-5">
            <div className="card-title mb-4">Community Vouchers</div>
            <p className="text-xs text-muted mb-4">3 vouchers needed to unlock High Trust. Each voucher adds up to +10 points.</p>
            {loading ? (
              <div className="text-center text-muted" style={{ padding: '16px', fontSize: '0.85rem' }}>Loading vouchers…</div>
            ) : displayVouchers.length === 0 ? (
              <div className="voucher-list" role="list">
                {[0, 1, 2].map(i => (
                  <div key={i} className="voucher-row empty" role="listitem">
                    <div className="avatar voucher-avatar-empty" aria-hidden="true">+</div>
                    <div className="voucher-info">
                      <div className="text-muted text-sm">Slot {i + 1} — Invite someone</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/vouch')} id={`invite-voucher-${i}`}>Invite</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="voucher-list" role="list">
                {displayVouchers.slice(0, 3).map((v, i) => {
                  const vName = v.profiles?.full_name || 'Member';
                  const vInitials = vName.substring(0, 2).toUpperCase();
                  const vColor = v.profiles?.avatar_color || '#3B9B9B';
                  const vScore = v.profiles?.trust_score || '—';
                  return (
                    <div key={v.id} className={`voucher-row ${v.status}`} role="listitem">
                      <div className="avatar" style={{ background: vColor }} aria-hidden="true">{vInitials}</div>
                      <div className="voucher-info">
                        <div className="font-medium text-sm">{vName}</div>
                        <div className="text-xs text-muted">Trust Score: {vScore}</div>
                      </div>
                      <span className={`pill text-xs ${v.status === 'confirmed' ? 'pill-success' : 'pill-warning'}`}>
                        {v.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </div>
                  );
                })}
                {displayVouchers.length < 3 && [...Array(3 - displayVouchers.length)].map((_, i) => (
                  <div key={`empty-${i}`} className="voucher-row empty" role="listitem">
                    <div className="avatar voucher-avatar-empty" aria-hidden="true">+</div>
                    <div className="voucher-info">
                      <div className="text-muted text-sm">Slot {displayVouchers.length + i + 1} — Invite someone</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/vouch')} id={`invite-voucher-empty-${i}`}>Invite</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repayment history */}
          <div className="card animate-fade-in-up stagger-4">
            <div className="card-title mb-4">Repayment History</div>
            {loanStats.streak > 0 ? (
              <div className="repay-badge-row">
                <div className="repay-badge-icon" aria-hidden="true">🏆</div>
                <div>
                  <div className="font-semibold">On-Time Payer ✓</div>
                  <div className="text-xs text-muted mt-1">
                    {loanStats.streak} consecutive on-time payment{loanStats.streak !== 1 ? 's' : ''} · ₹{loanStats.totalRepaid.toLocaleString('en-IN')} repaid total
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '12px' }}>
                No repayments yet. Make your first loan repayment to build history.
              </div>
            )}
            <button className="btn btn-outline w-full mt-4 text-sm" id="repayment-tracker-btn" onClick={() => navigate('/loan/repayment')}>
              View repayment tracker →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
