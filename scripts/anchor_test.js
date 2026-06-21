require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const ABI_PATH = path.join(__dirname, '../../contracts/GhostAnchor.abi.json');
// Fallback inline ABI matching the exact compiled contract
const ABI = [
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function totalCycles() external view returns (uint256)",
  "function records(uint256) external view returns (bytes32 contentHash, uint256 timestamp, uint256 blockNumber, address agent)",
  "function metadata() external view returns (address, uint256, uint256, bool, bool, bool)"
];

async function testAnchor() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractAddress = process.env.CONTRACT_ADDRESS;

  console.log('Contract:', contractAddress);
  console.log('Wallet:', wallet.address);

  let abi = ABI;
  if (fs.existsSync(ABI_PATH)) {
    abi = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'));
    console.log('Using compiled ABI from file');
  } else {
    console.log('Using inline ABI');
  }

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Check total cycles first
  const total = await contract.totalCycles();
  console.log('Total cycles on-chain:', total.toString());

  // Try anchoring cycle 1
  const testHash = ethers.keccak256(ethers.toUtf8Bytes('GHOST test cycle 1 ' + Date.now()));
  console.log('Test hash:', testHash);
  console.log('Sending anchor tx...');

  try {
    // Estimate gas first to catch revert before sending
    const gasEst = await contract.anchor.estimateGas(testHash, 1n);
    console.log('Gas estimate:', gasEst.toString(), '(no revert expected)');

    const tx = await contract.anchor(testHash, 1n, { gasLimit: gasEst * 2n });
    console.log('TX sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Anchored at block:', receipt.blockNumber);
    console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');

    // Verify
    const total2 = await contract.totalCycles();
    console.log('Total cycles after:', total2.toString());
  } catch (err) {
    console.error('Error:', err.message);
    // Try to decode the revert reason
    if (err.data) {
      try {
        const decoded = ethers.toUtf8String(err.data);
        console.error('Revert reason:', decoded);
      } catch {}
    }
  }
}

testAnchor().catch(console.error);
