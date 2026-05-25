import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { scoreColor, scoreTier } from '../../utils/formatters';

export const TrustGaugeCard = () => {
  const { trustScore } = useContext(AppContext);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score counter
    const duration = 1200;
    const startTime = performance.now();
    const from = displayScore;
    
    let animationFrameId;
    
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(from + (trustScore - from) * eased));
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [trustScore]); // Removed displayScore from deps to prevent loop

  const ARC_LENGTH = 282.7;
  const dash = (trustScore / 100) * ARC_LENGTH;
  const tier = scoreTier(trustScore);

  return (
    <div className="trust-card animate-fade-in-up stagger-2" role="region" aria-label="Your Trust Score">
      <div className="gauge-wrapper" aria-label={`Trust score gauge: ${trustScore} out of 100`}>
        <svg className="gauge-svg" viewBox="0 0 240 145" width="220" height="133">
          <path d="M 30 130 A 90 90 0 0 1 210 130" fill="none" stroke="#E8EDF2" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 30 130 A 90 90 0 0 1 90 50" fill="none" stroke="#FFCDD0" strokeWidth="14" strokeLinecap="butt"/>
          <path d="M 90 50 A 90 90 0 0 1 165 50" fill="none" stroke="#FDE8C0" strokeWidth="14" strokeLinecap="butt"/>
          <path d="M 165 50 A 90 90 0 0 1 210 130" fill="none" stroke="#C8EDDA" strokeWidth="14" strokeLinecap="butt"/>
          <path 
            className="gauge-fill"
            d="M 30 130 A 90 90 0 0 1 210 130" 
            fill="none" 
            stroke={scoreColor(trustScore)} 
            strokeWidth="14" 
            strokeDasharray={`${dash}, ${ARC_LENGTH}`} 
          />
        </svg>
        <div className="gauge-center">
          <div className="gauge-score">{displayScore}</div>
          <div className="gauge-label">Trust Score</div>
        </div>
      </div>

      <div className="trust-tier">
        <div className="trust-tier-name">{tier.name}</div>
        <div className="trust-tier-desc" style={{marginTop: '4px'}}>
          <span className={`pill ${tier.pill}`} style={{fontSize: '11px'}}>{tier.level}</span>
        </div>
      </div>

      <div className="trust-hint" role="note">
        💡 Repay on time and stay in a strong community pod to move to <strong>High Trust</strong> and unlock lower rates.
      </div>

      <div className="trust-updated" role="status" aria-live="polite">
        <span className="pulse-dot" aria-hidden="true"></span>
        <span className="text-xs text-muted">Last updated: today at 09:14 AM</span>
      </div>
    </div>
  );
};
