import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { fetchUserVouchers, createTransaction } from '../../utils/supabaseService';
import { useToast } from '../../components/shared/ToastProvider';

export const CommunityVouchingPage = () => {
  const { user, vouchers: ctxVouchers, setVouchers } = useContext(AppContext);
  const showToast = useToast();
  const navigate = useNavigate();

  const [vouchers, setLocalVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const data = await fetchUserVouchers(user.id);
      setLocalVouchers(data);
      setVouchers(data);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const displayVouchers = vouchers.length > 0 ? vouchers : ctxVouchers || [];
  const confirmed = displayVouchers.filter(v => v.status === 'confirmed').length;
  const pending = displayVouchers.filter(v => v.status === 'pending').length;

  // Build invite link using user ID as identifier
  const inviteLink = user?.id
    ? `${window.location.origin}/invite?ref=${btoa(user.id).slice(0, 12)}`
    : `${window.location.origin}/invite`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast('Invite link copied to clipboard! 🔗', 'success');
  };

  const handleShareWhatsApp = () => {
    const msg = `Join TrustChain and vouch for me! 🤝 I'm building my trust score to access better loans. ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareSMS = () => {
    const msg = `Join TrustChain and vouch for me! ${inviteLink}`;
    window.open(`sms:?body=${encodeURIComponent(msg)}`, '_blank');
  };

  // Simulate sending a vouch request (in production this would send an email/SMS)
  const handleSendInvite = async (method) => {
    showToast(`Invite sent via ${method}! They'll receive a link to confirm their vouch. 📨`, 'success');
    if (user?.id) {
      await createTransaction({
        userId: user.id,
        type: 'vouched',
        actorName: user.name || user.full_name || 'User',
      });
    }
  };

  return (
    <section className="screen active" aria-label="Community Vouching">
      <div className="verify-wrapper">
        <div className="card verify-card animate-fade-in-up">
          <div className="card-title mb-1">Community Vouching</div>
          <div className="card-subtitle mb-6">
            Get 3 trusted people to vouch for you. Each vouch adds up to +10 Trust Score points.
          </div>

          {/* Progress tracker */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="text-sm font-semibold">Voucher Progress</span>
              <span className="text-sm text-muted">{confirmed}/3 confirmed</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${Math.min((confirmed / 3) * 100, 100)}%`, background: confirmed >= 3 ? 'var(--color-success)' : 'var(--color-primary)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: '0.8rem' }}>
              <span className="pill pill-success text-xs">{confirmed} confirmed</span>
              {pending > 0 && <span className="pill pill-warning text-xs">{pending} pending</span>}
              {confirmed < 3 && <span className="pill text-xs" style={{ background: '#F1F5F9' }}>{3 - confirmed - pending} remaining</span>}
            </div>
          </div>

          {/* Voucher slots */}
          <div className="voucher-list mb-6" role="list">
            {loading ? (
              <div className="text-center text-muted text-sm" style={{ padding: '16px' }}>Loading vouchers…</div>
            ) : (
              <>
                {displayVouchers.slice(0, 3).map((v, i) => {
                  const vName = v.profiles?.full_name || 'Community Member';
                  const vInitials = vName.substring(0, 2).toUpperCase();
                  const vColor = v.profiles?.avatar_color || '#3B9B9B';
                  const vScore = v.profiles?.trust_score;
                  return (
                    <div key={v.id} className={`voucher-row ${v.status}`} role="listitem">
                      <div className="avatar" style={{ background: vColor }} aria-hidden="true">{vInitials}</div>
                      <div className="voucher-info">
                        <div className="font-medium text-sm">{vName}</div>
                        {vScore && <div className="text-xs text-muted">Trust Score: {vScore}</div>}
                      </div>
                      <span className={`pill text-xs ${v.status === 'confirmed' ? 'pill-success' : 'pill-warning'}`}>
                        {v.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                      </span>
                    </div>
                  );
                })}
                {[...Array(Math.max(0, 3 - displayVouchers.length))].map((_, i) => (
                  <div key={`empty-${i}`} className="voucher-row empty" role="listitem">
                    <div className="avatar voucher-avatar-empty" style={{ background: '#E2E8F0', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }} aria-hidden="true">+</div>
                    <div className="voucher-info">
                      <div className="text-muted text-sm">Slot {displayVouchers.length + i + 1} open</div>
                      <div className="text-xs text-muted">Invite someone to vouch for you</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Invite link */}
          <div className="form-group">
            <div className="form-label mb-2">Your Invite Link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-control"
                readOnly
                value={inviteLink}
                id="invite-link-input"
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
              <button className="btn btn-outline" onClick={handleCopyLink} id="copy-invite-link-btn">Copy</button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="card-title text-sm mb-3 mt-5">Share via</div>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline flex-1"
              id="share-whatsapp-btn"
              onClick={handleShareWhatsApp}
              style={{ borderColor: '#25D366', color: '#25D366' }}
            >
              📱 WhatsApp
            </button>
            <button
              className="btn btn-outline flex-1"
              id="share-sms-btn"
              onClick={handleShareSMS}
            >
              💬 SMS
            </button>
            <button
              className="btn btn-outline flex-1"
              id="copy-link-btn"
              onClick={handleCopyLink}
            >
              🔗 Copy Link
            </button>
          </div>

          <div className="trust-hint mt-5">
            🛡️ Your vouchers remain private. The community only sees your total vouch count, not who vouched for you.
          </div>
        </div>

        {/* Side explanation */}
        <div className="verify-side animate-fade-in-up stagger-2">
          <div className="card">
            <div className="card-title mb-4">How Vouching Works</div>
            <div className="tips-list">
              <div className="tip-row"><span>🤝</span><span className="text-sm">Invite 3 people you personally know and trust</span></div>
              <div className="tip-row"><span>📲</span><span className="text-sm">They confirm your identity via the invite link</span></div>
              <div className="tip-row"><span>📈</span><span className="text-sm">Each confirmation adds up to +10 Trust Score points</span></div>
              <div className="tip-row"><span>🏆</span><span className="text-sm">3 vouchers unlock High Trust tier — your best loan rates</span></div>
            </div>
          </div>
          <div className="card mt-4" style={{ background: '#EAF3DE', border: '1px solid #97C459' }}>
            <div className="font-semibold text-sm mb-2" style={{ color: '#3B6D11' }}>Who to invite</div>
            <div className="text-xs" style={{ color: '#3B6D11', lineHeight: 1.7 }}>
              Friends, family, colleagues, shopkeepers, or community leaders who can personally verify your identity and character. The stronger their own Trust Score, the more value their vouch carries.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
