import React from 'react';
import { NavLink } from 'react-router-dom';

export const MobileNav = () => {
  return (
    <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
      <NavLink to="/app/dashboard" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Dashboard">
        <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="1" width="9" height="9" rx="2"/><rect x="12" y="1" width="9" height="9" rx="2"/><rect x="1" y="12" width="9" height="9" rx="2"/><rect x="12" y="12" width="9" height="9" rx="2"/></svg>
        <span>Home</span>
      </NavLink>
      <NavLink to="/app/pod" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Community Pod">
        <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7" cy="8" r="3"/><circle cx="15" cy="8" r="3"/><path d="M1 18c0-3.5 2.7-6 6-6h2M13 18c0-3.5 2.7-6 6-6h-2"/></svg>
        <span>Pod</span>
      </NavLink>
      <NavLink to="/app/loan" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Request Loan">
        <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="5" width="20" height="15" rx="2"/><path d="M1 9h20M5 14h4M11 14h6"/></svg>
        <span>Loan</span>
      </NavLink>
      <NavLink to="/app/simulation" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`} aria-label="Trust Simulator">
        <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 17L7 9l5 4 5-7 4 3"/></svg>
        <span>Simulate</span>
      </NavLink>
    </nav>
  );
};
