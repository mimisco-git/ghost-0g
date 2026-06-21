const { ethers } = require('ethers');

const CONTRACT_ABI = [
  "function anchor(bytes32 contentHash, uint256 cycleNumber) external",
  "function totalCycles() external view returns (uint256)"
];

const TASK = `You are GHOST, an autonomous AI agent on 0G. Produce a concise intelligence report (max 150 words) on one meaningful development in decentralized AI or autonomous agents. End with a one-line GHOST VERDICT.`;

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  const onChainCycles = await contract.totalCycles();
  const cycleNumber = Number(onChainCycles) + 1;
  console.log(`Running cycle #${cycleNumber}`);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [{ role: 'user', content: TASK }],
      max_tokens: 250,
    }),
  });

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content || '';
  console.log('Output preview:', output.slice(0, 120));

  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(output + new Date().toISOString()));
  const tx = await contract.anchor(contentHash, cycleNumber, { gasLimit: 200000n });
  const receipt = await tx.wait();
  console.log(`Anchored cycle #${cycleNumber} at block ${receipt.blockNumber}`);
  console.log(`TX: ${tx.hash}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
