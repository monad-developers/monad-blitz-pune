/**
 * . CrackPayCore (Main Hub) 
Think of it as: The Reception Desk
What it does:

Entry point for everything
Registers users with username & avatar
Coordinates all other contracts
Provides dashboard views (your balance, groups, contacts)
Has convenient "quick settle" and "direct send" functions

Key Functions:
solidityregisterUser("Alice", "ipfs://avatar")  // Sign up
getUserDashboard(address)                // See all your data
quickSettle(expenseId)                   // One-click pay
 */



// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ContactBook.sol";
import "./GroupManager.sol";
import "./PaymentProcessor.sol";
import "./RequestManager.sol";
import "./libraries/DataTypes.sol";

/// @title CrackPayCore
/// @notice Main entry point for Crack Pay - coordinates all modules
/// @author Crack Pay Team
contract CrackPayCore {
    
    ContactBook public immutable contactBook;
    GroupManager public immutable groupManager;
    PaymentProcessor public immutable paymentProcessor;
    RequestManager public immutable requestManager;
    
    address public owner;
    bool public paused;
    
    // Platform stats
    uint256 public totalUsers;
    uint256 public totalGroups;
    uint256 public totalExpenses;
    uint256 public totalVolume;
    
    mapping(address => bool) public hasRegistered;
    mapping(address => UserProfile) public userProfiles;
    
    struct UserProfile {
        address userAddress;
        string username;
        string avatarURI;
        uint256 registeredAt;
        uint256 totalExpensesPaid;
        uint256 totalExpensesReceived;
    }
    
    event UserRegistered(address indexed user, string username);
    event PlatformPaused(address indexed by);
    event PlatformUnpaused(address indexed by);
    
    error AlreadyRegistered();
    error NotRegistered();
    error OnlyOwner();
    
    modifier whenNotPaused() {
        require(!paused, "Platform is paused");
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Deploy all modules
        contactBook = new ContactBook();
        groupManager = new GroupManager();
        paymentProcessor = new PaymentProcessor(address(groupManager));
        requestManager = new RequestManager(address(groupManager), address(paymentProcessor));
        
        // Set PaymentProcessor address in GroupManager
        groupManager.setPaymentProcessor(address(paymentProcessor));
    }
    
    /// @notice Register user on platform
    /// @param username Username for the user
    /// @param avatarURI URI for user avatar
    function registerUser(string calldata username, string calldata avatarURI) external whenNotPaused {
        if (hasRegistered[msg.sender]) revert AlreadyRegistered();
        
        userProfiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            username: username,
            avatarURI: avatarURI,
            registeredAt: block.timestamp,
            totalExpensesPaid: 0,
            totalExpensesReceived: 0
        });
        
        hasRegistered[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender, username);
    }
    
    /// @notice Update user profile
    /// @param username New username
    /// @param avatarURI New avatar URI
    function updateProfile(string calldata username, string calldata avatarURI) external whenNotPaused {
        if (!hasRegistered[msg.sender]) revert NotRegistered();
        
        userProfiles[msg.sender].username = username;
        userProfiles[msg.sender].avatarURI = avatarURI;
    }
    
    /// @notice Get comprehensive user dashboard data
    /// @param user User address
    /// @return profile User profile
    /// @return contacts User's contacts
    /// @return groups Groups user belongs to
    /// @return stats Payment statistics
    function getUserDashboard(address user) external view returns (
        UserProfile memory profile,
        address[] memory contacts,
        uint256[] memory groups,
        PaymentStats memory stats
    ) {
        profile = userProfiles[user];
        contacts = contactBook.getUserContacts(user);
        groups = groupManager.getUserGroups(user);
        
        (uint256 totalPaid, uint256 totalReceived, int256 netBalance) = paymentProcessor.getUserStats(user);
        
        stats = PaymentStats({
            totalPaid: totalPaid,
            totalReceived: totalReceived,
            netBalance: netBalance,
            activeGroups: groups.length,
            totalContacts: contacts.length
        });
    }
    
    struct PaymentStats {
        uint256 totalPaid;
        uint256 totalReceived;
        int256 netBalance;
        uint256 activeGroups;
        uint256 totalContacts;
    }
    
    /// @notice Get user's pending payment requests
    /// @param user User address
    /// @return incoming Incoming pending requests
    /// @return outgoing Outgoing pending requests
    function getUserPendingRequests(address user) external view returns (
        uint256[] memory incoming,
        uint256[] memory outgoing
    ) {
        incoming = requestManager.getPendingIncomingRequests(user);
        outgoing = requestManager.getOutgoingRequests(user);
    }
    
    /// @notice Get detailed expense information with all members
    /// @param expenseId Expense ID
    /// @return expense Expense details
    /// @return members Array of member data
    /// @return transactions Transaction IDs
    /// @return requests Request IDs
    function getExpenseDetails(uint256 expenseId) external view returns (
        GroupManager.ExpenseData memory expense,
        DataTypes.Member[] memory members,
        uint256[] memory transactions,
        uint256[] memory requests
    ) {
        expense = groupManager.getExpense(expenseId);
        
        members = new DataTypes.Member[](expense.memberList.length);
        for (uint256 i = 0; i < expense.memberList.length; i++) {
            members[i] = groupManager.getExpenseMember(expenseId, expense.memberList[i]);
        }
        
        transactions = paymentProcessor.getExpenseTransactions(expenseId);
        requests = requestManager.getExpenseRequests(expenseId);
    }
    
    /// @notice Get group overview with expenses and members
    /// @param groupId Group ID
    /// @return group Group details
    /// @return expenses Array of expense IDs
    /// @return totalOwed Total amount owed in group for caller
    /// @return totalToReceive Total amount to receive in group for caller
    function getGroupOverview(uint256 groupId) external view returns (
        GroupManager.GroupData memory group,
        uint256[] memory expenses,
        uint256 totalOwed,
        uint256 totalToReceive
    ) {
        group = groupManager.getGroup(groupId);
        expenses = groupManager.getGroupExpenses(groupId);
        
        // Calculate totals for caller
        for (uint256 i = 0; i < expenses.length; i++) {
            GroupManager.ExpenseData memory expense = groupManager.getExpense(expenses[i]);
            DataTypes.Member memory member = groupManager.getExpenseMember(expenses[i], msg.sender);
            
            if (member.isActive && !member.hasPaid) {
                totalOwed += (member.amountOwed - member.amountPaid);
            }
            
            if (expense.paidBy == msg.sender) {
                // Calculate how much caller is owed
                for (uint256 j = 0; j < expense.memberList.length; j++) {
                    address memberAddr = expense.memberList[j];
                    if (memberAddr != msg.sender) {
                        DataTypes.Member memory otherMember = groupManager.getExpenseMember(
                            expenses[i],
                            memberAddr
                        );
                        if (!otherMember.hasPaid) {
                            totalToReceive += (otherMember.amountOwed - otherMember.amountPaid);
                        }
                    }
                }
            }
        }
    }
    
    /// @notice Platform admin: Pause platform
    function pause() external onlyOwner {
        paused = true;
        emit PlatformPaused(msg.sender);
    }
    
    /// @notice Platform admin: Unpause platform
    function unpause() external onlyOwner {
        paused = false;
        emit PlatformUnpaused(msg.sender);
    }
    
    /// @notice Get platform statistics
    /// @return stats Platform-wide statistics
    function getPlatformStats() external view returns (PlatformStats memory stats) {
        stats = PlatformStats({
            totalUsers: totalUsers,
            totalGroups: totalGroups,
            totalExpenses: totalExpenses,
            totalVolume: totalVolume,
            isPaused: paused
        });
    }
    
    struct PlatformStats {
        uint256 totalUsers;
        uint256 totalGroups;
        uint256 totalExpenses;
        uint256 totalVolume;
        bool isPaused;
    }
    
    /// @notice Quick settle - One-step payment for expense
    /// @param expenseId Expense ID to settle
    function quickSettle(uint256 expenseId) external payable whenNotPaused {
        paymentProcessor.settleExpense{value: msg.value}(expenseId);
        
        // Update platform stats
        totalVolume += msg.value;
    }
    
    /// @notice Direct send - Send crypto to any address
    /// @param recipient Recipient address
    function directSend(address recipient) external payable whenNotPaused {
        paymentProcessor.directPayment{value: msg.value}(recipient);
        
        // Update platform stats
        totalVolume += msg.value;
    }
}