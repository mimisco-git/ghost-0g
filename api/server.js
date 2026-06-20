require('dotenv').config();
const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { ethers } = require('ethers');

const PORT     = process.env.PORT || 3001;
const RPC_URL  = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const LOG_FILE = path.join(__dirname, '../data/cycles.json');
const EXPLORER = 'https://chainscan-galileo.0g.ai';
const CYCLE_MS = 6 * 60 * 1000;

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

function loadCycles() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch { return []; }
}

async function getChainData() {
  if (!process.env.PRIVATE_KEY) {
    return { address: null, balance: '0', txCount: 0, error: 'No wallet configured' };
  }
  try {
    const provider  = new ethers.JsonRpcProvider(RPC_URL);
    const wallet    = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
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
    };
  } catch (err) { return { error: err.message }; }
}

function buildStats(cycles, chainData) {
  const completed   = cycles.filter(c => c.status === 'complete');
  const failed      = cycles.filter(c => c.status === 'compute_failed');
  const totalTokens = completed.reduce((s,c) => s + (c.compute?.inputTok||0) + (c.compute?.outputTok||0), 0);
  const avgLatency  = completed.length > 0
    ? Math.round(completed.reduce((s,c) => s + (c.compute?.latencyMs||0), 0) / completed.length)
    : 0;
  const anchored = completed.filter(c => c.chain && !c.chain.error);
  return {
    totalCycles: cycles.length, completedCycles: completed.length,
    failedCycles: failed.length, anchoredOnChain: anchored.length,
    totalTokens, avgLatencyMs: avgLatency,
    humanAuthorized: false, adminKeys: 0,
    model: 'zai-org/GLM-5-FP8', network: '0G Testnet',
    wallet: chainData, lastCycle: cycles[0] || null,
  };
}

const server = http.createServer(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  const url = req.url.split('?')[0];

  if (url === '/api/stats') {
    try {
      const [cycles, chainData] = await Promise.all([loadCycles(), getChainData()]);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: buildStats(cycles, chainData), ts: new Date().toISOString() }));
    } catch (err) { res.writeHead(500); res.end(JSON.stringify({ ok: false, error: err.message })); }
    return;
  }

  if (url === '/api/cycles') {
    try {
      const cycles = loadCycles();
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, total: cycles.length, cycles: cycles.slice(0, 50), ts: new Date().toISOString() }));
    } catch (err) { res.writeHead(500); res.end(JSON.stringify({ ok: false, error: err.message })); }
    return;
  }

  if (url === '/api/wallet') {
    try {
      const chainData = await getChainData();
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, data: chainData, ts: new Date().toISOString() }));
    } catch (err) { res.writeHead(500); res.end(JSON.stringify({ ok: false, error: err.message })); }
    return;
  }

  if (url === '/api/health') {
    const cycles = loadCycles();
    const last   = cycles[0];
    const alive  = last ? (Date.now() - new Date(last.timestamp).getTime()) < (CYCLE_MS * 2 + 60000) : false;
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, agentAlive: alive, lastCycleAt: last?.timestamp || null, totalCycles: cycles.length, ts: new Date().toISOString() }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[API] Ghost dashboard API running on http://localhost:${PORT}`);
  console.log(`[API] Endpoints: /api/stats /api/cycles /api/wallet /api/health`);
});

module.exports = server;
