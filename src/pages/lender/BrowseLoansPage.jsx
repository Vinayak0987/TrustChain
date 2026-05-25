import React, { useState, useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../../context/Web3Context';
import { AppContext } from '../../context/AppContext';
import { fetchOpenLoans } from '../../utils/supabaseService';
import { MOCK_LOANS } from '../../data/mockData';
import { LoanCard } from '../../components/shared/SharedComponents';
import { ethers } from 'ethers';

// ─── Filter defaults ──────────────────────────────────────────────────────────
const TENURE_OPTIONS = [1, 3, 6, 12, 24];

const DEFAULTS = {
  riskTier:       'all',
  borrowerType:   'all',
  amountMin:      0,
  amountMax:      50000,
  remainingMin:   0,
  remainingMax:   50000,
  tenureSelected: [],   // [] = all; any combo of [1,3,6,12,24]
  incomeText:     '',   // blank = no filter; value = min income (>=)
  ageText:        '',   // blank = no filter; value = min age (>=)
  trustMin:       0,
  trustMax:       100,
  panelOpen:      false,
};

// ─── Dual-range slider helper ─────────────────────────────────────────────────
const RangeSlider = ({ label, unit, min, max, valueMin, valueMax, onMinChange, onMaxChange, step = 1, format }) => {
  const fmt = format || ((v) => `${unit || ''}${v.toLocaleString('en-IN')}`);
  return (
    <div style={{ marginBottom: 'var(--sp-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          {fmt(valueMin)} — {fmt(valueMax)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'var(--color-border)', borderRadius: 2 }} />
        {/* Active range highlight */}
        <div style={{
          position: 'absolute',
          left: `${((valueMin - min) / (max - min)) * 100}%`,
          right: `${((max - valueMax) / (max - min)) * 100}%`,
          height: 4, background: 'var(--color-primary)', borderRadius: 2,
        }} />
        {/* Min thumb */}
        <input type="range" min={min} max={max} step={step} value={valueMin}
          onChange={e => { const v = Number(e.target.value); if (v <= valueMax) onMinChange(v); }}
          style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', pointerEvents: 'none', cursor: 'pointer' }}
          className="dual-range-thumb"
        />
        {/* Max thumb */}
        <input type="range" min={min} max={max} step={step} value={valueMax}
          onChange={e => { const v = Number(e.target.value); if (v >= valueMin) onMaxChange(v); }}
          style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', pointerEvents: 'none', cursor: 'pointer' }}
          className="dual-range-thumb"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: 2 }}>
        <span>{fmt(min)}</span><span>{fmt(max)}</span>
      </div>
    </div>
  );
};

// ─── Chip toggle group ────────────────────────────────────────────────────────
const ChipGroup = ({ label, options, value, onChange }) => (
  <div style={{ marginBottom: 'var(--sp-4)' }}>
    <div className="form-label" style={{ fontSize: '0.8rem', marginBottom: 6 }}>{label}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => (
        <button key={opt.val}
          onClick={() => onChange(opt.val)}
          style={{
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            background:     value === opt.val ? 'var(--color-primary)' : 'transparent',
            borderColor:    value === opt.val ? 'var(--color-primary)' : 'var(--color-border)',
            color:          value === opt.val ? 'white' : 'var(--color-text)',
          }}
          id={`filter-chip-${String(opt.val).toLowerCase().replace(/\s+/g, '-')}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
export const BrowseLoansPage = () => {
  const navigate = useNavigate();
  const { contract } = React.useContext(Web3Context);
  const { user } = useContext(AppContext);

  // ── live loans from Supabase ────────────────────────────────────────────
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
        borrowerType: 'Self-Employed',
        monthlyIncome: 20000,
        age: 28,
        kycVerified: l.profiles?.kyc_status === 'completed',
        source: 'db',
      })));
    };
    load();
  }, []);

  // ── live loans from blockchain ────────────────────────────────────────────
  const [liveLoans, setLiveLoans] = useState([]);

  React.useEffect(() => {
    const fetchLoans = async () => {
      if (!contract) return;
      try {
        const count = await contract.getLoanCount();
        const arr   = [];
        for (let i = 0; i < Number(count); i++) {
          const lData = await contract.loans(i);
          if (Number(lData.status) === 0) {
            let score = 50;
            try { const u = await contract.users(lData.borrower); score = Number(u.trustScore); } catch (_) {}
            const principal    = Number(ethers.formatEther(lData.principal));
            const interestRate = Number(lData.interestRate);
            const totalOwed    = Number(ethers.formatEther(lData.totalOwed));
            // Generate deterministic-looking demo metadata from address
            const seed = parseInt(lData.borrower.slice(2, 6), 16);
            arr.push({
              id:            Number(lData.id),
              borrowerAddress: lData.borrower,
              borrower:      lData.borrower.slice(0, 6) + '…' + lData.borrower.slice(38),
              initials:      lData.borrower.slice(2, 4).toUpperCase(),
              avatarColor:   '#534AB7',
              amount:        principal,
              funded:        0,
              totalOwed,
              interestRate,
              daysLeft:      7,
              trustScore:    score,
              riskTier:      interestRate === 12 ? 'Low' : interestRate === 16 ? 'Medium' : 'High',
              story:         lData.purpose,
              purpose:       lData.purpose,
              location:      'Decentralized',
              repaymentPeriod: '3 Months',
              tenure:        3,
              borrowerType:  seed % 2 === 0 ? 'Salaried' : 'Self-Employed',
              monthlyIncome: 15000 + (seed % 40) * 1000,
              age:           22 + (seed % 40),
            });
          }
        }
        setLiveLoans(arr.reverse());
      } catch (err) { console.error('Failed to fetch loans:', err); }
    };
    fetchLoans();
    const iv = setInterval(fetchLoans, 5000);
    return () => clearInterval(iv);
  }, [contract]);

  // ── filter state ──────────────────────────────────────────────────────────
  const [f, setF] = useState(DEFAULTS);
  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }));

  const resetAll = () => setF(DEFAULTS);

  // ── combined & filtered loans ─────────────────────────────────────────────
  // Priority: blockchain > Supabase DB > mock fallback (only when both are empty)
  const combined = [
    ...liveLoans,
    ...dbLoans.filter(d => !liveLoans.some(l => l.borrowerAddress === d.walletAddress)),
    ...(liveLoans.length === 0 && dbLoans.length === 0 ? MOCK_LOANS : []),
  ];

  const filtered = combined.filter(l => {
    const remaining = l.amount - (l.funded ?? 0);
    const tenure    = l.tenure ?? (parseInt(l.repaymentPeriod) || 3);
    const income    = l.monthlyIncome ?? 20000;
    const age       = l.age ?? 30;

    // Tenure: if none checked → show all; else loan tenure must match one checked
    const tenureOk = f.tenureSelected.length === 0 || f.tenureSelected.includes(tenure);

    // Single income box = minimum income (blank = no filter)
    const incomeOk = f.incomeText === '' || income >= Number(f.incomeText);

    // Single age box = minimum age (blank = no filter)
    const ageOk = f.ageText === '' || age >= Number(f.ageText);

    return (
      (f.riskTier     === 'all' || l.riskTier    === f.riskTier)     &&
      (f.borrowerType === 'all' || l.borrowerType === f.borrowerType) &&
      l.amount     >= f.amountMin    && l.amount    <= f.amountMax    &&
      remaining    >= f.remainingMin && remaining   <= f.remainingMax &&
      l.trustScore >= f.trustMin     && l.trustScore <= f.trustMax    &&
      tenureOk && incomeOk && ageOk
    );
  });

  // Active filter count (for badge)
  const activeCount = [
    f.riskTier !== 'all',
    f.borrowerType !== 'all',
    f.amountMin > DEFAULTS.amountMin   || f.amountMax   < DEFAULTS.amountMax,
    f.remainingMin > DEFAULTS.remainingMin || f.remainingMax < DEFAULTS.remainingMax,
    f.tenureSelected.length > 0,
    f.incomeText !== '',
    f.ageText    !== '',
    f.trustMin  > DEFAULTS.trustMin    || f.trustMax    < DEFAULTS.trustMax,
  ].filter(Boolean).length;

  const rupee = (v) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <section className="screen active" aria-label="Browse Loans">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title-lg">Browse Loans</h2>
          <div className="card-subtitle">
            {filtered.length} loan{filtered.length !== 1 ? 's' : ''} match your filters
            {(liveLoans.length > 0 || dbLoans.length > 0) && ` · ${liveLoans.length} live ⛓️ + ${dbLoans.length} from database`}
          </div>
        </div>
        <button
          className="btn btn-outline"
          id="toggle-filters-btn"
          onClick={() => set('panelOpen', !f.panelOpen)}
          style={{ position: 'relative', borderColor: activeCount > 0 ? 'var(--color-primary)' : undefined }}
        >
          🎛️ Filters
          {activeCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--color-primary)', color: 'white',
              borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>{activeCount}</span>
          )}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      {f.panelOpen && (
        <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Advanced Filters</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {activeCount > 0 && (
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 12px', color: 'var(--color-danger)' }}
                  onClick={resetAll} id="reset-filters-btn">
                  ✕ Reset all ({activeCount})
                </button>
              )}
              <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 16px' }}
                onClick={() => set('panelOpen', false)} id="apply-filters-btn">
                Apply →
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--sp-6)' }}>

            {/* Column 1: Category chips */}
            <div>
              <ChipGroup label="Risk Category"
                options={[{val:'all',label:'All'},{val:'Low',label:'🟢 Low'},{val:'Medium',label:'🟡 Medium'},{val:'High',label:'🔴 High'}]}
                value={f.riskTier} onChange={v => set('riskTier', v)} />

              <ChipGroup label="Borrower Type"
                options={[{val:'all',label:'All'},{val:'Salaried',label:'💼 Salaried'},{val:'Self-Employed',label:'🏪 Self-Employed'}]}
                value={f.borrowerType} onChange={v => set('borrowerType', v)} />

              {/* Loan Tenure — Checkboxes */}
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div className="form-label" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Loan Tenure</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TENURE_OPTIONS.map(mo => {
                    const checked = f.tenureSelected.includes(mo);
                    return (
                      <label key={mo}
                        htmlFor={`tenure-cb-${mo}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 20,
                          border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: checked ? 'var(--color-primary)' : 'transparent',
                          color: checked ? 'white' : 'var(--color-text)',
                          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                          transition: 'all 0.15s', userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`tenure-cb-${mo}`}
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? f.tenureSelected.filter(v => v !== mo)
                              : [...f.tenureSelected, mo];
                            set('tenureSelected', next);
                          }}
                          style={{ display: 'none' }}
                        />
                        {mo} mo
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: 5 }}>
                  {f.tenureSelected.length === 0 ? '✓ Showing all tenures' : `Showing: ${[...f.tenureSelected].sort((a,b)=>a-b).join(', ')} months`}
                </div>
              </div>
            </div>

            {/* Column 2: Amount sliders */}
            <div>
              <RangeSlider label="Loan Amount (₹)" min={0} max={50000} step={500}
                valueMin={f.amountMin} valueMax={f.amountMax}
                onMinChange={v => set('amountMin', v)} onMaxChange={v => set('amountMax', v)}
                format={rupee} />

              <RangeSlider label="Remaining / Unfunded (₹)" min={0} max={50000} step={500}
                valueMin={f.remainingMin} valueMax={f.remainingMax}
                onMinChange={v => set('remainingMin', v)} onMaxChange={v => set('remainingMax', v)}
                format={rupee} />

              <RangeSlider label="Trust Score" min={0} max={100} step={1}
                valueMin={f.trustMin} valueMax={f.trustMax}
                onMinChange={v => set('trustMin', v)} onMaxChange={v => set('trustMax', v)}
                format={v => `${v} pts`} />
            </div>

            {/* Column 3: Single text inputs for income and age */}
            <div>
              {/* Monthly Income — single box (minimum income) */}
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div className="form-label" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Monthly Income (₹)</div>
                <input
                  type="number"
                  id="income-input"
                  className="form-control"
                  placeholder="e.g. 20000"
                  value={f.incomeText}
                  min={0}
                  onChange={e => set('incomeText', e.target.value)}
                  style={{ fontSize: '0.9rem', padding: '9px 12px' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: 5 }}>
                  {f.incomeText === ''
                    ? '✓ No income filter'
                    : `Showing borrowers earning ≥ ₹${Number(f.incomeText).toLocaleString('en-IN')}/mo`}
                </div>
              </div>

              {/* Borrower Age — single box (minimum age) */}
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div className="form-label" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Borrower Age (years)</div>
                <input
                  type="number"
                  id="age-input"
                  className="form-control"
                  placeholder="e.g. 25"
                  value={f.ageText}
                  min={18} max={80}
                  onChange={e => set('ageText', e.target.value)}
                  style={{ fontSize: '0.9rem', padding: '9px 12px' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: 5 }}>
                  {f.ageText === ''
                    ? '✓ No age filter'
                    : `Showing borrowers aged ≥ ${f.ageText} yrs`}
                </div>
              </div>
            </div>
          </div>

          {/* Active filter summary chips */}
          {activeCount > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--sp-4)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', alignSelf: 'center' }}>Active:</span>
              {f.riskTier !== 'all'     && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Risk: {f.riskTier}</span>}
              {f.borrowerType !== 'all' && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Type: {f.borrowerType}</span>}
              {(f.amountMin > 0 || f.amountMax < 50000) && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Amount: {rupee(f.amountMin)}–{rupee(f.amountMax)}</span>}
              {(f.remainingMin > 0 || f.remainingMax < 50000) && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Remaining: {rupee(f.remainingMin)}–{rupee(f.remainingMax)}</span>}
              {f.tenureSelected.length > 0 && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Tenure: {[...f.tenureSelected].sort((a,b)=>a-b).join(', ')} mo</span>}
              {f.incomeText !== '' && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Income ≥ ₹{Number(f.incomeText).toLocaleString('en-IN')}</span>}
              {f.ageText    !== '' && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Age ≥ {f.ageText} yrs</span>}
              {(f.trustMin > 0 || f.trustMax < 100) && <span className="pill pill-success" style={{ fontSize: '0.7rem' }}>Score: {f.trustMin}–{f.trustMax} pts</span>}
            </div>
          )}
        </div>
      )}

      {/* Quick filter bar (always visible) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--sp-4)', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>Quick:</span>
        {[
          { label: 'All Loans',     action: () => resetAll() },
          { label: '🟢 Low Risk',   action: () => setF(p => ({ ...p, riskTier: 'Low' })) },
          { label: '💼 Salaried',   action: () => setF(p => ({ ...p, borrowerType: 'Salaried' })) },
          { label: '🏪 Self-Emp',   action: () => setF(p => ({ ...p, borrowerType: 'Self-Employed' })) },
          { label: '≤ ₹10k',        action: () => setF(p => ({ ...p, amountMin: 0, amountMax: 10000 })) },
          { label: '1 mo tenure',   action: () => setF(p => ({ ...p, tenureMin: 1, tenureMax: 1 })) },
          { label: 'High Trust 80+', action: () => setF(p => ({ ...p, trustMin: 80, trustMax: 100 })) },
        ].map(q => (
          <button key={q.label} className="filter-btn" style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            onClick={q.action} id={`quick-filter-${q.label.toLowerCase().replace(/\W+/g, '-')}`}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Loan cards grid */}
      <div className="loan-browse-grid">
        {filtered.length === 0 ? (
          <div className="card text-center" style={{ gridColumn: '1/-1', padding: 'var(--sp-10)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <div className="card-title mb-2">No loans match your filters</div>
            <div className="card-subtitle mb-4">Try widening your range sliders or resetting all filters.</div>
            <button className="btn btn-primary" onClick={resetAll} id="reset-empty-btn">Reset All Filters</button>
          </div>
        ) : (
          filtered.map(loan => (
            <div key={loan.id} style={{ position: 'relative' }}>
              <LoanCard loan={loan} onFund={() => navigate('/loan/fund', { state: { loan } })} showFundBtn={true} />
              {/* Extra metadata row below card */}
              <div style={{
                display: 'flex', gap: 8, flexWrap: 'wrap', padding: '6px 12px 10px',
                fontSize: '0.72rem', color: 'var(--color-muted)',
              }}>
                {loan.borrowerType && (
                  <span>💼 {loan.borrowerType}</span>
                )}
                {loan.monthlyIncome && (
                  <span>📅 Income: ₹{loan.monthlyIncome.toLocaleString('en-IN')}/mo</span>
                )}
                {loan.age && (
                  <span>🎂 Age: {loan.age} yrs</span>
                )}
                {loan.tenure && (
                  <span>⏱️ {loan.tenure} mo tenure</span>
                )}
                <span>💰 Remaining: ₹{(loan.amount - (loan.funded ?? 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
