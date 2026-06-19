const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

/**
 * Minimal ABI for the Ghost anchor contract
 * This contract stores content hashes on-chain with no admin key
 */
const GHOST_ABI = [
  'function anchor(bytes32 contentHash, uint256 cycleNumber) external',
  'function getRecord(uint256 cycleNumber) external view returns (bytes32 contentHash, uint256 timestamp)',
  'function totalCycles() external view returns (uint256)',
  'event HashAnchored(uint256 indexed cycle, bytes32 contentHash, uint256 timestamp)',
];

// Deployed contract address (update after deployment)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

/**
 * Anchor a storage root hash on 0G Chain
 * This makes the record immutably timestamped and verifiable
 */
async function anchorHash(wallet, storageHash, cycleNumber) {
  // If contract not deployed yet, log and return a placeholder
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.log(`[0G-CHAIN] Contract not deployed yet · storing hash locally for now`);
    console.log(`[0G-CHAIN] Hash to anchor: ${storageHash} · cycle: ${cycleNumber}`);

    // For the MVP, write an ETH transaction with the hash in calldata
    // This still creates an on-chain record without needing the full contract
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = wallet.connect(provider);

    const hashBytes = ethers.toUtf8Bytes(`GHOST:${cycleNumber}:${storageHash}`);

    const tx = await signer.sendTransaction({
      to: wallet.address, // send to self with data
      value: 0n,
      data: ethers.hexlify(hashBytes),
      gasLimit: 100000n,
    });

    await tx.wait();
    console.log(`[0G-CHAIN] Hash anchored via calldata · tx: ${tx.hash}`);
    return tx.hash;
  }

  // Full contract interaction (after deployment)
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, GHOST_ABI, wallet.connect(provider));

  const hashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(storageHash));

  const tx = await contract.anchor(hashBytes32, cycleNumber, {
    gasLimit: 200000n,
  });

  const receipt = await tx.wait();
  console.log(`[0G-CHAIN] Hash anchored · tx: ${tx.hash} · block: ${receipt.blockNumber}`);
  return tx.hash;
}

/**
 * Read a record back from the chain to verify it exists
 */
async function verifyOnChain(cycleNumber) {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.log(`[0G-CHAIN] Contract not deployed · cannot verify on-chain yet`);
    return null;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, GHOST_ABI, provider);
  const [contentHash, timestamp] = await contract.getRecord(cycleNumber);

  return {
    cycle: cycleNumber,
    contentHash,
    timestamp: new Date(Number(timestamp) * 1000).toISOString(),
  };
}

module.exports = { anchorHash, verifyOnChain };
