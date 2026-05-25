import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../components/shared/ToastProvider';
import { fetchUserLoans, updateLoanStatus, createTransaction } from '../../utils/supabaseService';

export const RepaymentPage = () => {
  const { contract, account, rtkContract, trustScore, refreshTrustScore, refreshRTKBalance } = useContext(Web3Context);
  const { user, setTrustScore } = useContext(AppContext);
  const showToast = useToast();

  const [myChainLoans, setMyChainLoans] = useState([]);
  const [myDbLoans, setMyDbLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(null);

  // ── Fetch from blockchain ──────────────────────────────────────────────────
  const fetchChainLoans = async () => {
    if (!contract || !account) return;
    try {
      const count = await contract.getLoanCount();
      const result = [];
      for (let i = 0; i < Number(count); i++) {
        const l = await contract.loans(i);
        if (l.borrower.toLowerCase() === account.toLowerCase() && Number(l.status) === 1) {
          result.push({
            id: Number(l.id),
            realId: Number(l.id),
            principal: Number(ethers.formatEther(l.principal)),
            interestRate: Number(l.interestRate),
            totalOwed: Number(ethers.formatEther(l.totalOwed)),
            funder: l.funder,
            purpose: l.purpose,
            source: 'chain',
          });
        }
      }
      setMyChainLoans(result);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Fetch from Supabase ────────────────────────────────────────────────────
  const fetchDbLoans = async () => {
    if (!user?.id) return;
    const loans = await fetchUserLoans(user.id);
    setMyDbLoans(loans.filter(l => l.status === 'active' || l.status === 'pending'));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchChainLoans(), fetchDbLoans()]);
      setLoading(false);
    };
    load();
  }, [contract, account, user?.id]);

  // ── Repay on-chain ─────────────────────────────────────────────────────────

  // ── Mark DB loan as repaid ─────────────────────────────────────────────────
  const handleDbRepay = async (loan) => {
    setRepaying(`db-${loan.id}`);
    try {
      const { error } = await updateLoanStatus(loan.id, { status: 'repaid' });
      if (error) { showToast('Failed to update loan status.', 'error'); return; }

      if (user?.id) {
        const newScore = Math.min(100, (user.trustScore || 50) + 10);
        await setTrustScore(newScore);
        await createTransaction({
          userId: user.id,
          type: 'repaid',
          actorName: user.name || user.full_name || 'User',
          amount: loan.total_owed || loan.amount,
          relatedLoanId: loan.id,
        });
      }
      showToast('🎉 Loan marked as repaid! Trust Score +10.', 'success');
      await fetchDbLoans();
    } catch (err) {
      console.error(err);
      showToast('Repayment failed.', 'error');
    } finally {
      setRepaying(null);
    }
  };

  const handleRepay = async (loan) => {
    if (!contract || !account) {
      showToast('Please connect your MetaMask wallet first!', 'error');
      return;
    }
    setRepaying(`chain-${loan.id}`);
    try {
      if (loan.source === 'chain' || loan.funder) {
        const tokenAmount = ethers.parseUnits(loan.totalOwed.toString(), 18);

        if (rtkContract) {
          showToast('Please approve RTK token spending in MetaMask…', 'info');
          const trustChainAddress = await contract.getAddress();
          const approveTx = await rtkContract.approve(trustChainAddress, tokenAmount);
          showToast('Waiting for approval confirmation…', 'info');
          await approveTx.wait();
        }

        showToast(`Confirm repayment of ₹${loan.totalOwed.toLocaleString('en-IN')} in MetaMask…`, 'info');
        const tx = await contract.repayLoan(loan.realId || loan.id);
        showToast('Repayment submitted — waiting for blockchain confirmation…', 'info');
        await tx.wait();
      } else {
        await handleDbRepay(loan);
      }
      showToast('🎉 Loan fully repaid! Your TrustScore increased by +10!', 'success');
      
      if (user?.id) {
        const newScore = Math.min(100, (user.trustScore || 50) + 10);
        await setTrustScore(newScore);
        await createTransaction({
          userId: user.id,
          type: 'repaid',
          actorName: user.name || user.full_name || 'User',
          amount: loan.totalOwed,
        });
      }

      if (refreshTrustScore) await refreshTrustScore(account, contract);
      if (refreshRTKBalance) await refreshRTKBalance();
      await fetchChainLoans();
    } catch (err) {
      console.error(err);
      showToast('Repayment failed: ' + (err.reason || err.message), 'error');
    } finally {
      setRepaying(null);
    }
  };

  const noLoans = !loading && myChainLoans.length === 0 && myDbLoans.length === 0;

  return (
    <section className="screen active" aria-label="Repayment Tracker">
      <div className="page-header-row">
        <div>
          <h2 className="page-title-lg">Repayment Tracker</h2>
          <div className="card-subtitle">Repay your active funded loans</div>
        </div>
        {(trustScore !== null || user?.trustScore) && (
          <div className="pill pill-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            Trust Score: <strong style={{ marginLeft: 4 }}>{trustScore ?? user?.trustScore ?? 50}</strong>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card text-center text-muted" style={{ padding: 'var(--sp-10)' }}>
          Loading your active loans…
        </div>
      ) : noLoans ? (
        <div className="card animate-fade-in-up" style={{ padding: 'var(--sp-10)' }}>
          <div className="text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
            <div className="card-title mb-2">No active loans</div>
            <div className="card-subtitle">You have no funded loans awaiting repayment.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          {/* On-chain loans */}
          {myChainLoans.map(loan => {
            const interest = loan.totalOwed - loan.principal;
            const repayId = `chain-${loan.id}`;
            return (
              <div key={repayId} className="card animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="card-title" style={{ marginBottom: 2 }}>Loan #{loan.id} ⛓️</div>
                    <div className="card-subtitle">{loan.purpose}</div>
                  </div>
                  <span className="pill pill-warning">Active</span>
                </div>
                <div className="risk-factors-list mb-4">
                  <div className="factor-row">
                    <span className="text-sm text-muted">Principal Borrowed</span>
                    <span className="font-semibold">₹{loan.principal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row">
                    <span className="text-sm text-muted">Interest ({loan.interestRate}% flat)</span>
                    <span className="font-semibold" style={{ color: 'var(--color-warning)' }}>+ ₹{interest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span className="text-sm font-semibold">Total to Repay</span>
                    <span className="font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>₹{loan.totalOwed.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row">
                    <span className="text-sm text-muted">Funded by</span>
                    <span className="text-sm" style={{ fontFamily: 'monospace' }}>
                      {loan.funder.substring(0, 8)}…{loan.funder.substring(36)}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary w-full"
                  disabled={repaying === repayId}
                  onClick={() => handleRepay(loan)}
                  id={`repay-btn-chain-${loan.id}`}
                >
                  {repaying === repayId
                    ? '⏳ Confirming repayment…'
                    : `💸 Repay ₹${loan.totalOwed.toLocaleString('en-IN')} → Earn +10 Trust Score`}
                </button>
                <div className="text-center text-xs text-muted mt-2">
                  🔒 Funds routed directly to lender via Smart Contract
                </div>
              </div>
            );
          })}

          {/* Supabase loans (when no wallet / blockchain) */}
          {myDbLoans.map(loan => {
            const repayId = `db-${loan.id}`;
            const interest = (loan.total_owed || loan.amount) - loan.amount;
            return (
              <div key={repayId} className="card animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="card-title" style={{ marginBottom: 2 }}>{loan.purpose.slice(0, 50)}</div>
                    <div className="card-subtitle">{loan.period_months} month loan · {loan.risk_tier} risk</div>
                  </div>
                  <span className={`pill ${loan.status === 'active' ? 'pill-success' : 'pill-warning'}`}>
                    {loan.status === 'active' ? 'Active' : 'Pending Funding'}
                  </span>
                </div>
                <div className="risk-factors-list mb-4">
                  <div className="factor-row">
                    <span className="text-sm text-muted">Principal Borrowed</span>
                    <span className="font-semibold">₹{loan.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row">
                    <span className="text-sm text-muted">Interest ({loan.interest_rate}% flat)</span>
                    <span className="font-semibold" style={{ color: 'var(--color-warning)' }}>+ ₹{interest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="factor-row" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span className="text-sm font-semibold">Total to Repay</span>
                    <span className="font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>
                      ₹{(loan.total_owed || loan.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                {loan.status === 'active' && (
                  <button
                    className="btn btn-primary w-full"
                    disabled={repaying === repayId}
                    onClick={() => handleDbRepay(loan)}
                    id={`repay-btn-db-${loan.id}`}
                  >
                    {repaying === repayId
                      ? '⏳ Processing…'
                      : `💸 Mark as Repaid → Earn +10 Trust Score`}
                  </button>
                )}
                {loan.status === 'pending' && (
                  <div className="trust-hint" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                    ⏳ Awaiting a lender to fund this loan
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
