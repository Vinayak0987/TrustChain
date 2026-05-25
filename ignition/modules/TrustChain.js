const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TrustChainModule", (m) => {
  // First, deploy the RupeeTrustToken (RTK)
  const rupeeTrustToken = m.contract("RupeeTrustToken");

  // Pass the deployed token address into TrustChain's constructor
  const trustchain = m.contract("TrustChain", [rupeeTrustToken]);

  return { rupeeTrustToken, trustchain };
});
