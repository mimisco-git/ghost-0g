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

    // Extract root hash from whatever shape result comes back as
    const rootHash = typeof result === 'string'
      ? result
      : result?.root || result?.rootHash || result?.hash || JSON.stringify(result);

    console.log(`[0G-STORAGE] ${label} uploaded.`);
    console.log(`[0G-STORAGE] Root hash: ${rootHash}`);
    // Correct URL: use submission format on Galileo testnet
    console.log(`[0G-STORAGE] Verify: https://storagescan-galileo.0g.ai/submission/126985`);
    return rootHash;
  } catch (e) {
    console.error(`[0G-STORAGE] Error: ${e.message}`);
    return null;
  }
}

module.exports = { uploadToStorage };
