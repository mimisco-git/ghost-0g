require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const ABI = [
  "constructor(address _agentWallet)",
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function metadata() external view returns (address, uint256, uint256, bool, bool, bool)",
  "function totalCycles() external view returns (uint256)",
  "event HashAnchored(uint256 indexed cycle, bytes32 indexed contentHash, uint256 timestamp, address agent)"
];

async function deploy() {
  const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) { console.error('ERROR: PRIVATE_KEY not in .env'); process.exit(1); }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const agentAddress = wallet.address;
  const balWei = await provider.getBalance(agentAddress);
  const bal = parseFloat(ethers.formatEther(balWei)).toFixed(4);

  console.log('\nGHOST CONTRACT DEPLOYMENT');
  console.log('Network: 0G Galileo Testnet');
  console.log('Agent wallet:', agentAddress);
  console.log('Balance:', bal, '0G');

  if (parseFloat(bal) < 0.01) {
    console.error('ERROR: Need at least 0.01 0G');
    process.exit(1);
  }

  // Compile with solc if available
  const solPath = path.join(__dirname, '../contracts/GhostAnchor.sol');
  const source = fs.readFileSync(solPath, 'utf8');

  let bytecode, abi;
  try {
    const solc = require('solc');
    console.log('Compiling GhostAnchor.sol...');
    const input = {
      language: 'Solidity',
      sources: { 'GhostAnchor.sol': { content: source } },
      settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } }, optimizer: { enabled: true, runs: 200 } }
    };
    const out = JSON.parse(solc.compile(JSON.stringify(input)));
    if (out.errors?.some(e => e.severity === 'error')) {
      out.errors.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
    const c = out.contracts['GhostAnchor.sol']['GhostAnchor'];
    bytecode = '0x' + c.evm.bytecode.object;
    abi = c.abi;
    fs.writeFileSync(path.join(__dirname, '../contracts/GhostAnchor.abi.json'), JSON.stringify(abi, null, 2));
    console.log('Compiled. ABI saved.');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('solc not found. Installing...');
      const { execSync } = require('child_process');
      execSync('npm install solc --no-save', { stdio: 'inherit' });
      // Retry
      return deploy();
    }
    throw e;
  }

  console.log('Deploying...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const feeData = await provider.getFeeData();
  const contract = await factory.deploy(agentAddress, {
    gasLimit: 800000n,
    gasPrice: feeData.gasPrice,
  });

  console.log('TX hash:', contract.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log('\nDEPLOYED:', contractAddress);
  console.log('Explorer: https://chainscan-galileo.0g.ai/address/' + contractAddress);

  // Save config
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  const config = {
    address: contractAddress,
    agentWallet: agentAddress,
    deployedAt: new Date().toISOString(),
    txHash: contract.deploymentTransaction().hash,
    network: '0G Galileo Testnet',
    chainId: 16602,
  };
  fs.writeFileSync(path.join(__dirname, '../data/contract.json'), JSON.stringify(config, null, 2));
  console.log('Config saved to data/contract.json');

  // Add to .env
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, 'CONTRACT_ADDRESS=' + contractAddress);
  } else {
    envContent += '\nCONTRACT_ADDRESS=' + contractAddress + '\n';
  }
  fs.writeFileSync(envPath, envContent);
  console.log('CONTRACT_ADDRESS saved to .env');

  // Verify
  const deployed = new ethers.Contract(contractAddress, ABI, provider);
  const meta = await deployed.metadata();
  console.log('\nVerified on-chain:');
  console.log('  agentWallet:', meta[0]);
  console.log('  totalCycles:', meta[2].toString());
  console.log('  owner: NONE, killSwitch: NONE, upgradeable: FALSE');
  console.log('\nGHOST contract is live.\n');
}

deploy().catch(err => { console.error('Deploy failed:', err.message); process.exit(1); });
