const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const CONTRACT_ABI = [
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function totalCycles() external view returns (uint256)",
  "function records(uint256) external view returns (bytes32 contentHash, uint256 timestamp, uint256 blockNumber, address agent)"
];

const TASK = `You are GHOST, an autonomous AI agent on 0G. Produce a concise intelligence report (max 150 words) on one meaningful development in decentralized AI or autonomous agents. End with a one-line GHOST VERDICT.`;

const LOG_FILE = path.join(__dirname, '../data/cycles.json');

function loadCycles() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); }
  catch { return []; }
}

function saveCycle(record) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  const cycles = loadCycles();
  cycles.unshift(record);
  if (cycles.length > 200) cycles.splice(200);
  fs.writeFileSync(LOG_FILE, JSON.stringify(cycles, null, 2));
}

async function findNextCycleNumber(contract) {
  // Get total anchored cycles then find first unanchored slot
  const total = await contract.totalCycles();
  let next = Number(total) + 1;
  // Verify slot is not already taken (defensive check)
  try {
    const existing = await contract.records(next);
    if (existing[1] > 0n) {
      // Already anchored, try next
      next = next + 1;
      console.log(`Slot ${next-1} taken, trying ${next}`);
    }
  } catch {}
  return next;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const cycleNumber = await findNextCycleNumber(contract);
  console.log(`Running cycle #${cycleNumber}`);

  const timestamp = new Date().toISOString();
  const startMs = Date.now();

  // Run inference
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [{ role: 'user', content: TASK }],
      max_tokens: 250,
    }),
  });

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content || '';
  const inputTok = data.usage?.prompt_tokens || 0;
  const outputTok = data.usage?.completion_tokens || 0;
  const model = data.model || 'openrouter/auto';
  const latencyMs = Date.now() - startMs;
  console.log('Output preview:', output.slice(0, 120));

  // Hash and anchor
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(output + timestamp));
  
  // Estimate gas first to catch revert before spending
  try {
    const gasEst = await contract.anchor.estimateGas(contentHash, cycleNumber);
    console.log(`Gas estimate: ${gasEst}`);
  } catch (e) {
    console.error(`Anchor would revert: ${e.message}`);
    console.log('Skipping anchor, saving compute result only');
    saveCycle({
      cycle: cycleNumber, timestamp, status: 'anchor_failed',
      human_authorized: false, contentHash,
      compute: { output, model, inputTok, outputTok, latencyMs },
    });
    return;
  }

  const tx = await contract.anchor(contentHash, cycleNumber, { gasLimit: 200000n });
  const receipt = await tx.wait();
  console.log(`Anchored cycle #${cycleNumber} at block ${receipt.blockNumber}`);
  console.log(`TX: ${tx.hash}`);

  const record = {
    cycle: cycleNumber, timestamp, status: 'complete',
    human_authorized: false, contentHash,
    compute: { output, model, inputTok, outputTok, latencyMs },
    chain: { txHash: tx.hash, blockNumber: receipt.blockNumber, contract: process.env.CONTRACT_ADDRESS },
    wallet: { address: wallet.address },
  };
  saveCycle(record);
  console.log(`Cycle #${cycleNumber} complete and saved.`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
