require('dotenv').config();
const { createBroker } = require('@0glabs/0g-serving-broker');
const { ethers } = require('ethers');
const { uploadToStorage, buildStorageClient } = require('./0g-storage');
const { anchorHash } = require('./0g-chain');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS || '0xf07240Efa67755B5311bc75784a061eDB47165Dd';
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CYCLE_INTERVAL_MS = 6 * 60 * 1000; // 6 minutes
const AGENT_TASK = `You are GHOST, an autonomous AI agent running inside a 0G Trusted Execution Environment.
Your task is to produce a concise, verifiable intelligence report on the current state of decentralized AI.
Cover: notable developments, key protocols, and one insight that demonstrates autonomous reasoning.
Keep your report under 300 words. Be precise. Be autonomous.`;

// ─── WALLET SETUP ─────────────────────────────────────────────────────────────
async function setupWallet() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`[GHOST] Agent wallet: ${wallet.address}`);
  console.log(`[GHOST] Balance: ${ethers.formatEther(balance)} 0G`);
  return { wallet, provider };
}

// ─── MAIN CYCLE ───────────────────────────────────────────────────────────────
async function runCycle(broker, wallet, cycleNumber) {
  const timestamp = new Date().toISOString();
  console.log(`\n[GHOST] ─── Cycle #${cycleNumber} started at ${timestamp} ───`);

  // STEP 1: Run TEE inference via 0G Compute
  console.log(`[GHOST] Calling 0G Compute · provider: ${PROVIDER_ADDRESS}`);

  let inferenceResult = null;
  let attestation = null;

  try {
    const { endpoint, model } = await broker.inference.getServiceMetadata(PROVIDER_ADDRESS);
    const headers = await broker.inference.getRequestHeaders(PROVIDER_ADDRESS, AGENT_TASK);

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: AGENT_TASK }],
        max_tokens: 400,
      }),
    });

    const raw = await response.json();
    const chatID = response.headers.get('X-Chat-ID') || `cycle-${cycleNumber}-${Date.now()}`;

    // Verify TEE attestation
    try {
      await broker.inference.processResponse(PROVIDER_ADDRESS, raw, chatID);
      attestation = { verified: true, chatID, provider: PROVIDER_ADDRESS };
      console.log(`[GHOST] TEE attestation VERIFIED · chatID: ${chatID}`);
    } catch (e) {
      attestation = { verified: false, error: e.message, chatID };
      console.warn(`[GHOST] TEE attestation warning: ${e.message}`);
    }

    inferenceResult = raw.choices?.[0]?.message?.content || '';
    console.log(`[GHOST] Inference complete · ${inferenceResult.length} chars`);

  } catch (err) {
    console.error(`[GHOST] Inference error: ${err.message}`);
    inferenceResult = `[CYCLE ${cycleNumber} INFERENCE ERROR: ${err.message}]`;
    attestation = { verified: false, error: err.message };
  }

  // STEP 2: Build the full memory record
  const record = {
    agent: 'ghost-v1.0',
    cycle: cycleNumber,
    timestamp,
    wallet: wallet.address,
    provider: PROVIDER_ADDRESS,
    model: 'deepseek-v3',
    task: AGENT_TASK,
    output: inferenceResult,
    attestation,
    human_authorized: false,
    admin_key: null,
  };

  console.log(`[GHOST] Memory record built · ${JSON.stringify(record).length} bytes`);

  // STEP 3: Write to 0G Storage
  let storageHash = null;
  try {
    storageHash = await uploadToStorage(JSON.stringify(record, null, 2));
    console.log(`[GHOST] Written to 0G Storage · hash: ${storageHash}`);
  } catch (err) {
    console.error(`[GHOST] Storage error: ${err.message}`);
    storageHash = `error:${err.message}`;
  }

  // STEP 4: Anchor hash on 0G Chain
  let chainTx = null;
  if (storageHash && !storageHash.startsWith('error:')) {
    try {
      chainTx = await anchorHash(wallet, storageHash, cycleNumber);
      console.log(`[GHOST] Hash anchored on 0G Chain · tx: ${chainTx}`);
    } catch (err) {
      console.error(`[GHOST] Chain anchor error: ${err.message}`);
      chainTx = `error:${err.message}`;
    }
  }

  // STEP 5: Log the full cycle receipt
  const receipt = {
    cycle: cycleNumber,
    timestamp,
    inference: {
      model: record.model,
      output_length: inferenceResult.length,
      attestation,
    },
    storage: { hash: storageHash },
    chain: { tx: chainTx },
    human_authorized: false,
  };

  console.log(`\n[GHOST] Cycle #${cycleNumber} complete:`);
  console.log(JSON.stringify(receipt, null, 2));
  console.log(`[GHOST] ─── Sleeping until next cycle ───\n`);

  return receipt;
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`
  ██████  ██   ██  ██████  ███████ ████████
 ██       ██   ██ ██    ██ ██         ██
 ██   ███ ███████ ██    ██ ███████    ██
 ██    ██ ██   ██ ██    ██      ██    ██
  ██████  ██   ██  ██████  ███████    ██

 Autonomous AI Agent · Built on 0G
 TEE Compute · Decentralized Storage · Ownerless Contract
 ─────────────────────────────────────────────────────────
  `);

  const { wallet, provider } = await setupWallet();

  // Init 0G broker
  const broker = await createBroker(wallet, {
    contractAddress: '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9',
  });

  console.log(`[GHOST] 0G Compute broker initialized`);
  console.log(`[GHOST] Cycle interval: ${CYCLE_INTERVAL_MS / 1000}s`);
  console.log(`[GHOST] Starting autonomous loop...`);

  let cycleNumber = 1;

  // Run immediately on start
  await runCycle(broker, wallet, cycleNumber);
  cycleNumber++;

  // Then run on interval
  setInterval(async () => {
    await runCycle(broker, wallet, cycleNumber);
    cycleNumber++;
  }, CYCLE_INTERVAL_MS);
}

main().catch((err) => {
  console.error(`[GHOST] Fatal error: ${err.message}`);
  process.exit(1);
});
