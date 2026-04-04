// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChitPool Vault
 * @dev Escrow contract for ChitX chit fund pools.
 *      Users transfer CTX tokens directly to this contract's address (1-step payment).
 *      Only the contract owner (backend AI Oracle) can execute payouts/refunds.
 */
contract ChitPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable ctxToken;

    event FundsWithdrawn(address indexed to, uint256 amount, string reason, uint256 timestamp);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    constructor(address _ctxToken) Ownable(msg.sender) {
        require(_ctxToken != address(0), "ChitPool: token address cannot be zero");
        ctxToken = IERC20(_ctxToken);
    }

    /**
     * @dev Core Escrow Function: 
     *      Allows the backend AI Oracle to dispense precise funds from the vault.
     *      Used for monthly payouts and exact partial refunds when a user leaves early.
     * @param to The wallet receiving the money.
     * @param amount The exact amount in wei.
     * @param reason A log index (e.g. "Refund", "Monthly Payout").
     */
    function backendTransfer(address to, uint256 amount, string calldata reason) external onlyOwner nonReentrant {
        require(to != address(0), "ChitPool: cannot send to zero address");
        require(amount > 0, "ChitPool: amount must be greater than zero");
        
        uint256 vaultBalance = ctxToken.balanceOf(address(this));
        require(vaultBalance >= amount, "ChitPool: insufficient vault liquidity");

        ctxToken.safeTransfer(to, amount);
        
        emit FundsWithdrawn(to, amount, reason, block.timestamp);
    }

    /**
     * @dev Emergency withdrawal: dumps all tokens back to the Treasury.
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = ctxToken.balanceOf(address(this));
        require(balance > 0, "ChitPool: no tokens to withdraw");

        ctxToken.safeTransfer(owner(), balance);
        emit EmergencyWithdraw(owner(), balance);
    }

    /**
     * @dev Returns the total CTX liquidity secured in this vault.
     */
    function getVaultBalance() external view returns (uint256) {
        return ctxToken.balanceOf(address(this));
    }
}
