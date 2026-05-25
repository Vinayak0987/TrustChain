import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useToast } from '../components/shared/ToastProvider';
import { fetchAllTransactions, timeAgo } from '../utils/supabaseService';
import { MOCK_ACTIVITY } from '../data/mockData';

const typeStyle = {
  repaid:    { label: 'Repaid ✓',   color: 'var(--color-success)', bg: '#EAF3DE' },
  funded:    { label: 'Funded',      color: '#185FA5',              bg: '#E6F1FB' },
  requested: { label: 'Requested',   color: 'var(--color-warning)', bg: '#FDE8C0' },
  vouched:   { label: 'Vouched',     color: '#534AB7',              bg: '#EEEDFE' },
  endorsed:  { label: 'Endorsed',    color: '#3B9B9B',              bg: '#E0F4F4' },
  verified:  { label: 'Verified',    color: '#856404',              bg: '#FFF3CD' },
};

export const TransactionLogPage = () => {
  const { user } = useContext(AppContext);
  const showToast = useToast();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const dbItems = await fetchAllTransactions(50);
      if (dbItems.length > 0) {
        setAllItems(dbItems);
      } else {
        // Fallback to mock data when Supabase has no records yet
        const mockFormatted = MOCK_ACTIVITY.map(m => ({
          id: m.id,
          type: m.type,
          actor_name: m.actor,
          amount: m.amount,
          created_at: null,
          _time: m.time, // keep original string
        }));
        setAllItems([
          ...mockFormatted,
          { id: 'a7', type: 'repaid',    actor_name: 'Kavita', amount: 750,  created_at: null, _time: '3d ago' },
          { id: 'a8', type: 'requested', actor_name: 'Mohan',  amount: 6000, created_at: null, _time: '3d ago' },
          { id: 'a9', type: 'funded',    actor_name: 'Sneha',  amount: 4000, created_at: null, _time: '4d ago' },
          { id: 'a10',type: 'repaid',    actor_name: 'Ganesh', amount: 1000, created_at: null, _time: '5d ago' },
        ]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filterByDate = (items) => {
    if (dateFilter === 'all') return items;
    const cutoff = Date.now() - { '7d': 7, '30d': 30, '90d': 90 }[dateFilter] * 86400000;
    return items.filter(i => i.created_at && new Date(i.created_at).getTime() > cutoff);
  };

  const items = filterByDate(
    filter === 'all' ? allItems : allItems.filter(i => i.type === filter)
  );

  const handleExport = () => {
    const rows = [
      ['Type', 'Actor', 'Amount', 'Time'],
      ...items.map(i => [i.type, i.actor_name, i.amount || '', i.created_at ? timeAgo(i.created_at) : (i._time || '')]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trustchain_activity.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
  };

  return (
    <section className="screen active" aria-label="Transaction Log">
      <div className="page-header-row">
        <div>
          <h2 className="page-title-lg">Activity Log</h2>
          <div className="card-subtitle">All transactions on TrustChain</div>
        </div>
        <button className="btn btn-outline btn-sm" id="export-csv-btn" onClick={handleExport}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="filter-row">
          <div className="filter-group" role="group" aria-label="Filter by type">
            {['all', 'repaid', 'funded', 'requested', 'endorsed', 'verified'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                id={`filter-${f}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="filter-group date-filter" role="group" aria-label="Filter by date">
            {['all', '7d', '30d', '90d'].map(d => (
              <button
                key={d}
                className={`filter-btn ${dateFilter === d ? 'active' : ''}`}
                id={`date-filter-${d}`}
                onClick={() => setDateFilter(d)}
              >
                {d === 'all' ? 'All time' : `Last ${d}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="card animate-fade-in-up stagger-2">
        {loading ? (
          <div className="text-center text-muted" style={{ padding: 'var(--sp-8)' }}>Loading transactions…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: 'var(--sp-8)' }}>
            No transactions found for this filter.
          </div>
        ) : (
          <div role="list" aria-label="Activity feed" className="txn-feed">
            {items.map(item => {
              const { label, color, bg } = typeStyle[item.type] || typeStyle.repaid;
              const timeStr = item.created_at ? timeAgo(item.created_at) : (item._time || '');
              return (
                <div key={item.id} className="txn-row" role="listitem">
                  <div className="txn-icon" style={{ background: bg, color }} aria-hidden="true">
                    {{ repaid: '✓', funded: '₹', requested: '📋', vouched: '🤝', endorsed: '🌟', verified: '🪪' }[item.type] || '•'}
                  </div>
                  <div className="txn-body">
                    <div className="txn-title">
                      <span className="font-medium">{item.actor_name || 'User'}</span>
                      {item.type === 'repaid'    && <> repaid <strong>₹{item.amount?.toLocaleString('en-IN')}</strong></>}
                      {item.type === 'funded'    && <> funded <strong>₹{item.amount?.toLocaleString('en-IN')}</strong></>}
                      {item.type === 'requested' && <> requested <strong>₹{item.amount?.toLocaleString('en-IN')}</strong> loan</>}
                      {item.type === 'vouched'   && <> vouched for a community member</>}
                      {item.type === 'endorsed'  && <> earned an endorsement</>}
                      {item.type === 'verified'  && <> completed identity verification</>}
                    </div>
                    <div className="txn-time text-xs text-muted">{timeStr}</div>
                  </div>
                  <span className="pill text-xs" style={{ background: bg, color, border: 'none', flexShrink: 0 }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && (
        <div className="text-center text-xs text-muted mt-3">
          {allItems.length > 0 && allItems[0].created_at
            ? `${allItems.length} transactions loaded from Supabase`
            : 'Showing sample data — transactions will appear here as activity occurs'}
        </div>
      )}
    </section>
  );
};
