import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../components/shared/ToastProvider';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export const RepaymentTrackerPage = () => {
  const { activeLoan } = useContext(AppContext);
  const showToast = useToast();
  const [paidCount, setPaidCount] = useState(activeLoan.paidInstallments);

  const pct = Math.round((paidCount / activeLoan.totalInstallments) * 100);
  const remaining = activeLoan.amount - (paidCount * (activeLoan.amount / activeLoan.totalInstallments));

  const handlePay = () => {
    if (window.showTcDialog) {
      window.showTcDialog(
        'Confirm Repayment',
        `Pay instalment ${paidCount + 1} of ${activeLoan.totalInstallments} — ₹${(activeLoan.amount / activeLoan.totalInstallments).toLocaleString('en-IN')}?`,
        () => {
          setPaidCount(p => Math.min(p + 1, activeLoan.totalInstallments));
          showToast('✅ Repayment recorded! Trust Score updated.', 'success');
        }
      );
    }
  };

  return (
    <section className="screen active" aria-label="Repayment Tracker">
      <div className="repayment-grid">

        {/* Active Loan Card */}
        <div className="card animate-fade-in-up">
          <div className="loan-panel-header">
            <div>
              <div className="card-title">Active Loan</div>
              <div className="card-subtitle">Disbursed {activeLoan.disbursed}</div>
            </div>
            {paidCount === activeLoan.totalInstallments
              ? <span className="pill pill-success">Fully Paid ✓</span>
              : <span className="pill pill-success">On Track</span>}
          </div>

          {/* Amount */}
          <div className="loan-amount-row">
            <span className="loan-currency">₹</span>
            <span className="loan-amount">{activeLoan.amount.toLocaleString('en-IN')}</span>
          </div>

          <div className="loan-meta-grid">
            <div className="loan-meta-item"><label>Remaining</label><span>₹{Math.round(remaining).toLocaleString('en-IN')}</span></div>
            <div className="loan-meta-item"><label>Due Date</label><span>{activeLoan.dueDate}</span></div>
            <div className="loan-meta-item"><label>Next Payment</label><span>{activeLoan.nextDue}</span></div>
          </div>

          {/* Progress bar */}
          <div className="loan-progress-label">
            <span>Paid so far</span>
            <span>{paidCount}/{activeLoan.totalInstallments} instalments · {pct}%</span>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>

          {/* Pay button */}
          {paidCount < activeLoan.totalInstallments ? (
            <button className="btn btn-primary w-full mt-5" id="pay-instalment-btn" onClick={handlePay}>
              💳 Pay Next Instalment — ₹{(activeLoan.amount / activeLoan.totalInstallments).toLocaleString('en-IN')}
            </button>
          ) : (
            <div className="trust-hint mt-5 text-center" style={{ color: 'var(--color-success)' }}>
              🎉 Loan fully repaid! Your Trust Score has increased.
            </div>
          )}

          {/* On-time badge */}
          <div className="repay-badge-row mt-4">
            <div className="repay-badge-icon">🏆</div>
            <div>
              <div className="font-semibold text-sm">On-Time Payer ✓</div>
              <div className="text-xs text-muted">{paidCount} consecutive on-time payments</div>
            </div>
          </div>
        </div>

        {/* Repayment Schedule — calendar-style */}
        <div className="card animate-fade-in-up stagger-2">
          <div className="card-title mb-4">Repayment Schedule</div>
          <div className="schedule-grid" role="list" aria-label="Weekly repayment schedule">
            {activeLoan.schedule.map((s, i) => {
              const isPaid = i < paidCount;
              const isNext = i === paidCount;
              return (
                <div
                  key={s.week}
                  className={`schedule-item ${isPaid ? 'paid' : ''} ${isNext ? 'next' : ''}`}
                  role="listitem"
                  aria-label={`Week ${s.week}: ₹${s.amount} on ${s.date} — ${isPaid ? 'Paid' : isNext ? 'Due next' : 'Upcoming'}`}
                >
                  <div className="schedule-week">Wk {s.week}</div>
                  <div className="schedule-date text-xs">{s.date}</div>
                  <div className="schedule-amount text-xs font-semibold">₹{s.amount.toLocaleString('en-IN')}</div>
                  <div className="schedule-status" aria-hidden="true">
                    {isPaid ? '✓' : isNext ? '⟳' : '○'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="schedule-legend mt-4">
            <span className="legend-item paid">✓ Paid</span>
            <span className="legend-item next">⟳ Due next</span>
            <span className="legend-item upcoming">○ Upcoming</span>
          </div>
        </div>
      </div>
    </section>
  );
};
