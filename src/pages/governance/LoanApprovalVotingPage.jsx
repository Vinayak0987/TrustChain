import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { MOCK_GOV_LOAN } from '../../data/mockData';
import { VoteBar } from '../../components/shared/SharedComponents';
import { useToast } from '../../components/shared/ToastProvider';
import { castGovernanceVote, fetchUserVote, fetchVoteTallies } from '../../utils/supabaseService';

const CASE_ID = 'gov-loan-001';
const CASE_TYPE = 'loan_approval';

export const LoanApprovalVotingPage = () => {
  const { user } = useContext(AppContext);
  const showToast = useToast();
  const [govLoan] = useState(MOCK_GOV_LOAN);
  const [localVotes, setLocalVotes] = useState({ approve: govLoan.votesApprove, reject: govLoan.votesReject });
  const [hasVotedGov, setHasVotedGov] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load existing vote and tallies from Supabase
  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const [myVote, tallies] = await Promise.all([
        fetchUserVote({ userId: user.id, caseId: CASE_ID, caseType: CASE_TYPE }),
        fetchVoteTallies({ caseId: CASE_ID, caseType: CASE_TYPE }),
      ]);
      setHasVotedGov(myVote);
      if (Object.keys(tallies).length > 0) {
        setLocalVotes({
          approve: (tallies.approve || 0) + govLoan.votesApprove,
          reject: (tallies.reject || 0) + govLoan.votesReject,
        });
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleVote = async (vote) => {
    if (hasVotedGov) return;
    setHasVotedGov(vote);
    setLocalVotes(prev => ({
      approve: prev.approve + (vote === 'approve' ? 1 : 0),
      reject: prev.reject + (vote === 'reject' ? 1 : 0),
    }));
    showToast(`Vote recorded: ${vote === 'approve' ? 'Approved ✓' : 'Rejected ✗'}`, 'success');

    if (user?.id) {
      const { error } = await castGovernanceVote({
        userId: user.id,
        caseId: CASE_ID,
        caseType: CASE_TYPE,
        vote,
      });
      if (error) {
        showToast('Failed to save vote. Please try again.', 'error');
        setHasVotedGov(null);
      }
    }
  };

  const totalVotes = localVotes.approve + localVotes.reject;
  const approvePct = Math.round((localVotes.approve / govLoan.totalVoters) * 100);
  const autoOutcome = approvePct >= govLoan.threshold ? 'approved' : 'rejected';

  const statusIcon = { pass: '✅', warn: '⚠️', fail: '❌' };
  const statusPill = { pass: 'pill-success', warn: 'pill-warning', fail: 'pill-danger' };

  return (
    <section className="screen active" aria-label="Loan Approval Voting">
      <div className="gov-grid">
        <div className="card animate-fade-in-up">
          <div className="loan-panel-header mb-5">
            <div>
              <div className="card-title">Loan Approval Vote</div>
              <div className="card-subtitle">Case #{govLoan.id.toUpperCase()} · Requires 51% majority</div>
            </div>
            <span className="pill pill-warning">🗳️ Voting</span>
          </div>

          {/* Borrower card */}
          <div className="borrower-summary-card mb-5">
            <div className="avatar avatar-lg" style={{ background: govLoan.avatarColor }}>{govLoan.initials}</div>
            <div className="borrower-summary-info">
              <div className="font-semibold">{govLoan.borrower}</div>
              <div className="text-xs text-muted">Requesting ₹{govLoan.amount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-muted">{govLoan.purpose}</div>
            </div>
          </div>

          {/* Risk breakdown */}
          <div className="card mb-5" style={{ background: 'var(--color-bg)' }}>
            <div className="card-title mb-3">Risk Breakdown</div>
            {govLoan.riskFactors.map(f => (
              <div key={f.label} className="factor-row">
                <span className="text-sm">{statusIcon[f.status]} {f.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{f.detail}</span>
                  <span className={`pill text-xs ${statusPill[f.status]}`}>
                    {f.status === 'pass' ? 'Pass' : f.status === 'warn' ? 'Caution' : 'Fail'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Vote buttons */}
          <div className="vote-buttons-row mb-5">
            <button
              className={`btn vote-btn-legitimate ${hasVotedGov === 'approve' ? 'selected' : ''}`}
              id="vote-approve-btn"
              onClick={() => handleVote('approve')}
              disabled={!!hasVotedGov || loading || !user?.id}
              aria-pressed={hasVotedGov === 'approve'}
            >
              ✅ Approve Loan
            </button>
            <button
              className={`btn vote-btn-suspicious ${hasVotedGov === 'reject' ? 'selected' : ''}`}
              id="vote-reject-btn"
              onClick={() => handleVote('reject')}
              disabled={!!hasVotedGov || loading || !user?.id}
              aria-pressed={hasVotedGov === 'reject'}
            >
              ❌ Reject Loan
            </button>
          </div>

          {!user?.id && !loading && (
            <div className="trust-hint" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
              ⚠️ Please sign in to cast your vote.
            </div>
          )}

          {/* Live vote tally */}
          <div className="card" style={{ background: 'var(--color-bg)' }}>
            <div className="card-title mb-3">Live Vote Tally</div>
            <VoteBar
              forVotes={localVotes.approve}
              against={localVotes.reject}
              total={govLoan.totalVoters}
              forLabel="Approve"
              againstLabel="Reject"
              forColor="var(--color-success)"
              againstColor="var(--color-danger)"
            />
            <div className="threshold-note mt-3 text-xs text-muted">
              Auto-outcome triggers at <strong>{govLoan.threshold}% approval</strong>. Currently at {approvePct}%.
            </div>

            {hasVotedGov && (
              <div
                className="trust-hint mt-4"
                style={{ color: autoOutcome === 'approved' ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                <strong>Projected Outcome:</strong>{' '}
                {autoOutcome === 'approved'
                  ? '✅ Loan approved — community has crossed the 51% threshold.'
                  : '❌ Loan rejected — not enough community approval.'}
              </div>
            )}
            {hasVotedGov && (
              <div className="text-xs text-muted text-center mt-2">
                ✓ Your vote has been saved to the database
              </div>
            )}
          </div>
        </div>

        {/* Right — Governance explainer */}
        <div className="card animate-fade-in-up stagger-2">
          <div className="card-title mb-4">Community Governance</div>
          <div className="tips-list mb-5">
            <div className="tip-row"><span>🗳️</span><span className="text-sm">All loan approvals above ₹10,000 go to community vote</span></div>
            <div className="tip-row"><span>⚖️</span><span className="text-sm">51% majority of active voters decides the outcome</span></div>
            <div className="tip-row"><span>⏱️</span><span className="text-sm">Voting window is 48 hours from loan submission</span></div>
            <div className="tip-row"><span>🔒</span><span className="text-sm">Your vote is stored securely — community sees only totals</span></div>
          </div>

          <div className="card mb-4" style={{ background: '#EEEDFE', border: '1px solid #AFA9EC' }}>
            <div className="font-semibold text-sm mb-2" style={{ color: '#534AB7' }}>Why governance matters</div>
            <div className="text-xs" style={{ color: '#534AB7', lineHeight: 1.7 }}>
              This replaces the bank loan officer. The community decides who gets funded — removing bias and gatekeeping from the process.
            </div>
          </div>

          <div className="vote-progress-summary">
            <div className="text-sm font-medium mb-2">Participation</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(totalVotes / govLoan.totalVoters) * 100}%`, background: 'var(--color-primary)' }} />
            </div>
            <div className="text-xs text-muted mt-1">{totalVotes} of {govLoan.totalVoters} eligible voters have cast votes</div>
          </div>
        </div>
      </div>
    </section>
  );
};
