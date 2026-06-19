const { ZgFile, Indexer } = require('@0glabs/0g-ts-sdk');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const os = require('os');

const INDEXER_RPC = process.env.INDEXER_RPC || 'https://indexer-storage-testnet-standard.0g.ai';
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

/**
 * Upload a string payload to 0G Storage
 * Returns the content hash (root hash) of the stored file
 */
async function uploadToStorage(content) {
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY not set');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Write content to a temp file
  const tmpPath = path.join(os.tmpdir(), `ghost-${Date.now()}.json`);
  fs.writeFileSync(tmpPath, content, 'utf8');

  try {
    // Create ZgFile from temp file
    const zgFile = await ZgFile.fromFilePath(tmpPath);
    const [tree, treeErr] = await zgFile.merkleTree();

    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const rootHash = tree.rootHash();
    console.log(`[0G-STORAGE] Content hash (root): ${rootHash}`);

    // Upload via indexer
    const indexer = new Indexer(INDEXER_RPC);
    const [uploadTx, uploadErr] = await indexer.upload(zgFile, 0, wallet);

    if (uploadErr) {
      // If already uploaded (same hash), that is fine
      if (uploadErr.toString().includes('already')) {
        console.log(`[0G-STORAGE] Content already exists on network · hash: ${rootHash}`);
        return rootHash;
      }
      throw new Error(`Upload error: ${uploadErr}`);
    }

    console.log(`[0G-STORAGE] Uploaded · tx: ${uploadTx} · hash: ${rootHash}`);
    return rootHash;

  } finally {
    // Clean up temp file
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

/**
 * Download content from 0G Storage by root hash
 */
async function downloadFromStorage(rootHash, outputPath) {
  const indexer = new Indexer(INDEXER_RPC);
  const [, downloadErr] = await indexer.download(rootHash, outputPath, false);

  if (downloadErr) throw new Error(`Download error: ${downloadErr}`);
  console.log(`[0G-STORAGE] Downloaded · hash: ${rootHash} · path: ${outputPath}`);
  return outputPath;
}

module.exports = { uploadToStorage, downloadFromStorage };
