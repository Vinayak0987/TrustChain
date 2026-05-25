import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchOpenLoans } from '../utils/supabaseService';
import { MOCK_LOANS } from '../data/mockData';
import { LoanCard } from '../components/shared/SharedComponents';
import { LandingNav } from '../components/layout/LandingNav';
import { LandingFooter } from '../components/layout/LandingFooter';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const LandingPage = () => {
  useScrollAnimation('.animate-fade-in-up');
  const navigate = useNavigate();
  const [dbLoans, setDbLoans] = useState([]);

  useEffect(() => {
    const load = async () => {
      const loans = await fetchOpenLoans();
      setDbLoans(loans.map(l => ({
        id: l.id,
        dbId: l.id,
        borrower: l.profiles?.full_name || 'Anonymous',
        initials: (l.profiles?.full_name || 'AN').substring(0, 2).toUpperCase(),
        avatarColor: l.profiles?.avatar_color || '#3B9B9B',
        amount: l.amount,
        funded: l.funded_amount || 0,
        interestRate: l.interest_rate,
        totalOwed: l.total_owed || Math.round(l.amount * (1 + l.interest_rate / 100)),
        riskTier: l.risk_tier || 'Low',
        trustScore: l.profiles?.trust_score || 50,
        story: l.story || l.purpose,
        purpose: l.purpose,
        location: 'India',
        repaymentPeriod: `${l.period_months} Month${l.period_months > 1 ? 's' : ''}`,
        tenure: l.period_months || 3,
        daysLeft: 14,
        source: 'db',
      })));
    };
    load();
  }, []);

  const displayLoans = dbLoans.length > 0 ? dbLoans.slice(0, 3) : MOCK_LOANS.slice(0, 3);


  return (
    <>
      <LandingNav />
      <main>
        {/* ── Hero ── */}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg" aria-hidden="true">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
          </div>
          <div className="hero-content">
            <div className="hero-eyebrow animate-fade-in-up">Trusted by 12,000+ gig workers across India</div>
            <h1 id="hero-heading">Your reputation is<br /><em>your credit score.</em></h1>
            <p>TrustChain replaces the bank statement with something more real — your community's trust. No branches. No paperwork. Just people vouching for people.</p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta-borrower">Get a Loan</Link>
              <Link to="/signup?role=lender" className="btn btn-ghost btn-lg" id="hero-cta-lender">Lend &amp; Earn</Link>
            </div>
            <div className="hero-trust-row" aria-label="Platform trust indicators">
              <div className="hero-trust-item">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1L2 4v5c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V4L8 1z" /></svg>
                <span>End-to-end encrypted</span>
              </div>
              <div className="hero-trust-item">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M5.5 8.5l2 2 3-4" /></svg>
                <span>Verified community lenders</span>
              </div>
              <div className="hero-trust-item">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="12" height="9" rx="2" /><path d="M5 5V3.5A3 3 0 0111 3.5V5" /></svg>
                <span>No collateral required</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="how-it-works" id="how-it-works" aria-labelledby="how-heading">
          <div className="how-it-works-inner">
            <div className="section-header">
              <h2 id="how-heading">Three simple steps to your first loan</h2>
              <p>From sign-up to funds in your account — designed to be simple for everyone.</p>
            </div>
            <div className="steps-grid">
              {[
                { n: 1, title: 'Verify your identity', body: 'Use your Aadhaar, Voter ID, Ration Card, or any government document. We accept what you have.' },
                { n: 2, title: 'Get community vouchers', body: 'Ask 2–3 trusted people from your community to vouch for you. Their trust becomes your credit.' },
                { n: 3, title: 'Request your loan', body: 'Choose an amount (₹1,000–₹50,000), your purpose, and repayment period. Get funded in 24 hours.' },
              ].map(s => (
                <div key={s.n} className="step-card animate-fade-in-up" style={{ opacity: 0, transform: 'translateY(28px)' }}>
                  <div className="step-number" aria-hidden="true">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats banner ── */}
        <section className="stats-section" aria-labelledby="stats-heading">
          <div className="stats-inner">
            <h2 id="stats-heading" className="visually-hidden">Platform statistics</h2>
            <div className="stats-grid">
              <div className="stat-block animate-fade-in-up stagger-1" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="stat-block-value">190M+</div>
                <div className="stat-block-label">Indians without bank credit</div>
              </div>
              <div className="stat-block animate-fade-in-up stagger-2" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="stat-block-value">₹4.2Cr</div>
                <div className="stat-block-label">Disbursed in 2025</div>
              </div>
              <div className="stat-block animate-fade-in-up stagger-3" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="stat-block-value">94%</div>
                <div className="stat-block-label">On-time repayment rate</div>
              </div>
              <div className="stat-block animate-fade-in-up stagger-4" style={{ opacity: 0, transform: 'translateY(20px)' }}>
                <div className="stat-block-value">12,400+</div>
                <div className="stat-block-label">Active community members</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Loan story cards ── */}
        <section className="loan-stories-section" aria-labelledby="stories-heading">
          <div className="section-header">
            <h2 id="stories-heading">Loans that change lives</h2>
            <p>Real people, real purposes — funded by their community.</p>
          </div>
          <div className="loan-stories-grid">
            {displayLoans.map(loan => (
              <LoanCard key={loan.id} loan={loan} onFund={() => navigate('/login')} showFundBtn={true} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/loans" className="btn btn-outline" id="see-all-loans-btn">See all loan requests →</Link>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="cta-section" aria-labelledby="cta-heading">
          <div className="cta-banner">
            <h2 id="cta-heading">Ready to join the community?</h2>
            <p>Whether you want fair credit or want to lend and earn returns — TrustChain is for you.</p>
            <div className="cta-btn-row">
              <Link to="/signup" className="btn btn-primary btn-lg" style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }} id="cta-borrower-btn">
                Join as Borrower
              </Link>
              <Link to="/signup?role=lender" className="btn btn-lg" style={{ background: 'transparent', color: 'var(--color-surface)', border: '1.5px solid rgba(255,255,255,0.5)' }} id="cta-lender-btn">
                Join as Lender
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};
