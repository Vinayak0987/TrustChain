/** Local Hardhat network — must match `npx hardhat node` and MetaMask custom network */
export const LOCAL_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337);
export const LOCAL_CHAIN_ID_HEX = `0x${LOCAL_CHAIN_ID.toString(16)}`;
export const LOCAL_RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

export const LOCAL_NETWORK_PARAMS = {
  chainId: LOCAL_CHAIN_ID_HEX,
  chainName: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: [LOCAL_RPC_URL],
};

export const isMetaMaskInstalled = () =>
  typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);

export const getMetaMaskChainId = async () => {
  if (!window.ethereum) return null;
  const hex = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(hex, 16);
};

export const isCorrectChain = async () => {
  const chainId = await getMetaMaskChainId();
  return chainId === LOCAL_CHAIN_ID;
};

/** Add Hardhat network to MetaMask if missing */
export const addLocalNetwork = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [LOCAL_NETWORK_PARAMS],
  });
};

/** Switch MetaMask to Hardhat local network */
export const switchToLocalNetwork = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
    });
  } catch (err) {
    if (err?.code === 4902) {
      await addLocalNetwork();
      return;
    }
    throw err;
  }
};

/** Ensure user is on the local dev chain before sending transactions */
export const ensureLocalNetwork = async () => {
  if (!window.ethereum) {
    return { ok: false, reason: 'missing' };
  }
  try {
    const current = await getMetaMaskChainId();
    if (current === LOCAL_CHAIN_ID) return { ok: true };
    await switchToLocalNetwork();
    const after = await getMetaMaskChainId();
    return after === LOCAL_CHAIN_ID ? { ok: true } : { ok: false, reason: 'wrong_network' };
  } catch (e) {
    return { ok: false, reason: 'network_error', message: e?.message || 'Could not switch network' };
  }
};

/** True if bytecode exists at address (contract deployed on this chain) */
export const isContractDeployed = async (address, rpcUrl = LOCAL_RPC_URL) => {
  if (!address) return false;
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1,
      }),
    });
    const data = await res.json();
    const code = data.result || '0x';
    return code !== '0x' && code !== '0x0';
  } catch {
    return false;
  }
};

/** Quick check that Hardhat node is reachable */
export const isHardhatNodeRunning = async () => {
  try {
    const res = await fetch(LOCAL_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
    });
    const data = await res.json();
    return parseInt(data.result, 16) === LOCAL_CHAIN_ID;
  } catch {
    return false;
  }
};
