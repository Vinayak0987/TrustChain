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
  const { account, connectWallet, rtkContract, connectError } = useContext(Web3Context);

  useEffect(() => {
    setTitle(SCREEN_TITLES[location.pathname] || '');
  }, [location]);

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
          <button
            className="btn animate-fade-in-up"
            style={{ backgroundColor: '#185FA5', color: '#fff', fontSize: '12px', padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            onClick={async () => {
              if (!window.ethereum || !rtkContract) return;
              try {
                const address = await rtkContract.getAddress();
                await window.ethereum.request({
                  method: 'wallet_watchAsset',
                  params: {
                    type: 'ERC20',
                    options: {
                      address: address,
                      symbol: 'RTK',
                      decimals: 18,
                      image: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/React-icon.svg',
                    },
                  },
                });
                showToast('RTK Token brilliantly added to MetaMask!', 'success');
              } catch (e) {
                console.error(e);
                showToast('Failed to add token to MetaMask.', 'error');
              }
            }}
            title="Import RTK Token to MetaMask"
          >
            🦊 Add RTK to Wallet
          </button>
        )}

        {!account ? (
          <button 
            type="button"
            className="btn" 
            style={{ backgroundColor: '#F6851B', color: '#fff', fontSize: '13px', padding: '6px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={async (e) => {
              e.preventDefault();
              const result = await connectWallet();
              if (!result && connectError) showToast(connectError, 'error');
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
