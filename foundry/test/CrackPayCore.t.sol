// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CrackPayCore.sol";
import "../src/libraries/DataTypes.sol";

/// @title CrackPayCore Test Suite
/// @notice Comprehensive tests for Crack Pay functionality
contract CrackPayCoreTest is Test {
    
    CrackPayCore public crackPay;
    ContactBook public contactBook;
    GroupManager public groupManager;
    PaymentProcessor public paymentProcessor;
    RequestManager public requestManager;
    
    address public alice;
    address public bob;
    address public carol;
    address public dave;
    
    function setUp() public {
        // Deploy contracts
        crackPay = new CrackPayCore();
        contactBook = crackPay.contactBook();
        groupManager = crackPay.groupManager();
        paymentProcessor = crackPay.paymentProcessor();
        requestManager = crackPay.requestManager();
        
        // Create test users
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        carol = makeAddr("carol");
        dave = makeAddr("dave");
        
        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(dave, 100 ether);
    }
    
    // ============ User Registration Tests ============
    
    function testUserRegistration() public {
        vm.startPrank(alice);
        
        crackPay.registerUser("Alice", "ipfs://alice-avatar");
        
        assertTrue(crackPay.hasRegistered(alice));
        
        (address userAddr, string memory username, , uint256 registeredAt, , ) = 
            crackPay.userProfiles(alice);
        
        assertEq(userAddr, alice);
        assertEq(username, "Alice");
        assertGt(registeredAt, 0);
        
        vm.stopPrank();
    }
    
    function testCannotRegisterTwice() public {
        vm.startPrank(alice);
        
        crackPay.registerUser("Alice", "ipfs://alice-avatar");
        
        vm.expectRevert(CrackPayCore.AlreadyRegistered.selector);
        crackPay.registerUser("Alice2", "ipfs://alice-avatar2");
        
        vm.stopPrank();
    }
    
    // ============ Contact Book Tests ============
    
    function testAddContact() public {
        vm.startPrank(alice);
        
        contactBook.addContact(bob, "Bob", "ipfs://bob-avatar");
        
        DataTypes.Contact memory contact = contactBook.getContact(alice, bob);
        assertEq(contact.walletAddress, bob);
        assertEq(contact.displayName, "Bob");
        assertTrue(contact.exists);
        
        vm.stopPrank();
    }
    
    function testBatchAddContacts() public {
        vm.startPrank(alice);
        
        address[] memory contacts = new address[](3);
        contacts[0] = bob;
        contacts[1] = carol;
        contacts[2] = dave;
        
        string[] memory names = new string[](3);
        names[0] = "Bob";
        names[1] = "Carol";
        names[2] = "Dave";
        
        string[] memory avatars = new string[](3);
        avatars[0] = "ipfs://bob";
        avatars[1] = "ipfs://carol";
        avatars[2] = "ipfs://dave";
        
        contactBook.batchAddContacts(contacts, names, avatars);
        
        assertEq(contactBook.getContactCount(alice), 3);
        
        vm.stopPrank();
    }
    
    // ============ Group Creation Tests ============
    
    function testCreateGroup() public {
        vm.startPrank(alice);
        
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = carol;
        
        uint256 groupId = groupManager.createGroup("Friday Dinner", members);
        
        assertEq(groupId, 1);
        
        GroupManager.GroupData memory group = groupManager.getGroup(groupId);
        assertEq(group.groupName, "Friday Dinner");
        assertEq(group.creator, alice);
        assertEq(group.members.length, 3); // Alice + Bob + Carol
        
        vm.stopPrank();
    }
    
    function testAddMemberToGroup() public {
        vm.startPrank(alice);
        
        address[] memory members = new address[](1);
        members[0] = bob;
        
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        groupManager.addMember(groupId, carol);
        
        GroupManager.GroupData memory group = groupManager.getGroup(groupId);
        assertEq(group.members.length, 3); // Alice + Bob + Carol
        
        vm.stopPrank();
    }
    
    // ============ Expense Creation Tests ============
    
    function testCreateExpenseEqualSplit() public {
        vm.startPrank(alice);
        
        // Create group
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = carol;
        uint256 groupId = groupManager.createGroup("Dinner", members);
        
        // Create expense: 3000 total, split 3 ways = 1000 each
        uint256 expenseId = groupManager.createExpenseEqualSplit(
            groupId,
            3000,
            "Restaurant Bill",
            "Food"
        );
        
        assertEq(expenseId, 1);
        
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        assertEq(expense.totalAmount, 3000);
        assertEq(expense.paidBy, alice);
        assertEq(uint8(expense.status), uint8(DataTypes.ExpenseStatus.PENDING));
        
        // Check splits
        DataTypes.Member memory aliceMember = groupManager.getExpenseMember(expenseId, alice);
        assertEq(aliceMember.amountOwed, 1000);
        assertTrue(aliceMember.hasPaid); // Alice paid the bill
        
        DataTypes.Member memory bobMember = groupManager.getExpenseMember(expenseId, bob);
        assertEq(bobMember.amountOwed, 1000);
        assertFalse(bobMember.hasPaid);
        
        vm.stopPrank();
    }
    
    function testCreateExpenseCustomSplit() public {
        vm.startPrank(alice);
        
        // Create group
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = carol;
        uint256 groupId = groupManager.createGroup("Dinner", members);
        
        // Custom split: Alice 1000, Bob 1500, Carol 500 = 3000 total
        DataTypes.SplitAllocation[] memory allocations = new DataTypes.SplitAllocation[](3);
        allocations[0] = DataTypes.SplitAllocation(alice, 1000, 0);
        allocations[1] = DataTypes.SplitAllocation(bob, 1500, 0);
        allocations[2] = DataTypes.SplitAllocation(carol, 500, 0);
        
        uint256 expenseId = groupManager.createExpenseCustomSplit(
            groupId,
            3000,
            "Restaurant Bill",
            "Food",
            allocations
        );
        
        // Verify custom amounts
        DataTypes.Member memory bobMember = groupManager.getExpenseMember(expenseId, bob);
        assertEq(bobMember.amountOwed, 1500);
        
        DataTypes.Member memory carolMember = groupManager.getExpenseMember(expenseId, carol);
        assertEq(carolMember.amountOwed, 500);
        
        vm.stopPrank();
    }
    
    // ============ Payment Settlement Tests ============
    
    function testSettleExpense() public {
        // Alice creates expense
        vm.startPrank(alice);
        
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Lunch", members);
        
        uint256 expenseId = groupManager.createExpenseEqualSplit(
            groupId,
            2000, // 1000 each
            "Lunch Bill",
            "Food"
        );
        
        vm.stopPrank();
        
        // Bob settles his share
        uint256 aliceBalanceBefore = alice.balance;
        
        vm.prank(bob);
        paymentProcessor.settleExpense{value: 1000}(expenseId);
        
        // Verify payment received
        assertEq(alice.balance, aliceBalanceBefore + 1000);
        
        // Verify stats updated
        (uint256 bobPaid, , ) = paymentProcessor.getUserStats(bob);
        assertEq(bobPaid, 1000);
        
        (, uint256 aliceReceived, ) = paymentProcessor.getUserStats(alice);
        assertEq(aliceReceived, 1000);
    }
    
    function testCannotSettleTwice() public {
        // Setup expense
        vm.startPrank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test", members);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Test", "Test");
        vm.stopPrank();
        
        // Bob settles
        vm.startPrank(bob);
        paymentProcessor.settleExpense{value: 1000}(expenseId);
        
        // Try to settle again
        vm.expectRevert(DataTypes.AlreadyPaid.selector);
        paymentProcessor.settleExpense{value: 1000}(expenseId);
        
        vm.stopPrank();
    }
    
    function testPartialSettlement() public {
        // Setup expense
        vm.startPrank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test", members);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Test", "Test");
        vm.stopPrank();
        
        // Bob pays partial amount
        vm.prank(bob);
        paymentProcessor.settlePartialExpense{value: 500}(expenseId);
        
        (uint256 paid, , ) = paymentProcessor.getUserStats(bob);
        assertEq(paid, 500);
    }
    
    // ============ Payment Request Tests ============
    
    function testCreatePaymentRequest() public {
        // Setup expense
        vm.startPrank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Dinner", members);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Dinner", "Food");
        
        // Create payment request for Bob
        uint256 requestId = requestManager.createPaymentRequest(expenseId, bob, 0);
        
        assertEq(requestId, 1);
        
        DataTypes.PaymentRequest memory request = requestManager.getRequest(requestId);
        assertEq(request.from, alice);
        assertEq(request.to, bob);
        assertEq(request.amount, 1000);
        assertEq(uint8(request.status), uint8(DataTypes.RequestStatus.PENDING));
        
        vm.stopPrank();
    }
    
    function testAcceptAndPayRequest() public {
        // Setup expense and request
        vm.startPrank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Dinner", members);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Dinner", "Food");
        uint256 requestId = requestManager.createPaymentRequest(expenseId, bob, 0);
        vm.stopPrank();
        
        // Bob accepts and pays
        uint256 aliceBalanceBefore = alice.balance;
        
        vm.prank(bob);
        requestManager.acceptAndPayRequest{value: 1000}(requestId);
        
        // Verify payment
        assertEq(alice.balance, aliceBalanceBefore + 1000);
        
        // Verify request status
        DataTypes.PaymentRequest memory request = requestManager.getRequest(requestId);
        assertEq(uint8(request.status), uint8(DataTypes.RequestStatus.COMPLETED));
    }
    
    function testBatchCreateRequests() public {
        // Setup expense with multiple members
        vm.startPrank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = carol;
        uint256 groupId = groupManager.createGroup("Dinner", members);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 3000, "Dinner", "Food");
        
        // Batch create requests for all unpaid members
        uint256[] memory requestIds = requestManager.batchCreateRequests(expenseId, 0);
        
        assertEq(requestIds.length, 2); // Bob and Carol
        
        vm.stopPrank();
    }
    
    // ============ Integration Tests ============
    
    function testCompleteUserFlow() public {
        // 1. Alice registers
        vm.prank(alice);
        crackPay.registerUser("Alice", "ipfs://alice");
        
        // 2. Alice adds contacts
        vm.startPrank(alice);
        contactBook.addContact(bob, "Bob", "ipfs://bob");
        contactBook.addContact(carol, "Carol", "ipfs://carol");
        vm.stopPrank();
        
        // 3. Alice creates group
        vm.startPrank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = carol;
        uint256 groupId = groupManager.createGroup("Weekend Trip", members);
        vm.stopPrank();
        
        // 4. Alice pays for hotel and creates expense
        vm.startPrank(alice);
        uint256 expenseId = groupManager.createExpenseEqualSplit(
            groupId,
            6000, // 2000 each
            "Hotel",
            "Accommodation"
        );
        vm.stopPrank();
        
        // 5. Alice creates payment requests
        vm.startPrank(alice);
        requestManager.createPaymentRequest(expenseId, bob, 0);
        requestManager.createPaymentRequest(expenseId, carol, 0);
        vm.stopPrank();
        
        // 6. Bob and Carol pay
        uint256 aliceBalanceBefore = alice.balance;
        
        vm.prank(bob);
        paymentProcessor.settleExpense{value: 2000}(expenseId);
        
        vm.prank(carol);
        paymentProcessor.settleExpense{value: 2000}(expenseId);
        
        // 7. Verify final balances
        assertEq(alice.balance, aliceBalanceBefore + 4000);
        
        // 8. Check stats
        (, uint256 aliceReceived, ) = paymentProcessor.getUserStats(alice);
        assertEq(aliceReceived, 4000);
    }
    
    function testDashboardView() public {
        // Setup some data
        vm.startPrank(alice);
        crackPay.registerUser("Alice", "ipfs://alice");
        contactBook.addContact(bob, "Bob", "ipfs://bob");
        
        address[] memory members = new address[](1);
        members[0] = bob;
        groupManager.createGroup("Test Group", members);
        vm.stopPrank();
        
        // Get dashboard
        (
            CrackPayCore.UserProfile memory profile,
            address[] memory contacts,
            uint256[] memory groups,
            CrackPayCore.PaymentStats memory stats
        ) = crackPay.getUserDashboard(alice);
        
        assertEq(profile.username, "Alice");
        assertEq(contacts.length, 1);
        assertEq(groups.length, 1);
        assertEq(stats.totalContacts, 1);
        assertEq(stats.activeGroups, 1);
    }
    
    // ============ Edge Cases ============
    
    function testCannotSendZeroAmount() public {
        vm.startPrank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test", members);
        
        vm.expectRevert(DataTypes.InvalidAmount.selector);
        groupManager.createExpenseEqualSplit(groupId, 0, "Test", "Test");
        
        vm.stopPrank();
    }
    
    function testCannotAddSelfAsContact() public {
        vm.startPrank(alice);
        
        vm.expectRevert(DataTypes.InvalidAddress.selector);
        contactBook.addContact(alice, "Me", "ipfs://me");
        
        vm.stopPrank();
    }
}