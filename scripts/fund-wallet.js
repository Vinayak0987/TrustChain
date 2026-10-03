/**
 * Send test ETH from Hardhat Account #0 to your MetaMask address.
 * Usage: node scripts/fund-wallet.js 0xYourMetaMaskAddress
 */
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const HARDHAT_ACCOUNT_0_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
  const to = process.argv[2];
  if (!to || !ethers.isAddress(to)) {
    console.error('Usage: node scripts/fund-wallet.js <your-metamask-address>');
    process.exit(1);
  }

  const rpc = process.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
  const provider = new ethers.JsonRpcProvider(rpc);
  const funder = new ethers.Wallet(HARDHAT_ACCOUNT_0_KEY, provider);

  const tx = await funder.sendTransaction({
    to,
    value: ethers.parseEther('10'),
  });
  await tx.wait();

  const bal = await provider.getBalance(to);
  console.log(`Sent 10 test ETH to ${to}`);
  console.log(`Balance now: ${ethers.formatEther(bal)} ETH`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
