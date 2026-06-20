require('dotenv').config();
const { ethers } = require('ethers');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const broker   = await createZGComputeNetworkBroker(wallet);

  const PROVIDER = '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3';

  console.log('Transferring 0.1 0G to provider...');
  await broker.ledger.transferFund(PROVIDER, 'inference', 0.1);
  console.log('Provider funded.');

  console.log('Acknowledging provider...');
  await broker.inference.acknowledgeProviderSigner(PROVIDER);
  console.log('All done. Run: node agent/index.js');
}

main().catch(err => console.error('Error:', err.message));
