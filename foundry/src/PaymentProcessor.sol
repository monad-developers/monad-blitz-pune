/**
 * 4. PaymentProcessor (The Bank) 💸
Think of it as: Venmo/PayPal Settlement
What it does:

Actually transfers money from person to person
Settles expenses (full or partial)
Direct payments (not tied to expenses)
Tracks payment history
Records who paid what to whom

Key Functions:
soliditysettleExpense{value: 1000}(expenseId)        // Pay your share
settlePartialExpense{value: 500}(expenseId)  // Pay part
directPayment{value: 1000}(recipient)        // Send money directly
getUserStats(address)                        // See payment history
```

**Example:**
```
Bob owes Alice ₹1000
Bob calls: settleExpense{value: 1000}
Money instantly goes from Bob → Alice
 */


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./libraries/DataTypes.sol";
import "./libraries/SplitCalculator.sol";
import "./GroupManager.sol";

/// @title PaymentProcessor
/// @notice Handles payment settlements for expenses
contract PaymentProcessor {
    
    GroupManager public immutable groupManager;
    
    uint256 private _txIdCounter;
    
    // expenseId => Transaction IDs
    mapping(uint256 => uint256[]) private expenseTransactions;
    
    // txId => Transaction
    mapping(uint256 => DataTypes.Transaction) private transactions;
    
    // User address => Total amount paid
    mapping(address => uint256) public totalPaidByUser;
    
    // User address => Total amount received
    mapping(address => uint256) public totalReceivedByUser;
    
    constructor(address _groupManager) {
        groupManager = GroupManager(_groupManager);
    }
    
    /// @notice Settle payment for an expense
    /// @param expenseId Expense ID
    function settleExpense(uint256 expenseId) external payable {
        // Get expense details from GroupManager
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        
        if (expense.status == DataTypes.ExpenseStatus.SETTLED) {
            revert DataTypes.AlreadyPaid();
        }
        if (expense.status == DataTypes.ExpenseStatus.CANCELLED) {
            revert DataTypes.InvalidStatus();
        }
        
        // Get member's share
        DataTypes.Member memory member = groupManager.getExpenseMember(expenseId, msg.sender);
        
        if (!member.isActive) revert DataTypes.NotAMember();
        if (member.hasPaid) revert DataTypes.AlreadyPaid();
        
        uint256 amountDue = SplitCalculator.calculateRemaining(member.amountOwed, member.amountPaid);
        
        if (msg.value != amountDue) revert DataTypes.InvalidAmount();
        
        // Transfer to original payer
        (bool success, ) = payable(expense.paidBy).call{value: msg.value}("");
        if (!success) revert DataTypes.TransferFailed();
        
        // Record transaction
        uint256 txId = ++_txIdCounter;
        transactions[txId] = DataTypes.Transaction({
            txId: txId,
            expenseId: expenseId,
            from: msg.sender,
            to: expense.paidBy,
            amount: msg.value,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        });
        
        expenseTransactions[expenseId].push(txId);
        
        // Update stats
        totalPaidByUser[msg.sender] += msg.value;
        totalReceivedByUser[expense.paidBy] += msg.value;
        
        // Update member payment status in GroupManager
        groupManager.updateMemberPayment(expenseId, msg.sender, msg.value);
        
        emit DataTypes.PaymentSettled(expenseId, msg.sender, expense.paidBy, msg.value);
        
        // Check if all members have paid - update status in GroupManager if needed
        // Note: This requires GroupManager to have an external function to update member status
    }
    
    /// @notice Settle partial payment for an expense
    /// @param expenseId Expense ID
    /// @dev Allows paying less than full amount owed
    function settlePartialExpense(uint256 expenseId) external payable {
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        
        if (expense.status == DataTypes.ExpenseStatus.SETTLED) {
            revert DataTypes.AlreadyPaid();
        }
        if (expense.status == DataTypes.ExpenseStatus.CANCELLED) {
            revert DataTypes.InvalidStatus();
        }
        
        DataTypes.Member memory member = groupManager.getExpenseMember(expenseId, msg.sender);
        
        if (!member.isActive) revert DataTypes.NotAMember();
        
        uint256 amountDue = SplitCalculator.calculateRemaining(member.amountOwed, member.amountPaid);
        
        if (msg.value == 0 || msg.value > amountDue) revert DataTypes.InvalidAmount();
        
        // Transfer to original payer
        (bool success, ) = payable(expense.paidBy).call{value: msg.value}("");
        if (!success) revert DataTypes.TransferFailed();
        
        // Record transaction
        uint256 txId = ++_txIdCounter;
        transactions[txId] = DataTypes.Transaction({
            txId: txId,
            expenseId: expenseId,
            from: msg.sender,
            to: expense.paidBy,
            amount: msg.value,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        });
        
        expenseTransactions[expenseId].push(txId);
        
        // Update stats
        totalPaidByUser[msg.sender] += msg.value;
        totalReceivedByUser[expense.paidBy] += msg.value;
        
        // Update member payment status in GroupManager
        groupManager.updateMemberPayment(expenseId, msg.sender, msg.value);
        
        emit DataTypes.PaymentSettled(expenseId, msg.sender, expense.paidBy, msg.value);
    }
    
    /// @notice Direct payment to any address (not tied to expense)
    /// @param recipient Recipient address
    function directPayment(address recipient) external payable {
        if (recipient == address(0)) revert DataTypes.InvalidAddress();
        if (msg.value == 0) revert DataTypes.InvalidAmount();
        
        // Transfer funds
        (bool success, ) = payable(recipient).call{value: msg.value}("");
        if (!success) revert DataTypes.TransferFailed();
        
        // Record transaction (not linked to expense)
        uint256 txId = ++_txIdCounter;
        transactions[txId] = DataTypes.Transaction({
            txId: txId,
            expenseId: 0, // No expense ID for direct payments
            from: msg.sender,
            to: recipient,
            amount: msg.value,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1)
        });
        
        // Update stats
        totalPaidByUser[msg.sender] += msg.value;
        totalReceivedByUser[recipient] += msg.value;
        
        emit DataTypes.PaymentSettled(0, msg.sender, recipient, msg.value);
    }
    
    /// @notice Get transaction details
    /// @param txId Transaction ID
    /// @return transaction Transaction data
    function getTransaction(uint256 txId) external view returns (DataTypes.Transaction memory transaction) {
        transaction = transactions[txId];
    }
    
    /// @notice Get all transactions for an expense
    /// @param expenseId Expense ID
    /// @return txIds Array of transaction IDs
    function getExpenseTransactions(uint256 expenseId) external view returns (uint256[] memory txIds) {
        txIds = expenseTransactions[expenseId];
    }
    
    /// @notice Get user's payment statistics
    /// @param user User address
    /// @return totalPaid Total amount paid by user
    /// @return totalReceived Total amount received by user
    /// @return netBalance Net balance (received - paid)
    function getUserStats(address user) external view returns (
        uint256 totalPaid,
        uint256 totalReceived,
        int256 netBalance
    ) {
        totalPaid = totalPaidByUser[user];
        totalReceived = totalReceivedByUser[user];
        netBalance = int256(totalReceived) - int256(totalPaid);
    }
    
    /// @notice Batch settle multiple expenses
    /// @param expenseIds Array of expense IDs to settle
    /// @dev Must send exact total amount owed across all expenses
    function batchSettleExpenses(uint256[] calldata expenseIds) external payable {
        uint256 totalOwed = 0;
        
        // Calculate total amount owed
        for (uint256 i = 0; i < expenseIds.length; i++) {
            DataTypes.Member memory member = groupManager.getExpenseMember(expenseIds[i], msg.sender);
            if (member.isActive && !member.hasPaid) {
                totalOwed += SplitCalculator.calculateRemaining(member.amountOwed, member.amountPaid);
            }
        }
        
        if (msg.value != totalOwed) revert DataTypes.InvalidAmount();
        
        // Process each expense
        uint256 totalProcessed = 0;
        for (uint256 i = 0; i < expenseIds.length; i++) {
            uint256 expenseId = expenseIds[i];
            GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
            DataTypes.Member memory member = groupManager.getExpenseMember(expenseId, msg.sender);
            
            if (!member.isActive || member.hasPaid) continue;
            
            uint256 amountDue = SplitCalculator.calculateRemaining(member.amountOwed, member.amountPaid);
            
            // Transfer to original payer
            (bool success, ) = payable(expense.paidBy).call{value: amountDue}("");
            if (!success) revert DataTypes.TransferFailed();
            
            // Record transaction
            uint256 txId = ++_txIdCounter;
            transactions[txId] = DataTypes.Transaction({
                txId: txId,
                expenseId: expenseId,
                from: msg.sender,
                to: expense.paidBy,
                amount: amountDue,
                timestamp: block.timestamp,
                txHash: blockhash(block.number - 1)
            });
            
            expenseTransactions[expenseId].push(txId);
            totalProcessed += amountDue;
            
            emit DataTypes.PaymentSettled(expenseId, msg.sender, expense.paidBy, amountDue);
        }
        
        // Update stats
        totalPaidByUser[msg.sender] += totalProcessed;
    }
}