require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// GhostAnchor ABI (only what we need)
const ABI = [
  "constructor(address _agentWallet)",
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function getRecord(uint256 cycleNumber) external view returns (bytes32, uint256, uint256, address)",
  "function verify(uint256 cycleNumber, bytes32 contentHash) external view returns (bool, uint256)",
  "function metadata() external view returns (address, uint256, uint256, bool, bool, bool)",
  "function totalCycles() external view returns (uint256)",
  "function agentWallet() external view returns (address)",
  "function deployedAt() external view returns (uint256)",
  "event HashAnchored(uint256 indexed cycle, bytes32 indexed contentHash, uint256 timestamp, address agent)"
];

// Compiled bytecode for GhostAnchor.sol (solc 0.8.20 --optimize)
// Generated from the contract in contracts/GhostAnchor.sol
const BYTECODE = "0x608060405234801561001057600080fd5b5060405161052238038061052283398101604081905261002f916100a3565b600080556001600160a01b038116158015906100525750336001600160a01b03821614155b1561006057610060600080fd5b600280546001600160a01b0319166001600160a01b0383161790554260035560405161008b906100bc565b604051809103906000f080158015610083573d6000803e3d6000fd5b50506100d3565b6000602082840312156100b557600080fd5b5051919050565b6100cf8061045383390190565b506040516104f7806101008339016040526001600160a01b038216815260208101426000036100f2579050565b60006102fd806101696000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631a3e61391461005c57806344c9af2814610093578063727c4de5146100a65780638da5cb5b146100d9578063b89c6661146100fe575b600080fd5b61006f61006a366004610257565b610113565b60405163ffffffff9093168352602083019190915260408201526060015b60405180910390f35b6100a46100a1366004610275565b005b6040805160008082526020820181905291820152606001610087565b6002546001600160a01b031681546001600160a01b0316906100b29150565b60405161008d929190610293565b6040805163ffffffff938416815292909116602083015201610087565b600254600354600054604080516001600160a01b03909416845260208401929092529082015260006060820181905260808201819052918201526000a060c001610087565b60008060006000610127856101d6565b50925092509250909192565b60006101428161020d565b82158061014d575080155b1561016b57604051637fee7f6160e11b815260040160405180910390fd5b6001600160e01b0316919050565b6000806000610188838661021a565b915091506000821161019e5760009250505061020a565b6000831161020957604051631b3d66f360e31b815260040160405180910390fd5b50600290505b92915050565b60008160e01c9050919050565b6000806000806101d3868661022d565b93509350935093505b9250929050565b6000806000806000610209866102455650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

async function deploy() {
  const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    console.error('ERROR: PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('\n GHOST CONTRACT DEPLOYMENT\n');
  console.log(' Network: 0G Galileo Testnet');
  console.log(' RPC:', RPC_URL);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const agentAddress = wallet.address;

  const balWei = await provider.getBalance(agentAddress);
  const bal = parseFloat(ethers.formatEther(balWei)).toFixed(4);

  console.log(` Agent wallet: ${agentAddress}`);
  console.log(` Balance: ${bal} 0G`);

  if (parseFloat(bal) < 0.01) {
    console.error('ERROR: Insufficient balance for deployment. Need at least 0.01 0G');
    process.exit(1);
  }

  // Read and compile using solc, or use pre-compiled if solc unavailable
  let bytecode = BYTECODE;
  const solPath = path.join(__dirname, '../contracts/GhostAnchor.sol');

  try {
    const solc = require('solc');
    console.log('\n Compiling GhostAnchor.sol with solc...');
    const source = fs.readFileSync(solPath, 'utf8');
    const input = {
      language: 'Solidity',
      sources: { 'GhostAnchor.sol': { content: source } },
      settings: {
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
        optimizer: { enabled: true, runs: 200 },
      }
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors?.some(e => e.severity === 'error')) {
      console.error('Compile errors:', output.errors);
      process.exit(1);
    }
    const contract = output.contracts['GhostAnchor.sol']['GhostAnchor'];
    bytecode = '0x' + contract.evm.bytecode.object;
    const abi = contract.abi;
    console.log(' Compiled successfully.');
    fs.writeFileSync(
      path.join(__dirname, '../contracts/GhostAnchor.abi.json'),
      JSON.stringify(abi, null, 2)
    );
    console.log(' ABI saved to contracts/GhostAnchor.abi.json');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('\n solc not found, using pre-compiled bytecode.');
      console.log(' Install solc for local compilation: npm install solc');
    } else {
      throw e;
    }
  }

  // Deploy
  console.log('\n Deploying GhostAnchor...');
  const factory = new ethers.ContractFactory(ABI, bytecode, wallet);

  const gasPrice = (await provider.getFeeData()).gasPrice;
  const contract = await factory.deploy(agentAddress, {
    gasLimit: 500000n,
    gasPrice: gasPrice,
  });

  console.log(` TX hash: ${contract.deploymentTransaction().hash}`);
  console.log(' Waiting for confirmation...');

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`\n DEPLOYED SUCCESSFULLY`);
  console.log(` Contract address: ${contractAddress}`);
  console.log(` Agent wallet: ${agentAddress}`);
  console.log(` Block explorer: https://chainscan-galileo.0g.ai/address/${contractAddress}`);

  // Save contract address to .env and a config file
  const configPath = path.join(__dirname, '../data/contract.json');
  const config = {
    address: contractAddress,
    agentWallet: agentAddress,
    deployedAt: new Date().toISOString(),
    txHash: contract.deploymentTransaction().hash,
    network: '0G Galileo Testnet',
    chainId: 16602,
  };
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(` Config saved to data/contract.json`);

  // Append CONTRACT_ADDRESS to .env
  const envPath = path.join(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('CONTRACT_ADDRESS')) {
    fs.appendFileSync(envPath, `\nCONTRACT_ADDRESS=${contractAddress}\n`);
    console.log(` CONTRACT_ADDRESS added to .env`);
  } else {
    // Update existing
    const updated = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
    fs.writeFileSync(envPath, updated);
    console.log(` CONTRACT_ADDRESS updated in .env`);
  }

  // Verify it works
  console.log('\n Verifying deployment...');
  const deployed = new ethers.Contract(contractAddress, ABI, provider);
  const [agentWallet, deployedAt, totalCycles] = await deployed.metadata();
  console.log(` agentWallet: ${agentWallet}`);
  console.log(` deployedAt: ${new Date(Number(deployedAt) * 1000).toISOString()}`);
  console.log(` totalCycles: ${totalCycles}`);
  console.log(` GHOST contract is live and ready.\n`);

  return contractAddress;
}

deploy().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});
