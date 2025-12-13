// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DataTypes
/// @notice Shared data structures for Crack Pay protocol
library DataTypes {
    
    // ============ Enums ============
    
    enum SplitType {
        EQUAL,        // Split equally among all members
        CUSTOM,       // Custom amounts per member
        PERCENTAGE    // Percentage-based split
    }
    
    enum ExpenseStatus {
        PENDING,      // Waiting for settlements
        PARTIAL,      // Some members paid
        SETTLED,      // All members paid
        CANCELLED     // Expense cancelled
    }
    
    enum RequestStatus {
        PENDING,      // Request sent, awaiting payment
        ACCEPTED,     // Request accepted, payment processing
        COMPLETED,    // Payment successful
        DECLINED,     // Request declined by recipient
        EXPIRED       // Request expired (optional timeout)
    }
    
    // ============ Structs ============
    
    /// @notice Contact book entry
    struct Contact {
        address walletAddress;
        string displayName;
        string avatarURI;        // IPFS or data URI
        uint256 createdAt;
        bool exists;
    }
    
    /// @notice Group member information
    struct Member {
        address memberAddress;
        uint256 amountOwed;      // Amount this member owes
        uint256 amountPaid;      // Amount this member has paid
        bool hasPaid;            // Quick check if fully paid
        bool isActive;           // Member active in group
    }
    
    /// @notice Expense group
    struct Group {
        uint256 groupId;
        string groupName;
        address creator;
        address[] members;
        uint256 createdAt;
        uint256 totalExpenses;   // Total expenses in this group
        bool isActive;
        mapping(address => bool) isMember;
    }
    
    /// @notice Individual expense within a group
    struct Expense {
        uint256 expenseId;
        uint256 groupId;
        address paidBy;          // Who paid the bill originally
        uint256 totalAmount;
        string description;
        string category;         // e.g., "Food", "Transport", "Utilities"
        uint256 createdAt;
        ExpenseStatus status;
        SplitType splitType;
        mapping(address => Member) members;
        address[] memberList;    // Array for iteration
    }
    
    /// @notice Payment request
    struct PaymentRequest {
        uint256 requestId;
        uint256 expenseId;       // Linked to expense
        address from;            // Original payer
        address to;              // Person who owes money
        uint256 amount;
        string description;
        uint256 createdAt;
        uint256 expiresAt;       // Optional expiry
        RequestStatus status;
        bytes qrCodeData;        // Encoded payment data for QR
    }
    
    /// @notice Custom split allocation
    struct SplitAllocation {
        address member;
        uint256 amount;          // For CUSTOM split
        uint256 percentage;      // For PERCENTAGE split (basis points: 10000 = 100%)
    }
    
    /// @notice Transaction record
    struct Transaction {
        uint256 txId;
        uint256 expenseId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        bytes32 txHash;
    }
    
    // ============ Events ============
    
    event ContactAdded(address indexed user, address indexed contact, string displayName);
    event ContactUpdated(address indexed user, address indexed contact, string displayName);
    event ContactRemoved(address indexed user, address indexed contact);
    
    event GroupCreated(uint256 indexed groupId, address indexed creator, string groupName);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event MemberRemoved(uint256 indexed groupId, address indexed member);
    
    event ExpenseCreated(
        uint256 indexed expenseId,
        uint256 indexed groupId,
        address indexed paidBy,
        uint256 totalAmount,
        SplitType splitType
    );
    
    event ExpenseSplit(
        uint256 indexed expenseId,
        address indexed member,
        uint256 amountOwed
    );
    
    event PaymentSettled(
        uint256 indexed expenseId,
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    event ExpenseStatusUpdated(
        uint256 indexed expenseId,
        ExpenseStatus oldStatus,
        ExpenseStatus newStatus
    );
    
    event PaymentRequestCreated(
        uint256 indexed requestId,
        uint256 indexed expenseId,
        address indexed from,
        address to,
        uint256 amount
    );
    
    event PaymentRequestResponded(
        uint256 indexed requestId,
        address indexed responder,
        RequestStatus status
    );
    
    // ============ Errors ============
    
    error Unauthorized();
    error InvalidAmount();
    error InvalidAddress();
    error GroupNotFound();
    error ExpenseNotFound();
    error RequestNotFound();
    error ContactNotFound();
    error AlreadyExists();
    error NotAMember();
    error AlreadyPaid();
    error ExpenseNotPending();
    error InvalidSplitAllocation();
    error TransferFailed();
    error RequestExpired();
    error InvalidStatus();
}