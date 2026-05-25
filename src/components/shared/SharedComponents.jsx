import React from 'react';

// Risk tier color/label helper
export const riskBadge = (tier) => {
  const map = {
    Low: { cls: 'pill-success', label: 'Low Risk' },
    Medium: { cls: 'pill-warning', label: 'Med Risk' },
    High: { cls: 'pill-danger', label: 'High Risk' },
  };
  return map[tier] || map.Low;
};

// Fund percentage
export const fundPct = (funded, amount) => Math.min(100, Math.round((funded / amount) * 100));

// Loan card shared component (Kiva-style)
export const LoanCard = ({ loan, onFund, showFundBtn = true }) => {
  const { cls, label } = riskBadge(loan.riskTier);
  const pct = fundPct(loan.funded, loan.amount);

  return (
    <div className="card loan-story-card">
      <div className="loan-card-header">
        <div className="avatar avatar-lg" style={{ background: loan.avatarColor }}>
          {loan.initials}
        </div>
        <div className="loan-card-meta">
          <div className="font-semibold text-heading" style={{ fontSize: 'var(--font-base)' }}>{loan.borrower}</div>
          <div className="text-xs text-muted">{loan.location} · {loan.repaymentPeriod}</div>
          <span className={`pill ${cls}`} style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>{label}</span>
        </div>
        <div className="loan-trust-score">
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>{loan.trustScore}</div>
          <div className="text-xs text-muted">Trust</div>
        </div>
      </div>

      <div className="loan-purpose-text">"{loan.story}"</div>

      {/* Amount + progress */}
      <div className="flex justify-between text-sm mb-2" style={{ marginTop: 'var(--sp-4)' }}>
        <span className="font-semibold">₹{loan.funded.toLocaleString('en-IN')} raised</span>
        <span className="text-muted">of ₹{loan.amount.toLocaleString('en-IN')}</span>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <div className="flex justify-between text-xs text-muted mt-2 mb-4">
        <span>{pct}% funded</span>
        <span>{loan.daysLeft} days left</span>
      </div>

      {showFundBtn && (
        <button className="btn btn-primary w-full" onClick={() => onFund && onFund(loan)}>
          Fund this loan →
        </button>
      )}
    </div>
  );
};

// Trust score gauge (large version)
export const TrustGaugeLarge = ({ score, size = 180 }) => {
  const ARC = 282.7;
  const dash = (score / 100) * ARC;
  const color = score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className="gauge-wrapper" style={{ width: size, height: size * 0.65 }}>
      <svg viewBox="0 0 240 145" width={size} height={size * 0.6}>
        <path d="M 30 130 A 90 90 0 0 1 210 130" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="18" strokeLinecap="round" />
        {/* Subtle Background Segments (Integrated) */}
        <path d="M 30 130 A 90 90 0 0 1 90 50" fill="none" stroke="rgba(255, 0, 0, 0.1)" strokeWidth="18" strokeLinecap="butt" />
        <path d="M 90 50 A 90 90 0 0 1 150 50" fill="none" stroke="rgba(255, 200, 0, 0.1)" strokeWidth="18" strokeLinecap="butt" />
        <path d="M 150 50 A 90 90 0 0 1 210 130" fill="none" stroke="rgba(0, 255, 0, 0.1)" strokeWidth="18" strokeLinecap="butt" />
        <path
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={`${dash}, ${ARC}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease' }}
        />
      </svg>
      <div className="gauge-center" style={{ position: 'absolute', left: '50%', bottom: '8px', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="gauge-score" style={{ color, fontSize: size > 160 ? '2.8rem' : '2rem', fontWeight: 800, lineHeight: 1 }}>{score}</div>
        <div className="gauge-label" style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 600 }}>Trust Score</div>
      </div>
    </div>
  );
};

// 3-step pill indicator
export const StepIndicator = ({ steps, current }) => (
  <div className="step-indicator" role="navigation" aria-label="Onboarding steps">
    {steps.map((label, i) => {
      const step = i + 1;
      const isDone = step < current;
      const isActive = step === current;
      return (
        <React.Fragment key={step}>
          <div className={`step-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`} aria-current={isActive ? 'step' : undefined}>
            <span className="step-num">{isDone ? '✓' : step}</span>
            <span className="step-label">{label}</span>
          </div>
          {i < steps.length - 1 && <div className="step-connector" aria-hidden="true" />}
        </React.Fragment>
      );
    })}
  </div>
);

// Vote progress bar
export const VoteBar = ({ forVotes, against, total, forLabel = 'Yes', againstLabel = 'No', forColor = 'var(--color-success)', againstColor = 'var(--color-danger)' }) => {
  const forPct = Math.round((forVotes / total) * 100);
  const againstPct = Math.round((against / total) * 100);
  return (
    <div className="vote-bar-wrapper">
      <div className="vote-bar-track">
        <div className="vote-bar-fill" style={{ width: `${forPct}%`, background: forColor }} />
      </div>
      <div className="vote-bar-labels">
        <span style={{ color: forColor }}>{forLabel}: {forVotes} ({forPct}%)</span>
        <span style={{ color: againstColor }}>{againstLabel}: {against} ({againstPct}%)</span>
      </div>
    </div>
  );
};

// Mini sparkline chart (SVG)
export const MiniChart = ({ data, width = 240, height = 60 }) => {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.score);
  const min = Math.min(...vals) - 5;
  const max = Math.max(...vals) + 5;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * height;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const lastPt = pts[pts.length - 1].split(',');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      <polyline points={polyline} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="4" fill="var(--color-primary)" />
    </svg>
  );
};

// Stat card
export const StatCard = ({ label, value, sub, color = 'var(--color-primary)', icon }) => (
  <div className="card stat-card">
    {icon && <div className="stat-icon" aria-hidden="true">{icon}</div>}
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub text-xs text-muted">{sub}</div>}
  </div>
);
