import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { MOCK_LOANS } from '../../data/mockData';
import { useToast } from '../../components/shared/ToastProvider';
import { fundPct, riskBadge } from '../../components/shared/SharedComponents';
import { LoanAgreementModal } from '../../components/shared/LoanAgreementModal';
import { fundLoan as dbFundLoan, createTransaction } from '../../utils/supabaseService';

// ─── Agreement status helper ─────────────────────────────────────────────────
const AgreementBadge = ({ lenderSigned, borrowerSigned }) => {
  if (lenderSigned && borrowerSigned) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, marginBottom: 16,
      }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.85rem' }}>Agreement Fully Signed</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>Both parties have signed. You can now release funds.</div>
        </div>
      </div>
    );
  }
  if (lenderSigned && !borrowerSigned) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: 'rgba(234,179,8,0.08)',
        border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, marginBottom: 16,
      }}>
        <span style={{ fontSize: 18 }}>⏳</span>
        <div>
          <div style={{ fontWeight: 700, color: '#B45309', fontSize: '0.85rem' }}>Awaiting Borrower Signature</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>Agreement sent. Waiting for borrower to countersign on-chain.</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', background: 'rgba(59,130,246,0.07)',
      border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginBottom: 16,
    }}>
      <span style={{ fontSize: 18 }}>📝</span>
      <div>
        <div style={{ fontWeight: 700, color: '#1D4ED8', fontSize: '0.85rem' }}>Agreement Required</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>Review & sign the loan agreement before releasing funds.</div>
      </div>
    </div>
  );
};

