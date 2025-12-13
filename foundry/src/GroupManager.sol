// 3. GroupManager (The Organizer) 👥
// Think of it as: Splitwise's Group Feature
// What it does:

// Creates expense groups ("Friday Dinner", "Roommates", etc.)
// Adds/removes members from groups
// Creates expenses and calculates splits
// Tracks who owes what
// Supports equal splits OR custom amounts

// Key Functions:
// soliditycreateGroup("Weekend Trip", [bob, carol])           // New group
// createExpenseEqualSplit(groupId, 3000, "Hotel")     // Split equally
// createExpenseCustomSplit(groupId, 3000, [...])      // Custom amounts
// getExpense(expenseId)                               // Check details
// ```

// **Example:**
// ```
// 3 friends, ₹3000 bill
// Equal split = ₹1000 each automatically calculated


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./libraries/DataTypes.sol";
import "./libraries/SplitCalculator.sol";

/// @title GroupManager
/// @notice Manages expense groups and expense tracking
contract GroupManager {
    
    uint256 private _groupIdCounter;
    uint256 private _expenseIdCounter;
    address public paymentProcessor;
    
    // groupId => Group data (without mapping fields)
    struct GroupData {
        uint256 groupId;
        string groupName;
        address creator;
        address[] members;
        uint256 createdAt;
        uint256 totalExpenses;
        bool isActive;
    }
    
    mapping(uint256 => GroupData) private groups;
    mapping(uint256 => mapping(address => bool)) private groupMembers;
    
    // User address => Array of group IDs they belong to
    mapping(address => uint256[]) private userGroups;
    
    // expenseId => Expense data (without mapping fields)
    struct ExpenseData {
        uint256 expenseId;
        uint256 groupId;
        address paidBy;
        uint256 totalAmount;
        string description;
        string category;
        uint256 createdAt;
        DataTypes.ExpenseStatus status;
        DataTypes.SplitType splitType;
        address[] memberList;
    }
    
    mapping(uint256 => ExpenseData) private expenses;
    mapping(uint256 => mapping(address => DataTypes.Member)) private expenseMembers;
    
    // groupId => Array of expense IDs
    mapping(uint256 => uint256[]) private groupExpenses;
    
    modifier onlyGroupMember(uint256 groupId) {
        if (!groupMembers[groupId][msg.sender]) revert DataTypes.NotAMember();
        _;
    }
    
    modifier groupExists(uint256 groupId) {
        if (groups[groupId].groupId == 0) revert DataTypes.GroupNotFound();
        _;
    }
    
    modifier expenseExists(uint256 expenseId) {
        if (expenses[expenseId].expenseId == 0) revert DataTypes.ExpenseNotFound();
        _;
    }
    
    /// @notice Initialize PaymentProcessor address
    /// @param _paymentProcessor Address of PaymentProcessor contract
    function setPaymentProcessor(address _paymentProcessor) external {
        paymentProcessor = _paymentProcessor;
    }
    
    /// @notice Create a new expense group
    /// @param groupName Name of the group
    /// @param members Array of member addresses (creator included automatically)
    /// @return groupId ID of created group
    function createGroup(
        string calldata groupName,
        address[] calldata members
    ) external returns (uint256 groupId) {
        groupId = ++_groupIdCounter;
        
        // Initialize group
        GroupData storage group = groups[groupId];
        group.groupId = groupId;
        group.groupName = groupName;
        group.creator = msg.sender;
        group.createdAt = block.timestamp;
        group.isActive = true;
        
        // Add creator as member
        _addMemberToGroup(groupId, msg.sender);
        
        // Add additional members
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] != address(0) && members[i] != msg.sender) {
                _addMemberToGroup(groupId, members[i]);
            }
        }
        
        emit DataTypes.GroupCreated(groupId, msg.sender, groupName);
    }
    
    /// @notice Add member to existing group
    /// @param groupId Group ID
    /// @param member Address to add
    function addMember(
        uint256 groupId,
        address member
    ) external groupExists(groupId) {
        GroupData storage group = groups[groupId];
        if (msg.sender != group.creator) revert DataTypes.Unauthorized();
        if (member == address(0)) revert DataTypes.InvalidAddress();
        if (groupMembers[groupId][member]) revert DataTypes.AlreadyExists();
        
        _addMemberToGroup(groupId, member);
        
        emit DataTypes.MemberAdded(groupId, member);
    }
    
    /// @notice Remove member from group
    /// @param groupId Group ID
    /// @param member Address to remove
    function removeMember(
        uint256 groupId,
        address member
    ) external groupExists(groupId) {
        GroupData storage group = groups[groupId];
        if (msg.sender != group.creator) revert DataTypes.Unauthorized();
        if (member == group.creator) revert DataTypes.Unauthorized();
        if (!groupMembers[groupId][member]) revert DataTypes.NotAMember();
        
        groupMembers[groupId][member] = false;
        
        // Remove from members array
        address[] storage memberList = group.members;
        for (uint256 i = 0; i < memberList.length; i++) {
            if (memberList[i] == member) {
                memberList[i] = memberList[memberList.length - 1];
                memberList.pop();
                break;
            }
        }
        
        emit DataTypes.MemberRemoved(groupId, member);
    }
    
    /// @notice Create expense with equal split
    /// @param groupId Group ID
    /// @param totalAmount Total expense amount
    /// @param description Expense description
    /// @param category Expense category
    /// @return expenseId ID of created expense
    function createExpenseEqualSplit(
        uint256 groupId,
        uint256 totalAmount,
        string calldata description,
        string calldata category
    ) external groupExists(groupId) onlyGroupMember(groupId) returns (uint256 expenseId) {
        if (totalAmount == 0) revert DataTypes.InvalidAmount();
        
        expenseId = ++_expenseIdCounter;
        
        ExpenseData storage expense = expenses[expenseId];
        expense.expenseId = expenseId;
        expense.groupId = groupId;
        expense.paidBy = msg.sender;
        expense.totalAmount = totalAmount;
        expense.description = description;
        expense.category = category;
        expense.createdAt = block.timestamp;
        expense.status = DataTypes.ExpenseStatus.PENDING;
        expense.splitType = DataTypes.SplitType.EQUAL;
        
        GroupData storage group = groups[groupId];
        address[] memory memberList = group.members;
        
        // Calculate equal split
        (uint256 baseAmount, uint256 remainder) = SplitCalculator.calculateEqualSplitWithRemainder(
            totalAmount,
            memberList.length
        );
        
        // Set member amounts
        for (uint256 i = 0; i < memberList.length; i++) {
            address member = memberList[i];
            uint256 amountOwed = baseAmount;
            
            // Distribute remainder to first N members
            if (i < remainder) {
                amountOwed += 1;
            }
            
            // Skip the payer (they already paid)
            if (member == msg.sender) {
                expenseMembers[expenseId][member] = DataTypes.Member({
                    memberAddress: member,
                    amountOwed: amountOwed,
                    amountPaid: amountOwed,
                    hasPaid: true,
                    isActive: true
                });
            } else {
                expenseMembers[expenseId][member] = DataTypes.Member({
                    memberAddress: member,
                    amountOwed: amountOwed,
                    amountPaid: 0,
                    hasPaid: false,
                    isActive: true
                });
            }
            
            expense.memberList.push(member);
            
            emit DataTypes.ExpenseSplit(expenseId, member, amountOwed);
        }
        
        groupExpenses[groupId].push(expenseId);
        groups[groupId].totalExpenses++;
        
        emit DataTypes.ExpenseCreated(
            expenseId,
            groupId,
            msg.sender,
            totalAmount,
            DataTypes.SplitType.EQUAL
        );
    }
    
    /// @notice Create expense with custom split
    /// @param groupId Group ID
    /// @param totalAmount Total expense amount
    /// @param description Expense description
    /// @param category Expense category
    /// @param allocations Custom split allocations
    /// @return expenseId ID of created expense
    function createExpenseCustomSplit(
        uint256 groupId,
        uint256 totalAmount,
        string calldata description,
        string calldata category,
        DataTypes.SplitAllocation[] calldata allocations
    ) external groupExists(groupId) onlyGroupMember(groupId) returns (uint256 expenseId) {
        if (totalAmount == 0) revert DataTypes.InvalidAmount();
        if (!SplitCalculator.validateCustomSplit(allocations, totalAmount)) {
            revert DataTypes.InvalidSplitAllocation();
        }
        
        expenseId = ++_expenseIdCounter;
        
        ExpenseData storage expense = expenses[expenseId];
        expense.expenseId = expenseId;
        expense.groupId = groupId;
        expense.paidBy = msg.sender;
        expense.totalAmount = totalAmount;
        expense.description = description;
        expense.category = category;
        expense.createdAt = block.timestamp;
        expense.status = DataTypes.ExpenseStatus.PENDING;
        expense.splitType = DataTypes.SplitType.CUSTOM;
        
        // Set member amounts from allocations
        for (uint256 i = 0; i < allocations.length; i++) {
            address member = allocations[i].member;
            uint256 amountOwed = allocations[i].amount;
            
            if (!groupMembers[groupId][member]) revert DataTypes.NotAMember();
            
            // Skip the payer (they already paid)
            if (member == msg.sender) {
                expenseMembers[expenseId][member] = DataTypes.Member({
                    memberAddress: member,
                    amountOwed: amountOwed,
                    amountPaid: amountOwed,
                    hasPaid: true,
                    isActive: true
                });
            } else {
                expenseMembers[expenseId][member] = DataTypes.Member({
                    memberAddress: member,
                    amountOwed: amountOwed,
                    amountPaid: 0,
                    hasPaid: false,
                    isActive: true
                });
            }
            
            expense.memberList.push(member);
            
            emit DataTypes.ExpenseSplit(expenseId, member, amountOwed);
        }
        
        groupExpenses[groupId].push(expenseId);
        groups[groupId].totalExpenses++;
        
        emit DataTypes.ExpenseCreated(
            expenseId,
            groupId,
            msg.sender,
            totalAmount,
            DataTypes.SplitType.CUSTOM
        );
    }
    
    /// @notice Get group details
    /// @param groupId Group ID
    /// @return group Group data
    function getGroup(uint256 groupId) external view groupExists(groupId) returns (GroupData memory group) {
        group = groups[groupId];
    }
    
    /// @notice Get expense details
    /// @param expenseId Expense ID
    /// @return expense Expense data
    function getExpense(uint256 expenseId) external view expenseExists(expenseId) returns (ExpenseData memory expense) {
        expense = expenses[expenseId];
    }
    
    /// @notice Get member's share in expense
    /// @param expenseId Expense ID
    /// @param member Member address
    /// @return memberData Member's expense data
    function getExpenseMember(
        uint256 expenseId,
        address member
    ) external view expenseExists(expenseId) returns (DataTypes.Member memory memberData) {
        memberData = expenseMembers[expenseId][member];
    }
    
    /// @notice Get all expenses in a group
    /// @param groupId Group ID
    /// @return expenseIds Array of expense IDs
    function getGroupExpenses(uint256 groupId) external view returns (uint256[] memory expenseIds) {
        expenseIds = groupExpenses[groupId];
    }
    
    /// @notice Get groups user belongs to
    /// @param user User address
    /// @return groupIds Array of group IDs
    function getUserGroups(address user) external view returns (uint256[] memory groupIds) {
        groupIds = userGroups[user];
    }
    
    /// @notice Update expense status
    /// @param expenseId Expense ID
    /// @param newStatus New status
    function updateExpenseStatus(
        uint256 expenseId,
        DataTypes.ExpenseStatus newStatus
    ) external expenseExists(expenseId) {
        ExpenseData storage expense = expenses[expenseId];
        if (msg.sender != expense.paidBy) revert DataTypes.Unauthorized();
        
        DataTypes.ExpenseStatus oldStatus = expense.status;
        expense.status = newStatus;
        
        emit DataTypes.ExpenseStatusUpdated(expenseId, oldStatus, newStatus);
    }
    
    /// @notice Mark a member as paid for an expense
    /// @param expenseId Expense ID
    /// @param member Member address
    /// @param amountPaid Amount paid
    function updateMemberPayment(uint256 expenseId, address member, uint256 amountPaid) external {
        if (msg.sender != address(paymentProcessor)) revert DataTypes.Unauthorized();
        
        DataTypes.Member storage memberData = expenseMembers[expenseId][member];
        memberData.amountPaid += amountPaid;
        
        if (memberData.amountPaid >= memberData.amountOwed) {
            memberData.hasPaid = true;
        }
    }
    
    /// @notice Internal function to add member to group
    function _addMemberToGroup(uint256 groupId, address member) private {
        groupMembers[groupId][member] = true;
        groups[groupId].members.push(member);
        userGroups[member].push(groupId);
    }
}