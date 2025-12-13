// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DataTypes.sol";

/// @title SplitCalculator
/// @notice Library for calculating expense splits
library SplitCalculator {
    
    uint256 constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    
    /// @notice Calculate equal split among members
    /// @param totalAmount Total expense amount
    /// @param memberCount Number of members to split among
    /// @return amountPerMember Amount each member owes
    function calculateEqualSplit(
        uint256 totalAmount,
        uint256 memberCount
    ) internal pure returns (uint256 amountPerMember) {
        if (memberCount == 0) revert DataTypes.InvalidAmount();
        amountPerMember = totalAmount / memberCount;
    }
    
    /// @notice Calculate split with remainder distribution
    /// @dev Distributes remainder to first N members
    /// @param totalAmount Total expense amount
    /// @param memberCount Number of members
    /// @return baseAmount Base amount per member
    /// @return remainder Remainder to distribute
    function calculateEqualSplitWithRemainder(
        uint256 totalAmount,
        uint256 memberCount
    ) internal pure returns (uint256 baseAmount, uint256 remainder) {
        if (memberCount == 0) revert DataTypes.InvalidAmount();
        baseAmount = totalAmount / memberCount;
        remainder = totalAmount % memberCount;
    }
    
    /// @notice Validate custom split allocations
    /// @param allocations Array of custom allocations
    /// @param totalAmount Total expense amount
    /// @return isValid True if allocations sum to total
    function validateCustomSplit(
        DataTypes.SplitAllocation[] memory allocations,
        uint256 totalAmount
    ) internal pure returns (bool isValid) {
        uint256 sum = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            sum += allocations[i].amount;
        }
        isValid = (sum == totalAmount);
    }
    
    /// @notice Validate percentage-based split allocations
    /// @param allocations Array of percentage allocations
    /// @return isValid True if percentages sum to 100%
    function validatePercentageSplit(
        DataTypes.SplitAllocation[] memory allocations
    ) internal pure returns (bool isValid) {
        uint256 sum = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            sum += allocations[i].percentage;
        }
        isValid = (sum == BASIS_POINTS);
    }
    
    /// @notice Calculate amount from percentage
    /// @param totalAmount Total expense amount
    /// @param percentage Percentage in basis points (10000 = 100%)
    /// @return amount Calculated amount
    function calculatePercentageAmount(
        uint256 totalAmount,
        uint256 percentage
    ) internal pure returns (uint256 amount) {
        if (percentage > BASIS_POINTS) revert DataTypes.InvalidAmount();
        amount = (totalAmount * percentage) / BASIS_POINTS;
    }
    
    /// @notice Calculate amounts for all members based on percentage split
    /// @param totalAmount Total expense amount
    /// @param allocations Array of percentage allocations
    /// @return amounts Array of calculated amounts
    function calculatePercentageSplitAmounts(
        uint256 totalAmount,
        DataTypes.SplitAllocation[] memory allocations
    ) internal pure returns (uint256[] memory amounts) {
        amounts = new uint256[](allocations.length);
        uint256 totalCalculated = 0;
        
        // Calculate all amounts except last
        for (uint256 i = 0; i < allocations.length - 1; i++) {
            amounts[i] = calculatePercentageAmount(totalAmount, allocations[i].percentage);
            totalCalculated += amounts[i];
        }
        
        // Last member gets remainder to avoid rounding issues
        amounts[allocations.length - 1] = totalAmount - totalCalculated;
    }
    
    /// @notice Check if member has fully paid their share
    /// @param amountOwed Amount member owes
    /// @param amountPaid Amount member has paid
    /// @return isPaid True if fully paid
    function isFullyPaid(
        uint256 amountOwed,
        uint256 amountPaid
    ) internal pure returns (bool isPaid) {
        isPaid = (amountPaid >= amountOwed);
    }
    
    /// @notice Calculate remaining amount to be paid
    /// @param amountOwed Amount member owes
    /// @param amountPaid Amount member has paid
    /// @return remaining Remaining amount
    function calculateRemaining(
        uint256 amountOwed,
        uint256 amountPaid
    ) internal pure returns (uint256 remaining) {
        if (amountPaid >= amountOwed) {
            remaining = 0;
        } else {
            remaining = amountOwed - amountPaid;
        }
    }
}