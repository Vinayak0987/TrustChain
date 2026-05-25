import React, { useEffect, useState } from 'react';
import { Button } from '../shared/useRipple';
import { useToast } from '../shared/ToastProvider';

export const LoanPanel = () => {
  const [progressWidth, setProgressWidth] = useState('0%');
  const showToast = useToast();

  useEffect(() => {
    // Animate width after mount
    setTimeout(() => setProgressWidth('37.5%'), 300);
  }, []);

  const handleRepay = () => {
    window.showTcDialog(
      'Confirm Repayment',
      'You are about to repay instalment 4 of 8 — ₹1,500. This will update your loan progress and Trust Score. Confirm?',
      () => showToast('Repayment successful! Trust Score updated. 🎉')
    );
  };

  return (
    <div className="card animate-fade-in-up stagger-3" role="region" aria-label="Current loan">
      <div className="loan-panel-header">
        <div>
          <div className="card-title">Current Loan</div>
          <div className="card-subtitle">Active · Disbursed 12 Mar 2026</div>
        </div>
        <span className="pill pill-success">On Track</span>
      </div>

      <div className="loan-amount-row" aria-label="Loan amount: 12,000 Rupees">
        <span className="loan-currency">₹</span>
        <span className="loan-amount">12,000</span>
      </div>

      <div className="loan-meta-grid">
        <div className="loan-meta-item">
          <label>Remaining</label>
          <span>₹8,400</span>
        </div>
        <div className="loan-meta-item">
          <label>Due Date</label>
          <span>25 Apr 2026</span>
        </div>
        <div className="loan-meta-item">
          <label>Installments</label>
          <span>3 of 8 done</span>
        </div>
      </div>

      <div className="loan-progress-label" aria-label="Repayment progress: 37.5 percent">
        <span>Repayment Progress</span>
        <span>3/8 installments · 37.5%</span>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow="37" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: progressWidth }}></div>
      </div>

      <div className="loan-actions" style={{marginTop: 'var(--sp-5)'}}>
        <Button variant="primary" onClick={handleRepay} style={{flex: 1}}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="4" width="14" height="10" rx="2"/><path d="M1 8h14M4 12h2"/></svg>
          Repay Instalment
        </Button>
        <Button variant="outline" onClick={() => showToast('Full loan details coming in the next release.', 'success')} style={{flex: 1}}>
          View Details
        </Button>
      </div>
    </div>
  );
};
