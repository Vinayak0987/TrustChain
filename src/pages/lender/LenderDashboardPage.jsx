import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { AppContext } from '../../context/AppContext';
import { Web3Context } from '../../context/Web3Context';
import { useToast } from '../../components/shared/ToastProvider';
import { StatCard } from '../../components/shared/SharedComponents';
import { fetchLenderLoans } from '../../utils/supabaseService';

// ─── Utility ──────────────────────────────────────────────────────────────────
const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
const pill = (status) => {
  if (status === 0) return { cls: 'pill-warning', label: 'Pending' };
  if (status === 1) return { cls: 'pill-success', label: 'Active' };
  if (status === 2) return { cls: 'pill-success', label: 'Repaid ✓' };
  return { cls: 'pill-danger', label: 'Unknown' };
};

export const LenderDashboardPage = () => {
  const navigate  = useNavigate();
  const showToast = useToast();
  const { lenderData, user } = useContext(AppContext);
  const { contract, account, trustScore } = useContext(Web3Context);

  const [portfolio, setPortfolio]   = useState(null);
  const [dbLoans, setDbLoans]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [endorsing, setEndorsing]   = useState(null);

  // ─── Fetch all loans funded by the connected account ──────────────────────
  const fetchPortfolio = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }
    try {
      const count   = await contract.getLoanCount();
      const myLoans = [];

      for (let i = 0; i < Number(count); i++) {
        const l = await contract.loans(i);
        if (l.funder.toLowerCase() === account.toLowerCase()) {
          myLoans.push({
            id:           Number(l.id),
            borrower:     l.borrower,
            principal:    Number(ethers.formatEther(l.principal)),
            interestRate: Number(l.interestRate),
            totalOwed:    Number(ethers.formatEther(l.totalOwed)),
            purpose:      l.purpose,
            status:       Number(l.status),
          });
        }
      }

      const totalDeployed = myLoans.reduce((s, l) => s + l.principal, 0);
      const totalExpected = myLoans.reduce((s, l) => s + l.totalOwed, 0);
      const totalRepaid   = myLoans
        .filter(l => l.status === 2)
        .reduce((s, l) => s + l.totalOwed, 0);
      const outstanding = myLoans.filter(l => l.status === 1);
      const repaidCount = myLoans.filter(l => l.status === 2).length;

      setPortfolio({ myLoans, totalDeployed, totalExpected, totalRepaid, outstanding, repaidCount });
    } catch (e) {
      console.error('Portfolio fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbLoans = async () => {
    if (!user?.id) return;
    try {
      const loans = await fetchLenderLoans(user.id);
      setDbLoans(loans);
    } catch (e) {
      console.error('Failed to fetch DB loans:', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPortfolio(), fetchDbLoans()]);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [contract, account, user?.id]);

  // ─── Endorse borrower from portfolio ──────────────────────────────────────
  const handleEndorse = async (borrowerAddress) => {
    if (!contract) return;
    setEndorsing(borrowerAddress);
    try {
      showToast('Confirm endorsement in MetaMask…', 'info');
      const tx = await contract.endorseUser(borrowerAddress);
      await tx.wait();
      showToast("🌟 Endorsement committed on-chain! Borrower's Trust Score +5.", 'success');
      await fetchPortfolio();
    } catch (err) {
      const reason = err.reason || err.message || '';
      if (reason.includes('Already endorsed')) showToast('You already endorsed this borrower!', 'error');
      else showToast('Endorsement failed: ' + reason, 'error');
    } finally {
      setEndorsing(null);
    }
  };

  if (loading) {
    return (
      <section className="screen active" aria-label="Lender Dashboard">
        <div className="card text-center" style={{ padding: 'var(--sp-10)' }}>
          <div className="card-subtitle">⛓️ Scanning blockchain for your portfolio…</div>
        </div>
      </section>
    );
  }

  // Derive stats (mixing AppContext mockup with real blockchain if available)
  const p = portfolio;
  const blockchainTotalLent = p ? p.totalDeployed : 0;
  const dbTotalLent = dbLoans.reduce((s, l) => s + (l.amount || l.principal), 0);
  const displayTotalLent = (lenderData?.totalLent || 0) + blockchainTotalLent + dbTotalLent;
  
  const blockchainActiveCount = p ? p.outstanding.length : 0;
  const dbActiveCount = dbLoans.filter(l => l.status === 'active' || l.status === 'funded').length;
  const displayActiveLoans = (lenderData?.activeLoans || 0) + blockchainActiveCount + dbActiveCount;

  const totalInterest = p ? p.totalExpected - p.totalDeployed : 0;
  
  const onChainLoans = p ? p.myLoans : [];
  const dbFormattedLoans = dbLoans.map(l => ({
    id: l.dbId || l.id,
    borrower: l.walletAddress || '0x000...000',
    borrowerName: l.profiles?.full_name || l.borrower || 'Anonymous',
    purpose: l.purpose,
    principal: l.amount || l.principal,
    totalOwed: l.total_owed || l.totalOwed || Math.round((l.amount || l.principal) * 1.15),
    interestRate: l.interest_rate || l.interestRate || 15,
    status: l.status === 'funded' || l.status === 'active' ? 1 : 0,
    isOffChain: true
  }));
  const allLoans = [...onChainLoans, ...dbFormattedLoans];

  const repaymentRate = allLoans.length > 0
    ? Math.round(((p?.repaidCount || 0) / allLoans.length) * 100) : 0;

  return (
    <section className="screen active" aria-label="Lender Dashboard">
      <div className="page-header-row">
        <div>
          <h2 className="page-title-lg">Lender Portfolio</h2>
          <div className="card-subtitle">Your complete on-chain investment overview</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          {trustScore !== null && (
            <span className="pill pill-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              ⛓️ Trust Score: <strong style={{ marginLeft: 4 }}>{trustScore}</strong>
            </span>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/loans')} id="browse-more-loans-btn">
            + Fund More Loans
          </button>
        </div>
      </div>

      {/* Stat cards overlay */}
      <div className="stat-cards-grid animate-fade-in-up stagger-1">
        <StatCard label="Total Lent" value={`₹${displayTotalLent.toLocaleString('en-IN')}`}
          sub="Across all loans" color="var(--color-warning)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="5" width="18" height="12" rx="2"/><path d="M1 9h18"/></svg>} />
        <StatCard label="Interest Earned" value={`₹${(lenderData?.interestEarned || 0).toLocaleString('en-IN')}`}
          sub="Net returns" color="var(--color-success)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 15l5-7 4 3 4-6 5 3"/></svg>} />
        <StatCard label="Active Loans" value={displayActiveLoans}
          sub="Currently funded" color="var(--color-primary)"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2L3 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-4z"/></svg>} />
        <StatCard label="Repayments Received" value={`₹${((lenderData?.repaymentsReceived || 0) + (p?.totalRepaid || 0)).toLocaleString('en-IN')}`}
          sub="Returned to you" color="#185FA5"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 10H2M8 4l-6 6 6 6"/></svg>} />
      </div>

      {/* Portfolio Health Overview */}
      <div className="card animate-fade-in-up stagger-2 mb-5 mt-5">
        <div className="loan-panel-header">
          <div>
            <div className="card-title">On-Chain Portfolio Health</div>
            <div className="card-subtitle">Based on repayment performance of your smart contract funded loans</div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{allLoans.length} loans funded</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-4)', marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Expected Interest</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warning)' }}>
              +₹{totalInterest.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>across all active loans</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total Received</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>
              ₹{p?.totalRepaid.toLocaleString('en-IN') ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>repaid to your wallet</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Repayment Rate</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: repaymentRate >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {repaymentRate}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{p?.repaidCount || 0}/{allLoans.length} loans closed</div>
          </div>
        </div>
      </div>

      {/* ── Loan List ── */}
      {allLoans.length === 0 ? (
        <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: 'var(--sp-10)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💼</div>
          <div className="card-title mb-2">No loans funded yet</div>
          <div className="card-subtitle mb-5">Browse open loan requests and start earning on-chain returns.</div>
          <button className="btn btn-primary" onClick={() => navigate('/loans')} id="go-browse-btn">
            Browse Loan Requests →
          </button>
        </div>
      ) : (
        <div className="card animate-fade-in-up">
          <div className="card-title mb-4">Funded Loans</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Loan ID</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Borrower</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Purpose</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Principal</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Total Return</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allLoans.map((loan, idx) => {
                  const { cls, label } = pill(loan.status);
                  const isRepaid = loan.status === 2;
                  return (
                    <tr key={loan.id} style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
                    }}>
                      <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        #{String(loan.id).replace('mock-', '').substring(0, 5)}
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: '0.8rem' }}>
                        {loan.isOffChain ? (loan.borrowerName || shortAddr(loan.borrower)) : <span style={{fontFamily: 'monospace'}}>{shortAddr(loan.borrower)}</span>}
                      </td>
                      <td style={{ padding: '12px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {loan.purpose}
                      </td>
                      <td style={{ padding: '12px 12px', fontWeight: 600 }}>₹{loan.principal.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--color-warning)' }}>
                        ₹{loan.totalOwed.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span className={`pill text-xs ${loan.interestRate === 12 ? 'pill-success' : loan.interestRate === 16 ? 'pill-warning' : 'pill-danger'}`}>
                          {loan.interestRate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span className={`pill text-xs ${cls}`}>{label}</span>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        {!isRepaid && !loan.isOffChain ? (
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: '#3B9B9B', color: '#3B9B9B' }}
                            disabled={endorsing === loan.borrower}
                            onClick={() => handleEndorse(loan.borrower)}
                            id={`endorse-portfolio-${loan.id}`}
                          >
                            {endorsing === loan.borrower ? '⏳' : '🌟 Endorse'}
                          </button>
                        ) : !isRepaid && loan.isOffChain ? (
                          <span style={{ color: 'var(--color-text)', fontSize: '0.8rem' }}>Off-chain</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>✓ Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Portfolio ROI summary footer */}
          {allLoans.length > 0 && (
            <div style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span className="text-sm text-muted">
                📊 Total outstanding: <strong>₹{((p?.totalDeployed || 0) - (p?.totalRepaid || 0)).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-sm text-muted">
                💰 Unrealised income: <strong style={{ color: 'var(--color-warning)' }}>₹{(totalInterest - (p?.totalRepaid > 0 ? totalInterest * p.repaidCount / p.myLoans.length : 0)).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-sm text-muted">
                ⛓️ Mixed On/Off-chain Data
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
