import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../components/shared/ToastProvider';
import { ethers } from 'ethers';
import {
  createCommunity, joinCommunity, leaveCommunity,
  createEndorsementRequest, fetchEndorsementRequests, updateEndorsementRequest,
  createCommunityLoanRequest, fetchCommunityLoanRequests, fundCommunityLoan,
  createTransaction, timeAgo,
} from '../../utils/supabaseService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const shortAddr = (a) => a ? `${a.slice(0, 8)}…${a.slice(-4)}` : '';
const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** EndorsementRequests — list of pending requests, with approve/reject for members */
const EndorsementRequests = ({ communityId, account, contract, refreshTrustScore }) => {
  const showToast = useToast();
  const { endorsementRequests, setEndorsementRequests } = useContext(AppContext);
  const [processing, setProcessing] = useState(null);
  const [myMessage, setMyMessage]   = useState('');

  const communityRequests = endorsementRequests.filter(r => r.communityId === communityId);
  const myPending = communityRequests.find(
    r => r.requester.toLowerCase() === account?.toLowerCase() && r.status === 'pending'
  );
  const othersPending = communityRequests.filter(
    r => r.requester.toLowerCase() !== account?.toLowerCase() && r.status === 'pending'
  );
  const resolved = communityRequests.filter(r => r.status !== 'pending');

  const handleRequest = () => {
    if (!account) { showToast('Connect wallet first!', 'error'); return; }
    if (myPending) { showToast('You already have a pending endorsement request.', 'error'); return; }
    const req = {
      id: uid(),
      requester: account,
      communityId,
      message: myMessage.trim() || 'Please endorse me to boost my Trust Score.',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setEndorsementRequests(prev => [req, ...prev]);
    setMyMessage('');
    showToast('📩 Endorsement request sent to community members!', 'success');
  };

  const handleApprove = async (req) => {
    if (!contract || !account) { showToast('Connect wallet to approve!', 'error'); return; }
    setProcessing(req.id);
    try {
      showToast('Confirm endorsement in MetaMask…', 'info');
      const tx = await contract.endorseUser(req.requester);
      await tx.wait();
      setEndorsementRequests(prev =>
        prev.map(r => r.id === req.id ? { ...r, status: 'approved', approvedBy: account } : r)
      );
      await refreshTrustScore(account, contract);
      showToast(`🌟 Endorsed! ${shortAddr(req.requester)}'s Trust Score +5 on-chain!`, 'success');
    } catch (err) {
      const reason = err.reason || err.message || '';
      if (reason.includes('Already endorsed')) {
        showToast('You already endorsed this person! Request auto-approved.', 'error');
        setEndorsementRequests(prev =>
          prev.map(r => r.id === req.id ? { ...r, status: 'approved', approvedBy: account, note: 'Already endorsed' } : r)
        );
      } else {
        showToast('Endorsement failed: ' + reason, 'error');
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (req) => {
    setEndorsementRequests(prev =>
      prev.map(r => r.id === req.id ? { ...r, status: 'rejected', rejectedBy: account } : r)
    );
    showToast('Endorsement request rejected.', 'info');
  };

  return (
    <div className="card animate-fade-in-up">
      <div className="card-title mb-1">🤝 Endorsement Requests</div>
      <div className="card-subtitle mb-4">
        Request community members to endorse you — every approval adds +5 Trust Score on the blockchain.
      </div>

      {/* My Request Panel */}
      <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8 }}>Request an Endorsement</div>
        {myPending ? (
          <div className="trust-hint" style={{ background: '#FDE8C0', border: '1px solid #FAC775', color: '#9B6000' }}>
            ⏳ Your request is pending. Community members will approve or reject it.
          </div>
        ) : (
          <>
            <textarea
              className="form-control"
              placeholder="Optional: Tell members why you'd like an endorsement…"
              value={myMessage}
              onChange={e => setMyMessage(e.target.value)}
              rows="2"
              style={{ resize: 'vertical', minHeight: 60, marginBottom: 10 }}
            />
            <button className="btn btn-primary w-full" id="request-endorsement-btn" onClick={handleRequest}>
              📩 Request Endorsement from Community
            </button>
          </>
        )}
      </div>

      {/* Pending from others — members can approve/reject */}
      {othersPending.length > 0 && (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pending Approvals ({othersPending.length})
          </div>
          {othersPending.map(req => (
            <div key={req.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                    {shortAddr(req.requester)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 2 }}>{formatDate(req.createdAt)}</div>
                </div>
                <span className="pill pill-warning" style={{ fontSize: '0.7rem' }}>Pending</span>
              </div>
              {req.message && (
                <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-text)', marginBottom: 10, padding: '8px', background: 'var(--color-bg-subtle)', borderRadius: 6 }}>
                  "{req.message}"
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
                  disabled={processing === req.id}
                  onClick={() => handleApprove(req)}
                  id={`approve-endorse-${req.id}`}
                >
                  {processing === req.id ? '⏳ Confirming…' : '✔ Approve (+5 Score)'}
                </button>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                  disabled={processing === req.id}
                  onClick={() => handleReject(req)}
                  id={`reject-endorse-${req.id}`}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved History */}
      {resolved.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            History ({resolved.length})
          </div>
          {resolved.map(req => (
            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
              <span style={{ fontFamily: 'monospace' }}>{shortAddr(req.requester)}</span>
              <span className={`pill text-xs ${req.status === 'approved' ? 'pill-success' : 'pill-danger'}`}>
                {req.status === 'approved' ? '✓ Approved ⛓️' : '✕ Rejected'}
              </span>
            </div>
          ))}
        </div>
      )}

      {othersPending.length === 0 && resolved.length === 0 && !myPending && (
        <div className="text-center text-muted" style={{ padding: 'var(--sp-4)', fontSize: '0.875rem' }}>
          No endorsement activity yet. Be the first to request one!
        </div>
      )}
    </div>
  );
};

/** CommunityLoanRequests — post a loan request within the community feed */
const CommunityLoanRequests = ({ communityId, account, contract }) => {
  const showToast = useToast();
  const { communityLoanRequests, setCommunityLoanRequests } = useContext(AppContext);
  const navigate = useNavigate();
  const [amount, setAmount]   = useState(5000);
  const [purpose, setPurpose] = useState('');
  const [posting, setPosting] = useState(false);
  const [funding, setFunding] = useState(null);

  const myRequests = communityLoanRequests.filter(r => r.communityId === communityId);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!account) { showToast('Connect wallet first!', 'error'); return; }
    if (!purpose.trim()) { showToast('Please enter a purpose.', 'error'); return; }
    setPosting(true);
    try {
      // Optionally also write to blockchain
      if (contract) {
        showToast('Confirming community loan request in MetaMask...', 'info');
        const tx = await contract.requestLoan(ethers.parseEther(amount.toString()), `[Community] ${purpose}`);
        await tx.wait();
      }
      const req = {
        id: uid(),
        requester: account,
        communityId,
        amount,
        purpose: purpose.trim(),
        createdAt: new Date().toISOString(),
        funders: [],
        status: 'open',
      };
      setCommunityLoanRequests(prev => [req, ...prev]);
      setPurpose('');
      showToast('💸 Loan request posted to community!', 'success');
    } catch (err) {
      showToast('Failed: ' + (err.reason || err.message), 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleFund = async (req) => {
    if (!contract || !account) { showToast('Connect wallet!', 'error'); return; }
    if (req.requester.toLowerCase() === account.toLowerCase()) {
      showToast('Cannot fund your own loan!', 'error'); return;
    }
    setFunding(req.id);
    try {
      showToast('Confirm funding in MetaMask…', 'info');
      // Find the blockchain loan ID by scanning for matching purpose
      const count = await contract.getLoanCount();
      let loanId = null;
      for (let i = 0; i < Number(count); i++) {
        const l = await contract.loans(i);
        if (
          l.borrower.toLowerCase() === req.requester.toLowerCase() &&
          l.purpose.includes(req.purpose) &&
          Number(l.status) === 0
        ) {
          loanId = Number(l.id);
          break;
        }
      }
      if (loanId === null) {
        showToast('Loan not found on blockchain. It may already be funded.', 'error');
        setFunding(null); return;
      }
      const loan = await contract.loans(loanId);
      const tx = await contract.fundLoan(loanId, { value: loan.principal });
      showToast('Funding transaction submitted...', 'info');
      await tx.wait();
      setCommunityLoanRequests(prev =>
        prev.map(r => r.id === req.id ? { ...r, funders: [...r.funders, account], status: 'funded' } : r)
      );
      showToast(`✅ Funded ₹${req.amount.toLocaleString('en-IN')} via blockchain!`, 'success');
    } catch (err) {
      showToast('Funding failed: ' + (err.reason || err.message), 'error');
    } finally {
      setFunding(null);
    }
  };

  return (
    <div className="card animate-fade-in-up stagger-1">
      <div className="card-title mb-1">💸 Community Loan Requests</div>
      <div className="card-subtitle mb-4">
        Request funding from your community members directly, or fund their loans as a lender.
      </div>

      {/* Post Request */}
      <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>Request Loan from Community</div>
        <form onSubmit={handlePost}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label" htmlFor="cl-amount">Amount (₹)</label>
            <input type="range" id="cl-amount" className="amount-slider"
              min="1000" max="50000" step="1000" value={amount}
              onChange={e => setAmount(parseInt(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: 2 }}>
              <span>₹1,000</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{amount.toLocaleString('en-IN')}</span>
              <span>₹50,000</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cl-purpose">Purpose</label>
            <input className="form-control" id="cl-purpose"
              placeholder="e.g. Buying raw materials for my shop"
              value={purpose} onChange={e => setPurpose(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-full" id="post-community-loan-btn" disabled={posting}>
            {posting ? '⏳ Posting…' : '📢 Post Loan Request to Community'}
          </button>
        </form>
      </div>

      {/* Also go to public marketplace */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--sp-4)', padding: 'var(--sp-3)', background: '#EEEDFE', borderRadius: 'var(--radius-md)', border: '1px solid #AFA9EC' }}>
        <div style={{ fontSize: '1.5rem' }}>🌐</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#534AB7' }}>Need more funding?</div>
          <div style={{ fontSize: '0.8rem', color: '#534AB7', opacity: 0.8 }}>Post to Public Marketplace for external lenders.</div>
        </div>
        <button className="btn btn-outline" style={{ fontSize: '0.8rem', borderColor: '#534AB7', color: '#534AB7', flexShrink: 0 }}
          onClick={() => navigate('/loan/request')} id="go-public-marketplace-btn">
          Public Market →
        </button>
      </div>

      {/* Community Loan Feed */}
      {myRequests.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: 'var(--sp-4)', fontSize: '0.875rem' }}>
          No community loan requests yet. Be the first!
        </div>
      ) : (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Requests ({myRequests.length})
          </div>
          {myRequests.map(req => {
            const isMyLoan = req.requester.toLowerCase() === account?.toLowerCase();
            const isFunded = req.status === 'funded';
            return (
              <div key={req.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
                      ₹{req.amount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginTop: 2 }}>{req.purpose}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>
                      By {isMyLoan ? <strong>You</strong> : shortAddr(req.requester)} · {formatDate(req.createdAt)}
                    </div>
                  </div>
                  <span className={`pill text-xs ${isFunded ? 'pill-success' : 'pill-warning'}`}>
                    {isFunded ? '✓ Funded' : 'Open'}
                  </span>
                </div>
                {!isMyLoan && !isFunded && (
                  <button
                    className="btn btn-primary w-full"
                    style={{ marginTop: 10, fontSize: '0.85rem' }}
                    disabled={funding === req.id}
                    onClick={() => handleFund(req)}
                    id={`fund-community-loan-${req.id}`}
                  >
                    {funding === req.id ? '⏳ Confirming on MetaMask…' : `💸 Fund ₹${req.amount.toLocaleString('en-IN')} via Web3`}
                  </button>
                )}
                {isMyLoan && !isFunded && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 8, textAlign: 'center' }}>
                    ⏳ Waiting for a community member to fund this
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** InviteHandler — dedicated invite management for admins */
const InviteHandler = ({ community, isAdmin }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(community.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="card animate-fade-in-up stagger-2">
        <div className="card-title mb-2">🔑 Community Access</div>
        <div className="card-subtitle">You are a member of this community. Ask the admin for the invite code to share with others.</div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in-up stagger-2">
      <div className="card-title mb-1">🔑 Invite Management</div>
      <div className="card-subtitle mb-4">Share this invite code <strong>privately</strong> with trusted people. This community is invite-only — no public listing.</div>

      <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', textAlign: 'center', marginBottom: 'var(--sp-4)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: 8 }}>Your Invite Code</div>
        <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '0.15em', color: '#3B9B9B', marginBottom: 12 }}>
          {community.inviteCode}
        </div>
        <button className="btn btn-primary" onClick={copyCode} id="copy-invite-btn" style={{ fontSize: '0.85rem' }}>
          {copied ? '✅ Copied!' : '📋 Copy Invite Code'}
        </button>
      </div>

      <div className="trust-hint">
        🔒 Only share this code with people you <strong>personally trust</strong>. New members can endorse each other and access community loans. You have admin control to manage requests.
      </div>

      <div style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-3)', background: '#E0F4F4', borderRadius: 'var(--radius-md)', border: '1px solid #3B9B9B22' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#3B9B9B', marginBottom: 6 }}>Admin Stats</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <span>👥 {community.members.length} members</span>
          <span>📅 Created {formatDate(community.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CommunityPage
// ═══════════════════════════════════════════════════════════════════════════════

export const CommunityPage = () => {
  const showToast = useToast();
  const { contract, account, trustScore, refreshTrustScore } = useContext(Web3Context);
  const {
    community, setCommunity,
    user, refreshCommunity,
  } = useContext(AppContext);

  const [view, setView]             = useState('landing'); // 'landing'|'create'|'join'|'dashboard'
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [inviteInput, setInviteInput]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [activeTab, setActiveTab]         = useState('members'); // 'members'|'endorsements'|'loans'

  // Alias for template compat
  const myCommunity = community;
  const userCommunityId = community?.id;

  useEffect(() => {
    if (myCommunity) setView('dashboard');
    else setView('landing');
  }, [community]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user?.id) { showToast('Please sign in first!', 'error'); return; }
    if (!communityName.trim()) { showToast('Enter a community name.', 'error'); return; }
    setLoading(true);
    try {
      const { data, error } = await createCommunity({
        name: communityName.trim(),
        description: communityDesc.trim(),
        adminId: user.id,
      });
      if (error) { showToast('Failed to create community: ' + error.message, 'error'); return; }
      showToast(`🏘️ "${communityName}" created! Invite code: ${data.invite_code}`, 'success');
      await refreshCommunity(user.id);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Join ────────────────────────────────────────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user?.id) { showToast('Please sign in first!', 'error'); return; }
    setLoading(true);
    try {
      const { data, error } = await joinCommunity({ inviteCode: inviteInput, userId: user.id });
      if (error) { showToast(error.message || 'Invalid invite code.', 'error'); return; }
      showToast(`✅ Joined "${data.name}"!`, 'success');
      await refreshCommunity(user.id);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Leave ───────────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!myCommunity || !user?.id) return;
    try {
      await leaveCommunity({ communityId: myCommunity.id, userId: user.id });
      setCommunity(null);
      showToast('You have left the community.', 'info');
    } catch (err) {
      showToast('Failed to leave: ' + err.message, 'error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const isAdmin = myCommunity?.userRole === 'admin' || myCommunity?.admin_id === user?.id;

  return (
    <section className="screen active" aria-label="Community">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title-lg">Community &amp; Trust Pods</h2>
          <div className="card-subtitle">Private trust circles — endorsements that live on the blockchain</div>
        </div>
        {trustScore !== null && (
          <span className="pill pill-success" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            ⛓️ Trust Score: <strong style={{ marginLeft: 4 }}>{trustScore}</strong>
          </span>
        )}
      </div>

      {/* ── LANDING ── */}
      {view === 'landing' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <div className="card animate-fade-in-up" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏘️</div>
              <div className="card-title mb-2">Create a Community</div>
              <div className="card-subtitle mb-5">Start a private trust circle. You become the admin and invite members with a unique code.</div>
              <button className="btn btn-primary w-full" onClick={() => setView('create')} id="create-community-btn">
                + Create Community
              </button>
            </div>
            <div className="card animate-fade-in-up stagger-1" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔑</div>
              <div className="card-title mb-2">Join via Invite Code</div>
              <div className="card-subtitle mb-5">Have an invite code? Enter it to join a private trust pod. All communities are invite-only.</div>
              <button className="btn btn-outline w-full" style={{ borderColor: '#3B9B9B', color: '#3B9B9B' }}
                onClick={() => setView('join')} id="join-community-btn">
                Enter Invite Code →
              </button>
            </div>
          </div>
          <div className="card animate-fade-in-up stagger-2">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '2rem' }}>💡</div>
              <div>
                <div className="card-title mb-1">Why join a community?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                  {[
                    ['🌟 Earn Endorsements', 'Community members vouch for you, each adding +5 Trust Score on-chain.'],
                    ['💸 Community Loans', 'Request loans directly within your trust circle for faster funding.'],
                    ['📈 Build Reputation', 'Higher Trust Score = lower interest rates (as low as 12% vs 20%).'],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ padding: 'var(--sp-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CREATE ── */}
      {view === 'create' && (
        <div className="card animate-fade-in-up" style={{ maxWidth: 520, margin: '0 auto' }}>
          <button className="btn btn-ghost" style={{ marginBottom: 16, fontSize: '0.85rem' }} onClick={() => setView('landing')}>← Back</button>
          <div className="card-title mb-1">Create a Private Community</div>
          <div className="card-subtitle mb-5">You will be the admin. Only people with your invite code can join.</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="community-name">Community Name *</label>
              <input className="form-control" id="community-name" placeholder="e.g. Nashik Traders Pod"
                value={communityName} onChange={e => setCommunityName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="community-desc">Description <span className="text-muted">(optional)</span></label>
              <textarea className="form-control" id="community-desc" rows="2"
                placeholder="Who is this community for?"
                value={communityDesc} onChange={e => setCommunityDesc(e.target.value)}
                style={{ resize: 'vertical', minHeight: 64 }} />
            </div>
            <div className="trust-hint mb-4">
              🔒 This is a <strong>private</strong> community. No public discovery. Members join only via your unique invite code.
            </div>
            <button type="submit" className="btn btn-primary w-full" id="confirm-create-btn" disabled={loading || !account}>
              {!account ? '⚠️ Connect Wallet First' : loading ? '⏳ Creating…' : '🏘️ Create Community →'}
            </button>
          </form>
        </div>
      )}

      {/* ── JOIN ── */}
      {view === 'join' && (
        <div className="card animate-fade-in-up" style={{ maxWidth: 520, margin: '0 auto' }}>
          <button className="btn btn-ghost" style={{ marginBottom: 16, fontSize: '0.85rem' }} onClick={() => setView('landing')}>← Back</button>
          <div className="card-title mb-1">Join a Community</div>
          <div className="card-subtitle mb-5">Enter the invite code shared by your community admin to get access.</div>
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label" htmlFor="invite-code">Invite Code</label>
              <input className="form-control" id="invite-code"
                placeholder="e.g. A1B2C3D4E5"
                value={inviteInput} onChange={e => setInviteInput(e.target.value)} required
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '1.1rem' }} />
            </div>
            <div className="trust-hint mb-4">
              🔑 Communities are <strong>invite-only</strong>. You need a valid code from an existing member.
            </div>
            <button type="submit" className="btn btn-primary w-full" id="confirm-join-btn" disabled={loading || !account}>
              {!account ? '⚠️ Connect Wallet First' : loading ? '⏳ Joining…' : '✅ Join Community →'}
            </button>
          </form>
        </div>
      )}

      {/* ── COMMUNITY DASHBOARD ── */}
      {view === 'dashboard' && myCommunity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

          {/* Community Header Card */}
          <div className="card animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #3B9B9B, #534AB7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.3rem', flexShrink: 0 }}>
                  {myCommunity.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{myCommunity.name}</div>
                  {myCommunity.description && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{myCommunity.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className="pill pill-success">{(myCommunity.members || []).length} Member{(myCommunity.members || []).length !== 1 ? 's' : ''}</span>
                    {isAdmin && <span className="pill" style={{ background: '#EEEDFE', color: '#534AB7', border: 'none' }}>👑 Admin</span>}
                    <span className="pill" style={{ background: '#E0F4F4', color: '#3B9B9B', border: 'none' }}>🔒 Private</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }} onClick={handleLeave}>
                Leave Community
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--color-bg-subtle)', padding: 4, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
            {[
              { key: 'members',      label: '👥 Members' },
              { key: 'endorsements', label: '🤝 Endorsements' },
              { key: 'loans',        label: '💸 Community Loans' },
              { key: 'invite',       label: '🔑 Invite' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  background: activeTab === tab.key ? 'white' : 'transparent',
                  color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
                id={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Members */}
          {activeTab === 'members' && (
            <div className="card animate-fade-in-up">
              <div className="card-title mb-4">👥 Members</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(myCommunity.members || []).map((m) => {
                  const mName = m.profiles?.full_name || shortAddr(m.user_id || '');
                  const mInitials = mName.substring(0, 2).toUpperCase();
                  const mColor = m.profiles?.avatar_color || (m.role === 'admin' ? '#534AB7' : '#3B9B9B');
                  const isMe = m.user_id === user?.id;
                  return (
                    <div key={m.id || m.user_id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 'var(--sp-3)',
                      background: isMe ? 'var(--color-bg-subtle)' : 'transparent',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: mColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {mInitials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {mName}
                          {isMe && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#3B9B9B' }}>(you)</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 2 }}>
                          {m.role === 'admin' ? '👑 Admin' : '👤 Member'} · Joined {formatDate(m.joined_at)}
                        </div>
                      </div>
                      {m.role === 'admin' && (
                        <span className="pill text-xs" style={{ background: '#EEEDFE', color: '#534AB7', border: 'none' }}>Admin</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Endorsements */}
          {activeTab === 'endorsements' && (
            <EndorsementRequests
              communityId={myCommunity.id}
              account={account}
              contract={contract}
              refreshTrustScore={refreshTrustScore}
            />
          )}

          {/* Tab: Community Loans */}
          {activeTab === 'loans' && (
            <CommunityLoanRequests
              communityId={myCommunity.id}
              account={account}
              contract={contract}
            />
          )}

          {/* Tab: Invite */}
          {activeTab === 'invite' && (
            <InviteHandler community={{ ...myCommunity, inviteCode: myCommunity.invite_code, admin: myCommunity.admin_id, createdAt: myCommunity.created_at }} isAdmin={isAdmin} />
          )}
        </div>
      )}
    </section>
  );
};
