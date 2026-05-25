import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
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
  contextFile = contextFile.replace(/const CONTRACT_ADDRESS = "0x[a-fA-F0-9]+";/, `const CONTRACT_ADDRESS = "${address}";`);
  fs.writeFileSync(contextPath, contextFile);
  console.log("Updated Web3Context.jsx with new contract address.");
}

main().catch(console.error);
