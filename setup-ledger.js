require('dotenv').config();
const { ethers } = require('ethers');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');

async function setup() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const bal      = await provider.getBalance(wallet.address);

  console.log('Wallet:', wallet.address);
  console.log('Balance:', ethers.formatEther(bal), '0G');

  if (parseFloat(ethers.formatEther(bal)) < 0.1) {
    console.error('Need at least 0.1 0G. Get tokens at faucet.0g.ai');
    return;
  }

  const broker = await createZGComputeNetworkBroker(wallet);

  console.log('Creating ledger with 0.1 OG...');
  await broker.ledger.addLedger(0.1);
  console.log('Ledger created.');

  const providerAddr = '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3';
  console.log('Acknowledging provider...');
  await broker.inference.acknowledgeProviderSigner(providerAddr);
  console.log('Done. Ledger funded and provider acknowledged.');
  console.log('You can now run: node agent/index.js');
}

setup().catch(err => console.error('Error:', err.message));
