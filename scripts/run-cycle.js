const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const CONTRACT_ABI = [
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function totalCycles() external view returns (uint256)",
  "function records(uint256) external view returns (bytes32 contentHash, uint256 timestamp, uint256 blockNumber, address agent)"
];

const TASK = `You are GHOST, an autonomous AI agent on 0G. Produce a concise intelligence report (max 150 words) on one meaningful development in decentralized AI or autonomous agents. Be specific, cite real projects. End with a one-line GHOST VERDICT.`;

const LOG_FILE = path.join(__dirname, '../data/cycles.json');
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

function loadCycles() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); }
  catch { return []; }
}

function saveCycle(record) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  const cycles = loadCycles();
  // Remove any old record for same cycle number
  const filtered = cycles.filter(c => c.cycle !== record.cycle);
  filtered.unshift(record);
  if (filtered.length > 200) filtered.splice(200);
  fs.writeFileSync(LOG_FILE, JSON.stringify(filtered, null, 2));
}

async function uploadToStorage(content, signer, label) {
  try {
    const { Indexer, MemData } = require('@0gfoundation/0g-storage-ts-sdk');
    const indexer = new Indexer(INDEXER_RPC);
    const data = new MemData(new TextEncoder().encode(content));
    const [result, err] = await indexer.upload(data, process.env.RPC_URL, signer);
    if (err) throw new Error(`Upload error: ${err}`);
    const rootHash = typeof result === 'string' ? result : result?.root || result?.rootHash || JSON.stringify(result);
    const txSeq = result?.txSeq ?? result?.tx_seq ?? null;
    const verifyUrl = txSeq
      ? `https://storagescan-galileo.0g.ai/submission/${txSeq}`
      : `https://storagescan-galileo.0g.ai/tx?hash=${rootHash}`;
    console.log(`[STORAGE] ${label} uploaded. Hash: ${rootHash}`);
    console.log(`[STORAGE] Verify: ${verifyUrl}`);
    return { rootHash, verifyUrl };
  } catch (e) {
    console.log(`[STORAGE] Skipped: ${e.message.slice(0, 80)}`);
    return null;
  }
}

async function findNextCycle(contract) {
  const total = await contract.totalCycles();
  let next = Number(total) + 1;
  try {
    const existing = await contract.records(next);
    if (existing[1] > 0n) next++;
  } catch {}
  return next;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const cycleNumber = await findNextCycle(contract);
  const timestamp = new Date().toISOString();
  const startMs = Date.now();

  console.log(`\n====== GHOST CYCLE #${cycleNumber} ======`);
  console.log(`Wallet: ${wallet.address}`);

  // Step 1: Inference
  console.log('Running inference...');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://ghost-rouge-five.vercel.app',
      'X-Title': 'GHOST Autonomous Agent',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [{ role: 'user', content: TASK }],
      max_tokens: 280,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Inference failed ${res.status}: ${err}`);
  }

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content || '';
  const inputTok = data.usage?.prompt_tokens || 0;
  const outputTok = data.usage?.completion_tokens || 0;
  const model = data.model || 'openrouter/auto';
  const latencyMs = Date.now() - startMs;
  console.log(`Inference done. ${inputTok}in/${outputTok}out/${latencyMs}ms`);
  console.log(`Preview: ${output.slice(0, 100)}...`);

  // Step 2: Content hash
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(output + timestamp));
  console.log(`Content hash: ${contentHash}`);

  // Step 3: 0G Storage
  const storageResult = await uploadToStorage(
    JSON.stringify({ cycle: cycleNumber, timestamp, output, model, contentHash, agent: 'ghost-v1.0', human_authorized: false }),
    wallet,
    `ghost-cycle-${cycleNumber}`
  );

  // Step 4: Anchor on chain
  console.log('Anchoring on GhostAnchor contract...');
  let chainResult = null;
  try {
    const gasEst = await contract.anchor.estimateGas(contentHash, cycleNumber);
    const tx = await contract.anchor(contentHash, cycleNumber, { gasLimit: gasEst * 2n });
    console.log(`TX: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Anchored at block ${receipt.blockNumber}`);
    chainResult = {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      contract: process.env.CONTRACT_ADDRESS,
      method: 'GhostAnchor.anchor()',
    };
  } catch (e) {
    console.log(`Chain anchor skipped: ${e.message.slice(0, 80)}`);
    chainResult = { skipped: true, reason: e.message.slice(0, 100) };
  }

  // Step 5: Save record
  const record = {
    cycle: cycleNumber,
    timestamp,
    status: 'complete',
    human_authorized: false,
    contentHash,
    storageHash: storageResult?.rootHash || null,
    storageUrl: storageResult?.verifyUrl || null,
    chain: chainResult,
    compute: { output, model, inputTok, outputTok, latencyMs },
    wallet: { address: wallet.address },
  };
  saveCycle(record);
  console.log(`Cycle #${cycleNumber} saved.`);
  console.log(`====== COMPLETE ======\n`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
