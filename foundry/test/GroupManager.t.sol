// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/GroupManager.sol";
import "../src/libraries/DataTypes.sol";

contract GroupManagerTest is Test {
    GroupManager public groupManager;
    
    address alice = address(0x328809Bc894f92807417D2dAD6b7C998c1aFdac6);
    address bob = address(0x1D96F2f6BeF1202E4Ce1Ff6Dad0c2CB002861d3e);
    address charlie = address(0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496);

    function setUp() public {
        groupManager = new GroupManager();
    }

    // ============ Group Creation Tests ============

    function testCreateGroup() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;

        uint256 groupId = groupManager.createGroup("Test Group", members);

        assertEq(groupId, 1);
    }

    function testCreateMultipleGroups() public {
        vm.prank(alice);
        address[] memory members1 = new address[](1);
        members1[0] = bob;

        uint256 groupId1 = groupManager.createGroup("Group 1", members1);
        
        vm.prank(alice);
        address[] memory members2 = new address[](2);
        members2[0] = bob;
        members2[1] = charlie;

        uint256 groupId2 = groupManager.createGroup("Group 2", members2);

        assertEq(groupId1, 1);
        assertEq(groupId2, 2);
    }

    function testCreateGroupWithEmptyMembers() public {
        vm.prank(alice);
        address[] memory members = new address[](0);

        uint256 groupId = groupManager.createGroup("Solo Group", members);
        assertEq(groupId, 1);
    }

    // ============ Member Management Tests ============

    function testAddMemberToGroup() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test Group", members);

        vm.prank(alice);
        groupManager.addMember(groupId, charlie);
    }

    function testRemoveMember() public {
        vm.prank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = charlie;
        uint256 groupId = groupManager.createGroup("Test Group", members);

        vm.prank(alice);
        groupManager.removeMember(groupId, bob);
    }

    function testCannotCreateExpenseIfNotMember() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test Group", members);

        vm.prank(charlie);
        vm.expectRevert(DataTypes.NotAMember.selector);
        groupManager.createExpenseEqualSplit(groupId, 2000, "Test", "Food");
    }

    function testCannotCreateExpenseInNonexistentGroup() public {
        vm.prank(alice);
        vm.expectRevert(DataTypes.GroupNotFound.selector);
        groupManager.createExpenseEqualSplit(999, 2000, "Test", "Food");
    }

    // ============ Expense Creation - Equal Split Tests ============

    function testCreateExpenseEqualSplit() public {
        vm.prank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = charlie;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        vm.prank(alice);
        uint256 expenseId = groupManager.createExpenseEqualSplit(
            groupId,
            3000,
            "Lunch",
            "Food"
        );
        
        assertEq(expenseId, 1);
        
        // Verify expense details
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        assertEq(expense.totalAmount, 3000);
        assertEq(expense.paidBy, alice);
        assertEq(uint8(expense.status), uint8(DataTypes.ExpenseStatus.PENDING));
        assertEq(uint8(expense.splitType), uint8(DataTypes.SplitType.EQUAL));
        
        // Verify split amounts
        DataTypes.Member memory aliceMember = groupManager.getExpenseMember(expenseId, alice);
        assertEq(aliceMember.amountOwed, 1000);
        assertTrue(aliceMember.hasPaid);
        
        DataTypes.Member memory bobMember = groupManager.getExpenseMember(expenseId, bob);
        assertEq(bobMember.amountOwed, 1000);
        assertFalse(bobMember.hasPaid);
    }

    function testCannotCreateExpenseWithZeroAmount() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        vm.prank(alice);
        vm.expectRevert(DataTypes.InvalidAmount.selector);
        groupManager.createExpenseEqualSplit(groupId, 0, "Test", "Food");
    }

    // ============ Expense Creation - Custom Split Tests ============

    function testCreateExpenseCustomSplit() public {
        vm.prank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = charlie;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        DataTypes.SplitAllocation[] memory allocations = new DataTypes.SplitAllocation[](3);
        allocations[0] = DataTypes.SplitAllocation(alice, 1500, 0);
        allocations[1] = DataTypes.SplitAllocation(bob, 1000, 0);
        allocations[2] = DataTypes.SplitAllocation(charlie, 500, 0);
        
        uint256 expenseId = groupManager.createExpenseCustomSplit(
            groupId,
            3000,
            "Dinner",
            "Food",
            allocations
        );
        
        assertEq(expenseId, 1);
        
        // Verify split amounts
        DataTypes.Member memory aliceMember = groupManager.getExpenseMember(expenseId, alice);
        assertEq(aliceMember.amountOwed, 1500);
        
        DataTypes.Member memory bobMember = groupManager.getExpenseMember(expenseId, bob);
        assertEq(bobMember.amountOwed, 1000);
        
        DataTypes.Member memory charlieMember = groupManager.getExpenseMember(expenseId, charlie);
        assertEq(charlieMember.amountOwed, 500);
    }

    // ============ Expense Query Tests ============

    function testGetExpense() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        vm.prank(alice);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Lunch", "Food");
        
        GroupManager.ExpenseData memory expense = groupManager.getExpense(expenseId);
        
        assertEq(expense.expenseId, 1);
        assertEq(expense.groupId, groupId);
        assertEq(expense.paidBy, alice);
        assertEq(expense.totalAmount, 2000);
    }

    function testGetExpenseMember() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        vm.prank(alice);
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Lunch", "Food");
        
        DataTypes.Member memory aliceMember = groupManager.getExpenseMember(expenseId, alice);
        DataTypes.Member memory bobMember = groupManager.getExpenseMember(expenseId, bob);
        
        assertEq(aliceMember.amountOwed, 1000);
        assertTrue(aliceMember.hasPaid);
        
        assertEq(bobMember.amountOwed, 1000);
        assertFalse(bobMember.hasPaid);
    }

    // ============ Remainder Distribution Tests ============

    function testEqualSplitWithRemainder() public {
        vm.prank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = charlie;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        // 2000 / 3 members = 666 with remainder 2
        uint256 expenseId = groupManager.createExpenseEqualSplit(groupId, 2000, "Split", "Misc");
        
        DataTypes.Member memory aliceMember = groupManager.getExpenseMember(expenseId, alice);
        DataTypes.Member memory bobMember = groupManager.getExpenseMember(expenseId, bob);
        DataTypes.Member memory charlieMember = groupManager.getExpenseMember(expenseId, charlie);
        
        // First two members get +1 from remainder
        uint256 total = aliceMember.amountOwed + bobMember.amountOwed + charlieMember.amountOwed;
        assertEq(total, 2000);
    }

    // ============ Group Getter Tests ============

    function testGetGroupMembers() public {
        vm.prank(alice);
        address[] memory members = new address[](2);
        members[0] = bob;
        members[1] = charlie;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        GroupManager.GroupData memory group = groupManager.getGroup(groupId);
        
        assertEq(group.members.length, 3); // alice, bob, charlie
    }

    function testGetUserGroups() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId1 = groupManager.createGroup("Group 1", members);
        
        vm.prank(alice);
        uint256 groupId2 = groupManager.createGroup("Group 2", members);
        
        uint256[] memory userGroups = groupManager.getUserGroups(alice);
        assertEq(userGroups.length, 2);
    }

    function testGetGroupExpenses() public {
        vm.prank(alice);
        address[] memory members = new address[](1);
        members[0] = bob;
        uint256 groupId = groupManager.createGroup("Test Group", members);
        
        vm.prank(alice);
        uint256 expenseId1 = groupManager.createExpenseEqualSplit(groupId, 1000, "Exp1", "Food");
        
        vm.prank(alice);
        uint256 expenseId2 = groupManager.createExpenseEqualSplit(groupId, 2000, "Exp2", "Food");
        
        uint256[] memory expenses = groupManager.getGroupExpenses(groupId);
        assertEq(expenses.length, 2);
    }
}
