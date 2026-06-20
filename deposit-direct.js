require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const bal      = await provider.getBalance(wallet.address);

  console.log('Wallet:', wallet.address);
  console.log('Balance:', ethers.formatEther(bal), '0G');

  const CONTRACT = '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9';
  const AMOUNT   = ethers.parseEther('0.5');

  const iface = new ethers.Interface(['function depositFund() payable']);
  const data  = iface.encodeFunctionData('depositFund', []);

  console.log('Depositing 0.5 0G to billing contract...');

  const tx = await wallet.sendTransaction({
    to:       CONTRACT,
    value:    AMOUNT,
    data:     data,
    gasLimit: 200000n,
  });

  console.log('TX sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed at block:', receipt.blockNumber);
  console.log('Done. Now run: node agent/index.js');
}

main().catch(err => console.error('Error:', err.message));
