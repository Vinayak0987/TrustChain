import React, { createContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import TrustChainABI from "../artifacts/contracts/TrustChain.sol/TrustChain.json";
import RupeeTrustTokenABI from "../artifacts/contracts/RupeeTrustToken.sol/RupeeTrustToken.json";
import { supabase } from "../utils/supabaseClient";
import { updateWalletAddress } from "../utils/supabaseService";
import {
  isMetaMaskInstalled,
  ensureLocalNetwork,
  isHardhatNodeRunning,
  isContractDeployed,
  LOCAL_CHAIN_ID,
} from "../utils/metamask";

export const Web3Context = createContext();

const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const parseUserRecord = (userData) => {
  if (!userData) return { isRegistered: false, trustScore: 0 };
  const isRegistered = Boolean(userData.isRegistered ?? userData[0]);
  const trustScore = Number(userData.trustScore ?? userData[1] ?? 0);
  return { isRegistered, trustScore };
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [rtkContract, setRtkContract] = useState(null);
  const [rtkBalance, setRtkBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [trustScore, setTrustScore] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [walletStatus, setWalletStatus] = useState("idle"); // idle | missing | wrong_network | no_node | ready
  const [connectError, setConnectError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const refreshTrustScore = useCallback(async (addr, c) => {
    if (!addr || !c) return { isRegistered: false, trustScore: 0 };
    try {
      const userData = await c.users(addr);
      const parsed = parseUserRecord(userData);
      setTrustScore(parsed.trustScore);
      setIsRegistered(parsed.isRegistered);
      return parsed;
    } catch (_) {
      setIsRegistered(false);
      return { isRegistered: false, trustScore: 0 };
    }
  }, []);

  const connectWallet = async () => {
    setConnectError("");

    if (!isMetaMaskInstalled()) {
      setWalletStatus("missing");
      setConnectError("Install the MetaMask browser extension, then try again.");
      return null;
    }

    const nodeUp = await isHardhatNodeRunning();
    if (!nodeUp) {
      setWalletStatus("no_node");
      setConnectError("Start the local blockchain: npx hardhat node — then run node scripts/deploy.js");
      return null;
    }

    const network = await ensureLocalNetwork();
    if (!network.ok) {
      setWalletStatus("wrong_network");
      setConnectError(
        network.message ||
          `Switch MetaMask to Hardhat Local (Chain ID ${LOCAL_CHAIN_ID}). Use "Add Hardhat Local to MetaMask" in the setup panel.`
      );
      return null;
    }

    try {
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (err) {
        if (err.code === -32002) {
          setConnectError("MetaMask is already waiting for approval. Open the extension and confirm.");
          return null;
        }
        if (err.code === 4001) {
          setConnectError("Connection rejected. Click Connect MetaMask again to approve.");
          return null;
        }
        throw err;
      }

      const addr = accounts[0];
      setAccount(addr);

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethBal = await ethersProvider.getBalance(addr);
      if (ethBal === 0n) {
        setConnectError(
          `This account has 0 test ETH on Hardhat. Run: node scripts/fund-wallet.js ${addr} — or import Hardhat Account #0 in MetaMask.`
        );
        setWalletStatus("idle");
      }
      setProvider(ethersProvider);

      const ethersSigner = await ethersProvider.getSigner();
      setSigner(ethersSigner);

      const chainId = Number((await ethersProvider.getNetwork()).chainId);
      if (chainId !== LOCAL_CHAIN_ID) {
        setWalletStatus("wrong_network");
        setConnectError(`Wrong network. Expected Chain ID ${LOCAL_CHAIN_ID}.`);
        return null;
      }

      const deployed = await isContractDeployed(CONTRACT_ADDRESS);
      if (!deployed) {
        setConnectError(
          'Smart contract not deployed on this Hardhat node. Run: node scripts/deploy.js — then refresh the page.'
        );
        setWalletStatus("no_node");
        return null;
      }

      const c = new ethers.Contract(CONTRACT_ADDRESS, TrustChainABI.abi, ethersSigner);
      setContract(c);

      try {
        const rtkAddress = await c.rtkToken();
        const rtk = new ethers.Contract(rtkAddress, RupeeTrustTokenABI.abi, ethersSigner);
        setRtkContract(rtk);
        const balWei = await rtk.balanceOf(addr);
        setRtkBalance(ethers.formatUnits(balWei, 18));
      } catch (err) {
        console.error("Failed to load RTK Token", err);
        setConnectError("Contract not found. Run: node scripts/deploy.js — then refresh.");
        setWalletStatus("no_node");
        return null;
      }

      await refreshTrustScore(addr, c);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await updateWalletAddress(user.id, addr);
      } catch (_) {}

      setWalletStatus("ready");
      setConnectError("");
      return { account: addr, signer: ethersSigner };
    } catch (error) {
      console.error("Wallet connection failed", error);
      setConnectError(error.message || "Wallet connection failed.");
      setWalletStatus("idle");
      return null;
    }
  };

  const registerOnChain = async () => {
    setRegisterError("");
    if (!contract || !account) {
      setRegisterError("Connect MetaMask first.");
      return false;
    }
    setRegistering(true);
    try {
      const bal = await contract.runner.provider.getBalance(account);
      if (bal === 0n) {
        setRegisterError(
          `No test ETH for gas. In terminal run: node scripts/fund-wallet.js ${account}`
        );
        return false;
      }

      const tx = await contract.registerUser({ gasLimit: 300000n });
      await tx.wait();
      const parsed = await refreshTrustScore(account, contract);
      if (!parsed.isRegistered) {
        setRegisterError("Transaction confirmed but registration not detected. Refresh and try again.");
        return false;
      }
      return true;
    } catch (e) {
      if (e.reason?.includes("already registered") || e.message?.includes("already registered")) {
        await refreshTrustScore(account, contract);
        return true;
      }
      const msg = e.reason || e.shortMessage || e.message || "Registration failed";
      setRegisterError(msg);
      console.error("Registration failed:", e);
      return false;
    } finally {
      setRegistering(false);
    }
  };

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
    const onChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum?.selectedAddress) {
      connectWallet();
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) connectWallet();
        else {
          setAccount("");
          setContract(null);
          setRtkContract(null);
          setTrustScore(null);
          setIsRegistered(false);
          setWalletStatus("idle");
        }
      });
      window.ethereum.on("chainChanged", onChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("chainChanged", onChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        connectWallet,
        signAuthMessage,
        registerOnChain,
        registering,
        contract,
        rtkContract,
        rtkBalance,
        provider,
        signer,
        trustScore,
        isRegistered,
        refreshTrustScore,
        walletStatus,
        connectError,
        registerError,
        contractAddress: CONTRACT_ADDRESS,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
