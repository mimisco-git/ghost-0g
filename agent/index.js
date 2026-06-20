require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ROUTER_API  = 'https://router-api-testnet.integratenetwork.work/v1';
const MODEL       = 'zai-org/GLM-5-FP8';
const RPC_URL     = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CYCLE_MS    = 6 * 60 * 1000; // 6 minutes
const LOG_FILE    = path.join(__dirname, '../data/cycles.json');

// GHOST's task every cycle
const TASK = `You are GHOST, an autonomous AI agent running inside the 0G decentralized compute network.
Your job every cycle: produce a short intelligence report (max 200 words) on one meaningful development
in decentralized AI, Web3 infrastructure, or autonomous agents. Be specific. Cite real project names.
End with a one-line "GHOST VERDICT" that a judge reading in 5 seconds would remember.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ensureDataDir() {
  const dir = path.join(__dirname, '../data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

function loadCycles() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); }
  catch { return []; }
}

function saveCycle(record) {
  const cycles = loadCycles();
  cycles.unshift(record); // newest first
  if (cycles.length > 200) cycles.splice(200); // keep last 200
  fs.writeFileSync(LOG_FILE, JSON.stringify(cycles, null, 2));
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  // Also append to a plain log file
  fs.appendFileSync(
    path.join(__dirname, '../data/agent.log'),
    line + '\n'
  );
}

// ─── STEP 1: REAL 0G COMPUTE CALL ─────────────────────────────────────────────
async function callCompute(cycleNumber) {
  if (!process.env.ROUTER_API_KEY) throw new Error('ROUTER_API_KEY not set in .env');

  log(`Cycle #${cycleNumber}: calling 0G Compute Router...`);

  const startMs = Date.now();

  const res = await fetch(`${ROUTER_API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: TASK }],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`0G Compute error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const latencyMs = Date.now() - startMs;

  const output    = data.choices?.[0]?.message?.content || '';
  const model     = data.model || MODEL;
  const inputTok  = data.usage?.prompt_tokens || 0;
  const outputTok = data.usage?.completion_tokens || 0;

  log(`Cycle #${cycleNumber}: inference complete. ${inputTok} in / ${outputTok} out / ${latencyMs}ms`);

  return { output, model, inputTok, outputTok, latencyMs, rawResponse: data };
}

// ─── STEP 2: READ REAL WALLET BALANCE FROM CHAIN ─────────────────────────────
async function getWalletBalance() {
  if (!process.env.PRIVATE_KEY) {
    log('No PRIVATE_KEY set, skipping balance check');
    return null;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const balWei   = await provider.getBalance(wallet.address);
  const balance  = parseFloat(ethers.formatEther(balWei)).toFixed(4);

  log(`Agent wallet ${wallet.address} balance: ${balance} 0G`);
  return { address: wallet.address, balance, balanceWei: balWei.toString() };
}

// ─── STEP 3: ANCHOR HASH ON CHAIN (CALLDATA TX) ───────────────────────────────
async function anchorOnChain(wallet, provider, cycleNumber, contentHash) {
  try {
    const data = ethers.hexlify(
      ethers.toUtf8Bytes(`GHOST:cycle:${cycleNumber}:hash:${contentHash}`)
    );

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0n,
      data,
      gasLimit: 50000n,
    });

    log(`Cycle #${cycleNumber}: anchoring hash on 0G Chain... tx: ${tx.hash}`);
    const receipt = await tx.wait();
    log(`Cycle #${cycleNumber}: anchored at block ${receipt.blockNumber}`);

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      network: '0G Testnet',
    };
  } catch (err) {
    log(`Cycle #${cycleNumber}: chain anchor error: ${err.message}`);
    return { error: err.message };
  }
}

// ─── MAIN CYCLE ───────────────────────────────────────────────────────────────
async function runCycle(cycleNumber, wallet, provider) {
  const timestamp = new Date().toISOString();
  log(`\n====== GHOST CYCLE #${cycleNumber} STARTED ======`);

  const record = {
    cycle: cycleNumber,
    timestamp,
    status: 'running',
    compute: null,
    wallet: null,
    chain: null,
    human_authorized: false,
  };

  // 1. Real 0G Compute inference
  try {
    record.compute = await callCompute(cycleNumber);
    record.status = 'compute_done';
  } catch (err) {
    log(`Cycle #${cycleNumber}: compute failed: ${err.message}`);
    record.compute = { error: err.message };
    record.status = 'compute_failed';
    saveCycle(record);
    return;
  }

  // 2. Real wallet balance
  try {
    if (wallet) {
      const balWei  = await provider.getBalance(wallet.address);
      const balance = parseFloat(ethers.formatEther(balWei)).toFixed(4);
      record.wallet = { address: wallet.address, balance };
    }
  } catch (err) {
    log(`Balance check error: ${err.message}`);
  }

  // 3. Build content hash
  const contentHash = ethers.keccak256(
    ethers.toUtf8Bytes(record.compute.output + timestamp)
  );
  record.contentHash = contentHash;

  // 4. Anchor on chain
  if (wallet && provider) {
    record.chain = await anchorOnChain(wallet, provider, cycleNumber, contentHash);
  }

  record.status = 'complete';
  saveCycle(record);

  log(`====== GHOST CYCLE #${cycleNumber} COMPLETE ======\n`);
  log(`Output preview: ${record.compute.output.slice(0, 120)}...`);

  return record;
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`
  ██████  ██   ██  ██████  ███████ ████████
 ██       ██   ██ ██    ██ ██         ██
 ██   ███ ███████ ██    ██ ███████    ██
 ██    ██ ██   ██ ██    ██      ██    ██
  ██████  ██   ██  ██████  ███████    ██

 Autonomous AI Agent on 0G Compute
 Real inference. Real chain. Real storage.
 No fake data. No placeholders.
  `);

  ensureDataDir();

  if (!process.env.ROUTER_API_KEY) {
    console.error('ERROR: ROUTER_API_KEY is required. Set it in .env');
    process.exit(1);
  }

  // Setup wallet if private key is available
  let wallet   = null;
  let provider = null;

  if (process.env.PRIVATE_KEY) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    log(`Agent wallet: ${wallet.address}`);

    const balWei  = await provider.getBalance(wallet.address);
    const balance = parseFloat(ethers.formatEther(balWei)).toFixed(4);
    log(`Agent balance: ${balance} 0G`);
  } else {
    log('WARNING: No PRIVATE_KEY. Chain anchoring disabled.');
  }

  // Get starting cycle number from existing data
  const existingCycles = loadCycles();
  let cycleNumber = existingCycles.length > 0
    ? existingCycles[0].cycle + 1
    : 1;

  log(`Starting from cycle #${cycleNumber}`);
  log(`Cycle interval: ${CYCLE_MS / 1000}s`);

  // Run first cycle immediately
  await runCycle(cycleNumber, wallet, provider);
  cycleNumber++;

  // Then run on interval
  setInterval(async () => {
    await runCycle(cycleNumber, wallet, provider);
    cycleNumber++;
  }, CYCLE_MS);
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
