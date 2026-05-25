// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RupeeTrustToken (RTK)
 * @notice Mock INR-pegged stablecoin for TrustChain.
 *         1 RTK = 1 Indian Rupee (off-chain peg, UX only).
 *         Deployer receives full supply; faucet function for test wallets.
 */
contract RupeeTrustToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 10 Crore RTK
    uint256 public constant FAUCET_AMOUNT  = 100_000 * 10**18;     // ₹1,00,000 per call

    mapping(address => bool) public faucetClaimed;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Rupee Trust Token", "RTK") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice One-time faucet: any address can claim ₹1,00,000 of RTK for demo/testing.
     */
    function claimFaucet() external {
        require(!faucetClaimed[msg.sender], "RTK: faucet already claimed");
        faucetClaimed[msg.sender] = true;
        _transfer(owner(), msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner can distribute RTK to specific addresses (batch onboarding).
     */
    function distribute(address[] calldata recipients, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amount);
        }
    }
}
