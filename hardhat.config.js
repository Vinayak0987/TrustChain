import * as dotenv from "dotenv";
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,        // Fixes "Stack too deep" from expanded Loan struct
    }
  },
  paths: {
    // Crucial for Vite integration: export compiled ABIs directly into the React src folder
    artifacts: "./src/artifacts"
  },
  networks: {
    hardhat: {
      chainId: 31337 // Default local chain
    },
    sepolia: {
      url: process.env.VITE_RPC_URL || "", // Make sure this is your Alchemy Sepolia HTTPS URL
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111
    }
  }
};
