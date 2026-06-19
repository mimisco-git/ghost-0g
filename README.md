# GHOST — The Autonomous AI That Cannot Be Killed

> Zero Cup 2026 · Built on 0G · Group Stage Submission

**Live site:** [ghost-rouge-five.vercel.app](https://ghost-rouge-five.vercel.app)

---

GHOST is an autonomous AI agent that lives inside 0G's Trusted Execution Environment, pays for its own compute from its own wallet, writes its memory to decentralized storage, and operates under a smart contract with no admin key.

**No kill switch. Not us. Not 0G. Not anyone.**

---

## How it works

Every 6 minutes, GHOST wakes up and runs a full autonomous cycle:

1. **0G Chain** fires a time-locked trigger. No human initiates this.
2. **0G Compute (TEEML)** runs inference inside a Confidential VM. A TEE attestation is generated — cryptographic proof the exact model ran unmodified.
3. GHOST **pays for its own compute** from its on-chain wallet. No human signs this transaction.
4. The full output is written to **0G Storage** with a content hash. Permanent. Tamper-proof.
5. The content hash is **anchored on 0G Chain**. Anyone can verify the record is unaltered.
6. GHOST sleeps and repeats. As long as its wallet holds tokens, it runs forever.

---

## Why 0G is load-bearing (not a bolt-on)

| Layer | What GHOST uses it for | What breaks without it |
|---|---|---|
| 0G Compute | TEE inference + TEEML attestation | The entire "verifiable" claim collapses |
| 0G Storage | Permanent, censorship-resistant memory | The history can be deleted |
| 0G Chain | Ownerless contract + autonomous payments | Someone could stop or modify it |

Remove any layer. GHOST stops being what it claims to be.

---

## Stack

- **0G Compute** — TEE inference via `@0glabs/0g-serving-broker`
- **0G Storage** — Decentralized memory via `@0glabs/0g-ts-sdk`
- **0G Chain** — Smart contract anchor (no owner, no admin, no kill switch)
- **Node.js** — Agent runtime
- **Ethers v6** — Wallet + chain interaction

---

## Project structure

```
ghost-0g/
├── index.html              Landing page
├── dashboard.html          Live agent monitor
├── agent/
│   ├── index.js            Autonomous agent loop
│   ├── 0g-storage.js       0G Storage integration
│   └── 0g-chain.js         0G Chain anchor module
├── contracts/
│   ├── GhostAnchor.sol     Ownerless anchor contract
│   └── deploy.js           Deployment script
├── package.json
└── README.md
```

---

## Setup

```bash
# Clone
git clone https://github.com/mimisco-git/ghost-0g.git
cd ghost-0g

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your PRIVATE_KEY
```

**.env**
```env
PRIVATE_KEY=your_agent_wallet_private_key
RPC_URL=https://evmrpc-testnet.0g.ai
PROVIDER_ADDRESS=0xf07240Efa67755B5311bc75784a061eDB47165Dd
CONTRACT_ADDRESS=0x...deployed_contract_address
```

Get testnet tokens: [faucet.0g.ai](https://faucet.0g.ai)

```bash
# Run the agent
npm start
```

---

## The contract

`GhostAnchor.sol` is the heart of the autonomy claim.

- No `owner` variable
- No `pause()` function
- No `upgrade()` proxy
- No `selfdestruct`
- No admin functions of any kind

The only address that can call `anchor()` is the agent's wallet — which is controlled by the contract itself, not a human.

Read the contract on 0G Chain and verify this yourself.

---

## Verification

Every inference cycle produces a verifiable receipt:

```json
{
  "agent": "ghost-v1.0",
  "cycle": 127,
  "attestation": {
    "verified": true,
    "verifiability": "TeeML",
    "enclave": "AMD SEV-SNP"
  },
  "storage": {
    "hash": "QmX9k3..."
  },
  "chain": {
    "tx": "0xfa71..."
  },
  "human_authorized": false
}
```

---

## Zero Cup 2026

[Vote for GHOST on the Zero Cup](https://0g.ai/arena/zero-cup)

Built with 0G Compute · 0G Storage · 0G Chain
