// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StakeGame
 * @notice Manages stake-based competitive gaming where players stake native tokens to play against AI bots
 * @dev Platform takes 10% fee from both human and bot stakes
 * - Win: Player receives full pot (90% player stake + 90% bot stake)
 * - Loss: Bots win, stake returns to pool
 * - Draw: Player gets refund, bot stake returns to pool
 * - Platform fees can be withdrawn by contract owner
 */
contract StakeGame {
    // Contract owner (platform admin)
    address public owner;

    // Game status: 0 = waiting, 1 = active, 2 = finished
    uint256 public gameStatus;

    // Total pool available for bot staking (in wei)
    uint256 public totalPool;

    // Current game's human stake (in wei, after 10% fee)
    uint256 public humanStake;

    // Number of bots in current game
    uint256 public botCount;

    // Current game's total pot (human + bots, after fees)
    uint256 public currentGamePool;

    // Winner: 0 = none, 1 = human, 2 = bots, 3 = draw
    uint256 public winner;

    // Platform fees accumulated (10% of all stakes)
    uint256 public platformFees;

    // Events
    event PoolFunded(address indexed funder, uint256 amount);
    event GameJoined(
        address indexed player,
        uint256 stake,
        uint256 botCount,
        uint256 gamePool
    );
    event GameEnded(
        address indexed player,
        uint256 result,
        uint256 payout
    );
    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);
    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    /**
     * @notice Initialize the contract
     * @dev Sets the deployer as owner
     */
    constructor() {
        owner = msg.sender;
        gameStatus = 0; // waiting
        totalPool = 0;
        humanStake = 0;
        botCount = 0;
        currentGamePool = 0;
        winner = 0;
        platformFees = 0;
    }

    /**
     * @notice Fund the pool with native tokens for bot staking
     * @dev Owner deposits tokens that will be used to match player stakes
     * Must send native tokens with this call
     */
    function fundPool() external payable {
        require(msg.sender == owner, "Only owner can fund");
        require(gameStatus == 0, "Game must be waiting");
        require(msg.value > 0, "Amount must be greater than 0");

        totalPool += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    /**
     * @notice Join a game by staking native tokens
     * @dev Player sends stake + specifies number of bots to play against
     * Must send native tokens with this call
     * @param _stake Amount player is staking (in wei)
     * @param _botCount Number of AI bots to play against
     */
    function joinGame(uint256 _stake, uint256 _botCount) external payable {
        require(gameStatus == 0, "Game already started");
        require(_stake > 0, "Stake must be > 0");
        require(msg.value == _stake, "Payment amount must match stake");
        require(_botCount > 0, "Bot count must be > 0");

        // Calculate required bot stake
        uint256 botStake = _stake * _botCount;
        require(totalPool >= botStake, "Not enough pool funds");

        // Calculate 10% platform fee from human stake
        uint256 humanPlatformFee = (_stake * 10) / 100;
        uint256 humanNetStake = _stake - humanPlatformFee;

        // Calculate 10% platform fee from bot stake
        uint256 botPlatformFee = (botStake * 10) / 100;
        uint256 botNetStake = botStake - botPlatformFee;

        // Deduct bot stake from pool
        totalPool -= botStake;

        // Accumulate platform fees
        platformFees += humanPlatformFee + botPlatformFee;

        // Track game state (only net stakes go into game pool)
        humanStake = humanNetStake;
        botCount = _botCount;
        currentGamePool = humanNetStake + botNetStake;
        gameStatus = 1; // active
        winner = 0;

        emit GameJoined(msg.sender, _stake, _botCount, currentGamePool);
    }

    /**
     * @notice End the game with a result
     * @dev Processes payouts based on who won and automatically resets for next game
     * @param _humanWon Result: 0=bots win, 1=human wins, 2=draw
     */
    function endGame(uint256 _humanWon) external {
        require(gameStatus == 1, "No active game");
        require(
            _humanWon == 0 || _humanWon == 1 || _humanWon == 2,
            "Invalid winner flag: 0=bots, 1=human, 2=draw"
        );

        uint256 payout = 0;

        if (_humanWon == 1) {
            // Human wins: send entire pot to human
            payout = currentGamePool;
            (bool success, ) = msg.sender.call{value: payout}("");
            require(success, "Transfer failed");
            winner = 1;
        } else if (_humanWon == 0) {
            // Bots win: return pot to pool
            totalPool += currentGamePool;
            winner = 2;
        } else {
            // Draw: refund human stake, return bot stake to pool
            payout = humanStake;
            (bool success, ) = msg.sender.call{value: payout}("");
            require(success, "Transfer failed");

            // Add bot stake back to pool
            uint256 botStake = currentGamePool - humanStake;
            totalPool += botStake;
            winner = 3; // draw
        }

        emit GameEnded(msg.sender, _humanWon, payout);

        // Auto-reset: Game is immediately ready for next player
        gameStatus = 0; // Reset to waiting
        humanStake = 0;
        botCount = 0;
        currentGamePool = 0;
        // Note: winner is preserved so it can be queried after game ends
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @dev Allows owner to withdraw pool funds if needed
     */
    function emergencyWithdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(
            gameStatus == 0 || gameStatus == 2,
            "Cannot withdraw during active game"
        );

        uint256 withdrawAmount = totalPool;
        if (withdrawAmount > 0) {
            totalPool = 0;
            (bool success, ) = owner.call{value: withdrawAmount}("");
            require(success, "Transfer failed");
            emit EmergencyWithdraw(owner, withdrawAmount);
        }
    }

    /**
     * @notice Get total pool balance
     * @return The total pool balance
     */
    function getTotalPool() external view returns (uint256) {
        return totalPool;
    }

    /**
     * @notice Get current game status
     * @return The game status (0=waiting, 1=active, 2=finished)
     */
    function getGameStatus() external view returns (uint256) {
        return gameStatus;
    }

    /**
     * @notice Get winner of last game
     * @return The winner (0=none, 1=human, 2=bots, 3=draw)
     */
    function getWinner() external view returns (uint256) {
        return winner;
    }

    /**
     * @notice Get accumulated platform fees
     * @return The platform fees
     */
    function getPlatformFees() external view returns (uint256) {
        return platformFees;
    }

    /**
     * @notice Withdraw platform fees (owner only)
     * @dev Allows owner to withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external {
        require(msg.sender == owner, "Only owner can withdraw fees");

        uint256 feeAmount = platformFees;
        require(feeAmount > 0, "No fees to withdraw");

        platformFees = 0;
        (bool success, ) = owner.call{value: feeAmount}("");
        require(success, "Transfer failed");
        emit PlatformFeesWithdrawn(owner, feeAmount);
    }

    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer ownership");
        require(newOwner != address(0), "Invalid new owner");

        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Receive function to accept native tokens
     */
    receive() external payable {
        // Allow direct transfers to fund the pool (only if waiting)
        if (msg.sender == owner && gameStatus == 0) {
            totalPool += msg.value;
            emit PoolFunded(msg.sender, msg.value);
        }
    }
}

