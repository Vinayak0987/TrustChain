import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { scoreTier, calcLoan } from '../../utils/formatters';

export const RiskPanel = () => {
  const { trustScore, podStrength, verification } = useContext(AppContext);
  const [rate, setRate] = useState(0);

  useEffect(() => {
    // Standard mock loan for Risk panel visualization
    const data = calcLoan(10000, 8, podStrength, verification);
    setRate(data.rate);
  }, [trustScore, podStrength, verification]);

  const tier = scoreTier(trustScore);

  return (
    <div className="card risk-card animate-fade-in-up stagger-2">
      <div className="card-title">Risk &amp; Trust Analysis</div>
      <div className="card-subtitle mb-4">How your rate is calculated</div>

      <div className="risk-score-display text-center mb-4">
        <div className="risk-score-val" style={{color: tier.name.includes('High') || tier.name.includes('Medium') ? 'var(--color-success)' : 'var(--color-warning)'}}>{trustScore}</div>
        <div className="text-sm font-medium">{tier.name}</div>
      </div>

      <div className="insight-bullets">
        <div className="insight-bullet bullet-good text-sm">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4L6 12L2 8"/></svg>
          Good repayment history on previous loans
        </div>
        <div className="insight-bullet bullet-good text-sm">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4L6 12L2 8"/></svg>
          Backed by 'Sunrise Riders' pod
        </div>
        <div className={`insight-bullet ${verification === 'ngo' ? 'bullet-good' : 'bullet-warn'} text-sm`}>
          {verification === 'ngo' ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4L6 12L2 8"/></svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.5"/></svg>
          )}
          {verification === 'ngo' ? "Additional identity verification active" : "Add NGO verification to unlock lower rates (up to 4% off)"}
        </div>
      </div>

      <div className="rate-calculated" style={{marginTop: 'auto'}}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted">Personalised Rate</span>
          <span className="text-lg font-semibold">{rate}% p.a.</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{width: `${100 - (rate-8)*5}%`, background: 'var(--color-success)'}}></div>
        </div>
        <div className="text-center text-xs text-muted mt-2">
          The stronger your community backing, the lower your rate.
        </div>
      </div>
    </div>
  );
};
