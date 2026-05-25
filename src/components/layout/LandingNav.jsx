import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../shared/useRipple';

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav-logo" aria-label="TrustChain home">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="16" cy="16" r="14" stroke="#3B9B9B" strokeWidth="2"/>
          <path d="M10 16.5C10 13.46 12.46 11 15.5 11H22l-3 3h-3.5C12.91 14 12 14.91 12 16.5S12.91 19 14.5 19H18l3 3H14.5C12.46 22 10 19.54 10 16.5Z" fill="#3B9B9B"/>
          <circle cx="22" cy="11" r="2" fill="#F4845F"/>
          <circle cx="22" cy="22" r="2" fill="#E8A838"/>
        </svg>
        <span>TrustChain</span>
      </Link>
      <div className="nav-links">
        <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')}>How it works</a>
        <a href="#docs">Docs</a>
        <a href="#security">Security</a>
        <a href="#faq">FAQ</a>
      </div>
      <Link to="/app/dashboard" className="btn btn-primary" aria-label="Launch the TrustChain app">Launch App</Link>
    </nav>
  );
};
