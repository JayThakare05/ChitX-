/**
 * ChitPool Deployment Script
 * 
 * Deploys ChitPool.sol to Sepolia using ethers.js v6.
 * Reads CTX_TOKEN_ADDRESS from .env and passes it to the constructor.
 * 
 * Usage:
 *   node scripts/deployChitPool.js
 * 
 * Prerequisites:
 *   1. ChitXToken already deployed (address in .env as CTX_TOKEN_ADDRESS)
 *   2. Treasury wallet funded with Sepolia ETH for gas
 *   3. .env has RPC_URL and TREASURY_PRIVATE_KEY set
 * 
 * After deployment, add the printed address to .env as CHITPOOL_ADDRESS
 */

require('dotenv').config();
const { ethers } = require('ethers');

// ─── ChitPool Compiled ABI & Bytecode ───
// These are from OpenZeppelin's standard Ownable + ReentrancyGuard + SafeERC20.
// In production, compile with Hardhat/Foundry. For quick deployment, we use
// the compiled output from Remix or solc.
// Minimal ABI needed post-deployment for interaction
const CHITPOOL_ABI = [
    'constructor(address _ctxToken)',
    'function deposit(uint256 amount) external',
    'function executePayout(address winner) external',
    'function emergencyWithdraw() external',
    'function getDeposit(address user) external view returns (uint256)',
    'function getPoolBalance() external view returns (uint256)',
    'function totalPoolBalance() external view returns (uint256)',
    'function deposits(address) external view returns (uint256)',
    'function ctxToken() external view returns (address)',
    'function owner() external view returns (address)',
    'event Deposited(address indexed user, uint256 amount, uint256 timestamp)',
    'event PayoutExecuted(address indexed winner, uint256 amount, uint256 timestamp)',
    'event EmergencyWithdraw(address indexed owner, uint256 amount)'
];

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('   ChitPool Deployment Script (Sepolia)');
    console.log('═══════════════════════════════════════════\n');

    // ─── Validate env vars ───
    const { RPC_URL, TREASURY_PRIVATE_KEY, CTX_TOKEN_ADDRESS } = process.env;

    if (!RPC_URL || !TREASURY_PRIVATE_KEY || !CTX_TOKEN_ADDRESS) {
        console.error('❌ Missing required .env variables:');
        if (!RPC_URL) console.error('   - RPC_URL');
        if (!TREASURY_PRIVATE_KEY) console.error('   - TREASURY_PRIVATE_KEY');
        if (!CTX_TOKEN_ADDRESS) console.error('   - CTX_TOKEN_ADDRESS');
        process.exit(1);
    }

    // ─── Connect to chain ───
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log(`🔗 Connected to chain: ${network.chainId} (${network.name})`);

    const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
    console.log(`💰 Deployer wallet: ${wallet.address}`);

    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`⛽ ETH balance: ${ethers.formatEther(ethBalance)} ETH`);

    if (ethBalance === 0n) {
        console.error('❌ No ETH for gas! Fund your wallet from a Sepolia faucet.');
        process.exit(1);
    }

    console.log(`🪙 CTX Token address: ${CTX_TOKEN_ADDRESS}\n`);

    // ─── Instructions for deployment ───
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  DEPLOYMENT INSTRUCTIONS (Recommended: Use Remix IDE)     ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');
    console.log('║  1. Open https://remix.ethereum.org                        ║');
    console.log('║  2. Create ChitPool.sol → paste the contract code          ║');
    console.log('║  3. Compile with Solidity 0.8.20+                          ║');
    console.log('║  4. Deploy tab → Environment: "Injected Provider"          ║');
    console.log('║     (connect MetaMask on Sepolia with Treasury wallet)     ║');
    console.log('║  5. Constructor arg _ctxToken:                             ║');
    console.log(`║     ${CTX_TOKEN_ADDRESS}       ║`);
    console.log('║  6. Click Deploy → confirm in MetaMask                     ║');
    console.log('║  7. Copy deployed address → add to .env as:                ║');
    console.log('║     CHITPOOL_ADDRESS=0x...                                 ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n───────────────────────────────────────────');
    console.log('  Alternative: Programmatic Deployment');
    console.log('───────────────────────────────────────────');
    console.log('If you have the compiled bytecode from Remix:');
    console.log('  1. Compile ChitPool.sol in Remix');
    console.log('  2. Copy the bytecode from "Compilation Details"');
    console.log('  3. Paste it into scripts/chitpool_bytecode.txt');
    console.log('  4. Re-run: node scripts/deployChitPool.js --bytecode');
    console.log('');

    // ─── Check if --bytecode flag was passed ───
    if (process.argv.includes('--bytecode')) {
        const fs = require('fs');
        const bytecodePath = require('path').join(__dirname, 'chitpool_bytecode.txt');

        if (!fs.existsSync(bytecodePath)) {
            console.error(`❌ Bytecode file not found at: ${bytecodePath}`);
            console.error('   Compile ChitPool.sol in Remix and paste the bytecode into that file.');
            process.exit(1);
        }

        const bytecode = fs.readFileSync(bytecodePath, 'utf-8').trim();
        console.log(`📦 Bytecode loaded (${bytecode.length} chars)`);
        console.log('🚀 Deploying ChitPool...\n');

        try {
            const factory = new ethers.ContractFactory(CHITPOOL_ABI, bytecode, wallet);
            const contract = await factory.deploy(CTX_TOKEN_ADDRESS);
            console.log(`📝 Deploy tx submitted: ${contract.deploymentTransaction().hash}`);
            console.log('⏳ Waiting for confirmation...');
            
            await contract.waitForDeployment();
            const deployedAddress = await contract.getAddress();

            console.log('\n╔════════════════════════════════════════════╗');
            console.log('║       ✅ CHITPOOL DEPLOYED SUCCESSFULLY     ║');
            console.log('╠════════════════════════════════════════════╣');
            console.log(`║  Address: ${deployedAddress}  ║`);
            console.log(`║  Tx Hash: ${contract.deploymentTransaction().hash}  ║`);
            console.log('╠════════════════════════════════════════════╣');
            console.log('║  Add to .env:                               ║');
            console.log(`║  CHITPOOL_ADDRESS=${deployedAddress}  ║`);
            console.log('╚════════════════════════════════════════════╝');

        } catch (err) {
            console.error('❌ Deployment failed:', err.message);
            process.exit(1);
        }
    }

    console.log('\n✅ Script complete.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
