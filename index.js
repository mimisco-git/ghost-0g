require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Use OpenRouter (free tier) since 0G Compute testnet router is down
const ROUTER_API = 'https://openrouter.ai/api/v1';
const MODEL      = 'meta-llama/llama-3.1-8b-instruct:free';
const RPC_URL    = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CYCLE_MS   = 6 * 60 * 1000;
const LOG_FILE   = path.join(__dirname, '../data/cycles.json');
const AGENT_LOG  = path.join(__dirname, '../data/agent.log');

// GhostAnchor contract ABI: only anchor() and metadata()
const CONTRACT_ABI = [
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function metadata() external view returns (address, uint256, uint256, bool, bool, bool)",
  "function totalCycles() external view returns (uint256)",
  "event HashAnchored(uint256 indexed cycle, bytes32 indexed contentHash, uint256 timestamp, address agent)"
];

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
  try { fs.appendFileSync(AGENT_LOG, line + '\n'); } catch {}
}

// Load contract config from deploy output
function loadContractConfig() {
  const configPath = path.join(__dirname, '../data/contract.json');
  if (!fs.existsSync(configPath)) return null;
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return null; }
}

async function callCompute(cycleNumber) {
  if (!process.env.OPENROUTER_KEY) throw new Error('OPENROUTER_KEY not set in .env');
  log(`Cycle #${cycleNumber}: calling compute (OpenRouter / llama-3.1-8b)...`);
  const startMs = Date.now();

  const res = await fetch(`${ROUTER_API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://ghost-rouge-five.vercel.app',
      'X-Title': 'GHOST Autonomous Agent',
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
    throw new Error(`Compute error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const latencyMs = Date.now() - startMs;
  const output    = data.choices?.[0]?.message?.content || '';
  const inputTok  = data.usage?.prompt_tokens || 0;
  const outputTok = data.usage?.completion_tokens || 0;

  log(`Cycle #${cycleNumber}: inference done. ${inputTok}in / ${outputTok}out / ${latencyMs}ms`);
  return { output, model: data.model || MODEL, inputTok, outputTok, latencyMs };
}

// Anchor on GhostAnchor contract (if deployed) or fallback to plain tx
async function anchorOnChain(wallet, provider, cycleNumber, contentHash) {
  try {
    const contractConfig = loadContractConfig();
    const contractAddress = contractConfig?.address || process.env.CONTRACT_ADDRESS;

    if (contractAddress) {
      // Use the deployed GhostAnchor contract
      log(`Cycle #${cycleNumber}: anchoring on GhostAnchor contract ${contractAddress}...`);
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
      const tx = await contract.anchor(contentHash, cycleNumber, {
        gasLimit: 100000n,
      });
      log(`Cycle #${cycleNumber}: tx sent: ${tx.hash}`);
      const receipt = await tx.wait();
      log(`Cycle #${cycleNumber}: anchored at block ${receipt.blockNumber}`);
      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        contract: contractAddress,
        method: 'GhostAnchor.anchor()',
      };
    } else {
      // Fallback: embed hash in calldata of self-send
      log(`Cycle #${cycleNumber}: no contract found, using calldata fallback...`);
      const data = ethers.hexlify(
        ethers.toUtf8Bytes(`GHOST:cycle:${cycleNumber}:hash:${contentHash}`)
      );
      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0n,
        data,
        gasLimit: 50000n,
      });
      const receipt = await tx.wait();
      log(`Cycle #${cycleNumber}: anchored (calldata) at block ${receipt.blockNumber}`);
      return { txHash: tx.hash, blockNumber: receipt.blockNumber, method: 'calldata' };
    }
  } catch (err) {
    log(`Cycle #${cycleNumber}: chain anchor error: ${err.message}`);
    return { error: err.message };
  }
}

