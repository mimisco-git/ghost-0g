require('dotenv').config();
const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { ethers } = require('ethers');

const PORT     = process.env.PORT || 3001;
const RPC_URL  = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const LOG_FILE = path.join(__dirname, '../data/cycles.json');
const EXPLORER = 'https://chainscan-galileo.0g.ai';

// ─── CORS HEADERS ─────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

// ─── READ CYCLE LOG ───────────────────────────────────────────────────────────
function loadCycles() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch { return []; }
}

// ─── REAL CHAIN DATA ──────────────────────────────────────────────────────────
async function getChainData() {
  if (!process.env.PRIVATE_KEY) {
    return { address: null, balance: '0', txCount: 0, error: 'No wallet configured' };
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const [balWei, txCount, blockNumber] = await Promise.all([
      provider.getBalance(wallet.address),
      provider.getTransactionCount(wallet.address),
      provider.getBlockNumber(),
    ]);

    return {
      address:     wallet.address,
      balance:     parseFloat(ethers.formatEther(balWei)).toFixed(4),
      balanceWei:  balWei.toString(),
      txCount,
      blockNumber,
      explorerUrl: `${EXPLORER}/address/${wallet.address}`,
      network:     '0G Testnet',
      rpc:         RPC_URL,
    };
  } catch (err) {
    return { error: err.message };
  }
}

// ─── BUILD STATS FROM REAL CYCLES ─────────────────────────────────────────────
function buildStats(cycles, chainData) {
  const completed = cycles.filter(c => c.status === 'complete');
  const failed    = cycles.filter(c => c.status === 'compute_failed');

  const totalTokens = completed.reduce((sum, c) => {
    return sum + (c.compute?.inputTok || 0) + (c.compute?.outputTok || 0);
  }, 0);

  const avgLatency = completed.length > 0
    ? Math.round(
        completed.reduce((sum, c) => sum + (c.compute?.latencyMs || 0), 0)
        / completed.length
      )
    : 0;

  const anchored = completed.filter(c => c.chain && !c.chain.error);

  return {
    totalCycles:     cycles.length,
    completedCycles: completed.length,
    failedCycles:    failed.length,
    anchoredOnChain: anchored.length,
    totalTokens,
    avgLatencyMs:    avgLatency,
    humanAuthorized: false,
    adminKeys:       0,
    model:           'zai-org/GLM-5-FP8',
    network:         '0G Testnet',
    wallet:          chainData,
    lastCycle:       cycles[0] || null,
  };
}

// ─── HTTP SERVER ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // GET /api/stats - full dashboard stats
  if (url === '/api/stats') {
    try {
      const [cycles, chainData] = await Promise.all([
        loadCycles(),
        getChainData(),
      ]);
      const stats = buildStats(cycles, chainData);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: stats, ts: new Date().toISOString() }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // GET /api/cycles - list of all cycles
  if (url === '/api/cycles') {
    try {
      const cycles = loadCycles();
      res.writeHead(200);
      res.end(JSON.stringify({
        ok:     true,
        total:  cycles.length,
        cycles: cycles.slice(0, 50), // latest 50
        ts:     new Date().toISOString(),
      }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // GET /api/cycles/:number - single cycle detail
  if (url.startsWith('/api/cycles/')) {
    try {
      const num    = parseInt(url.split('/')[3]);
      const cycles = loadCycles();
      const cycle  = cycles.find(c => c.cycle === num);
      if (!cycle) {
        res.writeHead(404);
        res.end(JSON.stringify({ ok: false, error: 'Cycle not found' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: cycle }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // GET /api/wallet - live wallet data from chain
  if (url === '/api/wallet') {
    try {
      const chainData = await getChainData();
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: chainData, ts: new Date().toISOString() }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // GET /api/health
  if (url === '/api/health') {
    const cycles = loadCycles();
    const last   = cycles[0];
    const alive  = last
      ? (Date.now() - new Date(last.timestamp).getTime()) < (CYCLE_MS * 2 + 60000)
      : false;

    res.writeHead(200);
    res.end(JSON.stringify({
      ok:          true,
      agentAlive:  alive,
      lastCycleAt: last?.timestamp || null,
      totalCycles: cycles.length,
      ts:          new Date().toISOString(),
    }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

const CYCLE_MS = 6 * 60 * 1000;

server.listen(PORT, () => {
  console.log(`[API] Ghost dashboard API running on http://localhost:${PORT}`);
  console.log(`[API] Endpoints:`);
  console.log(`      GET /api/stats    - full dashboard data`);
  console.log(`      GET /api/cycles   - all inference cycles`);
  console.log(`      GET /api/wallet   - live wallet from 0G Chain`);
  console.log(`      GET /api/health   - agent alive check`);
});

module.exports = server;
