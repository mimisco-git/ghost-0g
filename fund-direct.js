require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  const rpc      = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, rpc);
  const bal      = await rpc.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(bal), '0G');

  // 0G Compute billing contract - transferFund to provider
  const CONTRACT  = '0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9';
  const PROVIDER  = '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3';
  const AMOUNT    = ethers.parseEther('0.1');

  const iface = new ethers.Interface([
    'function transferFund(address provider, string serviceType, uint256 amount) external'
  ]);

  const data = iface.encodeFunctionData('transferFund', [
    PROVIDER,
    'inference',
    AMOUNT
  ]);

  console.log('Transferring 0.1 0G to provider sub-account...');
  const tx = await wallet.sendTransaction({
    to: CONTRACT,
    data,
    gasLimit: 300000n,
  });

  console.log('TX:', tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed at block:', receipt.blockNumber);
  console.log('Done. Now run: node agent/index.js');
}

main().catch(err => console.error('Error:', err.message));
