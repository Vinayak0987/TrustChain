import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { MOCK_FRAUD_CASE } from '../../data/mockData';
import { VoteBar } from '../../components/shared/SharedComponents';
import { useToast } from '../../components/shared/ToastProvider';
import { castGovernanceVote, fetchUserVote, fetchVoteTallies } from '../../utils/supabaseService';

const CASE_ID = 'fraud-001';
const CASE_TYPE = 'fraud';

export const FraudVotingPage = () => {
  const { user } = useContext(AppContext);
  const showToast = useToast();
  const [fraudCase] = useState(MOCK_FRAUD_CASE);
  const [localVotes, setLocalVotes] = useState({ for: fraudCase.votesFor, against: fraudCase.votesAgainst });
  const [hasVotedFraud, setHasVotedFraud] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load existing vote and tallies from Supabase on mount
  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const [myVote, tallies] = await Promise.all([
        fetchUserVote({ userId: user.id, caseId: CASE_ID, caseType: CASE_TYPE }),
        fetchVoteTallies({ caseId: CASE_ID, caseType: CASE_TYPE }),
      ]);
      setHasVotedFraud(myVote);
      if (Object.keys(tallies).length > 0) {
        setLocalVotes({
          for: (tallies.suspicious || 0) + fraudCase.votesFor,
          against: (tallies.legitimate || 0) + fraudCase.votesAgainst,
        });
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleVote = async (vote) => {
    if (hasVotedFraud) return;
    setHasVotedFraud(vote);
    setLocalVotes(prev => ({
      for: prev.for + (vote === 'suspicious' ? 1 : 0),
      against: prev.against + (vote === 'legitimate' ? 1 : 0),
    }));
    showToast(`Vote recorded: ${vote === 'suspicious' ? 'Suspicious 🚨' : 'Legitimate ✓'}`, 'success');

    // Persist to Supabase
    if (user?.id) {
      const { error } = await castGovernanceVote({
        userId: user.id,
        caseId: CASE_ID,
        caseType: CASE_TYPE,
        vote,
      });
      if (error) {
        showToast('Failed to save vote. Please try again.', 'error');
        setHasVotedFraud(null);
      }
    }
  };

  const totalVotes = localVotes.for + localVotes.against;
  const outcome = localVotes.for / totalVotes > 0.5 ? 'revoke' : 'approve';

  return (
    <section className="screen active" aria-label="Community Fraud Voting">
      <div className="gov-grid">
        <div className="card animate-fade-in-up">
          <div className="loan-panel-header mb-5">
            <div>
              <div className="card-title">Community Fraud Review</div>
              <div className="card-subtitle">Case #{fraudCase.id.toUpperCase()} · Active voting</div>
            </div>
            <span className="pill pill-danger">🚨 Flagged</span>
          </div>

          {/* Flagged loan details */}
          <div className="borrower-summary-card mb-5">
            <div className="avatar avatar-lg" style={{ background: '#888' }}>{fraudCase.initials}</div>
            <div className="borrower-summary-info">
              <div className="font-semibold">{fraudCase.borrower}</div>
              <div className="text-xs text-muted">Loan request: ₹{fraudCase.amount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-muted">Purpose: {fraudCase.purpose}</div>
            </div>
          </div>

          {/* Flag reason */}
          <div className="card mb-5" style={{ background: '#FFF0F0', border: '1px solid #FFCDD0' }}>
            <div className="font-semibold text-sm mb-2" style={{ color: 'var(--color-danger)' }}>⚠️ Flag Reason</div>
            <div className="text-sm">{fraudCase.flagReason}</div>
          </div>

          {/* Vote buttons */}
          <div className="vote-buttons-row mb-5">
            <button
              className={`btn vote-btn-suspicious ${hasVotedFraud === 'suspicious' ? 'selected' : ''}`}
              id="vote-suspicious-btn"
              onClick={() => handleVote('suspicious')}
              disabled={!!hasVotedFraud || loading || !user?.id}
              aria-pressed={hasVotedFraud === 'suspicious'}
            >
              🚨 Vote: Suspicious
            </button>
            <button
              className={`btn vote-btn-legitimate ${hasVotedFraud === 'legitimate' ? 'selected' : ''}`}
              id="vote-legitimate-btn"
              onClick={() => handleVote('legitimate')}
              disabled={!!hasVotedFraud || loading || !user?.id}
              aria-pressed={hasVotedFraud === 'legitimate'}
            >
              ✅ Vote: Legitimate
            </button>
          </div>

          {!user?.id && !loading && (
            <div className="trust-hint" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
              ⚠️ Please sign in to cast your vote.
            </div>
          )}

          {/* Vote count */}
          <div className="card" style={{ background: 'var(--color-bg)' }}>
            <div className="card-title mb-3">Community Vote Count</div>
            <VoteBar
              forVotes={localVotes.for}
              against={localVotes.against}
              total={fraudCase.totalVoters}
              forLabel="Suspicious"
              againstLabel="Legitimate"
              forColor="var(--color-danger)"
              againstColor="var(--color-success)"
            />

            {hasVotedFraud && (
              <div
                className={`trust-hint mt-4 ${outcome === 'revoke' ? 'text-danger' : 'text-success'}`}
                style={{ color: outcome === 'revoke' ? 'var(--color-danger)' : 'var(--color-success)' }}
              >
                <strong>Projected Outcome:</strong>{' '}
                {outcome === 'revoke'
                  ? '🚫 Loan will be revoked — community majority voted Suspicious.'
                  : '✅ Loan will be approved — community majority voted Legitimate.'}
              </div>
            )}

            {hasVotedFraud && (
              <div className="text-xs text-muted text-center mt-2">
                ✓ Your vote has been saved to the database
              </div>
            )}
          </div>
        </div>

        {/* Right — explainer */}
        <div className="card animate-fade-in-up stagger-2">
          <div className="card-title mb-4">How Fraud Voting Works</div>
          <div className="tips-list mb-5">
            <div className="tip-row"><span>👁️</span><span className="text-sm">The community reviews flagged loans collectively</span></div>
            <div className="tip-row"><span>🗳️</span><span className="text-sm">Each verified member gets one vote per case</span></div>
            <div className="tip-row"><span>⚖️</span><span className="text-sm">51% majority determines the outcome automatically</span></div>
            <div className="tip-row"><span>🚫</span><span className="text-sm">Fraudulent loans are revoked and borrower is flagged</span></div>
          </div>
          <div className="card" style={{ background: '#EAF3DE', border: '1px solid #97C459' }}>
            <div className="font-semibold text-sm mb-2" style={{ color: '#3B6D11' }}>Your voting power</div>
            <div className="text-xs" style={{ color: '#3B6D11' }}>
              {user?.trustScore >= 60
                ? `As a verified member with Trust Score ${user?.trustScore ?? 50}, your vote carries full weight.`
                : 'Build your Trust Score to carry more voting influence in the community.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
