require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const ROUTER_API  = 'https://openrouter.ai/api/v1';
const MODEL       = 'meta-llama/llama-3.1-8b-instruct:free';
const RPC_URL     = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CYCLE_MS    = 6 * 60 * 1000;
const LOG_FILE    = path.join(__dirname, '../data/cycles.json');
const AGENT_LOG   = path.join(__dirname, '../data/agent.log');

const TASK = `You are GHOST, an autonomous AI agent running inside the 0G decentralized compute network.
Your task every cycle: produce a concise intelligence report (max 200 words) on one meaningful development
in decentralized AI, Web3 infrastructure, or autonomous agents. Be specific. Cite real project names.
End with a one-line "GHOST VERDICT" that a judge reading in 5 seconds would remember.`;

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
  cycles.unshift(record);
  if (cycles.length > 200) cycles.splice(200);
  fs.writeFileSync(LOG_FILE, JSON.stringify(cycles, null, 2));
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(AGENT_LOG, line + '\n');
}

async function callCompute(cycleNumber) {
  if (!process.env.OPENROUTER_KEY) throw new Error('OPENROUTER_KEY not set in .env');
  log(`Cycle #${cycleNumber}: calling 0G Compute Router...`);
  const startMs = Date.now();

  const res = await fetch(`${ROUTER_API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
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
  const inputTok  = data.usage?.prompt_tokens || 0;
  const outputTok = data.usage?.completion_tokens || 0;

  log(`Cycle #${cycleNumber}: inference complete. ${inputTok} in / ${outputTok} out / ${latencyMs}ms`);
  return { output, model: data.model || MODEL, inputTok, outputTok, latencyMs };
}

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
    return { txHash: tx.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    log(`Cycle #${cycleNumber}: chain anchor error: ${err.message}`);
    return { error: err.message };
  }
}

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

  if (wallet && provider) {
    try {
      const balWei  = await provider.getBalance(wallet.address);
      record.wallet = { address: wallet.address, balance: parseFloat(ethers.formatEther(balWei)).toFixed(4) };
    } catch (err) { log(`Balance check error: ${err.message}`); }
  }

  const contentHash = ethers.keccak256(
    ethers.toUtf8Bytes(record.compute.output + timestamp)
  );
  record.contentHash = contentHash;

  if (wallet && provider) {
    record.chain = await anchorOnChain(wallet, provider, cycleNumber, contentHash);
  }

  // Write to 0G Storage
  try {
    const { uploadToStorage } = require('./0g-storage');
    const storageHash = await uploadToStorage(JSON.stringify(record), `ghost-cycle-${cycleNumber}`);
    record.storageHash = storageHash;
  } catch(e) { console.error('[STORAGE]', e.message); }

  record.status = 'complete';
  saveCycle(record);
  log(`====== GHOST CYCLE #${cycleNumber} COMPLETE ======\n`);
  log(`Output preview: ${record.compute.output.slice(0, 120)}...`);
  return record;
}

async function main() {
  console.log(`
  ██████  ██   ██  ██████  ███████ ████████
 ██       ██   ██ ██    ██ ██         ██
 ██   ███ ███████ ██    ██ ███████    ██
 ██    ██ ██   ██ ██    ██      ██    ██
  ██████  ██   ██  ██████  ███████    ██

 Autonomous AI Agent on 0G Compute
 Real inference. Real chain. No fake data.
  `);

  ensureDataDir();

  if (!process.env.OPENROUTER_KEY) {
    console.error('ERROR: OPENROUTER_KEY is required. Set it in .env');
    process.exit(1);
  }

  let wallet = null, provider = null;
  if (process.env.PRIVATE_KEY) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balWei = await provider.getBalance(wallet.address);
    log(`Agent wallet: ${wallet.address}`);
    log(`Agent balance: ${parseFloat(ethers.formatEther(balWei)).toFixed(4)} 0G`);
  }

  const existingCycles = loadCycles();
  let cycleNumber = existingCycles.length > 0 ? existingCycles[0].cycle + 1 : 1;

  log(`Starting from cycle #${cycleNumber}`);
  log(`Cycle interval: ${CYCLE_MS / 1000}s`);

  await runCycle(cycleNumber, wallet, provider);
  cycleNumber++;

  setInterval(async () => {
    await runCycle(cycleNumber, wallet, provider);
    cycleNumber++;
  }, CYCLE_MS);
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
// NOTE: Storage integration added below main loop