export const FundLoanPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const showToast = useToast();
  const { contract, account, rtkContract, trustScore, refreshTrustScore, isRegistered, refreshRTKBalance } = useContext(Web3Context);
  const { kycCompleted, user } = useContext(AppContext);

  const loan = location.state?.loan || MOCK_LOANS[0];

  // For blockchain loans principal is stored; for mocks fallback to amount
  const principal = loan.principal ?? loan.amount;
  const isBlockchainLoan = typeof loan.id === 'number' && loan.borrowerAddress;

  const remainingAmount = loan.amount ? loan.amount - (loan.funded || 0) : principal;
  const [fundAmount, setFundAmount] = useState(isBlockchainLoan ? principal : Math.min(remainingAmount, 2000));

  // ─── Agreement state ──────────────────────────────────────────────────────
  const [agreementOpen, setAgreementOpen]       = useState(false);
  const [signingAgreement, setSigningAgreement] = useState(false);
  const [lenderSigned, setLenderSigned]         = useState(false);
  const [borrowerSigned, setBorrowerSigned]     = useState(false);

  // KYC Gate
  if (!kycCompleted) {
    return (
      <section className="screen active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>KYC Required</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '280px' }}>Complete your KYC verification before funding any loans.</p>
        <button className="btn btn-primary" onClick={() => navigate('/kyc')} id="kyc-gate-fund-btn">Complete KYC →</button>
      </section>
    );
  }

  const [funding, setFunding]     = useState(false);
  const [endorsing, setEndorsing] = useState(false);

  const pct            = fundPct(loan.funded ?? 0, principal);
  const interestRate   = loan.interestRate ?? (loan.riskTier === 'Low' ? 12 : loan.riskTier === 'Medium' ? 16 : 20);
  const expectedReturn = loan.totalOwed ?? Math.round(principal * (1 + interestRate / 100));
  const { cls, label } = riskBadge(loan.riskTier);

  // ─── Fetch live agreement status from chain ───────────────────────────────
  useEffect(() => {
    const fetchAgreementStatus = async () => {
      if (!contract || !isBlockchainLoan) return;
      try {
        const status = await contract.getAgreementStatus(loan.id);
        setLenderSigned(status.lenderSigned);
        setBorrowerSigned(status.borrowerSigned);
      } catch (e) {
        // Contract not redeployed yet — graceful fallback
        console.warn('getAgreementStatus not available, falling back to no-sig state');
      }
    };
    fetchAgreementStatus();
    const interval = setInterval(fetchAgreementStatus, 5000);
    return () => clearInterval(interval);
  }, [contract, isBlockchainLoan, loan.id]);

  // ─── Lender signs agreement ───────────────────────────────────────────────
  const handleLenderSign = async ({ esignName }) => {
    if (!contract || !account) {
      showToast('Connect MetaMask first!', 'error');
      return;
    }
    if (!isRegistered) {
      showToast('Please activate your on-chain identity first! Click the banner in the left sidebar.', 'error');
      return;
    }
    setSigningAgreement(true);
    try {
      showToast('Confirm your agreement signature in MetaMask…', 'info');
      const tx = await contract.signAgreementAsLender(loan.id);
      showToast('Waiting for blockchain confirmation…', 'info');
      await tx.wait();
      setLenderSigned(true);
      setAgreementOpen(false);
      showToast(`✅ Agreement signed as "${esignName}"! Waiting for borrower to countersign.`, 'success');
    } catch (err) {
      console.error(err);
      const msg = err.reason || err.message || '';
      if (msg.includes('already signed')) showToast('You have already signed this agreement.', 'info');
      else showToast('Signature failed: ' + msg, 'error');
    } finally {
      setSigningAgreement(false);
    }
  };

  // ─── Fund loan (only after both parties signed) ───────────────────────────
  const handleConfirm = async () => {
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first!', 'error');
      return;
    }
    if (!isRegistered) {
      showToast('Please activate your on-chain identity first! Click the banner in the left sidebar.', 'error');
      return;
    }

    // Soft guard on frontend too
    if (isBlockchainLoan && !(lenderSigned && borrowerSigned)) {
      showToast('Both parties must sign the agreement before funds can be released.', 'error');
      return;
    }

    setFunding(true);
    try {
      const loanId = isBlockchainLoan ? loan.id : 0;
      const valToSend = isBlockchainLoan ? principal : fundAmount;
      
      if (isBlockchainLoan) {
        // 1. Convert visible INR to 18-decimal token format
        const tokenAmount = ethers.parseUnits(valToSend.toString(), 18);

        if (rtkContract) {
          showToast('Please approve RTK token spending in MetaMask…', 'info');
          const trustChainAddress = await contract.getAddress();
          const approveTx = await rtkContract.approve(trustChainAddress, tokenAmount);
          showToast('Waiting for approval confirmation…', 'info');
          await approveTx.wait();
        }

        showToast('Please confirm the funding transaction in MetaMask…', 'info');
        
        // 2. Fund Loan on-chain
        const tx = await contract.fundLoan(loanId);
        showToast('Waiting for blockchain confirmation…', 'info');
        await tx.wait();
      } else {
         // Off-chain mock/DB loan
         showToast('Processing off-chain funding...', 'info');
         await new Promise(r => setTimeout(r, 1500)); // Simulate networking
      }
      
      showToast(`✅ ₹${Number(valToSend).toLocaleString('en-IN')} RTK funded! Agreement executed on-chain.`, 'success');
      if (refreshRTKBalance) await refreshRTKBalance();

      // Persist to Supabase if loan has a dbId, else save to local storage for demo
      if (loan.dbId && user?.id) {
        await dbFundLoan(loan.dbId, user.id);
        await createTransaction({
          userId: user.id,
          type: 'funded',
          actorName: user.name || user.full_name || 'Lender',
          amount: valToSend,
          relatedLoanId: loan.dbId,
        });
      } else if (!loan.dbId) {
         const prev = JSON.parse(localStorage.getItem('fundedMockLoans') || '[]');
         prev.push({ ...loan, amount: valToSend, status: 'active', funded_by: user?.id || 'mock', id: `mock-${Date.now()}` });
         localStorage.setItem('fundedMockLoans', JSON.stringify(prev));
      }
      navigate('/lender');
    } catch (err) {
      console.error(err);
      const msg = err.reason || err.message || '';
      if (msg.includes('agreement not fully signed')) {
        showToast('⛔ Smart contract rejected: Agreement not fully signed by both parties.', 'error');
      } else {
        showToast('Transaction failed: ' + msg, 'error');
      }
    } finally {
      setFunding(false);
    }
  };

  const handleEndorse = async () => {
    if (!contract || !account || !isBlockchainLoan) {
      showToast('Can only endorse blockchain borrowers.', 'error');
      return;
    }
    if (!isRegistered) {
      showToast('Please activate your on-chain identity first! Click the banner in the left sidebar.', 'error');
      return;
    }
    setEndorsing(true);
    try {
      showToast('Confirm endorsement in MetaMask…', 'info');
      const tx = await contract.endorseUser(loan.borrowerAddress);
      await tx.wait();
      showToast('🌟 Endorsement committed on-chain. Borrower Trust Score +5.', 'success');
      refreshTrustScore?.(account, contract);
    } catch (err) {
      console.error(err);
      if (err.reason?.includes('Already endorsed')) showToast('You have already endorsed this user.', 'error');
      else showToast('Endorsement failed: ' + (err.reason || err.message), 'error');
    } finally {
      setEndorsing(false);
    }
  };

  const bothSigned = lenderSigned && borrowerSigned;
  const canFund    = !isBlockchainLoan || bothSigned;

  return (
    <>
      {/* Agreement Modal */}
      <LoanAgreementModal
        isOpen={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        onSign={handleLenderSign}
        loan={{
          ...loan,
          borrower: loan.borrowerAddress || loan.borrower,
          totalOwed: expectedReturn,
        }}
        role="lender"
        trustScore={loan.trustScore ?? trustScore ?? 50}
        loading={signingAgreement}
      />

      <section className="screen active" aria-label="Fund Loan">
        <div className="loan-grid">
          {/* Left Col: Loan Details */}
          <div className="loan-scroll animate-fade-in-up">
            <div className="card-title text-2xl flex items-center gap-3">
              {loan.borrower}
              {isBlockchainLoan && <span className="pill pill-warning" style={{ fontSize: '10px' }}>⛓️ Web3 Identity</span>}
            </div>
            <div className="card-subtitle text-lg font-medium" style={{ color: 'var(--color-primary)' }}>
              {loan.purpose}
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
              <span className={`pill ${cls}`}>{label} risk</span>
              <span className="pill" style={{ background: '#F1F5F9' }}>{interestRate}% Return</span>
              <span className="pill" style={{ background: '#F1F5F9' }}>{loan.term}</span>
            </div>

            {!isBlockchainLoan && pct < 100 && (
              <div className="funding-progress-section" style={{ marginTop: 'var(--sp-6)' }}>
                <div className="progress-bar lg" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <div className="progress-value">₹{(loan.funded ?? 0).toLocaleString('en-IN')}</div>
                    <div className="text-sm text-muted">funded of ₹{principal.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{pct}%</div>
                </div>
              </div>
            )}

            <div className="divider" style={{ margin: 'var(--sp-6) 0' }} />

            <div className="card-title text-lg mb-4">Borrower Profile</div>
            <div className="stats-row">
              <div className="stat-col text-center">
                <div className="text-muted text-xs uppercase tracking-wider mb-1">Trust Score</div>
                <div className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>
                  {isBlockchainLoan ? loan.trustScore : (loan.score || 'A+')}
                </div>
              </div>
              <div className="divider-v" />
              <div className="stat-col text-center">
                <div className="text-muted text-xs uppercase tracking-wider mb-1">Repayments</div>
                <div className="text-2xl font-bold">{isBlockchainLoan ? loan.repaidCount : '12'}</div>
              </div>
              <div className="divider-v" />
              <div className="stat-col text-center">
                <div className="text-muted text-xs uppercase tracking-wider mb-1">Endorsements</div>
                <div className="text-2xl font-bold">{isBlockchainLoan ? loan.endorsements : '8'}</div>
              </div>
            </div>

            {isBlockchainLoan && (
              <div style={{ marginTop: 'var(--sp-6)' }}>
                <button
                  className="btn btn-outline w-full"
                  onClick={handleEndorse}
                  disabled={endorsing}
                  id="endorse-fund-btn"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  {endorsing ? '⏳ Endorsing on blockchain...' : '🌟 Endorse this Borrower'}
                </button>
                <div className="text-xs text-center text-muted mt-2">
                  Stakes your reputation to boost their trust score.
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Funding Actions */}
          <div className="loan-sidebar animate-fade-in-up stagger-2">
            <div className="card" style={{ position: 'sticky', top: 'var(--sp-4)' }}>
              <div className="card-title mb-4">Commit Funds</div>

              {/* Agreement Status Badge */}
              {isBlockchainLoan && (
                <AgreementBadge lenderSigned={lenderSigned} borrowerSigned={borrowerSigned} />
              )}

              {!isBlockchainLoan ? (
                <div className="form-group mb-5">
                  <label className="form-label" htmlFor="fund-amount-slider">
                    Amount to Fund (₹)
                    <span className="form-label-value">₹{fundAmount.toLocaleString('en-IN')}</span>
                  </label>
                  <input
                    type="range"
                    id="fund-amount-slider"
                    className="amount-slider"
                    min="500"
                    max={remainingAmount}
                    step="500"
                    value={fundAmount}
                    onChange={e => setFundAmount(parseInt(e.target.value))}
                  />
                </div>
              ) : (
                <div className="form-group mb-5">
                  <div className="security-hint">
                    This on-chain loan requires a single flat funding of the exact principal: <strong>₹{Number(principal).toLocaleString('en-IN')}</strong>.
                  </div>
                </div>
              )}

              <div className="summary-card" style={{ background: '#F8FAFC', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--sp-4)' }}>
                <div className="summary-row mb-3">
                  <span className="text-muted text-sm">Principal</span>
                  <span className="font-medium text-sm">₹{isBlockchainLoan ? Number(principal).toLocaleString('en-IN') : fundAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row mb-3">
                  <span className="text-muted text-sm">Expected Return</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--color-success)' }}>
                    +₹{isBlockchainLoan ? (expectedReturn - Number(principal)).toLocaleString('en-IN') : Math.round(fundAmount * (interestRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="divider mb-3" style={{ opacity: 0.5 }} />
                <div className="summary-row">
                  <span className="font-medium">Total Received</span>
                  <span className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
                    ₹{isBlockchainLoan ? Number(expectedReturn).toLocaleString('en-IN') : Math.round(fundAmount * (1 + interestRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Step 1: Review Agreement (only for blockchain loans) */}
              {isBlockchainLoan && !lenderSigned && (
                <button
                  className="btn btn-outline w-full mb-3"
                  onClick={() => setAgreementOpen(true)}
                  style={{ borderColor: '#3B9B9B', color: '#3B9B9B', padding: 'var(--sp-3)' }}
                  id="review-agreement-btn"
                >
                  📋 Review & Sign Agreement
                </button>
              )}

              {/* Step 2: Release Funds */}
              <button
                className="btn btn-primary w-full"
                style={{
                  padding: 'var(--sp-3) var(--sp-4)',
                  fontSize: '1rem',
                  opacity: canFund ? 1 : 0.5,
                  cursor: canFund ? 'pointer' : 'not-allowed',
                }}
                onClick={handleConfirm}
                disabled={funding || (isBlockchainLoan && !bothSigned)}
                id="confirm-fund-btn"
                title={isBlockchainLoan && !bothSigned ? 'Both parties must sign the agreement first' : ''}
              >
                {funding
                  ? 'Confirming on Blockchain...'
                  : isBlockchainLoan && !bothSigned
                    ? '🔒 Release Funds (Agreement Pending)'
                    : 'Sign & Release Funds 💸'}
              </button>

              <div className="text-center font-monospace mt-3" style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {isBlockchainLoan
                  ? bothSigned ? '✅ Agreement fully executed — safe to fund' : '⚠️ Agreement signatures required before funding'
                  : 'Protected by TrustChain Smart Contract'}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
