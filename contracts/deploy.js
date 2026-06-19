require('dotenv').config({ path: '../.env' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Deploy GhostAnchor contract to 0G Chain testnet
 * Run from project root: node contracts/deploy.js
 */
async function deploy() {
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY not set in .env');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(`[DEPLOY] Deploying GhostAnchor to 0G Chain testnet`);
  console.log(`[DEPLOY] Deployer / Agent wallet: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`[DEPLOY] Balance: ${ethers.formatEther(balance)} 0G`);

  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient balance. Get testnet tokens at https://faucet.0g.ai');
  }

  // Compile the contract ABI + bytecode
  // For the hackathon we use a pre-compiled version
  // Full compilation: npx hardhat compile (add hardhat to dev dependencies)
  const contractABI = [
    'constructor(address _agentWallet)',
    'function anchor(bytes32 contentHash, uint256 cycleNumber) external',
    'function getRecord(uint256 cycleNumber) external view returns (bytes32, uint256, uint256, address)',
    'function verify(uint256 cycleNumber, bytes32 contentHash) external view returns (bool, uint256)',
    'function metadata() external view returns (address, uint256, uint256, bool, bool, bool)',
    'function totalCycles() external view returns (uint256)',
    'function agentWallet() external view returns (address)',
    'event HashAnchored(uint256 indexed cycle, bytes32 indexed contentHash, uint256 timestamp, address agent)',
  ];

  // NOTE: Replace this bytecode with the compiled output from:
  // npx hardhat compile
  // then copy artifacts/contracts/GhostAnchor.sol/GhostAnchor.json bytecode
  const PLACEHOLDER_BYTECODE = '0x'; // Replace after compilation

  console.log(`[DEPLOY] Contract: GhostAnchor`);
  console.log(`[DEPLOY] Agent wallet (immutable): ${wallet.address}`);
  console.log(`[DEPLOY] No owner. No admin key. No kill switch.`);

  const factory = new ethers.ContractFactory(contractABI, PLACEHOLDER_BYTECODE, wallet);

  try {
    const contract = await factory.deploy(wallet.address, {
      gasLimit: 1000000n,
    });

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`\n[DEPLOY] SUCCESS`);
    console.log(`[DEPLOY] Contract address: ${address}`);
    console.log(`[DEPLOY] Add to .env: CONTRACT_ADDRESS=${address}`);
    console.log(`[DEPLOY] Verify on explorer: https://chainscan.0g.ai/address/${address}`);

    // Save deployment info
    const deployInfo = {
      contract: 'GhostAnchor',
      address,
      agentWallet: wallet.address,
      network: '0G Testnet',
      deployedAt: new Date().toISOString(),
      hasOwner: false,
      canPause: false,
      canUpgrade: false,
    };

    fs.writeFileSync(
      path.join(__dirname, 'deployment.json'),
      JSON.stringify(deployInfo, null, 2)
    );

    console.log(`[DEPLOY] Deployment info saved to contracts/deployment.json`);
    return address;

  } catch (err) {
    console.error(`[DEPLOY] Error: ${err.message}`);
    console.log(`[DEPLOY] Make sure you have compiled the contract first`);
    console.log(`[DEPLOY] Run: npx hardhat compile`);
    throw err;
  }
}

deploy().catch(console.error);
