import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = process.env.VITE_RPC_URL || "http://127.0.0.1:8545";
  const pvtKey = process.env.DEPLOYER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  
  console.log(`Connecting to network at: ${rpcUrl}...`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const signer = new ethers.Wallet(pvtKey, provider);
  let currentNonce = await provider.getTransactionCount(signer.address, "latest");

  // 1. Load and Deploy RTK Token
  const rtkPath = path.join(__dirname, "../src/artifacts/contracts/RupeeTrustToken.sol/RupeeTrustToken.json");
  const rtkArtifact = JSON.parse(fs.readFileSync(rtkPath, "utf8"));
  
  console.log("Deploying RupeeTrustToken (RTK)...");
  const rtkFactory = new ethers.ContractFactory(rtkArtifact.abi, rtkArtifact.bytecode, signer);
  const rtkContract = await rtkFactory.deploy({ nonce: currentNonce++ });
  await rtkContract.waitForDeployment();
  const rtkAddress = await rtkContract.getAddress();
  console.log(`RTK Token successfully deployed to: ${rtkAddress}`);

  // 2. Load and Deploy TrustChain with RTK address
  const artifactPath = path.join(__dirname, "../src/artifacts/contracts/TrustChain.sol/TrustChain.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("Deploying TrustChain...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(rtkAddress, { nonce: currentNonce++ });
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`TrustChain successfully deployed to: ${address}`);

  // Automatically update the Web3Context payload with the new contract address
  const contextPath = path.join(__dirname, "../src/context/Web3Context.jsx");
  let contextFile = fs.readFileSync(contextPath, "utf8");
  contextFile = contextFile.replace(
    /import\.meta\.env\.VITE_CONTRACT_ADDRESS \|\| "0x[a-fA-F0-9]+"/,
    `import.meta.env.VITE_CONTRACT_ADDRESS || "${address}"`
  );
  fs.writeFileSync(contextPath, contextFile);
  console.log("Updated Web3Context.jsx with new contract address.");
}

main().catch(console.error);
