// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GhostAnchor
 * @notice Immutable on-chain record of GHOST agent inference cycles.
 * NO owner. NO admin key. NO pause. NO upgrade. Ever.
 */
contract GhostAnchor {
    struct CycleRecord {
        bytes32 contentHash;
        uint256 timestamp;
        uint256 blockNumber;
        address agent;
    }

    mapping(uint256 => CycleRecord) public records;
    uint256 public totalCycles;
    address public immutable agentWallet;
    uint256 public immutable deployedAt;

    event HashAnchored(uint256 indexed cycle, bytes32 indexed contentHash, uint256 timestamp, address agent);

    constructor(address _agentWallet) {
        agentWallet = _agentWallet;
        deployedAt  = block.timestamp;
        totalCycles = 0;
    }

    function anchor(bytes32 contentHash, uint256 cycleNumber) external {
        require(msg.sender == agentWallet, "Only the agent can anchor records");
        require(records[cycleNumber].timestamp == 0, "Cycle already anchored");
        require(contentHash != bytes32(0), "Content hash cannot be empty");

        records[cycleNumber] = CycleRecord({
            contentHash: contentHash,
            timestamp:   block.timestamp,
            blockNumber: block.number,
            agent:       msg.sender
        });

        totalCycles++;
        emit HashAnchored(cycleNumber, contentHash, block.timestamp, msg.sender);
    }

    function getRecord(uint256 cycleNumber) external view returns (bytes32, uint256, uint256, address) {
        CycleRecord memory r = records[cycleNumber];
        return (r.contentHash, r.timestamp, r.blockNumber, r.agent);
    }

    function verify(uint256 cycleNumber, bytes32 contentHash) external view returns (bool, uint256) {
        CycleRecord memory r = records[cycleNumber];
        return (r.contentHash == contentHash, r.timestamp);
    }

    function metadata() external view returns (address, uint256, uint256, bool, bool, bool) {
        return (agentWallet, deployedAt, totalCycles, false, false, false);
    }
}
