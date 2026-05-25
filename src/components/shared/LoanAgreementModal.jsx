import React, { useState, useRef, useEffect } from 'react';

/**
 * LoanAgreementModal
 * 
 * A premium fintech-grade agreement popup for the TrustChain P2P lending platform.
 * Supports both LENDER (proposing) and BORROWER (countersigning) flows.
 * 
 * Props:
 *   isOpen        {boolean}  - controls visibility
 *   onClose       {function} - called when user closes without signing
 *   onSign        {function} - called with { esignName } when user clicks sign
 *   loan          {object}   - loan data (id, principal, interestRate, totalOwed, purpose, borrower/address)
 *   role          {'lender'|'borrower'} - which party is signing
 *   lenderAddress {string}   - lender wallet address (for borrower view)
 *   trustScore    {number}   - borrower's trust score snapshot
 *   loading       {boolean}  - show spinner on sign button
 */
export const LoanAgreementModal = ({
  isOpen,
  onClose,
  onSign,
  loan,
  role = 'lender',
  lenderAddress = '',
  trustScore = 50,
  loading = false,
}) => {
  const [checks, setChecks] = useState({ risk: false, uninsured: false, dispute: false });
  const [esign, setEsign] = useState('');
  const [esignError, setEsignError] = useState('');
  const scrollRef = useRef(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setChecks({ risk: false, uninsured: false, dispute: false });
      setEsign('');
      setEsignError('');
      setScrolledToBottom(false);
    }
  }, [isOpen]);

  // Track scroll to bottom of agreement body
  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  if (!isOpen || !loan) return null;

  const allChecked = checks.risk && checks.uninsured && checks.dispute;
  const esignValid = esign.trim().split(/\s+/).length >= 2;
  const canSign = allChecked && esignValid && scrolledToBottom;

  const principalFmt  = Number(loan.principal).toLocaleString('en-IN');
  const totalOwedFmt  = Number(loan.totalOwed).toLocaleString('en-IN');
  const interestAmt   = Number(loan.totalOwed) - Number(loan.principal);
  const interestFmt   = interestAmt.toLocaleString('en-IN');
  const rate          = Number(loan.interestRate);

  // Derive an approximate due date (30 * 3 days for 3-month default)
  const dueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const agreementStatus = () => {
    if (role === 'lender') return { label: 'Draft — Awaiting Your Signature', color: '#B45309', bg: '#FEF3C7' };
    return { label: 'Awaiting Your Counter-Signature', color: '#1D4ED8', bg: '#DBEAFE' };
  };
  const { label: statusLabel, color: statusColor, bg: statusBg } = agreementStatus();

  const handleSign = () => {
    if (!esignValid) {
      setEsignError('Please enter your full name (first + last) to e-sign.');
      return;
    }
    setEsignError('');
    onSign?.({ esignName: esign.trim() });
  };

  const toggle = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(10,15,26,0.72)',
          backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Loan Agreement"
      >
        {/* Modal card */}
        <div style={{
          background: 'var(--color-bg)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '22px 28px 18px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #3B9B9B, #185FA5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>⚖️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-heading)' }}>
                    Peer-to-Peer Loan Agreement
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                    Loan #{loan.id} · TrustChain Protocol
                  </div>
                </div>
              </div>
              {/* Status pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20,
                background: statusBg, color: statusColor,
                fontSize: '0.72rem', fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                {statusLabel}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-muted)', fontSize: 20, padding: 4, lineHeight: 1,
                borderRadius: 6, flexShrink: 0,
              }}
              aria-label="Close agreement"
              id="close-agreement-modal"
            >✕</button>
          </div>

          {/* Hint to scroll */}
          {!scrolledToBottom && (
            <div style={{
              background: 'rgba(59,155,155,0.08)',
              borderBottom: '1px solid rgba(59,155,155,0.15)',
              padding: '8px 28px',
              fontSize: '0.73rem', color: '#3B9B9B', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              📜 Please scroll through the entire agreement before signing
            </div>
          )}

          {/* Scrollable Agreement Body */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              flex: 1, overflowY: 'auto', padding: '24px 28px',
              fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--color-text)',
            }}
          >
            {/* Section 1: Parties */}
            <section style={{ marginBottom: 24 }}>
              <div style={sectionHeadingStyle}>§1. Parties</div>
              <div style={termRowStyle}>
                <span style={termLabelStyle}>Borrower (the "Recipient")</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                  {loan.borrower || loan.borrowerAddress}
                </span>
              </div>
              <div style={termRowStyle}>
                <span style={termLabelStyle}>Lender (the "Financer")</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#185FA5', wordBreak: 'break-all' }}>
                  {role === 'lender' ? 'You (signing now)' : (lenderAddress || 'Pending')}
                </span>
              </div>
              <div style={termRowStyle}>
                <span style={termLabelStyle}>Platform</span>
                <span>TrustChain Protocol — Ethereum Testnet (Chain ID 31337)</span>
              </div>
            </section>

            {/* Section 2: Loan Details */}
            <section style={{ marginBottom: 24 }}>
              <div style={sectionHeadingStyle}>§2. Loan Details</div>
              <div style={termTableStyle}>
                <div style={termRowStyle}>
                  <span style={termLabelStyle}>Purpose of Loan</span>
                  <span style={{ fontStyle: 'italic' }}>"{loan.purpose}"</span>
                </div>
                <div style={termRowStyle}>
                  <span style={termLabelStyle}>Principal Amount</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{principalFmt}</span>
                </div>
                <div style={termRowStyle}>
                  <span style={termLabelStyle}>Flat Interest Rate</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>{rate}% per annum</span>
                </div>
                <div style={termRowStyle}>
                  <span style={termLabelStyle}>Total Interest Due</span>
                  <span>₹{interestFmt}</span>
                </div>
                <div style={{ ...termRowStyle, borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontWeight: 700 }}>Total Repayable</span>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>₹{totalOwedFmt}</span>
                </div>
                <div style={termRowStyle}>
                  <span style={termLabelStyle}>Estimated Due Date</span>
                  <span>{dueDate}</span>
                </div>
                <div style={termRowStyle}>
                  <span style={termLabelStyle}>Borrower Trust Score</span>
                  <span style={{ fontWeight: 600, color: trustScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {trustScore} / 100
                  </span>
                </div>
              </div>
            </section>

            {/* Section 3: Risk & Disclaimers */}
            <section style={{ marginBottom: 24 }}>
              <div style={sectionHeadingStyle}>§3. Risk & Disclaimers</div>
              <div style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10, padding: '14px 16px',
                marginBottom: 12,
              }}>
                <div style={{ fontWeight: 600, color: '#DC2626', marginBottom: 6, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚠ High-Risk Disclosure
                </div>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text)' }}>
                  This is an <strong>uncollateralized, peer-to-peer loan</strong> issued entirely on the
                  basis of the borrower's on-chain TrustScore. There is{' '}
                  <strong>no collateral backing this loan</strong>. In the event of a default, the lender
                  may lose the entire principal amount with no legal recourse through traditional channels.
                </p>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.83rem' }}>
                <li>This loan is <strong>not a bank deposit</strong> and is not insured by any government body, NBFC, or financial regulator.</li>
                <li>TrustChain Protocol acts only as technology infrastructure. It does not guarantee repayment or act as a lender/borrower of last resort.</li>
                <li>Smart contract execution on the blockchain is irreversible. All transactions are final once confirmed.</li>
                <li>The interest rate of <strong>{rate}%</strong> is locked at the time of loan origination based on the borrower's TrustScore of <strong>{trustScore}</strong> and cannot be renegotiated after signing.</li>
                <li>Default penalties (future): Failure to repay reduces the borrower's TrustScore by up to 20 points, restricting future borrowing.</li>
              </ul>
            </section>

            {/* Section 4: Community & TrustScore */}
            <section style={{ marginBottom: 24 }}>
              <div style={sectionHeadingStyle}>§4. Community & TrustScore Context</div>
              <p style={{ margin: '0 0 10px', fontSize: '0.83rem' }}>
                This loan has been initiated under the <strong>TrustChain Community Credit</strong> system.
                The borrower's current on-chain TrustScore is <strong>{trustScore}</strong>,
                which qualifies them for the <strong>{rate}%</strong> flat interest tier.
              </p>
              <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-muted)' }}>
                Community endorsements and repayment history contribute to TrustScore progression.
                A borrower who successfully repays this loan earns +10 points, improving future loan rates.
              </p>
            </section>

            {/* Section 5: Governing Terms */}
            <section style={{ marginBottom: 8 }}>
              <div style={sectionHeadingStyle}>§5. Governing Terms</div>
              <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-muted)' }}>
                Any disputes arising from this agreement shall first be submitted to the TrustChain
                community governance mechanism. Both parties agree that the smart contract execution
                on the Ethereum network constitutes the legally binding execution of this agreement.
                This agreement is governed by the TrustChain Protocol Terms of Service.
              </p>
            </section>
          </div>

          {/* Signature Panel */}
          <div style={{
            borderTop: '1px solid var(--color-border)',
            padding: '20px 28px',
            background: 'var(--color-bg-subtle, #F8FAFC)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'risk', text: 'I understand that this is an uncollateralized, high-risk peer-to-peer loan and I may lose my funds.' },
                { key: 'uninsured', text: 'I confirm that these funds are not insured by any bank, government, or guarantee scheme.' },
                { key: 'dispute', text: 'I agree to resolve any disputes through the TrustChain community governance mechanisms.' },
              ].map(({ key, text }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex', gap: 10, cursor: 'pointer',
                    fontSize: '0.78rem', color: 'var(--color-text)',
                    alignItems: 'flex-start',
                    opacity: scrolledToBottom ? 1 : 0.45,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checks[key]}
                    onChange={() => toggle(key)}
                    disabled={!scrolledToBottom}
                    style={{ marginTop: 2, accentColor: '#3B9B9B', width: 14, height: 14, flexShrink: 0 }}
                    id={`check-${key}`}
                  />
                  {text}
                </label>
              ))}
            </div>

            {/* E-sign */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Electronic Signature
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Type your full name to e-sign (e.g. Priya Mehta)"
                  value={esign}
                  onChange={e => { setEsign(e.target.value); setEsignError(''); }}
                  disabled={!allChecked}
                  style={{
                    width: '100%',
                    border: esignValid && esign ? '1.5px solid var(--color-success)' : '1.5px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '10px 40px 10px 14px',
                    fontSize: '0.9rem',
                    fontFamily: 'cursive, serif',
                    background: allChecked ? 'var(--color-bg)' : 'rgba(0,0,0,0.03)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  id="esign-name-input"
                />
                {esignValid && esign && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-success)', fontSize: 16 }}>✓</span>
                )}
              </div>
              {esignError && <div style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: 4 }}>{esignError}</div>}
              {!allChecked && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: 4 }}>
                  ↑ Tick all checkboxes above to enable e-signing
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1, fontSize: '0.85rem' }}
                onClick={onClose}
                id="cancel-agreement-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{
                  flex: 2,
                  fontSize: '0.9rem',
                  opacity: canSign ? 1 : 0.45,
                  cursor: canSign ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.2s',
                }}
                onClick={handleSign}
                disabled={!canSign || loading}
                id={role === 'lender' ? 'lender-sign-btn' : 'borrower-sign-btn'}
                title={!scrolledToBottom ? 'Scroll through the agreement first' : !allChecked ? 'Tick all boxes' : !esignValid ? 'Enter your full name' : ''}
              >
                {loading
                  ? '⏳ Signing on-chain…'
                  : role === 'lender'
                    ? '✍️ Sign & Send to Borrower'
                    : '✍️ Sign & Approve Agreement'}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--color-muted)' }}>
              🔒 Cryptographically signed via MetaMask · Stored on Ethereum blockchain · Timestamp: {new Date().toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Style helpers ──────────────────────────────────────────────────────────
const sectionHeadingStyle = {
  fontWeight: 700,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-muted)',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 6,
  marginBottom: 12,
};

const termRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: '6px 0',
  borderBottom: '1px solid rgba(0,0,0,0.04)',
  flexWrap: 'wrap',
};

const termLabelStyle = {
  color: 'var(--color-muted)',
  fontSize: '0.8rem',
  flexShrink: 0,
  minWidth: 170,
};

const termTableStyle = {
  display: 'flex',
  flexDirection: 'column',
};
