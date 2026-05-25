import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/useRipple';

export const PodSummaryCard = () => {
  const navigate = useNavigate();

  return (
    <div className="card animate-fade-in-up stagger-4" role="region" aria-label="Community Pod summary">
      <div className="pod-summary-header">
        <div>
          <div className="card-title">Your Community Pod</div>
          <div className="card-subtitle">☀️ Sunrise Riders</div>
        </div>
        <div className="pod-score-badge" aria-label="Pod Trust Score: 78, Strong">
          <span className="score-num">78</span>
          <span className="score-label">Pod Trust · Strong</span>
        </div>
      </div>

      <div className="pod-members-grid" role="list" aria-label="Pod members">
        <div className="pod-member" role="listitem">
          <div className="avatar" style={{background: '#3B9B9B'}}>RK</div>
          <span className="pod-member-name">Riya K.</span>
          <span className="pod-member-score">72</span>
        </div>
        <div className="pod-member" role="listitem">
          <div className="avatar avatar-coral">AS</div>
          <span className="pod-member-name">Arjun S.</span>
          <span className="pod-member-score">85</span>
        </div>
        <div className="pod-member" role="listitem">
          <div className="avatar avatar-amber">PM</div>
          <span className="pod-member-name">Priya M.</span>
          <span className="pod-member-score">69</span>
        </div>
        <div className="pod-member" role="listitem">
          <div className="avatar avatar-success">VR</div>
          <span className="pod-member-name">Vijay R.</span>
          <span className="pod-member-score">91</span>
        </div>
        <div className="pod-member" role="listitem">
          <div className="avatar avatar-purple">NK</div>
          <span className="pod-member-name">Neha K.</span>
          <span className="pod-member-score">77</span>
        </div>
      </div>

      <div className="pod-warning" role="note" aria-label="Important: pod default warning">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 1L1 12h12L7 1z"/><path d="M7 5.5V8M7 9.5v.5"/></svg>
        <span>If any pod member defaults, everyone's Trust Score drops. Encourage on-time repayments.</span>
      </div>

      <div style={{marginTop: 'var(--sp-4)'}}>
        <Button variant="outline" className="w-full" onClick={() => navigate('/app/pod')}>
          View Pod Details →
        </Button>
      </div>
    </div>
  );
};
