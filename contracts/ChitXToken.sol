// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChitXToken (CTX)
 * @dev ERC-20 token for the ChitX decentralized chit fund platform.
 *      The deployer (Treasury) receives an initial supply of 1,000,000 CTX.
 *      Owner can mint additional tokens if needed for emergency reserves.
 */
contract ChitXToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    constructor() ERC20("ChitX Token", "CTX") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Allows the owner (Treasury) to mint additional tokens.
     *      Used for emergency fund replenishment or platform growth.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint (in wei).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
