import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../../context/Web3Context';
import {
  isMetaMaskInstalled,
  isHardhatNodeRunning,
  ensureLocalNetwork,
  LOCAL_CHAIN_ID,
  LOCAL_RPC_URL,
} from '../../utils/metamask';

const cardStyle = {
  background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 60%)',
  border: '1.5px solid #FDBA74',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
};

const stepStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  marginBottom: '14px',
  fontSize: '14px',
  color: '#475569',
  lineHeight: 1.5,
};

const numStyle = {
  minWidth: '24px',
  height: '24px',
  borderRadius: '50%',
  background: '#F6851B',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const MetaMaskSetupPanel = ({ onDismiss }) => {
  const { account, connectWallet, walletStatus, connectError } = useContext(Web3Context);
  const [nodeUp, setNodeUp] = useState(null);
  const [addingNetwork, setAddingNetwork] = useState(false);

  useEffect(() => {
    isHardhatNodeRunning().then(setNodeUp);
  }, []);

  if (account && walletStatus === 'ready') return null;

  const handleAddNetwork = async () => {
    setAddingNetwork(true);
    try {
      await ensureLocalNetwork();
    } finally {
      setAddingNetwork(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1A2B3D' }}>
            🦊 Set up MetaMask for transactions
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Loans and repayments use RTK tokens on your local Hardhat blockchain.
          </p>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }} aria-label="Dismiss">
            ×
          </button>
        )}
      </div>

      {nodeUp === false && (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          ⚠ Blockchain not running. Open a terminal and run: <code style={{ fontWeight: 700 }}>npx hardhat node</code>
          {' '}then <code style={{ fontWeight: 700 }}>node scripts/deploy.js</code>
        </div>
      )}

      {connectError && (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          {connectError}
        </div>
      )}

      <div style={stepStyle}>
        <span style={numStyle}>1</span>
        <div>
          <strong>Install MetaMask</strong>
          <br />
          {isMetaMaskInstalled() ? (
            <span style={{ color: '#059669' }}>✓ Extension detected</span>
          ) : (
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" style={{ color: '#185FA5', fontWeight: 600 }}>
              Download MetaMask →
            </a>
          )}
        </div>
      </div>

      <div style={stepStyle}>
        <span style={numStyle}>2</span>
        <div>
          <strong>Add local network</strong> (Chain ID {LOCAL_CHAIN_ID}, RPC {LOCAL_RPC_URL})
          <br />
          <button
            type="button"
            onClick={handleAddNetwork}
            disabled={!isMetaMaskInstalled() || addingNetwork}
            style={{
              marginTop: '8px', padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: addingNetwork ? '#FED7AA' : '#F6851B', color: '#fff', fontWeight: 600, fontSize: '13px',
              cursor: isMetaMaskInstalled() ? 'pointer' : 'not-allowed',
            }}
          >
            {addingNetwork ? 'Adding…' : 'Add Hardhat Local to MetaMask'}
          </button>
        </div>
      </div>

      <div style={stepStyle}>
        <span style={numStyle}>3</span>
        <div>
          <strong>Import a test account</strong>
          <br />
          Use <strong>Hardhat Account #0</strong> (has 10,000 test ETH): copy its private key from the
          <code>npx hardhat node</code> terminal → MetaMask → Import account.
          <span style={{ fontSize: '12px', color: '#94a3b8' }}> If you use another address with 0 ETH, run </span>
          <code style={{ fontSize: '11px' }}>node scripts/fund-wallet.js YOUR_ADDRESS</code>
        </div>
      </div>

      <div style={stepStyle}>
        <span style={numStyle}>4</span>
        <div>
          <strong>Connect wallet</strong>
          <br />
          <button
            type="button"
            onClick={connectWallet}
            disabled={!isMetaMaskInstalled()}
            style={{
              marginTop: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: '#3B9B9B', color: '#fff', fontWeight: 700, fontSize: '14px',
              cursor: isMetaMaskInstalled() ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="" width={18} height={18} />
            Connect MetaMask
          </button>
        </div>
      </div>
    </div>
  );
};
