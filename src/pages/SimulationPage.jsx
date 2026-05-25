import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { scoreTier, scoreColor, calcSimRate } from '../utils/formatters';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const SimulationPage = () => {
  const { streak, setStreak, podStrength, setPodStrength, verification, setVerification, trustScore } = useContext(AppContext);
  const [displayScore, setDisplayScore] = useState(0);
  useScrollAnimation('.animate-fade-in-up');

  // We want to recalculate a purely simulated state for this page potentially?
  // Actually, the original app shared the simulation sliders with the global state, 
  // so moving the sliders actively changed the global `trustScore` locally. So we'll continue that behavior.
  
  useEffect(() => {
    setDisplayScore(trustScore);
  }, [trustScore]);

  const ARC_LENGTH = 282.7;
  const dash = (trustScore / 100) * ARC_LENGTH;
  const tier = scoreTier(trustScore);
  const rate = calcSimRate(trustScore);

  return (
    <section className="screen active" aria-label="Trust Score Simulator">
      <div className="section-header mb-8 animate-fade-in-up">
        <h2>How to Improve Your Trust Score</h2>
        <p>Move the sliders to see how different actions affect your Trust Level and interest rate.</p>
      </div>

      <div className="sim-grid">
        <div className="sim-controls">
          <div className="card animate-fade-in-up stagger-1">
            <div className="flex justify-between items-center mb-4">
              <label className="font-semibold text-sm" htmlFor="react-streak-slider">Repayment Streak</label>
              <span className="pill" style={{background: 'var(--color-primary-light)', color: 'var(--color-primary)'}}>{streak} loans</span>
            </div>
            <div className="slider-container">
              <input 
                type="range" 
                id="react-streak-slider" 
                min="0" 
                max="6" 
                step="1" 
                value={streak}
                onChange={(e) => setStreak(parseInt(e.target.value))}
              />
              <div className="slider-track-fill" style={{width: `${(streak / 6) * 100}%`}}></div>
              <div className="slider-labels mt-2">
                <span>0 loans</span>
                <span>3 loans</span>
                <span>6 loans</span>
              </div>
            </div>
          </div>

          <div className="card animate-fade-in-up stagger-2">
            <label className="font-semibold text-sm block mb-4">Pod Strength</label>
            <div className="toggle-group" role="radiogroup" aria-label="Pod strength">
              {['weak', 'average', 'strong'].map(s => (
                <button 
                  key={s}
                  role="radio" 
                  aria-checked={podStrength === s}
                  className={`toggle-btn ${podStrength === s ? 'active' : ''}`}
                  onClick={() => setPodStrength(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card animate-fade-in-up stagger-3">
            <label className="font-semibold text-sm block mb-4">Identity Verification</label>
            <div className="toggle-group" role="radiogroup" aria-label="Identity verification level">
              <button 
                role="radio" aria-checked={verification === 'none'} 
                className={`toggle-btn ${verification === 'none' ? 'active' : ''}`}
                onClick={() => setVerification('none')}
              >None</button>
              <button 
                role="radio" aria-checked={verification === 'phone'} 
                className={`toggle-btn ${verification === 'phone' ? 'active' : ''}`}
                onClick={() => setVerification('phone')}
              >Phone</button>
              <button 
                role="radio" aria-checked={verification === 'ngo'} 
                className={`toggle-btn ${verification === 'ngo' ? 'active' : ''}`}
                onClick={() => setVerification('ngo')}
              >NGO + Gig</button>
            </div>
          </div>

          <div className="card animate-fade-in-up stagger-4" style={{background: 'var(--col-bg)', border: 'none', padding: '16px'}}>
            <span className="font-medium text-sm text-primary inline-flex gap-2">
              <span>💪</span> You're in control.
            </span>
            <span className="text-sm text-muted"> These levers reflect real behaviours that improve your Trust Score over time.</span>
          </div>
        </div>

        <div className="sim-result card animate-fade-in-up stagger-5" role="region" aria-live="polite">
          <h3 className="mb-6">Your Predicted Score</h3>
          <div className="gauge-wrapper mx-auto mb-6" style={{width: '200px'}}>
             <svg className="gauge-svg" viewBox="0 0 240 145" width="200" height="121" style={{transition:'all 0.3s ease'}}>
              <path d="M 30 130 A 90 90 0 0 1 210 130" fill="none" stroke="#E8EDF2" strokeWidth="14" strokeLinecap="round"/>
              <path d="M 30 130 A 90 90 0 0 1 90 50" fill="none" stroke="#FFCDD0" strokeWidth="14" strokeLinecap="butt"/>
              <path d="M 90 50 A 90 90 0 0 1 165 50" fill="none" stroke="#FDE8C0" strokeWidth="14" strokeLinecap="butt"/>
              <path d="M 165 50 A 90 90 0 0 1 210 130" fill="none" stroke="#C8EDDA" strokeWidth="14" strokeLinecap="butt"/>
              <path 
                style={{transition: 'stroke-dasharray 0.5s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease'}}
                d="M 30 130 A 90 90 0 0 1 210 130" 
                fill="none" 
                stroke={scoreColor(displayScore)} 
                strokeWidth="14" 
                strokeDasharray={`${dash}, ${ARC_LENGTH}`} 
              />
            </svg>
            <div className="gauge-center" style={{transform: 'translate(-50%, -40%)', bottom: '15px'}}>
              <div className="gauge-score" style={{color: scoreColor(displayScore)}}>{displayScore}</div>
            </div>
          </div>

          <div className="text-center font-medium mb-8 text-sm text-heading">{tier.name}</div>

          <div className="card p-4" style={{background: 'var(--col-bg)', border: 'none', marginBottom: 'var(--sp-6)'}}>
            <div className="flex justify-between items-center text-center">
              <div>
                <div className="text-xs text-muted mb-1">Current Rate</div>
                <div className="text-lg font-bold" style={{color: 'var(--color-danger)'}}>18%</div>
              </div>
              <div className="text-muted">→</div>
              <div>
                <div className="text-xs text-muted mb-1">Predicted Rate</div>
                <div className="text-lg font-bold" style={{color: 'var(--color-success)'}}>{rate}%</div>
              </div>
            </div>
          </div>

          <div className="insight-bullets">
            {streak >= 3 && (
              <div className="insight-bullet bullet-good text-xs">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M14 4L6 12L2 8"/></svg>
                Great streak! {streak} repaid loans show lenders you are reliable.
              </div>
            )}
            
            <div className={`insight-bullet ${podStrength === 'weak' ? 'bullet-warn' : 'bullet-good'} text-xs`}>
              {podStrength === 'weak' ? (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.5"/></svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M14 4L6 12L2 8"/></svg>
              )}
              {podStrength === 'weak' 
                ? 'Your pod is weak. Encouraging others to repay connects you to better rates.' 
                : podStrength === 'average' 
                  ? 'Average pod strength helps. Upgrading to a strong pod could add up to 10 points.' 
                  : 'Strong pod! Your community directly lowers your risk profile.'}
            </div>

            <div className={`insight-bullet ${verification !== 'ngo' ? 'bullet-warn' : 'bullet-good'} text-xs`}>
              {verification !== 'ngo' ? (
                 <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.5"/></svg>
              ) : (
                 <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M14 4L6 12L2 8"/></svg>
              )}
               {verification === 'none' 
                ? 'Add phone verification for an instant 5 point boost.' 
                : verification === 'phone' 
                  ? 'NGO + gig verification could add 7 more points and drop your rate by ~4%.' 
                  : 'Fully verified profile! This shows lenders you are exactly who you say you are.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
