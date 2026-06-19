// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GhostAnchor
 * @notice Immutable record of GHOST agent inference cycles on 0G Chain.
 *
 * DESIGN INTENT:
 * This contract has NO owner, NO admin key, NO pause function, NO upgrade path.
 * Once deployed, it runs forever. No human can modify, stop, or censor it.
 * This is intentional. GHOST is autonomous. The contract reflects that.
 *
 * Anyone can verify any cycle's content hash against 0G Storage.
 * Proof of autonomous execution. No trust required.
 */
contract GhostAnchor {

    // ─── STRUCTS ─────────────────────────────────────────────────────────────

    struct CycleRecord {
        bytes32 contentHash;    // Root hash of the 0G Storage record
        uint256 timestamp;      // Block timestamp when anchored
        uint256 blockNumber;    // Block number for additional verification
        address agent;          // Agent wallet that submitted this cycle
    }

    // ─── STATE ───────────────────────────────────────────────────────────────

    mapping(uint256 => CycleRecord) public records;
    uint256 public totalCycles;
    address public immutable agentWallet;   // Set once at deployment, never changes
    uint256 public immutable deployedAt;

    // ─── EVENTS ──────────────────────────────────────────────────────────────

    event HashAnchored(
        uint256 indexed cycle,
        bytes32 indexed contentHash,
        uint256 timestamp,
        address agent
    );

    // ─── CONSTRUCTOR ─────────────────────────────────────────────────────────

    /**
     * @param _agentWallet The autonomous agent's wallet address.
     *        Only this address can anchor records (the agent pays for itself).
     *        No owner. No admin. Just the agent.
     */
    constructor(address _agentWallet) {
        agentWallet = _agentWallet;
        deployedAt = block.timestamp;
        totalCycles = 0;
    }

    // ─── FUNCTIONS ───────────────────────────────────────────────────────────

    /**
     * @notice Anchor a cycle's content hash on-chain.
     *         Called autonomously by the agent — no human initiates this.
     * @param contentHash  keccak256 of the 0G Storage root hash for this cycle
     * @param cycleNumber  The sequential cycle number
     */
    function anchor(bytes32 contentHash, uint256 cycleNumber) external {
        require(msg.sender == agentWallet, "Only the agent can anchor records");
        require(records[cycleNumber].timestamp == 0, "Cycle already anchored");
        require(contentHash != bytes32(0), "Content hash cannot be empty");

        records[cycleNumber] = CycleRecord({
            contentHash: contentHash,
            timestamp: block.timestamp,
            blockNumber: block.number,
            agent: msg.sender
        });

        totalCycles++;

        emit HashAnchored(cycleNumber, contentHash, block.timestamp, msg.sender);
    }

    /**
     * @notice Retrieve a cycle record for verification.
     */
    function getRecord(uint256 cycleNumber)
        external
        view
        returns (
            bytes32 contentHash,
            uint256 timestamp,
            uint256 blockNumber,
            address agent
        )
    {
        CycleRecord memory r = records[cycleNumber];
        return (r.contentHash, r.timestamp, r.blockNumber, r.agent);
    }

    /**
     * @notice Verify a content hash matches a stored cycle.
     *         Anyone can call this. No trust required.
     */
    function verify(uint256 cycleNumber, bytes32 contentHash)
        external
        view
        returns (bool isValid, uint256 anchoredAt)
    {
        CycleRecord memory r = records[cycleNumber];
        return (r.contentHash == contentHash, r.timestamp);
    }

    /**
     * @notice Get contract metadata for verification.
     *         Proves: no owner, immutable agent, known deploy time.
     */
    function metadata()
        external
        view
        returns (
            address agent,
            uint256 deployed,
            uint256 cycles,
            bool hasOwner,
            bool canPause,
            bool canUpgrade
        )
    {
        return (
            agentWallet,
            deployedAt,
            totalCycles,
            false,   // NO OWNER
            false,   // CANNOT PAUSE
            false    // CANNOT UPGRADE
        );
    }

    // ─── NO FALLBACK ─────────────────────────────────────────────────────────
    // No receive(), no fallback(). This contract does one thing: anchor hashes.
    // It cannot receive ETH. It cannot be drained. It has no treasury functions.
}
