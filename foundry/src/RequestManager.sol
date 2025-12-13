// 5. RequestManager (The Reminder System) 📩
// Think of it as: Venmo's "Request Money" Feature
// What it does:

// Creates payment requests ("Bob, you owe me ₹1000")
// Sends to specific people
// Generates QR codes for payment
// Tracks pending/completed/declined requests
// Has expiry dates

// Key Functions:
// soliditycreatePaymentRequest(expenseId, bob, expiry)   // Ask Bob to pay
// acceptAndPayRequest{value: 1000}(requestId)    // Bob pays
// declineRequest(requestId)                       // Bob declines
// batchCreateRequests(expenseId)                  // Send to all members
// ```

// **Example:**
// ```
// Alice creates expense
// Alice sends requests to Bob & Carol
// They get notifications
// They click "Pay" and it's done
// ```

// ---

// ## 🔄 How They Work Together (Full Flow):
// ```
// USER JOURNEY:
// 1. CrackPayCore → Register as "Alice"
// 2. ContactBook → Add Bob & Carol as contacts
// 3. GroupManager → Create "Friday Dinner" group with Bob & Carol
// 4. GroupManager → Create expense: ₹3000 (split = ₹1000 each)
// 5. RequestManager → Send payment requests to Bob & Carol
// 6. PaymentProcessor → Bob & Carol pay their ₹1000 each
// 7. CrackPayCore → Alice's dashboard shows ₹2000 received ✅


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./libraries/DataTypes.sol";
import "./GroupManager.sol";
import "./PaymentProcessor.sol";

