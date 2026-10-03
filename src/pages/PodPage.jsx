import React from 'react';
import { Button } from '../components/shared/useRipple';
import { useToast } from '../components/shared/ToastProvider';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const PodPage = () => {
  const showToast = useToast();
  useScrollAnimation('.animate-fade-in-up');

  return (
    <section className="screen active" aria-label="Community Pod Details">
      <div className="card animate-fade-in-up">
        {/* Header */}
        <div className="pod-detail-header">
          <div style={{flex: 1}}>
            <div className="pod-title">
              <span className="pod-icon" aria-hidden="true">☀️</span>
              Sunrise Riders
            </div>
            <div className="pod-meta">Community Pod · Est. January 2026 · 5 members</div>
          </div>
          <div className="pod-detail-actions">
            <Button variant="primary" onClick={() => showToast('Invite link copied to clipboard')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5L14 9L10 13M14 9H2"/></svg>
              Invite Member
            </Button>
            <Button variant="outline" onClick={() => showToast('Pod history is up to date', 'success')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4V8L10 10"/></svg>
              Pod History
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="pod-stats-grid">
          <div className="pod-stat-box">
            <div className="pod-stat-value" style={{color: 'var(--color-success)'}}>78</div>
            <div className="pod-stat-label">Pod Trust Score</div>
          </div>
          <div className="pod-stat-box">
            <div className="pod-stat-value text-primary">5</div>
            <div className="pod-stat-label">Members</div>
          </div>
          <div className="pod-stat-box">
            <div className="pod-stat-value" style={{color: 'var(--color-warning)'}}>Low</div>
            <div className="pod-stat-label">Risk Level</div>
          </div>
          <div className="pod-stat-box">
            <div className="pod-stat-value text-primary">3</div>
            <div className="pod-stat-label">Loans Completed</div>
          </div>
        </div>

        {/* Members List */}
        <div className="pod-members-list-wrapper">
          <div className="pod-members-list-header">
            <h3>Members</h3>
            <span className="pill pill-success text-xs">5 of 8 slots filled</span>
          </div>

          <div className="member-list" role="list">
            <div className="member-row" role="listitem">
              <div className="member-info">
                <div className="avatar" style={{background: '#3B9B9B'}}>RK</div>
                <div>
                  <div className="member-name">Riya Kulkarni <span className="text-muted text-xs font-normal">(You)</span></div>
                  <div className="member-role">Delivery Rider · Joined Jan 2026</div>
                </div>
              </div>
              <div className="member-status">
                <span className="pill pill-warning" style={{marginRight: 'var(--sp-4)'}}>NGO pending</span>
                <div className="member-score">
                  <span className="score-val">72</span>
                  <span className="score-lbl">Trust Score</span>
                </div>
              </div>
            </div>

            <div className="member-row" role="listitem">
              <div className="member-info">
                <div className="avatar avatar-coral">AS</div>
                <div>
                  <div className="member-name">Arjun Singh</div>
                  <div className="member-role">Street Vendor · Joined Jan 2026</div>
                </div>
              </div>
              <div className="member-status">
                <span className="pill pill-success" style={{marginRight: 'var(--sp-4)'}}>Good Standing</span>
                <div className="member-score">
                  <span className="score-val">85</span>
                  <span className="score-lbl">Trust Score</span>
                </div>
              </div>
            </div>

            <div className="member-row" role="listitem">
              <div className="member-info">
                <div className="avatar avatar-amber">PM</div>
                <div>
                  <div className="member-name">Priya Mehta</div>
                  <div className="member-role">Freelance Tailor · Joined Feb 2026</div>
                </div>
              </div>
              <div className="member-status">
                <span className="pill pill-danger" style={{marginRight: 'var(--sp-4)'}}>At Risk</span>
                <div className="member-score">
                  <span className="score-val">69</span>
                  <span className="score-lbl">Trust Score</span>
                </div>
              </div>
            </div>

            <div className="member-row" role="listitem">
              <div className="member-info">
                <div className="avatar avatar-success">VR</div>
                <div>
                  <div className="member-name">Vijay Rao</div>
                  <div className="member-role">Auto Driver · Joined Jan 2026</div>
                </div>
              </div>
              <div className="member-status">
                <span className="pill pill-success" style={{marginRight: 'var(--sp-4)'}}>Good Standing</span>
                <div className="member-score">
                  <span className="score-val">91</span>
                  <span className="score-lbl">Trust Score</span>
                </div>
              </div>
            </div>

            <div className="member-row" role="listitem">
              <div className="member-info">
                <div className="avatar avatar-purple">NK</div>
                <div>
                  <div className="member-name">Neha Kadam</div>
                  <div className="member-role">Small Shop Owner · Joined Feb 2026</div>
                </div>
              </div>
              <div className="member-status">
                <span className="pill pill-success" style={{marginRight: 'var(--sp-4)'}}>Good Standing</span>
                <div className="member-score">
                  <span className="score-val">77</span>
                  <span className="score-lbl">Trust Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
