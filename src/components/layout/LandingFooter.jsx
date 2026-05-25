import React from 'react';

export const LandingFooter = () => (
  <footer className="landing-footer" role="contentinfo">
    <div className="footer-inner">
      <div className="footer-brand">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="#3B9B9B" strokeWidth="1.5"/>
          <path d="M7.5 12.5c0-2.5 2-4.5 4.5-4.5h5l-2.5 2.5H12C10.5 10.5 10 11 10 12.5S10.5 14.5 12 14.5H14l2.5 2.5H12c-2.5 0-4.5-2-4.5-4.5Z" fill="#3B9B9B"/>
        </svg>
        TrustChain · © 2026
      </div>
      <nav className="footer-links" aria-label="Footer links">
        <a href="#docs">Docs</a>
        <a href="#security">Security</a>
        <a href="#faq">FAQ</a>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
      </nav>
    </div>
  </footer>
);
