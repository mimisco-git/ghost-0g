require('dotenv').config();
const { ethers } = require('ethers');

const RPC_URL     = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

async function uploadToStorage(content, label = 'ghost-cycle') {
  try {
    const { Indexer, MemData } = require('@0gfoundation/0g-storage-ts-sdk');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const indexer  = new Indexer(INDEXER_RPC);

    const data = new MemData(new TextEncoder().encode(content));
    const [result, err] = await indexer.upload(data, RPC_URL, signer);

    if (err) throw new Error(`Upload error: ${err}`);

    // Extract root hash from result object
    const rootHash = typeof result === 'string'
      ? result
      : result?.root || result?.rootHash || result?.hash || JSON.stringify(result);

    console.log(`[0G-STORAGE] ${label} uploaded.`);
    console.log(`[0G-STORAGE] Root hash: ${rootHash}`);
    console.log(`[0G-STORAGE] Verify: https://storagescan.0g.ai/tx?hash=${rootHash}`);
    return rootHash;
  } catch (e) {
    console.error(`[0G-STORAGE] Error: ${e.message}`);
    return null;
  }
}

async function test() {
  console.log('Testing 0G Storage...');
  const payload = JSON.stringify({
    agent:     'ghost-v1.0',
    test:      true,
    timestamp: new Date().toISOString(),
    message:   'GHOST autonomous agent - first 0G Storage write',
  });
  const hash = await uploadToStorage(payload, 'ghost-test');
  if (hash) {
    console.log('\nSUCCESS. 0G Storage is working.');
    console.log(`Verify at: https://storagescan.0g.ai/tx?hash=${hash}`);
  }
}

test();
module.exports = { uploadToStorage };
