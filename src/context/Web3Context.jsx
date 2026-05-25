import React, { createContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import TrustChainABI from "../artifacts/contracts/TrustChain.sol/TrustChain.json";
import RupeeTrustTokenABI from "../artifacts/contracts/RupeeTrustToken.sol/RupeeTrustToken.json";

export const Web3Context = createContext();

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const Web3Provider = ({ children }) => {
  const [account, setAccount]           = useState("");
  const [contract, setContract]         = useState(null);
  const [rtkContract, setRtkContract]   = useState(null);
  const [rtkBalance, setRtkBalance]     = useState("0");
  const [provider, setProvider]         = useState(null);
  const [signer, setSigner]             = useState(null);
  const [trustScore, setTrustScore]     = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering]   = useState(false);

  const refreshTrustScore = useCallback(async (addr, c) => {
    if (!addr || !c) return;
    try {
      const userData = await c.users(addr);
      setTrustScore(Number(userData.trustScore));
      setIsRegistered(userData.isRegistered);
    } catch (_) {}
  }, []);

  // ── connectWallet: ONLY connects — no auto-registration popup ────────────
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this feature!");
      return null;
    }
    try {
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (err) {
        if (err.code === -32002) {
          alert("🦊 MetaMask is already open!\n\nClick the MetaMask extension icon to approve the connection.");
          return null;
        }
        throw err;
      }

      const addr = accounts[0];
      setAccount(addr);

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);

      const ethersSigner = await ethersProvider.getSigner();
      setSigner(ethersSigner);

      const c = new ethers.Contract(CONTRACT_ADDRESS, TrustChainABI.abi, ethersSigner);
      setContract(c);
      
      // Load RTK Contract dynamically from TrustChain state
      try {
        const rtkAddress = await c.rtkToken();
        const rtk = new ethers.Contract(rtkAddress, RupeeTrustTokenABI.abi, ethersSigner);
        setRtkContract(rtk);
        const balWei = await rtk.balanceOf(addr);
        setRtkBalance(ethers.formatUnits(balWei, 18));
        
        // Auto-add RTK to wallet visually (only prompt once per device/browser)
        if (!window.__RTK_PROMPTED && !localStorage.getItem('rtk_added')) {
          window.__RTK_PROMPTED = true; // Use synchronous memory flag immediately to stop concurrent React strict-mode calls
          try {
            await window.ethereum.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: {
                  address: rtkAddress,
                  symbol: 'RTK',
                  decimals: 18,
                  image: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/React-icon.svg',
                },
              },
            });
            localStorage.setItem('rtk_added', 'true');
          } catch (watchErr) {
            console.warn("User dismissed or failed RTK token watch prompt", watchErr);
            localStorage.setItem('rtk_added', 'true');
          }
        }
      } catch (err) {
        console.error("Failed to load RTK Token", err);
      }

      console.log("Connected to Wallet:", addr);

      // Silently READ registration status — no transaction fired
      try {
        const userData = await c.users(addr);
        setIsRegistered(userData.isRegistered);
        if (userData.isRegistered) {
          setTrustScore(Number(userData.trustScore));
          console.log("Already registered on-chain. TrustScore:", Number(userData.trustScore));
        } else {
          console.log("Not yet registered on-chain. Show registration prompt.");
        }
      } catch (e) {
        console.warn("Could not read user data from contract:", e.message);
      }

      return { account: addr, signer: ethersSigner };
    } catch (error) {
      console.error("Wallet connection failed", error);
      return null;
    }
  };

  // ── refreshRTKBalance: call after any tx that moves tokens ────────────────
  const refreshRTKBalance = async (rtk = rtkContract, addr = account) => {
    if (!rtk || !addr) return;
    try {
      const balWei = await rtk.balanceOf(addr);
      setRtkBalance(ethers.formatUnits(balWei, 18));
    } catch (_) {}
  };

  // ── registerOnChain: called EXPLICITLY by the user from the UI ───────────
  const registerOnChain = async () => {
    if (!contract) return false;
    setRegistering(true);
    try {
      const tx = await contract.registerUser();
      await tx.wait();
      setIsRegistered(true);
      await refreshTrustScore(account, contract);
      console.log("Registered on blockchain!");
      return true;
    } catch (e) {
      // Already registered is fine
      if (e.reason?.includes("already registered") || e.message?.includes("already registered")) {
        setIsRegistered(true);
        await refreshTrustScore(account, contract);
        return true;
      }
      console.error("Registration failed:", e);
      return false;
    } finally {
      setRegistering(false);
    }
  };

  // ─── claimFaucet: Request mock RTK for testing ────────────────────────────
  const claimFaucet = async () => {
    if (!rtkContract) return false;
    try {
      const tx = await rtkContract.claimFaucet();
      await tx.wait();
      
      // Refresh balance
      const balWei = await rtkContract.balanceOf(account);
      setRtkBalance(ethers.formatUnits(balWei, 18));
      return true;
    } catch (e) {
      console.error("Faucet claim failed:", e);
      return false;
    }
  };

  // Cryptographic signature to link Web3 identity to Supabase
  const signAuthMessage = async (activeSigner = signer) => {
    try {
      if (!activeSigner) throw new Error("No signer available");
      const message = "Sign this message to securely log into TrustChain with your wallet.";
      const signature = await activeSigner.signMessage(message);
      return signature;
    } catch (err) {
      console.error("Signature rejected by user", err);
      return null;
    }
  };

  useEffect(() => {
    // Re-connect silently if MetaMask is already unlocked (no popup)
    if (window.ethereum?.selectedAddress) connectWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) connectWallet();
        else {
          setAccount("");
          setContract(null);
          setTrustScore(null);
          setIsRegistered(false);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{
      account,
      connectWallet,
      signAuthMessage,
      registerOnChain,
      claimFaucet,
      registering,
      contract,
      rtkContract,
      rtkBalance,
      refreshRTKBalance,
      provider,
      signer,
      trustScore,
      isRegistered,
      refreshTrustScore,
    }}>
      {children}
    </Web3Context.Provider>
  );
};
