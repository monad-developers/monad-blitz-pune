// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./libraries/DataTypes.sol";

/// @title ContactBook
/// @notice On-chain contact management for Crack Pay users
/// @dev Each user maintains their own contact list
contract ContactBook {
    
    // User address => Contact address => Contact details
    mapping(address => mapping(address => DataTypes.Contact)) private userContacts;
    
    // User address => Array of contact addresses (for iteration)
    mapping(address => address[]) private userContactList;
    
    // User address => Contact address => Index in array
    mapping(address => mapping(address => uint256)) private contactIndex;
    
    /// @notice Add a new contact
    /// @param contactAddress Wallet address of contact
    /// @param displayName Display name for contact
    /// @param avatarURI URI for contact avatar (IPFS or data URI)
    function addContact(
        address contactAddress,
        string calldata displayName,
        string calldata avatarURI
    ) external {
        if (contactAddress == address(0)) revert DataTypes.InvalidAddress();
        if (contactAddress == msg.sender) revert DataTypes.InvalidAddress();
        if (userContacts[msg.sender][contactAddress].exists) {
            revert DataTypes.AlreadyExists();
        }
        
        // Create contact
        userContacts[msg.sender][contactAddress] = DataTypes.Contact({
            walletAddress: contactAddress,
            displayName: displayName,
            avatarURI: avatarURI,
            createdAt: block.timestamp,
            exists: true
        });
        
        // Add to contact list
        contactIndex[msg.sender][contactAddress] = userContactList[msg.sender].length;
        userContactList[msg.sender].push(contactAddress);
        
        emit DataTypes.ContactAdded(msg.sender, contactAddress, displayName);
    }
    
    /// @notice Update existing contact
    /// @param contactAddress Wallet address of contact
    /// @param displayName New display name
    /// @param avatarURI New avatar URI
    function updateContact(
        address contactAddress,
        string calldata displayName,
        string calldata avatarURI
    ) external {
        if (!userContacts[msg.sender][contactAddress].exists) {
            revert DataTypes.ContactNotFound();
        }
        
        userContacts[msg.sender][contactAddress].displayName = displayName;
        userContacts[msg.sender][contactAddress].avatarURI = avatarURI;
        
        emit DataTypes.ContactUpdated(msg.sender, contactAddress, displayName);
    }
    
    /// @notice Remove a contact
    /// @param contactAddress Wallet address of contact to remove
    function removeContact(address contactAddress) external {
        if (!userContacts[msg.sender][contactAddress].exists) {
            revert DataTypes.ContactNotFound();
        }
        
        // Get index of contact to remove
        uint256 indexToRemove = contactIndex[msg.sender][contactAddress];
        uint256 lastIndex = userContactList[msg.sender].length - 1;
        
        // If not last element, swap with last
        if (indexToRemove != lastIndex) {
            address lastContact = userContactList[msg.sender][lastIndex];
            userContactList[msg.sender][indexToRemove] = lastContact;
            contactIndex[msg.sender][lastContact] = indexToRemove;
        }
        
        // Remove last element
        userContactList[msg.sender].pop();
        
        // Delete contact data
        delete contactIndex[msg.sender][contactAddress];
        delete userContacts[msg.sender][contactAddress];
        
        emit DataTypes.ContactRemoved(msg.sender, contactAddress);
    }
    
    /// @notice Get contact details
    /// @param user User who owns the contact book
    /// @param contactAddress Contact to retrieve
    /// @return contact Contact details
    function getContact(
        address user,
        address contactAddress
    ) external view returns (DataTypes.Contact memory contact) {
        contact = userContacts[user][contactAddress];
        if (!contact.exists) revert DataTypes.ContactNotFound();
    }
    
    /// @notice Get all contacts for a user
    /// @param user User address
    /// @return contacts Array of contact addresses
    function getUserContacts(address user) external view returns (address[] memory contacts) {
        contacts = userContactList[user];
    }
    
    /// @notice Get contact count for user
    /// @param user User address
    /// @return count Number of contacts
    function getContactCount(address user) external view returns (uint256 count) {
        count = userContactList[user].length;
    }
    
    /// @notice Check if address is in user's contacts
    /// @param user User address
    /// @param contactAddress Address to check
    /// @return True if address is a contact
    function isContact(address user, address contactAddress) external view returns (bool) {
        return userContacts[user][contactAddress].exists;
    }
    
    /// @notice Batch add contacts
    /// @param contactAddresses Array of contact addresses
    /// @param displayNames Array of display names
    /// @param avatarURIs Array of avatar URIs
    function batchAddContacts(
        address[] calldata contactAddresses,
        string[] calldata displayNames,
        string[] calldata avatarURIs
    ) external {
        if (contactAddresses.length != displayNames.length || 
            contactAddresses.length != avatarURIs.length) {
            revert DataTypes.InvalidAmount();
        }
        
        for (uint256 i = 0; i < contactAddresses.length; i++) {
            if (contactAddresses[i] == address(0) || 
                contactAddresses[i] == msg.sender ||
                userContacts[msg.sender][contactAddresses[i]].exists) {
                continue; // Skip invalid or existing contacts
            }
            
            userContacts[msg.sender][contactAddresses[i]] = DataTypes.Contact({
                walletAddress: contactAddresses[i],
                displayName: displayNames[i],
                avatarURI: avatarURIs[i],
                createdAt: block.timestamp,
                exists: true
            });
            
            contactIndex[msg.sender][contactAddresses[i]] = userContactList[msg.sender].length;
            userContactList[msg.sender].push(contactAddresses[i]);
            
            emit DataTypes.ContactAdded(msg.sender, contactAddresses[i], displayNames[i]);
        }
    }
}