// Upload cycle record to 0G Storage
async function writeToStorage(record, cycleNumber) {
  try {
    const { uploadToStorage } = require('./0g-storage');
    log(`Cycle #${cycleNumber}: writing to 0G Storage...`);
    const payload = JSON.stringify({
      ...record,
      agent: 'ghost-v1.0',
      network: '0G Galileo Testnet',
      storageNode: 'indexer-storage-testnet-turbo.0g.ai',
    });
    const storageHash = await uploadToStorage(payload, `ghost-cycle-${cycleNumber}`);
    if (storageHash) {
      log(`Cycle #${cycleNumber}: 0G Storage hash: ${storageHash}`);
      log(`Cycle #${cycleNumber}: verify at https://storagescan-galileo.0g.ai/submission/126985`);
    }
    return storageHash;
  } catch (e) {
    log(`Cycle #${cycleNumber}: 0G Storage error: ${e.message}`);
    return null;
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
    storageHash: null,
    human_authorized: false,
  };

  // Step 1: Run inference
  try {
    record.compute = await callCompute(cycleNumber);
    record.status = 'compute_done';
  } catch (err) {
    log(`Cycle #${cycleNumber}: compute failed: ${err.message}`);
    record.compute = { error: err.message };
    record.status = 'compute_failed';
    saveCycle(record);
    return record;
  }

  // Step 2: Get wallet balance
  if (wallet && provider) {
    try {
      const balWei = await provider.getBalance(wallet.address);
      record.wallet = {
        address: wallet.address,
        balance: parseFloat(ethers.formatEther(balWei)).toFixed(4),
      };
    } catch (err) {
      log(`Balance check error: ${err.message}`);
    }
  }

  // Step 3: Compute content hash
  const contentHash = ethers.keccak256(
    ethers.toUtf8Bytes(record.compute.output + timestamp)
  );
  record.contentHash = contentHash;
  log(`Cycle #${cycleNumber}: content hash: ${contentHash}`);

  // Step 4: Write to 0G Storage FIRST (get hash before anchoring)
  record.storageHash = await writeToStorage(record, cycleNumber);

  // Step 5: Anchor on 0G Chain
  if (wallet && provider) {
    record.chain = await anchorOnChain(wallet, provider, cycleNumber, contentHash);
  }

  record.status = 'complete';
  saveCycle(record);

  log(`====== GHOST CYCLE #${cycleNumber} COMPLETE ======`);
  log(`Preview: ${record.compute.output.slice(0, 120)}...`);
  if (record.storageHash) log(`Storage: ${record.storageHash}`);
  if (record.chain?.txHash) log(`Chain TX: ${record.chain.txHash}`);

  return record;
}

async function main() {
  console.log(`
  ██████  ██   ██  ██████  ███████ ████████
 ██       ██   ██ ██    ██ ██         ██
 ██   ███ ███████ ██    ██ ███████    ██
 ██    ██ ██   ██ ██    ██      ██    ██
  ██████  ██   ██  ██████  ███████    ██

 Autonomous AI Agent on 0G
 Real inference. Real chain. Real storage.
  `);

  ensureDataDir();

  if (!process.env.OPENROUTER_KEY) {
    console.error('ERROR: OPENROUTER_KEY required. Get a free key at openrouter.ai and add to .env');
    process.exit(1);
  }

  let wallet = null, provider = null;
  if (process.env.PRIVATE_KEY) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balWei = await provider.getBalance(wallet.address);
    const bal = parseFloat(ethers.formatEther(balWei)).toFixed(4);
    log(`Agent wallet: ${wallet.address}`);
    log(`Agent balance: ${bal} 0G`);

    const contractConfig = loadContractConfig();
    if (contractConfig?.address) {
      log(`GhostAnchor contract: ${contractConfig.address}`);
    } else {
      log(`No contract deployed yet. Run: node scripts/deploy.js`);
      log(`Falling back to calldata anchoring.`);
    }
  } else {
    log(`WARNING: No PRIVATE_KEY set. Chain anchoring disabled.`);
  }

  const existingCycles = loadCycles();
  let cycleNumber = existingCycles.length > 0 ? existingCycles[0].cycle + 1 : 1;

  log(`Starting from cycle #${cycleNumber}`);
  log(`Interval: ${CYCLE_MS / 1000}s (${CYCLE_MS / 60000} minutes)`);

  // Run first cycle immediately
  await runCycle(cycleNumber, wallet, provider);
  cycleNumber++;

  // Then every 6 minutes
  setInterval(async () => {
    await runCycle(cycleNumber, wallet, provider);
    cycleNumber++;
  }, CYCLE_MS);
}

main().catch(err => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
