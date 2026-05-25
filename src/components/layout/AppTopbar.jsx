import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../shared/ToastProvider';
import { Web3Context } from '../../context/Web3Context';

const SCREEN_TITLES = {
  '/app/dashboard': 'Dashboard',
  '/app/pod': 'Community Pod',
  '/app/loan': 'Request a Loan',
  '/app/simulation': 'Trust Simulator',
};

export const AppTopbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [title, setTitle] = useState('Dashboard');
  const showToast = useToast();
  const { account, connectWallet, rtkContract, rtkBalance, claimFaucet, refreshRTKBalance } = useContext(Web3Context);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    setTitle(SCREEN_TITLES[location.pathname] || '');
  }, [location]);

  const handleClaim = async () => {
    if (!rtkContract || !claimFaucet) return;
    setClaiming(true);
    showToast('⏳ Confirm RTK claim in MetaMask…', 'info');
    const success = await claimFaucet();
    if (success) {
      if (refreshRTKBalance) await refreshRTKBalance();
      showToast('💰 ₹1,00,000 RTK credited to your wallet!', 'success');
    } else {
      showToast('Faucet already claimed or failed.', 'error');
    }
    setClaiming(false);
  };

  return (
    <header className="app-topbar" role="banner">
      <button 
        className="btn btn-icon btn-ghost" 
        id="sidebar-toggle" 
        aria-label="Toggle navigation menu" 
        onClick={toggleSidebar}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2 5h16M2 10h16M2 15h16"/></svg>
      </button>
      
      <div className="topbar-title" id="topbar-title">{title}</div>
      
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {account && rtkContract && (
          <>
            {/* RTK Balance chip */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                {parseFloat(rtkBalance || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })} RTK
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>1 RTK = ₹1</span>
            </div>

            {/* Claim Faucet */}
            <button
              className="btn"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontSize: '11px', padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: claiming ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: claiming ? 0.7 : 1 }}
              disabled={claiming}
              title="Claim ₹1,00,000 RTK for testing"
              onClick={handleClaim}
            >
              {claiming ? '⏳' : '💧 Claim RTK'}
            </button>

            {/* Add to MetaMask */}
            <button
              className="btn animate-fade-in-up"
              style={{ backgroundColor: '#185FA5', color: '#fff', fontSize: '12px', padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              onClick={async () => {
                if (!window.ethereum || !rtkContract) return;
                try {
                  const address = await rtkContract.getAddress();
                  await window.ethereum.request({
                    method: 'wallet_watchAsset',
                    params: { type: 'ERC20', options: { address, symbol: 'RTK', decimals: 18, image: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/React-icon.svg' } },
                  });
                  showToast('RTK Token added to MetaMask!', 'success');
                } catch (e) {
                  showToast('Failed to add token to MetaMask.', 'error');
                }
              }}
              title="Import RTK Token to MetaMask"
            >
              🦊 Add RTK
            </button>
          </>
        )}

        {!account ? (
          <button 
            type="button"
            className="btn" 
            style={{ backgroundColor: '#F6851B', color: '#fff', fontSize: '13px', padding: '6px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={async (e) => {
              e.preventDefault();
              try {
                await connectWallet();
              } catch (err) {
                console.error('connectWallet threw an error:', err);
              }
            }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" style={{ width: '16px', height: '16px' }} />
            <span className="hidden-mobile">Connect MetaMask</span>
          </button>
        ) : (
          <div style={{ backgroundColor: '#EAF3DE', color: 'var(--color-success)', fontSize: '13px', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, border: '1px solid #BFE096', fontFamily: 'monospace' }}>
            {`${account.slice(0, 6)}...${account.slice(-4)}`}
          </div>
        )}

        <button 
          className="btn btn-icon btn-ghost" 
          id="topbar-notify-btn" 
          aria-label="Notifications"
          onClick={() => showToast('No new notifications right now.')}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 2a6 6 0 00-6 6v4l-1.5 2h15L16 12V8a6 6 0 00-6-6z"/><path d="M8 17a2 2 0 004 0"/></svg>
        </button>
        <div className="topbar-avatar" role="button" tabIndex="0" aria-label="User menu">
          <div className="avatar avatar-sm">RK</div>
        </div>
      </div>
    </header>
  );
};
