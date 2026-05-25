import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Button } from '../components/shared/useRipple';
import { useToast } from '../components/shared/ToastProvider';
import { RiskPanel } from '../components/loan/RiskPanel';
import { calcLoan } from '../utils/formatters';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const LoanPage = () => {
  const { podStrength, verification } = useContext(AppContext);
  const showToast = useToast();
  useScrollAnimation('.animate-fade-in-up');

  const [amount, setAmount] = useState('10000');
  const [weeks, setWeeks] = useState(8);
  const [weeklyPayment, setWeeklyPayment] = useState(0);

  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    const data = calcLoan(amt, weeks, podStrength, verification);
    setWeeklyPayment(data.weekly);
  }, [amount, weeks, podStrength, verification]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseInt(amount) < 1000) {
      showToast('Please enter an amount of at least ₹1,000', 'error');
      return;
    }
    
    window.showTcDialog(
      'Confirm Loan Request',
      `You are requesting ₹${parseInt(amount).toLocaleString('en-IN')} for ${weeks} weeks. Your pod 'Sunrise Riders' will guarantee this loan. Proceed?`,
      () => showToast(`Request for ₹${parseInt(amount).toLocaleString('en-IN')} submitted to your pod for approval.`, 'success')
    );
  };

  return (
    <section className="screen active" aria-label="Request a loan">
      <div className="loan-grid">
        <form className="card animate-fade-in-up" onSubmit={handleSubmit}>
          <div className="card-title mb-6">New Loan Application</div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="react-loan-amount">I need to borrow (₹)</label>
            <div className="input-with-icon">
              <span className="input-icon">₹</span>
              <input 
                type="number" 
                className="form-control text-lg font-semibold" 
                id="react-loan-amount" 
                placeholder="Ex. 5000" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000" 
                max="50000"
              />
            </div>
            <div className="form-hint mt-2">Available limit based on pod: ₹25,000</div>
          </div>

          <div className="form-group mt-6">
            <label className="form-label">I'll repay it over</label>
            <div className="duration-grid">
              {[4, 8, 12].map(d => (
                <button 
                  type="button"
                  key={d}
                  className={`btn-duration ${weeks === d ? 'active' : ''}`} 
                  onClick={() => setWeeks(d)}
                >
                  <div className="font-semibold">{Math.ceil(d / 4)} {Math.ceil(d / 4) === 1 ? 'Month' : 'Months'}</div>
                  <div className="text-xs text-muted">{d} weeks</div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group mt-6">
            <label className="form-label" htmlFor="react-loan-purpose">Primary purpose</label>
            <select className="form-control" id="react-loan-purpose" defaultValue="equipment">
              <option value="equipment">Business Equipment / Inventory</option>
              <option value="medical">Medical Emergency</option>
              <option value="education">Education / Certification</option>
              <option value="other">Other / Personal</option>
            </select>
          </div>

          <div className="live-estimate-panel mt-6" aria-live="polite">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted text-sm">Estimated Weekly Payment</span>
              <span className="font-semibold text-lg">₹{weeklyPayment.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-muted">Includes principal and interest based on your current Trust Score and Pod guarantee.</p>
          </div>

          <div className="mt-8">
            <Button type="submit" variant="primary" className="w-full">
              Submit Request
            </Button>
            <div className="text-center text-xs text-muted mt-4">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', width: '12px', height: '12px', marginRight: '4px', verticalAlign: '-1px'}}>
                <path d="M8 1L2 4v5c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V4L8 1z"/>
              </svg>
              Prototype: No real funds will be transferred.
            </div>
          </div>
        </form>

        <RiskPanel />
      </div>
    </section>
  );
};
