// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TrustChain
 * @notice Uncollateralized P2P lending with on-chain interest, 
 *         dynamic TrustScore, community endorsements, and
 *         dual-party agreement signing before fund release.
 */
contract TrustChain {

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum LoanStatus { Pending, Funded, Repaid }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Loan {
        uint256 id;
        address borrower;
        address funder;
        uint256 principal;       // original amount requested (wei)
        uint256 interestRate;    // flat rate %, e.g. 12 = 12%
        uint256 totalOwed;       // principal + interest (computed at origination)
        string  purpose;
        LoanStatus status;
        uint256 fundedAt;        // block.timestamp when funded

        // ── Agreement fields (Option 1: lightweight dual-sign) ──────────────
        bool    lenderSigned;       // Lender has reviewed & signed the agreement
        bool    borrowerSigned;     // Borrower has reviewed & signed the agreement
        uint256 lenderSignedAt;     // Timestamp of lender signature
        uint256 borrowerSignedAt;   // Timestamp of borrower signature
        address proposedFunder;     // The lender who proposed the agreement
    }

    struct User {
        bool     isRegistered;
        uint256  trustScore;     // 0–100+, starts at base
        uint256  loansRepaid;    // successful repayment count
        uint256  loansDefaulted; // future: penalty logic hook
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(address  => User)                          public users;
    mapping(uint256  => Loan)                          public loans;
    mapping(address  => mapping(address => bool))      public hasEndorsed; // endorser → endorsee → bool

    uint256 public loanCounter;
    IERC20 public rtkToken;

    // TrustScore reward config (owner-configurable in production)
    uint256 public constant REPAY_SCORE_REWARD    = 10;
    uint256 public constant ENDORSE_SCORE_REWARD  = 5;
    uint256 public constant FUND_SCORE_REWARD     = 2;
    uint256 public constant BASE_TRUST_SCORE      = 50;

    // ─── Events ───────────────────────────────────────────────────────────────

    event UserRegistered      (address indexed user,     uint256 initialScore);
    event LoanRequested       (uint256 indexed loanId,   address indexed borrower, uint256 principal, uint256 interestRate, string purpose);
    event LoanFunded          (uint256 indexed loanId,   address indexed funder,   uint256 principal);
    event LoanRepaid          (uint256 indexed loanId,   address indexed borrower, uint256 totalRepaid);
    event UserEndorsed        (address indexed endorser,  address indexed endorsee, uint256 newScore);
    event AgreementSigned     (uint256 indexed loanId,   address indexed signer,   string role, uint256 timestamp);
    event AgreementProposed   (uint256 indexed loanId,   address indexed lender,   uint256 timestamp);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "TrustChain: caller not registered");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _rtkAddress) {
        require(_rtkAddress != address(0), "TrustChain: invalid token address");
        rtkToken = IERC20(_rtkAddress);
    }

    // ─── User Functions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new user. TrustScore initialised to BASE.
     */
    function registerUser() external {
        require(!users[msg.sender].isRegistered, "TrustChain: already registered");
        users[msg.sender] = User({
            isRegistered:   true,
            trustScore:     BASE_TRUST_SCORE,
            loansRepaid:    0,
            loansDefaulted: 0
        });
        emit UserRegistered(msg.sender, BASE_TRUST_SCORE);
    }

    // ─── Internal: Interest Tier ──────────────────────────────────────────────

    /**
     * @dev Derives flat interest rate from TrustScore.
     *      High trust  → low rate (less risky for lender).
     */
    function _interestRate(uint256 score) internal pure returns (uint256) {
        if (score >= 80) return 12; // Low risk
        if (score >= 60) return 16; // Medium risk
        return 20;                  // High risk
    }

    // ─── Borrower Functions ───────────────────────────────────────────────────

    /**
     * @notice Request a new loan. Interest rate locked at origination.
     */
    function requestLoan(uint256 _principal, string calldata _purpose)
        external onlyRegistered
    {
        require(_principal > 0, "TrustChain: principal must be > 0");

        uint256 score    = users[msg.sender].trustScore;
        uint256 rate     = _interestRate(score);
        uint256 interest = (_principal * rate) / 100;
        uint256 owed     = _principal + interest;

        loans[loanCounter] = Loan({
            id:               loanCounter,
            borrower:         msg.sender,
            funder:           address(0),
            principal:        _principal,
            interestRate:     rate,
            totalOwed:        owed,
            purpose:          _purpose,
            status:           LoanStatus.Pending,
            fundedAt:         0,
            lenderSigned:     false,
            borrowerSigned:   false,
            lenderSignedAt:   0,
            borrowerSignedAt: 0,
            proposedFunder:   address(0)
        });

        emit LoanRequested(loanCounter, msg.sender, _principal, rate, _purpose);
        loanCounter++;
    }

    /**
     * @notice Borrower repays principal + interest to the funder.
     * @dev    Transfers RTK tokens equivalent to loan.totalOwed back to funder.
     */
    function repayLoan(uint256 _loanId) external onlyRegistered {
        Loan storage loan = loans[_loanId];

        require(loan.status  == LoanStatus.Funded,  "TrustChain: loan not active");
        require(msg.sender   == loan.borrower,       "TrustChain: only borrower can repay");

        loan.status = LoanStatus.Repaid;

        // Transfer RTK from Borrower back to Lender (requires prior approve() from borrower)
        require(rtkToken.transferFrom(msg.sender, loan.funder, loan.totalOwed), "TrustChain: RTK repayment transfer failed");

        // Reward borrower TrustScore
        users[msg.sender].trustScore  += REPAY_SCORE_REWARD;
        users[msg.sender].loansRepaid += 1;

        emit LoanRepaid(_loanId, msg.sender, loan.totalOwed);
    }

    // ─── Agreement Functions ──────────────────────────────────────────────────

    /**
     * @notice Lender proposes & signs the agreement for a pending loan.
     *         This does NOT move funds — it's purely an on-chain intention flag.
     * @dev    The lender's address is stored as `proposedFunder` so the borrower
     *         knows who to expect, and the same lender must later call fundLoan.
     */
    function signAgreementAsLender(uint256 _loanId) external onlyRegistered {
        Loan storage loan = loans[_loanId];

        require(loan.status   == LoanStatus.Pending, "TrustChain: loan not pending");
        require(msg.sender    != loan.borrower,       "TrustChain: borrower cannot be lender");
        require(!loan.lenderSigned,                  "TrustChain: lender already signed");

        loan.lenderSigned    = true;
        loan.lenderSignedAt  = block.timestamp;
        loan.proposedFunder  = msg.sender;

        emit AgreementProposed(_loanId, msg.sender, block.timestamp);
        emit AgreementSigned(_loanId, msg.sender, "lender", block.timestamp);
    }

    /**
     * @notice Borrower countersigns the agreement after the lender has signed.
     *         Only allowed after the lender's signature is on-chain.
     */
    function signAgreementAsBorrower(uint256 _loanId) external onlyRegistered {
        Loan storage loan = loans[_loanId];

        require(loan.status    == LoanStatus.Pending,  "TrustChain: loan not pending");
        require(msg.sender     == loan.borrower,        "TrustChain: only borrower can countersign");
        require(loan.lenderSigned,                     "TrustChain: lender must sign first");
        require(!loan.borrowerSigned,                  "TrustChain: borrower already signed");

        loan.borrowerSigned    = true;
        loan.borrowerSignedAt  = block.timestamp;

        emit AgreementSigned(_loanId, msg.sender, "borrower", block.timestamp);
    }

    // ─── Lender Functions ──────────────────────────────────────────────────────

    /**
     * @notice Fund a pending loan after BOTH parties have signed the agreement.
     * @dev    Transfers RTK from lender to borrower. Requires prior approve() from lender.
     */
    function fundLoan(uint256 _loanId) external onlyRegistered {
        Loan storage loan = loans[_loanId];

        require(loan.status         == LoanStatus.Pending,  "TrustChain: loan not available");
        require(msg.sender          != loan.borrower,        "TrustChain: cannot fund own loan");
        require(msg.sender          == loan.proposedFunder,  "TrustChain: only the proposing lender can fund");

        // ── Agreement guard: both parties must have signed ──────────────────
        require(loan.lenderSigned   && loan.borrowerSigned,  "TrustChain: agreement not fully signed by both parties");

        loan.status   = LoanStatus.Funded;
        loan.funder   = msg.sender;
        loan.fundedAt = block.timestamp;

        // Transfer RTK from Lender to Borrower
        require(rtkToken.transferFrom(msg.sender, loan.borrower, loan.principal), "TrustChain: RTK funding transfer failed");

        // Small trust reward for lenders
        users[msg.sender].trustScore += FUND_SCORE_REWARD;

        emit LoanFunded(_loanId, msg.sender, loan.principal);
    }

    // ─── Community / Endorsement ───────────────────────────────────────────────

    /**
     * @notice Endorse another registered user, boosting their TrustScore.
     *         Each endorser can only endorse the same address once.
     */
    function endorseUser(address _endorsee) external onlyRegistered {
        require(users[_endorsee].isRegistered,          "TrustChain: endorsee not registered");
        require(msg.sender != _endorsee,                 "TrustChain: cannot endorse yourself");
        require(!hasEndorsed[msg.sender][_endorsee],     "TrustChain: already endorsed");

        hasEndorsed[msg.sender][_endorsee] = true;
        users[_endorsee].trustScore += ENDORSE_SCORE_REWARD;

        emit UserEndorsed(msg.sender, _endorsee, users[_endorsee].trustScore);
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    function getLoanCount() external view returns (uint256) {
        return loanCounter;
    }

    function getTrustScore(address _user) external view returns (uint256) {
        return users[_user].trustScore;
    }

    function computeInterestRate(address _user) external view returns (uint256) {
        return _interestRate(users[_user].trustScore);
    }

    /**
     * @notice Returns the agreement status for a given loan.
     * @return lenderSigned     Whether the lender has signed
     * @return borrowerSigned   Whether the borrower has signed
     * @return proposedFunder   Address of the proposing lender
     * @return bothSigned       Whether the agreement is fully executed
     */
    function getAgreementStatus(uint256 _loanId) external view returns (
        bool lenderSigned,
        bool borrowerSigned,
        address proposedFunder,
        bool bothSigned
    ) {
        Loan storage loan = loans[_loanId];
        return (
            loan.lenderSigned,
            loan.borrowerSigned,
            loan.proposedFunder,
            loan.lenderSigned && loan.borrowerSigned
        );
    }
}