/// @title RequestManager
/// @notice Manages payment requests and QR code generation
contract RequestManager {
    
    GroupManager public immutable groupManager;
    PaymentProcessor public immutable paymentProcessor;
    
    uint256 private _requestIdCounter;
    
    // requestId => PaymentRequest
    mapping(uint256 => DataTypes.PaymentRequest) private requests;
    
    // user address => incoming request IDs
    mapping(address => uint256[]) private incomingRequests;
    
    // user address => outgoing request IDs
    mapping(address => uint256[]) private outgoingRequests;
    
    // expenseId => request IDs
    mapping(uint256 => uint256[]) private expenseRequests;
    
    uint256 public constant DEFAULT_EXPIRY = 7 days;
    
    constructor(address _groupManager, address _paymentProcessor) {
        groupManager = GroupManager(_groupManager);
        paymentProcessor = PaymentProcessor(_paymentProcessor);
    }
    
    /// @notice Create payment request for expense
    /// @param expenseId Expense ID
    /// @param recipient Who owes the money
    /// @param expiryTime Expiry timestamp (0 for default)
    /// @return requestId ID of created request
    function createPaymentRequest(
        uint256 expenseId,
        address recipient,
        uint256 expiryTime
    ) external returns (uint256 requestId) {
        // Get expense details
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        
        if (msg.sender != expense.paidBy) revert DataTypes.Unauthorized();
        if (recipient == address(0)) revert DataTypes.InvalidAddress();
        
        // Get recipient's share
        DataTypes.Member memory member = groupManager.getExpenseMember(expenseId, recipient);
        if (!member.isActive) revert DataTypes.NotAMember();
        if (member.hasPaid) revert DataTypes.AlreadyPaid();
        
        uint256 amountOwed = member.amountOwed - member.amountPaid;
        
        requestId = ++_requestIdCounter;
        
        // Set expiry
        uint256 expiresAt = expiryTime == 0 ? block.timestamp + DEFAULT_EXPIRY : expiryTime;
        
        // Generate QR code data (encode payment info)
        bytes memory qrData = abi.encode(
            requestId,
            expenseId,
            msg.sender,
            recipient,
            amountOwed,
            expiresAt
        );
        
        requests[requestId] = DataTypes.PaymentRequest({
            requestId: requestId,
            expenseId: expenseId,
            from: msg.sender,
            to: recipient,
            amount: amountOwed,
            description: expense.description,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: DataTypes.RequestStatus.PENDING,
            qrCodeData: qrData
        });
        
        incomingRequests[recipient].push(requestId);
        outgoingRequests[msg.sender].push(requestId);
        expenseRequests[expenseId].push(requestId);
        
        emit DataTypes.PaymentRequestCreated(
            requestId,
            expenseId,
            msg.sender,
            recipient,
            amountOwed
        );
    }
    
    /// @notice Accept and pay a request
    /// @param requestId Request ID
    function acceptAndPayRequest(uint256 requestId) external payable {
        DataTypes.PaymentRequest storage request = requests[requestId];
        
        if (request.requestId == 0) revert DataTypes.RequestNotFound();
        if (msg.sender != request.to) revert DataTypes.Unauthorized();
        if (request.status != DataTypes.RequestStatus.PENDING) {
            revert DataTypes.InvalidStatus();
        }
        if (block.timestamp > request.expiresAt) {
            request.status = DataTypes.RequestStatus.EXPIRED;
            revert DataTypes.RequestExpired();
        }
        if (msg.value != request.amount) revert DataTypes.InvalidAmount();
        
        // Update status
        request.status = DataTypes.RequestStatus.ACCEPTED;
        
        // Process payment through PaymentProcessor
        // Transfer to original payer
        (bool success, ) = payable(request.from).call{value: msg.value}("");
        if (!success) revert DataTypes.TransferFailed();
        
        // Mark as completed
        request.status = DataTypes.RequestStatus.COMPLETED;
        
        emit DataTypes.PaymentRequestResponded(
            requestId,
            msg.sender,
            DataTypes.RequestStatus.COMPLETED
        );
    }
    
    /// @notice Decline a payment request
    /// @param requestId Request ID
    function declineRequest(uint256 requestId) external {
        DataTypes.PaymentRequest storage request = requests[requestId];
        
        if (request.requestId == 0) revert DataTypes.RequestNotFound();
        if (msg.sender != request.to) revert DataTypes.Unauthorized();
        if (request.status != DataTypes.RequestStatus.PENDING) {
            revert DataTypes.InvalidStatus();
        }
        
        request.status = DataTypes.RequestStatus.DECLINED;
        
        emit DataTypes.PaymentRequestResponded(
            requestId,
            msg.sender,
            DataTypes.RequestStatus.DECLINED
        );
    }
    
    /// @notice Cancel outgoing request
    /// @param requestId Request ID
    function cancelRequest(uint256 requestId) external {
        DataTypes.PaymentRequest storage request = requests[requestId];
        
        if (request.requestId == 0) revert DataTypes.RequestNotFound();
        if (msg.sender != request.from) revert DataTypes.Unauthorized();
        if (request.status != DataTypes.RequestStatus.PENDING) {
            revert DataTypes.InvalidStatus();
        }
        
        request.status = DataTypes.RequestStatus.DECLINED;
        
        emit DataTypes.PaymentRequestResponded(
            requestId,
            msg.sender,
            DataTypes.RequestStatus.DECLINED
        );
    }
    
    /// @notice Batch create requests for all unpaid members in expense
    /// @param expenseId Expense ID
    /// @param expiryTime Expiry timestamp
    /// @return requestIds Array of created request IDs
    function batchCreateRequests(
        uint256 expenseId,
        uint256 expiryTime
    ) external returns (uint256[] memory requestIds) {
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        
        if (msg.sender != expense.paidBy) revert DataTypes.Unauthorized();
        
        // Count unpaid members
        uint256 unpaidCount = 0;
        for (uint256 i = 0; i < expense.memberList.length; i++) {
            address member = expense.memberList[i];
            if (member == msg.sender) continue; // Skip payer
            
            DataTypes.Member memory memberData = groupManager.getExpenseMember(expenseId, member);
            if (!memberData.hasPaid && memberData.isActive) {
                unpaidCount++;
            }
        }
        
        requestIds = new uint256[](unpaidCount);
        uint256 index = 0;
        
        uint256 expiresAt = expiryTime == 0 ? block.timestamp + DEFAULT_EXPIRY : expiryTime;
        
        // Create request for each unpaid member
        for (uint256 i = 0; i < expense.memberList.length; i++) {
            address member = expense.memberList[i];
            if (member == msg.sender) continue;
            
            DataTypes.Member memory memberData = groupManager.getExpenseMember(expenseId, member);
            if (!memberData.hasPaid && memberData.isActive) {
                uint256 amountOwed = memberData.amountOwed - memberData.amountPaid;
                
                uint256 requestId = ++_requestIdCounter;
                
                bytes memory qrData = abi.encode(
                    requestId,
                    expenseId,
                    msg.sender,
                    member,
                    amountOwed,
                    expiresAt
                );
                
                requests[requestId] = DataTypes.PaymentRequest({
                    requestId: requestId,
                    expenseId: expenseId,
                    from: msg.sender,
                    to: member,
                    amount: amountOwed,
                    description: expense.description,
                    createdAt: block.timestamp,
                    expiresAt: expiresAt,
                    status: DataTypes.RequestStatus.PENDING,
                    qrCodeData: qrData
                });
                
                incomingRequests[member].push(requestId);
                outgoingRequests[msg.sender].push(requestId);
                expenseRequests[expenseId].push(requestId);
                
                requestIds[index] = requestId;
                index++;
                
                emit DataTypes.PaymentRequestCreated(
                    requestId,
                    expenseId,
                    msg.sender,
                    member,
                    amountOwed
                );
            }
        }
    }
    
    /// @notice Get payment request details
    /// @param requestId Request ID
    /// @return request Payment request data
    function getRequest(uint256 requestId) external view returns (DataTypes.PaymentRequest memory request) {
        request = requests[requestId];
        if (request.requestId == 0) revert DataTypes.RequestNotFound();
    }
    
    /// @notice Get incoming requests for user
    /// @param user User address
    /// @return requestIds Array of request IDs
    function getIncomingRequests(address user) external view returns (uint256[] memory requestIds) {
        requestIds = incomingRequests[user];
    }
    
    /// @notice Get outgoing requests from user
    /// @param user User address
    /// @return requestIds Array of request IDs
    function getOutgoingRequests(address user) external view returns (uint256[] memory requestIds) {
        requestIds = outgoingRequests[user];
    }
    
    /// @notice Get all requests for an expense
    /// @param expenseId Expense ID
    /// @return requestIds Array of request IDs
    function getExpenseRequests(uint256 expenseId) external view returns (uint256[] memory requestIds) {
        requestIds = expenseRequests[expenseId];
    }
    
    /// @notice Get pending requests for user
    /// @param user User address
    /// @return pendingRequestIds Array of pending request IDs
    function getPendingIncomingRequests(address user) external view returns (uint256[] memory pendingRequestIds) {
        uint256[] memory allRequests = incomingRequests[user];
        uint256 pendingCount = 0;
        
        // Count pending
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (requests[allRequests[i]].status == DataTypes.RequestStatus.PENDING &&
                block.timestamp <= requests[allRequests[i]].expiresAt) {
                pendingCount++;
            }
        }
        
        pendingRequestIds = new uint256[](pendingCount);
        uint256 index = 0;
        
        // Collect pending
        for (uint256 i = 0; i < allRequests.length; i++) {
            if (requests[allRequests[i]].status == DataTypes.RequestStatus.PENDING &&
                block.timestamp <= requests[allRequests[i]].expiresAt) {
                pendingRequestIds[index] = allRequests[i];
                index++;
            }
        }
    }
    
    /// @notice Decode QR code data
    /// @param qrData Encoded QR data
    /// @return requestId Request ID
    /// @return expenseId Expense ID
    /// @return from Payer address
    /// @return to Recipient address
    /// @return amount Amount owed
    /// @return expiresAt Expiry timestamp
    function decodeQRData(bytes calldata qrData) external pure returns (
        uint256 requestId,
        uint256 expenseId,
        address from,
        address to,
        uint256 amount,
        uint256 expiresAt
    ) {
        (requestId, expenseId, from, to, amount, expiresAt) = abi.decode(
            qrData,
            (uint256, uint256, address, address, uint256, uint256)
        );
    }
}