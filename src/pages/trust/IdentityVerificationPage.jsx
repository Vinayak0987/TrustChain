import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { StepIndicator, TrustGaugeLarge } from '../../components/shared/SharedComponents';
import { useToast } from '../../components/shared/ToastProvider';
import { updateUserProfile, createTransaction } from '../../utils/supabaseService';

const VERIFY_STEPS = ['Choose Document', 'Upload Photo', 'Face Match'];
const DOC_TYPES = [
  { id: 'aadhaar', label: 'Aadhaar Card', icon: '🪪', desc: '12-digit UID card' },
  { id: 'voter', label: 'Voter ID', icon: '🗳️', desc: 'Election Commission card' },
  { id: 'ration', label: 'Ration Card', icon: '📋', desc: 'PDS ration card' },
  { id: 'utility', label: 'Utility Bill', icon: '💡', desc: 'Electricity / water bill' },
];

export const IdentityVerificationPage = () => {
  const { verifyStep, setVerifyStep, verifyDocType, setVerifyDocType, trustScore, setTrustScore, user } = useContext(AppContext);
  const showToast = useToast();
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);
  const [selfieCapturing, setSelfieCapturing] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleDocSelect = (docId) => setVerifyDocType(docId);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (verifyDocType) setVerifyStep(2);
  };

  const handleUpload = () => {
    setUploaded(true);
    setTimeout(() => setVerifyStep(3), 800);
  };

  const handleSelfie = async () => {
    setSelfieCapturing(true);
    setTimeout(async () => {
      setSelfieCapturing(false);
      setVerified(true);

      const newScore = Math.min(100, (trustScore || 50) + 7);
      await setTrustScore(newScore);

      // Persist additional verification to Supabase profile
      if (user?.id) {
        await updateUserProfile(user.id, {
          // Mark an additional_verification field so we can track this
          joined_label: user.joined_label || new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        });

        // Create a transaction record for verification activity
        await createTransaction({
          userId: user.id,
          type: 'verified',
          actorName: user.name || user.full_name || 'User',
        });
      }

      showToast('✅ Identity verified! Trust Score increased by +7 points.', 'success');
    }, 2000);
  };

  return (
    <section className="screen active" aria-label="Identity Verification">
      <div className="verify-wrapper">
        <div className="card verify-card animate-fade-in-up">
          <div className="card-title mb-1">Identity Verification</div>
          <div className="card-subtitle mb-5">
            India-specific documents accepted — no bank passbook needed.
          </div>

          <StepIndicator steps={VERIFY_STEPS} current={verifyStep} />

          {/* Step 1 */}
          {verifyStep === 1 && (
            <form onSubmit={handleStep1} style={{ marginTop: 'var(--sp-6)' }}>
              <div className="form-label mb-3">Choose your document type</div>
              <div className="doc-type-grid" role="radiogroup" aria-label="Document type">
                {DOC_TYPES.map(doc => (
                  <button
                    key={doc.id}
                    type="button"
                    role="radio"
                    aria-checked={verifyDocType === doc.id}
                    className={`doc-btn ${verifyDocType === doc.id ? 'active' : ''}`}
                    id={`verifydoc-${doc.id}`}
                    onClick={() => handleDocSelect(doc.id)}
                  >
                    <span className="doc-icon">{doc.icon}</span>
                    <span className="doc-label">{doc.label}</span>
                    <span className="doc-desc text-xs text-muted">{doc.desc}</span>
                  </button>
                ))}
              </div>
              <div className="trust-hint mt-4">
                🔒 We accept non-standard documents — designed for rural and underbanked users.
              </div>
              <button type="submit" className="btn btn-primary w-full mt-5"
                id="verify-step1-btn" disabled={!verifyDocType}>
                Continue →
              </button>
            </form>
          )}

          {/* Step 2 */}
          {verifyStep === 2 && (
            <div style={{ marginTop: 'var(--sp-6)' }}>
              <div className="form-label mb-3">
                Upload a photo of your {DOC_TYPES.find(d => d.id === verifyDocType)?.label}
              </div>
              {!uploaded ? (
                <div className="upload-zone" role="button" tabIndex="0" onClick={handleUpload}
                  onKeyDown={e => e.key === 'Enter' && handleUpload()}
                  aria-label="Upload document photo">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M20 26V14M14 20l6-6 6 6" />
                    <rect x="4" y="4" width="32" height="32" rx="6" />
                  </svg>
                  <div className="upload-text mt-2">Tap to upload — JPEG, PNG, PDF · Max 5MB</div>
                  <div className="upload-sub text-xs text-muted">Your document is encrypted and not shared</div>
                </div>
              ) : (
                <div className="upload-zone" style={{ borderColor: 'var(--color-success)' }}>
                  <div style={{ fontSize: '2rem' }}>✅</div>
                  <div className="font-medium text-success mt-2">Document uploaded successfully</div>
                  <div className="text-xs text-muted">Processing...</div>
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button className="btn btn-outline flex-1" onClick={() => setVerifyStep(1)}>← Back</button>
                <button className="btn btn-primary flex-1" id="verify-step2-btn" disabled={!uploaded} onClick={() => setVerifyStep(3)}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {verifyStep === 3 && !verified && (
            <div style={{ marginTop: 'var(--sp-6)' }} className="text-center">
              <div className="form-label mb-4">Take a quick selfie for face match</div>
              <div className="selfie-zone">
                {selfieCapturing ? (
                  <div className="selfie-scanning">
                    <div className="scan-pulse" aria-hidden="true" />
                    <div className="mt-4 font-medium">Verifying face match...</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '3rem' }}>🤳</div>
                    <div className="text-muted mt-2">Simulated face match — no real photo needed</div>
                  </>
                )}
              </div>
              <button className="btn btn-primary w-full mt-5" id="capture-selfie-btn"
                onClick={handleSelfie} disabled={selfieCapturing}>
                {selfieCapturing ? 'Verifying...' : 'Capture Selfie →'}
              </button>
            </div>
          )}

          {/* Verified state */}
          {verified && (
            <div style={{ marginTop: 'var(--sp-6)' }} className="text-center">
              <div className="verified-badge-anim">✓</div>
              <h2 className="mt-4 font-bold" style={{ color: 'var(--color-success)' }}>Identity Verified!</h2>
              <p className="text-muted mt-2">Your Trust Score has been updated and saved.</p>
              <div className="mt-5">
                <TrustGaugeLarge score={trustScore} size={160} />
              </div>
              <div className="pill pill-success mt-3">+7 Trust Points Added</div>
              <button className="btn btn-primary w-full mt-5" id="back-to-trust-btn"
                onClick={() => navigate('/trust')}>
                View Trust Score →
              </button>
            </div>
          )}
        </div>

        {/* Side info */}
        <div className="verify-side animate-fade-in-up stagger-3">
          <div className="card">
            <div className="card-title mb-4">Why We Verify</div>
            <div className="tips-list">
              <div className="tip-row"><span>🔒</span><span className="text-sm">Protects the community from fraud</span></div>
              <div className="tip-row"><span>📈</span><span className="text-sm">Adds up to +30 points to your Trust Score</span></div>
              <div className="tip-row"><span>💰</span><span className="text-sm">Unlocks higher loan limits</span></div>
              <div className="tip-row"><span>🇮🇳</span><span className="text-sm">Accepts all standard Indian govt IDs</span></div>
            </div>
          </div>
          {user?.id && (
            <div className="card mt-4" style={{ background: '#EAF3DE', border: '1px solid #97C459' }}>
              <div className="font-semibold text-sm mb-2" style={{ color: '#3B6D11' }}>Your current status</div>
              <div className="text-xs" style={{ color: '#3B6D11', lineHeight: 1.7 }}>
                Trust Score: <strong>{trustScore ?? 50}</strong><br />
                KYC Status: <strong>{user?.kycStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}</strong><br />
                Phone: <strong>{user?.phone_number ? '✅ Verified' : '⚠️ Not verified'}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
