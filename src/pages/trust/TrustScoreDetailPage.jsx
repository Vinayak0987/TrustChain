import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { IMPROVEMENT_TIPS } from '../../data/mockData';
import { TrustGaugeLarge, MiniChart } from '../../components/shared/SharedComponents';
import { fetchTrustScoreHistory } from '../../utils/supabaseService';

export const TrustScoreDetailPage = () => {
  const { trustScore, user, trustHistory: ctxHistory } = useContext(AppContext);
  const navigate = useNavigate();

  // Real trust history from Supabase
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const data = await fetchTrustScoreHistory(user.id);
      if (data.length >= 2) {
        setHistory(data.map(h => ({ month: h.month_label || '?', score: h.score })));
      }
    };
    load();
  }, [user?.id]);

  // Use context history (preloaded) or freshly fetched, fallback to mock-style data
  const displayHistory = history.length >= 2
    ? history
    : ctxHistory?.length >= 2
    ? ctxHistory.map(h => ({ month: h.month_label || '?', score: h.score }))
    : null;

  const tier = trustScore >= 80 ? { label: 'High', cls: 'pill-success' }
    : trustScore >= 60 ? { label: 'Medium', cls: 'pill-warning' }
    : { label: 'Low', cls: 'pill-danger' };

  // Build real trust factors from profile data
  const kycVerified = user?.kycStatus === 'completed';
  const hasPhone = !!(user?.phone_number || user?.phone);
  const trustFactors = [
    {
      label: 'ID Verified',
      points: 30,
      earned: kycVerified ? 30 : hasPhone ? 10 : 0,
      icon: '🪪',
    },
    {
      label: 'Repaid Loans',
      points: 40,
      earned: Math.min(40, (user?.repaid_loans || 0) * 10),
      icon: '✓',
    },
    {
      label: 'Community Vouchers',
      points: 30,
      earned: Math.min(30, (user?.voucher_count || 0) * 10),
      icon: '🤝',
    },
  ];

  return (
    <section className="screen active" aria-label="Trust Score Detail">
      <div className="trust-detail-grid">

        {/* Left — Gauge + factors */}
        <div>
          <div className="card animate-fade-in-up text-center mb-5">
            <div className="card-title mb-1">Your Trust Score</div>
            <div className="card-subtitle mb-5">Updates in real-time as you repay and verify</div>

            <div className="gauge-wrapper-center">
              <TrustGaugeLarge score={trustScore} size={220} />
            </div>

            <div className="trust-tier-name mt-2 text-lg font-semibold">
              {trustScore >= 85 ? 'High — Excellent Standing'
                : trustScore >= 70 ? 'Medium-High — Getting Stronger'
                : trustScore >= 40 ? 'Medium — Building Trust'
                : 'Low — Just Starting'}
            </div>

            <div className="mt-3 mb-2">
              <span className={`pill ${tier.cls}`}>Risk Tier: {tier.label}</span>
            </div>
            <div className="text-xs text-muted">
              {tier.label === 'Low' && 'Higher-rate loans only (20%). Complete verification to improve.'}
              {tier.label === 'Medium' && 'Standard loan access (16% rate). Keep repaying on time.'}
              {tier.label === 'High' && 'Best rates available (12%). You qualify for up to ₹50,000.'}
            </div>

            {/* Profile snapshot */}
            {user && (
              <div style={{ marginTop: 16, padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 8, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Info</div>
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>👤 <strong>{user.name || user.full_name || '—'}</strong></div>
                  {user.phone_number && <div>📞 {user.phone_number}</div>}
                  {user.pan_number && <div>🪪 PAN: {user.pan_number}</div>}
                  {user.aadhaar_number && <div>🆔 Aadhaar: ••••••{user.aadhaar_number.slice(-4)}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Factor breakdown */}
          <div className="card animate-fade-in-up stagger-2">
            <div className="card-title mb-5">How Your Score Is Calculated</div>
            {trustFactors.map(f => (
              <div key={f.label} className="factor-detail-row">
                <div className="factor-detail-header">
                  <span className="factor-icon-lg">{f.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{f.label}</div>
                    <div className="text-xs text-muted">Max {f.points} points</div>
                  </div>
                  <div className="factor-detail-score">
                    <span className="font-bold" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{f.earned}</span>
                    <span className="text-muted text-xs">/{f.points}</span>
                  </div>
                </div>
                <div className="factor-bar mt-2">
                  <div className="factor-fill" style={{ width: `${(f.earned / f.points) * 100}%`, background: f.earned === f.points ? 'var(--color-success)' : 'var(--color-primary)' }} />
                </div>
                <div className="text-xs text-muted mt-1">
                  {f.label === 'ID Verified' && (kycVerified ? '✅ KYC fully verified (+30/30)' : hasPhone ? '📱 Phone verified (+10/30) — complete KYC for full score' : '⚠️ Complete identity verification to earn points')}
                  {f.label === 'Repaid Loans' && (user?.repaid_loans > 0 ? `${user.repaid_loans} on-time repayments completed` : 'No repayments yet — repay your first loan to earn points')}
                  {f.label === 'Community Vouchers' && (user?.voucher_count > 0 ? `${user.voucher_count} of 3 vouchers confirmed` : 'No vouchers yet — invite 3 trusted people')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — History + Tips */}
        <div>
          {/* Score history chart */}
          <div className="card animate-fade-in-up stagger-3 mb-5">
            <div className="card-title mb-1">Score History</div>
            <div className="card-subtitle mb-4">Your Trust Score change over time</div>
            {displayHistory ? (
              <>
                <div style={{ padding: '8px 0' }}>
                  <MiniChart data={displayHistory} width={300} height={80} />
                </div>
                <div className="chart-labels flex justify-between mt-2">
                  {displayHistory.map((h, i) => (
                    <span key={i} className="text-xs text-muted">{h.month}</span>
                  ))}
                </div>
                {displayHistory.length >= 2 && (
                  <div className="trust-hint mt-4">
                    📈 Score changed from <strong>{displayHistory[0].score}</strong> to <strong>{displayHistory[displayHistory.length - 1].score}</strong>.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted" style={{ padding: '24px', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                Score history will appear here as you build your profile.<br />
                <span className="text-xs">Complete KYC, repay loans, and get vouchers to see your progress.</span>
              </div>
            )}
          </div>

          {/* Improvement tips */}
          <div className="card animate-fade-in-up stagger-4 mb-5">
            <div className="card-title mb-4">How to Improve Your Score</div>
            <div className="tips-list" role="list">
              {IMPROVEMENT_TIPS.map((tip, i) => (
                <div key={i} className="tip-row" role="listitem">
                  <span className="tip-icon" aria-hidden="true">💡</span>
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card animate-fade-in-up stagger-5">
            <div className="card-title mb-4">Improve Your Score Now</div>
            <button className="btn btn-primary w-full mb-3" id="go-verify-btn" onClick={() => navigate(user?.kycStatus === 'completed' ? '/verify' : '/kyc')}>
              🪪 {user?.kycStatus === 'completed' ? 'Add More Verification' : 'Complete KYC Verification'}
            </button>
            <button className="btn btn-outline w-full mb-3" id="go-vouch-btn" onClick={() => navigate('/vouch')}>
              🤝 Invite Community Vouchers
            </button>
            <button className="btn btn-ghost w-full" id="go-repay-btn" onClick={() => navigate('/loan/repayment')}>
              💳 Make a Repayment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
