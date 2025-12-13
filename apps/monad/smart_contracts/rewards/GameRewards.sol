// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GameRewards
 * @notice Manages milestone-based rewards for game achievements.
 * @dev Users can claim native token rewards when they complete game milestones.
 */
contract GameRewards {
    // Contract owner who can fund and manage the contract
    address public owner;

    // Admin who can verify milestone claims
    address public admin;

    // Total pool available for rewards (in wei)
    uint256 public totalPool;

    // Total amount claimed by users (in wei)
    uint256 public totalClaimed;

    // Whether contract is initialized
    bool public initialized;

    // Track claimed milestones: user address + milestoneId -> claimed amount
    mapping(bytes32 => uint256) private claims;

    // Events
    event PoolFunded(address indexed funder, uint256 amount);
    event RewardClaimed(
        address indexed recipient,
        bytes32 indexed milestoneId,
        uint256 amount
    );
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    /**
     * @notice Initialize the contract with owner and admin
     * @param _owner The contract owner address
     * @param _admin The admin address who can approve claims
     */
    constructor(address _owner, address _admin) {
        require(_owner != address(0), "Invalid owner");
        require(_admin != address(0), "Invalid admin");

        owner = _owner;
        admin = _admin;
        totalPool = 0;
        totalClaimed = 0;
        initialized = true;
    }

    /**
     * @notice Fund the rewards pool
     * @dev Must send native tokens with this call
     */
    function fundPool() external payable {
        require(initialized, "Not initialized");
        require(msg.value > 0, "Amount must be greater than 0");

        totalPool += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    /**
     * @notice Claim a milestone reward
     * @dev Can only be called by admin after verifying milestone completion
     * @param recipient The address to receive the reward
     * @param milestoneId The unique identifier for the milestone
     * @param rewardAmount The amount of reward to claim (in wei)
     */
    function claimReward(
        address recipient,
        bytes32 milestoneId,
        uint256 rewardAmount
    ) external {
        require(initialized, "Not initialized");
        require(msg.sender == admin, "Only admin can approve claims");
        require(rewardAmount > 0, "Invalid reward amount");
        require(recipient != address(0), "Invalid recipient");

        // Create unique key for this user + milestone
        bytes32 claimKey = keccak256(abi.encodePacked(recipient, milestoneId));

        // Check if already claimed
        require(claims[claimKey] == 0, "Reward already claimed");

        // Verify pool has enough balance
        require(
            totalPool >= totalClaimed + rewardAmount,
            "Insufficient pool balance"
        );

        // Record the claim
        claims[claimKey] = rewardAmount;
        totalClaimed += rewardAmount;

        // Send reward to recipient
        (bool success, ) = recipient.call{value: rewardAmount}("");
        require(success, "Transfer failed");

        emit RewardClaimed(recipient, milestoneId, rewardAmount);
    }

    /**
     * @notice Check if a milestone has been claimed
     * @param user The user address
     * @param milestoneId The milestone identifier
     * @return Whether the milestone has been claimed
     */
    function isClaimed(
        address user,
        bytes32 milestoneId
    ) external view returns (bool) {
        bytes32 claimKey = keccak256(abi.encodePacked(user, milestoneId));
        return claims[claimKey] > 0;
    }

    /**
     * @notice Get claimed amount for a specific milestone
     * @param user The user address
     * @param milestoneId The milestone identifier
     * @return The claimed amount (0 if not claimed)
     */
    function getClaimedAmount(
        address user,
        bytes32 milestoneId
    ) external view returns (uint256) {
        bytes32 claimKey = keccak256(abi.encodePacked(user, milestoneId));
        return claims[claimKey];
    }

    /**
     * @notice Get total pool balance
     * @return The total pool balance
     */
    function getTotalPool() external view returns (uint256) {
        return totalPool;
    }

    /**
     * @notice Get total claimed amount
     * @return The total claimed amount
     */
    function getTotalClaimed() external view returns (uint256) {
        return totalClaimed;
    }

    /**
     * @notice Get available pool balance
     * @return The available balance (totalPool - totalClaimed)
     */
    function getAvailableBalance() external view returns (uint256) {
        return totalPool - totalClaimed;
    }

    /**
     * @notice Update admin (owner only)
     * @param newAdmin The new admin address
     */
    function updateAdmin(address newAdmin) external {
        require(initialized, "Not initialized");
        require(msg.sender == owner, "Only owner can update admin");
        require(newAdmin != address(0), "Invalid admin address");

        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @dev Allows owner to recover funds if needed
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external {
        require(initialized, "Not initialized");
        require(msg.sender == owner, "Only owner can withdraw");
        require(
            totalPool >= totalClaimed + amount,
            "Insufficient available balance"
        );

        totalPool -= amount;

        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");

        emit EmergencyWithdraw(owner, amount);
    }

    /**
     * @notice Receive function to accept native tokens
     */
    receive() external payable {
        // Allow direct transfers to fund the pool
        if (initialized) {
            totalPool += msg.value;
            emit PoolFunded(msg.sender, msg.value);
        }
    }
}

