// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChitPool
 * @dev Escrow contract for ChitX chit fund pools.
 *      Users deposit CTX tokens into the pool.
 *      Only the contract owner (backend service) can execute payouts to winners.
 *      Includes reentrancy protection and safe ERC-20 transfers.
 */
contract ChitPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable ctxToken;

    /// @dev Tracks each user's deposited balance in this pool
    mapping(address => uint256) public deposits;

    /// @dev Total amount of CTX held in the pool across all depositors
    uint256 public totalPoolBalance;

    // ───────────────────────── Events ─────────────────────────
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event PayoutExecuted(address indexed winner, uint256 amount, uint256 timestamp);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    // ───────────────────────── Constructor ─────────────────────────
    /**
     * @param _ctxToken Address of the deployed ChitXToken (CTX) contract.
     */
    constructor(address _ctxToken) Ownable(msg.sender) {
        require(_ctxToken != address(0), "ChitPool: token address cannot be zero");
        ctxToken = IERC20(_ctxToken);
    }

    // ───────────────────────── User Functions ─────────────────────────
    /**
     * @dev Allows a user to deposit CTX tokens into the pool.
     *      The user must have approved this contract to spend `amount` CTX first.
     * @param amount The number of CTX tokens to deposit (in wei).
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "ChitPool: deposit amount must be greater than 0");

        ctxToken.safeTransferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalPoolBalance += amount;

        emit Deposited(msg.sender, amount, block.timestamp);
    }

    // ───────────────────────── Owner-Only Functions ─────────────────────────
    /**
     * @dev Executes a payout to the winning member of the chit round.
     *      Can ONLY be called by the contract owner (our backend wallet).
     *      Transfers the entire pool balance to the winner.
     * @param winner The address of the round winner determined by AI.
     */
    function executePayout(address winner) external onlyOwner nonReentrant {
        require(winner != address(0), "ChitPool: winner address cannot be zero");
        require(totalPoolBalance > 0, "ChitPool: no funds in pool to distribute");

        uint256 payoutAmount = totalPoolBalance;
        totalPoolBalance = 0;

        // Reset all deposit records — new round starts fresh
        // Note: In production, you'd iterate or use a separate round-tracking mechanism

        ctxToken.safeTransfer(winner, payoutAmount);
        emit PayoutExecuted(winner, payoutAmount, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal by owner in case of critical issues.
     *      Transfers all pool funds to the owner.
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = ctxToken.balanceOf(address(this));
        require(balance > 0, "ChitPool: no tokens to withdraw");

        ctxToken.safeTransfer(owner(), balance);
        totalPoolBalance = 0;
        
        emit EmergencyWithdraw(owner(), balance);
    }

    // ───────────────────────── View Functions ─────────────────────────
    /**
     * @dev Returns the deposited balance of a specific user.
     */
    function getDeposit(address user) external view returns (uint256) {
        return deposits[user];
    }

    /**
     * @dev Returns the total CTX balance held by this contract.
     */
    function getPoolBalance() external view returns (uint256) {
        return ctxToken.balanceOf(address(this));
    }
}
