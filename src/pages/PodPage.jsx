import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Web3Context } from '../context/Web3Context';
import { useToast } from '../components/shared/ToastProvider';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shortAddr = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—';

const getMemberStatus = (score) => {
  if (score >= 75) return { label: 'Excellent',     cls: 'pill-success', color: 'var(--color-success)' };
  if (score >= 55) return { label: 'Good Standing', cls: 'pill-success', color: 'var(--color-success)' };
  return               { label: 'At Risk',          cls: 'pill-danger',  color: 'var(--color-danger)'  };
};

const getPodHealth = (avg) => {
  if (avg >= 70) return { label: 'Healthy Pod 🟢',  cls: 'pill-success' };
  if (avg >= 50) return { label: 'Stable Pod 🟡',   cls: 'pill-warning' };
  return               { label: 'At Risk 🔴',        cls: 'pill-danger'  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export const PodPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  useScrollAnimation('.animate-fade-in-up');

  const { user, community, endorsementRequests } = useContext(AppContext);
  const { account, contract, trustScore: myOnChainScore } = useContext(Web3Context);

  // Build member list from real sources
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildMembers = async () => {
      setLoading(true);
      const list = [];

      // Always include the connected wallet as first member (self)
      if (account) {
        const score = myOnChainScore ?? user?.trustScore ?? 50;
        list.push({
          address: account,
          name: user?.name || user?.full_name || shortAddr(account),
          role: user?.role || 'borrower',
          score,
          isSelf: true,
        });
      }

      // Add community members from Supabase community object
      if (community?.members && Array.isArray(community.members)) {
        for (const m of community.members) {
          const addr = m.wallet_address || m.walletAddress;
          if (!addr || addr.toLowerCase() === account?.toLowerCase()) continue;

          let score = m.trust_score ?? 50;
          // Try to get live on-chain score
          if (contract && addr) {
            try {
              const userData = await contract.users(addr);
              if (userData?.isRegistered) score = Number(userData.trustScore);
            } catch (_) {}
          }

          list.push({
            address: addr,
            name: m.full_name || m.name || shortAddr(addr),
            role: m.role || 'member',
            score,
            isSelf: false,
          });
        }
      }

      // If endorsement requests contain unique addresses (approved), include them too
      const approvedEndorsers = endorsementRequests
        .filter(r => r.status === 'approved')
        .map(r => r.requester || r.approvedBy)
        .filter(Boolean);

      for (const addr of approvedEndorsers) {
        if (list.some(m => m.address?.toLowerCase() === addr?.toLowerCase())) continue;
        let score = 50;
        if (contract) {
          try {
            const userData = await contract.users(addr);
            if (userData?.isRegistered) score = Number(userData.trustScore);
          } catch (_) {}
        }
        list.push({ address: addr, name: shortAddr(addr), role: 'endorsed member', score, isSelf: false });
      }

      setMembers(list);
      setLoading(false);
    };

    buildMembers();
  }, [account, contract, community, myOnChainScore, user, endorsementRequests]);

  // Derived stats
  const podAvg = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.score, 0) / members.length)
    : 0;
  const podHealth = getPodHealth(podAvg);
  const repaidCount = endorsementRequests.filter(r => r.status === 'approved').length;
  const communityName = community?.name || 'My Community Pod';

  return (
    <section className="screen active" aria-label="Community Pod Details">
      <div className="card animate-fade-in-up">

        {/* Header */}
        <div className="pod-detail-header">
          <div style={{ flex: 1 }}>
            <div className="pod-title">
              <span className="pod-icon" aria-hidden="true">🤝</span>
              {communityName}
            </div>
            <div className="pod-meta">
              Community Pod · {members.length} active member{members.length !== 1 ? 's' : ''}
              {account && <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-muted)' }}>· {shortAddr(account)}</span>}
            </div>
          </div>
          <div className="pod-detail-actions">
            <span className={`pill ${podHealth.cls}`} style={{ fontSize: '0.8rem' }}>
              {loading ? '⏳ Calculating…' : podHealth.label}
            </span>
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => navigate('/community')}
            >
              Community Hub →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="pod-stats-grid" style={{ margin: '20px 0' }}>
          <div className="pod-stat-box">
            <div className="pod-stat-value" style={{ color: podAvg >= 70 ? 'var(--color-success)' : podAvg >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
              {loading ? '…' : podAvg}
            </div>
            <div className="pod-stat-label">Avg Trust Score</div>
          </div>
          <div className="pod-stat-box">
            <div className="pod-stat-value" style={{ color: 'var(--color-primary)' }}>
              {members.length}
            </div>
            <div className="pod-stat-label">Members</div>
          </div>
          <div className="pod-stat-box">
            <div className="pod-stat-value" style={{ color: 'var(--color-warning)' }}>
              {loading ? '…' : podHealth.label.split(' ')[0]}
            </div>
            <div className="pod-stat-label">Pod Health</div>
          </div>
          <div className="pod-stat-box">
            <div className="pod-stat-value" style={{ color: 'var(--color-secondary)' }}>
              {repaidCount}
            </div>
            <div className="pod-stat-label">Endorsements</div>
          </div>
        </div>

        {/* Transparency label */}
        <div style={{
          fontSize: '0.72rem', color: 'var(--color-muted)', background: 'var(--color-bg-subtle)',
          borderRadius: 8, padding: '6px 12px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>ℹ️</span>
          <span>Community insights are based on active members and live on-chain Trust Score records.</span>
        </div>

        {/* Members List */}
        <div className="pod-members-list-wrapper">
          <div className="pod-members-list-header">
            <h3>Members</h3>
            <span className="pill pill-success text-xs">{members.length} active</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
              ⛓️ Fetching on-chain Trust Scores…
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤝</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No pod members yet</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: 16 }}>
                Connect your wallet and join a community to see members here.
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/community')}>
                Join a Community →
              </button>
            </div>
          ) : (
            <div className="member-list" role="list">
              {members.map((m, i) => {
                const status = getMemberStatus(m.score);
                const initials = m.name?.substring(0, 2).toUpperCase() || '??';
                const avatarColors = ['#3B9B9B', '#F06292', '#FFB300', '#7C4DFF', '#26A69A'];
                return (
                  <div key={m.address || i} className="member-row" role="listitem">
                    <div className="member-info">
                      <div className="avatar" style={{ background: avatarColors[i % avatarColors.length], flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div className="member-name">
                          {m.name}
                          {m.isSelf && <span className="text-muted text-xs font-normal"> (You)</span>}
                        </div>
                        <div className="member-role" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {shortAddr(m.address)} · {m.role}
                        </div>
                      </div>
                    </div>
                    <div className="member-status">
                      <span className={`pill ${status.cls}`} style={{ marginRight: 'var(--sp-4)', fontSize: '0.7rem' }}>
                        {status.label}
                      </span>
                      <div className="member-score">
                        <span className="score-val" style={{ color: status.color }}>{m.score}</span>
                        <span className="score-lbl">Trust Score</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent On-Chain Activity */}
        {endorsementRequests.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              Recent Community Activity ⛓️
            </div>
            {endorsementRequests.slice(0, 4).map((r, i) => (
              <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--color-muted)' }}>
                  {shortAddr(r.requester)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                  requested endorsement
                </span>
                <span className={`pill text-xs ${r.status === 'approved' ? 'pill-success' : r.status === 'rejected' ? 'pill-danger' : 'pill-warning'}`}>
                  {r.status === 'approved' ? '✓ Endorsed ⛓️' : r.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA if no community */}
        {!community && !loading && account && (
          <div style={{ marginTop: 24, textAlign: 'center', padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 12 }}>
              You haven't joined a community pod yet. Join one to unlock community lending and endorsements.
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/community')}>
              Explore Community →
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
